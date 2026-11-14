import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

// SLICE-0 tarea 2 / CA-6: la regla de capas (eslint.config.mjs) rechaza imports prohibidos.
// Se lintea código en memoria con la configuración real del repo (los archivos no necesitan existir).
let eslint: ESLint;

// Cargar la config y los plugins de eslint-config-next tarda varios segundos la primera vez.
beforeAll(async () => {
  eslint = new ESLint({ cwd: process.cwd() });
  await eslint.lintText("export {};\n", { filePath: "src/domain/warmup.ts" });
}, 60_000);

const LAYER_RULES = new Set(["no-restricted-imports", "no-restricted-syntax"]);

async function layerErrors(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  // Un error de parseo (fatal) haría pasar en falso los casos "permitido".
  expect(result.messages.filter((m) => m.fatal)).toEqual([]);
  return result.messages
    .filter((m) => m.ruleId !== null && LAYER_RULES.has(m.ruleId))
    .map((m) => m.message);
}

const staticImport = (source: string) => `import * as m from "${source}";\nexport const y = m;\n`;
const dynamicImport = (source: string) => `export const f = () => import("${source}");\n`;
const reExport = (source: string) => `export * from "${source}";\n`;

describe("SLICE-0 regla de capas", () => {
  describe("domain (CA-6)", () => {
    it("CA-6 rechaza un import de src/app dentro de src/domain (alias @/)", async () => {
      const errors = await layerErrors("src/domain/fixture.ts", staticImport("@/app/page"));
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatch(/domain no importa de otras capas/);
    });

    it.each([
      ["../../app/page", "src/domain/booking/fixture.ts"],
      ["./../app/page", "src/domain/fixture.ts"],
      ["../../src/app/page", "src/domain/fixture.ts"],
      ["..//app/page", "src/domain/fixture.ts"],
    ])("CA-6 rechaza el import relativo de src/app %s", async (source, file) => {
      expect(await layerErrors(file, staticImport(source))).toHaveLength(1);
    });

    it.each([
      ["import()", dynamicImport],
      ["export * from", reExport],
    ])("CA-6 rechaza src/app vía %s", async (_kind, build) => {
      expect(await layerErrors("src/domain/fixture.ts", build("@/app/page"))).toHaveLength(1);
    });

    it.each(["src/domain/fixture.js", "src/domain/fixture.mjs", "src/domain/fixture.mts"])(
      "CA-6 también aplica a %s",
      async (file) => {
        expect(await layerErrors(file, staticImport("@/app/page"))).toHaveLength(1);
      },
    );

    it.each([
      "@/server/auth",
      "@/db/schema",
      "@/lib/utils",
      "@/components/ui/button",
      "next/headers",
      "drizzle-orm",
      "drizzle-orm/pg-core",
      "postgres",
      "react",
      "react/jsx-runtime",
      "react-dom/client",
    ])("domain no puede importar %s", async (source) => {
      expect(await layerErrors("src/domain/fixture.ts", staticImport(source))).toHaveLength(1);
    });

    it("domain no puede importar next con import() dinámico", async () => {
      expect(await layerErrors("src/domain/fixture.ts", dynamicImport("next/headers"))).toHaveLength(1);
    });

    it("domain puede importar de sí mismo y librerías puras", async () => {
      const errors = await layerErrors(
        "src/domain/booking/fixture.ts",
        'import * as a from "@/domain/clock";\nimport * as b from "../clock";\nimport * as c from "./rules";\nimport { z } from "zod";\nexport const y = [a, b, c, z];\nexport const f = () => import("./lazy");\n',
      );
      expect(errors).toEqual([]);
    });
  });

  describe("app", () => {
    it.each([
      ["@/db/schema", staticImport],
      ["@/db/schema", dynamicImport],
      ["../../db/schema", staticImport],
      ["postgres", staticImport],
      ["drizzle-orm", staticImport],
    ])("la capa app no accede a la BD: %s", async (source, build) => {
      const errors = await layerErrors("src/app/admin/page.tsx", build(source));
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatch(/pasá por src\/server/);
    });

    it("src/components y src/lib también son capa app", async () => {
      expect(await layerErrors("src/components/x.tsx", staticImport("@/db/schema"))).toHaveLength(1);
      expect(await layerErrors("src/lib/x.ts", staticImport("@/db/schema"))).toHaveLength(1);
    });

    it("la capa app puede importar de server y domain", async () => {
      const errors = await layerErrors(
        "src/app/admin/page.tsx",
        'import * as s from "@/server/auth";\nimport * as d from "@/domain/clock";\nexport const y = [s, d];\n',
      );
      expect(errors).toEqual([]);
    });
  });

  describe("server y db", () => {
    it("server puede importar de domain y db", async () => {
      const errors = await layerErrors(
        "src/server/fixture.ts",
        'import * as d from "@/domain/clock";\nimport * as db from "@/db/schema";\nexport const y = [d, db];\n',
      );
      expect(errors).toEqual([]);
    });

    it.each(["@/app/page", "@/components/ui/button", "@/lib/utils", "../app/page"])(
      "server no importa de la capa app: %s",
      async (source) => {
        expect(await layerErrors("src/server/fixture.ts", staticImport(source))).toHaveLength(1);
      },
    );

    it.each(["@/app/page", "@/components/ui/button", "../lib/utils"])(
      "db no importa de la capa app: %s",
      async (source) => {
        expect(await layerErrors("src/db/fixture.ts", staticImport(source))).toHaveLength(1);
      },
    );
  });
});
