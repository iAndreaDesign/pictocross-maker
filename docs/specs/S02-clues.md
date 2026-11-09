# S02 — Dominio: tipos y generación de pistas
Estado: draft | Depende de: S01 | Ref: nonograma-logica.txt §1–2

## Objetivo
Tipos base y función pura que, dado un dibujo, devuelve las pistas de filas y columnas.

## Alcance
`core/domain`: tipos y `generateClues`. TS puro.
## Fuera de alcance
Solver, UI.

## Requisitos
- REQ-S02-01: `type Cell = 0 | 1` (blanca/negra). `Grid = readonly (readonly Cell[])[]` (filas × columnas). Soporta no cuadrados, máx. 50x50.
- REQ-S02-02: `type Clue = readonly number[]`; `Clues = { rows: Clue[]; cols: Clue[] }`.
- REQ-S02-03: `lineToClue(line)` según el algoritmo de §2; línea vacía → `[0]`.
- REQ-S02-04: `generateClues(grid)` devuelve pistas de filas (izq→der) y columnas (arr→abajo).
- REQ-S02-05: Validación de tamaño (1..50) con error explícito.

## Criterios de aceptación
- [ ] `■■□■□□■■■` → `[2,1,3]`.
- [ ] Línea toda blanca → `[0]`; toda negra de largo n → `[n]`.
- [ ] Grid 2x2 diagonal → todas las pistas `[1]`.
- [ ] Grid rectangular (p. ej. 3x7) con pistas correctas.
- [ ] Tamaño 0 o >50 lanza error.

## Tareas
- [ ] T02.1 (REQ-S02-01/02) Definir tipos en `core/domain/types.ts`.
- [ ] T02.2 (REQ-S02-03) `lineToClue` + tests de los casos de §2.
- [ ] T02.3 (REQ-S02-04) `generateClues` + tests (filas, columnas, rectangular).
- [ ] T02.4 (REQ-S02-05) Validación de tamaño + tests.

## Decisiones
