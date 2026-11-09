# S10 — Últimos retoques
Estado: draft | Depende de: S08, S09

## Objetivo
Pequeños ajustes visuales y de exportación pedidos por el usuario tras S08/S09: líneas del editor, colores de dificultad, nombres de fichero, texto blanco en botones de acento, responsive móvil y botón "Exportar solución" en la cabecera del proyecto.

## Alcance / Fuera de alcance
- Alcance: solo los ajustes listados en los requisitos.
- Fuera de alcance: cambios de dominio (solver, dificultad), nuevas funciones, nuevos idiomas.

## Requisitos
- REQ-S10-01: **Líneas del editor.** Las líneas finas entre casillas **vacías** del canvas del editor pasan a `#EDEDEC` (token `--color-cell-line`) para distinguirse más. Las líneas junto a casillas pintadas y las reglas cada 5 no cambian.
- REQ-S10-02: **Badge de dificultad con 3 colores** (tokens nuevos en `styles.css`): fácil `#EBDED5`, medio `#EDCCB4`, difícil `#C97C68` con **texto blanco**. Fácil y medio mantienen el texto de marca (`--color-text`).
- REQ-S10-03: **Nombre de fichero.** Si el proyecto tiene nombre, PNG y PDF se descargan como `nombre.png` / `nombre.pdf` y la solución como `nombre-solucion.png`. Sin nombre se mantiene `nonograma-{filas}x{cols}`. (El nombre se normaliza a minúsculas/guiones sin tildes para ser un nombre de fichero válido: `Mi Dibujo` → `mi-dibujo.png`.)
- REQ-S10-04: **Texto blanco en botones de acento.** Todo elemento con fondo `#D67747` (`--color-accent`: botones primarios, segmento activo de orientación, herramienta activa, etc.) usa texto/icono blanco (`--color-on-accent: #FFFFFF`).
- REQ-S10-05: **Responsive móvil (< 450 px).** Márgenes y rellenos laterales/verticales de página y tarjetas a **8 px** (`--page-gutter` y padding de tarjetas del editor y de la preview, de la barra de configuración y del `main`). En `config-bar`, la clase `.group` pasa a `gap: 0`. Sin scroll horizontal a 320 y 449 px. Entre 450 y 959 px no cambia lo hecho en S08.
- REQ-S10-06: **"Exportar solución" en la cabecera.** El botón aparece también en la cabecera del proyecto (`app-export-bar`), como **primero de todos** (antes de orientación, PDF y PNG). En la preview se mantiene en escritorio.
- REQ-S10-07: **Móvil (< 450 px): "Exportar solución" desaparece de la preview** y solo queda el de la cabecera.

## Criterios de aceptación
- [ ] El canvas del editor dibuja las líneas vacías con `#EDEDEC`.
- [ ] Los badges fácil / medio / difícil muestran los tres fondos indicados; difícil con texto blanco.
- [ ] Con nombre "Mi Dibujo": descargas `mi-dibujo.png`, `mi-dibujo.pdf`, `mi-dibujo-solucion.png`; sin nombre, `nonograma-{f}x{c}…`.
- [ ] No queda ningún botón con fondo `--color-accent` y texto oscuro.
- [ ] A < 450 px márgenes y padding son 8 px y `.group` no tiene gap; sin scroll horizontal a 320 px.
- [ ] "Exportar solución" es el primer botón de la cabecera en todos los anchos; en la preview solo ≥ 450 px.
- [ ] `npm test`, `npm run lint` y `npm run build` en verde.

## Tareas
- [ ] T10.1 (REQ-S10-01) Token `--color-cell-line` → `#EDEDEC` (+ spec S01 tabla de tokens y test del grid si aplica) — Hecho cuando: tests del grid en verde.
- [ ] T10.2 (REQ-S10-02) Tokens y clases `badge-easy|medium|hard` en la preview — Hecho cuando: test de preview comprueba la clase por nivel.
- [ ] T10.3 (REQ-S10-03) Verificar/ajustar `exportFileName` y cubrir con tests nombre / sin nombre / solución / PDF — Hecho cuando: tests de `export-layout` y `export.service` en verde.
- [ ] T10.4 (REQ-S10-04) `--color-on-accent: #FFFFFF`; ajustar `scripts/check-contrast.mjs` (ver Decisiones) — Hecho cuando: `npm test` en verde.
- [ ] T10.5 (REQ-S10-05) Media query `max-width: 449px` con gutter/padding 8 px y `.group { gap: 0 }` — Hecho cuando: captura a 320 y 449 px sin scroll horizontal.
- [ ] T10.6 (REQ-S10-06/07) Botón "Exportar solución" primero en `export-bar` y oculto en la preview a < 450 px — Hecho cuando: tests de `export-bar` y `preview` en verde y verificado en navegador.

## Decisiones
- **Contraste (a confirmar):** blanco sobre `#D67747` da ~3,2:1 y sobre `#C97C68` ~3,2:1, por debajo de AA para texto normal (4,5:1). En S08 se había oscurecido `--color-on-accent` precisamente por esto (Lighthouse 100). Se aplica lo pedido por el usuario; `check-contrast.mjs` admitirá 3:1 solo para estos dos pares (documentado) y se vuelve a pasar Lighthouse.
- **Nota de trabajo:** los cambios sin commitear de `project-heading` (fila del título con `justify-content: space-between` y sin el punto de estado de guardado) son previos a S10; se revisan al implementar T10.6.
