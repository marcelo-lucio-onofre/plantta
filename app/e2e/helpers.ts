import type { Page } from "@playwright/test";

/** vinculos seeded in src/data/mockData.ts — one per construtora with a
 * material catalog (00004/Jardins has none, deliberately, an empty-catalog
 * edge case, so it's not listed here). */
export const VINCULOS = {
  aurora: { id: "v-aurora-1204", construtoraId: "00001" },
  vistaverde: { id: "v-vistaverde-2201", construtoraId: "00002" },
  boulevard: { id: "v-boulevard-501", construtoraId: "00003" },
} as const;

/** As telas de login validam e-mail e senha (qualquer valor bem formado
 * entra — ambiente de demonstração), então os testes precisam preencher. */
export async function preencherCredenciais(page: Page, email: string, senha = "senha123") {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(senha);
}

/** Construtora login is a single select + "Entrar", no real credentials in
 * this prototype. Picks the first construtora in the list unless a label
 * substring is given. */
export async function loginConstrutora(page: Page, path = "/painel") {
  await page.goto("/login/construtora");
  await preencherCredenciais(page, "gestor@engemax.com.br");
  await page.click('button:has-text("Entrar")');
  await page.waitForURL("**/painel");
  if (path !== "/painel") await page.goto(path);
}

/** Generic client login — lands on "Minhas personalizações" listing every
 * vinculo across every construtora (this prototype has no per-user auth
 * split, see SimpleLoginClientePage). */
export async function loginClienteGenerico(page: Page) {
  await page.goto("/login/cliente");
  await preencherCredenciais(page, "apto1204@aurora.com.br");
  await page.click('button:has-text("Entrar")');
  await page.waitForURL("**/personalizacoes");
}

/**
 * Seeds sessionStorage with role=cliente and a specific activeVinculoId
 * *before* the app's first script runs, then does the one-and-only
 * `page.goto` for the test — pages reached from here on are all
 * client-side navigation, so `window.__coverage__` keeps accumulating
 * instead of resetting on a second full load.
 */
export async function gotoComoCliente(page: Page, vinculo: (typeof VINCULOS)[keyof typeof VINCULOS], path: string) {
  await page.addInitScript(
    ({ id, construtoraId }) => {
      sessionStorage.setItem(
        "plantta:session",
        JSON.stringify({ role: "cliente", activeVinculoId: id, loginScopeConstrutoraId: construtoraId, construtoraLogadaId: null }),
      );
    },
    vinculo,
  );
  await page.goto(path);
}

/** "Minhas personalizações" agrupa por construtora, todas colapsadas ao
 * abrir — expande a escolhida pra expor as unidades dela. */
export async function expandirConstrutora(page: Page, nome: string) {
  await page.getByRole("button", { name: new RegExp(nome) }).first().click();
}
