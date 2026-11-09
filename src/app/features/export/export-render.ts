import { Clues, SolverCell } from '../../core/domain';
import {
  Layout,
  RenderColors,
  computeLayout,
  renderNonogram,
} from '../../shared/nonogram-renderer';
import { ExportLayout, THICK_LINE_MM, THIN_LINE_MM, mmToPx } from './export-layout';

export const EXPORT_DPI = 300;

export interface ExportRenderInput {
  readonly clues: Clues;
  /** `null` = tablero en blanco; con celdas, la solución (sin casillas desconocidas en rojo). */
  readonly cells: readonly (readonly SolverCell[])[] | null;
  readonly layout: ExportLayout;
  readonly colors: RenderColors;
  readonly fontFamily: string;
  readonly dpi?: number;
  /** Margen blanco alrededor del tablero, en mm (5 en el PNG; 0 en el PDF, que ya tiene la página). */
  readonly marginMm: number;
}

export interface ExportRender {
  /** Tamaño del canvas y de la casilla, en píxeles. */
  readonly layout: Layout;
  /** Milímetros que mide un píxel del canvas si la casilla ha de medir `layout.cellMm`. */
  readonly mmPerPx: number;
}

/** Píxeles de una casilla y grosores de línea, en px del canvas, a partir de las medidas físicas. */
export function exportPixelMetrics(layout: ExportLayout, dpi: number) {
  const cellPx = Math.max(1, Math.round(mmToPx(layout.cellMm, dpi)));
  const thin = Math.max(1, Math.round(mmToPx(THIN_LINE_MM, dpi)));
  const thick = Math.max(thin + 1, Math.round(mmToPx(THICK_LINE_MM, dpi)));
  return { cellPx, thin, thick };
}

/**
 * Dibuja la exportación en `canvas` con el MISMO renderer que la preview (`renderNonogram`);
 * solo cambian la escala (300 dpi), el modo (en blanco / solución) y el margen.
 */
export function renderExport(canvas: HTMLCanvasElement, input: ExportRenderInput): ExportRender {
  const dpi = input.dpi ?? EXPORT_DPI;
  const { cellPx, thin, thick } = exportPixelMetrics(input.layout, dpi);
  const margin = mmToPx(input.marginMm, dpi);
  const layout = computeLayout(input.clues, cellPx, thick, margin);
  canvas.width = layout.width;
  canvas.height = layout.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D del canvas');
  renderNonogram(
    ctx,
    { clues: input.clues, cells: input.cells },
    { cellSize: cellPx, thin, thick, margin, fontFamily: input.fontFamily, colors: input.colors },
  );
  return { layout, mmPerPx: input.layout.cellMm / cellPx };
}
