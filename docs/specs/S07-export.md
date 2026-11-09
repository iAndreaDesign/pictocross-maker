# S07 — Exportación PNG / PDF
Estado: done | Depende de: S02, S06 | Ref: nonograma-logica.txt §6 (6–7), §7

## Objetivo
Exportar el nonograma en blanco (PNG o PDF) y con solución (PNG). Botones siempre activos.

## Requisitos
- REQ-S07-01: Dos botones en la cabecera, **Export as PDF** y **Export as PNG**: tablero **en blanco** = cuadrícula vacía con las pistas de filas y columnas (sin casillas pintadas ni cruces).
- REQ-S07-02: Botón **Export solution** (PNG; cabecera y panel de preview): cuadrícula con las pistas, casillas **pintadas en terracota** y **cruces** en las casillas blancas, **sin** el rojo de casillas irresolubles.
- REQ-S07-03: Siempre activos, incluso si el nonograma no es ideal. Si no es ideal, las exportaciones NO incluyen el resaltado rojo (es solo ayuda de edición).
- REQ-S07-04: Un único `NonogramRenderer` puro (recibe grid, clues, opciones → dibuja en un canvas/contexto) reutilizado por PNG y PDF.
- REQ-S07-05: PDF con `jspdf`: A4, casilla cuadrada de tamaño constante calculado para que quepa, líneas gruesas cada 5, pistas de columnas alineadas abajo y de filas a la derecha, tipografía legible.
- REQ-S07-06: Nombre de fichero: `nonograma-{filas}x{cols}[-solucion].{ext}`.
- REQ-S07-07: PNG a resolución suficiente para imprimir (escala configurable, por defecto 2x).
- REQ-S07-08: Dibujo vacío: exporta igualmente un tablero en blanco válido.
- REQ-S07-09: Lo exportado usa el **mismo `NonogramRenderer` de S06**, con los **colores terracota** de marca, fondo blanco `#FFFFFF` y cuadrícula negra al 80 %. "Export solution" equivale a la preview sin el resaltado rojo; "Export as PDF/PNG" es la misma cuadrícula en blanco.
- REQ-S07-11: Las líneas de cuadrícula exportadas son negras al 80 % de opacidad y se ven nítidas en PNG y PDF (grosor mínimo definido en el layout).
- REQ-S07-12: Sin función de imprimir en la app; el usuario imprime el PDF exportado.
- REQ-S07-13: **Tamaño físico de casilla**: las casillas del tablero y las de pistas (filas y columnas) son cuadradas y del mismo tamaño `c`. Para un tablero pequeño `c = 7 mm`.
- REQ-S07-14: **Ajuste a A4** (210×297 mm) con **márgenes de 5 mm**. Área útil: vertical 200×287 mm, horizontal 287×200 mm. Ancho total = `(máx. nº de pistas en una fila + columnas) × c`; alto total = `(máx. nº de pistas en una columna + filas) × c`. `c = min(7 mm, áreaAncho / unidadesAncho, áreaAlto / unidadesAlto)`. El tablero se centra en el área útil. Función pura `computeLayout(grid, clues, orientation)`.
- REQ-S07-15: **Orientación**: **vertical por defecto**. Un **toggle Vertical / Horizontal** (signal en el store de exportación) permite al usuario cambiarla; afecta a PDF y PNG (y a la vista previa de página si existe). No se cambia sola. Ubicación del toggle: propuesta junto a los botones de exportación; no está en el Figma (confirmar al implementar).
- REQ-S07-16: Si `c` resulta menor que un mínimo legible (propuesta: 3 mm), se avisa al usuario antes de exportar, pero se permite exportar (botones siempre activos). Si la otra orientación daría una `c` mayor, el aviso lo sugiere (sin cambiarla).
- REQ-S07-17: PNG a 300 dpi con el mismo layout físico que el PDF (7 mm ≈ 83 px); el PNG se recorta al tablero más el margen de 5 mm.
- REQ-S07-18: El tamaño de la tipografía de las pistas escala con `c` (legible a 7 mm) y las pistas de 2 dígitos caben en la casilla.
- REQ-S07-10: Botones ubicados como en el Figma: cabecera (PDF, PNG, solución) y botón "Export solution" en el panel de preview, ambos llamando a la misma acción.

## Criterios de aceptación
- [x] 5x5 y 10x10 se exportan con casilla de exactamente 7 mm; el logo 10x10 cabe holgado en A4.
- [x] 15x15 y 50x50 caben en una página A4 con márgenes de 5 mm (ningún trazo fuera del área útil).
- [x] `computeLayout`: tests con tableros pequeños (c = 7), medianos (c < 7) y 50x50 con pistas largas.
- [x] Pistas en columnas con varios números se apilan sin solaparse.
- [x] PNG con solución coincide con el dibujo.
- [x] Tests del cálculo de layout (tamaño de casilla, márgenes) sin depender del navegador.

## Tareas
- [x] T07.1 (REQ-S07-04) Cálculo de layout puro + tests.
- [x] T07.2 (REQ-S07-04/07) `NonogramRenderer` sobre canvas.
- [x] T07.3 (REQ-S07-01/02/06) Exportador PNG (blanco y solución).
- [x] T07.4 (REQ-S07-05) Exportador PDF con jspdf.
- [x] T07.5 (REQ-S07-01/02/03/08) Botones UI y descarga.
- [x] T07.6 (REQ-S07-15/16) Toggle de orientación (vertical por defecto) y aviso de casilla pequeña.

## Decisiones
- `jspdf` se carga con import dinámico para no penalizar el bundle inicial.
- **Renderer único** movido a `shared/nonogram-renderer.ts` (preview y exportación). Nuevo: `cells: null` = tablero en blanco y `margin` opcional (los 5 mm del PNG). Las exportaciones nunca pasan casillas desconocidas, así que nunca hay rojo.
- **Layout físico** (`features/export/export-layout.ts`): `computeExportLayout(clues, orientation)` (las dimensiones salen de las pistas; la spec decía `(grid, clues, orientation)`). Para que **ningún trazo** quede fuera del área útil, `c` se calcula con `área − grosor de línea gruesa (0,35 mm)`: 5x5 y 10x10 dan exactamente 7 mm; 50x50 con pistas de 25 números da 2,67 mm en ambas orientaciones.
- **PNG** a 300 dpi (casilla de 83 px) con 5 mm de margen. Limitación: `canvas.toBlob` no escribe el metadato de dpi (pHYs) en el PNG.
- **PDF = imagen de 300 dpi del mismo renderer incrustada en la página A4** (`jspdf`, import dinámico: chunk perezoso de ~113 kB gzip fuera del bundle inicial). No es vectorial: es lo que permite reutilizar el renderer único. La imagen se escala para que la casilla mida exactamente `c` mm. Si se quiere PDF vectorial habría que duplicar el dibujo en jsPDF (no hecho).
- **Orientación (REQ-S07-15):** toggle Vertical/Horizontal en la cabecera junto a los botones (propuesta de la spec; el Figma no lo tiene) — pendiente de confirmar con el diseño en S08. Vertical por defecto, nunca cambia sola.
- **Aviso (REQ-S07-16):** nota visible bajo los badges de la preview cuando `c < 3 mm`, con sugerencia de la otra orientación si da casilla mayor. No bloquea. Si falla una exportación se muestra un aviso (`role="alert"`).
- **Nombre de fichero:** si hay título del proyecto (S05) se usa su slug; si no, `nonograma-{filas}x{cols}[-solucion].{ext}`.
- **Botón "Export solution"** en cabecera y en el panel de preview, ambos llaman a `ExportService.exportSolution()` (REQ-S06-14 / REQ-S07-10).
- **Verificado en Edge (build de producción):** el logo 10x10 descarga PNG en blanco, PNG con solución y PDF A4 vertical con casilla de 7,000 mm, centrado y dentro de márgenes; 50x50 de tablero de ajedrez (peor caso): aviso de 2,7 mm y PDF con la imagen a 200×200 mm pegada al margen de 5 mm. El visor PDF de Edge headless no renderiza, así que el PDF se comprobó por su geometría (MediaBox y matriz de la imagen), no visualmente.
- **Build:** `jspdf` arrastra avisos de esbuild por `core-js`/`canvg` (dependencias opcionales suyas); no son errores.
- **Fix en S05 hallado al verificar:** a 50 columnas la regla superior del editor se salía del lienzo; ahora su ancho lo marca el canvas (`contain: inline-size`).
