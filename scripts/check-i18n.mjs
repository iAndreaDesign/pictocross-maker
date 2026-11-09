// Comprobaciones de i18n (se ejecuta antes de `npm test`):
//  1. Toda clave usada (pipe `transloco`, t('..'), translate('..')) existe en es.json.
//  2. Ninguna plantilla (.html o `template:` inline) tiene texto de UI escrito a mano
//     (texto suelto ni atributos aria-label/title/alt/placeholder/label sin enlazar).
//  3. Ninguna clave de es.json queda sin usar.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/app';
const es = JSON.parse(readFileSync('src/assets/i18n/es.json', 'utf8'));

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
const allKeys = new Set(flatten(es));
const has = (key) => allKeys.has(key);

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|ts)$/.test(f) && !f.endsWith('.spec.ts')) files.push(p);
  }
})(root);

const keyPatterns = [/['"]([\w.-]+)['"]\s*\|\s*transloco/g, /\b(?:t|translate)\(\s*['"]([\w.-]+)['"]/g];
const used = new Set();
const errors = [];

/** Texto visible de una plantilla: sin interpolaciones, comentarios, etiquetas ni control flow. */
function hardcodedText(template) {
  const found = [];
  const clean = template
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{[\s\S]*?\}\}/g, '');
  for (const m of clean.matchAll(/\s(?:aria-label|aria-description|title|alt|placeholder|label)="([^"]*)"/g)) {
    if (/\p{L}{2,}/u.test(m[1])) found.push(`atributo: "${m[1]}"`);
  }
  const text = clean
    // etiquetas (con sus atributos, que pueden llevar '>' entre comillas) separan nodos de texto
    .replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '\u0000')
    .replace(/@(?:if|else if|else|for|switch|case|default|empty|placeholder|loading|error|defer)\b[^{\n]*\{?/g, '\u0000')
    .replace(/[{}]/g, '\u0000');
  for (const piece of text.split('\u0000')) {
    const t = piece.trim();
    if (/\p{L}{2,}/u.test(t)) found.push(`texto: "${t}"`);
  }
  return found;
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const re of keyPatterns) {
    for (const m of src.matchAll(re)) {
      used.add(m[1]);
      if (!has(m[1])) errors.push(`${file}: clave sin traducción "${m[1]}"`);
    }
  }
  const templates = file.endsWith('.html')
    ? [src]
    : [...src.matchAll(/template:\s*`([\s\S]*?)`/g)].map((m) => m[1]);
  for (const template of templates) {
    for (const hit of hardcodedText(template)) errors.push(`${file}: ${hit} (usa una clave de i18n)`);
  }
}

for (const key of allKeys) if (!used.has(key)) errors.push(`es.json: clave sin usar "${key}"`);

if (errors.length) {
  console.error('Problemas de i18n:\n' + errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`i18n OK (${files.length} ficheros, ${allKeys.size} claves, todas usadas)`);
