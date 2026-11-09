import { generateClues } from './clues';
import { DIFFICULTY_CONFIG, DifficultyConfig } from './difficulty.config';
import { Difficulty, DifficultyLevel, computeDifficulty } from './difficulty';
import { SolverContradictionError, solveGrid } from './grid-solver';
import { Cell, Clues, Grid } from './types';

/** Dificultad esperada de un ejemplo; `unsolvable` = no resoluble por lógica. */
export type ExpectedLevel = DifficultyLevel | 'unsolvable';
export type ComputedLevel = ExpectedLevel;

export const LEVELS: readonly ExpectedLevel[] = ['easy', 'medium', 'hard', 'unsolvable'];

export interface CalibrationExample {
  readonly name: string;
  /** `null` = pendiente de etiquetar: se mide pero no cuenta en los aciertos. */
  readonly expected: ExpectedLevel | null;
  readonly clues: Clues;
}

export class ExampleFormatError extends Error {
  constructor(source: string, message: string) {
    super(`${source}: ${message}`);
    this.name = 'ExampleFormatError';
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function parseClueList(source: string, label: string, value: unknown): number[][] {
  if (!Array.isArray(value) || value.length === 0) throw new ExampleFormatError(source, `${label} debe ser una lista no vacía`);
  return value.map((clue, i) => {
    if (!Array.isArray(clue) || clue.length === 0 || !clue.every((n) => Number.isInteger(n) && n >= 0)) {
      throw new ExampleFormatError(source, `${label}[${i}] debe ser una lista de enteros >= 0`);
    }
    return clue as number[];
  });
}

function parseGrid(source: string, value: unknown): Grid {
  if (!Array.isArray(value) || value.length === 0 || !value.every((r) => typeof r === 'string' && /^[01]+$/.test(r))) {
    throw new ExampleFormatError(source, 'grid debe ser una lista de cadenas de 0/1');
  }
  const rows = value as string[];
  if (rows.some((r) => r.length !== rows[0].length)) throw new ExampleFormatError(source, 'todas las filas del grid deben medir lo mismo');
  return rows.map((r) => [...r].map((c): Cell => (c === '1' ? 1 : 0)));
}

/** Valida un JSON ya leído y lo convierte en ejemplo. `source` (nombre de fichero) solo sirve para los mensajes. */
export function parseExample(source: string, json: unknown): CalibrationExample {
  if (!isRecord(json)) throw new ExampleFormatError(source, 'el ejemplo debe ser un objeto');
  const { name, expected, grid, clues } = json;
  if (typeof name !== 'string' || name.trim() === '') throw new ExampleFormatError(source, 'falta "name"');
  if (expected !== undefined && !(typeof expected === 'string' && (LEVELS as readonly string[]).includes(expected))) {
    throw new ExampleFormatError(source, `"expected" debe ser ${LEVELS.join(' | ')}`);
  }
  if ((grid === undefined) === (clues === undefined)) throw new ExampleFormatError(source, 'debe tener "grid" o "clues" (uno solo)');

  let parsed: Clues;
  if (grid !== undefined) {
    parsed = generateClues(parseGrid(source, grid));
  } else {
    if (!isRecord(clues)) throw new ExampleFormatError(source, '"clues" debe ser { rows, cols }');
    parsed = { rows: parseClueList(source, 'clues.rows', clues['rows']), cols: parseClueList(source, 'clues.cols', clues['cols']) };
    const sum = (list: readonly (readonly number[])[]) => list.reduce((acc, c) => acc + c.reduce((a, n) => a + n, 0), 0);
    if (sum(parsed.rows) !== sum(parsed.cols)) {
      throw new ExampleFormatError(source, `la suma de las pistas de filas (${sum(parsed.rows)}) no coincide con la de columnas (${sum(parsed.cols)})`);
    }
  }
  return { name: name.trim(), expected: (expected as ExpectedLevel | undefined) ?? null, clues: parsed };
}

export interface Evaluation {
  readonly name: string;
  readonly expected: ExpectedLevel | null;
  readonly rows: number;
  readonly cols: number;
  /** `contradiction` = las pistas no son consistentes (no existe solución). */
  readonly status: 'ideal' | 'unsolvable' | 'contradiction';
  readonly difficulty: Difficulty | null;
  readonly computed: ComputedLevel | 'invalid';
  /** `null` si es pendiente. */
  readonly ok: boolean | null;
}

export function evaluateExample(example: CalibrationExample, cfg: DifficultyConfig = DIFFICULTY_CONFIG): Evaluation {
  const rows = example.clues.rows.length;
  const cols = example.clues.cols.length;
  let status: Evaluation['status'];
  let difficulty: Difficulty | null = null;
  try {
    const solved = solveGrid(example.clues);
    status = solved.status;
    difficulty = computeDifficulty(solved, cfg);
  } catch (e) {
    if (!(e instanceof SolverContradictionError)) throw e;
    status = 'contradiction';
  }
  const computed: Evaluation['computed'] = status === 'contradiction' ? 'invalid' : (difficulty?.level ?? 'unsolvable');
  const ok = example.expected === null ? null : computed === example.expected;
  return { name: example.name, expected: example.expected, rows, cols, status, difficulty, computed, ok };
}

export interface Summary {
  /** Ejemplos etiquetados (los pendientes y los inválidos no cuentan en el denominador de aciertos). */
  readonly labelled: number;
  readonly correct: number;
  readonly accuracy: number;
  /** matrix[calculada][esperada] → nº de ejemplos. */
  readonly matrix: Readonly<Record<ComputedLevel | 'invalid', Readonly<Record<ExpectedLevel, number>>>>;
}

export function summarize(evaluations: readonly Evaluation[]): Summary {
  const columns = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<ExpectedLevel, number>;
  const matrix = Object.fromEntries([...LEVELS, 'invalid'].map((l) => [l, { ...columns }])) as Record<ComputedLevel | 'invalid', Record<ExpectedLevel, number>>;
  let labelled = 0;
  let correct = 0;
  for (const e of evaluations) {
    if (e.expected === null) continue;
    labelled++;
    if (e.ok) correct++;
    matrix[e.computed][e.expected]++;
  }
  return { labelled, correct, accuracy: labelled > 0 ? correct / labelled : 1, matrix };
}

export interface ThresholdCandidate {
  readonly config: DifficultyConfig;
  readonly correct: number;
  readonly labelled: number;
  /** Cuánto se aleja de la configuración actual (menor = cambio más pequeño). */
  readonly distance: number;
}

const range = (from: number, to: number, step = 1): number[] => {
  const out: number[] = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};

/**
 * Prueba combinaciones de umbrales sobre los ejemplos etiquetados y devuelve las mejores
 * (más aciertos; a igualdad, las más cercanas a `base`). No aplica nada. Reproducible: orden estable.
 */
export function searchThresholds(
  examples: readonly CalibrationExample[],
  base: DifficultyConfig = DIFFICULTY_CONFIG,
  top = 10,
): ThresholdCandidate[] {
  const labelled = examples.filter((e) => e.expected !== null);
  // Los resultados del solver no dependen de los umbrales: se calculan una vez.
  const solved = labelled.map((e) => {
    try {
      const s = solveGrid(e.clues);
      return { expected: e.expected as ExpectedLevel, result: s };
    } catch {
      return { expected: e.expected as ExpectedLevel, result: null };
    }
  });
  const maxPasses = Math.max(1, ...solved.map((s) => s.result?.passes ?? 0));
  const sizes = [...new Set(solved.map((s) => (s.result ? Math.max(s.result.cells.length, s.result.cells[0].length) : 0)))].sort((a, b) => a - b);
  const sizeCuts = [Math.min(...sizes, 1) - 1, ...sizes];

  const candidates: ThresholdCandidate[] = [];
  for (const p1Zero of range(0, 100, 5)) {
    for (const p1One of range(0, p1Zero, 5)) {
      for (const nZero of range(0, maxPasses)) {
        for (const nOne of range(nZero, maxPasses)) {
          for (const tZero of sizeCuts) {
            for (const easyMax of range(0, 4)) {
              for (const mediumMax of range(easyMax, 5)) {
                const config: DifficultyConfig = {
                  p1: { zeroPointsMin: p1Zero, onePointMin: p1One },
                  passes: { zeroPointsMax: nZero, onePointMax: nOne },
                  size: { zeroPointsMax: tZero },
                  levels: { easyMax, mediumMax },
                };
                let correct = 0;
                for (const s of solved) {
                  const level = s.result ? (computeDifficulty(s.result, config)?.level ?? 'unsolvable') : 'invalid';
                  if (level === s.expected) correct++;
                }
                candidates.push({ config, correct, labelled: solved.length, distance: configDistance(config, base) });
              }
            }
          }
        }
      }
    }
  }
  candidates.sort((a, b) => b.correct - a.correct || a.distance - b.distance);
  return candidates.slice(0, top);
}

function configDistance(a: DifficultyConfig, b: DifficultyConfig): number {
  return (
    Math.abs(a.p1.zeroPointsMin - b.p1.zeroPointsMin) / 5 +
    Math.abs(a.p1.onePointMin - b.p1.onePointMin) / 5 +
    Math.abs(a.passes.zeroPointsMax - b.passes.zeroPointsMax) +
    Math.abs(a.passes.onePointMax - b.passes.onePointMax) +
    Math.abs(a.size.zeroPointsMax - b.size.zeroPointsMax) +
    Math.abs(a.levels.easyMax - b.levels.easyMax) +
    Math.abs(a.levels.mediumMax - b.levels.mediumMax)
  );
}
