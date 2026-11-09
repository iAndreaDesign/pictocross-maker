import { Clues } from '../../../core/domain';

export type Orientation = 'portrait' | 'landscape';

export const A4_MM = { width: 210, height: 297 } as const;
export const MARGIN_MM = 5;
/** Lado máximo de casilla (también de las casillas de pistas). */
export const MAX_CELL_MM = 7;
/** Por debajo de esto se avisa al usuario (sigue pudiendo exportar). */
export const MIN_READABLE_CELL_MM = 3;
/** Grosor físico de las líneas de cuadrícula: finas y gruesas (cada 5). */
export const THIN_LINE_MM = 0.15;
export const THICK_LINE_MM = 0.35;

export interface ExportLayout {
  readonly orientation: Orientation;
  readonly pageWidthMm: number;
  readonly pageHeightMm: number;
  /** Lado de casilla, en mm. */
  readonly cellMm: number;
  readonly rowClueCells: number;
  readonly colClueCells: number;
  /** Tablero con pistas (sin contar el grosor de línea), en mm. */
  readonly boardWidthMm: number;
  readonly boardHeightMm: number;
  /** Esquina superior izquierda del tablero en la página, en mm (centrado en el área útil). */
  readonly xMm: number;
  readonly yMm: number;
  readonly tooSmall: boolean;
}

const maxLen = (lists: Clues['rows']) => Math.max(1, ...lists.map((c) => c.length));

/** Dimensiones de página y área útil (A4 con márgenes de 5 mm) según la orientación. */
export function pageFor(orientation: Orientation) {
  const portrait = orientation === 'portrait';
  const width = portrait ? A4_MM.width : A4_MM.height;
  const height = portrait ? A4_MM.height : A4_MM.width;
  return { width, height, usableWidth: width - MARGIN_MM * 2, usableHeight: height - MARGIN_MM * 2 };
}

/**
 * Tamaño físico del tablero exportado: casilla cuadrada `c = min(7 mm, ancho/unidades, alto/unidades)`
 * y tablero centrado en el área útil. Las líneas gruesas (centradas en el borde) también caben en ella.
 * Pura y sin navegador.
 */
export function computeExportLayout(clues: Clues, orientation: Orientation): ExportLayout {
  const rows = clues.rows.length;
  const cols = clues.cols.length;
  const rowClueCells = maxLen(clues.rows);
  const colClueCells = maxLen(clues.cols);
  const unitsX = rowClueCells + cols;
  const unitsY = colClueCells + rows;

  const page = pageFor(orientation);
  const cellMm = Math.min(
    MAX_CELL_MM,
    (page.usableWidth - THICK_LINE_MM) / unitsX,
    (page.usableHeight - THICK_LINE_MM) / unitsY,
  );
  const boardWidthMm = unitsX * cellMm;
  const boardHeightMm = unitsY * cellMm;

  return {
    orientation,
    pageWidthMm: page.width,
    pageHeightMm: page.height,
    cellMm,
    rowClueCells,
    colClueCells,
    boardWidthMm,
    boardHeightMm,
    xMm: MARGIN_MM + (page.usableWidth - boardWidthMm) / 2,
    yMm: MARGIN_MM + (page.usableHeight - boardHeightMm) / 2,
    tooSmall: cellMm < MIN_READABLE_CELL_MM,
  };
}

/** La otra orientación, si da una casilla mayor que la actual (solo se sugiere, nunca se aplica sola). */
export function betterOrientation(clues: Clues, current: Orientation): ExportLayout | null {
  const other: Orientation = current === 'portrait' ? 'landscape' : 'portrait';
  const alternative = computeExportLayout(clues, other);
  return alternative.cellMm > computeExportLayout(clues, current).cellMm + 1e-9 ? alternative : null;
}

export const mmToPx = (mm: number, dpi: number): number => (mm * dpi) / 25.4;

/** Textos del nombre de fichero (vienen de i18n: `export.file.*`). */
export interface FileNameLabels {
  readonly base: string;
  readonly solution: string;
}

/** Nombre de fichero: título del proyecto si lo hay (S05); si no, `{base}-{filas}x{cols}`. */
export function exportFileName(
  title: string | null,
  rows: number,
  cols: number,
  kind: 'blank' | 'solution',
  extension: 'png' | 'pdf',
  labels: FileNameLabels,
): string {
  const slug = (title ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = slug !== '' ? slug : `${labels.base}-${rows}x${cols}`;
  return `${base}${kind === 'solution' ? `-${labels.solution}` : ''}.${extension}`;
}
