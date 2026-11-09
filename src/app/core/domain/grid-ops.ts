import { GridSizeError } from './clues';
import { Cell, Grid, MAX_SIZE, MIN_SIZE } from './types';

export function assertDimensions(rows: number, cols: number): void {
  const ok = (n: number) => Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
  if (!ok(rows) || !ok(cols)) {
    throw new GridSizeError(`Tamaño fuera de rango (${MIN_SIZE}..${MAX_SIZE}): ${rows}x${cols}`);
  }
}

export function createGrid(rows: number, cols: number): Grid {
  assertDimensions(rows, cols);
  return Array.from({ length: rows }, () => Array<Cell>(cols).fill(0));
}

export const clearGrid = (grid: Grid): Grid => createGrid(grid.length, grid[0].length);

export const invertGrid = (grid: Grid): Grid =>
  grid.map((row) => row.map((cell): Cell => (cell === 1 ? 0 : 1)));

export function countBlack(grid: Grid): number {
  let n = 0;
  for (const row of grid) for (const cell of row) n += cell;
  return n;
}

/** Cambia el tamaño conservando el dibujo anclado arriba-izquierda (recorta o amplía con blanco). */
export function resizeGrid(grid: Grid, rows: number, cols: number): Grid {
  assertDimensions(rows, cols);
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c): Cell => grid[r]?.[c] ?? 0),
  );
}

/** Casillas negras que se perderían al redimensionar. */
export function lostBlackCells(grid: Grid, rows: number, cols: number): number {
  let lost = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 1 && (r >= rows || c >= cols)) lost++;
    }
  }
  return lost;
}
