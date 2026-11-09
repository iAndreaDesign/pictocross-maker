import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SOLVER_DEBOUNCE_MS } from '../../core/workers/solver-client';
import { i18nTestingImports, i18nTestingProviders } from '../../shared/i18n/i18n-testing';
import { DrawingStore } from '../editor/drawing-store';
import { ExportService } from '../export/export.service';
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

  describe('export', () => {
    it('has an "Exportar solución" button wired to the export service', () => {
      const service = TestBed.inject(ExportService);
      const spy = vi.spyOn(service, 'exportSolution').mockResolvedValue();
      const button = [...el.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent?.trim() === 'Exportar solución',
      )!;
      expect(button.disabled).toBe(false);
      button.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('keeps the export button available when the puzzle is not solvable', () => {
      paint(['#.', '.#']);
      flush();
      const button = [...el.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent?.trim() === 'Exportar solución',
      )!;
      expect(button.disabled).toBe(false);
    });

    it('does not warn about the printed cell size for the default 10x10 board', () => {
      expect(el.querySelector('.note')).toBeNull();
    });

    it('warns (without blocking) when the printed cell would be too small', () => {
      store.clear();
      store.resize(50, 50);
      for (let r = 0; r < 50; r++) for (let c = 0; c < 50; c++) if ((r + c) % 2 === 0) store.setCell(r, c, 1);
      fixture.detectChanges();
      const note = el.querySelector('.note')!;
      expect(note.getAttribute('role')).toBe('status');
      expect(note.textContent).toMatch(/2[.,]7 mm/);
      expect(note.textContent).toContain('3 mm');
    });

    it('suggests landscape for a wide board, without changing the orientation', () => {
      store.clear();
      store.resize(5, 50);
      for (let c = 0; c < 50; c += 2) store.setCell(0, c, 1);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 50; c += 2) store.setCell(r, c, 1);
      fixture.detectChanges();
      const service = TestBed.inject(ExportService);
      if (el.querySelector('.note')) {
        expect(el.querySelector('.note')?.textContent).toContain('En horizontal');
      }
      expect(service.orientation()).toBe('portrait');
    });

    it('shows an alert when the last export failed', () => {
      TestBed.inject(ExportService).failed.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.note-error')?.getAttribute('role')).toBe('alert');
    });
  });
});
