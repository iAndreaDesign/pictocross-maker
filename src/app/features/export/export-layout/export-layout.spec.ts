import { Cell, DEFAULT_LOGO_GRID, Grid, generateClues } from '../../../core/domain';
import {
  A4_MM,
  MARGIN_MM,
  MAX_CELL_MM,
  MIN_READABLE_CELL_MM,
  THICK_LINE_MM,
  betterOrientation,
  computeExportLayout,
  exportFileName,
  mmToPx,
  pageFor,
} from './export-layout';

const blank = (rows: number, cols: number): Grid => Array.from({ length: rows }, () => Array<Cell>(cols).fill(0));
/** Tablero 1/0 alternado: el peor caso de pistas (25 números por línea en 50x50). */
const stripes = (rows: number, cols: number): Grid =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c): Cell => ((r + c) % 2 === 0 ? 1 : 0)));

/** El tablero (con el grosor de línea gruesa) cabe en el área útil: ningún trazo fuera de los márgenes. */
function expectInsideUsableArea(grid: Grid, orientation: 'portrait' | 'landscape') {
  const l = computeExportLayout(generateClues(grid), orientation);
  const half = THICK_LINE_MM / 2;
  expect(l.xMm - half).toBeGreaterThanOrEqual(MARGIN_MM - 1e-9);
  expect(l.yMm - half).toBeGreaterThanOrEqual(MARGIN_MM - 1e-9);
  expect(l.xMm + l.boardWidthMm + half).toBeLessThanOrEqual(l.pageWidthMm - MARGIN_MM + 1e-9);
  expect(l.yMm + l.boardHeightMm + half).toBeLessThanOrEqual(l.pageHeightMm - MARGIN_MM + 1e-9);
  return l;
}

describe('pageFor', () => {
  it('gives A4 with 5 mm margins: 200x287 portrait, 287x200 landscape', () => {
    expect(pageFor('portrait')).toMatchObject({ usableWidth: 200, usableHeight: 287 });
    expect(pageFor('landscape')).toMatchObject({ usableWidth: 287, usableHeight: 200 });
    expect(A4_MM).toEqual({ width: 210, height: 297 });
  });
});

describe('computeExportLayout', () => {
  it('uses exactly 7 mm cells for 5x5 and 10x10 (the logo fits comfortably)', () => {
    expect(computeExportLayout(generateClues(blank(5, 5)), 'portrait').cellMm).toBe(MAX_CELL_MM);
    const logo = computeExportLayout(generateClues(DEFAULT_LOGO_GRID), 'portrait');
    expect(logo.cellMm).toBe(MAX_CELL_MM);
    expect(logo.tooSmall).toBe(false);
    expect(logo.boardWidthMm).toBeLessThan(200);
  });

  it('centres the board in the usable area', () => {
    const l = computeExportLayout(generateClues(blank(5, 5)), 'portrait');
    expect(l.xMm - MARGIN_MM).toBeCloseTo(210 - MARGIN_MM - (l.xMm + l.boardWidthMm), 9);
    expect(l.yMm - MARGIN_MM).toBeCloseTo(297 - MARGIN_MM - (l.yMm + l.boardHeightMm), 9);
  });

  it('shrinks cells to fit medium boards (15x15, 30x30) inside the margins', () => {
    for (const n of [15, 30]) {
      const l = expectInsideUsableArea(stripes(n, n), 'portrait');
      expect(l.cellMm).toBeLessThanOrEqual(MAX_CELL_MM);
    }
    expect(computeExportLayout(generateClues(stripes(30, 30)), 'portrait').cellMm).toBeLessThan(MAX_CELL_MM);
  });

  it('fits a 50x50 board with the longest clues (25 numbers per line) in both orientations', () => {
    for (const orientation of ['portrait', 'landscape'] as const) {
      const l = expectInsideUsableArea(stripes(50, 50), orientation);
      expect(l.rowClueCells).toBe(25);
      expect(l.colClueCells).toBe(25);
      expect(l.cellMm).toBeCloseTo((200 - THICK_LINE_MM) / 75, 9);
      expect(l.tooSmall).toBe(true);
    }
  });

  it('fits an empty 50x50 board (clues [0]) with large cells', () => {
    const l = expectInsideUsableArea(blank(50, 50), 'portrait');
    expect(l.rowClueCells).toBe(1);
    expect(l.cellMm).toBeLessThan(MAX_CELL_MM);
    expect(l.tooSmall).toBe(false);
  });

  it('cells are square and equal for board and clue cells: width = (clues + cols) × c', () => {
    const g = stripes(8, 20);
    const clues = generateClues(g);
    const l = computeExportLayout(clues, 'portrait');
    expect(l.boardWidthMm).toBeCloseTo((l.rowClueCells + 20) * l.cellMm, 9);
    expect(l.boardHeightMm).toBeCloseTo((l.colClueCells + 8) * l.cellMm, 9);
  });

  it('flags tooSmall only below the readable minimum', () => {
    const ok = computeExportLayout(generateClues(stripes(40, 40)), 'portrait');
    expect(ok.tooSmall).toBe(ok.cellMm < MIN_READABLE_CELL_MM);
    expect(computeExportLayout(generateClues(stripes(50, 50)), 'portrait').tooSmall).toBe(true);
  });

  it('is deterministic and independent of the browser', () => {
    const clues = generateClues(DEFAULT_LOGO_GRID);
    expect(computeExportLayout(clues, 'landscape')).toEqual(computeExportLayout(clues, 'landscape'));
  });
});

describe('betterOrientation', () => {
  it('suggests landscape for a wide board and never for a board that fits at 7 mm', () => {
    const wide = generateClues(blank(5, 50));
    const suggestion = betterOrientation(wide, 'portrait');
    expect(suggestion?.orientation).toBe('landscape');
    expect(suggestion!.cellMm).toBeGreaterThan(computeExportLayout(wide, 'portrait').cellMm);
    expect(betterOrientation(generateClues(DEFAULT_LOGO_GRID), 'portrait')).toBeNull();
  });

  it('suggests portrait for a tall board when landscape is selected', () => {
    expect(betterOrientation(generateClues(blank(50, 5)), 'landscape')?.orientation).toBe('portrait');
  });

  it('returns null when both orientations give the same size', () => {
    expect(betterOrientation(generateClues(stripes(50, 50)), 'portrait')).toBeNull();
  });
});

describe('mmToPx', () => {
  it('converts at 300 dpi: 7 mm ≈ 83 px', () => {
    expect(Math.round(mmToPx(7, 300))).toBe(83);
    expect(mmToPx(25.4, 300)).toBeCloseTo(300, 9);
  });
});

const LABELS = { base: 'nonograma', solution: 'solucion' };

describe('exportFileName', () => {
  it('uses nonograma-{rows}x{cols}[-solucion].{ext} without a title', () => {
    expect(exportFileName(null, 10, 15, 'blank', 'pdf', LABELS)).toBe('nonograma-10x15.pdf');
    expect(exportFileName(null, 10, 10, 'solution', 'png', LABELS)).toBe('nonograma-10x10-solucion.png');
  });

  it('uses a slug of the project title when there is one', () => {
    expect(exportFileName('Corazón de píxel', 10, 10, 'blank', 'png', LABELS)).toBe('corazon-de-pixel.png');
    expect(exportFileName('  ¡Mi Pez! ', 5, 5, 'solution', 'png', LABELS)).toBe('mi-pez-solucion.png');
  });

  it('names PDF and PNG after the project: nombre.pdf, nombre.png, nombre-solucion.png', () => {
    expect(exportFileName('Mi Dibujo', 8, 8, 'blank', 'pdf', LABELS)).toBe('mi-dibujo.pdf');
    expect(exportFileName('Mi Dibujo', 8, 8, 'blank', 'png', LABELS)).toBe('mi-dibujo.png');
    expect(exportFileName('Mi Dibujo', 8, 8, 'solution', 'png', LABELS)).toBe('mi-dibujo-solucion.png');
  });

  it('takes the base and solution words from the labels (i18n), not from code', () => {
    const en = { base: 'nonogram', solution: 'solution' };
    expect(exportFileName(null, 5, 5, 'solution', 'png', en)).toBe('nonogram-5x5-solution.png');
  });

  it('falls back to the default name when the title has no usable characters', () => {
    expect(exportFileName('???', 5, 5, 'blank', 'pdf', LABELS)).toBe('nonograma-5x5.pdf');
  });
});
