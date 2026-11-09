import { DIFFICULTY_CONFIG, DifficultyConfig } from './difficulty.config';
import { SolveResult } from './solver-types';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Difficulty {
  readonly level: DifficultyLevel;
  /** Puntuación total (0–5). */
  readonly score: number;
  /** Métricas sin redondear (P1 en %). */
  readonly metrics: { readonly p1: number; readonly n: number; readonly t: number };
  readonly points: { readonly p1: number; readonly n: number; readonly t: number };
}

export function pointsForP1(p1: number, cfg: DifficultyConfig = DIFFICULTY_CONFIG): number {
  if (p1 >= cfg.p1.zeroPointsMin) return 0;
  if (p1 >= cfg.p1.onePointMin) return 1;
  return 2;
}

export function pointsForPasses(n: number, cfg: DifficultyConfig = DIFFICULTY_CONFIG): number {
  if (n <= cfg.passes.zeroPointsMax) return 0;
  if (n <= cfg.passes.onePointMax) return 1;
  return 2;
}

export function pointsForSize(t: number, cfg: DifficultyConfig = DIFFICULTY_CONFIG): number {
  return t <= cfg.size.zeroPointsMax ? 0 : 1;
}

export function levelForScore(score: number, cfg: DifficultyConfig = DIFFICULTY_CONFIG): DifficultyLevel {
  if (score <= cfg.levels.easyMax) return 'easy';
  if (score <= cfg.levels.mediumMax) return 'medium';
  return 'hard';
}

/** Dificultad de un nonograma ideal; `null` si no es resoluble por lógica. */
export function computeDifficulty(
  result: SolveResult,
  cfg: DifficultyConfig = DIFFICULTY_CONFIG,
): Difficulty | null {
  if (result.status !== 'ideal') return null;
  const rows = result.cells.length;
  const cols = rows > 0 ? result.cells[0].length : 0;
  const total = rows * cols;
  const p1 = total > 0 ? (result.solvedAfterFirstPass / total) * 100 : 100;
  const n = result.passes;
  const t = Math.max(rows, cols);
  const points = { p1: pointsForP1(p1, cfg), n: pointsForPasses(n, cfg), t: pointsForSize(t, cfg) };
  const score = points.p1 + points.n + points.t;
  return { level: levelForScore(score, cfg), score, metrics: { p1, n, t }, points };
}
