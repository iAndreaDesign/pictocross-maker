# Proceso SDD

## Estados de una spec
`draft` → `approved` → `in-progress` → `done`

## Ciclo por scope
1. **Spec** (`docs/specs/Sxx-*.md`): objetivo, alcance, fuera de alcance, requisitos `REQ-Sxx-nn`, criterios de aceptación (Given/When/Then o checklist verificable).
2. **Revisión**: el usuario aprueba la spec (`approved`).
3. **Tareas**: cada tarea es pequeña (≤ ~1 h), referencia REQ y tiene su "Hecho cuando".
4. **Implementación**: una tarea cada vez; test primero cuando sea lógica de dominio.
5. **Verificación**: todos los criterios de aceptación cumplidos, tests y build en verde.
6. **Cierre**: spec a `done`, `scopes.md` actualizado, notas de desviaciones en la sección "Decisiones".

## Flujo de PR (una por tarea)
1. Rama desde `main`: `feat/Sxx-Txx.y-slug`.
2. Implementar **solo** esa tarea (código + tests + spec marcada `[x]`).
3. **Validación previa con el humano**: resumen con tarea, REQ cubiertos, tests ejecutados, capturas (si hay UI) y desviaciones. Esperar "ok" explícito.
4. Con el "ok": commit (convencional, `feat(Sxx): ...`), push y PR con plantilla (tarea, REQ, criterios, cómo probar).
5. El humano revisa y **hace el merge**. Hasta entonces no se empieza la siguiente tarea.
6. Si el humano pide cambios: nuevos commits en la misma rama/PR.

Nota: Figma solo se consulta según `docs/sdd/figma-policy.md` (hook con confirmación).

## Plantilla de spec
```md
# Sxx — Título
Estado: draft | Depende de: Syy

## Objetivo
## Alcance / Fuera de alcance
## Requisitos
- REQ-Sxx-01 ...
## Criterios de aceptación
- [ ] ...
## Tareas
- [ ] Txx.1 (REQ-Sxx-01) descripción — Hecho cuando: ...
## Decisiones
```

## Definition of Done (global)
- Criterios de aceptación del scope cumplidos.
- Tests unitarios del código nuevo, en verde.
- `npm run build` y `npm run lint` sin errores.
- Sin `any`, sin código muerto, sin TODOs sin referenciar.
- Spec y `scopes.md` actualizados.
