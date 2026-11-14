# src/server — casos de uso, repositorios y auth

- Orquesta `src/domain` + `src/db` dentro de transacciones (AGENTS.md §4.6).
- Verifica el rol en el servidor en toda acción protegida (AGENTS.md §4.3).
- La capa app (`src/app`, `src/components`, `src/lib`) accede a datos solo a través de acá, nunca a `src/db` directo.
