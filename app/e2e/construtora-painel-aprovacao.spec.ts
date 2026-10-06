import { test, expect } from "./fixtures";
import { loginConstrutora } from "./helpers";

test.describe("Construtora — Painel e Aprovação", () => {
  test("painel filtra solicitações por status", async ({ page }) => {
    await loginConstrutora(page);
    await expect(page.getByRole("heading", { name: "Fila de solicitações" })).toBeVisible();

    await page.click('button:has-text("Pendente")');
    await expect(page.locator(".mono", { hasText: /^\d+$/ }).first()).toBeVisible();

    await page.click('button:has-text("Todos")');
  });

  test("aprova uma solicitação e chega ao termo pelo link da própria aprovação", async ({ page }) => {
    await loginConstrutora(page);
    await page.click('a:has-text("SOL-001")');
    await page.waitForURL("**/aprovacao/SOL-001");
    await expect(page.getByRole("heading", { name: "Aprovação técnica" })).toBeVisible();

    await page.click('button:has-text("Aprovar com assinatura digital")');
    await expect(page.getByText("Aprovado ✓")).toBeVisible();

    await page.click('a:has-text("Ver termo de alteração")');
    await page.waitForURL("**/termo/v-aurora-1204");
    await expect(page.getByText("TERMO DE ALTERAÇÃO", { exact: true })).toBeVisible();
    await expect(page.getByText("Standard 60×60")).toBeVisible();
  });

  test("recusa uma solicitação", async ({ page }) => {
    await loginConstrutora(page);
    await page.click('a:has-text("SOL-002")');
    await page.waitForURL("**/aprovacao/SOL-002");
    await page.click('button:has-text("Recusar com justificativa")');
    await expect(page.getByText("Recusado", { exact: true })).toBeVisible();
  });

  test("dashboard renderiza métricas agregadas", async ({ page }) => {
    await loginConstrutora(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard de personalização" })).toBeVisible();
    await expect(page.getByText("Receita de upgrades por mês")).toBeVisible();
    await expect(page.getByText("Upgrades mais escolhidos")).toBeVisible();
  });
});
