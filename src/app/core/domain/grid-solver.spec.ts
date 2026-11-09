import { generateClues } from './clues';
import { solveGrid, SolverContradictionError } from './grid-solver';
import { SolverCell } from './solver-types';
import { Cell, Grid } from './types';

const parse = (rows: string[]): Grid => rows.map((r) => [...r].map((c): Cell => (c === '#' ? 1 : 0)));
const toSolver = (g: Grid) => g.map((r) => r.map((c) => (c === 1 ? SolverCell.Black : SolverCell.White)));

const HEART = parse([
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

describe('solveGrid', () => {
  it('solves a compact heart as ideal and reproduces the drawing', () => {
    const r = solveGrid(generateClues(HEART));
    expect(r.status).toBe('ideal');
    expect(r.unknownCells).toEqual([]);
    expect(r.cells).toEqual(toSolver(HEART));
  });

  it('flags the 2x2 diagonal as unsolvable with 4 unknown cells', () => {
    const r = solveGrid(generateClues(parse(['#.', '.#'])));
    expect(r.status).toBe('unsolvable');
    expect(r.unknownCells).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
    expect(r.passes).toBe(1);
    expect(r.solvedAfterFirstPass).toBe(0);
  });

  it('flags a 4x4 checkerboard as unsolvable', () => {
    const r = solveGrid(generateClues(parse(['#.#.', '.#.#', '#.#.', '.#.#'])));
    expect(r.status).toBe('unsolvable');
    expect(r.unknownCells).toHaveLength(16);
  });

  it('solves a fully black grid in one pass', () => {
    const r = solveGrid(generateClues(parse(['##', '##'])));
    expect(r.status).toBe('ideal');
    expect(r.passes).toBe(1);
    expect(r.solvedAfterFirstPass).toBe(4);
  });

  it('solves an empty grid in one pass', () => {
    const r = solveGrid(generateClues(parse(['...', '...'])));
    expect(r.status).toBe('ideal');
    expect(r.passes).toBe(1);
    expect(r.solvedAfterFirstPass).toBe(6);
  });

  it('reports passes and first-pass progress for a hand-computed case', () => {
    // Pasada 1: filas fijan 4 casillas, columnas 4 más (8). Pasada 2: +6. Pasada 3: +2.
    const g = parse(['###.', '.###', '..##', '..#.']);
    const r = solveGrid(generateClues(g));
    expect(r.status).toBe('ideal');
    expect(r.solvedAfterFirstPass).toBe(8);
    expect(r.passes).toBe(3);
    expect(r.cells).toEqual(toSolver(g));
  });

  it('handles a 1x1 grid', () => {
    expect(solveGrid(generateClues(parse(['#']))).status).toBe('ideal');
  });

  it('handles non-square grids', () => {
    const g = parse(['####..#', '.##.###', '#######']);
    const r = solveGrid(generateClues(g));
    if (r.status === 'ideal') expect(r.cells).toEqual(toSolver(g));
    expect(r.cells).toHaveLength(3);
    expect(r.cells[0]).toHaveLength(7);
  });

  it('throws a SolverContradictionError on inconsistent clues', () => {
    expect(() => solveGrid({ rows: [[2], [0]], cols: [[1], [0]] })).toThrow(SolverContradictionError);
    expect(() => solveGrid({ rows: [[3]], cols: [[1], [1]] })).toThrow(SolverContradictionError);
  });
});

describe('solveGrid properties', () => {
  // PRNG determinista (mulberry32) para tests reproducibles.
  const rng = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  it('never contradicts, and when ideal the solution equals the drawing', () => {
    const rand = rng(42);
    let ideal = 0;
    for (let i = 0; i < 300; i++) {
      const rows = 1 + Math.floor(rand() * 8);
      const cols = 1 + Math.floor(rand() * 8);
      const density = 0.3 + rand() * 0.6;
      const g: Grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, (): Cell => (rand() < density ? 1 : 0)),
      );
      const r = solveGrid(generateClues(g));
      expect(r.status === 'ideal').toBe(r.unknownCells.length === 0);
      if (r.status === 'ideal') {
        ideal++;
        expect(r.cells).toEqual(toSolver(g));
      }
    }
    expect(ideal).toBeGreaterThan(0);
  });
});

describe('solveGrid performance (REQ-S03-08)', () => {
  it('solves a dense 50x50 quickly', () => {
    const g: Grid = Array.from({ length: 50 }, (_, r) =>
      Array.from({ length: 50 }, (_, c): Cell => ((r - 24.5) ** 2 + (c - 24.5) ** 2 < 600 ? 1 : 0)),
    );
    const clues = generateClues(g);
    const t0 = performance.now();
    const r = solveGrid(clues);
    const ms = performance.now() - t0;
    console.info(`50x50 solve: ${ms.toFixed(1)} ms, status=${r.status}, passes=${r.passes}`);
    expect(ms).toBeLessThan(1000);
  });
});
