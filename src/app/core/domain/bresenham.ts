export type Point = readonly [row: number, col: number];

/** Casillas de la línea entre dos puntos (ambos incluidos), sin huecos en diagonal. */
export function linePoints(from: Point, to: Point): Point[] {
  let [r, c] = from;
  const [r1, c1] = to;
  const dr = Math.abs(r1 - r);
  const dc = Math.abs(c1 - c);
  const sr = r < r1 ? 1 : -1;
  const sc = c < c1 ? 1 : -1;
  let err = dc - dr;
  const points: Point[] = [];
  for (;;) {
    points.push([r, c]);
    if (r === r1 && c === c1) return points;
    const e2 = 2 * err;
    if (e2 > -dr) {
      err -= dr;
      c += sc;
    }
    if (e2 < dc) {
      err += dc;
      r += sr;
    }
  }
}
