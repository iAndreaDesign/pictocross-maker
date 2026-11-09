# S02 — Dominio: tipos y generación de pistas
Estado: done | Depende de: S01 | Ref: nonograma-logica.txt §1–2

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
- [x] `■■□■□□■■■` → `[2,1,3]`.
- [x] Línea toda blanca → `[0]`; toda negra de largo n → `[n]`.
- [x] Grid 2x2 diagonal → todas las pistas `[1]`.
- [x] Grid rectangular (p. ej. 3x7) con pistas correctas.
- [x] Tamaño 0 o >50 lanza error.

## Tareas
- [x] T02.1 (REQ-S02-01/02) Definir tipos en `core/domain/types.ts`.
- [x] T02.2 (REQ-S02-03) `lineToClue` + tests de los casos de §2.
- [x] T02.3 (REQ-S02-04) `generateClues` + tests (filas, columnas, rectangular).
- [x] T02.4 (REQ-S02-05) Validación de tamaño + tests.

## Decisiones
- Además de 1..50, `generateClues` rechaza filas de distinta longitud (`GridSizeError`). Los tests viven junto al código (`clues.spec.ts`); barrel en `core/domain/index.ts`.
- Rama apilada sobre `feat/S01-scaffold` (PR #4 aún abierta) al iniciar S02.
