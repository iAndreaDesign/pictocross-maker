# S09 — Calibración de dificultad
Estado: done | Depende de: S03, S04 (y S06 para la vista opcional) | Ref: nonograma-logica.txt §5 ("umbrales provisionales")

## Objetivo
Ajustar los umbrales de dificultad con ejemplos reales aportados por el usuario: cada ejemplo es un dibujo con la dificultad que el usuario considera correcta. La herramienta mide, compara y propone nuevos umbrales.

## Alcance
Fixtures de ejemplos, informe de calibración y búsqueda de umbrales; el usuario aporta los ejemplos y valida los cambios.
## Fuera de alcance
Cambiar la fórmula (P1/N/T) sin acuerdo; si los ejemplos muestran que la fórmula no basta, se propone una spec nueva.

## Requisitos
- REQ-S09-01: Formato de ejemplo en `docs/calibration/examples/*.json`: `{ name, expected, grid | clues }`. `expected`: `"easy"|"medium"|"hard"|"unsolvable"` (opcional: sin él el ejemplo es **pendiente**; se mide pero no cuenta en los aciertos). El tablero es `grid: string[]` (cada fila una cadena de `0`/`1`, como el logo de S05) **o** `clues: { rows: number[][], cols: number[][] }` (puzzles de los que solo se conocen las pistas, p. ej. de otra app; no hace falta la solución). Pistas contradictorias = error de transcripción, se informa como tal y no como "no resoluble".
- REQ-S09-02: Importador: cargar un ejemplo desde el propio editor (botón de desarrollo, solo en modo dev) o pegando el JSON; también ejemplos a partir de una imagen PNG pequeña (umbral blanco/negro) — opcional.
- REQ-S09-03: Comando `npm run calibrate` que, para cada ejemplo, imprime tabla: nombre · tamaño · P1 · N · T · puntos (P1/N/T) · total · dificultad calculada · esperada · ✔/✘.
- REQ-S09-04: Resumen: porcentaje de aciertos y matriz de confusión (calculada × esperada).
- REQ-S09-05: **Búsqueda de umbrales**: dado el conjunto de ejemplos, probar combinaciones de umbrales (cortes de P1, cortes de N, corte de T, cortes de total) y listar las que maximizan los aciertos, sin aplicarlas.
- REQ-S09-06: Aplicar umbrales = editar solo `difficulty.config.ts` (S04), previa confirmación del usuario. Tests de S04 se actualizan con los nuevos límites.
- REQ-S09-07: Los ejemplos pasan a ser tests de regresión: `npm test` falla si un ejemplo deja de dar su dificultad esperada (`calibrate --check`, encadenado en `npm test` como los scripts de i18n/contraste; los pendientes no fallan).
- REQ-S09-08: Ejemplos `expected: "unsolvable"` verifican también el estado del solver.

## Criterios de aceptación
- [x] Con ejemplos de cada nivel el informe se genera sin errores (hoy: 4 fáciles, 2 medios, 3 difíciles; no hay ninguno "no resoluble" real. Faltan ejemplos medios y no resolubles: el usuario aportará más).
- [x] El informe es reproducible (misma entrada → misma salida).
- [x] Tras aplicar umbrales propuestos, acierta 9/9 de los ejemplos (acordado con el usuario).
- [x] Añadir un ejemplo nuevo no requiere tocar código (basta un JSON en `docs/calibration/examples/`).

## Tareas
- [x] T09.1 (REQ-S09-01) Esquema de ejemplo + loader + validación.
- [x] T09.2 (REQ-S09-03/04) Script `calibrate` con tabla y matriz de confusión.
- [x] T09.3 (REQ-S09-05) Búsqueda de umbrales.
- [ ] T09.4 (REQ-S09-02) Importador en el editor (dev) / pegar JSON. **Aplazada** (ver Decisiones).
- [x] T09.5 (REQ-S09-07/08) Test de regresión sobre fixtures.
- [x] T09.6 (REQ-S09-06) Sesión con el usuario: aportar ejemplos, revisar propuesta y aplicar umbrales.

## Decisiones
- `scripts/calibrate.mjs` reutiliza el dominio TS puro empaquetándolo con `esbuild` (ya presente como dependencia transitiva del CLI de Angular; no se añade ninguna librería). La lógica (carga, evaluación, matriz de confusión, búsqueda) vive en `core/domain/calibration.ts` con tests unitarios.
- Los ejemplos iniciales los aporta el usuario como capturas de pistas (9 puzzles: 3 fáciles, 3 medios, 2 difíciles y 1 imposible según él); se transcriben a `clues` y se validan con suma de filas = suma de columnas.
- El badge de dificultad lleva "Beta" en el Figma ("Fácil · Beta"): se mantiene hasta cerrar esta calibración.
- T09.4 (importador en el editor) queda **aplazada**: los ejemplos del usuario son solo pistas y el editor necesita un dibujo, así que solo serviría para ejemplos `grid`. Se hace si el usuario lo pide.
- Etiquetas del usuario: 07, 08, 09 fáciles; 04, 05(*), 06 medios; 01, 02 difíciles; 03 "imposible" según el usuario. (*) El 05 se relabeló a fácil por decisión del usuario.
- El puzzle 03 (16x16) **sí** se resuelve por lógica de líneas (solución única, 9 pasadas, 20,7 % tras la primera): no requiere una técnica avanzada, solo una cadena larga. Se etiqueta `hard`; **no** se añade el nivel "muy difícil". El usuario aportará más ejemplos en el futuro.
- Umbrales aplicados (REQ-S09-06): P1 ≥ 80 → 0 pts (antes 60) y N ≤ 4 → 0 pts (antes 3). El resto sin cambios. Resultado: 9/9 (con los umbrales provisionales eran 6/9). Con tan pocos ejemplos hay riesgo de sobreajuste; se recalibrará con más.
- El badge "Beta" se mantiene: la calibración se basa en 9 ejemplos.
