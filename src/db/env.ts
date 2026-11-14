/**
 * Carga `.env` para los scripts que corren fuera de Next (migraciones, seed, tests).
 * Next ya carga `.env` por su cuenta. En CI las variables vienen del entorno y no hay archivo.
 * `process.loadEnvFile` no pisa variables ya definidas en el entorno.
 */
export function loadEnv(): void {
  try {
    process.loadEnvFile(".env");
  } catch {
    // Sin .env: se usan las variables del entorno.
  }
}

export function requireDatabaseUrl(): string {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. Copiá .env.example a .env o definila en el entorno.",
    );
  }
  return url;
}

/**
 * URL de la base para tests de integración: TEST_DATABASE_URL o, si no está (CI), DATABASE_URL.
 * Se niega a usar una base cuyo nombre no contenga "test", para que los tests
 * nunca limpien datos de desarrollo.
 */
export function requireTestDatabaseUrl(): string {
  loadEnv();
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta TEST_DATABASE_URL (o DATABASE_URL en CI). Ver .env.example.",
    );
  }
  const dbName = new URL(url).pathname.replace(/^\//, "");
  if (!dbName.includes("test")) {
    throw new Error(
      `Los tests de integración solo corren contra una base de test; "${dbName}" no lo parece.`,
    );
  }
  return url;
}
