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
  Vinculo,
} from "../domain/types";
import { plantaKey } from "../domain/calculations";
import { CATEGORIAS_MATERIAL, MARCAS_SUGERIDAS } from "../domain/catalogoReferencia";
import { parseDxfAmbientes } from "../lib/dxfPlanta";
import dxfSala from "../assets/plantas-dxf/sala.dxf?raw";
import dxfCozinha from "../assets/plantas-dxf/cozinha.dxf?raw";
import dxfBanheiro from "../assets/plantas-dxf/banheiro.dxf?raw";
import dxfVaranda from "../assets/plantas-dxf/varanda.dxf?raw";

// Geometria 3D real da Planta A de Residencial Aurora, gerada a partir dos
// DXFs de exemplo em src/assets/plantas-dxf/ (padrão ARQ-AMB/ARQ-AMB-TXT —
// ver docs/padrao-plantas-dxf.md e lib/dxfPlanta.ts). Isso roda o parser de
// verdade no carregamento do app, não são coordenadas digitadas à mão —
// prova a esteira DXF → geometria 3D de ponta a ponta com os 4 ambientes
// que a Planta A já tem (sala, cozinha, banheiro, varanda).
const geometriaPlantaAAurora: PlantaGeometria3D = {
  peDireitoM: 2.6,
  ambientes: [
    ...parseDxfAmbientes(dxfSala, "m"),
    ...parseDxfAmbientes(dxfCozinha, "m"),
    ...parseDxfAmbientes(dxfBanheiro, "m"),
    ...parseDxfAmbientes(dxfVaranda, "m"),
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
  color: "#fd3541",
  logo: "https://alliance.com.br/wp-content/uploads/2026/01/logo-alliance-ok.png",
};

// plantta's own brand — used everywhere the client portal is NOT
// white-labeled: the default client login/portal and the whole
// construtora back-office.
export const planttaBrand: Brand = {
  nome: "plantta",
  color: "#2e9e68",
  logo: null,
};

export const empreendimento: Empreendimento = {
  nome: "Residencial Aurora",
  construtora: "Prado Engenharia",
  unidade: "Apto 1204",
  torre: "Torre B",
  comprador: "Marina Alves",
  cpf: "•••.•••.•••-89",
  totalUnidades: 300,
  valorImovel: 850000,
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
  construtora: "Alliance",
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
    construtoraNome: "Prado Engenharia",
    empreendimentoId: "00001",
    empreendimentoNome: "Residencial Aurora",
    plantaId: "planta-a",
    plantaNome: "Planta A — 2 quartos",
    unidadeLabel: "Apto 1204",
    torre: "B",
    brand: null,
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
  "00002": [{ id: "planta-unica", codigo: "PU-01", nome: "Planta Única", tipologia: "2 quartos", descricao: "2 dormitórios, 1 suíte", areaPrivativaM2: 62, areaTotalM2: 70, quartos: 2, suites: 1, banheiros: 2, vagas: 1, numeroAmbientes: 6, versao: "1.0", dataVersao: "05/02/2026", status: "ativa", opcoesPermitidas: "Piso, revestimento, metais, louças", restricoes: "Sem alteração de estrutura", unidadesLabel: "Todas as unidades", arquivos: ARQUIVOS_PLANTA_VAZIOS }],
  "00003": [{ id: "planta-unica", codigo: "PU-01", nome: "Planta Única", tipologia: "2 quartos", descricao: "2 dormitórios, 1 suíte", areaPrivativaM2: 75, areaTotalM2: 85, quartos: 2, suites: 1, banheiros: 2, vagas: 2, numeroAmbientes: 6, versao: "1.0", dataVersao: "12/03/2026", status: "ativa", opcoesPermitidas: "Piso, revestimento, metais, louças, bancadas", restricoes: "Sem alteração de estrutura", unidadesLabel: "Torres A e B, todos os andares", arquivos: ARQUIVOS_PLANTA_VAZIOS }],
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
    sala: { piso_sala: { p2: "mc-009" } },
    cozinha: { bancada: { b3: "mc-010" } }, // b3 = "Dekton Sirius", mc-010 é Dekton Sirius
    banheiro: { piso_banheiro: { psb2: "mc-009" } },
  }),
  [plantaKey("00003", "planta-unica")]: vincularMateriais(clonar(ambientes), {
    sala: { piso_sala: { p2: "mc-005" } },
    cozinha: { bancada: { b2: "mc-007" } }, // b2 = "Quartzo Branco Ibiza", mc-007 é Silestone Branco Ibiza
    banheiro: { piso_banheiro: { psb2: "mc-005" }, revestimento: { rv2: "mc-006" } },
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
];

const ARQUIVOS_PESSOA_VAZIOS: Pessoa["arquivos"] = {
  documentoProfissional: [], carteiraRegistro: [], certificados: [], artRrt: [], contratos: [], projetosDocumentosTecnicos: [],
};

// Pessoa/Papel — cadastro único pra qualquer humano com quem a construtora
// lida (arquiteto/engenheiro/técnico/cliente...), não cadastros paralelos
// por tipo (ver domain/types.ts Pessoa).
export const pessoasIniciais: Pessoa[] = [
  { id: "pessoa-001", construtoraId: "00001", papeis: ["Arquiteto", "Responsável pela construtora"], nome: "Fernanda Ribeiro", cpf: "111.222.333-44", email: "fernanda.ribeiro@arquitetura.com.br", telefone: "(11) 3222-1000", empresa: "Ribeiro Arquitetura", cargoEspecialidade: "Arquiteta responsável", conselho: "CAU", numeroRegistro: "A123456-7", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "E-mail", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-002", construtoraId: "00001", papeis: ["Engenheiro"], nome: "Carlos Eduardo Matos", cpf: "222.333.444-55", email: "carlos.matos@engenharia.com.br", telefone: "(11) 3222-2000", empresa: "Prado Engenharia", cargoEspecialidade: "Engenheiro civil — gerente de obra", conselho: "CREA", numeroRegistro: "5401234", ufRegistro: "SP", statusRegistro: "Ativo", endereco: "", estadoCivil: "", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
  { id: "pessoa-003", construtoraId: "00003", papeis: ["Cliente"], nome: "Marina Alves", cpf: "333.444.555-66", email: "marina.alves@email.com", telefone: "(11) 98765-4321", empresa: "", cargoEspecialidade: "", conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo", endereco: "Alameda Santos, 800, São Paulo/SP", estadoCivil: "Casada", canalContatoPreferencial: "WhatsApp", observacoes: "", arquivos: ARQUIVOS_PESSOA_VAZIOS },
];

// Biblioteca de materiais reutilizável por construtora — identidade do
// produto (categoria/marca/modelo/SKU), sem preço/prazo: isso é resolvido
// por item quando o material é anexado a uma opção (Opcao.preco/
// custoConstrutora), já que preço varia por negociação e por item.
export const materialCatalogInicial: MaterialCatalogItem[] = [
  {
    id: "mc-001",
    construtoraId: "00001",
    categoriaId: categoriaId("00001", "Piso"),
    marcaId: marcaId("00001", "Portobello"),
    fornecedorId: "forn-001",
    modelo: "Premium 80×80",
    sku: "PTB-PREM-8080",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzlhOWM5NCIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M5Y2JjMyIvPjxyZWN0IHg9IjY2IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjM2M1YmQiLz48cmVjdCB4PSIxMzAiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2NkY2ZjNyIvPjxyZWN0IHg9IjE5NCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iMiIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2RjZmM3Ii8+PHJlY3QgeD0iMTMwIiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iMTk0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjZGNmYzciLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjNmM4YzAiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjIiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iNjYiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMTMwIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjE5NCIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjZGNmYzciLz48L3N2Zz4=",
    roughness: 0.55,
    metalness: 0.02,
  },
  {
    id: "mc-002",
    construtoraId: "00001",
    categoriaId: categoriaId("00001", "Bancada"),
    marcaId: marcaId("00001", "Dekton"),
    fornecedorId: "forn-002",
    modelo: "Sirius",
    sku: "DKT-SIRIUS",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2U0ZTNkZSIvPjxjaXJjbGUgY3g9IjE4MS40IiBjeT0iMzIuNCIgcj0iNS4xIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDMuOCIgY3k9Ijg1LjkiIHI9IjYuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTg4LjYiIGN5PSIxNTQuMSIgcj0iMi4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNS40IiBjeT0iMTA0LjkiIHI9IjguMCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTIwLjYiIGN5PSIxODUuNyIgcj0iNS41IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMTguOSIgY3k9IjI3LjMiIHI9IjIuMiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTkxLjkiIGN5PSIwLjYiIHI9IjcuOSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNTkuNSIgY3k9IjE4Mi45IiByPSI3LjciIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEyOS45IiBjeT0iNzYuMyIgcj0iMi40IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMjkuNSIgY3k9IjM4LjMiIHI9IjMuMCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjAyLjMiIGN5PSIyMTQuNSIgcj0iNS4zIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNTkuMyIgY3k9Ijc3LjkiIHI9IjQuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iOTQuOCIgY3k9IjUyLjEiIHI9IjcuMiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzcuMSIgY3k9IjE2My45IiByPSIyLjkiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjIzNC45IiBjeT0iMTA0LjciIHI9IjcuNSIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjIuOCIgY3k9IjI1LjgiIHI9IjQuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTY2LjIiIGN5PSIxMzguNCIgcj0iNS40IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI5My41IiBjeT0iMTkwLjEiIHI9IjYuNiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzkuNyIgY3k9IjY1LjYiIHI9IjYuNCIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTExLjgiIGN5PSIxMjguMyIgcj0iNS4xIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNjIuMyIgY3k9IjExMy4zIiByPSI1LjUiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE5LjUiIGN5PSIyNTAuMCIgcj0iNC4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxODcuNSIgY3k9IjU5LjkiIHI9IjMuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTI2LjIiIGN5PSIxNzcuNCIgcj0iNi4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDQuMCIgY3k9IjIzMS4xIiByPSI3LjciIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEzNy4xIiBjeT0iNDYuMCIgcj0iMi4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxOTcuMyIgY3k9IjE0Ny45IiByPSIzLjAiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjI5LjYiIGN5PSI4NS4xIiByPSI3LjAiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjExLjciIGN5PSIxMTYuMCIgcj0iNC45IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNC4yIiBjeT0iMjcuMCIgcj0iNi4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI1OS42IiBjeT0iNjYuNyIgcj0iNC41IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDcuMiIgY3k9IjM5LjIiIHI9IjQuNSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTMuOSIgY3k9IjQ0LjMiIHI9IjMuMSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTY2LjkiIGN5PSI4OC40IiByPSI2LjYiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE5LjkiIGN5PSIxMzQuNyIgcj0iNS4xIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMTAuNCIgY3k9IjI0NC4wIiByPSI1LjIiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjI1NS4zIiBjeT0iMTIzLjEiIHI9IjMuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTU2LjYiIGN5PSIxODAuOSIgcj0iNC4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNTcuOSIgY3k9IjE3NC43IiByPSIzLjUiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEzNC4xIiBjeT0iMjQxLjIiIHI9IjIuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNzMuNiIgY3k9IjE3Ny42IiByPSI3LjQiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjIzNC4xIiBjeT0iOTQuMiIgcj0iNC42IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI5NC4zIiBjeT0iNDcuMSIgcj0iNS41IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMDAuMiIgY3k9IjE0Mi43IiByPSI1LjIiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjY5LjUiIGN5PSI3MS4xIiByPSI1LjkiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE0LjMiIGN5PSI5LjMiIHI9IjcuNiIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNzAuMyIgY3k9IjEwNi4zIiByPSI1LjAiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjM2LjUiIGN5PSI2Ny41IiByPSI3LjkiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE0MC4xIiBjeT0iNTkuMSIgcj0iMy4zIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxOTMuNiIgY3k9Ijk0LjYiIHI9IjMuNCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTU5LjYiIGN5PSIwLjYiIHI9IjcuMyIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzYuMCIgY3k9IjIzNi4zIiByPSIyLjUiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjUwLjkiIGN5PSI4Ni40IiByPSI1LjYiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjU4LjUiIGN5PSI3LjEiIHI9IjUuOSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzkuNyIgY3k9IjQxLjgiIHI9IjQuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNTguOCIgY3k9IjgwLjgiIHI9IjYuNCIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNDIuNyIgY3k9IjIwOS4wIiByPSI0LjYiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjgwLjAiIGN5PSIxNTIuNyIgcj0iNi45IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNy4yIiBjeT0iMTIxLjIiIHI9IjcuOCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjE2LjEiIGN5PSIxMzUuNyIgcj0iMi45IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=",
    roughness: 0.25,
    metalness: 0.08,
  },
  // Materiais dos itens PADRÃO (não só das opções de troca) — sem isso, o
  // ambiente não tem nenhuma foto até o cliente trocar algo, e o
  // configurador 3D nunca aparece pra mostrar "como já está" antes da
  // troca (ver docs/padrao-plantas-dxf.md — a ideia é visualizar de+para).
  {
    id: "mc-013",
    construtoraId: "00001",
    categoriaId: categoriaId("00001", "Piso"),
    marcaId: marcaId("00001", "Portinari"),
    fornecedorId: "forn-001",
    modelo: "Standard 60×60",
    sku: "PTN-STD-6060",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2M5YWI3YyIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2Q5YzE5YSIvPjxyZWN0IHg9IjY2IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjOWFiN2MiLz48cmVjdCB4PSIxMzAiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2Q5YzE5YSIvPjxyZWN0IHg9IjE5NCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzlhYjdjIi8+PHJlY3QgeD0iMiIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M5YWI3YyIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZDljMTlhIi8+PHJlY3QgeD0iMTMwIiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzlhYjdjIi8+PHJlY3QgeD0iMTk0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZDljMTlhIi8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNkOWMxOWEiLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjOWFiN2MiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZDljMTlhIi8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M5YWI3YyIvPjxyZWN0IHg9IjIiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzlhYjdjIi8+PHJlY3QgeD0iNjYiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZDljMTlhIi8+PHJlY3QgeD0iMTMwIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M5YWI3YyIvPjxyZWN0IHg9IjE5NCIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNkOWMxOWEiLz48L3N2Zz4=",
    roughness: 0.6,
    metalness: 0,
  },
  {
    id: "mc-014",
    construtoraId: "00001",
    categoriaId: categoriaId("00001", "Bancada"),
    marcaId: marcaId("00001", "Incepa"),
    fornecedorId: "forn-001",
    modelo: "Granito Cinza Corumbá",
    sku: "GRN-CORUMBA",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzU3NWY2NCIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzZiNzM3OCIvPjxyZWN0IHg9IjY2IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM1NzVmNjQiLz48cmVjdCB4PSIxMzAiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzZiNzM3OCIvPjxyZWN0IHg9IjE5NCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNTc1ZjY0Ii8+PHJlY3QgeD0iMiIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzU3NWY2NCIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNmI3Mzc4Ii8+PHJlY3QgeD0iMTMwIiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNTc1ZjY0Ii8+PHJlY3QgeD0iMTk0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNmI3Mzc4Ii8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM2YjczNzgiLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM1NzVmNjQiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNmI3Mzc4Ii8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzU3NWY2NCIvPjxyZWN0IHg9IjIiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNTc1ZjY0Ii8+PHJlY3QgeD0iNjYiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNmI3Mzc4Ii8+PHJlY3QgeD0iMTMwIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzU3NWY2NCIvPjxyZWN0IHg9IjE5NCIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM2YjczNzgiLz48L3N2Zz4=",
    roughness: 0.35,
    metalness: 0.05,
  },
  {
    id: "mc-015",
    construtoraId: "00001",
    categoriaId: categoriaId("00001", "Piso"),
    marcaId: marcaId("00001", "Celite"),
    fornecedorId: "forn-001",
    modelo: "Antiderrapante Bege",
    sku: "CLT-ANTID-BEGE",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2IzOWM3NiIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M3YjI4ZiIvPjxyZWN0IHg9IjY2IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNiMzljNzYiLz48cmVjdCB4PSIxMzAiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M3YjI4ZiIvPjxyZWN0IHg9IjE5NCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYjM5Yzc2Ii8+PHJlY3QgeD0iMiIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2IzOWM3NiIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzdiMjhmIi8+PHJlY3QgeD0iMTMwIiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYjM5Yzc2Ii8+PHJlY3QgeD0iMTk0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzdiMjhmIi8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjN2IyOGYiLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNiMzljNzYiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzdiMjhmIi8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2IzOWM3NiIvPjxyZWN0IHg9IjIiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYjM5Yzc2Ii8+PHJlY3QgeD0iNjYiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzdiMjhmIi8+PHJlY3QgeD0iMTMwIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2IzOWM3NiIvPjxyZWN0IHg9IjE5NCIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjN2IyOGYiLz48L3N2Zz4=",
    roughness: 0.6,
    metalness: 0,
  },
  { id: "mc-003", construtoraId: "00001", categoriaId: categoriaId("00001", "Louças e Metais"), marcaId: marcaId("00001", "Docol"), fornecedorId: "forn-003", modelo: "Benefit Black", sku: "DOC-BEN-BLK", imagemUrl: null },
  { id: "mc-004", construtoraId: "00001", categoriaId: categoriaId("00001", "Cuba"), marcaId: marcaId("00001", "Tramontina"), fornecedorId: "forn-004", modelo: "Morgana Dupla + Gourmet", sku: "TRAM-MORG-DP", imagemUrl: null },
  {
    id: "mc-011",
    construtoraId: "00001",
    categoriaId: categoriaId("00001", "Piso"),
    marcaId: marcaId("00001", "Eliane"),
    fornecedorId: "forn-001",
    modelo: "Antiderrapante Areia",
    sku: "ELI-ANTID-AREIA",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2EzOTA2ZCIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2NiYjg5NiIvPjxyZWN0IHg9IjY2IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNkMWJmYTAiLz48cmVjdCB4PSIxMzAiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M2YjI4YyIvPjxyZWN0IHg9IjE5NCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2ZiYzk4Ii8+PHJlY3QgeD0iMiIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2QxYmZhMCIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZiMjhjIi8+PHJlY3QgeD0iMTMwIiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2ZiYzk4Ii8+PHJlY3QgeD0iMTk0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2JiODk2Ii8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjNmIyOGMiLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjZmJjOTgiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2JiODk2Ii8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2QxYmZhMCIvPjxyZWN0IHg9IjIiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2ZiYzk4Ii8+PHJlY3QgeD0iNjYiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2JiODk2Ii8+PHJlY3QgeD0iMTMwIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2QxYmZhMCIvPjxyZWN0IHg9IjE5NCIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjNmIyOGMiLz48L3N2Zz4=",
    roughness: 0.6,
    metalness: 0,
  },
  {
    id: "mc-012",
    construtoraId: "00001",
    categoriaId: categoriaId("00001", "Revestimento"),
    marcaId: marcaId("00001", "Portobello"),
    fornecedorId: "forn-001",
    modelo: "Off-White Grande Formato",
    sku: "PTB-OFFW-GF",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Q4ZDVjYiIvPjxyZWN0IHg9Ii02MiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iNjYiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjEzMCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMTk0IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyNTgiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9Ii0zMCIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjM0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iOTgiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIxNjIiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyMjYiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyOTAiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSItNjIiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjI1OCIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSItMzAiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMzQiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iOTgiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMTYyIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjIyNiIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyOTAiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PC9zdmc+",
    roughness: 0.3,
    metalness: 0.05,
  },
  {
    id: "mc-005",
    construtoraId: "00003",
    categoriaId: categoriaId("00003", "Piso"),
    marcaId: marcaId("00003", "Portobello"),
    fornecedorId: "forn-005",
    modelo: "Marmorizado Extra",
    sku: "PTB-MARM-EX",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzlhOWM5NCIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M5Y2JjMyIvPjxyZWN0IHg9IjY2IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjM2M1YmQiLz48cmVjdCB4PSIxMzAiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2NkY2ZjNyIvPjxyZWN0IHg9IjE5NCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iMiIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2RjZmM3Ii8+PHJlY3QgeD0iMTMwIiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iMTk0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjZGNmYzciLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjNmM4YzAiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjIiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iNjYiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMTMwIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjE5NCIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjZGNmYzciLz48L3N2Zz4=",
    roughness: 0.55,
    metalness: 0.02,
  },
  {
    id: "mc-006",
    construtoraId: "00003",
    categoriaId: categoriaId("00003", "Revestimento"),
    marcaId: marcaId("00003", "Portobello"),
    fornecedorId: "forn-005",
    modelo: "Off-White Grande Formato",
    sku: "PTB-OFFW-GF",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Q4ZDVjYiIvPjxyZWN0IHg9Ii02MiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iNjYiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjEzMCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMTk0IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyNTgiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9Ii0zMCIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjM0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iOTgiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIxNjIiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyMjYiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyOTAiIHk9IjY2IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSItNjIiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjI1OCIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSItMzAiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMzQiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iOTgiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PHJlY3QgeD0iMTYyIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2YyZjBlYSIvPjxyZWN0IHg9IjIyNiIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMmYwZWEiLz48cmVjdCB4PSIyOTAiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjJmMGVhIi8+PC9zdmc+",
    roughness: 0.3,
    metalness: 0.05,
  },
  {
    id: "mc-007",
    construtoraId: "00003",
    categoriaId: categoriaId("00003", "Bancada"),
    marcaId: marcaId("00003", "Silestone"),
    fornecedorId: "forn-006",
    modelo: "Branco Ibiza",
    sku: "QRTZ-IBIZA",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2U0ZTNkZSIvPjxjaXJjbGUgY3g9IjE4MS40IiBjeT0iMzIuNCIgcj0iNS4xIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDMuOCIgY3k9Ijg1LjkiIHI9IjYuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTg4LjYiIGN5PSIxNTQuMSIgcj0iMi4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNS40IiBjeT0iMTA0LjkiIHI9IjguMCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTIwLjYiIGN5PSIxODUuNyIgcj0iNS41IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMTguOSIgY3k9IjI3LjMiIHI9IjIuMiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTkxLjkiIGN5PSIwLjYiIHI9IjcuOSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNTkuNSIgY3k9IjE4Mi45IiByPSI3LjciIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEyOS45IiBjeT0iNzYuMyIgcj0iMi40IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMjkuNSIgY3k9IjM4LjMiIHI9IjMuMCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjAyLjMiIGN5PSIyMTQuNSIgcj0iNS4zIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNTkuMyIgY3k9Ijc3LjkiIHI9IjQuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iOTQuOCIgY3k9IjUyLjEiIHI9IjcuMiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzcuMSIgY3k9IjE2My45IiByPSIyLjkiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjIzNC45IiBjeT0iMTA0LjciIHI9IjcuNSIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjIuOCIgY3k9IjI1LjgiIHI9IjQuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTY2LjIiIGN5PSIxMzguNCIgcj0iNS40IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI5My41IiBjeT0iMTkwLjEiIHI9IjYuNiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzkuNyIgY3k9IjY1LjYiIHI9IjYuNCIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTExLjgiIGN5PSIxMjguMyIgcj0iNS4xIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNjIuMyIgY3k9IjExMy4zIiByPSI1LjUiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE5LjUiIGN5PSIyNTAuMCIgcj0iNC4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxODcuNSIgY3k9IjU5LjkiIHI9IjMuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTI2LjIiIGN5PSIxNzcuNCIgcj0iNi4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDQuMCIgY3k9IjIzMS4xIiByPSI3LjciIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEzNy4xIiBjeT0iNDYuMCIgcj0iMi4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxOTcuMyIgY3k9IjE0Ny45IiByPSIzLjAiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjI5LjYiIGN5PSI4NS4xIiByPSI3LjAiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjExLjciIGN5PSIxMTYuMCIgcj0iNC45IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNC4yIiBjeT0iMjcuMCIgcj0iNi4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI1OS42IiBjeT0iNjYuNyIgcj0iNC41IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDcuMiIgY3k9IjM5LjIiIHI9IjQuNSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTMuOSIgY3k9IjQ0LjMiIHI9IjMuMSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTY2LjkiIGN5PSI4OC40IiByPSI2LjYiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE5LjkiIGN5PSIxMzQuNyIgcj0iNS4xIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMTAuNCIgY3k9IjI0NC4wIiByPSI1LjIiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjI1NS4zIiBjeT0iMTIzLjEiIHI9IjMuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTU2LjYiIGN5PSIxODAuOSIgcj0iNC4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNTcuOSIgY3k9IjE3NC43IiByPSIzLjUiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEzNC4xIiBjeT0iMjQxLjIiIHI9IjIuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNzMuNiIgY3k9IjE3Ny42IiByPSI3LjQiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjIzNC4xIiBjeT0iOTQuMiIgcj0iNC42IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI5NC4zIiBjeT0iNDcuMSIgcj0iNS41IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMDAuMiIgY3k9IjE0Mi43IiByPSI1LjIiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjY5LjUiIGN5PSI3MS4xIiByPSI1LjkiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE0LjMiIGN5PSI5LjMiIHI9IjcuNiIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNzAuMyIgY3k9IjEwNi4zIiByPSI1LjAiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjM2LjUiIGN5PSI2Ny41IiByPSI3LjkiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE0MC4xIiBjeT0iNTkuMSIgcj0iMy4zIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxOTMuNiIgY3k9Ijk0LjYiIHI9IjMuNCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTU5LjYiIGN5PSIwLjYiIHI9IjcuMyIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzYuMCIgY3k9IjIzNi4zIiByPSIyLjUiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjUwLjkiIGN5PSI4Ni40IiByPSI1LjYiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjU4LjUiIGN5PSI3LjEiIHI9IjUuOSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzkuNyIgY3k9IjQxLjgiIHI9IjQuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNTguOCIgY3k9IjgwLjgiIHI9IjYuNCIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNDIuNyIgY3k9IjIwOS4wIiByPSI0LjYiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjgwLjAiIGN5PSIxNTIuNyIgcj0iNi45IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNy4yIiBjeT0iMTIxLjIiIHI9IjcuOCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjE2LjEiIGN5PSIxMzUuNyIgcj0iMi45IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=",
    roughness: 0.22,
    metalness: 0.05,
  },
  { id: "mc-008", construtoraId: "00003", categoriaId: categoriaId("00003", "Louças e Metais"), marcaId: marcaId("00003", "Docol"), fornecedorId: "forn-005", modelo: "Benefit Black", sku: "DOC-BEN-BLK", imagemUrl: null },
  {
    id: "mc-009",
    construtoraId: "00002",
    categoriaId: categoriaId("00002", "Piso"),
    marcaId: marcaId("00002", "Portobello"),
    fornecedorId: "forn-007",
    modelo: "Marmorizado Extra",
    sku: "PTB-MARM-EX",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzlhOWM5NCIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2M5Y2JjMyIvPjxyZWN0IHg9IjY2IiB5PSIyIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjM2M1YmQiLz48cmVjdCB4PSIxMzAiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2NkY2ZjNyIvPjxyZWN0IHg9IjE5NCIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iMiIgeT0iNjYiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjY2RjZmM3Ii8+PHJlY3QgeD0iMTMwIiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iMTk0IiB5PSI2NiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjZGNmYzciLz48cmVjdCB4PSI2NiIgeT0iMTMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjNmM4YzAiLz48cmVjdCB4PSIxMzAiIHk9IjEzMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMTk0IiB5PSIxMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjIiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzZjOGMwIi8+PHJlY3QgeD0iNjYiIHk9IjE5NCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjYzljYmMzIi8+PHJlY3QgeD0iMTMwIiB5PSIxOTQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2MzYzViZCIvPjxyZWN0IHg9IjE5NCIgeT0iMTk0IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNjZGNmYzciLz48L3N2Zz4=",
    roughness: 0.55,
    metalness: 0.02,
  },
  {
    id: "mc-010",
    construtoraId: "00002",
    categoriaId: categoriaId("00002", "Bancada"),
    marcaId: marcaId("00002", "Dekton"),
    fornecedorId: "forn-007",
    modelo: "Sirius",
    sku: "DKT-SIRIUS",
    imagemUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2U0ZTNkZSIvPjxjaXJjbGUgY3g9IjE4MS40IiBjeT0iMzIuNCIgcj0iNS4xIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDMuOCIgY3k9Ijg1LjkiIHI9IjYuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTg4LjYiIGN5PSIxNTQuMSIgcj0iMi4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNS40IiBjeT0iMTA0LjkiIHI9IjguMCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTIwLjYiIGN5PSIxODUuNyIgcj0iNS41IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMTguOSIgY3k9IjI3LjMiIHI9IjIuMiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTkxLjkiIGN5PSIwLjYiIHI9IjcuOSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNTkuNSIgY3k9IjE4Mi45IiByPSI3LjciIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEyOS45IiBjeT0iNzYuMyIgcj0iMi40IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMjkuNSIgY3k9IjM4LjMiIHI9IjMuMCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjAyLjMiIGN5PSIyMTQuNSIgcj0iNS4zIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNTkuMyIgY3k9Ijc3LjkiIHI9IjQuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iOTQuOCIgY3k9IjUyLjEiIHI9IjcuMiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzcuMSIgY3k9IjE2My45IiByPSIyLjkiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjIzNC45IiBjeT0iMTA0LjciIHI9IjcuNSIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjIuOCIgY3k9IjI1LjgiIHI9IjQuMyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTY2LjIiIGN5PSIxMzguNCIgcj0iNS40IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI5My41IiBjeT0iMTkwLjEiIHI9IjYuNiIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzkuNyIgY3k9IjY1LjYiIHI9IjYuNCIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTExLjgiIGN5PSIxMjguMyIgcj0iNS4xIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNjIuMyIgY3k9IjExMy4zIiByPSI1LjUiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE5LjUiIGN5PSIyNTAuMCIgcj0iNC4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxODcuNSIgY3k9IjU5LjkiIHI9IjMuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTI2LjIiIGN5PSIxNzcuNCIgcj0iNi4wIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDQuMCIgY3k9IjIzMS4xIiByPSI3LjciIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEzNy4xIiBjeT0iNDYuMCIgcj0iMi4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxOTcuMyIgY3k9IjE0Ny45IiByPSIzLjAiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjI5LjYiIGN5PSI4NS4xIiByPSI3LjAiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjExLjciIGN5PSIxMTYuMCIgcj0iNC45IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNC4yIiBjeT0iMjcuMCIgcj0iNi4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI1OS42IiBjeT0iNjYuNyIgcj0iNC41IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxMDcuMiIgY3k9IjM5LjIiIHI9IjQuNSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTMuOSIgY3k9IjQ0LjMiIHI9IjMuMSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTY2LjkiIGN5PSI4OC40IiByPSI2LjYiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE5LjkiIGN5PSIxMzQuNyIgcj0iNS4xIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMTAuNCIgY3k9IjI0NC4wIiByPSI1LjIiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjI1NS4zIiBjeT0iMTIzLjEiIHI9IjMuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTU2LjYiIGN5PSIxODAuOSIgcj0iNC4yIiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxNTcuOSIgY3k9IjE3NC43IiByPSIzLjUiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjEzNC4xIiBjeT0iMjQxLjIiIHI9IjIuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNzMuNiIgY3k9IjE3Ny42IiByPSI3LjQiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjIzNC4xIiBjeT0iOTQuMiIgcj0iNC42IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI5NC4zIiBjeT0iNDcuMSIgcj0iNS41IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMDAuMiIgY3k9IjE0Mi43IiByPSI1LjIiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjY5LjUiIGN5PSI3MS4xIiByPSI1LjkiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE0LjMiIGN5PSI5LjMiIHI9IjcuNiIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNzAuMyIgY3k9IjEwNi4zIiByPSI1LjAiIGZpbGw9IiNjOWM5YzQiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjM2LjUiIGN5PSI2Ny41IiByPSI3LjkiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjE0MC4xIiBjeT0iNTkuMSIgcj0iMy4zIiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIxOTMuNiIgY3k9Ijk0LjYiIHI9IjMuNCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMTU5LjYiIGN5PSIwLjYiIHI9IjcuMyIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzYuMCIgY3k9IjIzNi4zIiByPSIyLjUiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjUwLjkiIGN5PSI4Ni40IiByPSI1LjYiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjU4LjUiIGN5PSI3LjEiIHI9IjUuOSIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzkuNyIgY3k9IjQxLjgiIHI9IjQuNyIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNTguOCIgY3k9IjgwLjgiIHI9IjYuNCIgZmlsbD0iIzhmOGY4YSIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iNDIuNyIgY3k9IjIwOS4wIiByPSI0LjYiIGZpbGw9IiM4ZjhmOGEiIG9wYWNpdHk9IjAuNSIvPjxjaXJjbGUgY3g9IjgwLjAiIGN5PSIxNTIuNyIgcj0iNi45IiBmaWxsPSIjOGY4ZjhhIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIzNy4yIiBjeT0iMTIxLjIiIHI9IjcuOCIgZmlsbD0iI2M5YzljNCIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMjE2LjEiIGN5PSIxMzUuNyIgcj0iMi45IiBmaWxsPSIjYzljOWM0IiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=",
    roughness: 0.25,
    metalness: 0.08,
  },
];

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
