import { test, expect } from "./fixtures";

test.describe("Autenticação", () => {
  test("login de construtora leva ao painel", async ({ page }) => {
    await page.goto("/login/construtora");
    await expect(page.getByRole("heading", { name: "Painel da construtora" })).toBeVisible();
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/painel");
    await expect(page.getByRole("heading", { name: "Fila de solicitações" })).toBeVisible();
  });

  test("login genérico de cliente lista as personalizações", async ({ page }) => {
    await page.goto("/login/cliente");
    await expect(page.getByRole("heading", { name: "Acesse seu apartamento" })).toBeVisible();
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/personalizacoes");
  });

  test("login de cliente com marca da construtora também funciona", async ({ page }) => {
    await page.goto("/login/cliente/marca");
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/personalizacoes");
  });

  test("sair da construtora devolve pro login", async ({ page }) => {
    await page.goto("/login/construtora");
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/painel");
    await page.click('button:has-text("Sair")');
    await page.waitForURL("**/login/construtora");
  });

  test("página de descadastro confirma a preferência", async ({ page }) => {
    await page.goto("/descadastro");
    await expect(page.getByRole("heading", { name: "Preferência atualizada" })).toBeVisible();
  });
});
