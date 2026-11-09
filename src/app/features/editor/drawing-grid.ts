import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Grid } from '../../core/domain';
import { DrawingStore } from './drawing-store';
import { cellFromPoint, rulerLabels, strokeModeFor } from './grid-geometry';

/** Resolución interna por casilla; el canvas se escala por CSS al ancho disponible. */
const CELL_PX = 24;

/**
 * Cuadrícula de dibujo en <canvas> (50x50 = 2.500 casillas sin coste de DOM).
 * Puntero con captura + interpolación Bresenham; teclado con flechas y espacio/enter.
 */
@Component({
  selector: 'app-drawing-grid',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawing-grid.html',
  styleUrl: './drawing-grid.css',
})
export class DrawingGrid {
  protected readonly store = inject(DrawingStore);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private readonly cursor = signal<readonly [number, number]>([0, 0]);
  protected readonly focused = signal(false);

  protected readonly colLabels = computed(() => rulerLabels(this.store.cols()));
  protected readonly rowLabels = computed(() => rulerLabels(this.store.rows()));

  /** Cursor acotado al tamaño actual (el tablero puede encogerse). */
  protected readonly cursorCell = computed<readonly [number, number]>(() => {
    const [r, c] = this.cursor();
    return [Math.min(r, this.store.rows() - 1), Math.min(c, this.store.cols() - 1)];
  });
  protected readonly cursorRow = computed(() => this.cursorCell()[0] + 1);
  protected readonly cursorCol = computed(() => this.cursorCell()[1] + 1);
  protected readonly cursorFilled = computed(() => {
    const [r, c] = this.cursorCell();
    return this.store.grid()[r][c] === 1;
  });

  constructor() {
    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      if (canvas) this.draw(canvas, this.store.grid(), this.cursorCell(), this.focused());
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    const mode = strokeModeFor(this.store.tool(), event.button);
    if (!mode) return;
    event.preventDefault();
    (event.currentTarget as HTMLCanvasElement).setPointerCapture?.(event.pointerId);
    this.store.beginStroke(mode);
    this.paintAt(event);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.store.strokeActive) this.paintAt(event);
  }

  protected onPointerEnd(): void {
    this.store.endStroke();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const [r, c] = this.cursorCell();
    const moves: Record<string, readonly [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      this.cursor.set([
        Math.min(Math.max(r + move[0], 0), this.store.rows() - 1),
        Math.min(Math.max(c + move[1], 0), this.store.cols() - 1),
      ]);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.store.setCell(r, c, this.store.grid()[r][c] === 1 ? 0 : 1);
    }
  }

  private paintAt(event: PointerEvent): void {
    const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const [r, c] = cellFromPoint(event.clientX, event.clientY, rect, this.store.rows(), this.store.cols());
    this.cursor.set([r, c]);
    this.store.paintStroke(r, c);
  }

  private draw(
    canvas: HTMLCanvasElement,
    grid: Grid,
    cursor: readonly [number, number],
    focused: boolean,
  ): void {
    const rows = grid.length;
    const cols = grid[0].length;
    const width = cols * CELL_PX;
    const height = rows * CELL_PX;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const css = getComputedStyle(canvas);
    const color = (name: string) => css.getPropertyValue(name).trim();

    ctx.fillStyle = color('--color-preview-bg');
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = color('--color-cell-filled');
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1) ctx.fillRect(c * CELL_PX, r * CELL_PX, CELL_PX, CELL_PX);
      }
    }

    // Líneas finas y, cada 5 casillas, líneas gruesas (misma convención que la preview).
    for (const [lineColor, lineWidth, every] of [
      [color('--color-border'), 1, 1],
      [color('--color-divider'), 2, 5],
    ] as const) {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        if (c % every !== 0 && c !== cols) continue;
        ctx.moveTo(c * CELL_PX, 0);
        ctx.lineTo(c * CELL_PX, height);
      }
      for (let r = 0; r <= rows; r++) {
        if (r % every !== 0 && r !== rows) continue;
        ctx.moveTo(0, r * CELL_PX);
        ctx.lineTo(width, r * CELL_PX);
      }
      ctx.stroke();
    }

    if (focused) {
      ctx.strokeStyle = color('--color-accent');
      ctx.lineWidth = 4;
      ctx.strokeRect(cursor[1] * CELL_PX + 2, cursor[0] * CELL_PX + 2, CELL_PX - 4, CELL_PX - 4);
    }
  }
}
