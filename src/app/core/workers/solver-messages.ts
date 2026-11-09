import { AnalysisResult } from '../domain/analysis';
import { Grid } from '../domain/types';

export interface SolverRequest {
  readonly id: number;
  readonly grid: Grid;
}

export type SolverResponse =
  | { readonly id: number; readonly result: AnalysisResult }
  | { readonly id: number; readonly error: string };
