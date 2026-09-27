import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

test.describe("Construtora — Pessoas", () => {
  test("cria uma pessoa com papel Cliente e edita depois", async ({ page }) => {
    await loginConstrutora(page, "/pessoas");
    await expect(page.getByRole("heading", { name: "Pessoas" })).toBeVisible();

    await page.click('button:has-text("Nova pessoa")');
    await expect(page.getByRole("heading", { name: "Nova pessoa" })).toBeVisible();

    await page.click('label:has-text("Cliente")');
    await page.fill("#pessoa-nome", "Pessoa E2E");
    await page.fill("#pessoa-email", "pessoa.e2e@example.com");
    await page.click('button:has-text("Salvar pessoa")');

    await page.waitForURL("**/pessoas");
    await expect(page.getByText("Pessoa E2E")).toBeVisible();

    await page.click('button[aria-label="Editar Pessoa E2E"]');
    await expect(page.getByRole("heading", { name: "Editar pessoa" })).toBeVisible();
    await page.fill("#pessoa-empresa", "Empresa E2E");
    await page.click('button:has-text("Salvar pessoa")');
    await page.waitForURL("**/pessoas");
  });

  test("valida nome obrigatório e ao menos um papel", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/novo");
    await page.click('button:has-text("Salvar pessoa")');
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Selecione pelo menos um papel")).toBeVisible();
  });

  test("filtra pessoas por papel e busca por nome", async ({ page }) => {
    await loginConstrutora(page, "/pessoas");
    await page.fill('input[placeholder*="Buscar nome ou empresa"]', "zzznaoexiste");
    await expect(page.getByText("Nenhum resultado pra esse filtro.")).toBeVisible();
  });

  test("cria e cancela a exclusão de uma pessoa pelo diálogo de confirmação", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/novo");
    await page.click('label:has-text("Cliente")');
    await page.fill("#pessoa-nome", "Pessoa Cancelamento");
    await page.click('button:has-text("Salvar pessoa")');
    await page.waitForURL("**/pessoas");

    await page.click('button[aria-label="Excluir Pessoa Cancelamento"]');
    await expect(page.getByText('Excluir "Pessoa Cancelamento"?')).toBeVisible();
    await page.click('button:has-text("Cancelar")');
    await expect(page.getByText("Pessoa Cancelamento")).toBeVisible();
  });
});
