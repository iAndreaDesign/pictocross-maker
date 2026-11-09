import { generateClues, GridSizeError, lineToClue } from './clues';
import { Cell, Grid, MAX_SIZE } from './types';

const parse = (s: string): Cell[] => [...s].map((c) => (c === '■' ? 1 : 0));

describe('lineToClue', () => {
  it('converts ■■□■□□■■■ to [2,1,3]', () => {
    expect(lineToClue(parse('■■□■□□■■■'))).toEqual([2, 1, 3]);
  });

  it('returns [0] for an all-white line', () => {
    expect(lineToClue(parse('□□□□'))).toEqual([0]);
  });

  it('returns [n] for an all-black line of length n', () => {
    expect(lineToClue(parse('■■■■■'))).toEqual([5]);
  });

  it('closes a trailing run', () => {
    expect(lineToClue(parse('□■■'))).toEqual([2]);
  });

  it('returns [0] for an empty line array', () => {
    expect(lineToClue([])).toEqual([0]);
  });
});

describe('generateClues', () => {
  it('gives [1] everywhere for a 2x2 diagonal', () => {
    const grid: Grid = [
      [1, 0],
      [0, 1],
    ];
    expect(generateClues(grid)).toEqual({ rows: [[1], [1]], cols: [[1], [1]] });
  });

  it('handles a rectangular 3x7 grid (rows left→right, cols top→bottom)', () => {
    const grid: Grid = [parse('■■□■□□■'), parse('□□□□□□□'), parse('■■■■■■■')];
    expect(generateClues(grid)).toEqual({
      rows: [[2, 1, 1], [0], [7]],
      cols: [[1, 1], [1, 1], [1], [1, 1], [1], [1], [1, 1]],
    });
  });

  it('does not mutate the input', () => {
    const grid: Grid = [[1, 1]];
    const copy = JSON.stringify(grid);
    generateClues(grid);
    expect(JSON.stringify(grid)).toBe(copy);
  });
});

describe('size validation', () => {
  const blank = (rows: number, cols: number): Grid =>
    Array.from({ length: rows }, () => Array<Cell>(cols).fill(0));

  it('throws for an empty grid', () => {
    expect(() => generateClues([])).toThrow(GridSizeError);
  });

  it('throws for zero columns', () => {
    expect(() => generateClues([[]])).toThrow(GridSizeError);
  });

  it('throws above 50 rows or 50 columns', () => {
    expect(() => generateClues(blank(MAX_SIZE + 1, 3))).toThrow(GridSizeError);
    expect(() => generateClues(blank(3, MAX_SIZE + 1))).toThrow(GridSizeError);
  });

  it('accepts 1x1 and 50x50', () => {
    expect(() => generateClues(blank(1, 1))).not.toThrow();
    expect(() => generateClues(blank(MAX_SIZE, MAX_SIZE))).not.toThrow();
  });

  it('throws for ragged rows', () => {
    expect(() => generateClues([[1, 0], [1]])).toThrow(GridSizeError);
  });
});
