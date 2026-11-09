// Calibración de dificultad (S09). Uso:
//   npm run calibrate            tabla + resumen + matriz de confusión
//   npm run calibrate -- --search   propone umbrales (no los aplica)
//   node scripts/calibrate.mjs --check   falla si algún ejemplo etiquetado no da su dificultad (regresión, en `npm test`)
// Reutiliza el dominio TS puro empaquetándolo con esbuild (dependencia transitiva del CLI de Angular).
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSync } from 'esbuild';

const EXAMPLES_DIR = 'docs/calibration/examples';
const OUT = join('node_modules', '.cache', 'calibrate', 'domain.mjs');
const args = new Set(process.argv.slice(2));

mkdirSync(join('node_modules', '.cache', 'calibrate'), { recursive: true });
buildSync({ entryPoints: ['src/app/core/domain/index.ts'], bundle: true, format: 'esm', platform: 'node', outfile: OUT, logLevel: 'error' });
const domain = await import(pathToFileURL(OUT).href);

const files = readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.json')).sort();
const examples = [];
const errors = [];
for (const file of files) {
  try {
    examples.push(domain.parseExample(file, JSON.parse(readFileSync(join(EXAMPLES_DIR, file), 'utf8'))));
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }
}
if (errors.length) {
  console.error('Ejemplos inválidos:\n' + errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}

const cfg = domain.DIFFICULTY_CONFIG;
const evaluations = examples.map((e) => domain.evaluateExample(e, cfg));
const summary = domain.summarize(evaluations);

if (args.has('--check')) {
  const bad = evaluations.filter((e) => e.ok === false || e.computed === 'invalid');
  if (bad.length) {
    console.error(
      'Regresión de calibración:\n' + bad.map((e) => ` - ${e.name}: esperada ${e.expected ?? '—'}, calculada ${e.computed}`).join('\n'),
    );
    process.exit(1);
  }
  console.log(`calibración OK (${summary.correct}/${summary.labelled} etiquetados, ${evaluations.length - summary.labelled} pendientes)`);
  process.exit(0);
}

const pad = (v, n) => String(v).padEnd(n);
const rpad = (v, n) => String(v).padStart(n);
const mark = (e) => (e.ok === null ? '?' : e.ok ? '✔' : '✘');
const lines = [
  [pad('nombre', 22), pad('tamaño', 7), rpad('P1%', 6), rpad('N', 3), rpad('T', 3), pad('  pts(P1/N/T)', 14), rpad('total', 5), pad(' calculada', 12), pad('esperada', 11), ''].join(' '),
];
for (const e of evaluations) {
  const d = e.difficulty;
  lines.push(
    [
      pad(e.name, 22),
      pad(`${e.cols}x${e.rows}`, 7),
      rpad(d ? d.metrics.p1.toFixed(1) : '–', 6),
      rpad(d ? d.metrics.n : '–', 3),
      rpad(d ? d.metrics.t : '–', 3),
      pad(d ? `  ${d.points.p1}/${d.points.n}/${d.points.t}` : '', 14),
      rpad(d ? d.score : '–', 5),
      pad(` ${e.computed}${e.status === 'unsolvable' ? '' : ''}`, 12),
      pad(e.expected ?? 'pendiente', 11),
      mark(e),
    ].join(' '),
  );
}
console.log(lines.join('\n'));
console.log(
  `\nAciertos: ${summary.correct}/${summary.labelled} (${(summary.accuracy * 100).toFixed(0)} %)  ·  pendientes: ${evaluations.length - summary.labelled}`,
);

console.log('\nMatriz de confusión (filas = calculada, columnas = esperada):');
const levels = domain.LEVELS;
console.log(['              ', ...levels.map((l) => rpad(l, 10))].join(' '));
for (const computed of [...levels, 'invalid']) {
  console.log([pad(computed, 14), ...levels.map((l) => rpad(summary.matrix[computed][l], 10))].join(' '));
}

if (args.has('--search')) {
  console.log('\nBúsqueda de umbrales (no se aplica nada):');
  const top = domain.searchThresholds(examples, cfg, 10);
  top.forEach((c, i) => {
    const k = c.config;
    console.log(
      `${rpad(i + 1, 2)}. ${c.correct}/${c.labelled}  P1 ≥${k.p1.zeroPointsMin}→0, ≥${k.p1.onePointMin}→1 · N ≤${k.passes.zeroPointsMax}→0, ≤${k.passes.onePointMax}→1 · T ≤${k.size.zeroPointsMax}→0 · total ≤${k.levels.easyMax} fácil, ≤${k.levels.mediumMax} medio  (cambio: ${c.distance.toFixed(1)})`,
    );
  });
}
