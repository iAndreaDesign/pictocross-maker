# Scopes

Orden de ejecución. Un scope no empieza hasta que sus dependencias estén `done`.

| ID  | Scope                                   | Depende de | Estado |
|-----|-----------------------------------------|------------|--------|
| S01 | Scaffold y tooling                      | —          | done |
| S02 | Dominio: tipos y generación de pistas   | S01        | done   |
| S03 | Dominio: solucionador por líneas        | S02        | done   |
| S04 | Dominio: dificultad                     | S03        | done   |
| S05 | Editor de dibujo (grid + store)         | S01, S02   | done   |
| S06 | Preview, validación y worker            | S03, S04, S05 | done |
| S07 | Exportación PNG / PDF                   | S02, S06   | done   |
| S08 | Diseño Figma, pulido y persistencia     | S05–S07    | done   |
| S09 | Calibración de dificultad con ejemplos  | S03, S04   | in-progress |

Nota: S02–S04 son TS puro (sin UI) y se pueden validar solo con tests. S08 consume el diseño de Figma; si el diseño está listo antes, adelantar los tokens a S05.

Specs: `docs/specs/S01-*.md` … `S08-*.md`.
