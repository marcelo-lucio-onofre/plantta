import { test, expect } from "./fixtures";
import { gotoComoCliente, VINCULOS } from "./helpers";

test.describe("Cliente — Portal (meu apartamento)", () => {
  test("mostra saldo e ambientes, navega pro carrinho e pra calculadora", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/portal");
    await expect(page.getByRole("heading", { name: "Meu apartamento" })).toBeVisible();
    await expect(page.getByText("Saldo líquido")).toBeVisible();
    await expect(page.getByText("Créditos gerados")).toBeVisible();

    await page.click('a:has-text("Carrinho")');
    await page.waitForURL("**/carrinho");
  });

  test("botão Personalizar de um item leva à seleção", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/portal");
    const linhaPiso = page.locator(".card.row", { hasText: "Piso" }).first();
    await linhaPiso.getByRole("link", { name: /Personalizar|Alterar/ }).click();
    await page.waitForURL(/\/selecao\//);
  });
});
