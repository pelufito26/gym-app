import { existsSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { requireDatabaseUrl } from "./env";

const migrationsFolder = join("src", "db", "migrations");

async function main() {
  const sql = postgres(requireDatabaseUrl(), { max: 1, onnotice: () => {} });
  try {
    // Verifica la conexión aunque todavía no haya migraciones.
    await sql`select 1`;
    if (!existsSync(join(migrationsFolder, "meta", "_journal.json"))) {
      console.log("db:migrate: conexión OK, todavía no hay migraciones.");
      return;
    }
    await migrate(drizzle(sql), { migrationsFolder });
    console.log("db:migrate: migraciones aplicadas.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("db:migrate falló:", err);
  process.exit(1);
});
