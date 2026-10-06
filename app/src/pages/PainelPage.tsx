import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GripVertical } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { NivelBadge, PrazoBadge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { useToast } from "../components/Toast";
import { fmtBRL } from "../domain/calculations";
import { statusDaUnidade } from "../domain/unidadeStatus";
import type { Item, Solicitacao, StatusSolicitacao, Vinculo } from "../domain/types";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";

const COLUNAS: { key: StatusSolicitacao; label: string; ink: string; bg: string }[] = [
  { key: "pendente", label: "Pendente", ink: "var(--amber-ink)", bg: "var(--amber-bg)" },
  { key: "em_analise", label: "Em análise", ink: "var(--violet-ink)", bg: "var(--violet-bg)" },
  { key: "aguardando_pagamento", label: "Aguardando pagamento", ink: "var(--blue-strong)", bg: "var(--blue-bg)" },
  { key: "aprovado", label: "Aprovado", ink: "var(--green-ink)", bg: "var(--green-bg)" },
  { key: "recusado", label: "Recusado", ink: "var(--red-ink)", bg: "var(--red-bg)" },
];

/** Depois de "aguardando pagamento" o card já teve uma decisão — o
 * separador marca visualmente que aprovado/recusado são desfecho, não mais
 * etapas de triagem (pendente → em análise → aguardando pagamento). */
const SEPARADOR_APOS: StatusSolicitacao = "aguardando_pagamento";

/** Distância mínima (px) pra um pointerdown virar arraste em vez de toque/clique. */
const LIMIAR_ARRASTE = 8;

function SolicitacaoCard({
  r,
  item,
  dragging,
  onPointerDown,
  onAbrirDetalhe,
}: {
  r: Solicitacao;
  item: Item | undefined;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onAbrirDetalhe: () => void;
}) {
  return (
    <div className="card" style={{ position: "relative", padding: "14px 58px 14px 14px", opacity: dragging ? 0.45 : 1 }}>
      {/* Botão, não Link — abre detalhe no modal, sem sair do quadro. Não
          carrega mais o arraste: no celular, tocar em qualquer ponto do
          card pra rolar a página competia com o gesto de arrastar (o card
          inteiro tinha touchAction:none). O arraste agora fica só na alça
          à direita. */}
      <button type="button" onClick={onAbrirDetalhe} style={{ all: "unset", display: "block", width: "100%", cursor: "pointer" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--blue-strong)", fontWeight: 500 }}>{r.id}</span>
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{r.diferenca != null ? "+" + fmtBRL(r.diferenca) : "—"}</span>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{r.cliente}</div>
        <div className="text-soft" style={{ fontSize: 11.5, marginBottom: 8 }}>{r.unidade} · Torre {r.torre}</div>
        <div style={{ fontSize: 12.5, marginBottom: 2 }}>{r.item}</div>
        <div className="text-soft" style={{ fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>{r.de} → {r.para}</div>
        <div className="row gap-xs" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <NivelBadge nivel={r.nivel} />
          {item && <PrazoBadge item={item} />}
          <span className="text-soft mono" style={{ fontSize: 10.5, marginLeft: "auto" }}>{r.data}</span>
        </div>
      </button>

      {/* Alça de arraste — única área que inicia o arraste (touchAction:none
          só aqui), pra deixar o resto do card livre pro scroll normal da
          página no celular. Alvo de toque de 44px de largura, altura toda
          do card. */}
      <div
        onPointerDown={onPointerDown}
        aria-hidden="true"
        title="Arrastar para mudar status"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          bottom: 8,
          width: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          color: "var(--ink-softer)",
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <GripVertical size={18} />
      </div>
    </div>
  );
}

/**
 * Painel = tela inicial da construtora. Estados da solicitação viram
 * colunas Kanban (arrasta o card pra mudar status, como Trello). Card só
 * mostra o resumo; clicar/tocar sem arrastar abre modal com todos os
 * detalhes e o select "Mover status" — o modal também é a alternativa por
 * teclado ao arraste, exigida pela WCAG 2.2.
 *
 * Arraste usa Pointer Events (não a API nativa HTML5 Drag and Drop, que só
 * funciona com mouse) — assim funciona igual no desktop e no toque do
 * celular. `dragInfo` rastreia o pointerdown; só vira arraste de verdade
 * (opacidade no card, coluna destacada) depois de LIMIAR_ARRASTE de
 * movimento — abaixo disso é um toque/clique normal, e o próprio botão do
 * card dispara a abertura do modal.
 */
export function PainelPage() {
  const { solicitacoes, vinculos, catalogo, construtoraLogadaId, moverStatusSolicitacao, confirmarPagamento } = useApp();
  const { runComLoading } = useLoading();
  const toast = useToast();
  const [statusFiltro, setStatusFiltro] = useState<StatusSolicitacao | "todos">("todos");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<StatusSolicitacao | null>(null);

  // Reforço além do preventDefault no pointerdown (ver iniciarArraste) —
  // alguns navegadores (Safari) ainda estendem seleção de texto de
  // ancestrais durante o arraste sem isso.
  useEffect(() => {
    if (!draggingId) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [draggingId]);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const dragInfo = useRef<{ id: string; startX: number; startY: number; dragging: boolean } | null>(null);
  /** Um drag de verdade dispara um click logo depois (mouseup/touchend do
   * navegador não sabem do nosso drag via pointer events) — essa flag
   * suprime esse click fantasma pra não reabrir o modal após soltar o card. */
  const suprimirCliqueRef = useRef(false);

  const construtoraNome = vinculos.find((v) => v.construtoraId === construtoraLogadaId)?.construtoraNome ?? "Construtora";
  const minhas = construtoraLogadaId ? solicitacoes.filter((s) => s.construtoraId === construtoraLogadaId) : solicitacoes;
  const detalhe = detalheId ? minhas.find((s) => s.id === detalheId) : undefined;

  const meusVinculos = construtoraLogadaId ? vinculos.filter((v) => v.construtoraId === construtoraLogadaId) : vinculos;
  const aguardandoPagamento = meusVinculos.filter((v) => statusDaUnidade(v, solicitacoes) === "aguardando_pagamento");

  function handleConfirmarPagamento(v: Vinculo) {
    runComLoading(() => confirmarPagamento(v.id), "Confirmando pagamento...").then(() => {
      toast.success(`Pagamento confirmado — ${v.unidadeLabel} já pode gerar o termo.`);
    });
  }

  function itemDaSolicitacao(s: Solicitacao): Item | undefined {
    const vinculo = vinculos.find((v) => v.id === s.vinculoId);
    if (!vinculo) return undefined;
    for (const amb of catalogo.getAmbientes(vinculo.id)) {
      const item = amb.itens.find((i) => i.id === s.itemId);
      if (item) return item;
    }
    return undefined;
  }

  function colunaNoPonto(x: number, y: number): StatusSolicitacao | null {
    const el = document.elementFromPoint(x, y);
    const colEl = el instanceof Element ? el.closest<HTMLElement>("[data-coluna]") : null;
    return (colEl?.dataset.coluna as StatusSolicitacao | undefined) ?? null;
  }

  function handlePointerMove(e: PointerEvent) {
    const info = dragInfo.current;
    if (!info) return;
    const dx = e.clientX - info.startX;
    const dy = e.clientY - info.startY;
    if (!info.dragging && Math.hypot(dx, dy) > LIMIAR_ARRASTE) {
      info.dragging = true;
      setDraggingId(info.id);
    }
    if (info.dragging) {
      e.preventDefault();
      setDragOverKey(colunaNoPonto(e.clientX, e.clientY));
    }
  }

  function handlePointerUp(e: PointerEvent) {
    const info = dragInfo.current;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    if (info?.dragging) {
      suprimirCliqueRef.current = true;
      const status = colunaNoPonto(e.clientX, e.clientY);
      if (status) moverStatusSolicitacao(info.id, status);
    }
    dragInfo.current = null;
    setDraggingId(null);
    setDragOverKey(null);
  }

  function iniciarArraste(e: React.PointerEvent, id: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Sem isso, mover o mouse antes do LIMIAR_ARRASTE já dispara a seleção
    // de texto nativa do navegador (o pointerdown vira início de um
    // "arrastar pra selecionar" comum), pintando os cards de azul em vez
    // de arrastar o card.
    e.preventDefault();
    dragInfo.current = { id, startX: e.clientX, startY: e.clientY, dragging: false };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  const statusCounts: Record<StatusSolicitacao, number> = { pendente: 0, em_analise: 0, aguardando_pagamento: 0, aprovado: 0, recusado: 0 };
  for (const s of minhas) statusCounts[s.status]++;

  const visiveis = statusFiltro === "todos" ? minhas : minhas.filter((s) => s.status === statusFiltro);

  return (
    <div className="container container--wide">
      <Breadcrumb items={[{ label: "Construtora" }, { label: "Painel" }]} />
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Fila de solicitações</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>{construtoraNome}</p>
      </div>

      {aguardandoPagamento.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>
            Unidades aguardando pagamento
          </div>
          <DataTable
            columns={[
              {
                key: "empreendimento",
                header: "Empreendimento",
                render: (v) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{v.empreendimentoNome}</div>
                    <div className="text-soft" style={{ fontSize: 11.5 }}>{v.unidadeLabel} · Torre {v.torre}</div>
                  </div>
                ),
              },
              { key: "cliente", header: "Cliente", render: (v) => catalogo.getEmpreendimento(v.id)?.comprador ?? "—" },
              {
                key: "situacao",
                header: "Situação",
                render: () => <span className="badge badge--info">Aguardando pagamento</span>,
              },
            ]}
            rows={aguardandoPagamento}
            rowKey={(v) => v.id}
            emptyMessage=""
            actions={(v) => (
              <>
                <Link to={`/termo/${v.id}`} className="btn btn--sm" title="Ver termo de alteração">
                  Ver termo
                </Link>
                <button type="button" className="btn btn--sm btn--confirm" onClick={() => handleConfirmarPagamento(v)}>
                  Confirmar pagamento
                </button>
              </>
            )}
          />
        </div>
      )}

      <div className="row gap-sm" style={{ flexWrap: "wrap", marginBottom: 24 }}>
        <button
          type="button"
          className="btn btn--sm"
          aria-pressed={statusFiltro === "todos"}
          style={statusFiltro === "todos" ? { background: "color-mix(in srgb, var(--brand) 14%, var(--card))", borderColor: "var(--brand)", color: "var(--brand)" } : {}}
          onClick={() => setStatusFiltro("todos")}
        >
          Todos os status <span className="mono" style={{ opacity: 0.7, marginLeft: 4 }}>{minhas.length}</span>
        </button>
        {COLUNAS.map((col) => {
          const active = statusFiltro === col.key;
          return (
            <button
              key={col.key}
              type="button"
              className="btn btn--sm"
              aria-pressed={active}
              style={active ? { background: "color-mix(in srgb, var(--brand) 14%, var(--card))", borderColor: "var(--brand)", color: "var(--brand)" } : {}}
              onClick={() => setStatusFiltro(col.key)}
            >
              {col.label} <span className="mono" style={{ opacity: 0.7, marginLeft: 4 }}>{statusCounts[col.key]}</span>
            </button>
          );
        })}
      </div>

      <div className="row gap-sm" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        {COLUNAS.map((col) => {
          const itens = visiveis.filter((s) => s.status === col.key);
          const sobreColuna = dragOverKey === col.key;
          const precedeSeparador = COLUNAS[COLUNAS.findIndex((c) => c.key === col.key) - 1]?.key === SEPARADOR_APOS;
          return (
            <Fragment key={col.key}>
              {precedeSeparador && (
                <div
                  aria-hidden="true"
                  style={{ alignSelf: "stretch", width: 1, minHeight: 200, background: "var(--rule-strong)", flexShrink: 0 }}
                />
              )}
              <div
                data-coluna={col.key}
                style={{
                  flex: "1 1 270px",
                  minWidth: 260,
                  background: "var(--paper)",
                  border: sobreColuna ? "2px dashed var(--brand)" : "1px solid var(--rule)",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div className="row gap-xs" style={{ alignItems: "center", marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.ink, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{col.label}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: col.ink, background: col.bg, borderRadius: 999, padding: "1px 8px", marginLeft: "auto" }}>
                    {itens.length}
                  </span>
                </div>

                <div className="stack gap-sm">
                  {itens.map((r) => (
                    <SolicitacaoCard
                      key={r.id}
                      r={r}
                      item={itemDaSolicitacao(r)}
                      dragging={draggingId === r.id}
                      onPointerDown={(e) => iniciarArraste(e, r.id)}
                      onAbrirDetalhe={() => {
                        if (suprimirCliqueRef.current) {
                          suprimirCliqueRef.current = false;
                          return;
                        }
                        setDetalheId(r.id);
                      }}
                    />
                  ))}
                  {itens.length === 0 && (
                    <div className="text-soft" style={{ fontSize: 12, textAlign: "center", padding: "16px 4px" }}>
                      Nenhuma solicitação aqui.
                    </div>
                  )}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      <Modal open={detalhe != null} onClose={() => setDetalheId(null)} title={detalhe ? `Solicitação ${detalhe.id}` : ""}>
        {detalhe && (
          <div className="stack gap-sm">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{detalhe.cliente}</div>
              <div className="text-soft" style={{ fontSize: 12.5 }}>{detalhe.unidade} · Torre {detalhe.torre} · Solicitado em {detalhe.data}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{detalhe.item}</div>
              <div className="text-soft" style={{ fontSize: 12.5 }}>{detalhe.de} → {detalhe.para}</div>
            </div>
            <div className="row gap-xs" style={{ alignItems: "center", flexWrap: "wrap" }}>
              <NivelBadge nivel={detalhe.nivel} />
              {itemDaSolicitacao(detalhe) && <PrazoBadge item={itemDaSolicitacao(detalhe)!} />}
            </div>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
              <span className="text-soft">Diferença</span>
              <span className="mono" style={{ fontWeight: 700 }}>{detalhe.diferenca != null ? "+" + fmtBRL(detalhe.diferenca) : "—"}</span>
            </div>
            <div>
              <label className="label">Mover status</label>
              <select
                className="input"
                value={detalhe.status}
                onChange={(e) => moverStatusSolicitacao(detalhe.id, e.target.value as StatusSolicitacao)}
              >
                {COLUNAS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <Link to={`/aprovacao/${detalhe.id}`} className="btn btn--sm" style={{ alignSelf: "flex-start" }}>
              Ver solicitação completa
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
