import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { requireTestDatabaseUrl } from "@/db/env";

// Humo del bloque 1: hay un Postgres real alcanzable en la base de test.
// No se saltea si falta la base: en CI tiene que fallar, no pasar en silencio.
const sql = postgres(requireTestDatabaseUrl(), { max: 1, onnotice: () => {} });

afterAll(async () => {
  await sql.end();
});

describe("SLICE-0 base de datos", () => {
  it("se conecta a Postgres 16 o superior", async () => {
    const [row] = await sql<{ server_version: string }[]>`show server_version`;
    expect(Number.parseInt(row.server_version, 10)).toBeGreaterThanOrEqual(16);
  });
});
