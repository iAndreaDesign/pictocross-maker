import { generateClues } from './clues';
import { DIFFICULTY_CONFIG, DifficultyConfig } from './difficulty.config';
import {
  computeDifficulty,
  levelForScore,
  pointsForP1,
  pointsForPasses,
  pointsForSize,
} from './difficulty';
import { solveGrid } from './grid-solver';
import { SolveResult, SolverCell } from './solver-types';
import { Cell, Grid } from './types';

/** Resultado sintético ideal con rows×cols, `first` casillas tras la pasada 1 y `passes` pasadas. */
const ideal = (rows: number, cols: number, first: number, passes: number): SolveResult => ({
  status: 'ideal',
  cells: Array.from({ length: rows }, () => Array<SolverCell>(cols).fill(SolverCell.Black)),
  unknownCells: [],
  passes,
  solvedAfterFirstPass: first,
});

describe('points tables (boundaries)', () => {
  it.each([
    [100, 0],
    [80, 0],
    [79.99, 1],
    [30, 1],
    [29.99, 2],
    [0, 2],
  ])('P1=%s → %s pts', (p1, pts) => expect(pointsForP1(p1)).toBe(pts));

  it.each([
    [1, 0],
    [4, 0],
    [5, 1],
    [8, 1],
    [9, 2],
  ])('N=%s → %s pts', (n, pts) => expect(pointsForPasses(n)).toBe(pts));

  it.each([
    [15, 0],
    [16, 1],
    [50, 1],
  ])('T=%s → %s pts', (t, pts) => expect(pointsForSize(t)).toBe(pts));

  it.each([
    [0, 'easy'],
    [1, 'easy'],
    [2, 'medium'],
    [3, 'medium'],
    [4, 'hard'],
    [5, 'hard'],
  ] as const)('score %s → %s', (score, level) => expect(levelForScore(score)).toBe(level));
});

describe('computeDifficulty', () => {
  it('returns null for an unsolvable result', () => {
    const r = solveGrid(generateClues([[1, 0], [0, 1]] satisfies Grid));
    expect(r.status).toBe('unsolvable');
    expect(computeDifficulty(r)).toBeNull();
  });

  it('computes P1 = solvedAfterFirstPass / cells × 100 without rounding', () => {
    const d = computeDifficulty(ideal(3, 3, 1, 1));
    expect(d?.metrics.p1).toBeCloseTo(11.111, 3);
    expect(d?.metrics.n).toBe(1);
    expect(d?.metrics.t).toBe(3);
  });

  it('uses the larger side for T on rectangular boards', () => {
    expect(computeDifficulty(ideal(3, 20, 60, 1))?.metrics.t).toBe(20);
  });

  it('scores an easy case: P1 100, 1 pass, 10x10 → 0 pts', () => {
    const d = computeDifficulty(ideal(10, 10, 100, 1));
    expect(d).toMatchObject({ score: 0, level: 'easy', points: { p1: 0, n: 0, t: 0 } });
  });

  it('scores a hard case: P1 10%, 12 passes, 20x20 → 5 pts', () => {
    const d = computeDifficulty(ideal(20, 20, 40, 12));
    expect(d).toMatchObject({ score: 5, level: 'hard', points: { p1: 2, n: 2, t: 1 } });
  });

  it('scores around the P1=80 and N=4 boundaries (calibrated in S09)', () => {
    const d = computeDifficulty(ideal(10, 10, 80, 5));
    expect(d).toMatchObject({ score: 1, level: 'easy' });
    expect(computeDifficulty(ideal(10, 10, 79, 5))).toMatchObject({ score: 2, level: 'medium' });
  });

  it('works end to end with the solver (hand-computed 4x4: P1=50%, N=3 → easy/1 pt)', () => {
    const g: Grid = ['###.', '.###', '..##', '..#.'].map((r) => [...r].map((c): Cell => (c === '#' ? 1 : 0)));
    const d = computeDifficulty(solveGrid(generateClues(g)));
    expect(d).toMatchObject({ score: 1, level: 'easy', metrics: { p1: 50, n: 3, t: 4 } });
  });

  it('changing a threshold in the config changes the outcome without touching logic', () => {
    const r = ideal(10, 10, 100, 1);
    const strict: DifficultyConfig = {
      ...DIFFICULTY_CONFIG,
      p1: { zeroPointsMin: 101, onePointMin: 101 },
      passes: { zeroPointsMax: 0, onePointMax: 0 },
    };
    expect(computeDifficulty(r)?.level).toBe('easy');
    expect(computeDifficulty(r, strict)).toMatchObject({ score: 4, level: 'hard' });
  });
});
