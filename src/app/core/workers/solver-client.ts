import { Injectable, InjectionToken, Signal, computed, effect, inject, signal, untracked } from '@angular/core';
import { AnalysisResult, Grid, analyzeGrid } from '../domain';
import { SolverRequest, SolverResponse } from './solver-messages';

export const SOLVER_DEBOUNCE_MS = 150;

/** Crea el Web Worker del solucionador; `null` si el entorno no tiene `Worker` (tests/SSR). */
export const SOLVER_WORKER_FACTORY = new InjectionToken<() => Worker | null>('SOLVER_WORKER_FACTORY', {
  providedIn: 'root',
  factory: () => () =>
    typeof Worker === 'undefined'
      ? null
      : new Worker(new URL('./solver.worker', import.meta.url), { type: 'module' }),
});

export type AnalysisState = 'pending' | 'ready';

/**
 * Analiza el dibujo fuera del hilo principal. Recalcula con debounce tras cada cambio y
 * descarta respuestas obsoletas (id de petición). Sin Worker, usa el mismo análisis en síncrono.
 */
@Injectable({ providedIn: 'root' })
export class SolverClient {
  private worker: Worker | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastId = 0;
  private tracking = false;

  private readonly state = signal<AnalysisState>('pending');
  private readonly latest = signal<AnalysisResult | null>(null);

  /** `pending` mientras hay un cambio sin analizar; `ready` cuando `result` está al día. */
  readonly analysis = this.state.asReadonly();
  /** Último resultado recibido (puede ser de un dibujo anterior mientras `analysis` es `pending`). */
  readonly result = this.latest.asReadonly();
  readonly status = computed(() => this.latest()?.status ?? null);
  readonly difficulty = computed(() => this.latest()?.difficulty ?? null);
  readonly unknownCells = computed(() => this.latest()?.unknownCells ?? []);

  constructor() {
    this.worker = inject(SOLVER_WORKER_FACTORY)();
    if (this.worker) {
      this.worker.onmessage = ({ data }: MessageEvent<SolverResponse>) => this.receive(data);
      this.worker.onerror = (event) => console.error('Error en el worker del solucionador', event.message);
    }
  }

  /**
   * El análisis sigue a la señal del dibujo: cualquier cambio (trazo, clear, invert, undo, resize)
   * lo reprograma. Se llama una sola vez, en contexto de inyección.
   */
  track(grid: Signal<Grid>): void {
    if (this.tracking) return;
    this.tracking = true;
    effect(() => {
      const current = grid();
      untracked(() => this.schedule(current));
    });
  }

  private schedule(grid: Grid): void {
    this.state.set('pending');
    if (this.timer !== null) clearTimeout(this.timer);
    const id = ++this.lastId; // invalida cualquier petición en vuelo
    this.timer = setTimeout(() => {
      this.timer = null;
      this.run(id, grid);
    }, SOLVER_DEBOUNCE_MS);
  }

  private run(id: number, grid: Grid): void {
    if (this.worker) {
      const request: SolverRequest = { id, grid };
      this.worker.postMessage(request);
      return;
    }
    try {
      this.receive({ id, result: analyzeGrid(grid) });
    } catch (error) {
      this.receive({ id, error: error instanceof Error ? error.message : String(error) });
    }
  }

  private receive(response: SolverResponse): void {
    if (response.id !== this.lastId) return; // respuesta obsoleta
    if ('error' in response) {
      console.error('Error al analizar el dibujo:', response.error);
      return;
    }
    this.latest.set(response.result);
    this.state.set('ready');
  }
}
