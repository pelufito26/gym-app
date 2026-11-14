import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Capas (AGENTS.md §3). Dirección permitida: app → server → domain, server → db.
 * `src/components` y `src/lib` cuentan como capa app.
 * El test `tests/unit/layers.lint.test.ts` demuestra que estas reglas fallan si se violan.
 *
 * Cada restricción se aplica a imports estáticos y `export ... from` (no-restricted-imports)
 * y a `import()` dinámicos (no-restricted-syntax). `require()` ya lo prohíbe
 * `@typescript-eslint/no-require-imports`.
 */
const SOURCE_FILES = "*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}";

/** Import relativo que sale hacia la carpeta de otra capa: `../app`, `./../../src/server`, `..//db`. */
const relativeTo = (layers) => `^(\\./+)?(\\.\\./+)+(src/+)?(${layers})(/|$)`;
/** Paquete o cualquiera de sus subpaths: `react`, `react/jsx-runtime`. */
const packages = (names) => `^(${names})(/|$)`;

function layerRules(restrictions) {
  return {
    "no-restricted-imports": [
      "error",
      { patterns: restrictions.map(({ regex, message }) => ({ regex, message })) },
    ],
    "no-restricted-syntax": [
      "error",
      ...restrictions.map(({ regex, message }) => ({
        // esquery: la regex va entre barras, así que se escapan las "/" internas.
        selector: `ImportExpression[source.value=/${regex.replaceAll("/", "\\/")}/]`,
        message,
      })),
    ],
  };
}

const DOMAIN_MSG =
  "domain no importa de otras capas (AGENTS.md §3). Recibí lo que necesites por parámetro.";
const DOMAIN_PURE_MSG = "domain es puro: sin framework ni BD (AGENTS.md §3).";
const APP_DB_MSG = "La capa app no accede a la BD: pasá por src/server (AGENTS.md §3).";
const SERVER_MSG = "server no importa de la capa app (UI); la dependencia va app → server (AGENTS.md §3).";
const DB_MSG = "db no importa de la capa app (UI) (AGENTS.md §3).";

const UI_LAYERS = "app|components|lib";

const domainRules = layerRules([
  { regex: "^@/(?!domain(/|$))", message: DOMAIN_MSG },
  { regex: relativeTo(`${UI_LAYERS}|server|db`), message: DOMAIN_MSG },
  {
    regex: packages("react|react-dom|next|next-auth|@auth|drizzle-orm|drizzle-kit|postgres"),
    message: DOMAIN_PURE_MSG,
  },
]);

const appRules = layerRules([
  { regex: "^@/db(/|$)", message: APP_DB_MSG },
  { regex: relativeTo("db"), message: APP_DB_MSG },
  { regex: packages("drizzle-orm|drizzle-kit|postgres"), message: APP_DB_MSG },
]);

const serverRules = layerRules([
  { regex: `^@/(${UI_LAYERS})(/|$)`, message: SERVER_MSG },
  { regex: relativeTo(UI_LAYERS), message: SERVER_MSG },
]);

const dbRules = layerRules([
  { regex: `^@/(${UI_LAYERS})(/|$)`, message: DB_MSG },
  { regex: relativeTo(UI_LAYERS), message: DB_MSG },
]);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: [`src/domain/**/${SOURCE_FILES}`], rules: domainRules },
  {
    files: [
      `src/app/**/${SOURCE_FILES}`,
      `src/components/**/${SOURCE_FILES}`,
      `src/lib/**/${SOURCE_FILES}`,
    ],
    rules: appRules,
  },
  { files: [`src/server/**/${SOURCE_FILES}`], rules: serverRules },
  { files: [`src/db/**/${SOURCE_FILES}`], rules: dbRules },
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
