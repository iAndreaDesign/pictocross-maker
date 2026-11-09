import { Injectable, computed, signal } from '@angular/core';
import {
  Cell,
  DEFAULT_LOGO_GRID,
  Grid,
  assertDimensions,
  clearGrid,
  countBlack,
  invertGrid,
  linePoints,
  lostBlackCells,
  resizeGrid,
} from '../../../core/domain';

export type Tool = 'draw' | 'erase';
export type StrokeMode = 'paint' | 'erase';

export const HISTORY_LIMIT = 100;

interface Stroke {
  readonly mode: StrokeMode;
  readonly startGrid: Grid;
  last: readonly [number, number] | null;
}

/** Estado único del dibujo (signals). El resto de la app deriva de aquí. */
@Injectable({ providedIn: 'root' })
export class DrawingStore {
  private readonly gridState = signal<Grid>(DEFAULT_LOGO_GRID);
  private readonly undoStack = signal<readonly Grid[]>([]);
  private readonly redoStack = signal<readonly Grid[]>([]);
  private stroke: Stroke | null = null;

  readonly grid = computed(() => this.gridState());
  readonly rows = computed(() => this.gridState().length);
  readonly cols = computed(() => this.gridState()[0].length);
  readonly totalCells = computed(() => this.rows() * this.cols());
  readonly blackCount = computed(() => countBlack(this.gridState()));

  readonly tool = signal<Tool>('draw');
  /** `null` = título por defecto (traducido en la UI). */
  readonly title = signal<string | null>(null);

  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  setTool(tool: Tool): void {
    this.tool.set(tool);
  }

  setTitle(title: string | null): void {
    const trimmed = title?.trim() ?? '';
    this.title.set(trimmed === '' ? null : trimmed);
  }

  /** Cambia una casilla como entrada de historial propia (uso por teclado). */
  setCell(row: number, col: number, value: Cell): void {
    this.commit(this.withCells(this.gridState(), [[row, col]], value));
  }

  beginStroke(mode: StrokeMode): void {
    this.stroke = { mode, startGrid: this.gridState(), last: null };
  }

  get strokeActive(): boolean {
    return this.stroke !== null;
  }

  /** Aplica el trazo hasta (row, col), interpolando desde el punto anterior. */
  paintStroke(row: number, col: number): void {
    const stroke = this.stroke;
    if (!stroke) return;
    const points = stroke.last ? linePoints(stroke.last, [row, col]) : [[row, col] as const];
    stroke.last = [row, col];
    this.gridState.set(this.withCells(this.gridState(), points, stroke.mode === 'paint' ? 1 : 0));
  }

  /** Cierra el trazo: todo el trazo es una sola entrada de historial. */
  endStroke(): void {
    const stroke = this.stroke;
    this.stroke = null;
    if (stroke && stroke.startGrid !== this.gridState()) {
      this.pushUndo(stroke.startGrid);
      this.redoStack.set([]);
    }
  }

  clear(): void {
    this.commit(clearGrid(this.gridState()));
  }

  invert(): void {
    this.commit(invertGrid(this.gridState()));
  }

  /** Casillas negras que se perderían al redimensionar (para pedir confirmación). */
  lostOnResize(rows: number, cols: number): number {
    return lostBlackCells(this.gridState(), rows, cols);
  }

  resize(rows: number, cols: number): void {
    if (rows === this.rows() && cols === this.cols()) return;
    this.commit(resizeGrid(this.gridState(), rows, cols));
  }

  /** Sustituye el dibujo (p. ej. al restaurar el borrador guardado) y vacía el historial. */
  load(grid: Grid, title: string | null): void {
    assertDimensions(grid.length, grid[0]?.length ?? 0);
    this.stroke = null;
    this.gridState.set(grid);
    this.undoStack.set([]);
    this.redoStack.set([]);
    this.title.set(title);
  }

  /** Vuelve al dibujo por defecto y vacía el historial. */
  reset(): void {
    this.stroke = null;
    this.gridState.set(DEFAULT_LOGO_GRID);
    this.undoStack.set([]);
    this.redoStack.set([]);
    this.tool.set('draw');
    this.title.set(null);
  }

  undo(): void {
    const stack = this.undoStack();
    if (this.stroke || stack.length === 0) return;
    this.redoStack.update((r) => [...r, this.gridState()]);
    this.gridState.set(stack[stack.length - 1]);
    this.undoStack.set(stack.slice(0, -1));
  }

  redo(): void {
    const stack = this.redoStack();
    if (this.stroke || stack.length === 0) return;
    this.pushUndo(this.gridState());
    this.gridState.set(stack[stack.length - 1]);
    this.redoStack.set(stack.slice(0, -1));
  }

  private commit(next: Grid): void {
    if (next === this.gridState()) return;
    this.pushUndo(this.gridState());
    this.redoStack.set([]);
    this.gridState.set(next);
  }

  private pushUndo(grid: Grid): void {
    this.undoStack.update((s) => [...(s.length >= HISTORY_LIMIT ? s.slice(1) : s), grid]);
  }

  /** Copia solo las filas que cambian; devuelve el mismo grid si nada cambia. */
  private withCells(grid: Grid, points: readonly (readonly [number, number])[], value: Cell): Grid {
    let next: Cell[][] | null = null;
    for (const [r, c] of points) {
      if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) continue;
      if ((next ? next[r] : grid[r])[c] === value) continue;
      next ??= [...grid] as Cell[][];
      if (next[r] === grid[r]) next[r] = [...grid[r]];
      next[r][c] = value;
    }
    return next ?? grid;
  }
}
