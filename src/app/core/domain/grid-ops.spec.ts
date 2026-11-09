import { generateClues, GridSizeError } from './clues';
import { DEFAULT_LOGO_GRID } from './default-logo';
import { linePoints } from './bresenham';
import { clearGrid, countBlack, createGrid, invertGrid, lostBlackCells, resizeGrid } from './grid-ops';
import { Grid } from './types';

describe('DEFAULT_LOGO_GRID', () => {
  it('is 10x10 with only 0/1 and the expected number of black cells', () => {
    expect(DEFAULT_LOGO_GRID).toHaveLength(10);
    for (const row of DEFAULT_LOGO_GRID) {
      expect(row).toHaveLength(10);
      for (const cell of row) expect([0, 1]).toContain(cell);
    }
    expect(countBlack(DEFAULT_LOGO_GRID)).toBe(48);
  });

  it('matches the spec matrix (first, middle and last rows)', () => {
    expect(DEFAULT_LOGO_GRID[0].join('')).toBe('0001110000');
    expect(DEFAULT_LOGO_GRID[3].join('')).toBe('0101101100');
    expect(DEFAULT_LOGO_GRID[9].join('')).toBe('0000000000');
  });

  it('can generate clues', () => {
    expect(generateClues(DEFAULT_LOGO_GRID).rows).toHaveLength(10);
  });
});

describe('grid ops', () => {
  const g: Grid = [
    [1, 0, 1],
    [0, 1, 0],
  ];

  it('createGrid builds a blank grid and validates size', () => {
    expect(createGrid(2, 3)).toEqual([
      [0, 0, 0],
      [0, 0, 0],
    ]);
    expect(() => createGrid(0, 3)).toThrow(GridSizeError);
    expect(() => createGrid(3, 51)).toThrow(GridSizeError);
    expect(() => createGrid(2.5, 3)).toThrow(GridSizeError);
  });

  it('clearGrid keeps the size', () => {
    expect(countBlack(clearGrid(g))).toBe(0);
    expect(clearGrid(g)).toHaveLength(2);
  });

  it('invertGrid is the exact complement and a double invert is the identity', () => {
    expect(invertGrid(g)).toEqual([
      [0, 1, 0],
      [1, 0, 1],
    ]);
    expect(invertGrid(invertGrid(DEFAULT_LOGO_GRID))).toEqual(DEFAULT_LOGO_GRID);
    expect(countBlack(invertGrid(DEFAULT_LOGO_GRID))).toBe(100 - 48);
  });

  it('resizeGrid crops and extends anchored top-left', () => {
    expect(resizeGrid(g, 1, 2)).toEqual([[1, 0]]);
    expect(resizeGrid(g, 3, 4)).toEqual([
      [1, 0, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it('lostBlackCells counts only black cells outside the new size', () => {
    expect(lostBlackCells(g, 2, 3)).toBe(0);
    expect(lostBlackCells(g, 1, 2)).toBe(2);
    expect(lostBlackCells(DEFAULT_LOGO_GRID, 5, 5)).toBeGreaterThan(0);
    expect(lostBlackCells(g, 5, 5)).toBe(0);
  });
});

describe('linePoints (Bresenham)', () => {
  it('returns a single point for identical endpoints', () => {
    expect(linePoints([2, 2], [2, 2])).toEqual([[2, 2]]);
  });

  it('draws horizontal, vertical and diagonal lines in both directions', () => {
    expect(linePoints([0, 0], [0, 3])).toEqual([[0, 0], [0, 1], [0, 2], [0, 3]]);
    expect(linePoints([3, 1], [0, 1])).toEqual([[3, 1], [2, 1], [1, 1], [0, 1]]);
    expect(linePoints([0, 0], [2, 2])).toEqual([[0, 0], [1, 1], [2, 2]]);
    expect(linePoints([2, 0], [0, 2])).toEqual([[2, 0], [1, 1], [0, 2]]);
  });

  it('leaves no gaps: consecutive points are always adjacent (8-neighbourhood)', () => {
    for (const [a, b] of [[[0, 0], [49, 17]], [[10, 40], [3, 2]], [[0, 0], [7, 49]]] as const) {
      const pts = linePoints(a, b);
      expect(pts[0]).toEqual(a);
      expect(pts[pts.length - 1]).toEqual(b);
      for (let i = 1; i < pts.length; i++) {
        expect(Math.abs(pts[i][0] - pts[i - 1][0])).toBeLessThanOrEqual(1);
        expect(Math.abs(pts[i][1] - pts[i - 1][1])).toBeLessThanOrEqual(1);
      }
    }
  });
});
