import { DEFAULT_LOGO_GRID, Grid } from '../../../core/domain';
import {
  DRAFT_SCHEMA_VERSION,
  MAX_TITLE_LENGTH,
  parseDraft,
  serializeDraft,
} from './draft-storage';

const valid = (patch: Record<string, unknown> = {}) =>
  JSON.stringify({ version: DRAFT_SCHEMA_VERSION, rows: 2, cols: 3, cells: ['101', '010'], title: null, ...patch });

describe('serializeDraft / parseDraft', () => {
  it('round-trips the default logo and its title', () => {
    const draft = parseDraft(serializeDraft(DEFAULT_LOGO_GRID, 'Corazón'));
    expect(draft?.grid).toEqual(DEFAULT_LOGO_GRID);
    expect(draft?.title).toBe('Corazón');
  });

  it('round-trips non-square boards and a null title', () => {
    const grid: Grid = [
      [1, 0, 1],
      [0, 1, 0],
    ];
    expect(parseDraft(serializeDraft(grid, null))).toEqual({ grid, title: null });
  });

  it('stores rows as compact 0/1 strings with a schema version', () => {
    const stored = JSON.parse(serializeDraft([[1, 0]], null));
    expect(stored).toEqual({ version: DRAFT_SCHEMA_VERSION, rows: 1, cols: 2, cells: ['10'], title: null });
  });

  it('accepts a minimal valid draft', () => {
    expect(parseDraft(valid())?.grid).toEqual([
      [1, 0, 1],
      [0, 1, 0],
    ]);
  });

  it.each([
    ['nothing stored', null],
    ['empty string', ''],
    ['not JSON', '{oops'],
    ['JSON null', 'null'],
    ['a number', '42'],
    ['an array', '[]'],
    ['another schema version', valid({ version: 999 })],
    ['no version', valid({ version: undefined })],
    ['rows out of range', valid({ rows: 0, cells: [] })],
    ['cols out of range', valid({ cols: 51 })],
    ['non-integer size', valid({ rows: 2.5 })],
    ['row count mismatch', valid({ rows: 3 })],
    ['cells not an array', valid({ cells: 'nope' })],
    ['row length mismatch', valid({ cells: ['10', '010'] })],
    ['invalid characters', valid({ cells: ['10a', '010'] })],
    ['a row that is not a string', valid({ cells: [101, '010'] })],
    ['a title that is not a string', valid({ title: 5 })],
    ['a title that is too long', valid({ title: 'x'.repeat(MAX_TITLE_LENGTH + 1) })],
  ])('ignores a draft with %s', (_name, raw) => {
    expect(parseDraft(raw)).toBeNull();
  });

  it('treats a blank stored title as the default title', () => {
    expect(parseDraft(valid({ title: '   ' }))?.title).toBeNull();
  });
});
