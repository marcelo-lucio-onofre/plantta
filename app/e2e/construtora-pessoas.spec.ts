import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

// "Pessoas" virou dois cadastros separados: Funcionários (arquiteto,
// engenheiro, técnico… com papéis e registro profissional) e Clientes
// (compradores — recebem senha de acesso por e-mail ao serem cadastrados).
test.describe("Construtora — Pessoas", () => {
  test("/pessoas leva pra lista de funcionários", async ({ page }) => {
    await loginConstrutora(page, "/pessoas");
    await page.waitForURL("**/pessoas/funcionarios");
    await expect(page.getByRole("heading", { name: "Funcionários" })).toBeVisible();
  });

  test("cria um funcionário com papel e edita depois", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/funcionarios");
    await page.click('button:has-text("Novo funcionário")');
    await expect(page.getByRole("heading", { name: "Novo funcionário" })).toBeVisible();

    await page.click('label:has-text("Arquiteto")');
    await page.fill("#func-nome", "Funcionário E2E");
    await page.fill("#func-email", "funcionario.e2e@example.com");
    await page.click('button:has-text("Salvar funcionário")');

    await page.waitForURL("**/pessoas/funcionarios");
    // A lista é paginada e ordenada — busca pra garantir que o novo apareça.
    await page.fill('input[placeholder*="Buscar nome ou empresa"]', "Funcionário E2E");
    await expect(page.locator("tbody").getByText("Funcionário E2E")).toBeVisible();

    await page.click('button[aria-label="Editar Funcionário E2E"]');
    await expect(page.getByRole("heading", { name: "Editar funcionário" })).toBeVisible();
    await page.fill("#func-empresa", "Empresa E2E");
    await page.click('button:has-text("Salvar funcionário")');
    await page.waitForURL("**/pessoas/funcionarios");
  });

  test("funcionário exige nome e ao menos um papel", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/funcionarios/novo");
    await page.click('button:has-text("Salvar funcionário")');
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Selecione pelo menos um papel")).toBeVisible();
  });

  test("cria e cancela a exclusão de um funcionário pelo diálogo de confirmação", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/funcionarios/novo");
    await page.click('label:has-text("Arquiteto")');
    await page.fill("#func-nome", "Funcionário Cancelamento");
    await page.click('button:has-text("Salvar funcionário")');
    await page.waitForURL("**/pessoas/funcionarios");
    await page.fill('input[placeholder*="Buscar nome ou empresa"]', "Funcionário Cancelamento");

    await page.click('button[aria-label="Excluir Funcionário Cancelamento"]');
    await expect(page.getByText('Excluir "Funcionário Cancelamento"?')).toBeVisible();
    await page.click('button:has-text("Cancelar")');
    await expect(page.locator("tbody").getByText("Funcionário Cancelamento")).toBeVisible();
  });

  test("filtra funcionários por busca", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/funcionarios");
    await page.fill('input[placeholder*="Buscar nome ou empresa"]', "zzznaoexiste");
    await expect(page.getByText("Nenhum resultado pra esse filtro.")).toBeVisible();
  });

  test("cadastra um cliente e ele aparece na lista", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/clientes");
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await page.click('button:has-text("Novo cliente")');
    await expect(page.getByRole("heading", { name: "Novo cliente" })).toBeVisible();

    await page.fill("#cliente-nome", "Cliente E2E");
    await page.fill("#cliente-email", "cliente.e2e@example.com");
    await page.click('button:has-text("Cadastrar e enviar senha")');

    await page.waitForURL("**/pessoas/clientes");
    await page.fill('input[placeholder*="Buscar nome ou e-mail"]', "Cliente E2E");
    await expect(page.locator("tbody").getByText("Cliente E2E")).toBeVisible();
  });

  test("cliente exige nome e e-mail válido", async ({ page }) => {
    await loginConstrutora(page, "/pessoas/clientes/novo");
    await page.click('button:has-text("Cadastrar e enviar senha")');
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText(/E-mail é obrigatório/)).toBeVisible();
  });
});
