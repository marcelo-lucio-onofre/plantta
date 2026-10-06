// Domain model — pure types, no framework or data-layer dependencies.
// Kept separate from `data/` (Dependency Inversion: state and UI depend on
// these shapes, never on how mock data is stored).

export type Role = "cliente" | "construtora" | null;

export type NivelAprovacao = 1 | 2 | 3;

export interface Brand {
  nome: string;
  /** Identificador na URL do login white-label (`/login/marca/:slug`) —
   * minúsculo, sem espaço/acento. Único por construtora. */
  slug: string;
  color: string;
  logo: string | null;
  /** Imagem de fundo do login/portal white-label — aparece grande e
   * translúcida atrás do formulário de login da construtora, com a marca
   * (logo) em destaque por cima. `null` = sem imagem própria, cai no
   * fundo padrão (--navy). */
  background: string | null;
  /** Ícone pequeno (favicon da aba do navegador + selo ao lado do
   * formulário de login). Independente do logo grande do hero. */
  favicon: string | null;
}

/** Dados institucionais e de contato da construtora — quem procurar,
 * não como o portal do cliente aparece (isso é `Brand`). Um registro por
 * construtora, editável, nunca some (fica `null` só antes do primeiro
 * salvamento). */
export interface ContatoConstrutora {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  site: string;
  cep: string;
  endereco: string;
  cidade: string;
  uf: string;
  responsavel: string;
}

export interface Opcao {
  id: string;
  nome: string;
  preco: number;
  padrao?: boolean;
  remocao?: boolean;
  /** Construtora's raw cost for this option — never shown to the client. */
  custoConstrutora?: number;
  /** Links back to the reusable MaterialCatalogItem this was attached from.
   * `nome`/`preco` above are a snapshot at attach time, same as any line
   * item in a real e-commerce order — editing the catalog later doesn't
   * retroactively change options already attached to items. */
  materialCatalogItemId?: string;
}

export interface CustoPorUnidade {
  total: number;
  [componente: string]: number;
}

export interface Item {
  id: string;
  nome: string;
  /** Categoria de material esperada pra esse item (Piso, Revestimento...)
   * — filtra quais materiais aparecem pra anexar como opção, já que um
   * item de piso não deveria listar louças da biblioteca de materiais. */
  categoriaId?: string;
  nivel: NivelAprovacao;
  padrao: string;
  /** Preço base / verba inclusa — o que já está contemplado no contrato. */
  valorPadrao: number;
  /** Janela em que o cliente pode decidir — ambos null significa sem prazo
   * definido. Ver domain/calculations.statusPrazo (aberto/nao_iniciado/
   * encerrado/sem_prazo). */
  prazoInicio: string | null;
  prazoFim: string | null;
  opcoes: Opcao[];
  parametrico?: boolean;
  qtdPadrao?: number;
  custoPorUnidade?: CustoPorUnidade;
  motivoBloqueio?: string;
  /** Construtora's raw cost for the padrão spec — never shown to the client. */
  custoConstrutora?: number;
  /** Days the chosen material takes to arrive after approval. */
  leadTimeDias?: number;
  /** Date the material needs to be on site (ISO), independent of the
   * client's decision deadline (`prazoFim`). */
  necessarioEmObra?: string;
  /** When set, this item's cost is drawn from a shared AllowanceGroup
   * instead of judged purely against its own valorPadrao. */
  allowanceGroupId?: string;
  /** Whether the client can submit their own material for this item, for
   * technical/financial review — defaults to true (undefined means
   * allowed) so existing items keep working without a migration. */
  permiteMaterialProprio?: boolean;
  /** Alteração exige ART/RRT (Anotação/Registro de Responsabilidade
   * Técnica) do profissional responsável — independente do nível de
   * aprovação, que é sobre quem decide, não sobre exigência documental. */
  requerArt?: boolean;
  /** Taxa da ART/RRT cobrada do cliente, somada ao custo da opção
   * escolhida — só se aplica quando `requerArt` é true. */
  custoArt?: number;
}

export interface Ambiente {
  id: string;
  nome: string;
  itens: Item[];
}

/** Categoria de material — taxonomia própria do construtora, não texto
 * livre (evita "Piso" e "piso" virando duas linhas em relatório). */
export interface Categoria {
  id: string;
  construtoraId: string;
  nome: string;
}

/** Marca — mesmo raciocínio de Categoria, entidade própria em vez de
 * campo de texto solto. */
export interface Marca {
  id: string;
  construtoraId: string;
  nome: string;
}

/** Tipo de ambiente (Sala, Cozinha, Suíte...) — mesmo raciocínio de
 * Categoria/Marca: taxonomia própria por construtora em vez de texto
 * livre. `Ambiente` (a estrutura rica com itens/opções, por planta) só
 * copia o `nome` daqui ao ser adicionado — não guarda um id de volta pra
 * este cadastro, então editar aqui não reescreve ambientes já criados
 * (diferente de Categoria/Marca, que são FK real em MaterialCatalogItem).
 * Exclusão continua bloqueada por "em uso" mesmo assim, só pra não sumir
 * a grafia canônica enquanto ela está ativa em alguma planta. */
export interface TipoAmbiente {
  id: string;
  construtoraId: string;
  nome: string;
}

/** Fornecedor — quem entrega o material, cadastro próprio (não é
 * característica do material em si). */
export interface Fornecedor {
  id: string;
  construtoraId: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  responsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string;
  endereco: string;
  cidade: string;
  uf: string;
}

/**
 * Reusable material — identidade do produto (categoria/marca/modelo), não
 * preço/prazo/fornecedor: isso varia por item e por negociação, já é
 * resolvido em Opcao.preco/custoConstrutora quando o material é anexado a
 * um item. Construtora cadastra uma vez e reaproveita em quantos itens
 * quiser, em vez de digitar categoria/marca/modelo de novo. Escopado por
 * construtora (compartilhado entre todos os seus empreendimentos).
 */
export interface MaterialCatalogItem {
  id: string;
  construtoraId: string;
  categoriaId: string;
  marcaId: string;
  /** Quem entrega esse material — Fornecedor é cadastro próprio (ver
   * `Fornecedor`), não texto solto. */
  fornecedorId: string;
  modelo: string;
  sku: string;
  imagemUrl: string | null;
}

/**
 * Verba compartilhada entre vários itens de um mesmo ambiente (ex.: verba
 * do banheiro dividida entre piso/revestimento/cuba/louças) — gastar mais
 * num item reduz o saldo visível nos itens irmãos do grupo.
 */
export interface AllowanceGroup {
  id: string;
  nome: string;
  ambienteId: string;
  valorTotal: number;
  itemIds: string[];
}

/**
 * Uma tipologia/planta de unidade dentro de um empreendimento — um prédio
 * de centenas de unidades quase nunca tem uma única planta (dezenas de
 * m², quartos e layouts diferentes convivem no mesmo empreendimento). O
 * catálogo (ambientes/itens/opções) pertence à Planta, não diretamente ao
 * empreendimento, porque a Sala da Planta A pode ter um padrão totalmente
 * diferente da Sala da Planta B. Unidades reais se associam a uma Planta
 * (ver Vinculo.plantaId).
 */
export type StatusPlanta = "ativa" | "inativa";

export type CategoriaArquivoPlanta =
  | "plantaArquitetonicaPdf"
  | "plantaImagem"
  | "dwg"
  | "plantaHumanizada"
  | "plantaMobiliada"
  | "plantaEletrica"
  | "plantaHidraulica"
  | "plantaPontos"
  | "memorialTipologia"
  | "renderizacoes";

export interface Planta {
  id: string;
  codigo: string;
  nome: string;
  tipologia: string;
  descricao?: string;
  areaPrivativaM2?: number;
  areaTotalM2?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  numeroAmbientes?: number;
  versao: string;
  dataVersao: string | null;
  status: StatusPlanta;
  opcoesPermitidas: string;
  restricoes: string;
  /** Faixas/números de unidade cadastrados nesta planta, só pra exibição —
   * ex.: "101-110, 201-210". Não é usado pra resolver vínculo algum. */
  unidadesLabel?: string;
  arquivos: Record<CategoriaArquivoPlanta, ArquivoCadastro[]>;
}

/**
 * Uma unidade física dentro de uma torre — número calculado a partir de
 * torre+pavimento+posição (ver domain/calculations.numeroUnidade), nunca
 * digitado à mão. `numero` é a chave (único dentro do empreendimento).
 * plantaId/clienteNome/valor começam vazios — o heatmap de associação
 * preenche por clique.
 */
export interface UnidadeAssociada {
  numero: string;
  empreendimentoId: string;
  torreId: string;
  pavimento: number;
  posicao: number;
  plantaId: string | null;
  clienteNome: string;
  valor: number | null;
}

export interface Empreendimento {
  nome: string;
  construtora: string;
  unidade: string;
  torre: string;
  comprador: string;
  cpf: string;
  totalUnidades: number;
  valorImovel: number;
  /** Foto do empreendimento enviada pela construtora no cadastro — o
   * cliente só visualiza, nunca troca. Sem foto, a UI mostra o estado
   * "imagem indisponível". */
  imagemUrl?: string | null;
}

/**
 * One client↔unit relationship. A client can hold several of these across
 * different construtoras — this is what the portal's left sidebar switches
 * between. `brand` is this construtora's own identity, or `null` when it
 * hasn't opted into white-label (portal falls back to plantta's brand).
 */
export interface Vinculo {
  id: string;
  /** Numeric code, zero-padded to 5 digits ("00001") — the canonical form.
   * Display strips the leading zeros (see formatSolicitacaoRef). */
  construtoraId: string;
  construtoraNome: string;
  /** Same numeric-code convention as construtoraId. */
  empreendimentoId: string;
  empreendimentoNome: string;
  /** Qual Planta esta unidade segue — decide qual catálogo (ambientes/
   * itens/opções) o cliente vê. */
  plantaId: string;
  plantaNome: string;
  unidadeLabel: string;
  torre: string;
  brand: Brand | null;
  /** Quando setado, o cliente assinou o termo declarando que não fará
   * nenhuma alteração/personalização nesta unidade — ver `MinhaUnidadePage`
   * ("Não desejo alterar") e `TermoPage` (renderiza a declaração em vez do
   * resumo de alterações quando isso está preenchido). `null`/ausente =
   * ainda em aberto (padrão, e o estado pro qual "Reabrir" volta). */
  semAlteracaoAssinadaEm?: string | null;
  /** E-mail digitado pelo cliente como assinatura do termo de não alteração
   * — mesma ideia de "digite pra assinar" do termo de alteração normal. */
  semAlteracaoAssinadaPor?: string | null;
  /** Quando setado, a construtora confirmou o pagamento das personalizações
   * aprovadas desta unidade — só a partir daí o termo/memorial descritivo
   * fica disponível pro cliente (ver `unidadeStatus.ts`). `null`/ausente =
   * ainda aguardando (mesmo com solicitações já aprovadas). */
  pagamentoConfirmadoEm?: string | null;
}

export type StatusSolicitacao = "pendente" | "em_analise" | "aguardando_pagamento" | "aprovado" | "recusado";

export type TipoEventoTimeline =
  | "criacao"
  | "roteamento"
  | "assumido"
  | "parecer"
  | "aprovacao"
  | "recusa"
  | "info";

export interface TimelineEvent {
  id: string;
  data: string; // ISO datetime
  autor: string;
  papel: string;
  texto: string;
  tipo: TipoEventoTimeline;
}

export interface Solicitacao {
  id: string;
  vinculoId: string;
  /** Denormalized on purpose — Painel needs to scope by construtora even
   * for demo rows whose vinculoId has no matching Vinculo record. */
  construtoraId: string;
  /** The catalog Item.id this request is about — powers the "edit" deep
   * link (Seleção for fixed-option items, Calculadora for parametric ones). */
  itemId: string;
  unidade: string;
  torre: string;
  cliente: string;
  item: string;
  de: string;
  para: string;
  diferenca: number | null;
  status: StatusSolicitacao;
  nivel: NivelAprovacao;
  data: string;
  /** ISO datetime the request was opened — powers "tempo em aberto". */
  abertoEm: string;
  /** ISO datetime it left an open state (aprovado/recusado), if it has. */
  encerradoEm?: string;
  responsavel: string | null;
  timeline: TimelineEvent[];
  /** Presente quando o cliente propôs material próprio (fora do catálogo)
   * em vez de escolher uma opção do item — ver NovaPersonalizacaoPage
   * "Enviar material próprio". `diferenca` fica `null` até o técnico
   * decidir a proposta vencedora e os custos extras na Aprovação. */
  materialProprio?: SolicitacaoMaterialProprio;
  /** Custos extras que o técnico adiciona ao aprovar um material próprio —
   * ver CustoExtra. Soma entra em `diferenca` junto com o valor da
   * proposta escolhida. */
  custosExtras?: CustoExtra[];
}

export type TipoLancamento = "credito" | "debito";

export interface LancamentoLedger {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
}

export interface SelecaoCarrinho {
  id: string;
  item: string;
  ambiente: string;
  de: string;
  para: string;
  nivel: NivelAprovacao;
  credito: number;
  custo: number;
}

export interface TopUpgrade {
  nome: string;
  pct: number;
  receita: number;
}

export interface ReceitaMes {
  mes: string;
  valor: number;
  sol: number;
}

export interface DashboardData {
  unidadesTotal: number;
  unidadesPersonalizando: number;
  receitaUpgrade: number;
  ticketMedioUpgrade: number;
  taxaAdesao: number;
  tempoMedioAprovacao: number;
  solicitacoesMes: number;
  creditoGerado: number;
  creditoUtilizado: number;
  topUpgrades: TopUpgrade[];
  porMes: ReceitaMes[];
  porNivel: { simples: number; tecnico: number; proibido: number };
}

export type CategoriaArquivo =
  | "logo"
  | "imagens"
  | "memorialGeral"
  | "manualProprietario"
  | "projetos"
  | "documentosTecnicos"
  | "plantasGerais"
  | "tabelaUnidades"
  | "materialComercial";

export interface ArquivoCadastro {
  id: string;
  name: string;
  size: number;
}

export type TipoPapel =
  | "Arquiteto"
  | "Engenheiro"
  | "Técnico"
  | "Designer"
  | "Projetista"
  | "Consultor"
  | "Cliente"
  | "Responsável pela construtora"
  | "Outro";

export type StatusRegistroProfissional = "Ativo" | "Inativo";

export type CategoriaArquivoPessoa = "documentoProfissional" | "carteiraRegistro" | "certificados" | "artRrt" | "contratos" | "projetosDocumentosTecnicos";

/**
 * Pessoa/Organização — cadastro único pra qualquer humano com quem a
 * construtora lida (arquiteto, engenheiro, técnico, cliente...), em vez de
 * cadastros paralelos por tipo. A mesma pessoa pode ter vários papéis ao
 * mesmo tempo (`papeis`); campos de registro profissional (conselho/nº/UF)
 * ficam vazios quando não fazem sentido pro papel (ex.: um Cliente puro).
 * Não tem relação com o login mock do cliente (Vinculo) — é só cadastro/
 * ficha, não autenticação.
 */
export interface Pessoa {
  id: string;
  construtoraId: string;
  papeis: TipoPapel[];
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  empresa: string;
  cargoEspecialidade: string;
  conselho: string;
  numeroRegistro: string;
  ufRegistro: string;
  statusRegistro: StatusRegistroProfissional;
  endereco: string;
  estadoCivil: string;
  canalContatoPreferencial: string;
  observacoes: string;
  arquivos: Record<CategoriaArquivoPessoa, ArquivoCadastro[]>;
  /** Gerada uma única vez, na primeira vez que a pessoa vira Cliente —
   * simula o e-mail de boas-vindas que os logins de cliente já referenciam.
   * Não é regerada em edições seguintes. */
  senhaAcesso?: string;
}

export type TipoEmpreendimento = "Residencial" | "Comercial" | "Misto" | "Loteamento";
export type StatusComercialEmpreendimento = "Planejamento" | "Lançamento" | "Em obras" | "Entregue";

/** Uma torre/bloco do empreendimento — pavimentos ficam por torre porque
 * nem sempre são iguais entre torres do mesmo empreendimento. Cada posição
 * do array `unidadesPorPavimento` é um pavimento (índice 0 = pavimento 1),
 * e o valor é a quantidade de unidades naquele pavimento — raramente igual
 * em todos os pavimentos, por isso não é um número único por torre. O total
 * de unidades é sempre derivado daqui (ver domain/calculations.totalUnidadesTorres),
 * nunca digitado à parte. */
export interface Torre {
  id: string;
  nome: string;
  unidadesPorPavimento: number[];
}

export interface CadastroEmpreendimentoInput {
  nome: string;
  codigoInterno: string;
  /** Locked to the logged-in construtora — never free text (see LoginConstrutoraPage). */
  construtoraId: string;
  construtora: string;
  tipo: TipoEmpreendimento;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  torres: Torre[];
  lancamento: string | null;
  previsaoEntrega: string | null;
  statusComercial: StatusComercialEmpreendimento;
  responsavelConstrutora: string;
  gerenteObra: string;
  regrasPersonalizacao: string;
  arquivos: Record<CategoriaArquivo, ArquivoCadastro[]>;
}

export interface EmpreendimentoCadastrado extends CadastroEmpreendimentoInput {
  id: string;
  criadoEm: string;
}

export interface MaterialPropostaFornecedor {
  fornecedor: string;
  valor: string;
}

/** Custo extra que o técnico adiciona na aprovação de um material próprio
 * (`Solicitacao.materialProprio`) — mão de obra, material extra de
 * instalação, frete etc. que não estava na cotação do cliente nem no
 * orçamento do item padrão. Livre (descrição + valor), o técnico decide
 * quantas linhas fazem sentido pra cada caso. */
export interface CustoExtra {
  id: string;
  descricao: string;
  valor: number;
}

export interface SolicitacaoMaterialProprio {
  itemId: string;
  materialNome: string;
  referencia: string;
  propostas: MaterialPropostaFornecedor[];
  status: "enviado_para_analise";
  /** Cliente marcou a ciência do aviso de risco de atraso/multa antes de
   * enviar — registrado pra auditoria, não é uma validação de que a
   * cláusula de multa é juridicamente aplicável (isso exige análise
   * jurídica real, fora do escopo deste protótipo). */
  avisoRiscoAceito: boolean;
}
