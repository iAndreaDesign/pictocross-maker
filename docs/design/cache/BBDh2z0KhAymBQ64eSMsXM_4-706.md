# Editor card (Solution editor, nodo 4:706) y pantalla 4:606 — leído 2026-11-09
Herramientas: `get_design_context` (4:706) y `get_screenshot` (4:606).

## Grid del editor (nodo 4:728)
| Elemento | Valor |
|---|---|
| Fondo / casilla vacía | `#FFFDF7` (= `--color-input`) |
| Línea fina entre casillas vacías | `#FFF4EA`, 0.5 px |
| Casilla pintada | `#9E5139` (= `--color-cell-filled`) |
| Línea fina junto a casilla pintada | `#B26D52`, 0.5 px |
| Reglas gruesas (cada 5 y borde exterior) | `#897262`, 2 px |
| Números de regla | `#806D60`, Inter Regular 10 px |
Sin radio en el grid. Tarjeta: fondo `#FCF6EE`, borde `#D6C4B5`, radio 20, padding 24, gap 16.
Toggle: contenedor `#EADED5` radio 8 / padding 3; seleccionado `#D67747` radio 6; Inter SemiBold 11.
Pie: icono puntero + "Haz clic o arrastra para pintar." (Inter 11, `#806D60`) y contador "72 / 100 celdas" (SemiBold 11, `#46352D`).

## Layout de la pantalla (4:606, 1440 px)
Cabecera (beige) → **barra de configuración a todo el ancho** (fondo `#FCF6EE`, borde inferior; icono rejilla, Height, ×, Width, Clear, Invert; sin presets) → título del proyecto con lápiz **fuera de las tarjetas** → dos tarjetas (editor | preview). Pie con copyright.
Cabecera: botones "Export as PDF", "Export as PNG" (terracota) y "Export solution" (blanco) a la derecha.
