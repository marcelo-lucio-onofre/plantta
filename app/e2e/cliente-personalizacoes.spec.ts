import { test, expect } from "./fixtures";
import { loginClienteGenerico } from "./helpers";

test.describe("Cliente — Minhas personalizações", () => {
  test("lista as unidades do cliente e abre o termo de uma unidade", async ({ page }) => {
    await loginClienteGenerico(page);
    await expect(page.getByRole("heading", { name: "Minhas personalizações" })).toBeVisible();

    const unidadeAurora = page.locator(".mp-unidade", { hasText: "Apto 1204" });
    await expect(unidadeAurora).toBeVisible();
    await unidadeAurora.getByRole("button", { name: "Ver termo da unidade" }).click();
    await expect(page.getByRole("link", { name: "Abrir documento completo" })).toBeVisible();

    await page.click('a:has-text("Abrir documento completo")');
    await page.waitForURL("**/termo/v-aurora-1204");
    await expect(page.getByText("TERMO DE ALTERAÇÃO", { exact: true })).toBeVisible();
  });

  test("abre o detalhe de uma solicitação e edita a escolha", async ({ page }) => {
    await loginClienteGenerico(page);

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
