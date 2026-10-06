// Pure calculation functions — no React, no I/O. Shared by Portal, Carrinho
// and Selecao pages so the ledger math has exactly one implementation.
import type { AllowanceGroup, Ambiente, Item, NivelAprovacao, Opcao, Solicitacao, StatusSolicitacao, Torre, Vinculo } from "./types";

export interface ResumoUnidade {
  valorImovel: number;
  totalAprovado: number;
  totalPendente: number;
  totalGeral: number;
}

/** True when a solicitação's outcome was removing the padrão item entirely
 * (generates a credit, so it should reduce the unit's running total)
 * rather than swapping it for a pricier option (a cost, adds to the
 * total) — the one signal a stored Solicitacao carries for this, since
 * only the net `diferenca` magnitude survives avaliarOpcao, not separate
 * credit/cost legs. */
export const isRemocao = (s: Pick<Solicitacao, "para">): boolean => s.para === "Removido (crédito)";

/** Parses the app's "DD/MM/YYYY" date strings (item.prazoInicio/prazoFim)
 * — never use `new Date(str)` on these, it reads DD/MM as MM/DD in en-US
 * locales. */
export function parseDataBR(data: string): Date {
  const [dia, mes, ano] = data.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** DD/MM/YYYY (app's stored format) -> YYYY-MM-DD, the only format
 * `<input type="date">` accepts as its value. */
export function paraInputDate(dataBR: string): string {
  const [dia, mes, ano] = dataBR.split("/");
  return `${ano}-${mes}-${dia}`;
}

/** YYYY-MM-DD (from `<input type="date">`) -> DD/MM/YYYY. */
export function deInputDate(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Composite key for catalog storage — the catalog (ambientes/itens/
 * opções/verbas) belongs to a Planta within an empreendimento, since two
 * plantas in the same building rarely share the same rooms/specs. */
export const plantaKey = (empreendimentoId: string, plantaId: string): string => `${empreendimentoId}::${plantaId}`;

export type StatusPrazo = "aberto" | "nao_iniciado" | "encerrado" | "sem_prazo";

/** Whether an item's client decision WINDOW (prazoInicio → prazoFim) is
 * open, not yet started, or closed — independent of `item.leadTimeDias`
 * (how long the chosen material takes to arrive after a decision). */
export function statusPrazo(item: Pick<Item, "prazoInicio" | "prazoFim">, now = new Date()): StatusPrazo {
  if (!item.prazoInicio && !item.prazoFim) return "sem_prazo";
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (item.prazoInicio && parseDataBR(item.prazoInicio).getTime() > hoje) return "nao_iniciado";
  if (item.prazoFim && parseDataBR(item.prazoFim).getTime() < hoje) return "encerrado";
  return "aberto";
}

export interface JanelaPersonalizacao {
  /** Menor prazoInicio entre todos os itens do empreendimento (qualquer planta). */
  inicio: string | null;
  /** Maior prazoFim entre todos os itens do empreendimento (qualquer planta). */
  fim: string | null;
  status: "habilitado" | "habilitado_em_breve" | "desabilitado" | "sem_prazo";
}

/**
 * O empreendimento não tem prazo de personalização próprio — é derivado do
 * catálogo: início é a menor data de início entre todos os itens (de
 * qualquer planta), fim é a maior data de fim. Assim que o primeiro item
 * abre, o registro fica "habilitado"; depois que o último item fecha, vira
 * "desabilitado". Usado na listagem de empreendimentos do cliente.
 */
export function calcularJanelaPersonalizacao(todosItens: Pick<Item, "prazoInicio" | "prazoFim">[], now = new Date()): JanelaPersonalizacao {
  const inicios = todosItens.map((i) => i.prazoInicio).filter((d): d is string => Boolean(d));
  const fins = todosItens.map((i) => i.prazoFim).filter((d): d is string => Boolean(d));
  if (inicios.length === 0 && fins.length === 0) return { inicio: null, fim: null, status: "sem_prazo" };

  const inicio = inicios.length ? inicios.reduce((min, d) => (parseDataBR(d).getTime() < parseDataBR(min).getTime() ? d : min)) : null;
  const fim = fins.length ? fins.reduce((max, d) => (parseDataBR(d).getTime() > parseDataBR(max).getTime() ? d : max)) : null;

  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let status: JanelaPersonalizacao["status"];
  if (inicio && parseDataBR(inicio).getTime() > hoje) status = "habilitado_em_breve";
  else if (fim && parseDataBR(fim).getTime() < hoje) status = "desabilitado";
  else status = "habilitado";

  return { inicio, fim, status };
}

/**
 * A unidade's running total — o "Monte sua unidade": valor do imóvel mais
 * toda personalização já aprovada (definitiva) e ainda pendente (estimada),
 * a mesma agregação que alimenta o Termo de alteração (ver TermoPage).
 */
export function resumirUnidade(solicitacoes: Solicitacao[], vinculoId: string, valorImovel: number): ResumoUnidade {
  let totalAprovado = 0;
  let totalPendente = 0;
  for (const s of solicitacoes) {
    if (s.vinculoId !== vinculoId || !s.diferenca) continue;
    const valor = isRemocao(s) ? -s.diferenca : s.diferenca;
    if (s.status === "aprovado") totalAprovado += valor;
    else if (s.status === "pendente" || s.status === "em_analise" || s.status === "aguardando_pagamento") totalPendente += valor;
  }
  return { valorImovel, totalAprovado, totalPendente, totalGeral: valorImovel + totalAprovado + totalPendente };
}

const statusLabels: Record<StatusSolicitacao, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  aguardando_pagamento: "Aguardando pagamento",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const statusLabel = (status: StatusSolicitacao): string => statusLabels[status];

/**
 * A request can only be edited by the client up until someone starts
 * handling it — once it's picked up (em_analise) or resolved, it's locked.
 */
export const isEditavel = (s: Pick<Solicitacao, "status">): boolean => s.status === "pendente";

/** Strips leading zeros from a zero-padded numeric code ("00001" → "1"). */
const semZerosEsquerda = (codigo: string): string => String(parseInt(codigo, 10) || 0);

/** Short, stable reference: SOL-{construtora}-{empreendimento}-{sequencial}.
 * construtoraId/empreendimentoId are canonically 5-digit numeric codes
 * ("00001") — displayed here without the leading zeros. The solicitação's
 * own sequential number keeps its 4-digit padding. */
export const formatSolicitacaoRef = (vinculo: Pick<Vinculo, "construtoraId" | "empreendimentoId">, id: string): string => {
  const numero = id.replace(/^SOL-/, "").padStart(4, "0");
  return `SOL-${semZerosEsquerda(vinculo.construtoraId)}-${semZerosEsquerda(vinculo.empreendimentoId)}-${numero}`;
};

/** Document number for a unit's aggregate Termo de alteração — same
 * construtora/empreendimento numeric-code convention as formatSolicitacaoRef,
 * closed with the unit's own number instead of a single solicitação's. */
export const formatTermoRef = (vinculo: Pick<Vinculo, "construtoraId" | "empreendimentoId" | "unidadeLabel">): string => {
  const unidade = vinculo.unidadeLabel.replace(/\D/g, "") || "0";
  return `ALT-${semZerosEsquerda(vinculo.construtoraId)}-${semZerosEsquerda(vinculo.empreendimentoId)}-${unidade}`;
};

/** "3 dias e 4h" style duration between an ISO instant and now (or a close instant). */
export function tempoDecorrido(desdeIso: string, ateIso?: string): string {
  const inicio = new Date(desdeIso).getTime();
  const fim = ateIso ? new Date(ateIso).getTime() : Date.now();
  const ms = Math.max(0, fim - inicio);
  const horas = Math.floor(ms / 3_600_000);
  const dias = Math.floor(horas / 24);
  const horasRestantes = horas % 24;
  if (dias === 0) return `${horas}h`;
  if (horasRestantes === 0) return `${dias}d`;
  return `${dias}d ${horasRestantes}h`;
}

export function fmtDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export const nivelLabel = (nivel: NivelAprovacao): string =>
  nivel === 1 ? "Simples" : nivel === 2 ? "Técnico" : "Bloqueado";

export const fmtBRL = (v: number, decimals = 0): string =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export const fmtSigned = (v: number, decimals = 0): string =>
  (v >= 0 ? "+" : "−") + ` ${fmtBRL(Math.abs(v), decimals)}`;

/** Same as fmtSigned but no space after the sign — for tight ledger rows. */
export const fmtLedgerValor = (v: number, decimals = 2): string =>
  (v >= 0 ? "+" : "−") + fmtBRL(Math.abs(v), decimals);

export interface LinhaAlteracao {
  itemId: string;
  ambiente: string;
  item: string;
  nivel: NivelAprovacao;
  de: string;
  para: string;
  credito: number;
  custo: number;
}

export interface ResumoAlteracoes {
  linhas: LinhaAlteracao[];
  totalCredito: number;
  totalDebito: number;
  saldo: number;
}

/** Extra quantity above the included default, for parametric items (elétrica/hidráulica). */
export const qtdExtra = (item: Item, qtd: number): number => Math.max(0, qtd - (item.qtdPadrao ?? 0));

export const custoParametrico = (item: Item, qtd: number): number => {
  const extra = qtdExtra(item, qtd);
  return extra * (item.custoPorUnidade?.total ?? 0);
};

export interface AvaliacaoItem {
  de: string;
  para: string;
  /** Magnitude of the credit/debit delta — always positive, matches the
   * `diferenca` shown in Painel and stored on Solicitacao. */
  diferenca: number;
}

/** What choosing a given option means for an item — used when building a
 * new solicitação in the wizard. */
export function avaliarOpcao(item: Item, opt: Opcao): AvaliacaoItem {
  if (opt.padrao) return { de: item.padrao, para: item.padrao, diferenca: 0 };
  if (opt.remocao) return { de: item.padrao, para: "Removido (crédito)", diferenca: item.valorPadrao };
  return { de: item.padrao, para: opt.nome, diferenca: Math.abs(opt.preco - item.valorPadrao) };
}

/** Same as avaliarOpcao, for parametric items (pontos elétricos/hidráulicos). */
export function avaliarParametrico(item: Item, qtd: number): AvaliacaoItem {
  const extra = qtdExtra(item, qtd);
  return {
    de: `${item.qtdPadrao} pontos`,
    para: `${qtd} pontos (+${extra})`,
    diferenca: custoParametrico(item, qtd),
  };
}

export interface SaldoAllowance {
  valorTotal: number;
  consumido: number;
  saldo: number;
}

/**
 * Saldo ao vivo de uma verba compartilhada entre vários itens de um mesmo
 * ambiente (ex.: piso + revestimento + louças do banheiro dividindo uma só
 * verba) — gastar mais num item reduz o saldo visível nos itens irmãos.
 * `choices` é o mesmo `Record<itemId, opcaoId>` já usado por
 * `resumirAlteracoes`; `preview` deixa o wizard mostrar o impacto de uma
 * opção sendo escolhida agora, antes de confirmar (ainda não está em
 * `choices`, que só é gravado na submissão).
 */
export function saldoAllowanceGroup(
  group: AllowanceGroup,
  itensDoGrupo: Item[],
  choices: Record<string, string>,
  preview?: { itemId: string; opcaoId: string | null },
): SaldoAllowance {
  let consumido = 0;
  for (const item of itensDoGrupo) {
    const chosenId = preview && preview.itemId === item.id ? preview.opcaoId : choices[item.id];
    const opt = chosenId ? item.opcoes.find((o) => o.id === chosenId) : undefined;
    if (!opt || opt.padrao) consumido += item.valorPadrao;
    else if (!opt.remocao) consumido += opt.preco;
  }
  return { valorTotal: group.valorTotal, consumido, saldo: group.valorTotal - consumido };
}

/**
 * Builds the list of items whose choice differs from the built-in default —
 * this is what powers the Portal status lines, the Carrinho line items and
 * the ledger totals, all from the same source of truth.
 */
export function resumirAlteracoes(
  ambientes: Ambiente[],
  choices: Record<string, string>,
  parametrico: Record<string, number>,
): ResumoAlteracoes {
  const linhas: LinhaAlteracao[] = [];
  let totalCredito = 0;
  let totalDebito = 0;

  for (const amb of ambientes) {
    for (const item of amb.itens) {
      if (item.nivel === 3) continue;

      if (item.parametrico) {
        const qtd = parametrico[item.id] ?? item.qtdPadrao ?? 0;
        const extra = qtdExtra(item, qtd);
        if (extra > 0) {
          const custo = custoParametrico(item, qtd);
          totalDebito += custo;
          linhas.push({
            itemId: item.id,
            ambiente: amb.nome,
            item: item.nome,
            nivel: item.nivel,
            de: `${item.qtdPadrao} pontos`,
            para: `${qtd} pontos (+${extra})`,
            credito: 0,
            custo,
          });
        }
        continue;
      }

      const chosenId = choices[item.id];
      if (!chosenId) continue;
      const opt = item.opcoes.find((o) => o.id === chosenId);
      if (!opt || opt.padrao) continue;

      if (opt.remocao) {
        totalCredito += item.valorPadrao;
        linhas.push({
          itemId: item.id,
          ambiente: amb.nome,
          item: item.nome,
          nivel: item.nivel,
          de: item.padrao,
          para: "Removido (crédito)",
          credito: item.valorPadrao,
          custo: 0,
        });
      } else {
        totalCredito += item.valorPadrao;
        totalDebito += opt.preco;
        linhas.push({
          itemId: item.id,
          ambiente: amb.nome,
          item: item.nome,
          nivel: item.nivel,
          de: item.padrao,
          para: opt.nome,
          credito: item.valorPadrao,
          custo: opt.preco,
        });
      }
    }
  }

  return { linhas, totalCredito, totalDebito, saldo: totalCredito - totalDebito };
}

/** Snaps free-text input to an existing option's casing when it matches
 * case-insensitively (e.g. "portobello" -> "Portobello"), so the same
 * marca/ambiente doesn't fork into multiple spellings in reports. Returns
 * the trimmed input unchanged when nothing matches — a genuinely new entry. */
/** Total de unidades do empreendimento é sempre a soma das unidades de
 * cada pavimento de cada torre — nunca um número digitado à parte, que
 * dessincroniza assim que uma torre muda. */
export function totalUnidadesTorres(torres: Pick<Torre, "unidadesPorPavimento">[]): number {
  return torres.reduce((sum, t) => sum + t.unidadesPorPavimento.reduce((s, n) => s + n, 0), 0);
}

/** Letra da torre pro número da unidade — primeira letra do nome
 * ("Torre A" -> "A"), ou A/B/C.. pelo índice se o nome não tiver letra. */
export function letraTorre(nome: string, indice: number): string {
  // Pega a letra isolada no nome ("Torre A" -> "A"), não a primeira letra
  // qualquer (que pegaria o "T" de "Torre"). Sem letra isolada, cai pro
  // índice (A/B/C... pela ordem de cadastro).
  const letras = nome.trim().match(/\b[A-Za-z]\b/g);
  const ultima = letras?.[letras.length - 1];
  return (ultima ?? String.fromCharCode(65 + indice)).toUpperCase();
}

/** Número de unidade automático: letra da torre + pavimento + posição no
 * andar (2 dígitos) — ex. Torre A, pavimento 3, 1ª unidade do andar ->
 * "A301". Nunca digitado à mão, sempre derivado de torre+pavimento+posição. */
export function numeroUnidade(torreNome: string, torreIndice: number, pavimento: number, posicao: number): string {
  return `${letraTorre(torreNome, torreIndice)}${pavimento}${String(posicao).padStart(2, "0")}`;
}

export function normalizarContraLista(valor: string, conhecidos: readonly string[]): string {
  const v = valor.trim();
  if (!v) return v;
  const match = conhecidos.find((c) => c.toLowerCase() === v.toLowerCase());
  return match ?? v;
}

const ALFABETO_SENHA = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // sem 0/O/1/l/I — evita confusão na hora de digitar

/** Senha de acesso gerada pro cliente no cadastro — 10 caracteres, sem
 * dígitos/letras ambíguos entre si. */
export function gerarSenhaAcesso(): string {
  let senha = "";
  for (let i = 0; i < 10; i++) senha += ALFABETO_SENHA[Math.floor(Math.random() * ALFABETO_SENHA.length)];
  return senha;
}
