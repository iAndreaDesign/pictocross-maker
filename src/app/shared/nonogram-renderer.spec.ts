import { Clues, SolverCell } from '../core/domain';
import { RenderColors, RenderOptions, computeLayout, renderNonogram } from './nonogram-renderer';

const COLORS: RenderColors = {
  background: 'BG',
  filled: 'FILLED',
  cross: 'CROSS',
  unknown: 'RED',
  band: 'BAND',
  line: 'LINE',
  lineThin: 'THIN',
  lineThinFilled: 'THIN_FILLED',
  clueLine: 'CLUE',
  clueLineBand: 'CLUE_BAND',
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
  const strokeWidths: number[] = [];
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
      strokeWidths.push(this.lineWidth);
    },
    save: noop,
    restore: noop,
    translate: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills, texts, strokes, strokeWidths };
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

  describe('lines (Figma reference)', () => {
    const wide: Clues = { rows: [[0], [0]], cols: Array.from({ length: 6 }, () => [0]) };
    const wideCells = (): SolverCell[][] => [Array<SolverCell>(6).fill(W), Array<SolverCell>(6).fill(W)];
    const drawWide = () => {
      const rec = fakeCtx();
      renderNonogram(rec.ctx, { clues: wide, cells: wideCells() }, OPTS);
      return rec;
    };

    it('black lines are only the thick ones: the board border and every 5 cells, both axes', () => {
      const black = drawWide().fills.filter((f) => f.style === 'LINE');
      const vertical = black.filter((f) => f.h > f.w);
      const horizontal = black.filter((f) => f.w > f.h);
      // columnas 0, 5 y 6 (borde); filas 0 y 2 (borde) de un tablero de 2 filas
      expect(vertical).toHaveLength(3);
      expect(horizontal).toHaveLength(2);
      expect(black.every((f) => Math.min(f.w, f.h) === OPTS.thick)).toBe(true);
    });

    it('thick lines run through the clue areas (from the very top and the very left)', () => {
      const black = drawWide().fills.filter((f) => f.style === 'LINE');
      expect(black.filter((f) => f.h > f.w).every((f) => f.y <= 0)).toBe(true);
      expect(black.filter((f) => f.w > f.h).every((f) => f.x <= 0)).toBe(true);
    });

    it('thin lines between grid cells are light grey, 1 px wide, never the black colour', () => {
      const thin = drawWide().fills.filter((f) => f.style === 'THIN');
      // 5 separadores verticales × 2 filas + 1 horizontal × 6 columnas
      expect(thin).toHaveLength(5 * 2 + 6);
      expect(thin.every((f) => Math.min(f.w, f.h) === OPTS.thin)).toBe(true);
    });

    it('lines between two painted cells are almost white; next to a white cell they stay light grey', () => {
      const rec = fakeCtx();
      renderNonogram(rec.ctx, { clues: CLUES, cells: [[B, B, W], [W, W, W]] }, OPTS);
      const onFilled = rec.fills.filter((f) => f.style === 'THIN_FILLED');
      expect(onFilled).toHaveLength(1); // solo entre las dos casillas pintadas de la fila 0
      expect(rec.fills.filter((f) => f.style === 'THIN').length).toBeGreaterThan(0);
    });

    it('separators inside the clue areas are light (never black) and lighter than their band', () => {
      const { fills } = drawWide();
      const clue = fills.filter((f) => f.style === 'CLUE' || f.style === 'CLUE_BAND');
      expect(clue.length).toBeGreaterThan(0);
      expect(clue.every((f) => Math.min(f.w, f.h) === OPTS.thin)).toBe(true);
      expect(fills.some((f) => f.style === 'CLUE_BAND')).toBe(false); // pistas de 1 celda: sin separadores internos de banda
    });

    it('uses the banded separator colour for stacked clue cells inside a band', () => {
      const rec = fakeCtx();
      const stacked: Clues = { rows: [[1, 1, 1]], cols: [[1, 1], [1], [1]] };
      renderNonogram(rec.ctx, { clues: stacked, cells: [[B, W, B]] }, OPTS);
      expect(rec.fills.some((f) => f.style === 'CLUE_BAND')).toBe(true);
    });

    it('draws the black grid lines last so they sit on top of every thin line', () => {
      const { fills } = drawWide();
      const lastThin = Math.max(...fills.map((f, i) => (['THIN', 'THIN_FILLED', 'CLUE', 'CLUE_BAND'].includes(f.style) ? i : -1)));
      const firstBlack = fills.findIndex((f) => f.style === 'LINE');
      expect(firstBlack).toBeGreaterThan(lastThin);
    });
  });

  it('crosses are thin: about 4 % of the cell, and never thinner than a thin line', () => {
    const big = { ...OPTS, cellSize: 100 };
    const rec = fakeCtx();
    renderNonogram(rec.ctx, { clues: CLUES, cells: [[W, W, W], [W, W, W]] }, big);
    expect(rec.strokeWidths.every((w) => w === 4)).toBe(true);
    const small = fakeCtx();
    renderNonogram(small.ctx, { clues: CLUES, cells: [[W, W, W], [W, W, W]] }, { ...OPTS, cellSize: 10 });
    expect(small.strokeWidths.every((w) => w === OPTS.thin)).toBe(true);
  });

  it('only uses the colors it is given (no hardcoded palette)', () => {
    const { fills } = draw([[B, W, B], [W, B, W]]);
    const allowed = new Set(Object.values(COLORS));
    expect(fills.every((f) => allowed.has(f.style))).toBe(true);
  });

  it('renders a blank board when cells is null: no fills, crosses or red, but grid and clues', () => {
    const rec = fakeCtx();
    renderNonogram(rec.ctx, { clues: CLUES, cells: null }, OPTS);
    expect(rec.fills.some((f) => f.style === 'FILLED' || f.style === 'RED')).toBe(false);
    expect(rec.strokes).toHaveLength(0);
    expect(rec.fills.some((f) => f.style === 'LINE')).toBe(true);
    expect(rec.texts).toHaveLength(6);
  });

  it('adds a margin around the board when asked (PNG export) and never less than the line needs', () => {
    const plain = computeLayout(CLUES, 20, 2);
    const withMargin = computeLayout(CLUES, 20, 2, 12);
    expect(withMargin.pad).toBe(12);
    expect(withMargin.width).toBe(plain.width - plain.pad * 2 + 24);
    expect(computeLayout(CLUES, 20, 4, 1).pad).toBe(2);
  });
});
