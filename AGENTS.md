# AGENTS.md — guía operativa para agentes (gym-app)

Este archivo es la fuente de verdad operativa. Si algo que necesitás no está en el repo, **no existe**: preguntá, no inventes.

## 1. Qué es este proyecto
Web de gestión de **un gimnasio**. Dos roles: `ADMIN` (admin/profe, mismo rol) y `STUDENT`.
Admin: disciplinas, horarios, clases, cupos, alumnos, planes, vencimientos. Alumno: ver grilla, reservar, cancelar, ver su saldo.
Contexto completo: `docs/00-dominio-y-reglas.md` (reglas RN-xx y decisiones D-xx). Casos de uso: `docs/specs/`.

## 2. Glosario (usar siempre estos términos, en el código en inglés)
| Español | Código | Significado |
|---|---|---|
| Disciplina | `Discipline` | Funcional, Spinning, Híbrido, Personalizado (datos, no enum). |
| Horario | `ClassSchedule` | Plantilla recurrente semanal. |
| Clase | `ClassSession` | Ocurrencia concreta con fecha/hora y cupo. |
| Cupo | `capacity` | Lugares de una clase. |
| Plan | `Plan` | Pase libre con N clases por período de 30 días (Plan 12, Plan 15). |
| Membresía | `Membership` | Plan tomado por un alumno, con inicio y vencimiento. |
| Saldo | `balance` | Clases disponibles; **siempre derivado**, nunca contador guardado. |
| Reserva | `Booking` | Alumno ↔ clase. |
| Corte | `cutoffMinutes` | 10 min antes del inicio: ya no se reserva ni cancela. |

## 2b. Comandos (definidos en Slice 0; ver `docs/specs/SLICE-0-esqueleto.md`)
```
npm install        npm run dev         npm run lint        npm run typecheck
npm test           npm run test:int    npm run test:e2e    npm run build
npm run db:migrate npm run db:seed
```
Antes de dar algo por terminado: `lint`, `typecheck`, `test`, `test:int` y `build` en verde.

## 3. Arquitectura y dependencias entre capas
```
src/domain/   reglas de negocio PURAS (sin framework, sin BD, sin fechas "ahora" implícitas: recibir `now`)
src/server/   servicios/casos de uso, repositorios, auth. Orquesta domain + db en transacciones.
src/app/      rutas y UI (admin/, alumno/). Sin reglas de negocio.
src/db/       esquema y migraciones.
tests/        unit · integration (Postgres real) · e2e (Playwright)
```
Dirección permitida: `app → server → domain`, `server → db`. **`domain` no importa de nada fuera de sí mismo.** Hay una regla de lint que lo verifica.

## 4. Reglas que NUNCA se rompen
1. Nunca calcular cupo ni saldo en el cliente: el servidor decide siempre.
2. Nunca guardar el saldo como contador: se deriva (RN-12).
3. Toda acción protegida verifica el rol **en el servidor**. Cada ruta/acción admin tiene test negativo (alumno → 403).
4. Fechas en UTC en BD; zona `America/Montevideo` solo en el borde de presentación y para decidir "día" de vigencia. `domain` recibe `now` por parámetro.
5. Nunca editar una migración ya aplicada: crear una nueva.
6. Reservar/cancelar corren dentro de **una transacción** con bloqueos (`FOR UPDATE`) en el orden: `class_session` → `membership`.
7. Bajas lógicas; el historial de reservas y membresías no se borra.
8. Toda escritura admin escribe en `audit_log`.
9. No agregar dependencias sin ADR o mención en el PR.
10. Mensajes de error al usuario en español (es-UY); códigos de error estables en inglés (ej. `CLASS_FULL`).

## 5. Flujo de trabajo (Harness)
1. **Spec primero**: no se escribe código de un UC sin `docs/specs/UC-xx.md` aprobado. Plantilla: `docs/specs/_TEMPLATE.md`.
2. **Tests desde los criterios de aceptación**: cada criterio Dado/Cuando/Entonces → al menos un test, con el ID del UC y las RN en el nombre.
3. **PRs pequeños**: un UC o sub-UC por PR, rama `uc/<id>-<slug>`. Slices de infraestructura (p. ej. Slice 0): rama `slice-<n>/<bloque>`.
4. **Roles de agente**: Planner → Implementer → Verifier (QA/E2E, intenta romper reglas) → Reviewer (contexto limpio). Ver `docs/adr/ADR-002-harness.md` cuando exista.
5. **Definition of Done**: ver `.github/pull_request_template.md`.
6. **Duda de negocio** → abrir pregunta en el PR / spec (sección "Preguntas abiertas") y detenerse en esa parte. No asumir.
7. Si el arnés falla (un agente se equivoca repetidamente), **arreglar el arnés**: agregar test, regla de lint, contexto en este archivo o en la spec.

## 6. Convenciones
- TypeScript estricto. Zod en los bordes (formularios, acciones del servidor). Errores de dominio tipados (`Result` / clases de error con `code`).
- Nombres de código en inglés; UI en español.
- Commits: `tipo(UC-xx): descripción` (feat, fix, test, docs, refactor, chore).
- Tests de reglas de tiempo (corte de 10 min, vencimiento) usan reloj inyectado, nunca `Date.now()` directo.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
