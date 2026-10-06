import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Alert } from "../components/Alert";
import { Breadcrumb } from "../components/Breadcrumb";
import { NivelBadge } from "../components/Badge";
import { Timeline } from "../components/Timeline";
import { MoedaInput } from "../components/MaskedInput";
import { useToast } from "../components/Toast";
import { fmtBRL } from "../domain/calculations";
import type { CustoExtra } from "../domain/types";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";

const gerarIdCusto = () => `custo-${Date.now()}-${Math.round(Math.random() * 10000)}`;

/** Propostas de fornecedor chegam como texto livre do cliente ("R$ 1.200",
 * "1200,00"...) — melhor esforço pra extrair um número, não uma validação
 * financeira de verdade (fora de escopo do protótipo). */
function parseValorLivre(v: string): number {
  const limpo = v.replace(/[^\d,.-]/g, "");
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export function AprovacaoPage() {
  const { id } = useParams<{ id: string }>();
  const { solicitacoes, aprovarSolicitacao, recusarSolicitacao, registrarCustosExtras } = useApp();
  const { runComLoading } = useLoading();
  const toast = useToast();
  const [observacao, setObservacao] = useState("");
  const [propostaEscolhida, setPropostaEscolhida] = useState<number | null>(null);
  const [custosExtras, setCustosExtras] = useState<CustoExtra[]>([]);

  const solicitacao = solicitacoes.find((s) => s.id === id);
  if (!solicitacao) return <Navigate to="/painel" replace />;

  const aguardandoPagamento = solicitacao.status === "aguardando_pagamento";
  const approved = solicitacao.status === "aprovado";
  const recusado = solicitacao.status === "recusado";
  const resolvido = approved || recusado || aguardandoPagamento;
  const materialProprio = solicitacao.materialProprio;
  const custosExtrasFinais = resolvido ? (solicitacao.custosExtras ?? []) : custosExtras;
  const valorMaterialFinal =
    materialProprio && propostaEscolhida != null ? parseValorLivre(materialProprio.propostas[propostaEscolhida].valor) : 0;
  const totalCustosExtras = custosExtrasFinais.reduce((n, c) => n + c.valor, 0);
  const podeAprovar = !materialProprio || propostaEscolhida != null;

  const solicitacaoId = solicitacao.id;
  function handleAprovar() {
    runComLoading(() => {
      if (materialProprio && propostaEscolhida != null) {
        registrarCustosExtras(solicitacaoId, valorMaterialFinal, custosExtras);
      }
      aprovarSolicitacao(solicitacaoId);
    }, "Aprovando solicitação...").then(() => {
      toast.success("Solicitação aprovada — aguardando pagamento do cliente.");
    });
  }

  function handleRecusar() {
    runComLoading(() => recusarSolicitacao(solicitacaoId), "Recusando solicitação...").then(() => {
      toast.success("Solicitação recusada.");
    });
  }

  function addCustoExtra() {
    setCustosExtras((cs) => [...cs, { id: gerarIdCusto(), descricao: "", valor: 0 }]);
  }
  function atualizarCustoExtra(idc: string, patch: Partial<CustoExtra>) {
    setCustosExtras((cs) => cs.map((c) => (c.id === idc ? { ...c, ...patch } : c)));
  }
  function removerCustoExtra(idc: string) {
    setCustosExtras((cs) => cs.filter((c) => c.id !== idc));
  }

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Painel", to: "/painel" }, { label: solicitacao.id }]} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Aprovação técnica</h1>
          <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>Solicitação de nível técnico — requer responsável técnico</div>
        </div>
        <NivelBadge nivel={solicitacao.nivel} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Dados do cliente</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}><strong>{solicitacao.cliente}</strong></div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{solicitacao.unidade} · Torre {solicitacao.torre}</div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Solicitado em {solicitacao.data}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Alteração solicitada</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}><strong>{solicitacao.item}</strong></div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>De: {solicitacao.de} → Para: {solicitacao.para}</div>
        </div>
      </div>

      {materialProprio && (
        <div className="card" style={{ marginBottom: 24, borderStyle: "dashed" }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase" }}>Material próprio — decisão financeira</div>
            <span className="badge badge--tecnico">Fora do catálogo</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{materialProprio.materialNome}</div>
          <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 16 }}>Referência: {materialProprio.referencia}</div>

          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8 }}>
            Escolha a proposta vencedora
          </div>
          <div className="stack gap-xs" style={{ marginBottom: 18 }}>
            {materialProprio.propostas.map((p, i) => {
              const sel = propostaEscolhida === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={resolvido}
                  onClick={() => setPropostaEscolhida(i)}
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: sel ? "2px solid var(--brand)" : "1px solid var(--rule)",
                    background: sel ? "var(--blue-bg)" : "var(--card)",
                    cursor: resolvido ? "default" : "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.fornecedor}</span>
                  <span className="mono" style={{ fontSize: 13 }}>{p.valor}</span>
                </button>
              );
            })}
          </div>

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase" }}>
              Custos extras (mão de obra, instalação, frete...)
            </div>
            {!resolvido && (
              <button type="button" className="btn btn--sm" onClick={addCustoExtra}>
                <Plus className="sidebar-nav-icon" /> Custo extra
              </button>
            )}
          </div>
          {custosExtrasFinais.length === 0 && (
            <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 12 }}>Nenhum custo extra adicionado — só o valor da proposta escolhida.</div>
          )}
          <div className="stack gap-xs" style={{ marginBottom: 16 }}>
            {custosExtrasFinais.map((c) => (
              <div key={c.id} className="row gap-sm" style={{ alignItems: "center" }}>
                {resolvido ? (
                  <>
                    <span style={{ flex: 1, fontSize: 13 }}>{c.descricao || "—"}</span>
                    <span className="mono" style={{ fontSize: 13 }}>{fmtBRL(c.valor)}</span>
                  </>
                ) : (
                  <>
                    <input
                      className="input"
                      style={{ flex: 1, minWidth: 0 }}
                      value={c.descricao}
                      placeholder="Ex.: Mão de obra de instalação"
                      onChange={(e) => atualizarCustoExtra(c.id, { descricao: e.target.value })}
                    />
                    <MoedaInput style={{ width: 140, flexShrink: 0 }} value={c.valor} onChange={(n) => atualizarCustoExtra(c.id, { valor: n })} />
                    <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4, flexShrink: 0 }} onClick={() => removerCustoExtra(c.id)} aria-label="Remover custo extra">
                      <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="row" style={{ justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--rule)", fontWeight: 700, fontSize: 15 }}>
            <span>Total a cobrar do cliente</span>
            <span className="mono">{fmtBRL(resolvido ? (solicitacao.diferenca ?? 0) : valorMaterialFinal + totalCustosExtras)}</span>
          </div>
        </div>
      )}

      {solicitacao.id === "SOL-003" && (
        <div className="card table-scroll" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 12 }}>Cálculo paramétrico</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "6px 20px", fontSize: 13, paddingBottom: 12, borderBottom: "1px solid var(--paper-2)", minWidth: 380 }}>
            <div style={{ fontWeight: 600, color: "var(--ink-soft)" }}>Componente</div>
            <div className="mono" style={{ textAlign: "right", fontWeight: 600, color: "var(--ink-soft)" }}>Unit.</div>
            <div className="mono" style={{ textAlign: "right", fontWeight: 600, color: "var(--ink-soft)" }}>Qtd</div>
            <div className="mono" style={{ textAlign: "right", fontWeight: 600, color: "var(--ink-soft)" }}>Subtotal</div>
            <div>Conduíte/mangueira</div><div className="mono" style={{ textAlign: "right" }}>R$ 12,50</div><div className="mono" style={{ textAlign: "right" }}>12</div><div className="mono" style={{ textAlign: "right" }}>R$ 150,00</div>
            <div>Fio/cabo</div><div className="mono" style={{ textAlign: "right" }}>R$ 8,30</div><div className="mono" style={{ textAlign: "right" }}>12</div><div className="mono" style={{ textAlign: "right" }}>R$ 99,60</div>
            <div>Disjuntor/circuito</div><div className="mono" style={{ textAlign: "right" }}>R$ 45,00</div><div className="mono" style={{ textAlign: "right" }}>12</div><div className="mono" style={{ textAlign: "right" }}>R$ 540,00</div>
            <div>Mão de obra</div><div className="mono" style={{ textAlign: "right" }}>R$ 85,00</div><div className="mono" style={{ textAlign: "right" }}>12</div><div className="mono" style={{ textAlign: "right" }}>R$ 1.020,00</div>
          </div>
          <div className="row" style={{ justifyContent: "space-between", paddingTop: 12, fontWeight: 700, fontSize: 15 }}>
            <span>Custo adicional total</span>
            <span className="mono">{fmtBRL(1809.6, 2)}</span>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 14 }}>Linha do tempo</div>
        <Timeline events={solicitacao.timeline} />
        {solicitacao.status === "em_analise" && (
          <div style={{ marginTop: 10 }}>
            <Alert variante="pendente" titulo="Aguardando parecer técnico">
              O time técnico responde em até 2 dias úteis.
            </Alert>
          </div>
        )}
        {aguardandoPagamento && (
          <div style={{ marginTop: 10 }}>
            <Alert variante="info" titulo="Aguardando pagamento do cliente">
              Aprovada tecnicamente — falta o cliente pagar pra virar "Aprovado" de fato.
            </Alert>
          </div>
        )}
      </div>

      <div className="card" style={{ border: "2px solid var(--green)" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: "var(--green-ink)" }}>Parecer do responsável técnico</div>
        <div className="grid grid-2" style={{ marginBottom: 14 }}>
          <div>
            <label className="label">Responsável técnico</label>
            <input className="input" value={solicitacao.responsavel ?? "Eng. Carlos Medeiros — CREA 12345/SP"} readOnly />
          </div>
          <div>
            <label className="label">Registro profissional</label>
            <input className="input" value="CREA 12345/SP" readOnly />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Observações técnicas</label>
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical" }}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: Verificada capacidade do quadro elétrico — suporta 12 pontos adicionais sem troca de disjuntor geral."
          />
        </div>
        <div className="row gap-sm">
          <button
            type="button"
            className={resolvido && !recusado ? "btn" : "btn btn--confirm"}
            style={
              approved
                ? { background: "var(--green-bg)", color: "var(--green-ink)", border: "none" }
                : aguardandoPagamento
                  ? { background: "var(--blue-bg)", color: "var(--blue-strong)", border: "none" }
                  : undefined
            }
            disabled={resolvido || !podeAprovar}
            title={!podeAprovar ? "Escolha a proposta vencedora do material próprio antes de aprovar" : undefined}
            onClick={handleAprovar}
          >
            {approved ? "Aprovado ✓" : aguardandoPagamento ? "Aguardando pagamento" : "Aprovar com assinatura digital"}
          </button>
          <button type="button" className="btn" disabled={resolvido}>Solicitar informação adicional</button>
          <button
            type="button"
            className="btn btn--danger-text"
            disabled={resolvido}
            onClick={handleRecusar}
          >
            {recusado ? "Recusado" : "Recusar com justificativa"}
          </button>
          {approved && (
            <Link to={`/termo/${solicitacao.vinculoId}`} className="btn" style={{ marginLeft: "auto" }}>
              Ver termo de alteração
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
