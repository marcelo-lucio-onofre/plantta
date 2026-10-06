import { useCallback, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown, Download, ImageOff, Plus } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { JanelaBadge, NivelBadge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ConstrutoraMark } from "../components/ConstrutoraGroupHeader";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { fmtBRL, isRemocao, nivelLabel, resumirUnidade, statusLabel } from "../domain/calculations";
import type { Brand, NivelAprovacao, Planta, Solicitacao, StatusSolicitacao, Vinculo } from "../domain/types";
import { useApp } from "../state/AppContext";

type StatusItem = StatusSolicitacao | "sem_alteracao";

interface ItemNo {
  id: string;
  nome: string;
  nivel: NivelAprovacao;
  ambiente: string;
  de: string;
  para: string;
  status: StatusItem;
  /** Com sinal: remoção (crédito) entra negativa, igual a resumirUnidade. */
  diferenca: number;
  solicitacaoId?: string;
}

interface AmbienteNo {
  id: string;
  nome: string;
  itens: ItemNo[];
}

interface UnidadeNo {
  vinculo: Vinculo;
  ambientes: AmbienteNo[];
  valorImovel: number;
  naoPersonalizadoEm?: string;
}

interface EmpreendimentoNo {
  id: string;
  nome: string;
  imagemUrl: string | null;
  unidades: UnidadeNo[];
}

interface ConstrutoraNo {
  id: string;
  nome: string;
  brand: Brand | null;
  empreendimentos: EmpreendimentoNo[];
}

type TermoAlvo =
  | { nivel: "unidade"; vinculoId: string }
  | { nivel: "ambiente"; vinculoId: string; ambienteId: string }
  | { nivel: "item"; vinculoId: string; ambienteId: string; itemId: string };

interface Agregado {
  label: string;
  className: string;
}

const statusBadgeClass: Record<StatusItem, string> = {
  pendente: "badge--tecnico",
  em_analise: "badge--tecnico",
  aguardando_pagamento: "badge--info",
  aprovado: "badge--simples",
  recusado: "badge--bloqueado",
  sem_alteracao: "badge--neutro",
};

const labelStatusItem = (status: StatusItem): string => (status === "sem_alteracao" ? "Sem alteração" : statusLabel(status));

/** Status de um conjunto de itens (ambiente ou unidade inteira): qualquer
 * coisa ainda em aberto domina, depois aguardando pagamento, depois
 * aprovado, depois tudo recusado. */
function agregar(itens: ItemNo[]): Agregado {
  if (itens.some((i) => i.status === "pendente" || i.status === "em_analise")) return { label: "Em análise", className: "badge--tecnico" };
  if (itens.some((i) => i.status === "aguardando_pagamento")) return { label: "Aguardando pagamento", className: "badge--info" };
  if (itens.some((i) => i.status === "aprovado")) return { label: "Aprovado", className: "badge--simples" };
  if (itens.length > 0 && itens.every((i) => i.status === "recusado")) return { label: "Recusado", className: "badge--bloqueado" };
  return { label: "Sem alterações", className: "badge--neutro" };
}

const fmtBRLSinal = (v: number): string => (v >= 0 ? "+" : "−") + fmtBRL(Math.abs(v));

const fmtAssinatura = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const contarArquivos = (plantas: Planta[]): number =>
  plantas.reduce((n, p) => n + Object.values(p.arquivos).reduce((m, arquivos) => m + arquivos.length, 0), 0);

/** Linha clicável (construtora/empreendimento) que também responde a teclado
 * — não dá pra ser <button> porque carrega outro botão dentro (Baixar plantas). */
function onEnterOuEspaco(acao: () => void) {
  return (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      acao();
    }
  };
}

function Chevron({ aberto, size = 14 }: { aberto: boolean; size?: number }) {
  return <ChevronDown size={size} strokeWidth={2.4} className={"mp-chevron" + (aberto ? "" : " mp-chevron--fechado")} aria-hidden />;
}

/**
 * "Minhas personalizações" — o único destino do portal do cliente. Unifica
 * o que antes eram dois menus (Minha unidade + Minhas personalizações) numa
 * árvore só: Construtora → Empreendimento → Unidade → Ambiente → Item. Cada
 * nível (unidade, ambiente, item) carrega seu próprio status agregado e seu
 * próprio termo descritivo; na unidade o cliente também pode assinar o
 * termo de não personalização (e revogá-lo depois).
 *
 * Escopo segue o login, como antes: login white-label de uma construtora só
 * enxerga as unidades dela (AppContext.loginScopeConstrutoraId) e esconde o
 * cabeçalho de construtora; login plantta genérico vê todas.
 */
export function PersonalizacoesPage() {
  const {
    vinculos,
    solicitacoes,
    catalogo,
    brandRepo,
    loginScopeConstrutoraId,
    naoPersonalizacao,
    assinarNaoPersonalizacao,
    revogarNaoPersonalizacao,
  } = useApp();
  const toast = useToast();

  const [construtorasAbertas, setConstrutorasAbertas] = useState<Record<string, boolean>>({});
  const [empreendimentosFechados, setEmpreendimentosFechados] = useState<Record<string, boolean>>({});
  const [unidadesAbertas, setUnidadesAbertas] = useState<Record<string, boolean>>({});
  const [ambientesAbertos, setAmbientesAbertos] = useState<Record<string, boolean>>({});
  const [termoAlvo, setTermoAlvo] = useState<TermoAlvo | null>(null);
  const [optOutAlvo, setOptOutAlvo] = useState<string | null>(null);
  const [optOutCiente, setOptOutCiente] = useState(false);
  const [revogarAlvo, setRevogarAlvo] = useState<string | null>(null);

  const alternar = (set: typeof setUnidadesAbertas, id: string) => set((s) => ({ ...s, [id]: !s[id] }));

  const fecharTermo = useCallback(() => setTermoAlvo(null), []);
  const fecharOptOut = useCallback(() => {
    setOptOutAlvo(null);
    setOptOutCiente(false);
  }, []);
  const fecharRevogar = useCallback(() => setRevogarAlvo(null), []);

  const meusVinculos = loginScopeConstrutoraId ? vinculos.filter((v) => v.construtoraId === loginScopeConstrutoraId) : vinculos;

  // Monta a árvore a partir dos vínculos (unidades do cliente), do catálogo
  // da planta de cada unidade (ambientes/itens) e das solicitações abertas.
  const arvore: ConstrutoraNo[] = [];
  for (const v of meusVinculos) {
    let c = arvore.find((x) => x.id === v.construtoraId);
    if (!c) {
      c = { id: v.construtoraId, nome: v.construtoraNome, brand: brandRepo.getBrand(v.construtoraId) ?? v.brand, empreendimentos: [] };
      arvore.push(c);
    }
    const dadosUnidade = catalogo.getEmpreendimento(v.id);
    let e = c.empreendimentos.find((x) => x.id === v.empreendimentoId);
    if (!e) {
      e = { id: v.empreendimentoId, nome: v.empreendimentoNome, imagemUrl: dadosUnidade?.imagemUrl ?? null, unidades: [] };
      c.empreendimentos.push(e);
    }

    // Solicitação mais recente por item — é ela que diz o status atual.
    const doVinculo = solicitacoes
      .filter((s) => s.vinculoId === v.id)
      .sort((a, b) => new Date(b.abertoEm).getTime() - new Date(a.abertoEm).getTime());
    const porItem = new Map<string, Solicitacao>();
    for (const s of doVinculo) if (!porItem.has(s.itemId)) porItem.set(s.itemId, s);

    const paraNo = (s: Solicitacao): Pick<ItemNo, "de" | "para" | "status" | "diferenca" | "solicitacaoId"> => ({
      de: s.de,
      para: s.para,
      status: s.status,
      diferenca: (isRemocao(s) ? -1 : 1) * (s.diferenca ?? 0),
      solicitacaoId: s.id,
    });

    const ambientes: AmbienteNo[] = catalogo.getAmbientes(v.id).map((a) => ({
      id: a.id,
      nome: a.nome,
      itens: a.itens.map((item) => {
        const s = porItem.get(item.id);
        porItem.delete(item.id);
        return {
          id: item.id,
          nome: item.nome,
          nivel: item.nivel,
          ambiente: a.nome,
          ...(s ? paraNo(s) : { de: item.padrao, para: "—", status: "sem_alteracao" as const, diferenca: 0 }),
        };
      }),
    }));
    // Solicitações de itens que não estão (mais) no catálogo da planta não
    // podem sumir da visão do cliente — ficam num ambiente à parte.
    if (porItem.size > 0) {
      ambientes.push({
        id: "outros",
        nome: "Outros itens",
        itens: [...porItem.values()].map((s) => ({ id: s.itemId, nome: s.item, nivel: s.nivel, ambiente: "Outros itens", ...paraNo(s) })),
      });
    }

    e.unidades.push({ vinculo: v, ambientes, valorImovel: dadosUnidade?.valorImovel ?? 0, naoPersonalizadoEm: naoPersonalizacao[v.id] });
  }

  const multiConstrutora = !loginScopeConstrutoraId && arvore.length > 1;
  const recuo = multiConstrutora ? 24 : 0;

  const baixarPlantas = (plantas: Planta[], descricao: string) => {
    const total = contarArquivos(plantas);
    if (total === 0) toast.error(`A construtora ainda não publicou plantas ${descricao}.`);
    else toast.success(`Baixando ${total} arquivo${total > 1 ? "s" : ""} de planta ${descricao}.`);
  };

  // Termo aberto — localizado na árvore, nunca num snapshot separado, pra
  // refletir na hora uma assinatura/revogação feita com o modal fechado.
  let termo: { eyebrow: string; titulo: string; construtora: ConstrutoraNo; unidade: UnidadeNo; itens: ItemNo[] } | null = null;
  if (termoAlvo) {
    for (const c of arvore)
      for (const e of c.empreendimentos)
        for (const u of e.unidades) {
          if (u.vinculo.id !== termoAlvo.vinculoId) continue;
          if (termoAlvo.nivel === "unidade") {
            termo = { eyebrow: "Termo de alteração — Unidade", titulo: u.vinculo.unidadeLabel, construtora: c, unidade: u, itens: u.ambientes.flatMap((a) => a.itens) };
          } else {
            const a = u.ambientes.find((x) => x.id === termoAlvo.ambienteId);
            if (!a) continue;
            if (termoAlvo.nivel === "ambiente") {
              termo = { eyebrow: "Termo descritivo — Ambiente", titulo: a.nome, construtora: c, unidade: u, itens: a.itens };
            } else {
              const i = a.itens.find((x) => x.id === termoAlvo.itemId);
              if (i) termo = { eyebrow: "Termo descritivo — Item", titulo: i.nome, construtora: c, unidade: u, itens: [i] };
            }
          }
        }
  }
  const termoTotalAprovado = termo ? termo.itens.filter((i) => i.status === "aprovado").reduce((n, i) => n + i.diferenca, 0) : 0;

  const confirmarOptOut = () => {
    if (!optOutAlvo || !optOutCiente) return;
    assinarNaoPersonalizacao(optOutAlvo);
    fecharOptOut();
    toast.success("Termo de não personalização assinado.");
  };

  const confirmarRevogar = () => {
    if (!revogarAlvo) return;
    revogarNaoPersonalizacao(revogarAlvo);
    setRevogarAlvo(null);
    toast.success("Termo revogado — a personalização desta unidade foi reaberta.");
  };

  return (
    <div className="container" style={{ maxWidth: 1000 }}>
      <Breadcrumb items={[{ label: "Minhas personalizações" }]} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Minhas personalizações</h1>
        <Link to="/personalizacoes/nova" className="btn btn--primary">
          <Plus className="sidebar-nav-icon" /> Nova personalização
        </Link>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-soft)", maxWidth: 640, marginBottom: 32 }}>
        Cada unidade reúne seus ambientes, e cada ambiente reúne seus itens — com status sempre visível e um termo descritivo próprio em cada nível.
      </p>

      {arvore.length === 0 && <div className="card text-soft" style={{ fontSize: 14 }}>Nenhuma unidade vinculada.</div>}

      {arvore.map((c) => {
        // Colapsada por padrão — cliente expande a construtora que quer
        // mexer. Sem UI de grupo (multiConstrutora falso), não há como
        // expandir, então nesse caso sempre mostra aberto.
        const cAberta = multiConstrutora ? !!construtorasAbertas[c.id] : true;
        const toggleC = () => alternar(setConstrutorasAbertas, c.id);
        return (
          <div key={c.id}>
            {multiConstrutora && (
              <div
                className="mp-grupo"
                style={{ margin: "28px 0 14px" }}
                role="button"
                tabIndex={0}
                aria-expanded={cAberta}
                onClick={toggleC}
                onKeyDown={onEnterOuEspaco(toggleC)}
              >
                <ConstrutoraMark nome={c.nome} brand={c.brand} size={26} />
                <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{c.nome}</span>
                <Chevron aberto={cAberta} />
              </div>
            )}

            {cAberta &&
              c.empreendimentos.map((e) => {
                const eAberto = !empreendimentosFechados[e.id];
                const toggleE = () => alternar(setEmpreendimentosFechados, e.id);
                return (
                  <div key={e.id}>
                    <div
                      className="mp-grupo"
                      style={{ gap: 12, margin: "0 0 10px", paddingLeft: recuo }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={eAberto}
                      onClick={toggleE}
                      onKeyDown={onEnterOuEspaco(toggleE)}
                    >
                      <EmpreendimentoImagem url={e.imagemUrl} nome={e.nome} />
                      <div className="row gap-sm" style={{ flex: 1, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                        <span className="mp-emp-nome">{e.nome}</span>
                        <JanelaBadge itens={catalogo.listTodosItensDoEmpreendimento(e.id)} />
                      </div>
                      <button
                        type="button"
                        className="mp-btn-outline"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          baixarPlantas(catalogo.listPlantas(e.id), `do ${e.nome}`);
                        }}
                      >
                        <Download size={12} strokeWidth={2.2} /> Baixar plantas
                      </button>
                      <Chevron aberto={eAberto} />
                    </div>

                    {eAberto &&
                      e.unidades.map((u) => (
                        <UnidadeCard
                          key={u.vinculo.id}
                          u={u}
                          recuo={recuo}
                          resumo={resumirUnidade(solicitacoes, u.vinculo.id, u.valorImovel)}
                          aberta={!!unidadesAbertas[u.vinculo.id]}
                          ambientesAbertos={ambientesAbertos}
                          onToggle={() => alternar(setUnidadesAbertas, u.vinculo.id)}
                          onToggleAmbiente={(id) => alternar(setAmbientesAbertos, id)}
                          onVerTermo={setTermoAlvo}
                          onOptOut={() => {
                            setOptOutAlvo(u.vinculo.id);
                            setOptOutCiente(false);
                          }}
                          onRevogar={() => setRevogarAlvo(u.vinculo.id)}
                          onBaixarPlanta={() =>
                            baixarPlantas(
                              catalogo.listPlantas(u.vinculo.empreendimentoId).filter((p) => p.id === u.vinculo.plantaId),
                              `da ${u.vinculo.unidadeLabel}`,
                            )
                          }
                        />
                      ))}
                  </div>
                );
              })}
          </div>
        );
      })}

      <Modal
        open={!!optOutAlvo}
        onClose={fecharOptOut}
        title="Não personalizar esta unidade"
        icon={<AlertTriangle size={20} strokeWidth={2.2} style={{ color: "var(--alert-ink)", flexShrink: 0 }} />}
      >
        <p style={{ fontSize: 13, lineHeight: 1.5, color: "oklch(30% 0.010 90)", marginBottom: 16 }}>
          Ao assinar este termo, você declara que optou por <strong>não realizar nenhuma personalização</strong> nesta unidade. Ela será entregue
          integralmente conforme o memorial descritivo padrão do empreendimento, sem alterações de piso, metais, louças ou demais itens. Esta decisão
          pode ser revogada posteriormente, reiniciando o processo de personalização.
        </p>
        <label className="mp-ciente">
          <input type="checkbox" checked={optOutCiente} onChange={(ev) => setOptOutCiente(ev.target.checked)} />
          Estou ciente e confirmo que não desejo personalizar esta unidade.
        </label>
        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn--sm" onClick={fecharOptOut}>Cancelar</button>
          <button type="button" className="btn btn--sm mp-btn-assinar" disabled={!optOutCiente} onClick={confirmarOptOut}>
            Assinar termo
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!revogarAlvo}
        onClose={fecharRevogar}
        onConfirm={confirmarRevogar}
        title="Revogar termo de não personalização"
        description="O termo assinado será revogado e a personalização desta unidade será iniciada. Você poderá assinar um novo termo depois, se mudar de ideia."
        confirmLabel="Revogar e iniciar personalização"
      />

      <Modal open={!!termo} onClose={fecharTermo} title={termo?.titulo ?? ""} eyebrow={termo?.eyebrow} maxWidth={640}>
        {termo && (
          <>
            <div className="mp-termo-cabecalho">
              <div>
                <div className="mp-rotulo">Construtora</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{termo.construtora.nome}</div>
              </div>
              <div>
                <div className="mp-rotulo">Unidade</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {termo.unidade.vinculo.empreendimentoNome} — {termo.unidade.vinculo.unidadeLabel}, Torre {termo.unidade.vinculo.torre}
                </div>
              </div>
            </div>

            {termo.unidade.naoPersonalizadoEm ? (
              <div style={{ padding: 14, background: "var(--paper-2)", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                Cliente optou por não personalizar esta unidade — termo assinado em {fmtAssinatura(termo.unidade.naoPersonalizadoEm)}. A unidade segue
                integralmente o padrão de entrega do memorial descritivo.
              </div>
            ) : (
              <>
                <div className="mp-rotulo" style={{ fontWeight: 700, marginBottom: 10 }}>Itens</div>
                <div className="table-scroll" style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ minWidth: 520 }}>
                    <div className="mp-termo-linha mp-termo-linha--cabecalho">
                      <div>Ambiente</div><div>De</div><div>Para</div><div>Nível</div><div style={{ textAlign: "right" }}>Status</div>
                    </div>
                    {termo.itens.map((i) => (
                      <div key={`${i.ambiente}-${i.id}`} className="mp-termo-linha">
                        <div>{i.ambiente}</div><div>{i.de}</div><div>{i.para}</div><div>{nivelLabel(i.nivel)}</div>
                        <div className="mono" style={{ textAlign: "right" }}>{labelStatusItem(i.status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="row gap-sm" style={{ justifyContent: "flex-end", alignItems: "baseline", marginBottom: 24 }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Total em alterações aprovadas:</span>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--green-ink)" }}>{fmtBRLSinal(termoTotalAprovado)}</span>
                </div>
              </>
            )}

            <div className="grid grid-2" style={{ gap: 32 }}>
              <div className="text-center">
                <div style={{ borderBottom: "1px solid var(--ink)", paddingBottom: 32, marginBottom: 6 }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>Cliente</div>
              </div>
              <div className="text-center">
                <div style={{ borderBottom: "1px solid var(--ink)", paddingBottom: 32, marginBottom: 6 }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>{termo.construtora.nome}</div>
              </div>
            </div>

            {termoAlvo?.nivel === "unidade" && !termo.unidade.naoPersonalizadoEm && (
              <div style={{ textAlign: "right", marginTop: 20 }}>
                <Link to={`/termo/${termo.unidade.vinculo.id}`} className="btn btn--sm">Abrir documento completo</Link>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

function UnidadeCard({
  u,
  recuo,
  resumo,
  aberta,
  ambientesAbertos,
  onToggle,
  onToggleAmbiente,
  onVerTermo,
  onOptOut,
  onRevogar,
  onBaixarPlanta,
}: {
  u: UnidadeNo;
  recuo: number;
  resumo: ReturnType<typeof resumirUnidade>;
  aberta: boolean;
  ambientesAbertos: Record<string, boolean>;
  onToggle: () => void;
  onToggleAmbiente: (id: string) => void;
  onVerTermo: (alvo: TermoAlvo) => void;
  onOptOut: () => void;
  onRevogar: () => void;
  onBaixarPlanta: () => void;
}) {
  const { vinculo } = u;
  const optOut = !!u.naoPersonalizadoEm;
  const todosItens = u.ambientes.flatMap((a) => a.itens);
  const agg: Agregado = optOut ? { label: "Não personalizado", className: "badge--neutro" } : agregar(todosItens);
  // Ambientes são por unidade — o mesmo id de ambiente ("sala") se repete
  // entre unidades da mesma planta, então a chave de abertura inclui o vínculo.
  const chaveAmbiente = (ambienteId: string) => `${vinculo.id}::${ambienteId}`;

  return (
    <div className="mp-unidade" style={{ marginLeft: recuo }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{vinculo.unidadeLabel}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>
            Torre {vinculo.torre} · {vinculo.plantaNome}
          </div>
          <button type="button" className="mp-btn-outline mp-btn-outline--sm" onClick={onBaixarPlanta}>
            <Download size={11} strokeWidth={2.2} /> Baixar planta da unidade
          </button>
        </div>
        <div className="row gap-sm" style={{ alignItems: "center", flexShrink: 0 }}>
          <span className={`badge ${agg.className}`}>{agg.label}</span>
          <button
            type="button"
            className="mp-icon-btn"
            onClick={onToggle}
            aria-expanded={aberta}
            aria-label={aberta ? "Recolher ambientes" : "Expandir ambientes"}
          >
            <Chevron aberto={aberta} />
          </button>
        </div>
      </div>

      {optOut ? (
        <div className="mp-optout-aviso">
          <div className="row" style={{ alignItems: "flex-start", gap: 8 }}>
            <AlertTriangle size={16} strokeWidth={2.2} style={{ color: "var(--alert-ink)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>
              <strong>Cliente optou por não personalizar esta unidade.</strong>
              <br />
              Termo assinado em {fmtAssinatura(u.naoPersonalizadoEm!)}.
            </span>
          </div>
          <button type="button" className="mp-btn-revogar" onClick={onRevogar}>
            Revogar termo assinado e iniciar personalização
          </button>
        </div>
      ) : (
        <div className="mp-unidade-acoes">
          <button type="button" className="mp-btn-alerta" onClick={onOptOut}>
            <AlertTriangle size={14} strokeWidth={2.2} /> Assinar termo de não personalizar esta unidade
          </button>
          <button type="button" className="btn btn--primary mp-btn-termo" onClick={() => onVerTermo({ nivel: "unidade", vinculoId: vinculo.id })}>
            Ver termo da unidade
          </button>
        </div>
      )}

      {!optOut && (
        <div className="row" style={{ gap: 28, flexWrap: "wrap", marginBottom: aberta ? 16 : 0 }}>
          <Stat rotulo="Valor do imóvel" valor={fmtBRL(resumo.valorImovel)} />
          <Stat rotulo="Aprovado" valor={fmtBRLSinal(resumo.totalAprovado)} cor="var(--green-ink)" />
          <Stat rotulo="Pendente (estimado)" valor={fmtBRLSinal(resumo.totalPendente)} cor="var(--amber-ink)" />
          <Stat rotulo="Total" valor={fmtBRL(resumo.totalGeral)} destaque />
        </div>
      )}

      {aberta && (
        <>
          <div className="mp-secao-rotulo">
            <span>Ambientes</span>
            <span>
              {u.ambientes.length} ambientes · {todosItens.length} itens
            </span>
          </div>
          {u.ambientes.map((a) => {
            const aAberto = !!ambientesAbertos[chaveAmbiente(a.id)];
            const aAgg = agregar(a.itens);
            return (
              <div key={a.id} className="mp-ambiente">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{a.nome}</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{a.itens.length} itens</span>
                  </div>
                  <div className="row" style={{ alignItems: "center", gap: 8 }}>
                    {/* Neutro sobre o fundo tintado do ambiente vira branco, senão some. */}
                    <span className={`badge ${aAgg.className === "badge--neutro" ? "badge--neutro-claro" : aAgg.className}`}>{aAgg.label}</span>
                    <button
                      type="button"
                      className="mp-btn-outline"
                      style={{ color: "var(--ink)" }}
                      onClick={() => onVerTermo({ nivel: "ambiente", vinculoId: vinculo.id, ambienteId: a.id })}
                    >
                      Ver termo
                    </button>
                    <button
                      type="button"
                      className="mp-icon-btn mp-icon-btn--nu"
                      onClick={() => onToggleAmbiente(chaveAmbiente(a.id))}
                      aria-expanded={aAberto}
                      aria-label={aAberto ? `Recolher ${a.nome}` : `Expandir ${a.nome}`}
                    >
                      <Chevron aberto={aAberto} size={13} />
                    </button>
                  </div>
                </div>

                {aAberto && (
                  <div className="stack" style={{ marginTop: 10, gap: 8 }}>
                    {a.itens.map((i) => (
                      <div key={i.id} className="mp-item">
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            {i.solicitacaoId ? (
                              <Link to={`/personalizacoes/${i.solicitacaoId}`} className="mp-item-link">{i.nome}</Link>
                            ) : (
                              i.nome
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                            {i.de} → {i.para}
                          </div>
                        </div>
                        <div className="row" style={{ alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <NivelBadge nivel={i.nivel} />
                          <span className={`badge ${statusBadgeClass[i.status]}`}>{labelStatusItem(i.status)}</span>
                          <button
                            type="button"
                            className="mp-link-btn"
                            onClick={() => onVerTermo({ nivel: "item", vinculoId: vinculo.id, ambienteId: a.id, itemId: i.id })}
                          >
                            Ver termo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/** Foto do cadastro do empreendimento — ausente ou quebrada (URL fora do
 * ar), cai no mesmo estado "imagem indisponível", nunca num ícone de
 * imagem quebrada do navegador. */
function EmpreendimentoImagem({ url, nome }: { url: string | null; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  if (url && !falhou) return <img src={url} alt={nome} className="mp-emp-imagem" onError={() => setFalhou(true)} />;
  return (
    <span className="mp-emp-imagem mp-emp-imagem--vazia" title="Imagem indisponível" role="img" aria-label="Imagem indisponível">
      <ImageOff size={16} strokeWidth={1.8} />
    </span>
  );
}

function Stat({ rotulo, valor, cor, destaque }: { rotulo: string; valor: string; cor?: string; destaque?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 3 }}>{rotulo}</div>
      <div className="mono" style={{ fontSize: destaque ? 14 : 13.5, fontWeight: destaque ? 700 : 600, color: cor }}>
        {valor}
      </div>
    </div>
  );
}
