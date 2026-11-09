import { Clues, SolverCell } from '../core/domain';
import { RenderColors, RenderOptions, computeLayout, renderNonogram } from './nonogram-renderer';

const COLORS: RenderColors = {
  background: 'BG',
  filled: 'FILLED',
  cross: 'CROSS',
  unknown: 'RED',
  band: 'BAND',
  line: 'LINE',
  text: 'TEXT',
};

const OPTS: RenderOptions = { cellSize: 20, thin: 1, thick: 2, fontFamily: 'Inter', colors: COLORS };

interface Fill {
  style: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const noop = (): void => undefined;

/** Contexto 2D falso que registra rellenos, textos y trazos. */
function fakeCtx() {
  const fills: Fill[] = [];
  const texts: { text: string; x: number; y: number }[] = [];
  const strokes: string[] = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ style: this.fillStyle, x, y, w, h });
    },
    fillText(text: string, x: number, y: number) {
      texts.push({ text, x, y });
    },
    stroke() {
      strokes.push(this.strokeStyle);
    },
    save: noop,
    restore: noop,
    translate: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills, texts, strokes };
}

const B = SolverCell.Black;
const W = SolverCell.White;
const U = SolverCell.Unknown;

// Cuadrícula 2x3:  # . #
//                  . # .
const CLUES: Clues = { rows: [[1, 1], [1]], cols: [[1], [1], [1]] };

describe('computeLayout', () => {
  it('reserves clue space by the longest row/column clue', () => {
    const l = computeLayout(CLUES, 20, 2);
    expect(l.rowClueCells).toBe(2);
    expect(l.colClueCells).toBe(1);
    expect(l.gridX).toBe(40);
    expect(l.gridY).toBe(20);
    expect(l.pad).toBe(1);
    expect(l.width).toBe(40 + 3 * 20 + 2);
    expect(l.height).toBe(20 + 2 * 20 + 2);
  });

  it('keeps at least one clue cell per side (empty lines have clue [0])', () => {
    const l = computeLayout({ rows: [[0]], cols: [[0]] }, 10, 2);
    expect(l.rowClueCells).toBe(1);
    expect(l.colClueCells).toBe(1);
  });
});

describe('renderNonogram', () => {
  const draw = (cells: SolverCell[][]) => {
    const rec = fakeCtx();
    const layout = renderNonogram(rec.ctx, { clues: CLUES, cells }, OPTS);
    return { ...rec, layout };
  };

  it('paints black cells in the brand terracotta at the right place', () => {
    const { fills, layout } = draw([[B, W, B], [W, B, W]]);
    const filled = fills.filter((f) => f.style === 'FILLED');
    expect(filled).toHaveLength(3);
    expect(filled[0]).toMatchObject({ x: layout.gridX, y: layout.gridY, w: 20, h: 20 });
  });

  it('draws crosses on solved white cells only', () => {
    const { strokes } = draw([[B, W, B], [W, B, W]]);
    expect(strokes).toEqual(['CROSS', 'CROSS', 'CROSS']);
  });

  it('paints undecided cells red with neither fill nor cross', () => {
    const { fills, strokes } = draw([[U, U, B], [U, U, W]]);
    expect(fills.filter((f) => f.style === 'RED')).toHaveLength(4);
    expect(fills.filter((f) => f.style === 'FILLED')).toHaveLength(1);
    expect(strokes).toHaveLength(1);
  });

  it('alternates clue bands starting with the first (columns and rows), corner left blank', () => {
    const { fills, layout } = draw([[B, W, B], [W, B, W]]);
    const bands = fills.filter((f) => f.style === 'BAND');
    // columnas 0 y 2; fila 0
    expect(bands).toHaveLength(3);
    expect(bands.map((b) => [b.x, b.y])).toEqual([
      [layout.gridX, 0],
      [layout.gridX + 2 * 20, 0],
      [0, layout.gridY],
    ]);
    expect(bands.every((b) => !(b.x < layout.gridX && b.y < layout.gridY))).toBe(true);
  });

  it('writes every clue number: rows right-aligned, columns bottom-aligned', () => {
    const { texts, layout } = draw([[B, W, B], [W, B, W]]);
    expect(texts.map((t) => t.text).sort()).toEqual(['1', '1', '1', '1', '1', '1']);
    // fila 1 tiene una sola pista [1]: va en la última casilla de pista (a la derecha)
    const rowOne = texts.find((t) => t.y === layout.gridY + 20 + 10 && t.x < layout.gridX);
    expect(rowOne?.x).toBe(1 * 20 + 10);
  });

  it('uses thick lines every 5 cells and on the border, thin otherwise', () => {
    const rec = fakeCtx();
    const wide: Clues = {
      rows: [[0]],
      cols: Array.from({ length: 6 }, () => [0]),
    };
    renderNonogram(rec.ctx, { clues: wide, cells: [Array(6).fill(W)] }, OPTS);
    const verticals = rec.fills.filter((f) => f.style === 'LINE' && f.h > f.w && f.w <= 2);
    const widths = verticals.slice(0, 7).map((f) => f.w);
    // c = 0..6 → 0 grueso, 1-4 finas, 5 gruesa, 6 (borde) gruesa
    expect(widths).toEqual([2, 1, 1, 1, 1, 2, 2]);
  });

  it('only uses the colors it is given (no hardcoded palette)', () => {
    const { fills } = draw([[B, W, B], [W, B, W]]);
    const allowed = new Set(Object.values(COLORS));
    expect(fills.every((f) => allowed.has(f.style))).toBe(true);
  });
});
