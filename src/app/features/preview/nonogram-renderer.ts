import { Clues, SolverCell } from '../../core/domain';

/** Colores resueltos (los toma de los tokens CSS; el renderer no hardcodea ninguno). */
export interface RenderColors {
  readonly background: string;
  readonly filled: string;
  readonly cross: string;
  readonly unknown: string;
  readonly band: string;
  readonly line: string;
  readonly text: string;
}

export interface RenderOptions {
  /** Lado de una casilla en píxeles del canvas. */
  readonly cellSize: number;
  /** Grosor de línea fina y de línea gruesa (cada 5 casillas), en píxeles del canvas. */
  readonly thin: number;
  readonly thick: number;
  readonly fontFamily: string;
  readonly colors: RenderColors;
}

export interface RenderModel {
  readonly clues: Clues;
  /** Estado a pintar por casilla: negra = rellena, blanca = cruz, desconocida = rojo. */
  readonly cells: readonly (readonly SolverCell[])[];
}

export interface Layout {
  readonly rows: number;
  readonly cols: number;
  /** Nº de casillas de pista a la izquierda (filas) y arriba (columnas). */
  readonly rowClueCells: number;
  readonly colClueCells: number;
  readonly cellSize: number;
  /** Margen para que las líneas gruesas del borde no se recorten. */
  readonly pad: number;
  /** Origen de la cuadrícula (sin contar `pad`). */
  readonly gridX: number;
  readonly gridY: number;
  readonly width: number;
  readonly height: number;
}

const maxLen = (clues: Clues['rows']) => Math.max(1, ...clues.map((c) => c.length));

export function computeLayout(clues: Clues, cellSize: number, thick: number): Layout {
  const rows = clues.rows.length;
  const cols = clues.cols.length;
  const rowClueCells = maxLen(clues.rows);
  const colClueCells = maxLen(clues.cols);
  const pad = Math.ceil(thick / 2);
  const gridX = rowClueCells * cellSize;
  const gridY = colClueCells * cellSize;
  return {
    rows,
    cols,
    rowClueCells,
    colClueCells,
    cellSize,
    pad,
    gridX,
    gridY,
    width: gridX + cols * cellSize + pad * 2,
    height: gridY + rows * cellSize + pad * 2,
  };
}

/** Lee los tokens de marca del elemento dado (CSS custom properties). */
export function readRenderColors(element: Element): RenderColors & { fontFamily: string } {
  const css = getComputedStyle(element);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    background: v('--color-preview-bg'),
    filled: v('--color-cell-filled'),
    cross: v('--color-cross'),
    unknown: v('--color-impossible-bg'),
    band: v('--color-clue-band'),
    line: v('--color-grid-line'),
    text: v('--color-text'),
    fontFamily: v('--font-ui'),
  };
}

/**
 * Dibuja el nonograma completo (pistas + cuadrícula + solución). Único render de la app:
 * lo usan la preview y las exportaciones (S07), que solo cambian `cellSize` y los grosores.
 */
export function renderNonogram(ctx: CanvasRenderingContext2D, model: RenderModel, opts: RenderOptions): Layout {
  const { colors, cellSize: cs, thin, thick } = opts;
  const layout = computeLayout(model.clues, cs, thick);
  const { rows, cols, rowClueCells, colClueCells, gridX, gridY, pad } = layout;
  const innerWidth = layout.width - pad * 2;
  const innerHeight = layout.height - pad * 2;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.save();
  ctx.translate(pad, pad);

  // Bandas alternas en las pistas (una sí, una no, empezando por la primera). La esquina queda en blanco.
  ctx.fillStyle = colors.band;
  for (let c = 0; c < cols; c += 2) ctx.fillRect(gridX + c * cs, 0, cs, gridY);
  for (let r = 0; r < rows; r += 2) ctx.fillRect(0, gridY + r * cs, gridX, cs);

  // Solución: negras = terracota, blancas = cruz, desconocidas = rojo.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gridX + c * cs;
      const y = gridY + r * cs;
      switch (model.cells[r][c]) {
        case SolverCell.Black:
          ctx.fillStyle = colors.filled;
          ctx.fillRect(x, y, cs, cs);
          break;
        case SolverCell.Unknown:
          ctx.fillStyle = colors.unknown;
          ctx.fillRect(x, y, cs, cs);
          break;
        case SolverCell.White:
          drawCross(ctx, x, y, cs, colors.cross, Math.max(thin, cs / 12));
          break;
      }
    }
  }

  // Líneas negras al 80 %: las de la cuadrícula atraviesan también las pistas.
  ctx.fillStyle = colors.line;
  const lineWidth = (index: number, count: number) =>
    index % 5 === 0 || index === count ? thick : thin;
  for (let c = 0; c <= cols; c++) {
    const w = lineWidth(c, cols);
    ctx.fillRect(gridX + c * cs - w / 2, -thick / 2, w, innerHeight + thick);
  }
  for (let r = 0; r <= rows; r++) {
    const h = lineWidth(r, rows);
    ctx.fillRect(-thick / 2, gridY + r * cs - h / 2, innerWidth + thick, h);
  }
  // Separadores entre casillas de pista (solo dentro de las zonas de pistas).
  for (let k = 0; k < colClueCells; k++) ctx.fillRect(gridX, k * cs - thin / 2, innerWidth - gridX, thin);
  for (let k = 0; k < rowClueCells; k++) ctx.fillRect(k * cs - thin / 2, gridY, thin, innerHeight - gridY);

  // Números: filas alineadas a la derecha, columnas alineadas abajo.
  ctx.fillStyle = colors.text;
  ctx.font = `600 ${Math.max(6, Math.round(cs * 0.5))}px ${opts.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  model.clues.rows.forEach((clue, r) => {
    clue.forEach((n, i) => {
      const slot = rowClueCells - clue.length + i;
      ctx.fillText(String(n), slot * cs + cs / 2, gridY + r * cs + cs / 2);
    });
  });
  model.clues.cols.forEach((clue, c) => {
    clue.forEach((n, i) => {
      const slot = colClueCells - clue.length + i;
      ctx.fillText(String(n), gridX + c * cs + cs / 2, slot * cs + cs / 2);
    });
  });

  ctx.restore();
  return layout;
}

function drawCross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth: number,
): void {
  const inset = size * 0.3;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + inset, y + inset);
  ctx.lineTo(x + size - inset, y + size - inset);
  ctx.moveTo(x + size - inset, y + inset);
  ctx.lineTo(x + inset, y + size - inset);
  ctx.stroke();
}
