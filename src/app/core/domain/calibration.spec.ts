import {
  CalibrationExample,
  ExampleFormatError,
  evaluateExample,
  parseExample,
  searchThresholds,
  summarize,
} from './calibration';
import { generateClues } from './clues';
import { DIFFICULTY_CONFIG } from './difficulty.config';
import { Cell } from './types';

const gridOf = (rows: string[]) => rows.map((r) => [...r].map((c): Cell => (c === '1' ? 1 : 0)));

/** Todo negro: se resuelve en la primera pasada (fácil). */
const FULL = ['111', '111', '111'];
/** Dos diagonales intercambiables: no resoluble por lógica de líneas. */
const AMBIGUOUS = ['10', '01'];

const example = (name: string, rows: string[], expected: CalibrationExample['expected']): CalibrationExample => ({
  name,
  expected,
  clues: generateClues(gridOf(rows)),
});

describe('parseExample', () => {
  it('reads a grid example and derives its clues', () => {
    const ex = parseExample('a.json', { name: 'Lleno', expected: 'easy', grid: FULL });
    expect(ex).toEqual({ name: 'Lleno', expected: 'easy', clues: { rows: [[3], [3], [3]], cols: [[3], [3], [3]] } });
  });

  it('reads a clues-only example; expected is optional (pending)', () => {
    const ex = parseExample('b.json', { name: 'Solo pistas', clues: { rows: [[1], [1]], cols: [[1], [1]] } });
    expect(ex.expected).toBeNull();
    expect(ex.clues.rows).toEqual([[1], [1]]);
  });

  it('rejects clues whose row and column sums differ (transcription error)', () => {
    expect(() => parseExample('c.json', { name: 'x', clues: { rows: [[2]], cols: [[1], [2]] } })).toThrow(/no coincide/);
  });

  it.each([
    ['not an object', 'x'],
    ['missing name', { grid: FULL }],
    ['unknown expected', { name: 'x', expected: 'impossible', grid: FULL }],
    ['neither grid nor clues', { name: 'x' }],
    ['both grid and clues', { name: 'x', grid: FULL, clues: { rows: [[1]], cols: [[1]] } }],
    ['grid with other chars', { name: 'x', grid: ['1a1'] }],
    ['ragged grid', { name: 'x', grid: ['11', '1'] }],
    ['empty clue', { name: 'x', clues: { rows: [[]], cols: [[1]] } }],
  ])('rejects %s with a clear error', (_label, json) => {
    expect(() => parseExample('d.json', json)).toThrow(ExampleFormatError);
    expect(() => parseExample('d.json', json)).toThrow(/^d\.json: /);
  });
});

describe('evaluateExample', () => {
  it('computes the level and compares with the expected one', () => {
    const ok = evaluateExample(example('lleno', FULL, 'easy'));
    expect(ok).toMatchObject({ status: 'ideal', computed: 'easy', ok: true, rows: 3, cols: 3 });
    expect(ok.difficulty?.metrics.p1).toBe(100);
    expect(evaluateExample(example('lleno', FULL, 'hard')).ok).toBe(false);
  });

  it('REQ-S09-08: an unsolvable example is checked against the solver status', () => {
    const ev = evaluateExample(example('ambiguo', AMBIGUOUS, 'unsolvable'));
    expect(ev).toMatchObject({ status: 'unsolvable', computed: 'unsolvable', difficulty: null, ok: true });
    expect(evaluateExample(example('ambiguo', AMBIGUOUS, 'easy')).ok).toBe(false);
  });

  it('pending examples are measured but have no verdict', () => {
    expect(evaluateExample(example('pendiente', FULL, null))).toMatchObject({ computed: 'easy', ok: null });
  });

  it('inconsistent clues are reported as invalid, never as unsolvable', () => {
    const bad: CalibrationExample = { name: 'malo', expected: 'unsolvable', clues: { rows: [[2], [0]], cols: [[1], [0], [1]] } };
    expect(evaluateExample(bad)).toMatchObject({ status: 'contradiction', computed: 'invalid', ok: false });
  });

  it('is reproducible', () => {
    expect(evaluateExample(example('a', FULL, 'easy'))).toEqual(evaluateExample(example('a', FULL, 'easy')));
  });
});

describe('summarize', () => {
  it('counts hits among labelled examples and builds the confusion matrix', () => {
    const evals = [
      evaluateExample(example('a', FULL, 'easy')),
      evaluateExample(example('b', FULL, 'hard')),
      evaluateExample(example('c', AMBIGUOUS, 'unsolvable')),
      evaluateExample(example('d', FULL, null)),
    ];
    const s = summarize(evals);
    expect(s).toMatchObject({ labelled: 3, correct: 2 });
    expect(s.accuracy).toBeCloseTo(2 / 3);
    expect(s.matrix.easy.easy).toBe(1);
    expect(s.matrix.easy.hard).toBe(1);
    expect(s.matrix.unsolvable.unsolvable).toBe(1);
  });

  it('is 100 % (vacuously) with no labelled examples', () => {
    expect(summarize([]).accuracy).toBe(1);
  });
});

describe('searchThresholds', () => {
  const examples = [example('lleno', FULL, 'easy'), example('ambiguo', AMBIGUOUS, 'unsolvable')];

  it('lists candidates sorted by hits, closest to the current config first, and applies nothing', () => {
    const before = JSON.stringify(DIFFICULTY_CONFIG);
    const top = searchThresholds(examples, DIFFICULTY_CONFIG, 5);
    expect(top).toHaveLength(5);
    expect(top[0].correct).toBe(2);
    expect(top[0].labelled).toBe(2);
    for (let i = 1; i < top.length; i++) {
      const [prev, cur] = [top[i - 1], top[i]];
      expect(prev.correct > cur.correct || (prev.correct === cur.correct && prev.distance <= cur.distance)).toBe(true);
    }
    expect(JSON.stringify(DIFFICULTY_CONFIG)).toBe(before);
  });

  it('finds thresholds that fix a miss: the full board labelled "hard" needs stricter cuts', () => {
    const labelled = [example('lleno', FULL, 'hard')];
    expect(evaluateExample(labelled[0]).ok).toBe(false);
    const best = searchThresholds(labelled, DIFFICULTY_CONFIG, 1)[0];
    expect(best.correct).toBe(1);
    expect(best.distance).toBeGreaterThan(0);
  });

  it('is reproducible', () => {
    expect(searchThresholds(examples, DIFFICULTY_CONFIG, 3)).toEqual(searchThresholds(examples, DIFFICULTY_CONFIG, 3));
  });
});
