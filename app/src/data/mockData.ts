// Seed data for the prototype. Ported 1:1 from the original dc-runtime
// mockup (plantta-data.js) so behavior and numbers stay identical.
import type {
  AllowanceGroup,
  Ambiente,
  Brand,
  Categoria,
  DashboardData,
  Empreendimento,
  Fornecedor,
  Marca,
  MaterialCatalogItem,
  Pessoa,
  Planta,
  PlantaGeometria3D,
  Solicitacao,
  TipoAmbiente,
  TipoPapel,
  Vinculo,
} from "../domain/types";
import { plantaKey } from "../domain/calculations";
import { AMBIENTES_SUGERIDOS, CATEGORIAS_MATERIAL, MARCAS_SUGERIDAS } from "../domain/catalogoReferencia";
import { parseDxfAmbientes } from "../lib/dxfPlanta";
import dxfSala from "../assets/plantas-dxf/sala.dxf?raw";
import dxfCozinha from "../assets/plantas-dxf/cozinha.dxf?raw";
import dxfBanheiro from "../assets/plantas-dxf/banheiro.dxf?raw";
import dxfVaranda from "../assets/plantas-dxf/varanda.dxf?raw";
import dxfVvSala from "../assets/plantas-dxf/vistaverde/sala.dxf?raw";
import dxfVvCozinha from "../assets/plantas-dxf/vistaverde/cozinha.dxf?raw";
import dxfVvBanheiro from "../assets/plantas-dxf/vistaverde/banheiro.dxf?raw";
import dxfVvVaranda from "../assets/plantas-dxf/vistaverde/varanda.dxf?raw";
import dxfBlvSala from "../assets/plantas-dxf/boulevard/sala.dxf?raw";
import dxfBlvCozinha from "../assets/plantas-dxf/boulevard/cozinha.dxf?raw";
import dxfBlvBanheiro from "../assets/plantas-dxf/boulevard/banheiro.dxf?raw";
import dxfBlvVaranda from "../assets/plantas-dxf/boulevard/varanda.dxf?raw";

// Geometria 3D real de cada construtora do seed, gerada a partir dos DXFs
// de exemplo em src/assets/plantas-dxf/ (padrão ARQ-AMB/ARQ-AMB-TXT — ver
// docs/padrao-plantas-dxf.md e lib/dxfPlanta.ts). Isso roda o parser de
// verdade no carregamento do app, não são coordenadas digitadas à mão —
// cada construtora tem sua própria planta (dimensões diferentes, cozinha
// da Boulevard em L com o entalhe do outro lado da de Aurora), prova que a
// esteira funciona com plantas reais distintas, não é uma cópia.
const geometriaPlantaAAurora: PlantaGeometria3D = {
  peDireitoM: 2.6,
  ambientes: [
    ...parseDxfAmbientes(dxfSala, "m"),
    ...parseDxfAmbientes(dxfCozinha, "m"),
    ...parseDxfAmbientes(dxfBanheiro, "m"),
    ...parseDxfAmbientes(dxfVaranda, "m"),
  ],
};

const geometriaPlantaVistaVerde: PlantaGeometria3D = {
  peDireitoM: 2.6,
  ambientes: [
    ...parseDxfAmbientes(dxfVvSala, "m"),
    ...parseDxfAmbientes(dxfVvCozinha, "m"),
    ...parseDxfAmbientes(dxfVvBanheiro, "m"),
    ...parseDxfAmbientes(dxfVvVaranda, "m"),
  ],
};

const geometriaPlantaBoulevard: PlantaGeometria3D = {
  peDireitoM: 2.7,
  ambientes: [
    ...parseDxfAmbientes(dxfBlvSala, "m"),
    ...parseDxfAmbientes(dxfBlvCozinha, "m"),
    ...parseDxfAmbientes(dxfBlvBanheiro, "m"),
    ...parseDxfAmbientes(dxfBlvVaranda, "m"),
  ],
};

// Plain-data deep clone (Ambiente/Item/Opcao are all JSON-safe: no
// functions/Dates) — used so each empreendimento gets its own independent
// catalog object instead of aliasing the same array, which would make
// editing one empreendimento's catalog silently edit every other's too.
function clonar<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// The construtora's own brand — used only in the "white-label" client flow
// (branded login → branded portal). Editable on the Marca screen.
export const initialBrand: Brand = {
  nome: "Alliance",
  slug: "alliance",
  color: "#fd3541",
  logo: "https://alliance.com.br/wp-content/uploads/2026/01/logo-alliance-ok.png",
  background: "https://alliance.com.br/wp-content/uploads/2025/11/Copia-de-Guarita-1.jpg",
  favicon: "/brand/alliance-favicon.jpg",
};

// Prado's own brand — this construtora ("00001") is now Engemax.
export const engemaxBrand: Brand = {
  nome: "Engemax",
  slug: "engemax",
  color: "#35492e",
  logo: "/brand/engemax-logo.png",
  background: "/brand/engemax-background.jpg",
  favicon: "/brand/engemax-logo.jpg",
};

// plantta's own brand — used everywhere the client portal is NOT
// white-labeled: the default client login/portal and the whole
// construtora back-office.
export const planttaBrand: Brand = {
  nome: "plantta",
  slug: "plantta",
  color: "#2f6bd8",
  logo: null,
  background: null,
  favicon: null,
};

// construtoraId → seed brand, opted into white-label. Single source used
// both by InMemoryBrandRepository and by the dev-server OG-preview
// middleware (vite.config.ts) — that middleware runs in Node, before any
// browser JS, so it can only ever see this seed data, never brand edits
// made live through MarcaPage (those stay in-memory, browser-only, same
// as every other piece of state in this prototype).
export const SEED_BRANDS: Record<string, Brand> = {
  "00001": engemaxBrand,
  "00003": initialBrand,
};

export const empreendimento: Empreendimento = {
  nome: "Canoa",
  construtora: "Engemax",
  unidade: "Apto 1204",
  torre: "Torre B",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 300,
  valorImovel: 850000,
  imagemUrl: "/empreendimentos/canoa.jpg",
};

// Second empreendimento for the same client, at a different construtora —
// demonstrates the multi-vínculo sidebar. Reuses the Aurora item catalog
// below (same finishes/options) since this is a prototype; a real backend
// would give each empreendimento its own catalog.
export const empreendimentoVistaVerde: Empreendimento = {
  nome: "Vista Verde Residence",
  construtora: "Horizonte Construções",
  unidade: "Apto 2201",
  torre: "Torre C",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 180,
  valorImovel: 720000,
};

// Unidade nova, sem nenhuma solicitação ainda ("nenhuma personalização") —
// pra "Minhas unidades" mostrar todo status possível na apresentação.
export const empreendimentoVistaVerdeNova: Empreendimento = {
  nome: "Vista Verde Residence",
  construtora: "Horizonte Construções",
  unidade: "Apto 1502",
  torre: "Torre B",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 180,
  valorImovel: 650000,
};

// Unidade que o cliente já declarou "não vou alterar" — cobre o status
// "Sem alteração" na demo.
export const empreendimentoAuroraSemAlteracao: Empreendimento = {
  nome: "Canoa",
  construtora: "Engemax",
  unidade: "Apto 305",
  torre: "Torre A",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 300,
  valorImovel: 780000,
  imagemUrl: "/empreendimentos/canoa.jpg",
};

// Segundo empreendimento da Engemax — cobre um cliente com dois
// empreendimentos na mesma construtora ("Minhas personalizações" empilha
// os dois embaixo do mesmo grupo Engemax).
export const empreendimentoJangada: Empreendimento = {
  nome: "Jangada",
  construtora: "Engemax",
  unidade: "Apto 402",
  torre: "Única",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 120,
  valorImovel: 690000,
  imagemUrl: "/empreendimentos/jangada.jpg",
};

// A third construtora — Alliance itself (its real brand, not a demo
// overlay on someone else's). Two empreendimentos: Boulevard has two of
// the client's units, Jardins has one. All three already have finished
// personalization history (see solicitacoesIniciais below).
// Foto que a Alliance subiu no cadastro do Boulevard — só esse
// empreendimento tem foto no mock, pra demonstrar os dois estados (foto /
// "imagem indisponível") na tela Minhas personalizações.
const ALLIANCE_BOULEVARD_IMAGEM = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=150&fit=crop";

// Two units, same empreendimento — each needs its own record since
// `unidade`/`torre` differ (PortalPage etc. read them directly).
export const empreendimentoAllianceBoulevard501: Empreendimento = {
  nome: "Alliance Boulevard",
  construtora: "Alliance",
  unidade: "Apto 501",
  torre: "A",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 220,
  valorImovel: 980000,
  imagemUrl: ALLIANCE_BOULEVARD_IMAGEM,
};

export const empreendimentoAllianceBoulevard1502: Empreendimento = {
  nome: "Alliance Boulevard",
  construtora: "Alliance",
  unidade: "Apto 1502",
  torre: "B",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 220,
  valorImovel: 1050000,
  imagemUrl: ALLIANCE_BOULEVARD_IMAGEM,
};

export const empreendimentoAllianceJardins: Empreendimento = {
  nome: "Alliance Jardins",
  construtora: "Engemax",
  unidade: "Apto 302",
  torre: "Única",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 96,
  valorImovel: 690000,
};

// The logged-in client's own unit↔construtora relationships. The portal's
// left sidebar builds its Construtora → Empreendimento → Unidade tree from
// this list. Only Alliance opted into white-label (brand: initialBrand) —
// Prado and Horizonte fall back to plantta's own colors (brand: null).
export const vinculos: Vinculo[] = [
  {
    id: "v-aurora-1204",
    construtoraId: "00001",
    construtoraNome: "Engemax",
    empreendimentoId: "00001",
    empreendimentoNome: "Canoa",
    plantaId: "planta-a",
    plantaNome: "Planta A — 2 quartos",
    unidadeLabel: "Apto 1204",
    torre: "B",
    brand: engemaxBrand,
  },
  {
    id: "v-vistaverde-2201",
    construtoraId: "00002",
    construtoraNome: "Horizonte Construções",
    empreendimentoId: "00002",
    empreendimentoNome: "Vista Verde Residence",
    plantaId: "planta-unica",
    plantaNome: "Planta Única",
    unidadeLabel: "Apto 2201",
    torre: "C",
    brand: null,
  },
  {
    id: "v-boulevard-501",
    construtoraId: "00003",
    construtoraNome: "Alliance",
    empreendimentoId: "00003",
    empreendimentoNome: "Alliance Boulevard",
    plantaId: "planta-unica",
    plantaNome: "Planta Única",
    unidadeLabel: "Apto 501",
    torre: "A",
    brand: initialBrand,
  },
  {
    id: "v-boulevard-1502",
    construtoraId: "00003",
    construtoraNome: "Alliance",
    empreendimentoId: "00003",
    empreendimentoNome: "Alliance Boulevard",
    plantaId: "planta-unica",
    plantaNome: "Planta Única",
    unidadeLabel: "Apto 1502",
    torre: "B",
    brand: initialBrand,
  },
  {
    id: "v-jardins-302",
    construtoraId: "00003",
    construtoraNome: "Alliance",
    empreendimentoId: "00004",
    empreendimentoNome: "Alliance Jardins",
    plantaId: "planta-unica",
    plantaNome: "Planta Única",
    unidadeLabel: "Apto 302",
    torre: "Única",
    brand: initialBrand,
    // Já aprovado E pago — cobre "Concluído" (memorial liberado) na demo.
    pagamentoConfirmadoEm: "2026-08-21T10:00:00-03:00",
  },
  {
    id: "v-vistaverde-1502",
    construtoraId: "00002",
    construtoraNome: "Horizonte Construções",
    empreendimentoId: "00002",
    empreendimentoNome: "Vista Verde Residence",
    plantaId: "planta-unica",
    plantaNome: "Planta Única",
    unidadeLabel: "Apto 1502",
    torre: "B",
    brand: null,
    // Sem nenhuma solicitação ainda — cobre "Nenhuma personalização".
  },
  {
    id: "v-aurora-305",
    construtoraId: "00001",
    construtoraNome: "Engemax",
    empreendimentoId: "00001",
    empreendimentoNome: "Canoa",
    plantaId: "planta-a",
    plantaNome: "Planta A — 2 quartos",
    unidadeLabel: "Apto 305",
    torre: "A",
    brand: engemaxBrand,
    // Cliente já declarou que não vai alterar — cobre "Sem alteração".
    semAlteracaoAssinadaEm: "2026-09-05T14:00:00-03:00",
    semAlteracaoAssinadaPor: "marina.alves@email.com",
  },
  {
    id: "v-jangada-402",
    construtoraId: "00001",
    construtoraNome: "Engemax",
    empreendimentoId: "00005",
    empreendimentoNome: "Jangada",
    plantaId: "planta-unica",
    plantaNome: "Planta Única",
    unidadeLabel: "Apto 402",
    torre: "Única",
    brand: engemaxBrand,
  },
];

export const ambientes: Ambiente[] = [
  {
    id: "sala",
    nome: "Sala de Estar",
    itens: [
      {
        id: "piso_sala",
        nome: "Piso",
        nivel: 1,
        padrao: "Porcelanato Standard 60×60",
        valorPadrao: 6000,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "p1", nome: "Porcelanato Standard 60×60", preco: 6000, padrao: true, materialCatalogItemId: "mc-013" },
          { id: "p2", nome: "Porcelanato Portobello Premium 80×80", preco: 8500, materialCatalogItemId: "mc-001" },
          { id: "p3", nome: "Porcelanato Marmorizado Extra", preco: 9800 },
          { id: "p0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "rodape_sala",
        nome: "Rodapé",
        nivel: 1,
        padrao: "MDF Branco 7 cm",
        valorPadrao: 1200,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "r1", nome: "MDF Branco 7 cm", preco: 1200, padrao: true },
          { id: "r2", nome: "MDF Amadeirado 10 cm", preco: 1600 },
          { id: "r0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "eletrica_sala",
        nome: "Pontos Elétricos",
        nivel: 2,
        padrao: "8 pontos (padrão sala)",
        valorPadrao: 0,
        prazoInicio: "01/09/2026",
        prazoFim: "05/10/2026",
        parametrico: true,
        qtdPadrao: 8,
        custoPorUnidade: { conduiteM: 12.5, fioM: 8.3, disjuntor: 45.0, maoDeObra: 85.0, total: 150.8 },
        opcoes: [],
      },
      {
        id: "parede_sala",
        nome: "Parede divisória cozinha/sala",
        nivel: 3,
        padrao: "Alvenaria estrutural",
        valorPadrao: 0,
        prazoInicio: null,
        prazoFim: null,
        motivoBloqueio: "Parede estrutural — remoção não permitida conforme laudo técnico RT-2024/087.",
        opcoes: [],
      },
    ],
  },
  {
    id: "cozinha",
    nome: "Cozinha",
    itens: [
      {
        id: "bancada",
        nome: "Bancada",
        nivel: 1,
        padrao: "Granito Cinza Corumbá",
        valorPadrao: 3200,
        // Deliberately in the past (today in this demo is 2026-09-20) —
        // gives the Prazo badge/status something to show as "Encerrado"
        // without waiting for a real deadline to pass. SOL-002 (Aurora,
        // pendente) is against this exact item, so it's a realistic
        // "decision window closed while still pending" demo case.
        prazoInicio: "20/08/2026",
        prazoFim: "15/09/2026",
        opcoes: [
          { id: "b1", nome: "Granito Cinza Corumbá", preco: 3200, padrao: true, materialCatalogItemId: "mc-014" },
          { id: "b2", nome: "Quartzo Branco Ibiza", preco: 4900 },
          { id: "b3", nome: "Dekton Sirius", preco: 6100, materialCatalogItemId: "mc-002" },
          { id: "b0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "cuba",
        nome: "Cuba e Torneira",
        nivel: 1,
        padrao: "Cuba simples inox + monocomando",
        valorPadrao: 900,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "c1", nome: "Cuba simples inox + monocomando", preco: 900, padrao: true },
          { id: "c2", nome: "Cuba dupla + torneira gourmet", preco: 1750 },
          { id: "c0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "hidraulica",
        nome: "Pontos Hidráulicos",
        nivel: 2,
        padrao: "3 pontos (padrão cozinha)",
        valorPadrao: 0,
        prazoInicio: "01/09/2026",
        prazoFim: "01/10/2026",
        parametrico: true,
        qtdPadrao: 3,
        custoPorUnidade: { tubulacao: 35.0, conexoes: 22.0, maoDeObra: 120.0, total: 177.0 },
        opcoes: [],
      },
    ],
  },
  {
    id: "banheiro",
    nome: "Banheiro Suíte",
    itens: [
      {
        id: "piso_banheiro",
        nome: "Piso",
        nivel: 1,
        padrao: "Porcelanato Antiderrapante Bege",
        valorPadrao: 1900,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "psb1", nome: "Porcelanato Antiderrapante Bege", preco: 1900, padrao: true, materialCatalogItemId: "mc-015" },
          { id: "psb2", nome: "Porcelanato Antiderrapante Areia", preco: 2300, materialCatalogItemId: "mc-011" },
          { id: "psb0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "revestimento",
        nome: "Revestimento",
        nivel: 1,
        padrao: "Porcelanato Acetinado Bege",
        valorPadrao: 2400,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "rv1", nome: "Porcelanato Acetinado Bege", preco: 2400, padrao: true },
          { id: "rv2", nome: "Porcelanato Off-White Grande Formato", preco: 3600, materialCatalogItemId: "mc-012" },
          { id: "rv0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "loucas",
        nome: "Louças e Metais",
        nivel: 1,
        padrao: "Deca Aspen + Deca Link",
        valorPadrao: 2100,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "l1", nome: "Deca Aspen + Deca Link", preco: 2100, padrao: true },
          { id: "l2", nome: "Docol Benefit Black", preco: 3400 },
          { id: "l0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "viga_banheiro",
        nome: "Viga estrutural",
        nivel: 3,
        padrao: "Concreto armado",
        valorPadrao: 0,
        prazoInicio: null,
        prazoFim: null,
        motivoBloqueio: "Elemento estrutural (viga) — alteração proibida por norma NBR 16280.",
        opcoes: [],
      },
    ],
  },
  {
    id: "varanda",
    nome: "Varanda",
    itens: [
      {
        id: "piso_varanda",
        nome: "Piso",
        nivel: 1,
        padrao: "Porcelanato Externo Cinza",
        valorPadrao: 3800,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "pv1", nome: "Porcelanato Externo Cinza", preco: 3800, padrao: true },
          { id: "pv2", nome: "Porcelanato Amadeirado Deck", preco: 5200, materialCatalogItemId: "mc-001" },
          { id: "pv0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "integracao",
        nome: "Integração varanda/sala",
        nivel: 2,
        padrao: "Esquadria padrão (fechada)",
        valorPadrao: 0,
        prazoInicio: "01/09/2026",
        prazoFim: "01/10/2026",
        opcoes: [
          { id: "iv1", nome: "Esquadria padrão (fechada)", preco: 0, padrao: true },
          { id: "iv2", nome: "Abertura total com esquadria retrátil", preco: 8500 },
        ],
      },
    ],
  },
];

// Aurora's Planta A catalog — verba compartilhada de demonstração:
// revestimento + louças do Banheiro Suíte dividem uma única verba, ao vivo
// (gastar mais num item reduz o saldo visível no outro).
const banheiroAurora = ambientes.find((a) => a.id === "banheiro")!;
banheiroAurora.itens.find((i) => i.id === "revestimento")!.allowanceGroupId = "ag-banheiro-aurora";
banheiroAurora.itens.find((i) => i.id === "loucas")!.allowanceGroupId = "ag-banheiro-aurora";

// Aurora's Planta B — 3 quartos, catálogo genuinely diferente da Planta A:
// não é um reaproveitamento com preços diferentes, tem um ambiente inteiro
// (Suíte Master) que a Planta A não tem, e os padrões dos ambientes
// compartilhados (Sala, Cozinha) são de outro patamar de acabamento.
const ambientesPlantaBAurora: Ambiente[] = [
  {
    id: "sala",
    nome: "Sala de Estar",
    itens: [
      {
        id: "piso_sala",
        nome: "Piso",
        nivel: 1,
        padrao: "Porcelanato Portobello Premium 80×80",
        valorPadrao: 8500,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "p1", nome: "Porcelanato Portobello Premium 80×80", preco: 8500, padrao: true },
          { id: "p2", nome: "Porcelanato Marmorizado Extra", preco: 9800 },
          { id: "p3", nome: "Porcelanato Importado 120×120", preco: 13500 },
          { id: "p0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "rodape_sala",
        nome: "Rodapé",
        nivel: 1,
        padrao: "MDF Amadeirado 10 cm",
        valorPadrao: 1600,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "r1", nome: "MDF Amadeirado 10 cm", preco: 1600, padrao: true },
          { id: "r2", nome: "MDF Branco 7 cm", preco: 1200 },
          { id: "r0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "eletrica_sala",
        nome: "Pontos Elétricos",
        nivel: 2,
        padrao: "12 pontos (padrão sala ampliada)",
        valorPadrao: 0,
        prazoInicio: "01/09/2026",
        prazoFim: "05/10/2026",
        parametrico: true,
        qtdPadrao: 12,
        custoPorUnidade: { conduiteM: 12.5, fioM: 8.3, disjuntor: 45.0, maoDeObra: 85.0, total: 150.8 },
        opcoes: [],
      },
    ],
  },
  {
    id: "cozinha",
    nome: "Cozinha",
    itens: [
      {
        id: "bancada",
        nome: "Bancada",
        nivel: 1,
        padrao: "Quartzo Branco Ibiza",
        valorPadrao: 4900,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "b1", nome: "Quartzo Branco Ibiza", preco: 4900, padrao: true },
          { id: "b2", nome: "Dekton Sirius", preco: 6100 },
          { id: "b0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "cuba",
        nome: "Cuba e Torneira",
        nivel: 1,
        padrao: "Cuba dupla + torneira gourmet",
        valorPadrao: 1750,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "c1", nome: "Cuba dupla + torneira gourmet", preco: 1750, padrao: true },
          { id: "c0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
    ],
  },
  {
    id: "suite_master",
    nome: "Suíte Master",
    itens: [
      {
        id: "piso_suite",
        nome: "Piso",
        nivel: 1,
        padrao: "Porcelanato Acetinado Bege",
        valorPadrao: 3200,
        prazoInicio: "01/09/2026",
        prazoFim: "20/10/2026",
        opcoes: [
          { id: "ps1", nome: "Porcelanato Acetinado Bege", preco: 3200, padrao: true },
          { id: "ps2", nome: "Porcelanato Off-White Grande Formato", preco: 4400 },
          { id: "ps0", nome: "Remover item (gera crédito)", preco: 0, remocao: true },
        ],
      },
      {
        id: "closet_suite",
        nome: "Closet planejado",
        nivel: 2,
        padrao: "Não incluso — opcional",
        valorPadrao: 0,
        prazoInicio: "01/09/2026",
        prazoFim: "10/10/2026",
        opcoes: [
          { id: "cl1", nome: "Não incluso", preco: 0, padrao: true },
          { id: "cl2", nome: "Closet planejado 6m linear", preco: 9500 },
        ],
      },
    ],
  },
];

const ARQUIVOS_PLANTA_VAZIOS: Planta["arquivos"] = {
  plantaArquitetonicaPdf: [], plantaImagem: [], dwg: [], plantaHumanizada: [], plantaMobiliada: [],
  plantaEletrica: [], plantaHidraulica: [], plantaPontos: [], memorialTipologia: [], renderizacoes: [],
  modelo3d: [],
};

// Plantas (tipologias de unidade) por empreendimento — um prédio de
// centenas de unidades quase nunca tem uma planta só. O catálogo abaixo
// pertence à Planta, não ao empreendimento (ver domain/types.ts Planta).
export const plantasPorEmpreendimento: Record<string, Planta[]> = {
  "00001": [
    { id: "planta-a", codigo: "PA-01", nome: "Planta A — 2 quartos", tipologia: "2 quartos", descricao: "2 dormitórios, 1 suíte", areaPrivativaM2: 68, areaTotalM2: 78, quartos: 2, suites: 1, banheiros: 2, vagas: 1, numeroAmbientes: 6, versao: "1.0", dataVersao: "10/01/2026", status: "ativa", opcoesPermitidas: "Piso, revestimento, metais, louças", restricoes: "Sem alteração de estrutura ou hidráulica de posição fixa", unidadesLabel: "Torres A e B, andares 2–14", arquivos: ARQUIVOS_PLANTA_VAZIOS, geometria3D: geometriaPlantaAAurora },
    { id: "planta-b", codigo: "PB-01", nome: "Planta B — 3 quartos", tipologia: "3 quartos", descricao: "3 dormitórios, suíte master com closet opcional", areaPrivativaM2: 94, areaTotalM2: 108, quartos: 3, suites: 1, banheiros: 3, vagas: 2, numeroAmbientes: 8, versao: "1.0", dataVersao: "10/01/2026", status: "ativa", opcoesPermitidas: "Piso, revestimento, metais, louças, bancadas", restricoes: "Sem alteração de estrutura ou hidráulica de posição fixa", unidadesLabel: "Torres A e B, andares 15–20 (coberturas e garden)", arquivos: ARQUIVOS_PLANTA_VAZIOS },
  ],
  "00002": [{ id: "planta-unica", codigo: "PU-01", nome: "Planta Única", tipologia: "2 quartos", descricao: "2 dormitórios, 1 suíte", areaPrivativaM2: 62, areaTotalM2: 70, quartos: 2, suites: 1, banheiros: 2, vagas: 1, numeroAmbientes: 6, versao: "1.0", dataVersao: "05/02/2026", status: "ativa", opcoesPermitidas: "Piso, revestimento, metais, louças", restricoes: "Sem alteração de estrutura", unidadesLabel: "Todas as unidades", arquivos: ARQUIVOS_PLANTA_VAZIOS, geometria3D: geometriaPlantaVistaVerde }],
  "00003": [{ id: "planta-unica", codigo: "PU-01", nome: "Planta Única", tipologia: "2 quartos", descricao: "2 dormitórios, 1 suíte", areaPrivativaM2: 75, areaTotalM2: 85, quartos: 2, suites: 1, banheiros: 2, vagas: 2, numeroAmbientes: 6, versao: "1.0", dataVersao: "12/03/2026", status: "ativa", opcoesPermitidas: "Piso, revestimento, metais, louças, bancadas", restricoes: "Sem alteração de estrutura", unidadesLabel: "Torres A e B, todos os andares", arquivos: ARQUIVOS_PLANTA_VAZIOS, geometria3D: geometriaPlantaBoulevard }],
  "00004": [{ id: "planta-unica", codigo: "PU-01", nome: "Planta Única", tipologia: "3 quartos", descricao: "3 dormitórios, 1 suíte", areaPrivativaM2: 88, areaTotalM2: 100, quartos: 3, suites: 1, banheiros: 2, vagas: 2, numeroAmbientes: 7, versao: "1.0", dataVersao: "20/03/2026", status: "ativa", opcoesPermitidas: "Piso, revestimento, metais, louças", restricoes: "Sem alteração de estrutura", unidadesLabel: "Torre única", arquivos: ARQUIVOS_PLANTA_VAZIOS }],
};

// `ambientes` é reaproveitado (clonado) por 00002/00003/00004 — mesmos
// ids de ambiente/item/opção em todo mundo, então um materialCatalogItemId
// escrito direto no template só resolve pra UMA construtora (a dona
// daquele id). Pra cada clone mostrar fotos do catálogo dela mesma (não a
// do template, que é sempre 00001), sobrescreve pontualmente depois de
// clonar — resto do catálogo (itens sem entrada aqui) fica igual ao
// template, sem material vinculado.
function vincularMateriais(ambientesClone: Ambiente[], vinculos: Record<string, Record<string, Record<string, string>>>) {
  for (const amb of ambientesClone) {
    const porItem = vinculos[amb.id];
    if (!porItem) continue;
    for (const item of amb.itens) {
      const porOpcao = porItem[item.id];
      if (!porOpcao) continue;
      for (const opcao of item.opcoes) {
        const materialId = porOpcao[opcao.id];
        if (materialId) opcao.materialCatalogItemId = materialId;
      }
    }
  }
  return ambientesClone;
}

// Cada Planta tem seu próprio catálogo, completamente independente —
// editar a Planta A via CatalogoPage nunca toca a Planta B nem outro
// empreendimento. Chaveado por `plantaKey(empreendimentoId, plantaId)`.
export const ambientesPorPlanta: Record<string, Ambiente[]> = {
  [plantaKey("00001", "planta-a")]: ambientes,
  [plantaKey("00001", "planta-b")]: ambientesPlantaBAurora,
  [plantaKey("00002", "planta-unica")]: vincularMateriais(clonar(ambientes), {
    sala: { piso_sala: { p1: "mc-016", p2: "mc-009" } },
    cozinha: { bancada: { b1: "mc-017", b3: "mc-010" } }, // b3 = "Dekton Sirius", mc-010 é Dekton Sirius
    banheiro: { piso_banheiro: { psb1: "mc-018", psb2: "mc-009" } },
  }),
  [plantaKey("00003", "planta-unica")]: vincularMateriais(clonar(ambientes), {
    sala: { piso_sala: { p1: "mc-019", p2: "mc-005" } },
    cozinha: { bancada: { b1: "mc-020", b2: "mc-007" } }, // b2 = "Quartzo Branco Ibiza", mc-007 é Silestone Branco Ibiza
    banheiro: { piso_banheiro: { psb1: "mc-021", psb2: "mc-005" }, revestimento: { rv2: "mc-006" } },
  }),
  [plantaKey("00004", "planta-unica")]: clonar(ambientes),
};

export const allowanceGroupsPorPlanta: Record<string, AllowanceGroup[]> = {
  [plantaKey("00001", "planta-a")]: [
    { id: "ag-banheiro-aurora", nome: "Verba Banheiro Suíte", ambienteId: "banheiro", valorTotal: 4500, itemIds: ["revestimento", "loucas"] },
  ],
  [plantaKey("00001", "planta-b")]: [],
  [plantaKey("00002", "planta-unica")]: [],
  [plantaKey("00003", "planta-unica")]: [],
  [plantaKey("00004", "planta-unica")]: [],
};

// Taxonomia de Categoria/Marca — antes lista fixa global, agora CRUD
// próprio por construtora (telas em /catalogo/categorias, /catalogo/marcas).
// Semeada a partir da mesma referência (domain/catalogoReferencia.ts) pra
// cada construtora começar com a mesma base, editável dali em diante.
const CONSTRUTORA_IDS = ["00001", "00002", "00003"];

export const categoriasIniciais: Categoria[] = CONSTRUTORA_IDS.flatMap((construtoraId) =>
  CATEGORIAS_MATERIAL.map((nome, i) => ({ id: `cat-${construtoraId}-${i}`, construtoraId, nome })),
);
export const marcasIniciais: Marca[] = CONSTRUTORA_IDS.flatMap((construtoraId) =>
  MARCAS_SUGERIDAS.map((nome, i) => ({ id: `marca-${construtoraId}-${i}`, construtoraId, nome })),
);
export const ambientesIniciais: TipoAmbiente[] = CONSTRUTORA_IDS.flatMap((construtoraId) =>
  AMBIENTES_SUGERIDOS.map((nome, i) => ({ id: `amb-${construtoraId}-${i}`, construtoraId, nome })),
);

function categoriaId(construtoraId: string, nome: string): string {
  return categoriasIniciais.find((c) => c.construtoraId === construtoraId && c.nome === nome)!.id;
}
function marcaId(construtoraId: string, nome: string): string {
  return marcasIniciais.find((m) => m.construtoraId === construtoraId && m.nome === nome)!.id;
}

// Fornecedor — cadastro próprio (razão social/CNPJ/contato/endereço), não
// mais um texto solto dentro do material.
export const fornecedoresIniciais: Fornecedor[] = [
  { id: "forn-001", construtoraId: "00001", razaoSocial: "Portobello Distribuidora SP Ltda", nomeFantasia: "Portobello Distribuidora SP", cnpjCpf: "12.345.678/0001-90", responsavel: "Renata Souza", telefone: "(11) 3345-2200", whatsapp: "(11) 98811-2200", email: "comercial@portobellosp.com.br", cep: "04571-000", endereco: "Av. Eng. Luís Carlos Berrini, 1200", cidade: "São Paulo", uf: "SP" },
  { id: "forn-002", construtoraId: "00001", razaoSocial: "Cosentino Brasil Ltda", nomeFantasia: "Cosentino Brasil", cnpjCpf: "23.456.789/0001-01", responsavel: "Marcos Lima", telefone: "(11) 4002-1122", whatsapp: "(11) 98822-1122", email: "vendas@cosentinobrasil.com.br", cep: "06455-000", endereco: "Al. Rio Negro, 500", cidade: "Barueri", uf: "SP" },
  { id: "forn-003", construtoraId: "00001", razaoSocial: "Docol SP Comércio Ltda", nomeFantasia: "Docol SP", cnpjCpf: "34.567.890/0001-12", responsavel: "Juliana Prado", telefone: "(11) 3311-4455", whatsapp: "(11) 98833-4455", email: "atendimento@docolsp.com.br", cep: "01311-000", endereco: "Av. Paulista, 2200", cidade: "São Paulo", uf: "SP" },
  { id: "forn-004", construtoraId: "00001", razaoSocial: "Tramontina Distribuidora Ltda", nomeFantasia: "Tramontina Distribuidora", cnpjCpf: "45.678.901/0001-23", responsavel: "Eduardo Nascimento", telefone: "(11) 3999-7788", whatsapp: "(11) 98844-7788", email: "vendas@tramontinadist.com.br", cep: "05001-000", endereco: "R. Turiassu, 800", cidade: "São Paulo", uf: "SP" },
  { id: "forn-005", construtoraId: "00003", razaoSocial: "Portobello Distribuidora SP Ltda", nomeFantasia: "Portobello Distribuidora SP", cnpjCpf: "12.345.678/0001-90", responsavel: "Renata Souza", telefone: "(11) 3345-2200", whatsapp: "(11) 98811-2200", email: "comercial@portobellosp.com.br", cep: "04571-000", endereco: "Av. Eng. Luís Carlos Berrini, 1200", cidade: "São Paulo", uf: "SP" },
  { id: "forn-006", construtoraId: "00003", razaoSocial: "Silestone Brasil Comércio Ltda", nomeFantasia: "Silestone Brasil", cnpjCpf: "56.789.012/0001-34", responsavel: "Camila Teixeira", telefone: "(11) 3777-9900", whatsapp: "(11) 98855-9900", email: "vendas@silestonebrasil.com.br", cep: "06454-000", endereco: "Al. Tocantins, 350", cidade: "Barueri", uf: "SP" },
  { id: "forn-007", construtoraId: "00002", razaoSocial: "Portobello Distribuidora SP Ltda", nomeFantasia: "Portobello Distribuidora SP", cnpjCpf: "12.345.678/0001-90", responsavel: "Renata Souza", telefone: "(11) 3345-2200", whatsapp: "(11) 98811-2200", email: "comercial@portobellosp.com.br", cep: "04571-000", endereco: "Av. Eng. Luís Carlos Berrini, 1200", cidade: "São Paulo", uf: "SP" },

  // 00001 (Prado Engenharia) — mais fornecedores, cobrindo revestimento,
  // louças, metais, pintura e planejados.
  { id: "forn-008", construtoraId: "00001", razaoSocial: "Eliane Revestimentos Comércio Ltda", nomeFantasia: "Eliane Revestimentos", cnpjCpf: "67.890.123/0001-45", responsavel: "Fábio Cardoso", telefone: "(11) 3221-3300", whatsapp: "(11) 98866-3300", email: "comercial@elianesp.com.br", cep: "04547-000", endereco: "Av. Ibirapuera, 2500", cidade: "São Paulo", uf: "SP" },
  { id: "forn-009", construtoraId: "00001", razaoSocial: "Roca Louças e Metais Brasil Ltda", nomeFantasia: "Roca Brasil", cnpjCpf: "78.901.234/0001-56", responsavel: "Sandra Nogueira", telefone: "(11) 3221-4400", whatsapp: "(11) 98877-4400", email: "vendas@rocabrasilsp.com.br", cep: "04578-000", endereco: "R. Verbo Divino, 1400", cidade: "São Paulo", uf: "SP" },
  { id: "forn-010", construtoraId: "00001", razaoSocial: "Hydra Metais Comércio Ltda", nomeFantasia: "Hydra Metais", cnpjCpf: "89.012.345/0001-67", responsavel: "Rogério Batista", telefone: "(11) 3221-5500", whatsapp: "(11) 98888-5500", email: "comercial@hydrasp.com.br", cep: "04552-000", endereco: "Av. Santo Amaro, 900", cidade: "São Paulo", uf: "SP" },
  { id: "forn-011", construtoraId: "00001", razaoSocial: "Suvinil Tintas Distribuidora Ltda", nomeFantasia: "Suvinil Tintas SP", cnpjCpf: "90.123.456/0001-78", responsavel: "Vera Lins", telefone: "(11) 3221-6600", whatsapp: "(11) 98899-6600", email: "vendas@suviniltintassp.com.br", cep: "04566-000", endereco: "Av. Chucri Zaidan, 700", cidade: "São Paulo", uf: "SP" },
  { id: "forn-012", construtoraId: "00001", razaoSocial: "Todeschini Móveis Planejados SP Ltda", nomeFantasia: "Todeschini SP", cnpjCpf: "01.234.567/0001-89", responsavel: "Cláudio Ferraz", telefone: "(11) 3221-7700", whatsapp: "(11) 98900-7700", email: "comercial@todeschinisp.com.br", cep: "04533-000", endereco: "R. Funchal, 300", cidade: "São Paulo", uf: "SP" },

  // 00002 (Horizonte Construções, Campinas) — mesma cobertura, fornecedores
  // regionais próprios.
  { id: "forn-013", construtoraId: "00002", razaoSocial: "Portinari Revestimentos Campinas Ltda", nomeFantasia: "Portinari Campinas", cnpjCpf: "12.345.679/0001-91", responsavel: "Adriana Melo", telefone: "(19) 3232-2200", whatsapp: "(19) 98811-2200", email: "comercial@portinaricampinas.com.br", cep: "13010-000", endereco: "Av. Norte-Sul, 1500", cidade: "Campinas", uf: "SP" },
  { id: "forn-014", construtoraId: "00002", razaoSocial: "Deca Metais e Louças Campinas Ltda", nomeFantasia: "Deca Campinas", cnpjCpf: "23.456.780/0001-02", responsavel: "Wagner Rocha", telefone: "(19) 3232-3300", whatsapp: "(19) 98822-3300", email: "vendas@decacampinas.com.br", cep: "13025-000", endereco: "R. Barão de Jaguara, 800", cidade: "Campinas", uf: "SP" },
  { id: "forn-015", construtoraId: "00002", razaoSocial: "Fabrimar Metais Sanitários Ltda", nomeFantasia: "Fabrimar Campinas", cnpjCpf: "34.567.891/0001-13", responsavel: "Simone Vieira", telefone: "(19) 3232-4400", whatsapp: "(19) 98833-4400", email: "comercial@fabrimarcampinas.com.br", cep: "13070-000", endereco: "Av. Aquidaban, 400", cidade: "Campinas", uf: "SP" },
  { id: "forn-016", construtoraId: "00002", razaoSocial: "Eucatex Painéis e Madeiras Ltda", nomeFantasia: "Eucatex Campinas", cnpjCpf: "45.678.902/0001-24", responsavel: "Alexandre Duarte", telefone: "(19) 3232-5500", whatsapp: "(19) 98844-5500", email: "vendas@eucatexcampinas.com.br", cep: "13084-000", endereco: "R. Conceição, 1200", cidade: "Campinas", uf: "SP" },
  { id: "forn-017", construtoraId: "00002", razaoSocial: "Coral Tintas Distribuidora Ltda", nomeFantasia: "Coral Tintas Campinas", cnpjCpf: "56.789.013/0001-35", responsavel: "Priscila Gomes", telefone: "(19) 3232-6600", whatsapp: "(19) 98855-6600", email: "comercial@coraltintascampinas.com.br", cep: "13091-000", endereco: "Av. José Rocha Bonfim, 600", cidade: "Campinas", uf: "SP" },

  // 00003 (Alliance) — mesma cobertura, mais argamassa/rejunte e cuba.
  { id: "forn-018", construtoraId: "00003", razaoSocial: "Incepa Revestimentos Cerâmicos Ltda", nomeFantasia: "Incepa SP", cnpjCpf: "67.890.124/0001-46", responsavel: "Otávio Ramalho", telefone: "(11) 3777-2200", whatsapp: "(11) 98811-7700", email: "comercial@incepasp.com.br", cep: "04571-100", endereco: "Av. Eng. Luís Carlos Berrini, 1500", cidade: "São Paulo", uf: "SP" },
  { id: "forn-019", construtoraId: "00003", razaoSocial: "Celite Louças Sanitárias Ltda", nomeFantasia: "Celite SP", cnpjCpf: "78.901.235/0001-57", responsavel: "Marina Tavares", telefone: "(11) 3777-3300", whatsapp: "(11) 98822-7700", email: "vendas@celitesp.com.br", cep: "04578-100", endereco: "R. Verbo Divino, 1600", cidade: "São Paulo", uf: "SP" },
  { id: "forn-020", construtoraId: "00003", razaoSocial: "Quartzolit Argamassas e Rejuntes Ltda", nomeFantasia: "Quartzolit SP", cnpjCpf: "89.012.346/0001-68", responsavel: "Diego Rangel", telefone: "(11) 3777-4400", whatsapp: "(11) 98833-7700", email: "comercial@quartzolitsp.com.br", cep: "04552-100", endereco: "Av. Santo Amaro, 1100", cidade: "São Paulo", uf: "SP" },
  { id: "forn-021", construtoraId: "00003", razaoSocial: "Franke Cubas e Torneiras Ltda", nomeFantasia: "Franke SP", cnpjCpf: "90.123.457/0001-79", responsavel: "Letícia Barros", telefone: "(11) 3777-5500", whatsapp: "(11) 98844-7700", email: "vendas@frankesp.com.br", cep: "04566-100", endereco: "Av. Chucri Zaidan, 900", cidade: "São Paulo", uf: "SP" },
  { id: "forn-022", construtoraId: "00003", razaoSocial: "Bertolini Móveis Planejados Ltda", nomeFantasia: "Bertolini SP", cnpjCpf: "01.234.568/0001-80", responsavel: "Gabriel Assunção", telefone: "(11) 3777-6600", whatsapp: "(11) 98855-7700", email: "comercial@bertolinisp.com.br", cep: "04533-100", endereco: "R. Funchal, 500", cidade: "São Paulo", uf: "SP" },

  // Distribuidoras multimarcas — carregam esquadria, vidro, elétrica,
  // iluminação, forro, eletrodoméstico, automação, ar-condicionado e
  // fechadura, categorias que senão ficariam sem nenhum fornecedor.
  { id: "forn-023", construtoraId: "00001", razaoSocial: "Acabamentos Zona Sul Distribuidora Ltda", nomeFantasia: "Acabamentos Zona Sul", cnpjCpf: "11.222.333/0001-91", responsavel: "Tatiane Borges", telefone: "(11) 3888-1010", whatsapp: "(11) 98911-1010", email: "comercial@acabamentoszonasul.com.br", cep: "04544-000", endereco: "Av. Roque Petroni Jr., 850", cidade: "São Paulo", uf: "SP" },
  { id: "forn-024", construtoraId: "00002", razaoSocial: "Distribuidora de Acabamentos Campinas Ltda", nomeFantasia: "Acabamentos Campinas", cnpjCpf: "22.333.444/0001-02", responsavel: "Leandro Prado", telefone: "(19) 3232-1010", whatsapp: "(19) 98922-1010", email: "comercial@acabamentoscampinas.com.br", cep: "13073-000", endereco: "Av. Guilherme Campos, 500", cidade: "Campinas", uf: "SP" },
  { id: "forn-025", construtoraId: "00003", razaoSocial: "Central de Acabamentos Paulista Ltda", nomeFantasia: "Central Acabamentos Paulista", cnpjCpf: "33.444.555/0001-13", responsavel: "Vinícius Godoy", telefone: "(11) 3888-2020", whatsapp: "(11) 98933-2020", email: "comercial@centralacabamentospaulista.com.br", cep: "01310-000", endereco: "Av. Paulista, 1800", cidade: "São Paulo", uf: "SP" },
];

const ARQUIVOS_PESSOA_VAZIOS: Pessoa["arquivos"] = {
  documentoProfissional: [], carteiraRegistro: [], certificados: [], artRrt: [], contratos: [], projetosDocumentosTecnicos: [],
};

// Pessoa/Papel — cadastro único pra qualquer humano com quem a construtora
// lida (arquiteto/engenheiro/técnico/cliente...), não cadastros paralelos
// por tipo (ver domain/types.ts Pessoa).
const pessoasCuradas: Pessoa[] = [
  { id: "pessoa-001", construtoraId: "00001", papeis: ["Arquiteto", "Responsável pela construtora"], nome: "Fernanda Ribeiro", cpf: "111.222.333-44", email: "fernanda.ribeiro@arquitetura.com.br", telefone: "(11) 3222-1000", empresa: "Ribeiro Arquitetura", cargoEspecialidade: "Arquiteta responsável", conselho: "CAU", numeroRegistro: "A123456-7", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-002", construtoraId: "00001", papeis: ["Engenheiro"], nome: "Carlos Eduardo Matos", cpf: "222.333.444-55", email: "carlos.matos@engemax.com.br", telefone: "(11) 3222-2000", empresa: "Engemax", cargoEspecialidade: "Engenheiro civil — gerente de obra", conselho: "CREA", numeroRegistro: "5401234", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-003", construtoraId: "00003", papeis: ["Cliente"], nome: "Marina Alves", cpf: "333.444.555-66", email: "marina.alves@email.com", telefone: "(11) 98765-4321", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Alameda Santos, 800, São Paulo/SP", estadoCivil: "Casada", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },

  // Prado Engenharia (00001) — clientes das solicitações já existentes
  // (Ricardo/Camila/Bruno, ver solicitacoesIniciais) mais o time técnico.
  { id: "pessoa-004", construtoraId: "00001", papeis: ["Cliente"], nome: "Ricardo Nogueira", cpf: "444.555.666-77", email: "ricardo.nogueira@email.com", telefone: "(11) 98111-2233", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Rua Harmonia, 210, São Paulo/SP", estadoCivil: "Solteiro", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-005", construtoraId: "00001", papeis: ["Cliente"], nome: "Camila Reis", cpf: "555.666.777-88", email: "camila.reis@email.com", telefone: "(11) 98222-3344", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Av. Rebouças, 1450, São Paulo/SP", estadoCivil: "Casada", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-006", construtoraId: "00001", papeis: ["Cliente"], nome: "Bruno Castro", cpf: "666.777.888-99", email: "bruno.castro@email.com", telefone: "(11) 98333-4455", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Rua Cardeal Arcoverde, 900, São Paulo/SP", estadoCivil: "Solteiro", canalContatoPreferencial: "Telefone", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-007", construtoraId: "00001", papeis: ["Técnico"], nome: "José Almeida", cpf: "111.222.888-11", email: "jose.almeida@engemax.com.br", telefone: "(11) 3222-3000", empresa: "Engemax", cargoEspecialidade: "Técnico de edificações", conselho: "CREA", numeroRegistro: "5409988", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-008", construtoraId: "00001", papeis: ["Designer"], nome: "Patrícia Nunes", cpf: "222.333.999-22", email: "patricia@nunesdesign.com.br", telefone: "(11) 3555-4020", empresa: "Nunes Design de Interiores", cargoEspecialidade: "Designer de interiores", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-009", construtoraId: "00001", papeis: ["Projetista"], nome: "Rafael Teixeira", cpf: "333.444.000-33", email: "rafael.teixeira@projetos.com.br", telefone: "(11) 3666-5030", empresa: "Teixeira Projetos", cargoEspecialidade: "Projetista arquitetônico", conselho: "CAU", numeroRegistro: "A234567-8", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-010", construtoraId: "00001", papeis: ["Consultor"], nome: "Marcos Vinícius Andrade", cpf: "444.555.111-44", email: "marcos.andrade@consultoria.com.br", telefone: "(11) 98444-5566", empresa: "Andrade Consultoria Imobiliária", cargoEspecialidade: "Consultor de viabilidade", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-011", construtoraId: "00001", papeis: ["Responsável pela construtora"], nome: "Beatriz Prado", cpf: "555.666.222-55", email: "beatriz.prado@engemax.com.br", telefone: "(11) 3222-1010", empresa: "Engemax", cargoEspecialidade: "Sócia-diretora", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },

  // Horizonte Construções (00002) — clientes das solicitações já existentes
  // (Fernanda/André/Juliana) mais o time técnico, em Campinas (DDD 19).
  { id: "pessoa-012", construtoraId: "00002", papeis: ["Cliente"], nome: "Fernanda Lima", cpf: "666.777.333-66", email: "fernanda.lima@email.com", telefone: "(19) 98111-2200", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Rua Barão de Jaguara, 300, Campinas/SP", estadoCivil: "Casada", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-013", construtoraId: "00002", papeis: ["Cliente"], nome: "André Souza", cpf: "777.888.444-77", email: "andre.souza@email.com", telefone: "(19) 98222-3300", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Av. Norte-Sul, 1200, Campinas/SP", estadoCivil: "Solteiro", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-014", construtoraId: "00002", papeis: ["Cliente"], nome: "Juliana Rocha", cpf: "888.999.555-88", email: "juliana.rocha@email.com", telefone: "(19) 98333-4400", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Rua Ferreira Penteado, 55, Campinas/SP", estadoCivil: "Divorciada", canalContatoPreferencial: "Telefone", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-015", construtoraId: "00002", papeis: ["Arquiteto"], nome: "Gustavo Freitas", cpf: "999.000.666-99", email: "gustavo.freitas@arquitetura.com.br", telefone: "(19) 3232-4040", empresa: "Freitas Arquitetura", cargoEspecialidade: "Arquiteto responsável", conselho: "CAU", numeroRegistro: "A345678-9", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-016", construtoraId: "00002", papeis: ["Engenheiro"], nome: "Débora Martins", cpf: "000.111.777-00", email: "debora.martins@horizonteconstrucoes.com.br", telefone: "(19) 3232-5050", empresa: "Horizonte Construções", cargoEspecialidade: "Engenheira civil — gerente de obra", conselho: "CREA", numeroRegistro: "5412345", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-017", construtoraId: "00002", papeis: ["Técnico"], nome: "Paulo Henrique Costa", cpf: "111.222.888-12", email: "paulo.costa@horizonteconstrucoes.com.br", telefone: "(19) 3232-6060", empresa: "Horizonte Construções", cargoEspecialidade: "Técnico de segurança do trabalho", conselho: "CREA", numeroRegistro: "5498877", ufRegistro: "SP", statusRegistro: "Inativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "Desligado — mantido pra histórico de laudos assinados.", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-018", construtoraId: "00002", papeis: ["Consultor"], nome: "Renata Almeida", cpf: "222.333.999-23", email: "renata.almeida@consultoria.com.br", telefone: "(19) 98555-6070", empresa: "Almeida Consultoria", cargoEspecialidade: "Consultora comercial", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-019", construtoraId: "00002", papeis: ["Responsável pela construtora"], nome: "Henrique Souza", cpf: "333.444.000-34", email: "henrique.souza@horizonteconstrucoes.com.br", telefone: "(19) 3232-1000", empresa: "Horizonte Construções", cargoEspecialidade: "Diretor de obras", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },

  // Alliance (00003) — clientes das solicitações já existentes (Larissa/
  // Thiago) mais dois clientes novos (pra combo de Vendas ter opções) e
  // o time técnico.
  { id: "pessoa-020", construtoraId: "00003", papeis: ["Cliente"], nome: "Larissa Prado", cpf: "444.555.111-45", email: "larissa.prado@email.com", telefone: "(11) 98666-7788", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Rua Oscar Freire, 500, São Paulo/SP", estadoCivil: "Casada", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-021", construtoraId: "00003", papeis: ["Cliente"], nome: "Thiago Martins", cpf: "555.666.222-56", email: "thiago.martins@email.com", telefone: "(11) 98777-8899", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Al. Lorena, 1100, São Paulo/SP", estadoCivil: "Solteiro", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-022", construtoraId: "00003", papeis: ["Cliente"], nome: "Vanessa Cardoso", cpf: "666.777.333-67", email: "vanessa.cardoso@email.com", telefone: "(11) 98888-9900", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Rua Haddock Lobo, 400, São Paulo/SP", estadoCivil: "Casada", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-023", construtoraId: "00003", papeis: ["Cliente"], nome: "Diego Fontoura", cpf: "777.888.444-78", email: "diego.fontoura@email.com", telefone: "(11) 98999-0011", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Av. Faria Lima, 2500, São Paulo/SP", estadoCivil: "Solteiro", canalContatoPreferencial: "Telefone", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-024", construtoraId: "00003", papeis: ["Arquiteto"], nome: "Isabela Cunha", cpf: "888.999.555-89", email: "isabela.cunha@arquitetura.com.br", telefone: "(11) 3455-7070", empresa: "Cunha Arquitetura", cargoEspecialidade: "Arquiteta responsável", conselho: "CAU", numeroRegistro: "A456789-0", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-025", construtoraId: "00003", papeis: ["Engenheiro"], nome: "Rodrigo Salles", cpf: "999.000.666-90", email: "rodrigo.salles@alliance.com.br", telefone: "(11) 3455-8080", empresa: "Alliance", cargoEspecialidade: "Engenheiro civil — gerente de obra", conselho: "CREA", numeroRegistro: "5423456", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-026", construtoraId: "00003", papeis: ["Projetista"], nome: "Ana Beatriz Rezende", cpf: "000.111.777-01", email: "ana.rezende@projetos.com.br", telefone: "(11) 98111-2299", empresa: "Rezende Projetos", cargoEspecialidade: "Projetista de interiores", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-027", construtoraId: "00003", papeis: ["Responsável pela construtora"], nome: "Felipe Alliance", cpf: "111.222.888-13", email: "felipe@alliance.com.br", telefone: "(11) 3455-9090", empresa: "Alliance", cargoEspecialidade: "Diretor comercial", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
];

// Pessoas geradas — mesma composição de papéis em toda construtora (mais
// clientes, que é o que os combos de Vendas/Personalização precisam em
// volume), só pra dar massa além dos poucos nomes curados acima.
const NOMES_MASC = [
  "Lucas", "Gabriel", "Matheus", "Rafael", "Gustavo", "Felipe", "Rodrigo", "Diego", "Vinícius", "Leonardo",
  "Eduardo", "Fernando", "Marcelo", "Alexandre", "Daniel", "Pedro", "Henrique", "Otávio", "Caio", "Igor",
  "Renato", "Sérgio", "Wagner", "Fábio", "Márcio", "Cláudio", "Rogério", "Paulo", "Roberto", "Sandro",
];
const NOMES_FEM = [
  "Ana", "Beatriz", "Camila", "Juliana", "Larissa", "Mariana", "Patrícia", "Renata", "Vanessa", "Débora",
  "Priscila", "Aline", "Bianca", "Carolina", "Daniela", "Isabela", "Letícia", "Natália", "Simone", "Tatiane",
  "Vera", "Adriana", "Cristina", "Elaine", "Gabriela", "Luciana", "Regina", "Sandra", "Viviane", "Cecília",
];
const SOBRENOMES = [
  "Silva", "Souza", "Costa", "Santos", "Oliveira", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Gomes",
  "Martins", "Rocha", "Barbosa", "Araújo", "Nascimento", "Cardoso", "Correia", "Teixeira", "Lopes", "Moreira",
  "Cunha", "Freitas", "Machado", "Melo", "Barros", "Fonseca", "Duarte", "Vieira", "Nunes", "Andrade",
  "Monteiro", "Pinto", "Ramos", "Batista", "Prado",
];
const RUAS_CLIENTE = [
  "Rua das Palmeiras", "Av. Higienópolis", "Rua Girassol", "Rua das Acácias", "Rua Itápolis",
  "Rua Joaquim Antunes", "Av. Angélica", "Rua Sampaio Viana", "Av. Rebouças", "Rua Harmonia",
  "Rua dos Pinheiros", "Av. Indianópolis", "Rua Cotoxó", "Rua Purpurina", "Av. Moema",
];

interface PlanoPapel {
  papel: TipoPapel;
  qtd: number;
  tipo: "cliente" | "interno" | "externo" | "outro";
  cargoEspecialidade?: string;
  conselho?: "CAU" | "CREA";
  empresaSufixo?: string;
}

const PLANO_PAPEIS: PlanoPapel[] = [
  { papel: "Cliente", qtd: 20, tipo: "cliente" },
  { papel: "Arquiteto", qtd: 3, tipo: "externo", cargoEspecialidade: "Arquiteto(a) associado(a)", conselho: "CAU", empresaSufixo: "Arquitetura" },
  { papel: "Engenheiro", qtd: 3, tipo: "interno", cargoEspecialidade: "Engenheiro(a) civil", conselho: "CREA" },
  { papel: "Técnico", qtd: 3, tipo: "interno", cargoEspecialidade: "Técnico(a) de edificações", conselho: "CREA" },
  { papel: "Designer", qtd: 3, tipo: "externo", cargoEspecialidade: "Designer de interiores", empresaSufixo: "Design de Interiores" },
  { papel: "Projetista", qtd: 3, tipo: "externo", cargoEspecialidade: "Projetista arquitetônico(a)", empresaSufixo: "Projetos" },
  { papel: "Consultor", qtd: 3, tipo: "externo", cargoEspecialidade: "Consultor(a) de viabilidade", empresaSufixo: "Consultoria" },
  { papel: "Responsável pela construtora", qtd: 3, tipo: "interno", cargoEspecialidade: "Diretor(a) / sócio(a)" },
  { papel: "Outro", qtd: 4, tipo: "outro" },
];

const CONSTRUTORAS_META: Record<string, { nome: string; ddd: string; cidade: string; dominio: string }> = {
  "00001": { nome: "Engemax", ddd: "11", cidade: "São Paulo", dominio: "engemax.com.br" },
  "00002": { nome: "Horizonte Construções", ddd: "19", cidade: "Campinas", dominio: "horizonteconstrucoes.com.br" },
  "00003": { nome: "Alliance", ddd: "11", cidade: "São Paulo", dominio: "alliance.com.br" },
};

function slugify(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function cpfFake(seed: number): string {
  const digitos = String(100000000 + seed).padStart(9, "0");
  const dv = String(seed % 100).padStart(2, "0");
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${dv}`;
}

function gerarPessoasDaConstrutora(construtoraId: string): Pessoa[] {
  const meta = CONSTRUTORAS_META[construtoraId];
  const pessoas: Pessoa[] = [];
  let seq = 0;
  for (const plano of PLANO_PAPEIS) {
    for (let i = 0; i < plano.qtd; i++) {
      seq += 1;
      const seedGlobal = seq * 37 + construtoraId.charCodeAt(4) * 101;
      const genero = seedGlobal % 2 === 0 ? "F" : "M";
      const poolNomes = genero === "F" ? NOMES_FEM : NOMES_MASC;
      const primeiroNome = poolNomes[seedGlobal % poolNomes.length];
      const sobrenome1 = SOBRENOMES[(seedGlobal * 3 + 1) % SOBRENOMES.length];
      const sobrenome2 = SOBRENOMES[(seedGlobal * 7 + 5) % SOBRENOMES.length];
      const nome = `${primeiroNome} ${sobrenome1} ${sobrenome2}`;
      const slugNome = slugify(primeiroNome);
      const slugSobrenome = slugify(sobrenome2);
      const cpf = cpfFake(seedGlobal);
      const telefone = `(${meta.ddd}) 9${String(8000 + seedGlobal).padStart(4, "0")}-${String(1000 + (seedGlobal % 9000)).padStart(4, "0")}`;
      const canalContatoPreferencial = ["WhatsApp", "E-mail", "Telefone"][seedGlobal % 3];
      const statusRegistro = seedGlobal % 11 === 0 ? "Inativo" : "Ativo";

      // Sufixo com construtora+seq garante e-mail único mesmo quando dois
      // nomes gerados colidem (pool de nomes/sobrenomes é pequeno).
      const uniq = `${construtoraId.slice(-2)}${String(seq).padStart(3, "0")}`;
      let empresa = "";
      let email = `${slugNome}.${slugSobrenome}${uniq}@email.com`;
      if (plano.tipo === "interno") {
        empresa = meta.nome;
        email = `${slugNome}.${slugSobrenome}${uniq}@${meta.dominio}`;
      } else if (plano.tipo === "externo") {
        empresa = `${sobrenome2} ${plano.empresaSufixo}`;
        email = `${slugNome}.${slugSobrenome}${uniq}@${slugify(sobrenome2)}${slugify(plano.papel).replace(/\s+/g, "")}.com.br`;
      }

      pessoas.push({
        id: `pessoa-${construtoraId}-${String(seq).padStart(3, "0")}`,
        construtoraId,
        papeis: [plano.papel],
        nome,
        cpf,
        email,
        telefone,
        empresa,
        cargoEspecialidade: plano.cargoEspecialidade ?? "",
        conselho: plano.conselho ?? "",
        numeroRegistro: plano.conselho ? `${plano.conselho === "CAU" ? "A" : "54"}${100000 + seedGlobal}` : "",
        ufRegistro: plano.conselho ? "SP" : "",
        statusRegistro,
        endereco: plano.tipo === "cliente" ? `${RUAS_CLIENTE[seedGlobal % RUAS_CLIENTE.length]}, ${100 + (seedGlobal % 1900)}, ${meta.cidade}/SP` : "",
        estadoCivil: plano.tipo === "cliente" ? ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)"][seedGlobal % 4] : "",
        canalContatoPreferencial,
        observacoes: "",
        arquivos: ARQUIVOS_PESSOA_VAZIOS,
      });
    }
  }
  return pessoas;
}

export const pessoasIniciais: Pessoa[] = [...pessoasCuradas, ...CONSTRUTORA_IDS.flatMap(gerarPessoasDaConstrutora)];

// Biblioteca de materiais reutilizável por construtora — identidade do
// produto (categoria/marca/modelo/SKU), sem preço/prazo: isso é resolvido
// por item quando o material é anexado a uma opção (Opcao.preco/
// custoConstrutora), já que preço varia por negociação e por item.
//
// Gerado (não digitado item a item) pra garantir o mesmo catálogo — mesmas
// categorias, marcas e variantes — em toda construtora nova, com volume
// suficiente pra nunca faltar material pronto ao cadastrar uma opção.
interface ReferenciaMaterial {
  categoria: (typeof CATEGORIAS_MATERIAL)[number];
  marcas: (typeof MARCAS_SUGERIDAS)[number][];
  variantes: string[];
}

const REFERENCIA_MATERIAIS: ReferenciaMaterial[] = [
  {
    categoria: "Piso",
    marcas: ["Portobello", "Eliane", "Portinari", "Incepa", "Cecafi"],
    variantes: [
      "Acetinado 60×60 Bege", "Acetinado 60×60 Cinza", "Polido 80×80 Branco", "Polido 80×80 Grafite",
      "Amadeirado Deck 20×120", "Marmorizado 90×90", "Externo Antiderrapante 45×45", "Grande Formato 120×120",
      "Rústico 60×60 Areia", "Retificado 80×80 Off-White",
    ],
  },
  {
    categoria: "Revestimento",
    marcas: ["Portobello", "Eliane", "Portinari", "Incepa", "Quartzolit"],
    variantes: [
      "Acetinado Bege 30×60", "Acetinado Branco 30×60", "Fosco Cinza 45×90", "Brilhante Branco 30×90",
      "Marmorizado Branco 60×60", "Concreto Grafite 60×60", "Metrô Branco 7,5×15", "Hexagonal Cinza 20×23",
      "Grande Formato Cimentício 90×90", "Externo Antiderrapante 30×60",
    ],
  },
  {
    categoria: "Louças e Metais",
    marcas: ["Roca", "Deca", "Celite", "Icasa", "Docol", "Hydra", "Fabrimar", "Lorenzetti", "Perflex"],
    variantes: [
      "Linha Aspen Branco", "Linha Izy Branco", "Monocomando Fit Cromado", "Monocomando Slim Black",
      "Ducha Higiênica Cromada", "Torneira Gourmet Preta", "Vaso Sanitário Suspenso Branco", "Cuba de Apoio Branca",
      "Assento Amortecido Branco", "Monocomando Class Grafite",
    ],
  },
  {
    categoria: "Bancada",
    marcas: ["Dekton", "Silestone", "Quartzolit"],
    variantes: [
      "Branco Ibiza", "Cinza Corumbá", "Preto Absoluto", "Bege Aracaju", "Grafite Ferro",
      "Sirius", "Kalahari", "Trance", "Blanco Zeus", "Nero Marquina",
    ],
  },
  {
    categoria: "Cuba",
    marcas: ["Franke", "Blanco", "Tramontina"],
    variantes: [
      "Inox Simples 50×34", "Inox Dupla 68×34", "Inox Onda Gourmet", "Granito Composto Bege",
      "Granito Composto Grafite", "Cerâmica Branca Sobrepor", "Cerâmica Encaixe Branca", "Inox Ampliada Gourmet",
      "Inox Gourmet com Escorredor", "Cerâmica Bege Sobrepor",
    ],
  },
  {
    categoria: "Porta",
    marcas: ["Duratex", "Eucatex"],
    variantes: [
      "Lisa Freijó 35mm", "Lisa Branca 35mm", "Almofadada Freijó", "Almofadada Branca",
      "Frisada Amadeirada", "Pivotante Preta", "De Correr Freijó", "Veneziana Branca",
      "Lambril Amadeirado", "Blindada Reforçada",
    ],
  },
  {
    categoria: "Janela / Esquadria",
    marcas: ["Sasazaki"],
    variantes: [
      "Linha Max Correr 2 Folhas", "Linha Max Correr 3 Folhas", "Basculante Branca", "Maxim-Ar Branca",
      "Fixa com Vidro Temperado", "Veneziana de Alumínio", "Correr 4 Folhas Anodizada", "Guilhotina Branca",
      "Pivotante Alumínio Preto", "Vitrô Basculante",
    ],
  },
  {
    categoria: "Box / Vidro",
    marcas: ["Blindex"],
    variantes: [
      "Box Frontal Incolor 8mm", "Box de Canto Incolor 8mm", "Box Frontal Fumê 8mm", "Box de Canto Fumê 8mm",
      "Espelho Bisotê 4mm", "Guarda-Corpo Incolor 10mm", "Divisória de Ambiente 10mm", "Box Angular Incolor 8mm",
      "Porta Pivotante de Vidro 10mm", "Box Frontal Verde 8mm",
    ],
  },
  {
    categoria: "Pintura",
    marcas: ["Suvinil", "Sherwin-Williams", "Coral"],
    variantes: [
      "Acrílico Fosco Branco Neve", "Acrílico Fosco Cinza Urbano", "Acrílico Acetinado Areia", "Látex Premium Off-White",
      "Esmalte Sintético Branco", "Textura Grafiato Bege", "Acrílico Fosco Grafite", "Látex Premium Azul Sereno",
      "Acrílico Semibrilho Branco Gelo", "Esmalte Fosco Preto",
    ],
  },
  {
    categoria: "Iluminação",
    marcas: ["Taschibra"],
    variantes: [
      "Spot LED Redondo 7W 3000K", "Spot LED Quadrado 7W 4000K", "Painel LED Embutir 24W", "Fita LED 5m 3000K",
      "Pendente Preto Fosco", "Arandela Branca Externa", "Luminária Trilho Preta", "Plafon LED Sobrepor 18W",
      "Spot Direcionável 5W", "Luminária Pendente Dourada",
    ],
  },
  {
    categoria: "Tomada e Interruptor",
    marcas: ["Tramontina"],
    variantes: [
      "Linha Liz Branca 10A", "Linha Liz Preta 10A", "Interruptor Simples Branco", "Interruptor Paralelo Branco",
      "Tomada Dupla 20A Branca", "Tomada USB Branca", "Linha Rebite Preta", "Módulo 4×2 Branco",
      "Interruptor Touch Preto", "Tomada RJ45 Branca",
    ],
  },
  {
    categoria: "Forro",
    marcas: ["Tigre", "Duratex", "Eucatex"],
    variantes: [
      "Forro PVC Branco Liso", "Forro PVC Branco Frisado", "Forro de Gesso Liso", "Forro Modular Mineral 60×60",
      "Forro PVC Amadeirado", "Sanca Aberta em Gesso", "Forro Drywall Standard", "Forro PVC Fresado",
      "Forro Acústico Mineral", "Forro de Gesso com Sanca",
    ],
  },
  {
    categoria: "Rodapé",
    marcas: ["Duratex", "Eucatex"],
    variantes: [
      "MDF Branco 7cm", "MDF Branco 10cm", "MDF Amadeirado 10cm", "MDF Amadeirado 15cm",
      "Poliestireno Branco 7cm", "Alumínio Escovado 5cm", "MDF Preto Fosco 7cm", "PVC Branco 10cm",
      "MDF Cinza Grafite 10cm", "Meia-Cana Branca 5cm",
    ],
  },
  {
    categoria: "Armário Planejado",
    marcas: ["Todeschini", "Bertolini"],
    variantes: [
      "Living Connect Carvalho", "Living Connect Branco", "Cozinha Compacta Branca", "Cozinha Compacta Preto Fosco",
      "Closet Modulado Off-White", "Home Office Compacto Carvalho", "Painel Ripado Amadeirado", "Cozinha Ilha Grafite",
      "Guarda-Roupa Casal Branco", "Bancada com Gavetas Carvalho",
    ],
  },
  {
    categoria: "Eletrodoméstico",
    marcas: ["Brastemp"],
    variantes: [
      "Cooktop 5 Bocas Inox", "Forno de Embutir 60L", "Coifa de Ilha Inox", "Coifa de Parede Inox",
      "Micro-ondas de Embutir", "Adega Climatizada 46 Garrafas", "Lava-Louças 14 Serviços", "Depurador de Ar Inox",
      "Cooktop de Indução 4 Zonas", "Forno e Micro-ondas Combinado",
    ],
  },
  {
    categoria: "Automação",
    marcas: ["Intelbras"],
    variantes: [
      "Kit Interruptor Inteligente Wi-Fi", "Fechadura Inteligente Wi-Fi", "Câmera Inteligente Interna", "Central de Automação Residencial",
      "Sensor de Presença Wi-Fi", "Tomada Inteligente Wi-Fi", "Cortina Motorizada Wi-Fi", "Campainha Inteligente com Vídeo",
      "Sensor de Abertura Wi-Fi", "Assistente de Automação por Voz",
    ],
  },
  {
    categoria: "Ar-condicionado",
    marcas: ["Springer"],
    variantes: [
      "Split Hi-Wall 9000 BTUs Inverter", "Split Hi-Wall 12000 BTUs Inverter", "Split Hi-Wall 18000 BTUs Inverter", "Split Hi-Wall 24000 BTUs Inverter",
      "Multi Split 2 Ambientes", "Cassete 36000 BTUs", "Portátil 10000 BTUs", "Janela 7500 BTUs",
      "Split Inverter Dual 12000 BTUs", "VRF Comercial Compacto",
    ],
  },
  {
    categoria: "Fechadura",
    marcas: ["Papaiz", "Fischer"],
    variantes: [
      "Fechadura Digital Biométrica", "Fechadura Digital com Senha", "Fechadura Tetra Cromada", "Fechadura Rolete Cromada",
      "Fechadura de Embutir Preta", "Dobradiça Reforçada Inox", "Fechadura Digital com App", "Trinco Multiponto",
      "Fechadura Tetra Preta Fosca", "Fechadura de Sobrepor Cromada",
    ],
  },
];

// Volume por categoria: 10 variantes × 3 voltas (a 2ª e 3ª volta ganham
// sufixo " 2"/" 3" pra não duplicar o nome) — 18 categorias × 30 = 540
// materiais por construtora, o mesmo catálogo pras 3 construtoras.
const MATERIAIS_POR_CATEGORIA = 30;

// Imagem por modelo (não por categoria) — cada variante de material tem
// sua própria foto na demo. Picsum com seed determinístico garante uma
// foto estável (nunca quebra) por nome de modelo, sem precisar curar 1620
// fotos reais (18 categorias × 30 × 3 construtoras) num seed de protótipo
// — não é foto real do produto.
const imagemDoModelo = (modelo: string): string => `https://picsum.photos/seed/${encodeURIComponent(modelo)}/200/150`;

function gerarMateriaisDaConstrutora(construtoraId: string): MaterialCatalogItem[] {
  const fornecedoresDaConstrutora = fornecedoresIniciais.filter((f) => f.construtoraId === construtoraId);
  const itens: MaterialCatalogItem[] = [];
  let seq = 0;
  for (const ref of REFERENCIA_MATERIAIS) {
    for (let i = 0; i < MATERIAIS_POR_CATEGORIA; i++) {
      const marca = ref.marcas[i % ref.marcas.length];
      const volta = Math.floor(i / ref.variantes.length);
      const variante = ref.variantes[i % ref.variantes.length];
      const modelo = volta > 0 ? `${variante} ${volta + 1}` : variante;
      const fornecedor = fornecedoresDaConstrutora[seq % fornecedoresDaConstrutora.length];
      seq += 1;
      const catAbrev = ref.categoria.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 3).toUpperCase();
      itens.push({
        id: `mc-${construtoraId}-${String(seq).padStart(4, "0")}`,
        construtoraId,
        categoriaId: categoriaId(construtoraId, ref.categoria),
        marcaId: marcaId(construtoraId, marca),
        fornecedorId: fornecedor.id,
        modelo,
        sku: `${marca.slice(0, 3).toUpperCase()}-${catAbrev}-${String(seq).padStart(4, "0")}`,
        imagemUrl: imagemDoModelo(modelo),
      });
    }
  }
  return itens;
}

export const materialCatalogInicial: MaterialCatalogItem[] = CONSTRUTORA_IDS.flatMap(gerarMateriaisDaConstrutora);

export const solicitacoesIniciais: Solicitacao[] = [
  {
    id: "SOL-001",
    vinculoId: "v-aurora-1204",
    construtoraId: "00001",
    itemId: "piso_sala",
    unidade: "Apto 1204", torre: "B", cliente: "Marina Alves",
    item: "Piso Sala", de: "Standard 60×60", para: "Portobello Premium 80×80", diferenca: 2500,
    status: "pendente", nivel: 1, data: "12/09/2026", abertoEm: "2026-09-12T09:14:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-001-t1", data: "2026-09-12T09:14:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de piso da sala para Portobello Premium 80×80.", tipo: "criacao" },
      { id: "SOL-001-t2", data: "2026-09-12T09:15:00-03:00", autor: "Sistema", papel: "Automático", texto: "Nível Simples — aguardando triagem inicial da construtora.", tipo: "info" },
    ],
  },
  {
    id: "SOL-002",
    vinculoId: "v-aurora-1204",
    construtoraId: "00001",
    itemId: "bancada",
    unidade: "Apto 1204", torre: "B", cliente: "Marina Alves",
    item: "Bancada Cozinha", de: "Granito Cinza Corumbá", para: "Quartzo Branco Ibiza", diferenca: 1700,
    status: "pendente", nivel: 1, data: "12/09/2026", abertoEm: "2026-09-12T09:22:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-002-t1", data: "2026-09-12T09:22:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de bancada da cozinha para Quartzo Branco Ibiza.", tipo: "criacao" },
      { id: "SOL-002-t2", data: "2026-09-12T09:23:00-03:00", autor: "Sistema", papel: "Automático", texto: "Nível Simples — aguardando triagem inicial da construtora.", tipo: "info" },
    ],
  },
  {
    id: "SOL-003",
    vinculoId: "v-outro-812-a",
    construtoraId: "00001",
    itemId: "eletrica_sala",
    unidade: "Apto 812", torre: "A", cliente: "Ricardo Nogueira",
    item: "Pontos Elétricos +12", de: "20 pontos", para: "32 pontos", diferenca: 1809.6,
    status: "em_analise", nivel: 2, data: "10/09/2026", abertoEm: "2026-09-10T14:32:00-03:00", responsavel: "Eng. Carlos Medeiros",
    timeline: [
      { id: "SOL-003-t1", data: "2026-09-10T14:32:00-03:00", autor: "Ricardo Nogueira", papel: "Cliente", texto: "Solicitação criada pelo cliente.", tipo: "criacao" },
      { id: "SOL-003-t2", data: "2026-09-10T16:10:00-03:00", autor: "Sistema", papel: "Automático", texto: "Roteada para engenharia (nível técnico detectado).", tipo: "roteamento" },
      { id: "SOL-003-t3", data: "2026-09-11T09:45:00-03:00", autor: "Eng. Carlos Medeiros", papel: "Responsável técnico", texto: "Assumiu a análise.", tipo: "assumido" },
    ],
  },
  {
    id: "SOL-004",
    vinculoId: "v-outro-305-a",
    construtoraId: "00002",
    itemId: "loucas",
    unidade: "Apto 305", torre: "A", cliente: "Fernanda Lima",
    item: "Louças e Metais", de: "Deca Aspen", para: "Docol Benefit Black", diferenca: 1300,
    status: "aprovado", nivel: 1, data: "08/09/2026", abertoEm: "2026-09-08T10:05:00-03:00", encerradoEm: "2026-09-08T15:40:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-004-t1", data: "2026-09-08T10:05:00-03:00", autor: "Fernanda Lima", papel: "Cliente", texto: "Solicitação criada: troca de louças e metais.", tipo: "criacao" },
      { id: "SOL-004-t2", data: "2026-09-08T15:40:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples, sem impacto estrutural.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-005",
    vinculoId: "v-outro-1104-b",
    construtoraId: "00001",
    itemId: "integracao",
    unidade: "Apto 1104", torre: "B", cliente: "Bruno Castro",
    item: "Integração Varanda", de: "Esquadria fechada", para: "Retrátil total", diferenca: 8500,
    status: "em_analise", nivel: 2, data: "05/09/2026", abertoEm: "2026-09-05T11:00:00-03:00", responsavel: "Arq. Lívia Duarte",
    timeline: [
      { id: "SOL-005-t1", data: "2026-09-05T11:00:00-03:00", autor: "Bruno Castro", papel: "Cliente", texto: "Solicitação criada: abertura total da varanda com esquadria retrátil.", tipo: "criacao" },
      { id: "SOL-005-t2", data: "2026-09-05T13:20:00-03:00", autor: "Sistema", papel: "Automático", texto: "Roteada para arquitetura (impacto na fachada).", tipo: "roteamento" },
      { id: "SOL-005-t3", data: "2026-09-06T08:15:00-03:00", autor: "Arq. Lívia Duarte", papel: "Responsável técnico", texto: "Assumiu a análise — verificando compatibilidade com o memorial de fachada.", tipo: "assumido" },
    ],
  },
  {
    id: "SOL-006",
    vinculoId: "v-outro-601-a",
    construtoraId: "00003",
    itemId: "viga_banheiro",
    unidade: "Apto 601", torre: "A", cliente: "Larissa Prado",
    item: "Remoção viga banheiro", de: "—", para: "Remoção solicitada", diferenca: null,
    status: "recusado", nivel: 3, data: "02/09/2026", abertoEm: "2026-09-02T16:00:00-03:00", encerradoEm: "2026-09-02T16:05:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-006-t1", data: "2026-09-02T16:00:00-03:00", autor: "Larissa Prado", papel: "Cliente", texto: "Solicitação criada: remoção de viga estrutural do banheiro.", tipo: "criacao" },
      { id: "SOL-006-t2", data: "2026-09-02T16:05:00-03:00", autor: "Sistema", papel: "Automático", texto: "Bloqueada automaticamente — elemento estrutural, alteração proibida por norma NBR 16280.", tipo: "recusa" },
    ],
  },
  {
    id: "SOL-007",
    vinculoId: "v-outro-903-b",
    construtoraId: "00002",
    itemId: "piso_varanda",
    unidade: "Apto 903", torre: "B", cliente: "André Souza",
    item: "Piso Varanda", de: "Externo Cinza", para: "Amadeirado Deck", diferenca: 1400,
    status: "aprovado", nivel: 1, data: "01/09/2026", abertoEm: "2026-09-01T09:00:00-03:00", encerradoEm: "2026-09-01T09:30:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-007-t1", data: "2026-09-01T09:00:00-03:00", autor: "André Souza", papel: "Cliente", texto: "Solicitação criada: troca de piso da varanda.", tipo: "criacao" },
      { id: "SOL-007-t2", data: "2026-09-01T09:30:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-008",
    vinculoId: "v-outro-1507-b",
    construtoraId: "00001",
    itemId: "hidraulica",
    unidade: "Apto 1507", torre: "B", cliente: "Camila Reis",
    item: "Pontos Hidráulicos +2", de: "3 pontos", para: "5 pontos", diferenca: 354,
    status: "pendente", nivel: 2, data: "14/09/2026", abertoEm: "2026-09-14T10:40:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-008-t1", data: "2026-09-14T10:40:00-03:00", autor: "Camila Reis", papel: "Cliente", texto: "Solicitação criada: 2 pontos hidráulicos extras na cozinha.", tipo: "criacao" },
      { id: "SOL-008-t2", data: "2026-09-14T10:41:00-03:00", autor: "Sistema", papel: "Automático", texto: "Nível Técnico — aguardando roteamento para engenharia.", tipo: "info" },
    ],
  },
  {
    id: "SOL-009",
    vinculoId: "v-outro-702-a",
    construtoraId: "00003",
    itemId: "revestimento",
    unidade: "Apto 702", torre: "A", cliente: "Thiago Martins",
    item: "Revestimento Banheiro", de: "Acetinado Bege", para: "Off-White Grande Formato", diferenca: 1200,
    status: "pendente", nivel: 1, data: "15/09/2026", abertoEm: "2026-09-15T08:50:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-009-t1", data: "2026-09-15T08:50:00-03:00", autor: "Thiago Martins", papel: "Cliente", texto: "Solicitação criada: troca de revestimento do banheiro.", tipo: "criacao" },
    ],
  },
  {
    id: "SOL-010",
    vinculoId: "v-outro-410-a",
    construtoraId: "00002",
    itemId: "cuba",
    unidade: "Apto 410", torre: "A", cliente: "Juliana Rocha",
    item: "Cuba Cozinha", de: "Cuba simples", para: "Cuba dupla + gourmet", diferenca: 850,
    status: "aprovado", nivel: 1, data: "03/09/2026", abertoEm: "2026-09-03T13:10:00-03:00", encerradoEm: "2026-09-03T13:40:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-010-t1", data: "2026-09-03T13:10:00-03:00", autor: "Juliana Rocha", papel: "Cliente", texto: "Solicitação criada: troca de cuba e torneira.", tipo: "criacao" },
      { id: "SOL-010-t2", data: "2026-09-03T13:40:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-011",
    vinculoId: "v-vistaverde-2201",
    construtoraId: "00002",
    itemId: "piso_sala",
    unidade: "Apto 2201", torre: "C", cliente: "Marina Alves",
    item: "Piso Sala", de: "Standard 60×60", para: "Marmorizado Extra", diferenca: 3800,
    status: "pendente", nivel: 1, data: "16/09/2026", abertoEm: "2026-09-16T18:05:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-011-t1", data: "2026-09-16T18:05:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de piso da sala para Marmorizado Extra.", tipo: "criacao" },
    ],
  },
  {
    id: "SOL-012",
    vinculoId: "v-vistaverde-2201",
    construtoraId: "00002",
    itemId: "bancada",
    unidade: "Apto 2201", torre: "C", cliente: "Marina Alves",
    item: "Bancada Cozinha", de: "Granito Cinza Corumbá", para: "Dekton Sirius", diferenca: 2900,
    status: "aprovado", nivel: 1, data: "09/09/2026", abertoEm: "2026-09-09T11:15:00-03:00", encerradoEm: "2026-09-09T16:00:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-012-t1", data: "2026-09-09T11:15:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de bancada da cozinha para Dekton Sirius.", tipo: "criacao" },
      { id: "SOL-012-t2", data: "2026-09-09T16:00:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-013",
    vinculoId: "v-boulevard-501",
    construtoraId: "00003",
    itemId: "revestimento",
    unidade: "Apto 501", torre: "A", cliente: "Marina Alves",
    item: "Revestimento Banheiro", de: "Acetinado Bege", para: "Off-White Grande Formato", diferenca: 1200,
    status: "aprovado", nivel: 1, data: "05/09/2026", abertoEm: "2026-09-05T10:20:00-03:00", encerradoEm: "2026-09-05T14:00:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-013-t1", data: "2026-09-05T10:20:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de revestimento do banheiro.", tipo: "criacao" },
      { id: "SOL-013-t2", data: "2026-09-05T14:00:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-014",
    vinculoId: "v-boulevard-501",
    construtoraId: "00003",
    itemId: "piso_varanda",
    unidade: "Apto 501", torre: "A", cliente: "Marina Alves",
    item: "Piso Varanda", de: "Externo Cinza", para: "Amadeirado Deck", diferenca: 1400,
    status: "aprovado", nivel: 1, data: "28/08/2026", abertoEm: "2026-08-28T09:00:00-03:00", encerradoEm: "2026-08-28T11:30:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-014-t1", data: "2026-08-28T09:00:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de piso da varanda.", tipo: "criacao" },
      { id: "SOL-014-t2", data: "2026-08-28T11:30:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-015",
    vinculoId: "v-boulevard-1502",
    construtoraId: "00003",
    itemId: "cuba",
    unidade: "Apto 1502", torre: "B", cliente: "Marina Alves",
    item: "Cuba Cozinha", de: "Cuba simples inox + monocomando", para: "Cuba dupla + torneira gourmet", diferenca: 850,
    status: "aprovado", nivel: 1, data: "02/09/2026", abertoEm: "2026-09-02T13:40:00-03:00", encerradoEm: "2026-09-02T15:10:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-015-t1", data: "2026-09-02T13:40:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de cuba e torneira.", tipo: "criacao" },
      { id: "SOL-015-t2", data: "2026-09-02T15:10:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-016",
    vinculoId: "v-boulevard-1502",
    construtoraId: "00003",
    itemId: "loucas",
    unidade: "Apto 1502", torre: "B", cliente: "Marina Alves",
    item: "Louças e Metais", de: "Deca Aspen + Deca Link", para: "Docol Benefit Black", diferenca: 1300,
    status: "pendente", nivel: 1, data: "17/09/2026", abertoEm: "2026-09-17T09:30:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-016-t1", data: "2026-09-17T09:30:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de louças e metais.", tipo: "criacao" },
    ],
  },
  {
    id: "SOL-017",
    vinculoId: "v-jardins-302",
    construtoraId: "00003",
    itemId: "piso_sala",
    unidade: "Apto 302", torre: "Única", cliente: "Marina Alves",
    item: "Piso Sala", de: "Standard 60×60", para: "Portobello Premium 80×80", diferenca: 2500,
    status: "aprovado", nivel: 1, data: "20/08/2026", abertoEm: "2026-08-20T10:00:00-03:00", encerradoEm: "2026-08-20T13:00:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-017-t1", data: "2026-08-20T10:00:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de piso da sala.", tipo: "criacao" },
      { id: "SOL-017-t2", data: "2026-08-20T13:00:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-018",
    vinculoId: "v-jardins-302",
    construtoraId: "00003",
    itemId: "bancada",
    unidade: "Apto 302", torre: "Única", cliente: "Marina Alves",
    item: "Bancada Cozinha", de: "Granito Cinza Corumbá", para: "Quartzo Branco Ibiza", diferenca: 1700,
    status: "aprovado", nivel: 1, data: "15/08/2026", abertoEm: "2026-08-15T15:20:00-03:00", encerradoEm: "2026-08-15T17:00:00-03:00", responsavel: null,
    timeline: [
      { id: "SOL-018-t1", data: "2026-08-15T15:20:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: troca de bancada da cozinha.", tipo: "criacao" },
      { id: "SOL-018-t2", data: "2026-08-15T17:00:00-03:00", autor: "Sistema", papel: "Automático", texto: "Aprovada automaticamente — item de nível Simples.", tipo: "aprovacao" },
    ],
  },
  {
    id: "SOL-019",
    vinculoId: "v-aurora-1204",
    construtoraId: "00001",
    itemId: "eletrica_sala",
    unidade: "Apto 1204", torre: "B", cliente: "Marina Alves",
    item: "Pontos Elétricos +4", de: "8 pontos", para: "12 pontos (+4)", diferenca: 603.2,
    status: "aprovado", nivel: 2, data: "11/09/2026", abertoEm: "2026-09-11T10:00:00-03:00", encerradoEm: "2026-09-12T09:00:00-03:00", responsavel: "Eng. Carlos Medeiros",
    timeline: [
      { id: "SOL-019-t1", data: "2026-09-11T10:00:00-03:00", autor: "Marina Alves", papel: "Cliente", texto: "Solicitação criada: 4 pontos elétricos extras na sala.", tipo: "criacao" },
      { id: "SOL-019-t2", data: "2026-09-11T10:05:00-03:00", autor: "Sistema", papel: "Automático", texto: "Roteada para engenharia (nível técnico detectado).", tipo: "roteamento" },
      { id: "SOL-019-t3", data: "2026-09-11T15:30:00-03:00", autor: "Eng. Carlos Medeiros", papel: "Responsável técnico", texto: "Quadro elétrico suporta adição de 4 pontos sem troca de disjuntor geral. Execução conforme projeto complementar.", tipo: "parecer" },
      { id: "SOL-019-t4", data: "2026-09-12T09:00:00-03:00", autor: "Eng. Carlos Medeiros", papel: "Responsável técnico", texto: "Solicitação aprovada com assinatura digital.", tipo: "aprovacao" },
    ],
  },
];

export const dashboardData: DashboardData = {
  unidadesTotal: 300,
  unidadesPersonalizando: 121,
  receitaUpgrade: 612000,
  ticketMedioUpgrade: 5060,
  taxaAdesao: 0.403,
  tempoMedioAprovacao: 1.8,
  solicitacoesMes: 187,
  creditoGerado: 284000,
  creditoUtilizado: 198000,
  topUpgrades: [
    { nome: "Porcelanato Premium", pct: 0.62, receita: 186000 },
    { nome: "Bancada Quartzo/Dekton", pct: 0.48, receita: 142000 },
    { nome: "Metais Black/Gold", pct: 0.31, receita: 98000 },
    { nome: "Integração Varanda", pct: 0.22, receita: 89000 },
    { nome: "Pontos Elétricos Extra", pct: 0.18, receita: 54000 },
    { nome: "Automação/Iluminação", pct: 0.12, receita: 43000 },
  ],
  porMes: [
    { mes: "Abr", valor: 78000, sol: 28 },
    { mes: "Mai", valor: 95000, sol: 32 },
    { mes: "Jun", valor: 121000, sol: 38 },
    { mes: "Jul", valor: 108000, sol: 29 },
    { mes: "Ago", valor: 134000, sol: 35 },
    { mes: "Set", valor: 76000, sol: 25 },
  ],
  porNivel: { simples: 142, tecnico: 38, proibido: 7 },
};

// Ledger lançamentos that seed the cart/ledger screen — mirrors the
// hard-coded selections in the original Plantta-Carrinho.dc.html.
export const selecoesIniciais = [
  { id: "sel-1", item: "Piso", ambiente: "Sala", de: "Standard 60×60", para: "Portobello Premium 80×80", nivel: 1 as const, credito: 6000, custo: 8500 },
  { id: "sel-2", item: "Bancada", ambiente: "Cozinha", de: "Granito Cinza Corumbá", para: "Quartzo Branco Ibiza", nivel: 1 as const, credito: 3200, custo: 4900 },
  { id: "sel-3", item: "Louças e Metais", ambiente: "Banheiro", de: "Deca Aspen + Deca Link", para: "Docol Benefit Black", nivel: 1 as const, credito: 2100, custo: 3400 },
  { id: "sel-4", item: "Piso Varanda", ambiente: "Varanda", de: "Externo Cinza", para: "Removido (crédito)", nivel: 1 as const, credito: 3800, custo: 0 },
  { id: "sel-5", item: "Pontos Elétricos", ambiente: "Sala", de: "8 pontos", para: "14 pontos (+6)", nivel: 2 as const, credito: 0, custo: 904.8 },
];

export const ledgerInicial = [
  { id: "l1", data: "12/09 09:14", descricao: "Crédito: Piso Sala (padrão)", valor: 6000, tipo: "credito" as const },
  { id: "l2", data: "12/09 09:14", descricao: "Upgrade: Portobello Premium", valor: -8500, tipo: "debito" as const },
  { id: "l3", data: "12/09 09:22", descricao: "Crédito: Bancada (padrão)", valor: 3200, tipo: "credito" as const },
  { id: "l4", data: "12/09 09:22", descricao: "Upgrade: Quartzo Branco Ibiza", valor: -4900, tipo: "debito" as const },
  { id: "l5", data: "12/09 09:30", descricao: "Crédito: Louças (padrão)", valor: 2100, tipo: "credito" as const },
  { id: "l6", data: "12/09 09:30", descricao: "Upgrade: Docol Benefit Black", valor: -3400, tipo: "debito" as const },
  { id: "l7", data: "13/09 14:05", descricao: "Remoção: Piso Varanda (crédito)", valor: 3800, tipo: "credito" as const },
  { id: "l8", data: "13/09 15:20", descricao: "Pontos elétricos: 6 extras × R$ 150,80", valor: -904.8, tipo: "debito" as const },
];
