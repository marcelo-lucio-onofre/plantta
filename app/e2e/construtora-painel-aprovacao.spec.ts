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

  test("aprova tecnicamente uma solicitação e fica aguardando o pagamento do cliente", async ({ page }) => {
    await loginConstrutora(page);
    // O card abre um modal; a aprovação fica em "Ver solicitação completa".
    await page.click('button:has-text("SOL-001")');
    await page.click('a:has-text("Ver solicitação completa")');
    await page.waitForURL("**/aprovacao/SOL-001");
    await expect(page.getByRole("heading", { name: "Aprovação técnica" })).toBeVisible();

    await page.click('button:has-text("Aprovar com assinatura digital")');
    // Aprovação técnica não encerra: a solicitação fica aguardando o
    // pagamento do cliente (confirmado depois pela construtora no Painel).
    await expect(page.getByText("Aguardando pagamento do cliente")).toBeVisible();
  });

  test("recusa uma solicitação", async ({ page }) => {
    await loginConstrutora(page);
    // O card abre um modal; a aprovação fica em "Ver solicitação completa".
    await page.click('button:has-text("SOL-002")');
    await page.click('a:has-text("Ver solicitação completa")');
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
