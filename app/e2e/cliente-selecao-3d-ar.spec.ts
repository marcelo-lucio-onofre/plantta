import { test, expect } from "./fixtures";
import { gotoComoCliente, VINCULOS } from "./helpers";

test.describe("Cliente — Seleção com preview 3D e AR", () => {
  test("opção com material fotografado mostra preview 3D e AR", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/selecao/piso_sala");
    await expect(page.getByRole("heading", { name: /Piso — Sala de Estar/ })).toBeVisible();

    const opcaoComFoto = page.locator(".card", { hasText: "Porcelanato Portobello Premium 80×80" });
    await opcaoComFoto.getByRole("button", { name: "Ver em 3D" }).click();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });

    await opcaoComFoto.getByRole("button", { name: "Ver em AR" }).click();
    await expect(page.locator("model-viewer")).toBeVisible({ timeout: 15_000 });
  });

  test("ambiente já mostra o material padrão em 3D e atualiza ao vivo ao trocar, sem fechar o painel", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/selecao/piso_banheiro");

    // O painel já aparece com o padrão do empreendimento, antes de qualquer
    // troca — o cliente vê "como já está" antes de decidir mudar algo.
    await page.click('button:has-text("Ver Banheiro Suíte completo em 3D")');
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Piso: Externo Antiderrapante 45×45/)).toBeVisible();

    // Troca o material com o painel 3D ainda aberto — a cena atualiza ao
    // vivo, sem precisar fechar/reabrir o preview.
    await page.click('button:has-text("Porcelanato Antiderrapante Areia")');
    await expect(page.getByText(/Piso: Rústico 60×60 Areia/)).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("configurador do ambiente reage ao trocar o revestimento, não só o piso", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/selecao/revestimento");
    await page.click('button:has-text("Ver Banheiro Suíte completo em 3D")');
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Revestimento:/)).toHaveCount(0);

    await page.click('button:has-text("Porcelanato Off-White Grande Formato")');
    await expect(page.getByText(/Revestimento: Acetinado Branco 30×60/)).toBeVisible();
  });

  test("ambiente com bancada (cozinha) usa a geometria real da planta", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/selecao/bancada");
    await page.click('button:has-text("Dekton Sirius")');
    await page.click('button:has-text("Ver Cozinha completo em 3D")');
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Ambiente gerado a partir da planta real/)).toBeVisible();
    await expect(page.getByText(/Bancada: Sirius/)).toBeVisible();
  });

  test("escolher uma opção atualiza o ledger de crédito", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/selecao/piso_sala");
    await page.click('button:has-text("Porcelanato Portobello Premium 80×80")');
    await expect(page.getByText("Impacto no ledger de crédito")).toBeVisible();
    await expect(page.getByText("−R$ 8.500,00").or(page.getByText("−R$ 8.500"))).toBeVisible();
  });
});
