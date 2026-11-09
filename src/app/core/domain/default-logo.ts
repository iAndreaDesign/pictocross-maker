import { Cell, Grid } from './types';

const LOGO_ROWS = [
  '0001110000',
  '0011111000',
  '0100100100',
  '0101101100',
  '0111111100',
  '0111111100',
  '0111111100',
  '0111111100',
  '0101010100',
  '0000000000',
] as const;

/** Dibujo por defecto 10x10 (S05, REQ-S05-05). 1 = negra. */
export const DEFAULT_LOGO_GRID: Grid = LOGO_ROWS.map((row) => [...row].map((c): Cell => (c === '1' ? 1 : 0)));
