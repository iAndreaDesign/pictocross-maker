# S06 — Preview, validación y worker
Estado: draft | Depende de: S03, S04, S05 | Ref: nonograma-logica.txt §4 (paso 4), §5, §6 (pasos 3–5)

## Objetivo
Mostrar a la derecha el nonograma generado con sus pistas en tiempo real, el indicador ideal/no resoluble, el resaltado rojo de casillas indecidibles y la dificultad.

## Requisitos
- REQ-S06-01: `SolverClient` (servicio) envuelve un Web Worker que ejecuta `generateClues` + `solveGrid` + `computeDifficulty`.
- REQ-S06-02: Recalcular tras cada cambio del dibujo con debounce (~150 ms); descartar resultados obsoletos (id de petición).
- REQ-S06-03: Estado expuesto como signals: `analysis` (`pending | ready`), `status`, `difficulty`, `unknownCells`.
- REQ-S06-04: Componente de preview: cuadrícula en blanco con pistas de filas (alineadas a la derecha) y columnas (alineadas abajo); líneas gruesas cada 5 casillas.
- REQ-S06-05: Badge de validación (pastilla redondeada, 29 px alto, Inter SemiBold 11 px). Mientras calcula, estado neutro (sin parpadeo).
  - **Posible**: texto "Puzzle posible", fondo `#DCE5CC`, texto `#435738`, icono **check a la izquierda** (`circle-check`).
  - **Imposible**: texto "Puzzle imposible" (propuesta), fondo `#E20000`, texto `#FFFFFF`, icono **cross a la derecha** (`circle-x`/`x`).
  - El texto y el icono transmiten el estado (no solo el color); el badge lleva `aria-live="polite"`.
- REQ-S06-06: Casillas desconocidas con tinte rojo en la preview (negras y blancas por igual).
- REQ-S06-07: Dificultad visible solo si es ideal; oculta si no. Badge "Fácil · Beta" / "Medio · Beta" / "Difícil · Beta" (fondo `#EDCCB4`, texto `#46352D`, icono `sparkles`). La etiqueta "Beta" se mantiene hasta cerrar S09.
- REQ-S06-08: Dibujo vacío: definir estado (pistas `0`, resultado ideal trivial o aviso) — ver Decisiones.
- REQ-S06-09: Fallback síncrono si `Worker` no está disponible (tests/SSR).
- REQ-S06-10: La preview a la derecha se actualiza **en tiempo real** con cada cambio del editor (incluidos Clear e Invert) y es **el mismo render que se exporta** (S07): un único `NonogramRenderer` compartido, sin segunda implementación.
- REQ-S06-11: Colores de la preview tomados de los tokens de marca (S01). Casillas irresolubles en rojo `#E20000` (frame de fallo `4:1520`).
- REQ-S06-12: **Paleta de la preview**: casillas rellenas en **terracota** de marca (las mismas que el editor, no negro), también al exportar. El color de fondo `#EADED5` de la referencia pasa a **`#FFFFFF`**. Valores medidos en la imagen de referencia: casilla pintada `#9E5139`, bandas de pistas `#F2D7C4`, cruces `#D77A4B`, números de pistas en `--color-text`; casillas vacías y esquina de pistas en blanco. Las bandas alternan una sí, una no, empezando por la primera (columnas y filas); línea gruesa cada 5 casillas que atraviesa también las pistas.
- REQ-S06-13: **Líneas de cuadrícula negras al 80 % de opacidad** (`rgba(0,0,0,0.8)`), siempre bien visibles, también a 50x50 (grosor mínimo en píxeles de dispositivo). Líneas gruesas cada 5 casillas.
- REQ-S06-14: Cabecera del panel: badges a la izquierda y botón "Export solution" a la derecha. **Sin botón ni icono de impresora.**
- REQ-S06-16: La preview muestra la **solución**: casillas pintadas en terracota y **cruces** en las blancas (como en el Figma), más el rojo `#E20000` en las irresolubles cuando el puzzle es imposible. Mientras es imposible, las casillas desconocidas no llevan ni relleno ni cruz.
- REQ-S06-15: Pistas con bandas alternas en `--color-clue-band` (melocotón, no gris) y esquina de pistas vacía en blanco, según la imagen de referencia (el Figma `4:882` las muestra en gris: manda la imagen).

## Criterios de aceptación
- [ ] Dibujar un corazón relleno → verde + dificultad.
- [ ] Dibujar diagonal dispersa → rojo con manchas; corregir las encoge hasta verde.
- [ ] 50x50 dibujando no bloquea la UI.
- [ ] Una respuesta antigua nunca pisa a una más reciente.

## Tareas
- [ ] T06.1 (REQ-S06-01/09) Worker + `SolverClient`.
- [ ] T06.2 (REQ-S06-02/03) Debounce, request-id, signals de estado.
- [ ] T06.3 (REQ-S06-04) Render de la preview con pistas.
- [ ] T06.4 (REQ-S06-05/06/07) Indicador, resaltado rojo, dificultad.
- [ ] T06.5 (REQ-S06-08) Caso dibujo vacío.
- [ ] T06.6 Tests del cliente (con fallback síncrono) y del componente.

## Decisiones
- Pendiente de decidir (REQ-S06-08): dibujo vacío → propuesta: mostrar estado neutro "Dibuja algo" y deshabilitar dificultad.
