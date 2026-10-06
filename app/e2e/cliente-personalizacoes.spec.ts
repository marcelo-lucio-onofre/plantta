import { test, expect } from "./fixtures";
import { expandirConstrutora, loginClienteGenerico, loginConstrutora } from "./helpers";

test.describe("Cliente — Minhas personalizações", () => {
  test("lista as unidades do cliente e abre o termo de uma unidade", async ({ page }) => {
    await loginClienteGenerico(page);
    await expect(page.getByRole("heading", { name: "Minhas personalizações" })).toBeVisible();
    await expandirConstrutora(page, "Engemax");

    const unidadeAurora = page.locator(".mp-unidade", { hasText: "Apto 1204" });
    await expect(unidadeAurora).toBeVisible();
    await unidadeAurora.getByRole("button", { name: "Ver termo da unidade" }).click();
    await expect(page.getByRole("link", { name: "Abrir documento completo" })).toBeVisible();

    // Regra: o cliente só enxerga o termo depois do processo encerrado — a
    // unidade (Apto 1204) está em análise, então o link volta pra listagem.
    await page.click('a:has-text("Abrir documento completo")');
    await page.waitForURL("**/personalizacoes");
    await expect(page.getByText("TERMO DE ALTERAÇÃO", { exact: true })).toHaveCount(0);
  });

  test("construtora abre o termo da unidade mesmo com solicitação em análise", async ({ page }) => {
    await loginConstrutora(page, "/termo/v-aurora-1204");
    await expect(page.getByText("TERMO DE ALTERAÇÃO", { exact: true })).toBeVisible();
  });

  test("abre o detalhe de uma solicitação e edita a escolha", async ({ page }) => {
    await loginClienteGenerico(page);
    await expandirConstrutora(page, "Engemax");

    const unidadeAurora = page.locator(".mp-unidade", { hasText: "Apto 1204" });
    await unidadeAurora.getByRole("button", { name: "Expandir ambientes" }).click();

    const ambienteSala = unidadeAurora.locator(".mp-ambiente", { hasText: "Sala de Estar" });
    await ambienteSala.getByRole("button", { name: /Expandir Sala de Estar/ }).click();
    await ambienteSala.locator(".mp-item-link").first().click();

    await page.waitForURL(/\/personalizacoes\/SOL-\d+/);
    await expect(page.getByRole("button", { name: "Editar escolha" }).or(page.getByRole("link", { name: "Editar escolha" }))).toBeVisible();

    await page.click("text=Editar escolha");
    await page.waitForURL(/\/(selecao|calculadora)/);
  });
});
