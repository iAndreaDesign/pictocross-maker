# S04 — Dominio: dificultad
Estado: draft | Depende de: S03 | Ref: nonograma-logica.txt §5

## Objetivo
Calcular la dificultad (fácil/medio/difícil) de un nonograma ideal a partir de las métricas del solver.

## Requisitos
- REQ-S04-01: `P1 = solvedAfterFirstPass / (filas×cols) × 100`; `N = passes`; `T = max(filas, cols)`.
- REQ-S04-02: Puntos: P1 ≥60→0, 30–59→1, <30→2 · N ≤3→0, 4–8→1, >8→2 · T ≤15→0, >15→1.
- REQ-S04-03: Total 0–1 FÁCIL, 2–3 MEDIO, 4–5 DIFÍCIL.
- REQ-S04-04: Umbrales en un único fichero de constantes (`difficulty.config.ts`), ajustables (son provisionales).
- REQ-S04-05: `computeDifficulty(result)` devuelve `null` si el estado no es `ideal`.

## Criterios de aceptación
- [ ] Tabla de casos límite (P1=60, 59.99, 30, 29.99; N=3,4,8,9; T=15,16) con puntos correctos.
- [ ] Resultado `unsolvable` → `null`.
- [ ] Cambiar un umbral en config cambia el resultado sin tocar la lógica.

## Tareas
- [ ] T04.1 (REQ-S04-04) Config de umbrales.
- [ ] T04.2 (REQ-S04-01/02/03/05) `computeDifficulty` + tests de límites.

## Decisiones
- P1 se redondea solo para mostrar; la comparación usa el valor sin redondear.
