import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

test.describe("Construtora — Cadastro de empreendimento (wizard)", () => {
  test("lista empreendimentos e inicia um novo cadastro", async ({ page }) => {
    await loginConstrutora(page, "/cadastro");
    await expect(page.getByRole("heading", { name: "Empreendimentos" })).toBeVisible();
    await page.click('button:has-text("Novo empreendimento")');
    await page.waitForURL("**/cadastro/novo");
    await expect(page.getByText("Identificação")).toBeVisible();
  });

  test("preenche identificação, avança e adiciona uma torre", async ({ page }) => {
    await loginConstrutora(page, "/cadastro/novo");

    await page.fill('input[placeholder="Residencial Aurora"]', "Residencial E2E");
    await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
    await page.click('button:has-text("Continuar")');

    await page.getByRole("button", { name: "Torre", exact: true }).click();
    await page.fill('input[placeholder="Torre A"]', "Torre Única");
    await expect(page.getByText(/1 unidades/).first()).toBeVisible();

    await page.click('button:has-text("Continuar")');
    await expect(page.getByText("Plantas do empreendimento")).toBeVisible();
  });

  test("cria um empreendimento e depois continua o cadastro pela listagem", async ({ page }) => {
    await loginConstrutora(page, "/cadastro/novo");
    await page.fill('input[placeholder="Residencial Aurora"]', "Residencial E2E Listagem");
    await page.click('button:has-text("Continuar")');
    await page.getByRole("button", { name: "Torre", exact: true }).click();
    await page.click('button:has-text("Continuar")');
    await expect(page.getByText("Plantas do empreendimento")).toBeVisible();

    await page.locator('a:has-text("Empreendimentos")').first().click();
    await page.waitForURL("**/cadastro");
    const linha = page.locator("tbody tr", { hasText: "Residencial E2E Listagem" });
    await expect(linha).toBeVisible();
    await linha.locator("button.table-icon-btn").click();
    await page.waitForURL(/\/cadastro\//);
    await expect(page.getByText("Torres")).toBeVisible();
  });

  test("percorre o wizard completo até confirmar o cadastro", async ({ page }) => {
    await loginConstrutora(page, "/cadastro/novo");

    await page.fill('input[placeholder="Residencial Aurora"]', "Residencial E2E Completo");
    await page.click('button:has-text("Continuar")');

    await page.getByRole("button", { name: "Torre", exact: true }).click();
    await page.click('button:has-text("Continuar")');

    await expect(page.getByText("Plantas do empreendimento")).toBeVisible();
    await page.click('button:has-text("Nova planta")');
    await expect(page.getByText("Nova planta").first()).toBeVisible();
    await page.click('button:has-text("Continuar")');

    await expect(page.getByText(/associ/i).first()).toBeVisible();
    await page.click('button:has-text("Continuar")');

    await page.click('button:has-text("Continuar")');

    await page.click('button:has-text("Continuar")');
    await expect(page.getByText("Resumo")).toBeVisible();
    await expect(page.getByText("Residencial E2E Completo")).toBeVisible();

    await page.click('button:has-text("Confirmar cadastro")');
    await expect(page.getByRole("heading", { name: "Empreendimento cadastrado" })).toBeVisible();

    await page.click('button:has-text("Ir para o painel")');
    await page.waitForURL("**/painel");
  });

  test("edita o catálogo de ambientes e itens da planta", async ({ page }) => {
    await loginConstrutora(page, "/cadastro/novo");

    await page.fill('input[placeholder="Residencial Aurora"]', "Residencial E2E Catálogo");
    await page.click('button:has-text("Continuar")');
    await page.getByRole("button", { name: "Torre", exact: true }).click();
    await page.click('button:has-text("Continuar")');

    await page.click('button:has-text("Nova planta")');
    await page.click('button:has-text("Continuar")');
    await page.click('button:has-text("Continuar")');

    await expect(page.getByText("Ambientes e itens")).toBeVisible();
    await page.click('button:has-text("Novo ambiente")');
    await expect(page.getByText("Nenhum ambiente cadastrado nesta planta ainda.")).toHaveCount(0);

    await page.locator('button:has-text("Item")').first().click();
    await page.locator('button:has-text("Verba compartilhada neste ambiente")').first().click();
    await expect(page.getByText(/item\(ns\) vinculado\(s\)/)).toBeVisible();

    await page.click('button:has-text("Salvar catálogo")');
    await expect(page.getByText("Alterações não salvas")).toHaveCount(0);
  });
});
