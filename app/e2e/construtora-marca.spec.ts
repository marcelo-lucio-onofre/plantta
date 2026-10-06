import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

test.describe("Construtora — Marca do portal do cliente", () => {
  test("altera nome, cor e salva", async ({ page }) => {
    await loginConstrutora(page, "/marca");
    await expect(page.getByRole("heading", { name: "Personalizar portal do cliente" })).toBeVisible();

    await page.fill('input[placeholder="Prado Engenharia"]', "Marca E2E");
    await page.click('button[aria-label="#7c3aed"]');
    await expect(page.getByText("Marca E2E").first()).toBeVisible();

    await page.click('button:has-text("Salvar e aplicar no portal")');
    await page.waitForURL("**/painel");
  });

  test("faz upload de um logo e depois remove", async ({ page }) => {
    await loginConstrutora(page, "/marca");
    const buffer = Buffer.from(
      "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM5OTkiLz48L3N2Zz4=",
      "base64",
    );
    await page.setInputFiles('input[type="file"]', { name: "logo.svg", mimeType: "image/svg+xml", buffer });
    await expect(page.getByAltText("Logo").first()).toBeVisible();

    await page.click('button:has-text("Remover logo")');
    await expect(page.getByAltText("Logo")).toHaveCount(0);
  });
});
