# ADR-001 · Stack tecnológico

- **Estado:** Aceptado (2026-11-11, confirmado por el dueño del producto)
- **Contexto:** MVP de un solo gimnasio, equipo mínimo, desarrollo con agentes. Se valora tipado de punta a punta, bajo costo operativo, y consistencia transaccional en reservas y saldo.

## Decisión
| Capa | Elección |
|---|---|
| App (UI + backend) | Next.js (App Router) + TypeScript estricto |
| Base de datos | PostgreSQL |
| ORM/migraciones | Drizzle (migraciones SQL versionadas) |
| Auth | Auth.js con credenciales y roles `ADMIN`/`STUDENT`; hash argon2/bcrypt |
| Validación | Zod |
| UI | Tailwind + shadcn/ui, mobile-first |
| Tests | Vitest (dominio), integración contra Postgres real, Playwright (E2E) |
| CI | GitHub Actions |
| Hosting | Vercel + Postgres gestionado (Neon o Supabase) — a confirmar |
| Jobs | Cron del proveedor (generación de clases) |

## Razones
- Un solo repo y lenguaje: menos contexto para los agentes y menos puntos de falla.
- PostgreSQL ofrece `SELECT … FOR UPDATE`, restricciones únicas y de exclusión: necesarias para evitar sobreventa de cupos y solapamiento de membresías.
- Drizzle mantiene el SQL visible y tipado; las migraciones son archivos revisables.
- Tests contra Postgres real (no mocks) para validar concurrencia.

## Consecuencias
- Las reglas de negocio viven en `src/domain` (puras) para poder testearlas sin framework.
- La concurrencia se resuelve en BD (transacción + bloqueos), no en memoria de la app (el serverless no la comparte).
- Cambiar de proveedor de hosting es barato; cambiar de Postgres no.

## Alternativas descartadas
- Backend separado (NestJS/Django) + SPA: más piezas para un MVP.
- BaaS puro (Firebase): sin transacciones relacionales fuertes para cupo/saldo.
- Contador de saldo persistido: riesgo de desincronización; se deriva (RN-12).

## Pendiente
- Proveedor concreto de Postgres/hosting y presupuesto (decisión I).
- ADR-002: definición del harness (roles de agentes, puertas de CI, plantillas).
