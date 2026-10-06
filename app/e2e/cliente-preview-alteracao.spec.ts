import { test, expect } from "./fixtures";
import { gotoComoCliente, VINCULOS } from "./helpers";

test.describe("Cliente — Como fica no seu ambiente", () => {
  test("wizard: ao escolher uma opção mostra de → para, o cômodo em 3D antes/depois e o material em AR", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("plantta:session", JSON.stringify({ role: "cliente", activeVinculoId: "v-aurora-1204", loginScopeConstrutoraId: "00001", construtoraLogadaId: null })));
    await page.goto("/personalizacoes/nova?vinculoId=v-aurora-1204");
    await page.getByText("Sala de Estar").first().click();
    await page.getByText("Piso", { exact: true }).first().click();
    await page.click('button:has-text("Porcelanato Portobello Premium 80×80")');

    await expect(page.getByText("Como fica no seu ambiente")).toBeVisible();
    await page.getByRole("button", { name: /Sala de Estar em 3D/ }).click();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Piso: Polido 80×80 Branco/)).toBeVisible();

    await page.getByRole("button", { name: "Como está" }).click();
    await expect(page.getByText(/Piso: Acetinado 60×60 Bege/)).toBeVisible();

    await page.getByRole("button", { name: "Material em AR" }).click();
    await expect(page.locator("model-viewer")).toBeVisible({ timeout: 20_000 });
  });

  test("detalhe da solicitação já mostra o ambiente em 3D sem precisar editar", async ({ page }) => {
    await gotoComoCliente(page, VINCULOS.aurora, "/personalizacoes/SOL-001");
    await expect(page.getByText("Como fica no seu ambiente")).toBeVisible();
    await page.getByRole("button", { name: /Sala de Estar em 3D/ }).click();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Piso: Polido 80×80 Branco/)).toBeVisible();
  });
});
