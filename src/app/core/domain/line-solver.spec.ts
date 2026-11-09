import { solveLine } from './line-solver';
import { SolverCell } from './solver-types';

const U = SolverCell.Unknown;
const B = SolverCell.Black;
const W = SolverCell.White;
const unknown = (n: number) => Array<SolverCell>(n).fill(U);

describe('solveLine', () => {
  it('fills a line completely covered by the clue', () => {
    const r = solveLine([5], unknown(5));
    expect(r.line).toEqual([B, B, B, B, B]);
    expect(r.changed).toBe(true);
    expect(r.contradiction).toBe(false);
  });

  it('solves exact fits with several blocks ([2,1] in 4)', () => {
    expect(solveLine([2, 1], unknown(4)).line).toEqual([B, B, W, B]);
  });

  it('marks the overlap ([4] in 5)', () => {
    expect(solveLine([4], unknown(5)).line).toEqual([U, B, B, B, U]);
  });

  it('marks only the centre for [3] in 5', () => {
    expect(solveLine([3], unknown(5)).line).toEqual([U, U, B, U, U]);
  });

  it('treats [0] as an all-white line', () => {
    expect(solveLine([0], unknown(4)).line).toEqual([W, W, W, W]);
  });

  it('uses known cells: [3] in 5 with first cell black', () => {
    expect(solveLine([3], [B, U, U, U, U]).line).toEqual([B, B, B, W, W]);
  });

  it('uses known whites to place blocks', () => {
    expect(solveLine([2], [U, U, W, U, U]).line).toEqual([U, U, W, U, U]);
    expect(solveLine([3], [W, U, U, U, U]).line).toEqual([W, U, B, B, U]);
  });

  it('reports no change when nothing can be deduced', () => {
    const r = solveLine([1], unknown(4));
    expect(r.changed).toBe(false);
    expect(r.line).toEqual(unknown(4));
  });

  it('reports no change on an already solved line', () => {
    const r = solveLine([1, 1], [B, W, B]);
    expect(r.changed).toBe(false);
    expect(r.contradiction).toBe(false);
  });

  it('detects a contradiction when the clue does not fit', () => {
    const r = solveLine([3], unknown(2));
    expect(r.contradiction).toBe(true);
    expect(r.changed).toBe(false);
  });

  it('detects a contradiction against known cells', () => {
    expect(solveLine([1], [B, U, B]).contradiction).toBe(true);
    expect(solveLine([0], [U, B]).contradiction).toBe(true);
  });

  it('does not mutate the input', () => {
    const known = unknown(5);
    solveLine([4], known);
    expect(known).toEqual(unknown(5));
  });
});
