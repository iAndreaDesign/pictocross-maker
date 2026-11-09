# S03 — Dominio: solucionador por líneas
Estado: draft | Depende de: S02 | Ref: nonograma-logica.txt §3–4

## Objetivo
Resolver un nonograma solo por lógica de líneas (DP), sin backtracking, y reportar si queda resuelto, qué casillas quedaron desconocidas y métricas para la dificultad.

## Alcance
`solveLine`, `solveGrid` y tipos de resultado. TS puro.
## Fuera de alcance
Worker (S06), dificultad (S04), UI.

## Requisitos
- REQ-S03-01: Estado de casilla del solver: `Unknown | Black | White`.
- REQ-S03-02: `solveLine(clue, known[]) → { line, changed, contradiction }`. Por DP O(largo × bloques): una casilla es negra/blanca si lo es en **todas** las colocaciones válidas compatibles con `known`.
- REQ-S03-03: Pista `[0]` = línea toda blanca.
- REQ-S03-04: `solveGrid(clues, size)` aplica pasadas (todas las filas, luego todas las columnas) hasta que una pasada completa no cambie nada.
- REQ-S03-05: Resultado: `{ status: 'ideal' | 'unsolvable', cells, unknownCells: [r,c][], passes: number, solvedAfterFirstPass: number }`.
- REQ-S03-06: Sin backtracking ni heurísticas adicionales.
- REQ-S03-07: Si el solver llega a contradicción (no debería ocurrir con pistas generadas de un dibujo) → error interno explícito.
- REQ-S03-08: Rendimiento: 50x50 denso resuelto en < 200 ms en hardware de desarrollo (medido, no bloqueante en CI).

## Criterios de aceptación
- [ ] Ejemplos clásicos de solapamiento y línea completa se resuelven en `solveLine`.
- [ ] Dibujo compacto (p. ej. un corazón 10x10 relleno) → `ideal` y la solución == dibujo original.
- [ ] Diagonal 2x2 → `unsolvable`, `unknownCells` con las 4 casillas.
- [ ] Tablero de ajedrez 4x4 → `unsolvable`.
- [ ] `passes` y `solvedAfterFirstPass` coherentes en un caso calculado a mano.
- [ ] Test de propiedad: para dibujos aleatorios, si `ideal` entonces `cells` == dibujo.

## Tareas
- [ ] T03.1 (REQ-S03-01/02/03) `solveLine` con DP + tests unitarios.
- [ ] T03.2 (REQ-S03-04/05/06) `solveGrid` + contador de pasadas y métricas.
- [ ] T03.3 (REQ-S03-07) Manejo de contradicción.
- [ ] T03.4 Tests de casos ideales/ambiguos + propiedad aleatoria.
- [ ] T03.5 (REQ-S03-08) Benchmark 50x50.

## Decisiones
- Pasada = todas las filas y luego todas las columnas (§4).
