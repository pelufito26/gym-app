import { afterEach, describe, expect, it, vi } from "vitest";
import { requireTestDatabaseUrl } from "@/db/env";

// Arnés: los tests de integración nunca deben poder apuntar a la base de desarrollo.
describe("SLICE-0 requireTestDatabaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa TEST_DATABASE_URL cuando está definida", () => {
    vi.stubEnv("TEST_DATABASE_URL", "postgres://u:p@localhost:5432/gym_test");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@localhost:5432/gym_dev");
    expect(requireTestDatabaseUrl()).toContain("/gym_test");
  });

  it("rechaza una base cuyo nombre no contiene 'test'", () => {
    vi.stubEnv("TEST_DATABASE_URL", "postgres://u:p@localhost:5432/gym_dev");
    expect(() => requireTestDatabaseUrl()).toThrow(/base de test/);
  });
});
