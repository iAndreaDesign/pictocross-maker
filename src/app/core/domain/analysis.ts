import { generateClues } from './clues';
import { Difficulty, computeDifficulty } from './difficulty';
import { solveGrid } from './grid-solver';
import { SolveStatus } from './solver-types';
import { Grid } from './types';

/** Resultado serializable (structured clone) del análisis de un dibujo. */
export interface AnalysisResult {
  readonly rows: number;
  readonly cols: number;
  readonly status: SolveStatus;
  /** Casillas que la lógica no pudo decidir, como [fila, columna]. */
  readonly unknownCells: readonly (readonly [number, number])[];
  /** Solo si el estado es `ideal`. */
  readonly difficulty: Difficulty | null;
}

/** Pistas → solucionador → dificultad. Es lo que ejecuta el Web Worker. */
export function analyzeGrid(grid: Grid): AnalysisResult {
  const solved = solveGrid(generateClues(grid));
  return {
    rows: grid.length,
    cols: grid[0].length,
    status: solved.status,
    unknownCells: solved.unknownCells,
    difficulty: computeDifficulty(solved),
  };
}
