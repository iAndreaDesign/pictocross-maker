/** 0 = blanca, 1 = negra. */
export type Cell = 0 | 1;
export type Line = readonly Cell[];
/** Filas × columnas. Admite tableros no cuadrados (máx. 50x50). */
export type Grid = readonly (readonly Cell[])[];

export type Clue = readonly number[];
export interface Clues {
  readonly rows: readonly Clue[];
  readonly cols: readonly Clue[];
}

export const MIN_SIZE = 1;
export const MAX_SIZE = 50;
