import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

test.describe("Construtora — Contatos da construtora", () => {
  test("edita e salva os dados institucionais", async ({ page }) => {
    await loginConstrutora(page, "/contatos");
    await expect(page.getByRole("heading", { name: "Contatos da construtora" })).toBeVisible();

    await page.fill("#contato-nomeFantasia", "Construtora E2E");
    await page.fill("#contato-email", "contato@construtorae2e.com.br");
    await page.click('button:has-text("Salvar dados")');
    await expect(page.getByText("Dados da construtora atualizados.")).toBeVisible();
  });

  test("valida e-mail inválido", async ({ page }) => {
    await loginConstrutora(page, "/contatos");
    await page.fill("#contato-email", "email-invalido");
    await page.locator("#contato-email").blur();
    await page.click('button:has-text("Salvar dados")');
    await expect(page.locator("#contato-email")).toHaveClass(/input--invalid/);
  });

  test("valida CNPJ e UF inválidos", async ({ page }) => {
    await loginConstrutora(page, "/contatos");
    await page.fill("#contato-cnpj", "123");
    await page.locator("#contato-cnpj").blur();
    await page.fill("#contato-uf", "X");
    await page.locator("#contato-uf").blur();
    await page.click('button:has-text("Salvar dados")');
    await expect(page.locator("#contato-cnpj")).toHaveClass(/input--invalid/);
    await expect(page.locator("#contato-uf")).toHaveClass(/input--invalid/);
  });
});
