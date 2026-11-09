import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SOLVER_DEBOUNCE_MS } from '../../core/workers/solver-client';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { DrawingStore } from '../editor/drawing-store';
import { Preview } from './preview';

const HEART = [
  '..##..##..',
  '.########.',
  '##########',
  '##########',
  '##########',
  '.########.',
  '..######..',
  '...####...',
  '....##....',
  '..........',
];

describe('Preview', () => {
  let fixture: ComponentFixture<Preview>;
  let el: HTMLElement;
  let store: DrawingStore;

  const badges = () => el.querySelector('.badges')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const flush = () => {
    TestBed.tick();
    vi.advanceTimersByTime(SOLVER_DEBOUNCE_MS);
    fixture.detectChanges();
  };
  const paint = (rows: string[]) => {
    store.clear();
    store.resize(rows.length, rows[0].length);
    rows.forEach((row, r) => [...row].forEach((c, col) => c === '#' && store.setCell(r, col, 1)));
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await TestBed.configureTestingModule({
      imports: [Preview, ...i18nTestingImports],
      providers: i18nTestingProviders,
    }).compileComponents();
    store = TestBed.inject(DrawingStore);
    fixture = TestBed.createComponent(Preview);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows a neutral "calculating" badge while the first analysis is pending', () => {
    expect(badges()).toBe('Calculando…');
    expect(el.querySelector('.badge-possible, .badge-impossible, .badge-difficulty')).toBeNull();
  });

  it('shows "Puzzle posible" with a difficulty badge for a solvable drawing', () => {
    paint(HEART);
    flush();
    expect(el.querySelector('.badge-possible')?.textContent).toContain('Puzzle posible');
    expect(el.querySelector('.badge-possible app-icon')).not.toBeNull();
    expect(el.querySelector('.badge-difficulty')?.textContent).toMatch(/(Fácil|Medio|Difícil) · Beta/);
    expect(el.querySelector('.badge-impossible')).toBeNull();
  });

  it('shows "Puzzle imposible" and hides the difficulty for an unsolvable drawing', () => {
    paint(['#.', '.#']);
    flush();
    expect(el.querySelector('.badge-impossible')?.textContent).toContain('Puzzle imposible');
    expect(el.querySelector('.badge-difficulty')).toBeNull();
    expect(el.querySelector('.badge-possible')).toBeNull();
  });

  it('the cross icon of the impossible badge comes after the text', () => {
    paint(['#.', '.#']);
    flush();
    const badge = el.querySelector('.badge-impossible')!;
    expect(badge.lastElementChild?.tagName.toLowerCase()).toBe('app-icon');
    expect(badge.firstChild?.nodeType).toBe(Node.TEXT_NODE); // texto primero, icono a la derecha
  });

  it('an empty drawing shows a neutral hint and no difficulty', () => {
    store.clear();
    flush();
    expect(badges()).toBe('Dibuja algo');
    expect(el.querySelector('.badge-difficulty')).toBeNull();
  });

  it('corrections turn the badge from impossible to possible', () => {
    paint(['#.', '.#']);
    flush();
    expect(el.querySelector('.badge-impossible')).not.toBeNull();
    store.setCell(0, 1, 1);
    flush();
    expect(el.querySelector('.badge-possible')).not.toBeNull();
  });

  it('keeps the previous badge while recomputing (no flicker) and the badge region is live', () => {
    paint(HEART);
    flush();
    store.invert();
    TestBed.tick();
    fixture.detectChanges();
    expect(el.querySelector('.badge-possible')).not.toBeNull();
    expect(el.querySelector('.badges')?.getAttribute('aria-live')).toBe('polite');
  });

  it('labels the canvas with the board size and resizes it with the board', () => {
    const canvas = el.querySelector('canvas')!;
    expect(canvas.getAttribute('aria-label')).toContain('10 × 10');
    expect(canvas.width).toBeGreaterThan(0);
    store.resize(5, 8);
    fixture.detectChanges();
    expect(canvas.getAttribute('aria-label')).toContain('5 × 8');
  });
});
