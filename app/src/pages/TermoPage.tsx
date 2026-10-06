import { useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { Breadcrumb } from "../components/Breadcrumb";
import { fmtBRL, formatTermoRef, isRemocao, resumirUnidade } from "../domain/calculations";
import { compose, email as emailValidator, required } from "../domain/validation";
import { statusDaUnidade } from "../domain/unidadeStatus";
import { useApp } from "../state/AppContext";

/**
 * Termo de alteração / memorial personalizado — documento gerado a partir
 * de dados reais (não mais uma linha fixa hardcoded), agregando TODAS as
 * personalizações aprovadas da unidade. Reachable pelo cliente ("Minhas
 * personalizações" → "Ver termo da unidade" → "Abrir documento completo") e pela construtora ("Ver
 * termo de alteração" em Aprovação) — por isso vive fora dos dois shells
 * de portal, com seu próprio guard de acesso.
 */
export function TermoPage() {
  const { vinculoId } = useParams<{ vinculoId: string }>();
  const { role, vinculos, solicitacoes, catalogo, registrarSemAlteracao, recusarSolicitacao } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [emailAssinatura, setEmailAssinatura] = useState("");
  const [erroEmail, setErroEmail] = useState<string>();

  if (!role) return <Navigate to="/" replace />;

  const vinculo = vinculos.find((v) => v.id === vinculoId);
  if (!vinculo) return <Navigate to={role === "construtora" ? "/painel" : "/personalizacoes"} replace />;

  const jaAssinouSemAlteracao = Boolean(vinculo.semAlteracaoAssinadaEm);
  const statusUnidade = statusDaUnidade(vinculo, solicitacoes);
  const emAssinatura = role === "cliente" && searchParams.get("declarar") === "1" && !jaAssinouSemAlteracao && statusUnidade === "nenhuma";

  // Cliente só enxerga o memorial/termo depois do processo realmente
  // encerrado (aprovado + pagamento confirmado pela construtora) ou da
  // declaração de não alteração — nunca com solicitação em análise ou
  // aprovada aguardando pagamento. Construtora sempre pode ver (é quem
  // confirma o pagamento a partir daqui).
  if (role === "cliente" && !emAssinatura && statusUnidade !== "concluido" && statusUnidade !== "sem_alteracao") {
    return <Navigate to="/minha-unidade" replace />;
  }

  function handleAssinar() {
    const erro = compose(required("Digite seu e-mail pra assinar"), emailValidator())(emailAssinatura);
    setErroEmail(erro);
    if (erro) return;
    const emAberto = solicitacoes.filter((s) => s.vinculoId === vinculo!.id && (s.status === "pendente" || s.status === "em_analise"));
    for (const s of emAberto) recusarSolicitacao(s.id);
    registrarSemAlteracao(vinculo!.id, true, emailAssinatura.trim());
    navigate(`/termo/${vinculo!.id}`, { replace: true });
  }

  const empreendimento = catalogo.getEmpreendimento(vinculo.id);
  const ambientes = catalogo.getAmbientes(vinculo.id);
  const aprovadas = solicitacoes
    .filter((s) => s.vinculoId === vinculo.id && s.status === "aprovado")
    .sort((a, b) => new Date(a.encerradoEm ?? a.abertoEm).getTime() - new Date(b.encerradoEm ?? b.abertoEm).getTime());

  const resumo = resumirUnidade(solicitacoes, vinculo.id, empreendimento?.valorImovel ?? 0);
  const totalCredito = aprovadas.filter(isRemocao).reduce((n, s) => n + (s.diferenca ?? 0), 0);
  const totalCusto = aprovadas.filter((s) => !isRemocao(s)).reduce((n, s) => n + (s.diferenca ?? 0), 0);

  const ambienteDoItem = (itemId: string) => ambientes.find((a) => a.itens.some((i) => i.id === itemId))?.nome ?? "—";
  const pareceres = aprovadas
    .filter((s) => s.nivel >= 2)
    .map((s) => ({ item: s.item, evento: s.timeline.find((t) => t.tipo === "aprovacao" || t.tipo === "parecer") }))
    .filter((p): p is { item: string; evento: NonNullable<typeof p.evento> } => Boolean(p.evento));

  const backTo = role === "construtora" ? "/painel" : emAssinatura ? "/minha-unidade" : "/personalizacoes";
  const backLabel = role === "construtora" ? "Painel" : emAssinatura ? "Minhas unidades" : "Minhas personalizações";
  const semAlteracao = jaAssinouSemAlteracao || emAssinatura;

  return (
    <div className="container container--narrow">
      <Breadcrumb items={[{ label: backLabel, to: backTo }, { label: semAlteracao ? "Termo de não alteração" : "Termo de alteração" }]} />
      <div className="card" style={{ padding: "40px 32px", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <BrandMark light={false} />
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>Motor de personalização em obra</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{semAlteracao ? "TERMO DE NÃO ALTERAÇÃO" : "TERMO DE ALTERAÇÃO"}</div>
            <div className="mono text-soft" style={{ fontSize: 12 }}>{formatTermoRef(vinculo)}</div>
            <div className="text-soft" style={{ fontSize: 12 }}>
              {emAssinatura
                ? "Aguardando assinatura"
                : `Emitido em ${new Date(vinculo.semAlteracaoAssinadaEm ?? Date.now()).toLocaleDateString("pt-BR")}`}
            </div>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "2px solid var(--rule)" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Construtora</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{vinculo.construtoraNome}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>Cliente</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{empreendimento?.comprador ?? "—"}</div>
            <div className="text-soft" style={{ fontSize: 13 }}>CPF: {empreendimento?.cpf ?? "—"} · {vinculo.unidadeLabel} · Torre {vinculo.torre}</div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Empreendimento</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 24 }}>{vinculo.empreendimentoNome} — Torre {vinculo.torre}, Unidade {vinculo.unidadeLabel}</div>

        {semAlteracao ? (
          <div className="card" style={{ background: "var(--paper)", border: "none", marginBottom: 24 }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              O(a) comprador(a) <strong>{empreendimento?.comprador ?? "—"}</strong> declara, para os devidos fins, que{" "}
              <strong>não deseja realizar nenhuma alteração ou customização de acabamento</strong> na unidade{" "}
              <strong>{vinculo.unidadeLabel}</strong>, Torre {vinculo.torre}, do empreendimento {vinculo.empreendimentoNome}. A unidade será
              entregue conforme o memorial descritivo e acabamento padrão da construtora, sem crédito ou custo adicional decorrente de
              personalização.
            </p>
          </div>
        ) : (
          <>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Alterações contratadas</div>
        {aprovadas.length === 0 ? (
          <div className="card text-soft" style={{ fontSize: 13, marginBottom: 24 }}>Nenhuma personalização aprovada ainda nesta unidade.</div>
        ) : (
          <div className="table-scroll" style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ minWidth: 620 }}>
              <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 0.5fr 0.7fr", padding: "10px 14px", background: "var(--paper)", fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", gap: 6 }}>
                <div>Ambiente</div><div>De (padrão)</div><div>Para (novo)</div><div>Nível</div><div style={{ textAlign: "right" }}>Diferença</div>
              </div>
              {aprovadas.map((s) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1fr 0.5fr 0.7fr", padding: "10px 14px", borderTop: "1px solid var(--paper-2)", fontSize: 12, gap: 6 }}>
                  <div>{ambienteDoItem(s.itemId)}</div>
                  <div>{s.de}</div>
                  <div>{s.para}</div>
                  <div>{s.nivel === 1 ? "Simples" : s.nivel === 2 ? "Técnico" : "Proibido"}</div>
                  <div className="mono" style={{ textAlign: "right", color: isRemocao(s) ? "var(--green-ink)" : "var(--red-ink)" }}>
                    {isRemocao(s) ? "+" : "−"}{fmtBRL(s.diferenca ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-4" style={{ marginBottom: 28, padding: 16, background: "var(--paper)", borderRadius: 10 }}>
          <div className="text-center" style={{ gridColumn: "span 1" }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>Total créditos</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--green-ink)" }}>+{fmtBRL(totalCredito)}</div>
          </div>
          <div className="text-center" style={{ gridColumn: "span 1" }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>Total custos</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: "var(--red-ink)" }}>−{fmtBRL(totalCusto)}</div>
          </div>
          <div className="text-center" style={{ gridColumn: "span 2" }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>{resumo.totalAprovado >= 0 ? "Saldo a pagar" : "Saldo a favor do cliente"}</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: resumo.totalAprovado >= 0 ? "var(--red-ink)" : "var(--green-ink)" }}>
              {fmtBRL(Math.abs(resumo.totalAprovado))}
            </div>
          </div>
        </div>

        {pareceres.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Aprovação técnica</div>
            <div className="stack gap-sm" style={{ marginBottom: 28 }}>
              {pareceres.map(({ item, evento }, i) => (
                <div key={i} style={{ padding: 14, border: "1px solid var(--rule)", borderRadius: 8, fontSize: 13 }}>
                  <div style={{ marginBottom: 4 }}>
                    Item técnico: <strong>{item}</strong> — aprovado por <strong>{evento.autor}</strong>
                  </div>
                  <div className="text-soft">Parecer: "{evento.texto}"</div>
                </div>
              ))}
            </div>
          </>
        )}
          </>
        )}

        {emAssinatura ? (
          <div className="card" style={{ background: "var(--paper)", border: "1px solid var(--rule)", marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>
              Assinatura do cliente
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 14, lineHeight: 1.5 }}>
              Digite seu e-mail pra assinar este termo digitalmente. Ao confirmar, qualquer solicitação em andamento nesta unidade é
              descartada automaticamente.
            </p>
            <div style={{ maxWidth: 360, marginBottom: 14 }}>
              <label className="label">E-mail</label>
              <input
                className={erroEmail ? "input input--invalid" : "input"}
                type="email"
                value={emailAssinatura}
                placeholder="voce@email.com"
                onChange={(e) => { setEmailAssinatura(e.target.value); setErroEmail(undefined); }}
                onBlur={() => setErroEmail(compose(required("Digite seu e-mail pra assinar"), emailValidator())(emailAssinatura))}
              />
              {erroEmail && <div style={{ fontSize: 11.5, color: "var(--red-ink)", marginTop: 4 }}>{erroEmail}</div>}
            </div>
            <div className="row gap-sm">
              <button type="button" className="btn btn--sm" onClick={() => navigate(backTo)}>Cancelar</button>
              <button type="button" className="btn btn--sm btn--primary" onClick={handleAssinar}>Assinar termo</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-2" style={{ gap: 40, marginBottom: 24, paddingTop: 20, borderTop: "2px solid var(--rule)" }}>
              <div className="text-center">
                {jaAssinouSemAlteracao && vinculo.semAlteracaoAssinadaPor ? (
                  <div style={{ paddingBottom: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green-ink)", marginBottom: 4 }}>✓ Assinado digitalmente</div>
                    <div className="mono" style={{ fontSize: 12 }}>{vinculo.semAlteracaoAssinadaPor}</div>
                  </div>
                ) : (
                  <div style={{ borderBottom: "1px solid var(--ink)", paddingBottom: 40, marginBottom: 8 }} />
                )}
                <div style={{ fontSize: 13, fontWeight: 600 }}>{empreendimento?.comprador ?? "—"}</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Cliente — CPF {empreendimento?.cpf ?? "—"}</div>
              </div>
              <div className="text-center">
                <div style={{ borderBottom: "1px solid var(--ink)", paddingBottom: 40, marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>{vinculo.construtoraNome}</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Representante legal</div>
              </div>
            </div>

            <div className="text-center text-soft" style={{ fontSize: 10, paddingTop: 16, borderTop: "1px solid var(--paper-2)" }}>
              Documento gerado automaticamente pela plataforma plantta · Assinatura digital conforme MP 2.200-2/2001
            </div>
          </>
        )}
      </div>
    </div>
  );
}
