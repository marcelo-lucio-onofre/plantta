import { test, expect } from "./fixtures";
import { gotoComoCliente, VINCULOS } from "./helpers";

test.describe("Cliente — Calculadora e Carrinho", () => {
  test("calculadora recalcula custo ao mover os sliders", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/calculadora");
    await expect(page.getByRole("heading", { name: "Calculadora de custo técnico" })).toBeVisible();

    const sliders = page.locator('input[type="range"]');
    await sliders.nth(0).fill("16");
    await expect(page.getByText("Custo adicional total")).toBeVisible();

    await sliders.nth(1).fill("6");
    await expect(page.getByText(/pontos extras/).first()).toBeVisible();
  });

  test("carrinho mostra o ledger e permite enviar para aprovação", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/carrinho");
    await expect(page.getByRole("heading", { name: "Carrinho de personalização" })).toBeVisible();
    await expect(page.getByText("Ledger de crédito")).toBeVisible();
    await expect(page.getByText("Saldo líquido")).toBeVisible();

    await page.click('button:has-text("Enviar para aprovação")');
    await page.waitForURL((url) => !url.pathname.startsWith("/carrinho"));
  });
});
