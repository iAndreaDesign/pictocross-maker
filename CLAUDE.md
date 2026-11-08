# Nonogram Maker

Aplicación web para dibujar un pixel-art en una cuadrícula (hasta 50x50), generar sus pistas de nonograma, validar si se resuelve **solo por lógica** y exportar el resultado (PNG/PDF). Sin backend ni base de datos.

## Fuente de verdad
1. `nonograma-logica.txt` — reglas de dominio (pistas, solucionador, dificultad, flujo, PDF). Si el código y este documento discrepan, gana el documento hasta que se actualice explícitamente.
2. `docs/specs/*.md` — una spec por scope, con requisitos (REQ-xxx), criterios de aceptación y tareas.
3. Figma: https://www.figma.com/design/BBDh2z0KhAymBQ64eSMsXM/Pictocross-maker (fileKey `BBDh2z0KhAymBQ64eSMsXM`). Fuente de verdad visual; usar el MCP `figma` (requiere `/mcp` → Authenticate).

## Figma: conexión mínima (hook obligatorio)
- Un hook `PreToolUse` (`.claude/hooks/figma-guard.mjs`) **pregunta al humano en cada llamada** al MCP de Figma. Política completa: `docs/sdd/figma-policy.md`.
- Antes de llamar: 1) mirar la spec, 2) mirar `docs/design/cache/`, 3) elegir la herramienta y el nodo más pequeños. Si ya está, no se llama.
- **Justificar primero, en una frase**: qué dato falta, por qué no sale de spec/caché y qué llamada se hará. Si se rechaza, no reintentar por otra vía: preguntar.
- Después de llamar, guardar lo relevante en `docs/design/cache/`. Solo lectura: nada de herramientas de escritura de Figma.

## Metodología: SDD (Spec-Driven Development)
Flujo obligatorio por scope: **Spec → Tareas → Implementación → Verificación → Cierre**.
- No se escribe código de un scope sin spec en estado `approved`.
- Se trabaja **un scope a la vez**, en el orden de `docs/sdd/scopes.md`, y **una tarea a la vez**.
- Cada tarea referencia los REQ que cubre y termina con sus tests en verde.
- Si durante la implementación se descubre un hueco en la spec: parar, actualizar la spec, y seguir. Nunca divergir en silencio.
- Al cerrar una tarea: marcar `[x]` en la spec y actualizar el estado en `docs/sdd/scopes.md`.
- Detalle del proceso: `docs/sdd/process.md`.

### Una tarea = una rama = una PR (obligatorio)
- Cada tarea (`Txx.y`) se implementa en su **propia rama** (`feat/Sxx-Txx.y-slug`) y termina en **una PR** que cubre solo esa tarea.
- **Antes de abrir la PR hay que validarla con el humano**: Claude presenta el resumen (qué hace, REQ cubiertos, tests, capturas si hay UI) y espera aprobación explícita. Sin "ok" no se hace commit de la PR, push ni `gh pr create`.
- La PR la abre Claude solo tras la aprobación; **el merge lo hace el humano**. No se empieza la tarea siguiente hasta que la anterior esté aprobada.
- Descripción de PR: tarea, REQ, criterios de aceptación marcados, cómo probar. Commits convencionales con prefijo del scope.

 ## Stack
- Angular (última versión estable), standalone components, **zoneless**, `ChangeDetectionStrategy.OnPush`.
- **Signals** para todo el estado: `signal`, `computed`, `effect` (solo para efectos laterales), `input()`, `output()`, `model()`, `viewChild()`. Nada de `@Input/@Output` decoradores ni `BehaviorSubject` para estado de UI.
- Control flow nativo (`@if`, `@for`, `@switch`); `@for` siempre con `track`.
- TypeScript `strict`. Sin `any`.
- Tests: runner por defecto del CLI de Angular (Vitest si es el default de la versión instalada).
- PDF: `jspdf`. PNG: Canvas API. Solver en **Web Worker**.
- Sin base de datos. Persistencia opcional del borrador en `localStorage` (scope S08).

## Arquitectura
```
src/app/
  core/domain/      # TS puro, SIN Angular: clues, line-solver, grid-solver, difficulty, tipos
  core/workers/     # solver.worker.ts + cliente (servicio) que lo envuelve
  features/editor/  # grid de dibujo, selector de tamaño, herramientas
  features/preview/ # render de pistas, indicador ideal/no resoluble, dificultad
  features/export/  # exportadores PNG/PDF
  shared/           # UI reutilizable, tokens de diseño
```
Reglas:
- `core/domain` no importa de `@angular/*`; es testeable con tests unitarios puros.
- Estado del dibujo en un único store con signals (`DrawingStore`); el resto deriva con `computed`.
- El solver nunca corre en el hilo principal para tableros grandes; el recálculo va con debounce (~150 ms).
- Un componente = un fichero `.ts` con template/estilos inline si son cortos; separar si pasan de ~50 líneas.

## Reglas de dominio que NO se negocian
- Sin backtracking ni adivinanzas: solo resolución por líneas (DP). Resultado binario: **ideal** (verde) / **no resoluble** (rojo).
- Línea vacía → pista `[0]`.
- Casillas desconocidas tras el solver → resaltado rojo.
- Dificultad solo si es ideal: puntuación P1/N/T según sección 5 del documento (umbrales provisionales → constantes configurables en un único fichero).
- Tamaño máx. 50x50.

## Diseño y marca
- Usar siempre los colores corporativos del Figma como tokens CSS (`var(--color-*)`, definidos en S01). Prohibido hardcodear colores en componentes.
- Tipografías: Fraunces Black (títulos) e Inter (UI). Marca: "PICTOCROSS MAKER · Puzzle Atelier".
- Editor y preview son dos paneles; la preview (derecha) se actualiza en tiempo real y es lo que se exporta.
- Dibujo por defecto al abrir: el logo 10x10 (ver S05).

## Convenciones
- Nombres de código en inglés; textos de UI en español **vía i18n desde el primer día** (claves, nunca texto hardcodeado en plantillas; ver S01).
- Ficheros en kebab-case: `drawing-store.ts`, `line-solver.ts`, `line-solver.spec.ts`.
- Commits convencionales (`feat(S03): ...`). El prefijo es el ID del scope.
- Accesibilidad: el grid debe poder pintarse con puntero y teclado; contraste AA.

## Comandos (tras S01)
```
npm start        # dev server
npm test         # tests unitarios
npm run build    # build de producción
npm run lint
```

## Qué NO hacer
- No añadir backend, auth ni base de datos.
- No añadir librerías sin justificarlo en la spec del scope.
- No implementar fuera del scope activo.
- No tocar `nonograma-logica.txt` sin pedirlo; si hay que cambiar una regla, se propone y se actualiza spec + doc.
- No hacer PR sin validar primero con el humano (ver "Una tarea = una rama = una PR").
- No llamar a Figma sin pasar por la política de conexión mínima.
