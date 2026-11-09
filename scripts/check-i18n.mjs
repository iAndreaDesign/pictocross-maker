// Falla si una clave usada en plantillas/TS (pipe `transloco`, t('..'), translate('..')) no existe en es.json.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/app';
const es = JSON.parse(readFileSync('src/assets/i18n/es.json', 'utf8'));
const has = (key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), es) !== undefined;

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|ts)$/.test(f) && !f.endsWith('.spec.ts')) files.push(p);
  }
})(root);

const patterns = [/['"]([\w.-]+)['"]\s*\|\s*transloco/g, /\b(?:t|translate)\(\s*['"]([\w.-]+)['"]/g];
const missing = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const re of patterns) for (const m of src.matchAll(re)) if (!has(m[1])) missing.push(`${file}: ${m[1]}`);
}
if (missing.length) {
  console.error('Claves i18n sin traducción en es.json:\n' + missing.join('\n'));
  process.exit(1);
}
console.log(`i18n OK (${files.length} ficheros revisados)`);
