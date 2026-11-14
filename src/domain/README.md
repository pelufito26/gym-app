# src/domain — reglas de negocio puras

- Sin framework (Next, React), sin BD (Drizzle, postgres) y sin "ahora" implícito: `now` o un `Clock` llegan por parámetro.
- Solo importa de sí mismo (`@/domain/...` o rutas relativas) y de librerías puras (p. ej. `zod`).
- La regla de lint `no-restricted-imports` de `eslint.config.mjs` lo verifica; ver `tests/unit/layers.lint.test.ts`.
