# SLICE-0 · Esqueleto, CI, auth y roles

- **Actor:** equipo/agentes · **Prioridad:** P0 · **Fase:** F0
- **Casos de uso:** UC-AUTH01 (login por rol)
- **Estado:** aprobado para ejecutar

## Objetivo
Dejar un proyecto que corre, se testea y se despliega, con login por rol y las puertas de CI en verde, para que los slices siguientes solo agreguen casos de uso.

## Tareas (en orden; un PR por bloque)
1. **Scaffold**: Next.js (App Router) + TypeScript estricto + Tailwind + shadcn/ui. Los scripts de `AGENTS.md §2b` deben existir y funcionar: `dev`, `lint`, `typecheck`, `test`, `test:int`, `test:e2e`, `build`, `db:migrate`, `db:seed`.
2. **Capas**: crear `src/domain`, `src/server`, `src/app`, `src/db`. Regla de lint (p. ej. `eslint-plugin-boundaries` o `no-restricted-imports`) que prohíbe a `domain` importar de otras capas; verificar que **falla** si se viola (test de la regla).
3. **Base de datos**: Drizzle + Postgres (docker-compose para desarrollo). Migración inicial con `settings` (singleton), `user`, `student_profile`, `audit_log`.
4. **Auth**: Auth.js con credenciales; hash argon2/bcrypt; roles `ADMIN`/`STUDENT`; helper de servidor `requireRole(role)`; middleware de rutas `/admin/*` y `/alumno/*`. Seed: un admin inicial vía variables de entorno.
5. **Reloj inyectable**: `Clock` en `domain/` y su implementación real/fake para tests (prohibido `Date.now()` directo en reglas).
6. **CI**: el workflow `.github/workflows/ci.yml` debe pasar en una PR de prueba.
7. **Páginas mínimas**: `/login`, `/admin` (placeholder), `/alumno` (placeholder).

## Criterios de aceptación
- **CA-1** Dado un admin válido, cuando inicia sesión, entonces llega a `/admin`.
- **CA-2** Dado un alumno válido, cuando inicia sesión, entonces llega a `/alumno`.
- **CA-3** Con credenciales inválidas se muestra un mensaje genérico que no revela si el email existe.
- **CA-4** Un alumno que pide `/admin` (página o acción de servidor) recibe 403/redirección; test negativo en integración y E2E.
- **CA-5** Un usuario sin sesión que pide `/admin` o `/alumno` es redirigido a `/login`.
- **CA-6** La regla de capas rechaza un import de `src/app` dentro de `src/domain` (test que lo demuestra).
- **CA-7** `npm run lint && npm run typecheck && npm test && npm run test:int && npm run build` y `npm run test:e2e` pasan en CI.

## Fuera de alcance
Alta de alumnos (UC-A09), cambio de contraseña (UC-AUTH02), cualquier ABM.

## Preguntas abiertas
- Proveedor de Postgres/hosting (decisión I) — no bloquea el desarrollo local.
