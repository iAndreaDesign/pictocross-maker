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
import { Grid } from '../../../core/domain';
import { DrawingStore } from '../drawing-store';
import { cellFromPoint, rulerLabels, strokeModeFor } from '../grid-geometry';

/** Casilla máxima en pantalla (px CSS). */
const MAX_CELL_CSS_PX = 45;
/** Ancho de la columna de reglas + hueco (debe coincidir con drawing-grid.css). */
const RULER_AND_GAP_CSS_PX = 28;
/** Lado de casilla de referencia cuando no se puede medir el contenedor (tests). */
const FALLBACK_CELL_CSS_PX = 24;

/**
 * Cuadrícula de dibujo en <canvas> (50x50 = 2.500 casillas sin coste de DOM), dibujada a
 * resolución de dispositivo para que las líneas del Figma (finas y gruesas cada 5) sean nítidas.
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
  private readonly frameRef = viewChild<ElementRef<HTMLElement>>('frame');

  private readonly frameWidth = signal(0);
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
    effect((onCleanup) => {
      const frame = this.frameRef()?.nativeElement;
      if (!frame || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.frameWidth.set(entry.contentRect.width));
      observer.observe(frame);
      onCleanup(() => observer.disconnect());
    });

    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      if (canvas) this.draw(canvas, this.store.grid(), this.cursorCell(), this.focused(), this.frameWidth());
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    const mode = strokeModeFor(this.store.tool(), event.button);
    if (!mode) return;
    event.preventDefault();
    try {
      (event.currentTarget as HTMLCanvasElement).setPointerCapture?.(event.pointerId);
    } catch {
      // El puntero ya no está activo: el trazo sigue funcionando sin captura.
    }
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
    frameWidth: number,
  ): void {
    const rows = grid.length;
    const cols = grid[0].length;

    // Casilla en píxeles de dispositivo (entera, para líneas nítidas), sin pasar de 45 px CSS.
    const dpr = window.devicePixelRatio || 1;
    const cssWidth =
      frameWidth > 0 ? Math.max(frameWidth - RULER_AND_GAP_CSS_PX, cols) : cols * FALLBACK_CELL_CSS_PX;
    const cell = Math.max(1, Math.floor(Math.min(cssWidth / cols, MAX_CELL_CSS_PX) * dpr));
    const width = cell * cols;
    const height = cell * rows;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width / dpr}px`;
    canvas.style.height = `${height / dpr}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const css = getComputedStyle(canvas);
    const color = (name: string) => css.getPropertyValue(name).trim();

    // Figma 4:728: líneas finas de 0,5 px (≥ 1 px de dispositivo) y reglas de 2 px cada 5 casillas y en el borde.
    const thin = Math.max(1, Math.round(dpr / 2));
    const major = Math.max(2, Math.round(2 * dpr));

    ctx.fillStyle = color('--color-input');
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = color('--color-cell-filled');
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1) ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }

    // Líneas finas: tenues entre casillas vacías, terracota claro junto a una pintada.
    const lineEmpty = color('--color-cell-line');
    const lineFilled = color('--color-cell-filled-line');
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c < cols - 1) {
          ctx.fillStyle = grid[r][c] === 1 || grid[r][c + 1] === 1 ? lineFilled : lineEmpty;
          ctx.fillRect((c + 1) * cell - Math.floor(thin / 2), r * cell, thin, cell);
        }
        if (r < rows - 1) {
          ctx.fillStyle = grid[r][c] === 1 || grid[r + 1][c] === 1 ? lineFilled : lineEmpty;
          ctx.fillRect(c * cell, (r + 1) * cell - Math.floor(thin / 2), cell, thin);
        }
      }
    }

    // Reglas gruesas cada 5 casillas y marco exterior (pegadas al borde para no recortarse).
    ctx.fillStyle = color('--color-grid-rule');
    const ruleStart = (index: number, size: number) => Math.min(Math.max(index * cell - major / 2, 0), size - major);
    for (let c = 0; c <= cols; c++) {
      if (c % 5 === 0 || c === cols) ctx.fillRect(ruleStart(c, width), 0, major, height);
    }
    for (let r = 0; r <= rows; r++) {
      if (r % 5 === 0 || r === rows) ctx.fillRect(0, ruleStart(r, height), width, major);
    }

    if (focused) {
      const inset = Math.max(2, Math.round(dpr * 2));
      ctx.strokeStyle = color('--color-accent');
      ctx.lineWidth = inset;
      ctx.strokeRect(cursor[1] * cell + inset, cursor[0] * cell + inset, cell - inset * 2, cell - inset * 2);
    }
  }
}
