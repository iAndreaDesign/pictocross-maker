import { Cell, Grid, MAX_SIZE, MIN_SIZE } from '../../core/domain';

export const DRAFT_STORAGE_KEY = 'pictocross-maker:draft';
/** Súbela cuando cambie el formato; los borradores de otra versión se ignoran (no se migran en silencio). */
export const DRAFT_SCHEMA_VERSION = 1;
export const MAX_TITLE_LENGTH = 60;

export interface Draft {
  readonly grid: Grid;
  /** `null` = título por defecto. */
  readonly title: string | null;
}

/** Formato guardado: filas como cadenas de 0/1 (compacto) y versión de esquema. */
interface StoredDraft {
  readonly version: number;
  readonly rows: number;
  readonly cols: number;
  readonly cells: readonly string[];
  readonly title: string | null;
}

export function serializeDraft(grid: Grid, title: string | null): string {
  const stored: StoredDraft = {
    version: DRAFT_SCHEMA_VERSION,
    rows: grid.length,
    cols: grid[0].length,
    cells: grid.map((row) => row.join('')),
    title,
  };
  return JSON.stringify(stored);
}

const isSize = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;

/**
 * Lee un borrador. Devuelve `null` ante cualquier dato ausente, corrupto, de otra versión o
 * incoherente (tamaño, filas, caracteres, título): nunca lanza, así que no puede romper la app.
 */
export function parseDraft(raw: string | null): Draft | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { version, rows, cols, cells, title } = value as Record<string, unknown>;

  if (version !== DRAFT_SCHEMA_VERSION || !isSize(rows) || !isSize(cols)) return null;
  if (!Array.isArray(cells) || cells.length !== rows) return null;
  if (title !== null && (typeof title !== 'string' || title.length > MAX_TITLE_LENGTH)) return null;

  const grid: Cell[][] = [];
  for (const line of cells as unknown[]) {
    if (typeof line !== 'string' || line.length !== cols || !/^[01]+$/.test(line)) return null;
    grid.push([...line].map((c): Cell => (c === '1' ? 1 : 0)));
  }
  return { grid, title: title === null || title.trim() === '' ? null : title };
}
