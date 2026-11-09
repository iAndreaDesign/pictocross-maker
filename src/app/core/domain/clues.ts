import { Clue, Clues, Grid, Line, MAX_SIZE, MIN_SIZE } from './types';

export class GridSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GridSizeError';
  }
}

/** Longitudes de las rachas de casillas negras; línea sin negras → [0]. */
export function lineToClue(line: Line): Clue {
  const clue: number[] = [];
  let run = 0;
  for (const cell of line) {
    if (cell === 1) {
      run++;
    } else if (run > 0) {
      clue.push(run);
      run = 0;
    }
  }
  if (run > 0) clue.push(run);
  return clue.length > 0 ? clue : [0];
}

function validateSize(grid: Grid): void {
  const rows = grid.length;
  if (rows < MIN_SIZE || rows > MAX_SIZE) {
    throw new GridSizeError(`Filas fuera de rango (${MIN_SIZE}..${MAX_SIZE}): ${rows}`);
  }
  const cols = grid[0].length;
  if (cols < MIN_SIZE || cols > MAX_SIZE) {
    throw new GridSizeError(`Columnas fuera de rango (${MIN_SIZE}..${MAX_SIZE}): ${cols}`);
  }
  if (grid.some((row) => row.length !== cols)) {
    throw new GridSizeError('Todas las filas deben tener el mismo número de columnas');
  }
}

export function generateClues(grid: Grid): Clues {
  validateSize(grid);
  const cols = grid[0].length;
  const rowClues = grid.map(lineToClue);
  const colClues: Clue[] = [];
  for (let c = 0; c < cols; c++) {
    colClues.push(lineToClue(grid.map((row) => row[c])));
  }
  return { rows: rowClues, cols: colClues };
}
