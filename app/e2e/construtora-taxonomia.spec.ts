import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

test.describe("Construtora — Categorias, Marcas e Fornecedores", () => {
  test("cria e edita uma categoria", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/categorias");
    await expect(page.getByRole("heading", { name: "Categorias de material" })).toBeVisible();

    await page.click('button:has-text("Nova categoria")');
    await page.fill("#nome-cadastro", "Categoria E2E");
    await page.click('button:has-text("Salvar")');
    await expect(page.getByText("Categoria criada.")).toBeVisible();

    await page.fill('input[placeholder="Buscar categoria..."]', "Categoria E2E");
    await expect(page.getByText("Categoria E2E")).toBeVisible();

    await page.click('button[aria-label="Editar Categoria E2E"]');
    await page.fill("#nome-cadastro", "Categoria E2E Editada");
    await page.click('button:has-text("Salvar")');
    await expect(page.getByText("Categoria atualizada.")).toBeVisible();

    await page.click('button[aria-label="Excluir Categoria E2E Editada"]');
    await page.click('button:has-text("Excluir")');
    await expect(page.getByText("Categoria excluída.")).toBeVisible();
  });

  test("cria, edita e exclui uma marca", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/marcas");
    await expect(page.getByRole("heading", { name: "Marcas" })).toBeVisible();
    await page.click('button:has-text("Nova marca")');
    await page.fill("#nome-cadastro", "Marca E2E");
    await page.click('button:has-text("Salvar")');
    await expect(page.getByText("Marca criada.")).toBeVisible();

    await page.fill('input[placeholder="Buscar marca..."]', "Marca E2E");
    await page.click('button[aria-label="Editar Marca E2E"]');
    await page.fill("#nome-cadastro", "Marca E2E Editada");
    await page.click('button:has-text("Salvar")');
    await expect(page.getByText("Marca atualizada.")).toBeVisible();

    await page.click('button[aria-label="Excluir Marca E2E Editada"]');
    await page.click('button:has-text("Excluir")');
    await expect(page.getByText("Marca excluída.")).toBeVisible();
  });

  test("cria um fornecedor completo e depois edita", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/fornecedores");
    await expect(page.getByRole("heading", { name: "Fornecedores" })).toBeVisible();
    await page.click('button:has-text("Novo fornecedor")');
    await expect(page.getByRole("heading", { name: "Novo fornecedor" })).toBeVisible();

    await page.fill("#forn-razaoSocial", "Fornecedor E2E Ltda");
    await page.fill("#forn-email", "contato@fornecedore2e.com.br");
    await page.fill("#forn-uf", "SP");
    await page.click('button:has-text("Salvar fornecedor")');

    await page.waitForURL("**/catalogo/fornecedores");
    await expect(page.getByText("Fornecedor E2E Ltda")).toBeVisible();

    await page.click('button[aria-label="Editar Fornecedor E2E Ltda"]');
    await expect(page.getByRole("heading", { name: "Editar fornecedor" })).toBeVisible();
    await page.fill("#forn-nomeFantasia", "Fornecedor E2E");
    await page.click('button:has-text("Salvar fornecedor")');
    await page.waitForURL("**/catalogo/fornecedores");
    await expect(page.getByText("Fornecedor E2E", { exact: true })).toBeVisible();
  });

  test("lista fornecedores e busca por nome", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/fornecedores");
    await page.fill('input[placeholder*="Buscar razão social"]', "Portobello");
    await expect(page.getByText("Portobello Distribuidora SP", { exact: false }).first()).toBeVisible();
  });

  test("pagina a lista de categorias quando passa de 10 itens", async ({ page }) => {
    await loginConstrutora(page, "/catalogo/categorias");
    for (const nome of ["Extra 1", "Extra 2"]) {
      await page.click('button:has-text("Nova categoria")');
      await page.fill("#nome-cadastro", nome);
      await page.click('button:has-text("Salvar")');
      await expect(page.getByText("Categoria criada.").last()).toBeVisible();
    }

    await expect(page.getByText("1/2")).toBeVisible();
    await page.click('button[aria-label="Próxima página"]');
    await expect(page.getByText("2/2")).toBeVisible();
    await page.click('button[aria-label="Página anterior"]');
    await expect(page.getByText("1/2")).toBeVisible();
  });
});
