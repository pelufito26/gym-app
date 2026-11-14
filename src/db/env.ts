/**
 * Carga `.env` para los scripts que corren fuera de Next (migraciones, seed, tests).
 * Next ya carga `.env` por su cuenta. En CI las variables vienen del entorno y no hay archivo.
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
