import { test, expect } from "./fixtures";

test.describe("Landing pública", () => {
  test("mostra a proposta de valor e leva aos três pontos de entrada", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /A construtora monta o catálogo/ })).toBeVisible();

    await expect(page.getByRole("link", { name: "Entrar · Cliente" })).toHaveAttribute("href", "/login/cliente");
    await expect(page.getByRole("link", { name: "Entrar · Construtora" })).toHaveAttribute("href", "/login/construtora");
    await expect(page.getByRole("link", { name: "Portal com marca da construtora" })).toHaveAttribute("href", "/login/cliente/marca");
  });

  test("CTAs do corpo navegam pros logins", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Agendar demonstração")');
    await page.waitForURL("**/login/construtora");

    await page.goBack();
    await page.click('button:has-text("Ver o fluxo completo")');
    await page.waitForURL("**/login/cliente");
  });

  test("rota desconhecida cai de volta pra landing", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");
    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: /A construtora monta o catálogo/ })).toBeVisible();
  });
});
