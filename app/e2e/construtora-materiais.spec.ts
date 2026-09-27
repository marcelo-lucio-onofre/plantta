import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

test.describe("Construtora — Catálogo de materiais (3D/AR)", () => {
  test("cria um material novo com foto e vê o preview 3D/AR", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/materiais");
    await expect(page.getByRole("heading", { name: "Materiais" })).toBeVisible();

    await page.click('button:has-text("Novo material")');
    await page.fill("#mat-modelo", "Porcelanato E2E 60x60");
    await page.fill("#mat-sku", "E2E-TEST-6060");

    const buffer = Buffer.from(
      "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM5OTkiLz48L3N2Zz4=",
      "base64",
    );
    await page.setInputFiles("#mat-foto", { name: "textura.svg", mimeType: "image/svg+xml", buffer });

    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });

    await page.click('button:has-text("Ver em AR")');
    await expect(page.locator("model-viewer")).toBeVisible({ timeout: 15_000 });

    await page.click('button:has-text("Salvar")');
    await expect(page.getByText("Material criado.")).toBeVisible();
    await expect(page.getByText("Porcelanato E2E 60x60")).toBeVisible();
  });

  test("edita um material existente com foto já cadastrada", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/materiais");
    await page.click('button[aria-label="Editar Premium 80×80"]');
    await expect(page.locator("#mat-modelo")).toHaveValue("Premium 80×80");
    await page.locator("#mat-roughness").fill("0.8");
    await page.click('button:has-text("Preview 3D")');
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
    await page.click('button:has-text("Salvar")');
    await expect(page.getByText("Material atualizado.")).toBeVisible();
  });

  test("filtra materiais por categoria", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/materiais");
    await page.selectOption("select >> nth=0", { label: "Piso" });
    await expect(page.getByText("Premium 80×80")).toBeVisible();
  });
});
