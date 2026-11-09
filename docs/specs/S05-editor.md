# S05 — Editor de dibujo
Estado: done | Depende de: S01, S02 | Ref: nonograma-logica.txt §6 (pasos 1–2) · Figma nodos `4:656`, `4:706`

## Objetivo
Permitir elegir el tamaño y dibujar/borrar casillas con el ratón, con un dibujo por defecto (el logo), acciones Limpiar e Invertir, y estado en signals.

## Alcance
`DrawingStore`, componente grid, selector de tamaño, herramientas, acciones Clear / Invert, dibujo por defecto.
## Fuera de alcance
Pistas renderizadas, validación (S06), export (S07), persistencia (S08).

## Requisitos
- REQ-S05-01: `DrawingStore` (servicio `providedIn: 'root'`) con `signal` del grid, `rows`, `cols`; métodos `setCell`, `paintStroke`, `clear`, `invert`, `resize`, `reset`.
- REQ-S05-02: Selector de tamaño: dos campos numéricos con stepper (Alto × Ancho), 1..50 cada uno (Figma). Además presets rápidos (5, 10, 15, 20, 25, 30, 50) si el diseño los admite.
- REQ-S05-03: Pintar con clic y arrastre (Pointer Events). **Herramienta Pintar** por defecto.
- REQ-S05-04: **Herramienta activa (toggle Dibujar/Borrar, Figma `4:714`)** define qué hace cada botón del ratón; el otro botón hace lo contrario:
  - Herramienta **Dibujar** (por defecto): clic izquierdo **pinta**, clic derecho **borra**.
  - Herramienta **Borrar**: clic izquierdo **borra**, clic derecho **pinta** (invertido).
  - El primer clic de un trazo fija su modo (pintar/borrar) hasta soltar. El toggle muestra la herramienta activa (Dibujar resaltado en terracota).
- REQ-S05-05: **Dibujo por defecto 10x10 = logo** (matriz en Decisiones). Se carga al abrir la app y con `reset`.
- REQ-S05-06: Botón **Clear (Limpiar)**: deja todas las casillas en blanco, conserva el tamaño. Deshacible.
- REQ-S05-07: Botón **Invert (Invertir)**: cada casilla blanca pasa a negra y viceversa. Deshacible. Doble inversión = identidad.
- REQ-S05-08: Deshacer/rehacer (historial acotado, p. ej. 100). Un trazo completo, Clear e Invert son una sola entrada de historial. Botones de **flecha atrás / adelante** junto al toggle de herramientas (Figma `4:722`), deshabilitados cuando no hay nada que deshacer/rehacer, con atajos Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z) y `aria-label`.
- REQ-S05-09: Al cambiar de tamaño se conserva el dibujo recortando/ampliando; si se pierden casillas negras, pedir confirmación.
- REQ-S05-10: Rendimiento: 50x50 sin lag al arrastrar.
- REQ-S05-11: Accesible por teclado (flechas + espacio/enter).
- REQ-S05-12: Grid derivado expuesto como `computed` para S06/S07.
- REQ-S05-13: Menú contextual del navegador desactivado sobre el grid (para permitir clic derecho).
- REQ-S05-14: Cabecera del panel (Figma `4:713`): toggle **Dibujar / Borrar** a la izquierda y flechas deshacer/rehacer (REQ-S05-08) al lado.
- REQ-S05-15: Reglas de coordenadas 1..N en filas y columnas del editor.
- REQ-S05-16: Pie del panel: icono de ratón + texto "Arrastra para dibujar" a la izquierda, y contador "N / total celdas" a la derecha. **Nada más** (sin consejos).
- REQ-S05-17: Título del proyecto editable (por defecto "Corazón de píxel"), con icono de lápiz; se usa para el nombre de los ficheros exportados (sustituye a REQ-S07-06 si hay título).

## Criterios de aceptación
- [x] Al abrir la app aparece el logo 10x10 (idéntico a la matriz de Decisiones).
- [x] Clear → 0 casillas negras; deshacer recupera el dibujo.
- [x] Invert sobre el logo → complemento exacto; Invert dos veces → logo original.
- [x] Arrastrar en diagonal rápida no deja huecos (interpolación Bresenham).
- [x] Deshacer revierte un trazo completo, no casilla a casilla.
- [x] Redimensionar 10→5 con casillas negras fuera de rango muestra confirmación.
- [x] Tests del store (métodos, límites, historial).

## Tareas
- [x] T05.1 (REQ-S05-01/12) `DrawingStore` + tests.
- [x] T05.2 (REQ-S05-05) Constante `DEFAULT_LOGO_GRID` + test de forma 10x10.
- [x] T05.3 (REQ-S05-06/07/08) `clear`, `invert`, historial undo/redo + tests.
- [x] T05.4 (REQ-S05-02/09) Selector de tamaño y resize.
- [x] T05.5 (REQ-S05-03/04/10/13) Componente grid con puntero, borrador e interpolación.
- [x] T05.6 (REQ-S05-06/07) Botones Clear / Invert en la barra.
- [x] T05.7 (REQ-S05-11) Teclado.
- [x] T05.8 (REQ-S05-14/15/16) Cabecera de herramientas, reglas y pie del panel.
- [x] T05.9 (REQ-S05-17) Título editable.

## Decisiones
- **Confirmado (REQ-S05-04):** con Dibujar activo, izquierdo pinta y derecho borra; con Borrar activo se invierte (izquierdo borra, derecho pinta).
- Logo por defecto (1 = negra), filas de arriba a abajo:
```
0001110000
0011111000
0100100100
0101101100
0111111100
0111111100
0111111100
0111111100
0101010100
0000000000
```
- Render del grid con `<canvas>` vs celdas DOM: decidir en T05.5 según prueba 50x50.
- **Render (T05.5): `<canvas>`**, resolución interna 24 px/casilla escalada por CSS (`image-rendering: pixelated`). Redibujar 2.500 casillas es trivial y evita 2.500 nodos DOM. Teclado y lector de pantalla: el canvas es focusable (`role="application"`, `aria-label`), con cursor dibujado y región `aria-live` que anuncia fila/columna/estado. Lag de 50x50 no medido en navegador real (solo razonado).
- Arquitectura: ops puras de tablero en `core/domain/grid-ops.ts` + `bresenham.ts`; `DrawingStore` en `features/editor/`; el trazo (`beginStroke/paintStroke/endStroke`) es una sola entrada de historial; historial de 100 (`HISTORY_LIMIT`). `setTitle` guarda `null` para "título por defecto" (se traduce en la UI).
- Reglas (REQ-S05-15): hasta 25 líneas se numeran todas; con tableros mayores solo 1 y múltiplos de 5, para que quepan.
- Resize conserva el dibujo anclado arriba-izquierda; la confirmación es un aviso en línea (`role="alertdialog"`), no `window.confirm`.
- Presets rápidos (5–50) fijan alto = ancho. Atajos: Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z (ignorados dentro de campos de texto).
- Figma **no se consultó** en S05: la spec ya traía estructura y tokens. La maquetación es provisional y se afina contra el diseño en S08. Se añadió `app-icon` (iconos SVG propios, sin librería nueva).
- Pendiente para S07: el título del proyecto (`store.title()`, `null` = por defecto) nombra los ficheros exportados.
- **Tamaño máximo de casilla: 45 px** (petición del usuario). Se limita en CSS (`--cell-max` en `drawing-grid.css`): el ancho del grid es como mucho `columnas × 45 px` (+ reglas); en tableros grandes las casillas se reducen para caber, nunca superan 45 px.
