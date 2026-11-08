# Política de uso de Figma (conexión mínima)

Objetivo: conectarse a Figma **lo mínimo imprescindible**, y solo con permiso explícito del usuario.

## Enforcement
- Hook `PreToolUse` sobre `mcp__figma__.*`: [.claude/hooks/figma-guard.mjs](../../.claude/hooks/figma-guard.mjs), registrado en [.claude/settings.json](../../.claude/settings.json).
- Cada llamada a Figma **pregunta al usuario** y muestra: herramienta, tipo (lectura ligera / pesada / escritura), objetivo (`fileKey`, `nodeId`), avisos y si ya existe caché local.
- Si el hook falla, la llamada se bloquea (`onFailure: block`).

## Comprobaciones previas obligatorias (en este orden, antes de pedir permiso)
1. **¿Ya está en la spec?** Buscar en `docs/specs/` y `CLAUDE.md` (paleta, medidas, textos). Si está, no se llama a Figma.
2. **¿Ya está en caché?** Buscar en `docs/design/cache/` un fichero `{fileKey}_{nodeId}.*`. Si existe, se lee el fichero.
3. **¿Se puede resolver sin Figma?** (valores ya conocidos, el usuario puede dar el dato).
4. **Elegir lo más pequeño**: el nodo más específico, la herramienta más ligera (`get_metadata` < `get_screenshot` < `get_design_context`), `excludeScreenshot: true` si no hace falta la imagen, `maxDimension ≤ 1024`.
5. Un nodo por llamada; nunca el frame raíz si basta un hijo.

## Justificación previa (el humano la ve antes de decidir)
Antes de cada llamada, Claude escribe **una frase** con:
- **Qué dato** necesita (p. ej. "radio y color del botón Export").
- **Por qué no sale** de la spec ni de la caché.
- **Qué llamada** hará (herramienta + nodo) y su coste (ligera/pesada).

Si el usuario rechaza, Claude **no** reintenta con otra herramienta equivalente: pregunta.

## Después de la llamada
Guardar en `docs/design/cache/{fileKey}_{nodeId con "-"}.md` lo relevante (valores, medidas, textos, IDs de assets). No guardar URLs temporales de assets: descargar el asset al proyecto.

## Qué está prohibido sin petición expresa
- Herramientas de **escritura** (`use_figma`, `generate_*`, `send_code_to_figma`, `create_new_file`, `upload_assets`, `weave_*`, shaders, plugins). El proyecto solo lee.
- Barridos del archivo completo o de varios nodos "por si acaso".

## Estado actual (no repetir estas lecturas)
Ya leído el 2026-11-08 del archivo `BBDh2z0KhAymBQ64eSMsXM`: estructura completa de `4:606` (metadatos), capturas de `4:606` y `4:1520`, contexto de `4:607`, `4:656`, `4:890`. Los valores útiles están en S01 (tokens) y S05–S08.
