// Comprueba el contraste WCAG AA de los pares texto/fondo de los tokens de `src/styles.css`.
// Texto normal: >= 4.5:1. Excepción (S10, color pedido por el usuario): texto blanco sobre el badge difícil, >= 3:1. Se ejecuta antes de `npm test`.
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
  ['color-badge-hard-text', 'color-badge-hard-bg'],
  ['color-text', 'color-badge-easy-bg'],
  ['color-text', 'color-badge-medium-bg'],
  ['color-possible-text', 'color-possible-bg'],
  ['color-impossible-text', 'color-impossible-bg'],
];

const EXCEPTIONS = new Set(['color-badge-hard-text|color-badge-hard-bg']);

const failures = [];
for (const [fg, bg] of PAIRS) {
  const a = tokens[fg];
  const b = tokens[bg];
  if (!a || !b) {
    failures.push(`token no encontrado: ${!a ? fg : bg}`);
    continue;
  }
  const r = ratio(a, b);
  const min = EXCEPTIONS.has(`${fg}|${bg}`) ? 3 : 4.5;
  if (r < min) failures.push(`--${fg} (${a}) sobre --${bg} (${b}): ${r.toFixed(2)}:1 < ${min}:1`);
}

if (failures.length) {
  console.error('Contraste AA insuficiente:\n' + failures.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}
console.log(`contraste AA OK (${PAIRS.length} pares de tokens, mínimo 4.5:1 salvo excepciones documentadas)`);
