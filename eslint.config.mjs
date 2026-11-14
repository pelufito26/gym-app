import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Capas (AGENTS.md §3). Dirección permitida: app → server → domain, server → db.
 * `src/components` y `src/lib` cuentan como capa app.
 * El test `tests/unit/layers.lint.test.ts` demuestra que estas reglas fallan si se violan.
 */
const otherLayers = "(app|server|db|components|lib)";

const domainRestrictedImports = {
  paths: [
    { name: "react", message: "domain es puro: sin framework (AGENTS.md §3)." },
    { name: "react-dom", message: "domain es puro: sin framework (AGENTS.md §3)." },
    { name: "postgres", message: "domain es puro: sin BD (AGENTS.md §3)." },
  ],
  patterns: [
    {
      regex: `^@/(?!domain(/|$))`,
      message: "domain no importa de otras capas (AGENTS.md §3). Recibí lo que necesites por parámetro.",
    },
    {
      regex: `^(\\.\\./)+${otherLayers}(/|$)`,
      message: "domain no importa de otras capas (AGENTS.md §3). Recibí lo que necesites por parámetro.",
    },
    {
      regex: "^(next|next-auth|drizzle-orm|@auth)(/|$)",
      message: "domain es puro: sin framework ni BD (AGENTS.md §3).",
    },
  ],
};

const appRestrictedImports = {
  patterns: [
    {
      regex: "^@/db(/|$)",
      message: "La capa app no accede a la BD: pasá por src/server (AGENTS.md §3).",
    },
    {
      regex: "^(\\.\\./)+db(/|$)",
      message: "La capa app no accede a la BD: pasá por src/server (AGENTS.md §3).",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", domainRestrictedImports] },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", appRestrictedImports] },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Salidas de tests:
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
