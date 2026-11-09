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
import { SolverCell, generateClues } from '../../../core/domain';
import { SolverClient } from '../../../core/workers/solver-client';
import { Icon } from '../../../shared/icon';
import { DrawingStore } from '../../editor/drawing-store';
import { ExportService } from '../../export/export.service';
import { MIN_READABLE_CELL_MM } from '../../export/export-layout';
import { computeLayout, readRenderColors, renderNonogram } from '../../../shared/nonogram-renderer';

/** Ancho de referencia cuando no se puede medir el contenedor (tests). */
const FALLBACK_WIDTH_PX = 600;
/** Misma cota que el editor: las casillas no pasan de 45 px en pantalla. */
const MAX_CELL_CSS_PX = 45;

type Badge = 'empty' | 'calculating' | 'possible' | 'impossible';

/** Panel derecho: nonograma en blanco con pistas y solución, validación y dificultad en tiempo real. */
@Component({
  selector: 'app-preview',
  imports: [TranslocoPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preview.html',
  styleUrl: './preview.css',
})
export class Preview {
  protected readonly store = inject(DrawingStore);
  private readonly solver = inject(SolverClient);
  protected readonly exporter = inject(ExportService);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly frameRef = viewChild<ElementRef<HTMLElement>>('frame');
  private readonly frameWidth = signal(0);
  private readonly fontsVersion = signal(0);

  /** Pistas al instante (barato); el solucionador va aparte, en el worker. */
  protected readonly clues = computed(() => generateClues(this.store.grid()));

  /** Último análisis, solo si corresponde al tamaño actual del tablero. */
  private readonly result = computed(() => {
    const r = this.solver.result();
    return r && r.rows === this.store.rows() && r.cols === this.store.cols() ? r : null;
  });

  private readonly isEmpty = computed(() => this.store.blackCount() === 0);

  protected readonly badge = computed<Badge>(() => {
    if (this.isEmpty()) return 'empty';
    const status = this.result()?.status;
    if (!status) return 'calculating';
    return status === 'ideal' ? 'possible' : 'impossible';
  });

  protected readonly difficultyLevel = computed(() => {
    const result = this.result();
    return !this.isEmpty() && result?.status === 'ideal' ? (result.difficulty?.level ?? null) : null;
  });

  /** Aviso de casilla pequeña al imprimir (no impide exportar) y, si ayuda, la otra orientación. */
  protected readonly smallCell = computed(() => {
    const layout = this.exporter.layout();
    if (!layout.tooSmall) return null;
    const other = this.exporter.suggestion();
    return {
      mm: layout.cellMm.toFixed(1),
      min: MIN_READABLE_CELL_MM,
      suggestion: other ? { orientation: other.orientation, mm: other.cellMm.toFixed(1) } : null,
    };
  });

  /** Solución a pintar: el dibujo, con las casillas indecidibles marcadas como desconocidas. */
  private readonly cells = computed<SolverCell[][]>(() => {
    const cells = this.store
      .grid()
      .map((row) => row.map((c): SolverCell => (c === 1 ? SolverCell.Black : SolverCell.White)));
    const result = this.result();
    if (result?.status === 'unsolvable' && !this.isEmpty()) {
      for (const [r, c] of result.unknownCells) cells[r][c] = SolverCell.Unknown;
    }
    return cells;
  });

  constructor() {
    this.solver.track(this.store.grid);
    void document.fonts?.ready.then(() => this.fontsVersion.update((v) => v + 1));

    effect((onCleanup) => {
      const frame = this.frameRef()?.nativeElement;
      if (!frame || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => this.frameWidth.set(entry.contentRect.width));
      observer.observe(frame);
      onCleanup(() => observer.disconnect());
    });

    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      if (canvas) this.draw(canvas);
    });
  }

  protected get rows(): number {
    return this.store.rows();
  }

  protected get cols(): number {
    return this.store.cols();
  }

  private draw(canvas: HTMLCanvasElement): void {
    const clues = this.clues();
    const cells = this.cells();
    this.fontsVersion();

    // Píxeles de dispositivo: líneas finas de 1 px (gruesas 2 px) siempre visibles, también a 50x50.
    const dpr = window.devicePixelRatio || 1;
    const thin = Math.max(1, Math.round(dpr));
    const thick = thin * 2;
    const available = (this.frameWidth() || FALLBACK_WIDTH_PX) * dpr - thick;
    const { rowClueCells, cols } = computeLayout(clues, 1, thick);
    const cellSize = Math.max(4, Math.min(Math.floor(available / (rowClueCells + cols)), MAX_CELL_CSS_PX * dpr));

    const layout = computeLayout(clues, cellSize, thick);
    canvas.width = layout.width;
    canvas.height = layout.height;
    canvas.style.width = `${layout.width / dpr}px`;
    canvas.style.height = `${layout.height / dpr}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { fontFamily, ...colors } = readRenderColors(canvas);
    renderNonogram(ctx, { clues, cells }, { cellSize, thin, thick, fontFamily, colors });
  }
}
