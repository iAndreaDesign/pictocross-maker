/// <reference lib="webworker" />

import { analyzeGrid } from '../domain/analysis';
import { SolverRequest, SolverResponse } from './solver-messages';

addEventListener('message', ({ data }: MessageEvent<SolverRequest>) => {
  let response: SolverResponse;
  try {
    response = { id: data.id, result: analyzeGrid(data.grid) };
  } catch (error) {
    response = { id: data.id, error: error instanceof Error ? error.message : String(error) };
  }
  postMessage(response);
});
