# S01 — Scaffold y tooling
Estado: done | Depende de: —

## Objetivo
Proyecto Angular funcionando con la configuración base (signals, zoneless, tests, lint) y la estructura de carpetas de `CLAUDE.md`.

## Alcance
Crear app, configurar zoneless/OnPush, estructura de carpetas, scripts npm, test de humo.
## Fuera de alcance
Cualquier lógica de nonogramas o UI real.

## Requisitos
- REQ-S01-01: App Angular última versión estable, standalone, sin NgModules.
- REQ-S01-02: Zoneless (`provideZonelessChangeDetection` o default de la versión) y OnPush por defecto en schematics.
- REQ-S01-03: TypeScript strict habilitado.
- REQ-S01-04: Estructura `core/domain`, `core/workers`, `features/*`, `shared`.
- REQ-S01-05: Scripts `start`, `test`, `build`, `lint` operativos.
- REQ-S01-06: **Tokens de marca** (colores corporativos del Figma) como CSS custom properties en `styles.css`, con los valores de la sección Decisiones. Ningún componente usa colores hardcodeados: solo `var(--...)`.
- REQ-S01-07: Tipografías de marca: Fraunces (Black, títulos) e Inter (SemiBold/Regular, UI), autoalojadas (p. ej. `@fontsource`) para no depender de CDN en runtime.
- REQ-S01-09: **i18n desde el principio**: ningún texto de UI hardcodeado en plantillas; todo por claves. Idioma por defecto español (`es`), estructura lista para añadir idiomas (ficheros por locale). Librería de i18n con cambio en runtime y soporte de signals (propuesta: Transloco; alternativa: i18n nativo de Angular, que compila una build por idioma). Decidir y justificar en T01.8.
- REQ-S01-10: **Repositorio y flujo de PR**: el proyecto no es aún un repo git. Inicializar git, remoto en GitHub (a confirmar con el usuario), rama `main`, plantilla de PR (`.github/pull_request_template.md`) con tarea, REQ, criterios y cómo probar. Una tarea = una rama = una PR, validada antes con el humano (ver `CLAUDE.md`).
- REQ-S01-08: Logo de marca (Figma `4:1027`) exportado como SVG a `src/assets/` y favicon derivado.

## Criterios de aceptación
- [x] `npm start` sirve una página con título "Nonogram Maker".
- [x] `npm test` ejecuta al menos 1 test en verde.
- [x] `npm run build` y `npm run lint` pasan.

## Tareas
- [x] T01.0 (REQ-S01-10) `git init`, `.gitignore`, remoto y plantilla de PR — Hecho: `git init -b main`, remoto `origin` = https://github.com/iAndreaDesign/nanogram-maker.git, `.gitignore` (commit base en `main`), plantilla de PR y documentación SDD inicial en la PR 0.
- [x] T01.1 (REQ-S01-01/02/03) `ng new` en la raíz sin romper `CLAUDE.md`/`docs/` — Hecho: Angular 22.2 (standalone, zoneless por defecto, sin router ni SSR), `strict: true` explícito, schematic de componentes con OnPush, Vitest como runner; compila y 1 test en verde.
- [x] T01.2 (REQ-S01-04) Crear carpetas con `.gitkeep`/README mínimo. — Hecho: `core/domain`, `core/workers`, `features/{editor,preview,export}`, `shared` con `.gitkeep`.
- [x] T01.3 (REQ-S01-05) Añadir ESLint (angular-eslint) y scripts. — Hecho: angular-eslint (`ng add`), `npm run lint` pasa.
- [x] T01.4 (REQ-S01-06) `styles.css` con tokens de marca. — Hecho: tokens y radios en `src/styles.css`. `--color-page` = `#EADED5` (dado por el usuario; el Figma no tiene variables).
- [x] T01.5 (REQ-S01-07) Fuentes autoalojadas. — Hecho: `@fontsource/fraunces` (900) e `@fontsource/inter` (400, 600), subset latin, importadas en `styles.css`.
- [x] T01.6 (REQ-S01-08) Descargar logo SVG desde Figma (MCP) a assets. — Hecho: `src/assets/logo.svg` (nodo `4:1027`, sin rect de fondo) y `public/favicon.svg`; `angular.json` sirve `src/assets` en `/assets`.
- [x] T01.7 Test de humo del `App` component. — Hecho: `app.spec.ts` (crea el componente y renderiza la marca traducida).
- [x] T01.8 (REQ-S01-09) Elegir e instalar i18n, `es.json` inicial y test que falla si hay una clave usada sin traducción. — Hecho: Transloco 8 (runtime + signals; el i18n nativo exige una build por idioma). `src/assets/i18n/es.json`, `shared/i18n/`, `scripts/check-i18n.mjs` (encadenado en `npm test`) y handler que lanza en los tests.

## Decisiones
Paleta extraída del Figma (nodos `4:607`, `4:656`, `4:890`). Los nombres son propuesta; los valores son del diseño:

| Token | Valor | Uso |
|---|---|---|
| `--color-header` | `#edccb4` | Fondo cabecera, badge dificultad, botón "Export solution" del panel |
| `--color-accent` | `#d67747` | Botones primarios (Export PDF/PNG), logo |
| `--color-text` | `#46352d` | Texto principal |
| `--color-text-muted` | `#806d60` | Texto secundario, "Puzzle Atelier" |
| `--color-border` | `#d6c4b5` | Bordes de barra, inputs, botones secundarios |
| `--color-divider` | `#c5b4a5` | Separador vertical |
| `--color-surface` | `#fcf6ee` | Barra de configuración, botones secundarios |
| `--color-input` | `#fffdf7` | Fondo de campos numéricos |
| `--color-possible-bg` / `-text` | `#DCE5CC` / `#435738` | Badge "Puzzle posible" |
| `--color-impossible-bg` / `-text` | `#E20000` / `#FFFFFF` | Badge "Puzzle imposible" y casillas irresolubles |
| `--color-grid-line` | `rgba(0,0,0,0.8)` | Líneas de la cuadrícula de la preview y exportaciones |
| `--color-preview-bg` | `#FFFFFF` | Fondo de la preview (sustituye al `#EADED5` de la referencia) |
| `--color-cell-filled` | `#9E5139` | Casilla pintada (editor y preview/exportaciones). Medido en la imagen de referencia de la preview |
| `--color-clue-band` | `#F2D7C4` | Bandas alternas de pistas (filas y columnas) en la preview |
| `--color-cross` | `#D77A4B` | Cruces en las casillas blancas de la solución |
| `--color-page` | `#EADED5` (confirmado por el usuario) | Fondo de página |

Radios: botones 10 px, inputs 8 px, badges 100 px. Fuentes: Fraunces Black 28 px/-1 px (título), Inter 13 px SemiBold (botones).
Los tokens "por extraer" se completan en T01.4 leyendo el Figma.
