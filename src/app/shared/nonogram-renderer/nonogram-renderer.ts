import { Clues, SolverCell } from '../../core/domain';

/** Colores resueltos (los toma de los tokens CSS; el renderer no hardcodea ninguno). */
export interface RenderColors {
  readonly background: string;
  readonly filled: string;
  readonly cross: string;
  readonly unknown: string;
  readonly band: string;
  /** Líneas gruesas (borde y cada 5 casillas): negras. */
  readonly line: string;
  /** Líneas finas entre casillas de la cuadrícula: gris claro, y casi blanco junto a casillas pintadas. */
  readonly lineThin: string;
  readonly lineThinFilled: string;
  /** Separadores dentro de las zonas de pistas: sobre blanco y sobre una banda. */
  readonly clueLine: string;
  readonly clueLineBand: string;
  readonly text: string;
}

/** Grosor del trazo de las cruces respecto al lado de la casilla (Figma: ≈1,4 px en casillas de 36 px). */
export const CROSS_WIDTH_RATIO = 0.04;

export interface RenderOptions {
  /** Lado de una casilla en píxeles del canvas. */
  readonly cellSize: number;
  /** Grosor de línea fina y de línea gruesa (cada 5 casillas), en píxeles del canvas. */
  readonly thin: number;
  readonly thick: number;
  readonly fontFamily: string;
  readonly colors: RenderColors;
  /** Margen blanco alrededor (px del canvas), p. ej. los 5 mm del PNG. Por defecto, solo lo que piden las líneas. */
  readonly margin?: number;
}

export interface RenderModel {
  readonly clues: Clues;
  /**
   * Estado a pintar por casilla: negra = rellena, blanca = cruz, desconocida = rojo.
   * `null` = tablero en blanco (solo cuadrícula y pistas), como en las exportaciones sin solución.
   */
  readonly cells: readonly (readonly SolverCell[])[] | null;
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

export function computeLayout(clues: Clues, cellSize: number, thick: number, margin = 0): Layout {
  const rows = clues.rows.length;
  const cols = clues.cols.length;
  const rowClueCells = maxLen(clues.rows);
  const colClueCells = maxLen(clues.cols);
  const pad = Math.max(Math.ceil(thick / 2), Math.ceil(margin));
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
    lineThin: v('--color-preview-line'),
    lineThinFilled: v('--color-preview-line-filled'),
    clueLine: v('--color-clue-line'),
    clueLineBand: v('--color-clue-line-band'),
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
  const layout = computeLayout(model.clues, cs, thick, opts.margin);
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

  // Solución: negras = terracota, blancas = cruz, desconocidas = rojo. Sin `cells`, tablero en blanco.
  const cells = model.cells;
  for (let r = 0; cells && r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gridX + c * cs;
      const y = gridY + r * cs;
      switch (cells[r][c]) {
        case SolverCell.Black:
          ctx.fillStyle = colors.filled;
          ctx.fillRect(x, y, cs, cs);
          break;
        case SolverCell.Unknown:
          ctx.fillStyle = colors.unknown;
          ctx.fillRect(x, y, cs, cs);
          break;
        case SolverCell.White:
          drawCross(ctx, x, y, cs, colors.cross, Math.max(thin, cs * CROSS_WIDTH_RATIO));
          break;
      }
    }
  }

  // Líneas finas de la cuadrícula (Figma): claras; casi blancas entre casillas pintadas.
  const filled = (r: number, c: number) => cells?.[r][c] === SolverCell.Black;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c < cols - 1) {
        ctx.fillStyle = filled(r, c) && filled(r, c + 1) ? colors.lineThinFilled : colors.lineThin;
        ctx.fillRect(Math.round(gridX + (c + 1) * cs - thin / 2), gridY + r * cs, thin, cs);
      }
      if (r < rows - 1) {
        ctx.fillStyle = filled(r, c) && filled(r + 1, c) ? colors.lineThinFilled : colors.lineThin;
        ctx.fillRect(gridX + c * cs, Math.round(gridY + (r + 1) * cs - thin / 2), cs, thin);
      }
    }
  }

  // Separadores finos dentro de las zonas de pistas: más claros que la banda (o grises junto a blanco).
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = r % 2 === 0 ? colors.clueLineBand : colors.clueLine;
    for (let k = 1; k < rowClueCells; k++) ctx.fillRect(Math.round(k * cs - thin / 2), gridY + r * cs, thin, cs);
  }
  ctx.fillStyle = colors.clueLine;
  for (let r = 1; r < rows; r++) ctx.fillRect(0, Math.round(gridY + r * cs - thin / 2), gridX, thin);
  for (let c = 0; c < cols; c++) {
    ctx.fillStyle = c % 2 === 0 ? colors.clueLineBand : colors.clueLine;
    for (let k = 1; k < colClueCells; k++) ctx.fillRect(gridX + c * cs, Math.round(k * cs - thin / 2), cs, thin);
  }
  ctx.fillStyle = colors.clueLine;
  for (let c = 1; c < cols; c++) ctx.fillRect(Math.round(gridX + c * cs - thin / 2), 0, thin, gridY);

  // Líneas gruesas negras: solo el borde del tablero y cada 5 casillas; atraviesan también las pistas.
  ctx.fillStyle = colors.line;
  for (let c = 0; c <= cols; c++) {
    if (c % 5 === 0 || c === cols) ctx.fillRect(Math.round(gridX + c * cs - thick / 2), -thick / 2, thick, innerHeight + thick);
  }
  for (let r = 0; r <= rows; r++) {
    if (r % 5 === 0 || r === rows) ctx.fillRect(-thick / 2, Math.round(gridY + r * cs - thick / 2), innerWidth + thick, thick);
  }

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
