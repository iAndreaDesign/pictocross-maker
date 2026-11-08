# S08 — Diseño Figma, pulido y persistencia
Estado: draft | Depende de: S05–S07

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
- [ ] Comparación visual con el frame de Figma sin diferencias relevantes.
- [ ] Recargar la página recupera el dibujo; datos corruptos se ignoran sin romper.
- [ ] Lighthouse accesibilidad ≥ 90.

## Tareas
- [ ] T08.1 (REQ-S08-01) Auditar tokens vs. Figma.
- [ ] T08.2 (REQ-S08-02/03) Aplicar layout y componentes.
- [ ] T08.3 (REQ-S08-04) Servicio de persistencia + tests.
- [ ] T08.4 (REQ-S08-05) Extraer textos.
- [ ] T08.5 (REQ-S08-06/07) Auditoría a11y.

## Decisiones
