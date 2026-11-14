# gym-app

Plataforma web de gestión para un gimnasio: grilla de clases, cupos, reservas de alumnos y seguimiento de planes/vencimientos.

- Disciplinas iniciales: Entrenamiento funcional, Spinning, Híbrido, Entrenamiento personalizado.
- Roles: Admin/Profe y Alumno.
- Stack: Next.js (App Router) + TypeScript · PostgreSQL · Drizzle · Auth.js · Zod · Tailwind/shadcn · Vitest + Playwright (ver `docs/adr/ADR-001-stack.md`).

## Primeros pasos (desarrollo local)
Requisitos: Node 22 (`.nvmrc`) y Docker Desktop.
```bash
npm install
cp .env.example .env
docker compose up -d          # Postgres 16 local
npm run db:migrate && npm run db:seed
npm run dev                   # http://localhost:3000
```
Verificación completa: `npm run lint && npm run typecheck && npm test && npm run test:int && npm run build`.
E2E: `npx playwright install chromium` (una vez) y `npm run test:e2e`.

## Cómo se trabaja acá
Este repo se desarrolla con agentes dentro de un arnés (Harness Engineering). Leer en este orden:
1. `AGENTS.md` — reglas operativas.
2. `docs/00-dominio-y-reglas.md` — negocio, reglas RN y decisiones.
3. `docs/specs/` — un spec por caso de uso (criterios de aceptación = tests).
4. `docs/adr/` — decisiones de arquitectura.

## Estado
Fase **F0 · Fundaciones**. Siguiente: ejecutar `docs/specs/SLICE-0-esqueleto.md`.

| Fase | Contenido |
|---|---|
| F0 | Esqueleto, CI, auth y roles |
| F1 | Disciplinas, horarios, clases generadas |
| F2 | Alumnos, planes, membresías, saldo, vencimientos |
| F3 | Grilla del alumno y reservas con concurrencia |
| F4 | Asistencia, reserva en nombre de, ajustes, piloto |
