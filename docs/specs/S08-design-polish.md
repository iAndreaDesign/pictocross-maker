# S08 — Diseño Figma, pulido y persistencia
Estado: done | Depende de: S05–S07

## Objetivo
Aplicar el diseño de Figma, pulir la experiencia y guardar el borrador localmente.

## Requisitos
- REQ-S08-01: Verificar fidelidad con los tokens de marca definidos en S01 (colores, tipografía, radios); ajustar los que falten (espaciado, sombras). El Figma no define variables, los valores se leen de los nodos con `get_design_context`.
- REQ-S08-02: Layout de dos paneles (editor izquierda, preview derecha) según Figma para anchos **≥ 960 px**.
- REQ-S08-11: **Responsive**: por debajo de **960 px** una sola columna: primero la card del editor y **debajo la card de la preview** con sus badges (posible/imposible, dificultad), el botón "Export solution" y la cuadrícula con las pistas. La barra de configuración (alto × ancho, Clear, Invert) y los botones de exportación de la cabecera se reorganizan (envuelven en filas) sin scroll horizontal. Casillas del editor y preview se escalan al ancho disponible, con 16 px de margen lateral. Probado a 320, 640, 959, 960 y 1440 px.
- REQ-S08-03: Componentes de UI (botones, indicadores, selector de tamaño) fieles al diseño.
- REQ-S08-04: Persistencia del borrador en `localStorage` (grid + tamaño), con versión de esquema y manejo de errores/valores corruptos.
- REQ-S08-05: Revisión final de i18n (S01): todas las cadenas de UI, `aria-label`, nombres de fichero exportados y mensajes de confirmación salen de `es`; añadir un segundo idioma de prueba no requiere tocar componentes. Selector de idioma solo si se añade un segundo idioma.
- REQ-S08-06: Accesibilidad: contraste AA, foco visible, `aria-live` para el indicador ideal/no resoluble.
- REQ-S08-07: Colores del indicador no dependen solo del color (icono/texto).
- REQ-S08-08: Indicador de **guardado local** (punto de estado junto al título): "guardado" / "guardando". Guarda también el título.
- REQ-S08-09: Pie de página: punto de acento + "Copyright ©2026 @rastrosdeluna".
- REQ-S08-10: Fuera de alcance explícito: botón de imprimir y consejos ("Workshop tip").

## Criterios de aceptación
- [x] Comparación visual con el frame de Figma sin diferencias relevantes.
- [x] Recargar la página recupera el dibujo; datos corruptos se ignoran sin romper.
- [x] Lighthouse accesibilidad ≥ 90.

## Tareas
- [x] T08.1 (REQ-S08-01) Auditar tokens vs. Figma.
- [x] T08.2 (REQ-S08-02/03) Aplicar layout y componentes.
- [x] T08.3 (REQ-S08-04) Servicio de persistencia + tests.
- [x] T08.4 (REQ-S08-05) Extraer textos.
- [x] T08.5 (REQ-S08-06/07) Auditoría a11y.

## Decisiones
- **T08.1 Auditoría de tokens.** Valores leídos del Figma (`get_metadata` 4:606 y `get_design_context` 4:607, 4:656, 4:695, 4:910; guardados en `docs/design/cache/`). Tokens nuevos: `--color-accent-dot`, `--radius-card` (20 px), `--page-gutter` / `--page-inline` (40 px escritorio, 16 px < 960 px, contenido centrado a 1360 px en pantallas muy anchas). Botones globales con las medidas del diseño: 44 px, radio 10, gap 9, icono 18.
- **Contraste AA (decisión del usuario):** el Figma no cumple AA en dos pares. Se oscurecieron dos tokens: `--color-text-muted` `#806D60` → `#66554A` y nuevo `--color-on-accent` `#32241D` (texto sobre terracota; el Figma usa `#46352D`, 3,6:1). Los rellenos y fondos no se tocaron. `scripts/check-contrast.mjs` (encadenado en `npm test`) falla si algún par de tokens baja de 4,5:1.
- **T08.2 Layout.** Cabecera de marca (Fraunces Black 28 px, descriptor con 2,3 px de tracking), barra de configuración a todo el ancho, **título del proyecto fuera de las tarjetas** (Fraunces SemiBold 33 px) con el punto de estado de guardado al final de la fila, tarjetas con radio 20 / padding 24, pie con punto de acento. Dos columnas a partir de **960 px**; por debajo una columna con el editor primero y la preview debajo. Campo numérico de 84×42 con stepper de chevrones y áreas táctiles de 24×24 (WCAG 2.2) que no alteran el aspecto. Toggle de herramienta como el diseño: la activa muestra icono y texto, la otra solo icono (con `aria-label`); historial como iconos sin borde.
- **Cambios respecto a specs anteriores:** el título (REQ-S05-17) vive ahora en el encabezado, no en el editor; el pie del editor dice "Haz clic o arrastra para pintar." como el Figma (REQ-S05-16 decía "Arrastra para dibujar"); sin presets de tamaño (ya anotado en S05).
- **Fuera de lo implementado a propósito:** icono de impresora, "Workshop tip" (REQ-S08-10) y el check "Grid summary" de la barra (sin contenido en el diseño). El **toggle de orientación de la cabecera no está en el Figma** (propuesta de S07): se mantiene, pendiente de confirmar.
- **T08.3 Persistencia.** `localStorage` clave `pictocross-maker:draft`, esquema versionado (`version: 1`; filas como cadenas 0/1, tamaño y título). `parseDraft` valida versión, tamaño 1..50, forma, caracteres y título (≤ 60) y devuelve `null` ante cualquier dato corrupto o de otra versión (se borra y la app arranca con el logo). Guardado con debounce de 400 ms y volcado inmediato al ocultar la pestaña; `DrawingStore.load` restaura al arrancar (`provideAppInitializer`). Indicador con **forma distinta por estado** (punto lleno = guardado, anillo = guardando, rombo rojo = no disponible) más texto accesible y tooltip. La orientación de exportación no se persiste (no está en la spec).
- **T08.4 i18n.** Los nombres de fichero exportados salen de `export.file.*`. `scripts/check-i18n.mjs` ahora también falla ante texto escrito a mano en plantillas (.html e inline, incl. `aria-label`/`title`/`alt`) y ante claves de `es.json` sin usar. Test con un segundo idioma ficticio (`§…§`): cambia en runtime todos los textos y `aria-label` sin tocar componentes. No se añade selector de idioma (no hay segundo idioma real).
- **T08.5 Accesibilidad.** Lighthouse (Edge, build de producción, escritorio): **91 → 100**, sin auditorías fallidas (antes fallaban contraste y tamaño de objetivo). `aria-live` en los badges y el estado de guardado, foco visible global, estados no dependientes del color.
- **Verificado en navegador:** persistencia (dibujar + título → recargar → se restaura; 4 variantes corruptas inyectadas antes del arranque se ignoran sin errores) y capturas a 320, 640, 959, 960 y 1440 px sin scroll horizontal (columnas: 1, 1, 1, 2, 2). Arreglo hallado al verificar: el nombre de la marca se cortaba a 320 px (ahora escala con el ancho).
- **Límites de la verificación:** Lighthouse solo audita el estado inicial en escritorio (no móvil ni estados de error); sin prueba manual con lector de pantalla; 640 px solo se midió (sin desbordamiento), no se revisó la captura.
