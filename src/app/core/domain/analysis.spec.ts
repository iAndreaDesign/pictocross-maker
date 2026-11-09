import { analyzeGrid } from './analysis';
import { DEFAULT_LOGO_GRID } from './default-logo';
import { Cell, Grid } from './types';

const parse = (rows: string[]): Grid => rows.map((r) => [...r].map((c): Cell => (c === '#' ? 1 : 0)));

describe('analyzeGrid', () => {
  it('reports an ideal drawing with its difficulty', () => {
    const heart = parse([
      '..##..##..',
      '.########.',
      '##########',
      '##########',
      '##########',
      '.########.',
      '..######..',
      '...####...',
      '....##....',
      '..........',
    ]);
    const r = analyzeGrid(heart);
    expect(r).toMatchObject({ rows: 10, cols: 10, status: 'ideal', unknownCells: [] });
    expect(r.difficulty?.level).toBeDefined();
  });

  it('reports an unsolvable drawing with its unknown cells and no difficulty', () => {
    const r = analyzeGrid(parse(['#.', '.#']));
    expect(r.status).toBe('unsolvable');
    expect(r.unknownCells).toHaveLength(4);
    expect(r.difficulty).toBeNull();
  });

  it('is consistent for the default logo (status matches unknown cells)', () => {
    const r = analyzeGrid(DEFAULT_LOGO_GRID);
    expect(r.status === 'ideal').toBe(r.unknownCells.length === 0);
  });

  it('result survives structured cloning (worker messages)', () => {
    const r = analyzeGrid(parse(['#.', '.#']));
    expect(structuredClone(r)).toEqual(r);
  });
});
