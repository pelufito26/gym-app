import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

// SLICE-0 tarea 2 / CA-6: la regla de capas (eslint.config.mjs) rechaza imports prohibidos.
// Se lintea código en memoria con la configuración real del repo.
let eslint: ESLint;

// Cargar la config y los plugins de eslint-config-next tarda varios segundos la primera vez.
beforeAll(async () => {
  eslint = new ESLint({ cwd: process.cwd() });
  await eslint.lintText("export {};\n", { filePath: "src/domain/warmup.ts" });
}, 60_000);

async function layerErrors(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages
    .filter((m) => m.ruleId === "no-restricted-imports")
    .map((m) => m.message);
}

describe("SLICE-0 regla de capas", () => {
  it("CA-6 rechaza un import de src/app dentro de src/domain (alias @/)", async () => {
    const errors = await layerErrors(
      "src/domain/fixture.ts",
      'import { x } from "@/app/page";\nexport const y = x;\n',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/domain no importa de otras capas/);
  });

  it("CA-6 rechaza un import relativo de src/app dentro de src/domain", async () => {
    const errors = await layerErrors(
      "src/domain/booking/fixture.ts",
      'import { x } from "../../app/page";\nexport const y = x;\n',
    );
    expect(errors).toHaveLength(1);
  });

  it.each([
    ["@/server/auth"],
    ["@/db/schema"],
    ["@/lib/utils"],
    ["@/components/ui/button"],
    ["next/headers"],
    ["drizzle-orm"],
    ["postgres"],
    ["react"],
  ])("domain no puede importar %s", async (source) => {
    const errors = await layerErrors(
      "src/domain/fixture.ts",
      `import * as m from "${source}";\nexport const y = m;\n`,
    );
    expect(errors).toHaveLength(1);
  });

  it("domain puede importar de sí mismo y librerías puras", async () => {
    const errors = await layerErrors(
      "src/domain/booking/fixture.ts",
      'import * as a from "@/domain/clock";\nimport * as b from "../clock";\nimport * as c from "./rules";\nimport { z } from "zod";\nexport const y = [a, b, c, z];\n',
    );
    expect(errors).toEqual([]);
  });

  it("la capa app no accede a la BD directamente", async () => {
    const errors = await layerErrors(
      "src/app/admin/page.tsx",
      'import * as db from "@/db/schema";\nexport const y = db;\n',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/pasá por src\/server/);
  });

  it("server puede importar de domain y db", async () => {
    const errors = await layerErrors(
      "src/server/fixture.ts",
      'import * as d from "@/domain/clock";\nimport * as db from "@/db/schema";\nexport const y = [d, db];\n',
    );
    expect(errors).toEqual([]);
  });
});
