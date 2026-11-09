import { Clue } from './types';
import { LineSolution, SolverCell } from './solver-types';

const { Unknown, Black, White } = SolverCell;

/**
 * Deduce todo lo que se puede de una línea por DP (sin backtracking):
 * una casilla es negra/blanca si lo es en TODAS las colocaciones válidas
 * compatibles con `known`. Coste O(largo × bloques).
 */
export function solveLine(clue: Clue, known: readonly SolverCell[]): LineSolution {
  const n = known.length;
  const blocks = clue.filter((b) => b > 0);
  const k = blocks.length;
  const cols = k + 1;

  // Casillas consecutivas no blancas hacia delante desde i (para comprobar un bloque en O(1)).
  const noWhiteRun = new Int32Array(n + 1);
  for (let i = n - 1; i >= 0; i--) noWhiteRun[i] = known[i] === White ? 0 : noWhiteRun[i + 1] + 1;
  const fits = (start: number, len: number) => start >= 0 && start + len <= n && noWhiteRun[start] >= len;

  // pre[i*cols+j]: casillas [0,i) contienen exactamente los j primeros bloques.
  const pre = new Uint8Array((n + 1) * cols);
  pre[0] = 1;
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= k; j++) {
      let ok = known[i - 1] !== Black && pre[(i - 1) * cols + j] === 1;
      if (!ok && j > 0) {
        const len = blocks[j - 1];
        const start = i - len;
        if (fits(start, len)) {
          ok = start === 0 ? j === 1 : known[start - 1] !== Black && pre[(start - 1) * cols + (j - 1)] === 1;
        }
      }
      pre[i * cols + j] = ok ? 1 : 0;
    }
  }

  if (pre[n * cols + k] === 0) {
    return { line: known, changed: false, contradiction: true };
  }

  // suf[i*cols+j]: casillas [i,n) contienen exactamente los bloques j..k-1.
  const suf = new Uint8Array((n + 2) * cols);
  suf[n * cols + k] = 1;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = 0; j <= k; j++) {
      let ok = known[i] !== Black && suf[(i + 1) * cols + j] === 1;
      if (!ok && j < k) {
        const len = blocks[j];
        if (fits(i, len)) {
          const end = i + len;
          ok = end === n ? j === k - 1 : known[end] !== Black && suf[(end + 1) * cols + (j + 1)] === 1;
        }
      }
      suf[i * cols + j] = ok ? 1 : 0;
    }
  }

  // Blanca posible en i: alguna j con pre[i][j] y suf[i+1][j].
  const canWhite = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (known[i] === Black) continue;
    for (let j = 0; j <= k; j++) {
      if (pre[i * cols + j] === 1 && suf[(i + 1) * cols + j] === 1) {
        canWhite[i] = 1;
        break;
      }
    }
  }

  // Negra posible: unión (difference array) de todas las colocaciones válidas de cada bloque.
  const diff = new Int32Array(n + 1);
  for (let j = 0; j < k; j++) {
    const len = blocks[j];
    for (let s = 0; s + len <= n; s++) {
      if (!fits(s, len)) continue;
      const before = s === 0 ? j === 0 : known[s - 1] !== Black && pre[(s - 1) * cols + j] === 1;
      if (!before) continue;
      const end = s + len;
      const after = end === n ? j === k - 1 : known[end] !== Black && suf[(end + 1) * cols + (j + 1)] === 1;
      if (!after) continue;
      diff[s]++;
      diff[end]--;
    }
  }

  const line: SolverCell[] = new Array<SolverCell>(n);
  let changed = false;
  let cover = 0;
  for (let i = 0; i < n; i++) {
    cover += diff[i];
    const canBlack = cover > 0;
    let cell: SolverCell;
    if (canBlack && canWhite[i] === 1) cell = Unknown;
    else if (canBlack) cell = Black;
    else if (canWhite[i] === 1) cell = White;
    else return { line: known, changed: false, contradiction: true };
    if (known[i] === Unknown && cell !== Unknown) changed = true;
    line[i] = known[i] !== Unknown ? known[i] : cell;
  }
  return { line, changed, contradiction: false };
}
