import { StrokeMode, Tool } from './drawing-store';

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Casilla [fila, columna] bajo un punto de pantalla, acotada al tablero. */
export function cellFromPoint(
  x: number,
  y: number,
  rect: Rect,
  rows: number,
  cols: number,
): [number, number] {
  if (rect.width <= 0 || rect.height <= 0) return [0, 0];
  const c = Math.floor(((x - rect.left) / rect.width) * cols);
  const r = Math.floor(((y - rect.top) / rect.height) * rows);
  return [clamp(r, 0, rows - 1), clamp(c, 0, cols - 1)];
}

/**
 * Qué hace cada botón del ratón (REQ-S05-04): con "Dibujar" el izquierdo pinta
 * y el derecho borra; con "Borrar" se invierte. Otros botones: nada.
 */
export function strokeModeFor(tool: Tool, button: number): StrokeMode | null {
  if (button !== 0 && button !== 2) return null;
  const primary: StrokeMode = tool === 'draw' ? 'paint' : 'erase';
  const secondary: StrokeMode = tool === 'draw' ? 'erase' : 'paint';
  return button === 0 ? primary : secondary;
}

/** Números de regla 1..n; con tableros grandes solo 1 y múltiplos de 5, para que quepan. */
export function rulerLabels(n: number): (number | null)[] {
  return Array.from({ length: n }, (_, i) => {
    const label = i + 1;
    return n <= 25 || label === 1 || label % 5 === 0 ? label : null;
  });
}
