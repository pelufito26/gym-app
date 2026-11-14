import postgres from "postgres";
import { requireDatabaseUrl } from "./env";

/**
 * Datos iniciales. En el bloque 5 del Slice 0 crea el admin inicial
 * a partir de ADMIN_EMAIL / ADMIN_PASSWORD. Debe ser idempotente.
 */
async function main() {
  const sql = postgres(requireDatabaseUrl(), { max: 1, onnotice: () => {} });
  try {
    await sql`select 1`;
    console.log("db:seed: conexión OK, todavía no hay datos para sembrar.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("db:seed falló:", err);
  process.exit(1);
});
