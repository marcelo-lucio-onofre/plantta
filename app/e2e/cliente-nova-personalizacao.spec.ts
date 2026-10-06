import { test, expect } from "./fixtures";
import { loginClienteGenerico } from "./helpers";

test.describe("Cliente — Nova personalização (wizard)", () => {
  test("fluxo completo: unidade → ambiente → item → opção → revisão → envio", async ({ page }) => {
    await loginClienteGenerico(page);
    await page.click('a[href="/personalizacoes/nova"]').catch(async () => {
      await page.goto("/personalizacoes/nova");
    });
    await expect(page.getByRole("heading", { name: "Nova personalização" })).toBeVisible();

    // Step 0 — unidade (Aurora, Apto 1204)
    await page.click('text=Apto 1204');

    // Step 1 — ambiente
    await page.click('text=Sala de Estar');

    // Step 2 — item (Piso)
    await page.locator('.stack.gap-sm button', { hasText: "Piso" }).first().click();

    // Step 3 — opção
    await page.click('button:has-text("Porcelanato Portobello Premium 80×80")');
    await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
    await page.click('button:has-text("Continuar")');

    // Step 4 — revisão e envio
    await expect(page.getByText("Resumo")).toBeVisible();
    await page.click('button:has-text("Enviar solicitação")');

    await page.waitForURL(/\/personalizacoes\/SOL-\d+/);
  });

  test("item paramétrico mostra o slider de quantidade", async ({ page }) => {
    await loginClienteGenerico(page);
    await page.goto("/personalizacoes/nova");

    await page.click('text=Apto 1204');
    await page.click('text=Sala de Estar');
    await page.locator('.stack.gap-sm button', { hasText: "Pontos Elétricos" }).first().click();

    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill("20");
    await expect(page.getByText("Custo estimado")).toBeVisible();
  });

  test("permite propor material próprio quando o catálogo não atende", async ({ page }) => {
    await loginClienteGenerico(page);
    await page.goto("/personalizacoes/nova");

    await page.click('text=Apto 1204');
    await page.click('text=Sala de Estar');
    await page.locator('.stack.gap-sm button', { hasText: "Piso" }).first().click();

    await page.click('button:has-text("Enviar material próprio")');
    await page.fill('input[placeholder*="Porcelanato importado"]', "Porcelanato XYZ 90x90");
    await page.fill('input[placeholder*="link do fabricante"]', "REF-XYZ-9090");
    const fornecedorInputs = page.locator('input[placeholder="Nome do fornecedor"]');
    await fornecedorInputs.nth(0).fill("Fornecedor A");
    await fornecedorInputs.nth(1).fill("Fornecedor B");
    const valorInputs = page.locator('input[placeholder="R$"]');
    await valorInputs.nth(0).fill("9000");
    await valorInputs.nth(1).fill("9500");
    await page.check('input[type="checkbox"]');

    await page.click('button:has-text("Enviar para análise")');
    await expect(page.getByText("Enviado para análise ✓")).toBeVisible();
  });
});
