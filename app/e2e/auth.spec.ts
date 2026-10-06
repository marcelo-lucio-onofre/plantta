import { test, expect } from "./fixtures";
import { preencherCredenciais } from "./helpers";

test.describe("Autenticação", () => {
  test("login de construtora leva ao painel", async ({ page }) => {
    await page.goto("/login/construtora");
    await expect(page.getByRole("heading", { name: "Painel da construtora" })).toBeVisible();
    await preencherCredenciais(page, "usuario@exemplo.com.br");
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/painel");
    await expect(page.getByRole("heading", { name: "Fila de solicitações" })).toBeVisible();
  });

  test("login genérico de cliente lista as personalizações", async ({ page }) => {
    await page.goto("/login/cliente");
    await expect(page.getByRole("heading", { name: "Acesse seu apartamento" })).toBeVisible();
    await preencherCredenciais(page, "usuario@exemplo.com.br");
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/personalizacoes");
  });

  test("login de cliente com marca da construtora também funciona", async ({ page }) => {
    await page.goto("/login/marca/engemax");
    await preencherCredenciais(page, "usuario@exemplo.com.br");
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/personalizacoes");
  });

  test("sair da construtora devolve pro login", async ({ page }) => {
    await page.goto("/login/construtora");
    await preencherCredenciais(page, "usuario@exemplo.com.br");
    await page.click('button:has-text("Entrar")');
    await page.waitForURL("**/painel");
    await page.click('button:has-text("Sair")');
    await page.waitForURL("**/login/construtora");
  });

  test("login de cliente sem preencher mostra os erros de validação e não entra", async ({ page }) => {
    await page.goto("/login/cliente");
    await page.click('button:has-text("Entrar")');
    await expect(page.getByText("Informe a unidade ou e-mail")).toBeVisible();
    await expect(page.getByText("Informe o CPF ou senha")).toBeVisible();
    await expect(page).toHaveURL(/\/login\/cliente$/);
  });

  test("página de descadastro confirma a preferência", async ({ page }) => {
    await page.goto("/descadastro");
    await expect(page.getByRole("heading", { name: "Preferência atualizada" })).toBeVisible();
  });
});
