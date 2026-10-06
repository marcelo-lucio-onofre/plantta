// Repository interfaces — the state layer depends on these, never on the
// concrete in-memory classes (Dependency Inversion). Swapping to a real API
// later means writing a new class that satisfies the same interface.
import type {
  AllowanceGroup,
  Ambiente,
  Brand,
  CadastroEmpreendimentoInput,
  Categoria,
  ContatoConstrutora,
  DashboardData,
  Empreendimento,
  EmpreendimentoCadastrado,
  Fornecedor,
  Item,
  Marca,
  MaterialCatalogItem,
  Pessoa,
  Planta,
  Solicitacao,
  StatusSolicitacao,
  TipoAmbiente,
  UnidadeAssociada,
  Vinculo,
} from "../../domain/types";

export interface ICatalogoRepository {
  getEmpreendimento(vinculoId: string): Empreendimento | undefined;
  /** Resolves the vínculo's own Planta internally — a unit's catalog is
   * whichever Planta it's on, not shared flat across the empreendimento. */
  getAmbientes(vinculoId: string): Ambiente[];
  getAllowanceGroups(vinculoId: string): AllowanceGroup[];

  /** Authoring side — construtora manages a catalog directly by
   * empreendimentoId, since it isn't browsing through a vínculo. Includes
   * both empreendimentos with real vínculos (the demo units) and ones
   * registered via registrarEmpreendimento (freshly cadastrados, no
   * client/vínculo yet — still need somewhere to build their catalog). */
  listEmpreendimentosByConstrutora(construtoraId: string): { empreendimentoId: string; nome: string }[];
  /** Todos os itens de todas as plantas do empreendimento — usado só pra
   * derivar a janela de personalização (calcularJanelaPersonalizacao), não
   * pra navegação normal (essa continua sempre por planta). */
  listTodosItensDoEmpreendimento(empreendimentoId: string): Item[];
  listPlantas(empreendimentoId: string): Planta[];
  upsertPlanta(empreendimentoId: string, planta: Planta): void;
  removePlanta(empreendimentoId: string, plantaId: string): void;
  getAmbientesByPlanta(empreendimentoId: string, plantaId: string): Ambiente[];
  getAllowanceGroupsByPlanta(empreendimentoId: string, plantaId: string): AllowanceGroup[];
  replaceAmbientes(empreendimentoId: string, plantaId: string, ambientes: Ambiente[]): void;
  replaceAllowanceGroups(empreendimentoId: string, plantaId: string, groups: AllowanceGroup[]): void;
  /** Makes a freshly cadastrado empreendimento (no vínculo yet) show up in
   * listEmpreendimentosByConstrutora / show up in Catálogo, ready to build
   * on — otherwise a Cadastro just vanishes into a list nothing else reads. */
  registrarEmpreendimento(empreendimentoId: string, construtoraId: string, nome: string): void;
  /** Ponte entre uma UnidadeAssociada (vendida via Vendas) e o vínculo que
   * o wizard de personalização (getEmpreendimento(vinculoId)) precisa —
   * sem isso, um vínculo criado dinamicamente (ver AppContext.
   * garantirVinculoDaUnidade) não teria de onde puxar nome/comprador/valor
   * pro resumo "Minha unidade" nem pra criação de Solicitacao. */
  registrarEmpreendimentoPorVinculo(vinculoId: string, dados: Empreendimento): void;
}

export interface IMaterialCatalogoRepository {
  list(construtoraId: string): MaterialCatalogItem[];
  create(input: Omit<MaterialCatalogItem, "id">): MaterialCatalogItem;
  update(id: string, patch: Partial<Omit<MaterialCatalogItem, "id" | "construtoraId">>): MaterialCatalogItem | undefined;
  remove(id: string): void;
}

export interface ICategoriaRepository {
  list(construtoraId: string): Categoria[];
  create(input: Omit<Categoria, "id">): Categoria;
  update(id: string, patch: Partial<Omit<Categoria, "id" | "construtoraId">>): Categoria | undefined;
  remove(id: string): void;
}

export interface IMarcaRepository {
  list(construtoraId: string): Marca[];
  create(input: Omit<Marca, "id">): Marca;
  update(id: string, patch: Partial<Omit<Marca, "id" | "construtoraId">>): Marca | undefined;
  remove(id: string): void;
}

export interface IAmbienteRepository {
  list(construtoraId: string): TipoAmbiente[];
  create(input: Omit<TipoAmbiente, "id">): TipoAmbiente;
  update(id: string, patch: Partial<Omit<TipoAmbiente, "id" | "construtoraId">>): TipoAmbiente | undefined;
  remove(id: string): void;
}

export interface IFornecedorRepository {
  list(construtoraId: string): Fornecedor[];
  create(input: Omit<Fornecedor, "id">): Fornecedor;
  update(id: string, patch: Partial<Omit<Fornecedor, "id" | "construtoraId">>): Fornecedor | undefined;
  remove(id: string): void;
}

export interface IPessoaRepository {
  list(construtoraId: string): Pessoa[];
  create(input: Omit<Pessoa, "id">): Pessoa;
  update(id: string, patch: Partial<Omit<Pessoa, "id" | "construtoraId">>): Pessoa | undefined;
  remove(id: string): void;
}

export interface IUnidadeRepository {
  listByEmpreendimento(empreendimentoId: string): UnidadeAssociada[];
  /** Substitui a unidade por `numero`+`empreendimentoId` — não há "criar" vs
   * "editar" separado, o heatmap gera todas as unidades ao vivo a partir
   * das torres e só grava quando o construtora associa planta/cliente/valor. */
  upsert(unidade: UnidadeAssociada): void;
}

export interface IVinculoRepository {
  /** The logged-in client's own units, across every construtora they bought from. */
  listForCliente(): Vinculo[];
  getById(id: string): Vinculo | undefined;
  /** Cria ou atualiza um vínculo por id — usado pra gerar o vínculo de uma
   * unidade vendida sob demanda (ver AppContext.garantirVinculoDaUnidade),
   * não só pelos vínculos-demo pré-carregados. */
  upsert(vinculo: Vinculo): void;
}

export interface IBrandRepository {
  /** null when that construtora hasn't opted into white-label yet — the
   * client portal falls back to plantta's own brand in that case. */
  getBrand(construtoraId: string): Brand | null;
  saveBrand(construtoraId: string, brand: Brand): Brand;
  /** Resolve o slug da URL de login white-label (`/login/marca/:slug`)
   * pra qual construtora ele pertence. null se nenhuma marca usa esse slug. */
  getConstrutoraIdBySlug(slug: string): string | null;
}

export interface IContatoConstrutoraRepository {
  /** null antes do primeiro salvamento. */
  getContato(construtoraId: string): ContatoConstrutora | null;
  saveContato(construtoraId: string, contato: ContatoConstrutora): ContatoConstrutora;
}

export interface NovaSolicitacaoInput {
  vinculoId: string;
  construtoraId: string;
  itemId: string;
  item: string;
  unidade: string;
  torre: string;
  cliente: string;
  de: string;
  para: string;
  diferenca: number | null;
  nivel: Solicitacao["nivel"];
  materialProprio?: Solicitacao["materialProprio"];
}

export interface ISolicitacaoRepository {
  list(): Solicitacao[];
  listByVinculoIds(vinculoIds: string[]): Solicitacao[];
  getById(id: string): Solicitacao | undefined;
  create(input: NovaSolicitacaoInput): Solicitacao;
  updateStatus(id: string, status: StatusSolicitacao, responsavel?: string | null): Solicitacao | undefined;
  /** Técnico decide o valor final (proposta de fornecedor escolhida) e os
   * custos extras (mão de obra, material de instalação etc.) de um
   * material próprio — chamado antes de `updateStatus(id, "aprovado")`
   * pra `diferenca` já estar correta quando a aprovação entra na timeline. */
  registrarCustosExtras(id: string, valorMaterialEscolhido: number, custosExtras: Solicitacao["custosExtras"]): Solicitacao | undefined;
}

export interface IEmpreendimentoCadastroRepository {
  list(): EmpreendimentoCadastrado[];
  create(input: CadastroEmpreendimentoInput): EmpreendimentoCadastrado;
  /** Attaches files to an already-created cadastro — the wizard creates
   * the record right after step 1 (so Plantas/Catálogo have a real id to
   * work against) and only fills arquivos in at the files step. */
  updateArquivos(id: string, arquivos: CadastroEmpreendimentoInput["arquivos"]): EmpreendimentoCadastrado | undefined;
}

export interface IDashboardRepository {
  getDashboard(): DashboardData;
}
