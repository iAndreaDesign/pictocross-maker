import { solveLine } from './line-solver';
import { Clues } from './types';
import { SolveResult, SolverCell } from './solver-types';

export class SolverContradictionError extends Error {
  constructor(axis: 'row' | 'col', index: number) {
    super(`Contradicción en ${axis === 'row' ? 'la fila' : 'la columna'} ${index}: las pistas no son consistentes`);
    this.name = 'SolverContradictionError';
  }
}

/**
 * Resuelve solo por lógica de líneas (§4): pasadas de todas las filas y luego
 * todas las columnas hasta resolver o hasta que una pasada no cambie nada.
 * Sin backtracking ni heurísticas. Las dimensiones salen de las pistas.
 */
export function solveGrid(clues: Clues): SolveResult {
  const rows = clues.rows.length;
  const cols = clues.cols.length;
  const cells: SolverCell[][] = Array.from({ length: rows }, () =>
    Array<SolverCell>(cols).fill(SolverCell.Unknown),
  );
  const total = rows * cols;
  let remaining = total;
  let passes = 0;
  let solvedAfterFirstPass = 0;

  while (remaining > 0) {
    passes++;
    let changed = false;

    for (let r = 0; r < rows; r++) {
      const res = solveLine(clues.rows[r], cells[r]);
      if (res.contradiction) throw new SolverContradictionError('row', r);
      if (res.changed) {
        changed = true;
        for (let c = 0; c < cols; c++) {
          if (cells[r][c] === SolverCell.Unknown && res.line[c] !== SolverCell.Unknown) remaining--;
          cells[r][c] = res.line[c];
        }
      }
    }

    for (let c = 0; c < cols; c++) {
      const column = cells.map((row) => row[c]);
      const res = solveLine(clues.cols[c], column);
      if (res.contradiction) throw new SolverContradictionError('col', c);
      if (res.changed) {
        changed = true;
        for (let r = 0; r < rows; r++) {
          if (cells[r][c] === SolverCell.Unknown && res.line[r] !== SolverCell.Unknown) remaining--;
          cells[r][c] = res.line[r];
        }
      }
    }

    if (passes === 1) solvedAfterFirstPass = total - remaining;
    if (!changed) break;
  }

  const unknownCells: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) if (cells[r][c] === SolverCell.Unknown) unknownCells.push([r, c]);
  }

  return {
    status: unknownCells.length === 0 ? 'ideal' : 'unsolvable',
    cells,
    unknownCells,
    passes,
    solvedAfterFirstPass,
  };
}
