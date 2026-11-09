import { cellFromPoint, rulerLabels, strokeModeFor } from './grid-geometry';

const rect = { left: 100, top: 50, width: 200, height: 100 };

describe('cellFromPoint', () => {
  it('maps a point to its cell', () => {
    expect(cellFromPoint(100, 50, rect, 10, 10)).toEqual([0, 0]);
    expect(cellFromPoint(125, 65, rect, 10, 10)).toEqual([1, 1]);
    expect(cellFromPoint(299, 149, rect, 10, 10)).toEqual([9, 9]);
  });

  it('supports non-square boards', () => {
    expect(cellFromPoint(200, 100, rect, 5, 20)).toEqual([2, 10]);
  });

  it('clamps points outside the board (pointer capture)', () => {
    expect(cellFromPoint(-500, -500, rect, 10, 10)).toEqual([0, 0]);
    expect(cellFromPoint(9999, 9999, rect, 10, 10)).toEqual([9, 9]);
  });

  it('returns [0,0] for a zero-sized rect', () => {
    expect(cellFromPoint(5, 5, { left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toEqual([0, 0]);
  });
});

describe('strokeModeFor (REQ-S05-04)', () => {
  it('draw tool: left paints, right erases', () => {
    expect(strokeModeFor('draw', 0)).toBe('paint');
    expect(strokeModeFor('draw', 2)).toBe('erase');
  });

  it('erase tool: left erases, right paints', () => {
    expect(strokeModeFor('erase', 0)).toBe('erase');
    expect(strokeModeFor('erase', 2)).toBe('paint');
  });

  it('ignores the middle button and others', () => {
    expect(strokeModeFor('draw', 1)).toBeNull();
    expect(strokeModeFor('erase', 4)).toBeNull();
  });
});

describe('rulerLabels', () => {
  it('numbers every line up to 25', () => {
    expect(rulerLabels(5)).toEqual([1, 2, 3, 4, 5]);
    expect(rulerLabels(25)).toHaveLength(25);
    expect(rulerLabels(25).every((l) => l !== null)).toBe(true);
  });

  it('shows only 1 and multiples of 5 above 25', () => {
    const labels = rulerLabels(50);
    expect(labels).toHaveLength(50);
    expect(labels.filter((l) => l !== null)).toEqual([1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
  });
});
