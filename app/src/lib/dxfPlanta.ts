import DxfParser from "dxf-parser";
import type { PlantaAmbienteGeometria } from "../domain/types";

/** Camadas exigidas pelo padrão — ver docs/padrao-plantas-dxf.md. */
export const CAMADA_AMBIENTE = "ARQ-AMB";
export const CAMADA_AMBIENTE_TEXTO = "ARQ-AMB-TXT";

/**
 * Nomes de ambiente reconhecidos no texto de `ARQ-AMB-TXT`, já normalizados
 * (maiúsculas, sem acento) → ambiente.id do catálogo. Lista viva: cresce
 * junto com os ambiente.id cadastrados por construtora (ver o mesmo mapa em
 * docs/padrao-plantas-dxf.md).
 */
const NOMES_AMBIENTE: Record<string, string> = {
  SALA: "sala",
  "SALA DE ESTAR": "sala",
  COZINHA: "cozinha",
  BANHEIRO: "banheiro",
  "BANHEIRO SUITE": "banheiro",
  "BANHEIRO SOCIAL": "banheiro",
  QUARTO: "quarto",
  DORMITORIO: "quarto",
  SUITE: "quarto",
  VARANDA: "varanda",
};

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

interface VerticeDxf {
  x: number;
  y: number;
}

interface EntidadeDxf {
  type: string;
  layer?: string;
  vertices?: VerticeDxf[];
  shape?: boolean;
  startPoint?: VerticeDxf;
  position?: VerticeDxf;
  text?: string;
}

function centroide(pontos: VerticeDxf[]): VerticeDxf {
  const n = pontos.length;
  const soma = pontos.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: soma.x / n, y: soma.y / n };
}

function distancia(a: VerticeDxf, b: VerticeDxf): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Lê um DXF no padrão docs/padrao-plantas-dxf.md e devolve o contorno de
 * cada ambiente reconhecido, já em metros. Ambientes cujo texto em
 * `ARQ-AMB-TXT` não bate com nenhum nome da tabela acima são descartados
 * (ficam sem 3D real — ver "O que acontece se a planta não seguir o
 * padrão" no doc) em vez de gerar um id inventado.
 */
export function parseDxfAmbientes(dxfTexto: string, unidadeOrigem: "m" | "cm" = "m"): PlantaAmbienteGeometria[] {
  const parser = new DxfParser();
  const parsed = parser.parseSync(dxfTexto);
  const entidades = (parsed?.entities ?? []) as EntidadeDxf[];
  const fatorMetros = unidadeOrigem === "cm" ? 0.01 : 1;

  const poligonos = entidades.filter(
    (e): e is EntidadeDxf & { vertices: VerticeDxf[] } =>
      e.layer === CAMADA_AMBIENTE &&
      (e.type === "LWPOLYLINE" || e.type === "POLYLINE") &&
      Array.isArray(e.vertices) &&
      e.vertices.length >= 3 &&
      Boolean(e.shape),
  );

  const textos = entidades
    .filter((e) => e.layer === CAMADA_AMBIENTE_TEXTO && (e.type === "TEXT" || e.type === "MTEXT") && e.text)
    .map((e) => ({ texto: e.text as string, ponto: (e.startPoint ?? e.position) as VerticeDxf | undefined }))
    .filter((t): t is { texto: string; ponto: VerticeDxf } => Boolean(t.ponto));

  const resultado: PlantaAmbienteGeometria[] = [];

  for (const poligono of poligonos) {
    const centro = centroide(poligono.vertices);
    let maisProximo: (typeof textos)[number] | undefined;
    let menorDistancia = Infinity;
    for (const t of textos) {
      const d = distancia(centro, t.ponto);
      if (d < menorDistancia) {
        menorDistancia = d;
        maisProximo = t;
      }
    }
    if (!maisProximo) continue;

    const ambienteId = NOMES_AMBIENTE[normalizarTexto(maisProximo.texto)];
    if (!ambienteId) continue;

    resultado.push({
      ambienteId,
      pontosM: poligono.vertices.map((v) => [v.x * fatorMetros, v.y * fatorMetros] as [number, number]),
    });
  }

  return resultado;
}
