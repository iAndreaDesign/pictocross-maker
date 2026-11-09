import { TestBed } from '@angular/core/testing';
import { DEFAULT_LOGO_GRID, countBlack } from '../../../core/domain';
import { DrawingStore, HISTORY_LIMIT } from './drawing-store';

describe('DrawingStore', () => {
  let store: DrawingStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(DrawingStore);
  });

  it('starts with the 10x10 logo', () => {
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    expect(store.rows()).toBe(10);
    expect(store.cols()).toBe(10);
    expect(store.totalCells()).toBe(100);
    expect(store.blackCount()).toBe(48);
    expect(store.canUndo()).toBe(false);
    expect(store.tool()).toBe('draw');
    expect(store.title()).toBeNull();
  });

  it('setCell changes one cell and is undoable', () => {
    store.setCell(9, 9, 1);
    expect(store.grid()[9][9]).toBe(1);
    store.undo();
    expect(store.grid()[9][9]).toBe(0);
  });

  it('setCell with the same value adds no history', () => {
    store.setCell(0, 0, 0);
    expect(store.canUndo()).toBe(false);
  });

  it('a whole stroke is a single history entry', () => {
    store.beginStroke('erase');
    store.paintStroke(4, 1);
    store.paintStroke(4, 7);
    store.endStroke();
    expect(store.grid()[4].slice(1, 8)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    store.undo();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    expect(store.canUndo()).toBe(false);
  });

  it('interpolates fast diagonal strokes without gaps', () => {
    store.clear();
    store.beginStroke('paint');
    store.paintStroke(0, 0);
    store.paintStroke(9, 9);
    store.endStroke();
    for (let i = 0; i < 10; i++) expect(store.grid()[i][i]).toBe(1);
    expect(store.blackCount()).toBe(10);
  });

  it('ignores strokes without beginStroke and out-of-range points', () => {
    store.paintStroke(0, 0);
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    store.beginStroke('paint');
    store.paintStroke(-1, 99);
    store.endStroke();
    expect(store.canUndo()).toBe(false);
  });

  it('a stroke that changes nothing adds no history', () => {
    store.beginStroke('paint');
    store.paintStroke(4, 4); // ya es negra
    store.endStroke();
    expect(store.canUndo()).toBe(false);
  });

  it('clear leaves 0 black cells, keeps size and is undoable', () => {
    store.clear();
    expect(store.blackCount()).toBe(0);
    expect(store.rows()).toBe(10);
    store.undo();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
  });

  it('invert gives the complement; twice gives the original', () => {
    store.invert();
    expect(store.blackCount()).toBe(52);
    store.invert();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
  });

  it('redo re-applies and a new action clears the redo stack', () => {
    store.clear();
    store.undo();
    expect(store.canRedo()).toBe(true);
    store.redo();
    expect(store.blackCount()).toBe(0);
    store.undo();
    store.invert();
    expect(store.canRedo()).toBe(false);
  });

  it('undo/redo do nothing on empty stacks or during a stroke', () => {
    store.undo();
    store.redo();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    store.clear();
    store.beginStroke('paint');
    store.undo();
    expect(store.blackCount()).toBe(0);
    store.endStroke();
  });

  it('limits history to HISTORY_LIMIT entries', () => {
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) store.invert();
    let undos = 0;
    while (store.canUndo()) {
      store.undo();
      undos++;
    }
    expect(undos).toBe(HISTORY_LIMIT);
  });

  it('resize crops/extends, reports lost black cells and is undoable', () => {
    expect(store.lostOnResize(10, 10)).toBe(0);
    const lost = store.lostOnResize(5, 5);
    expect(lost).toBeGreaterThan(0);
    store.resize(5, 5);
    expect(store.rows()).toBe(5);
    expect(store.cols()).toBe(5);
    expect(store.blackCount()).toBe(48 - lost);
    store.undo();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    store.resize(12, 15);
    expect(store.totalCells()).toBe(180);
    expect(store.blackCount()).toBe(48);
  });

  it('resize rejects invalid sizes and ignores no-op sizes', () => {
    expect(() => store.resize(0, 5)).toThrow();
    expect(() => store.resize(5, 51)).toThrow();
    store.resize(10, 10);
    expect(store.canUndo()).toBe(false);
  });

  it('load replaces the drawing, sets the title and empties the history', () => {
    store.invert();
    store.load([[1, 0, 1]], 'Mi dibujo');
    expect(store.grid()).toEqual([[1, 0, 1]]);
    expect([store.rows(), store.cols()]).toEqual([1, 3]);
    expect(store.title()).toBe('Mi dibujo');
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
  });

  it('load rejects empty or oversized grids', () => {
    expect(() => store.load([], null)).toThrow();
    expect(() => store.load([[]], null)).toThrow();
    expect(() => store.load(Array.from({ length: 51 }, () => [0]), null)).toThrow();
  });

  it('reset restores logo, tool, title and empties history', () => {
    store.invert();
    store.setTool('erase');
    store.setTitle('Mi dibujo');
    store.reset();
    expect(store.grid()).toEqual(DEFAULT_LOGO_GRID);
    expect(store.canUndo()).toBe(false);
    expect(store.tool()).toBe('draw');
    expect(store.title()).toBeNull();
  });

  it('setTitle trims and falls back to null when blank', () => {
    store.setTitle('  Pez  ');
    expect(store.title()).toBe('Pez');
    store.setTitle('   ');
    expect(store.title()).toBeNull();
  });

  it('never mutates previous grids (immutability)', () => {
    const before = store.grid();
    const copy = JSON.stringify(before);
    store.beginStroke('erase');
    store.paintStroke(4, 4);
    store.endStroke();
    expect(JSON.stringify(before)).toBe(copy);
    expect(countBlack(before)).toBe(48);
  });
});
