# S10 — Últimos retoques
Estado: done | Depende de: S08, S09

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
- REQ-S10-08: **Orden de la cabecera.** El interruptor Vertical/Horizontal es el **primero** de la cabecera; después Exportar solución, PDF y PNG (sustituye el orden de REQ-S10-06).
- REQ-S10-09: **Nombre por defecto "Pictocross".** El título por defecto es `Pictocross` (es lo que muestra el input) y los ficheros exportados usan siempre el nombre mostrado: `pictocross.png`, `pictocross.pdf`, `pictocross-solucion.png`, o el nombre que ponga el usuario. Sustituye el fallback `nonograma-{f}x{c}` de REQ-S10-03.
- REQ-S10-10: **Líneas más oscuras (-20 %).** Para que se distingan al imprimir, las líneas finas del editor, de la preview/exportación y de las pistas se oscurecen un 20 %: `--color-cell-line` `#BEBEBD`, `--color-preview-line` `#A8A8A8`, `--color-clue-line` `#BEBEBD`, `--color-clue-line-band` `#C7BEB6`.
- REQ-S10-11: **Accesibilidad de los botones naranjas.** `--color-accent` pasa de `#D67747` a `#AB5F39` (mismo tono, más oscuro) para que el texto blanco cumpla AA (≥ 4,5:1). Se elimina la excepción de contraste de `on-accent`.
- REQ-S10-12: **Móvil: el gap a quitar es el de `.size`** (selector de tamaño), no el de `.group`. Corrige REQ-S10-05.
- REQ-S10-13: **Una carpeta por componente.** Cada componente vive en su carpeta con todos sus ficheros (p. ej. `project-heading/project-heading.{ts,html,css,spec.ts}`). Los ficheros que no son componentes (stores, utilidades) se quedan donde están.
- REQ-S10-14: **Netlify.** `netlify.toml` con `publish = "dist/nonogram-maker/browser"` y el comando de build, para que el plugin `@netlify/angular-runtime` no falle por directorio de publicación.

## Criterios de aceptación
- [x] El canvas del editor dibuja las líneas vacías con `#EDEDEC`.
- [x] Los badges fácil / medio / difícil muestran los tres fondos indicados; difícil con texto blanco.
- [x] Con nombre "Mi Dibujo": descargas `mi-dibujo.png`, `mi-dibujo.pdf`, `mi-dibujo-solucion.png`; sin nombre, `nonograma-{f}x{c}…`.
- [x] No queda ningún botón con fondo `--color-accent` y texto oscuro.
- [x] A < 450 px márgenes y padding son 8 px y `.group` no tiene gap; sin scroll horizontal a 320 px.
- [x] "Exportar solución" es el primer botón de la cabecera en todos los anchos; en la preview solo ≥ 450 px.
- [x] `npm test`, `npm run lint` y `npm run build` en verde.

## Tareas (primera tanda)
- [x] T10.1 (REQ-S10-01) Token `--color-cell-line` → `#EDEDEC` (+ spec S01 tabla de tokens y test del grid si aplica) — Hecho cuando: tests del grid en verde.
- [x] T10.2 (REQ-S10-02) Tokens y clases `badge-easy|medium|hard` en la preview — Hecho cuando: test de preview comprueba la clase por nivel.
- [x] T10.3 (REQ-S10-03) Verificar/ajustar `exportFileName` y cubrir con tests nombre / sin nombre / solución / PDF — Hecho cuando: tests de `export-layout` y `export.service` en verde.
- [x] T10.4 (REQ-S10-04) `--color-on-accent: #FFFFFF`; ajustar `scripts/check-contrast.mjs` (ver Decisiones) — Hecho cuando: `npm test` en verde.
- [x] T10.5 (REQ-S10-05) Media query `max-width: 449px` con gutter/padding 8 px y `.group { gap: 0 }` — Hecho cuando: captura a 320 y 449 px sin scroll horizontal.
- [x] T10.6 (REQ-S10-06/07) Botón "Exportar solución" primero en `export-bar` y oculto en la preview a < 450 px — Hecho cuando: tests de `export-bar` y `preview` en verde y verificado en navegador.
- [x] T10.7 (REQ-S10-08/09) Interruptor primero en la cabecera; título por defecto "Pictocross" y nombre de fichero = título mostrado — Hecho cuando: tests de `export-bar`, `export-layout` y `export.service` en verde.
- [x] T10.8 (REQ-S10-10/11/12) Tokens de líneas -20 %, `--color-accent` `#AB5F39` y `gap: 0` en `.size` — Hecho cuando: `npm test` (incl. contraste) en verde.
- [x] T10.9 (REQ-S10-13) Mover cada componente a su carpeta y corregir imports — Hecho cuando: tests, lint y build en verde.
- [x] T10.10 (REQ-S10-14) `netlify.toml` — Hecho cuando: el directorio de publicación coincide con la salida de `npm run build`.

- [x] REQ-S10-08..14 cumplidos (cabecera, nombre Pictocross en input y ficheros, líneas -20 %, accent AA, gap de `.size`, carpetas por componente, `netlify.toml`).

## Decisiones
- **Contraste (a confirmar):** blanco sobre `#D67747` da ~3,2:1 y sobre `#C97C68` ~3,2:1, por debajo de AA para texto normal (4,5:1). En S08 se había oscurecido `--color-on-accent` precisamente por esto (Lighthouse 100). Se aplica lo pedido por el usuario; `check-contrast.mjs` admitirá 3:1 solo para estos dos pares (documentado) y se vuelve a pasar Lighthouse.
- **Indicador de guardado eliminado (confirmado por el usuario):** `project-heading` ya no muestra el punto de estado (HTML/CSS/claves `editor.title.status.*` y sus tests fuera); la fila del título usa `justify-content: space-between`. `DraftPersistence` sigue guardando el borrador igual. Sustituye a REQ-S08-08.
- **Implementación:** tokens `--color-badge-{easy,medium,hard}-bg`, `--color-badge-hard-text`, `--block-pad` (24 px; 8 px < 450 px). `check-contrast.mjs` admite 3:1 solo para `on-accent/accent` y `badge-hard-text/bg`. T10.3: el nombre ya funcionaba; se añadieron tests de `nombre.pdf/png/-solucion.png`.
- **Carpetas (revisión):** también cada fichero no componente en su carpeta (`draft-*`, `drawing-store`, `grid-geometry`, `export-layout`, `export-render`, `export-service`, `shared/icon`, `shared/nonogram-renderer`) y la preview aplanada en `features/preview/`. `core/` no se toca.
- **Segunda tanda (pedida por el usuario):** acento `#D67747` → `#AB5F39` (texto blanco 4,7:1, AA); queda solo la excepción 3:1 del badge difícil (`#C97C68`, color pedido). Líneas -20 % en editor, preview/exportación y pistas. Título por defecto `Pictocross` (input y ficheros). Carpetas por componente (`features/<área>/<componente>/`); `app.ts` raíz se queda en `src/app`. `netlify.toml` publica `dist/nonogram-maker/browser` (los ajustes del fichero prevalecen sobre la UI de Netlify).
- **Límite de la verificación:** tests, lint y build en verde; no se ha revisado en navegador (320/449 px) ni vuelto a pasar Lighthouse.
