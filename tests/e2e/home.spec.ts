import { expect, test } from "@playwright/test";

// Humo del bloque 1: la app levanta y la home responde en español.
test("SLICE-0 la home carga con el nombre del gimnasio", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es-UY");
});
