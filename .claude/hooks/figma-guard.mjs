#!/usr/bin/env node
// PreToolUse hook para el MCP de Figma (matcher: mcp__figma__.*).
// Siempre pregunta al usuario antes de conectarse a Figma, y le muestra
// qué herramienta, qué nodo y cuánto "pesa" la llamada. Política: docs/sdd/figma-policy.md
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const READ_LIGHT = new Set(['get_metadata', 'get_screenshot', 'get_variable_defs', 'whoami', 'create_session', 'get_libraries', 'search_design_system']);
const READ_HEAVY = new Set(['get_design_context', 'get_figjam', 'download_assets', 'get_code_connect_map', 'get_code_connect_suggestions', 'get_context_for_code_connect', 'get_motion_context']);

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  // Sin payload legible: pedimos confirmación igualmente.
}

const fullName = String(input.tool_name ?? '');
const tool = fullName.replace(/^mcp__figma__/, '');
const args = input.tool_input ?? {};
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

const nodeId = args.nodeId ? String(args.nodeId).replace('-', ':') : undefined;
const fileKey = args.fileKey ? String(args.fileKey) : undefined;

let kind;
if (READ_LIGHT.has(tool)) kind = 'LECTURA LIGERA';
else if (READ_HEAVY.has(tool)) kind = 'LECTURA PESADA';
else kind = 'ESCRITURA / OTRA (este proyecto solo LEE de Figma)';

const warnings = [];
if (!fileKey && tool !== 'whoami') warnings.push('Sin fileKey explícito.');
if (!nodeId && ['get_design_context', 'get_screenshot', 'get_variable_defs'].includes(tool)) {
  warnings.push('Sin nodeId: la herramienta necesita un nodo concreto.');
}
if (tool === 'get_design_context' && args.excludeScreenshot !== true) {
  warnings.push('Incluye captura de pantalla (más tokens). ¿Hace falta?');
}
if (tool === 'get_screenshot' && Number(args.maxDimension ?? 1024) > 1024) {
  warnings.push(`maxDimension=${args.maxDimension} (> 1024): captura grande.`);
}
if (tool === 'get_screenshot' && args.enableBase64Response === true) {
  warnings.push('Respuesta base64 inline: usar solo si no hay otra forma de ver la imagen.');
}
if (kind.startsWith('ESCRITURA')) {
  warnings.push('Puede MODIFICAR el archivo de Figma o crear ficheros. Fuera de la política del proyecto.');
}

// Comprobación mínima: ¿ya tenemos este nodo en la caché local?
let cached = [];
if (fileKey && nodeId) {
  const cacheDir = join(projectDir, 'docs', 'design', 'cache');
  const prefix = `${fileKey}_${nodeId.replace(':', '-')}`;
  if (existsSync(cacheDir)) {
    cached = readdirSync(cacheDir).filter((f) => f.startsWith(prefix));
  }
}
if (cached.length > 0) {
  warnings.push(`YA EXISTE caché local de este nodo: docs/design/cache/${cached.join(', ')}. Lo normal es leer eso en vez de llamar a Figma.`);
}

const target = [fileKey && `fileKey=${fileKey}`, nodeId && `nodeId=${nodeId}`].filter(Boolean).join(' ') || '(sin objetivo)';

const reason = [
  `Conexión a Figma: ${tool}`,
  `Tipo: ${kind}`,
  `Objetivo: ${target}`,
  warnings.length ? `Avisos:\n - ${warnings.join('\n - ')}` : 'Avisos: ninguno',
  '¿Claude te ha justificado antes por qué hace falta esta llamada? Si no, recházala.',
].join('\n');

const context = [
  'POLÍTICA FIGMA (docs/sdd/figma-policy.md): antes de esta llamada debes haber dicho al usuario, en una frase:',
  '(1) qué dato concreto necesitas, (2) por qué no sale de la spec o de docs/design/cache, (3) la herramienta y el nodo más pequeño que lo cubren.',
  'Si el usuario rechaza la llamada, NO la reintentes con otra herramienta equivalente: pregunta. Tras una llamada correcta, guarda el resultado relevante en docs/design/cache/.',
].join(' ');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: reason,
      additionalContext: context,
    },
  }),
);
