# Scopes

Orden de ejecución. Un scope no empieza hasta que sus dependencias estén `done`.

| ID  | Scope                                   | Depende de | Estado |
|-----|-----------------------------------------|------------|--------|
| S01 | Scaffold y tooling                      | —          | in-progress |
| S02 | Dominio: tipos y generación de pistas   | S01        | draft  |
| S03 | Dominio: solucionador por líneas        | S02        | draft  |
| S04 | Dominio: dificultad                     | S03        | draft  |
| S05 | Editor de dibujo (grid + store)         | S01, S02   | draft  |
| S06 | Preview, validación y worker            | S03, S04, S05 | draft |
| S07 | Exportación PNG / PDF                   | S02, S06   | draft  |
| S08 | Diseño Figma, pulido y persistencia     | S05–S07    | draft  |
| S09 | Calibración de dificultad con ejemplos  | S03, S04   | draft  |

Nota: S02–S04 son TS puro (sin UI) y se pueden validar solo con tests. S08 consume el diseño de Figma; si el diseño está listo antes, adelantar los tokens a S05.

Specs: `docs/specs/S01-*.md` … `S08-*.md`.
