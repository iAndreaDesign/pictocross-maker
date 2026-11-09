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

## Flujo de PR (una por scope)
1. Una rama por scope desde `main` actualizado: `feat/Sxx-slug`.
2. Implementar las subtareas en orden; cada una es un commit convencional (`feat(Sxx): Txx.y ...`) con su tarea marcada `[x]` en la spec. Sin PR ni preguntas entre subtareas.
3. Al cerrar el scope: spec y `scopes.md` a `done`, tests/lint/build en verde, resumen al humano (tarea(s), REQ, tests, capturas si hay UI, desviaciones).
4. Con el "ok" (o autorización expresa): push y **una** PR con la plantilla (REQ, criterios, cómo probar).
5. El humano revisa y **hace el merge** (salvo que lo pida). No se empieza el scope siguiente sobre ramas apiladas: se espera al merge.
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
