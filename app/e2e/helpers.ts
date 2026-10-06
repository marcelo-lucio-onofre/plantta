import type { Page } from "@playwright/test";

/** vinculos seeded in src/data/mockData.ts — one per construtora with a
 * material catalog (00004/Jardins has none, deliberately, an empty-catalog
 * edge case, so it's not listed here). */
export const VINCULOS = {
  aurora: { id: "v-aurora-1204", construtoraId: "00001" },
  vistaverde: { id: "v-vistaverde-2201", construtoraId: "00002" },
  boulevard: { id: "v-boulevard-501", construtoraId: "00003" },
} as const;

/** Construtora login is a single select + "Entrar", no real credentials in
 * this prototype. Picks the first construtora in the list unless a label
 * substring is given. */
export async function loginConstrutora(page: Page, path = "/painel") {
  await page.goto("/login/construtora");
  await page.click('button:has-text("Entrar")');
  await page.waitForURL("**/painel");
  if (path !== "/painel") await page.goto(path);
}

/** Generic client login — lands on "Minhas personalizações" listing every
 * vinculo across every construtora (this prototype has no per-user auth
 * split, see SimpleLoginClientePage). */
export async function loginClienteGenerico(page: Page) {
  await page.goto("/login/cliente");
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
