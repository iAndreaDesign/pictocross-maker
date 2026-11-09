import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalysisResult, Cell, Grid } from '../domain';
import { SOLVER_DEBOUNCE_MS, SOLVER_WORKER_FACTORY, SolverClient } from './solver-client';
import { SolverRequest, SolverResponse } from './solver-messages';

const parse = (rows: string[]): Grid => rows.map((r) => [...r].map((c): Cell => (c === '#' ? 1 : 0)));
const DIAGONAL = parse(['#.', '.#']);
const SOLID = parse(['##', '##']);

describe('SolverClient (synchronous fallback, no Worker)', () => {
  let grid: ReturnType<typeof signal<Grid>>;
  let client: SolverClient;

  beforeEach(() => {
    vi.useFakeTimers();
    grid = signal<Grid>(SOLID);
    client = TestBed.inject(SolverClient);
    TestBed.runInInjectionContext(() => client.track(grid));
    TestBed.tick();
  });

  afterEach(() => vi.useRealTimers());

  it('starts pending with no result, then becomes ready after the debounce', () => {
    expect(client.analysis()).toBe('pending');
    expect(client.status()).toBeNull();
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS - 1);
    expect(client.analysis()).toBe('pending');
    vi.advanceTimersByTime(1);
    expect(client.analysis()).toBe('ready');
    expect(client.status()).toBe('ideal');
    expect(client.difficulty()).not.toBeNull();
    expect(client.unknownCells()).toEqual([]);
  });

  it('exposes unknown cells and no difficulty for an unsolvable drawing', () => {
    grid.set(DIAGONAL);
    TestBed.tick();
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    expect(client.status()).toBe('unsolvable');
    expect(client.difficulty()).toBeNull();
    expect(client.unknownCells()).toHaveLength(4);
  });

  it('debounces bursts of changes into a single analysis of the latest drawing', () => {
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    grid.set(DIAGONAL);
    TestBed.tick();
    vi.advanceTimersByTime(100);
    expect(client.analysis()).toBe('pending');
    grid.set(SOLID);
    TestBed.tick();
    vi.advanceTimersByTime(100);
    expect(client.analysis()).toBe('pending'); // el temporizador se reinició
    vi.advanceTimersByTime(50);
    expect(client.status()).toBe('ideal');
  });

  it('keeps the previous result while pending (no flicker)', () => {
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    grid.set(DIAGONAL);
    TestBed.tick();
    expect(client.analysis()).toBe('pending');
    expect(client.status()).toBe('ideal');
  });

  it('track() is idempotent', () => {
    const other = signal<Grid>(DIAGONAL);
    TestBed.runInInjectionContext(() => client.track(other));
    other.set(SOLID);
    TestBed.tick();
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    expect(client.result()?.rows).toBe(2);
    expect(client.status()).toBe('ideal'); // sigue el primer grid, no `other`
  });
});

describe('SolverClient (Web Worker, stale responses)', () => {
  class FakeWorker {
    onmessage: ((e: MessageEvent<SolverResponse>) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    readonly requests: SolverRequest[] = [];
    postMessage(request: SolverRequest) {
      this.requests.push(request);
    }
    reply(response: SolverResponse) {
      this.onmessage?.({ data: response } as MessageEvent<SolverResponse>);
    }
  }

  const result = (status: 'ideal' | 'unsolvable'): AnalysisResult => ({
    rows: 2,
    cols: 2,
    status,
    unknownCells: status === 'ideal' ? [] : [[0, 0]],
    difficulty: null,
  });

  let worker: FakeWorker;
  let grid: ReturnType<typeof signal<Grid>>;
  let client: SolverClient;

  beforeEach(() => {
    vi.useFakeTimers();
    worker = new FakeWorker();
    TestBed.configureTestingModule({
      providers: [{ provide: SOLVER_WORKER_FACTORY, useValue: () => worker as unknown as Worker }],
    });
    grid = signal<Grid>(SOLID);
    client = TestBed.inject(SolverClient);
    TestBed.runInInjectionContext(() => client.track(grid));
    TestBed.tick();
  });

  afterEach(() => vi.useRealTimers());

  it('posts the grid to the worker after the debounce, with a request id', () => {
    expect(worker.requests).toHaveLength(0);
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    expect(worker.requests).toHaveLength(1);
    expect(worker.requests[0].grid).toEqual(SOLID);
    expect(client.analysis()).toBe('pending'); // hasta que responda el worker
  });

  it('applies the response that matches the latest request', () => {
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    worker.reply({ id: worker.requests[0].id, result: result('ideal') });
    expect(client.analysis()).toBe('ready');
    expect(client.status()).toBe('ideal');
  });

  it('an old response never overrides a more recent one', () => {
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    const first = worker.requests[0].id;
    grid.set(DIAGONAL);
    TestBed.tick();
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    const second = worker.requests[1].id;
    expect(second).toBeGreaterThan(first);

    worker.reply({ id: second, result: result('unsolvable') });
    worker.reply({ id: first, result: result('ideal') }); // llega tarde
    expect(client.status()).toBe('unsolvable');
  });

  it('ignores a response received while a newer change is still debouncing', () => {
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    const first = worker.requests[0].id;
    grid.set(DIAGONAL);
    TestBed.tick();
    worker.reply({ id: first, result: result('ideal') });
    expect(client.analysis()).toBe('pending');
    expect(client.status()).toBeNull();
  });

  it('logs worker errors without breaking state', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    worker.reply({ id: worker.requests[0].id, error: 'boom' });
    expect(spy).toHaveBeenCalled();
    expect(client.analysis()).toBe('pending');
    spy.mockRestore();
  });
});
