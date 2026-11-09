// Comprueba el contraste WCAG AA de los pares texto/fondo de los tokens de `src/styles.css`.
// Texto normal: >= 4.5:1. Se ejecuta antes de `npm test`.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const tokens = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2].toLowerCase()]),
);

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [texto, fondo] — todos los pares reales de la UI.
const PAIRS = [
  ['color-text', 'color-surface'],
  ['color-text', 'color-page'],
  ['color-text', 'color-header'],
  ['color-text', 'color-input'],
  ['color-text', 'color-clue-band'],
  ['color-text', 'color-preview-bg'],
  ['color-text-muted', 'color-surface'],
  ['color-text-muted', 'color-page'],
  ['color-text-muted', 'color-header'],
  ['color-text-muted', 'color-input'],
  ['color-on-accent', 'color-accent'],
  ['color-possible-text', 'color-possible-bg'],
  ['color-impossible-text', 'color-impossible-bg'],
];

const failures = [];
for (const [fg, bg] of PAIRS) {
  const a = tokens[fg];
  const b = tokens[bg];
  if (!a || !b) {
    failures.push(`token no encontrado: ${!a ? fg : bg}`);
    continue;
  }
  const r = ratio(a, b);
  if (r < 4.5) failures.push(`--${fg} (${a}) sobre --${bg} (${b}): ${r.toFixed(2)}:1 < 4.5:1`);
}

if (failures.length) {
  console.error('Contraste AA insuficiente:\n' + failures.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}
console.log(`contraste AA OK (${PAIRS.length} pares de tokens >= 4.5:1)`);
