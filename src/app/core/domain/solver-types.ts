import { Clue } from './types';

/** Estado de una casilla para el solucionador. */
export const SolverCell = { Unknown: 0, Black: 1, White: 2 } as const;
export type SolverCell = (typeof SolverCell)[keyof typeof SolverCell];

export interface LineSolution {
  readonly line: readonly SolverCell[];
  readonly changed: boolean;
  readonly contradiction: boolean;
}

export type SolveStatus = 'ideal' | 'unsolvable';

export interface SolveResult {
  readonly status: SolveStatus;
  readonly cells: readonly (readonly SolverCell[])[];
  /** Casillas que la lógica no pudo decidir, como [fila, columna]. */
  readonly unknownCells: readonly (readonly [number, number])[];
  /** Pasadas ejecutadas (fila+columna). Si es ideal, las necesarias hasta resolver. */
  readonly passes: number;
  /** Casillas decididas al terminar la primera pasada. */
  readonly solvedAfterFirstPass: number;
}

export type { Clue };
