/**
 * Umbrales de dificultad (nonograma-logica.txt §5), calibrados en S09 con los ejemplos de
 * `docs/calibration/examples` (`npm run calibrate`). Se ajustan aquí y solo aquí.
 */
export interface DifficultyConfig {
  /** P1 (% resuelto en la 1ª pasada): >= easyMin → 0 pts; >= mediumMin → 1 pt; si no → 2 pts. */
  readonly p1: { readonly zeroPointsMin: number; readonly onePointMin: number };
  /** N (pasadas): <= zeroPointsMax → 0 pts; <= onePointMax → 1 pt; si no → 2 pts. */
  readonly passes: { readonly zeroPointsMax: number; readonly onePointMax: number };
  /** T (lado mayor): <= zeroPointsMax → 0 pts; si no → 1 pt. */
  readonly size: { readonly zeroPointsMax: number };
  /** Total: <= easyMax → fácil; <= mediumMax → medio; si no → difícil. */
  readonly levels: { readonly easyMax: number; readonly mediumMax: number };
}

export const DIFFICULTY_CONFIG: DifficultyConfig = {
  p1: { zeroPointsMin: 80, onePointMin: 30 },
  passes: { zeroPointsMax: 4, onePointMax: 8 },
  size: { zeroPointsMax: 15 },
  levels: { easyMax: 1, mediumMax: 3 },
};
