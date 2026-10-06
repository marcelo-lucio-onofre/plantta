import { Link, Navigate, useParams } from "react-router-dom";
import { Breadcrumb } from "../components/Breadcrumb";
import { PreviewAlteracao } from "../components/PreviewAlteracao";
import { Timeline } from "../components/Timeline";
import { fmtDataHora, formatSolicitacaoRef, isEditavel, statusLabel, tempoDecorrido } from "../domain/calculations";
import { useApp } from "../state/AppContext";

const PARAMETRICOS = new Set(["eletrica_sala", "hidraulica"]);

export function PersonalizacaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { solicitacoes, vinculos, selecionarVinculo, catalogo, activeVinculo, vinculoChoices } = useApp();

  const solicitacao = solicitacoes.find((s) => s.id === id);
  if (!solicitacao) return <Navigate to="/personalizacoes" replace />;

  const vinculo = vinculos.find((v) => v.id === solicitacao.vinculoId);
  const ref = vinculo ? formatSolicitacaoRef(vinculo, solicitacao.id) : solicitacao.id;
  const editavel = isEditavel(solicitacao);
  const editLink = PARAMETRICOS.has(solicitacao.itemId) ? "/calculadora" : `/selecao/${solicitacao.itemId}`;
  const aberta = !solicitacao.encerradoEm;

  // Solicitação guarda só rótulos (de/para), não ids de opção — casa pelo
  // nome da opção do catálogo. Sem match (ex.: material próprio, item
  // paramétrico) o bloco "Como fica" simplesmente não aparece.
  const ambienteDoItem = vinculo ? catalogo.getAmbientes(vinculo.id).find((a) => a.itens.some((i) => i.id === solicitacao.itemId)) : undefined;
  const itemDaSolicitacao = ambienteDoItem?.itens.find((i) => i.id === solicitacao.itemId);
  const casa = (rotulo: string) => itemDaSolicitacao?.opcoes.find((o) => o.nome === rotulo || o.nome.includes(rotulo) || rotulo.includes(o.nome));
  const opcaoPara = itemDaSolicitacao ? casa(solicitacao.para) : undefined;
  const opcaoDe = itemDaSolicitacao ? (casa(solicitacao.de) ?? itemDaSolicitacao.opcoes.find((o) => o.padrao)) : undefined;

  return (
    <div className="container container--narrow">
      <Breadcrumb items={[{ label: "Minhas personalizações", to: "/personalizacoes" }, { label: ref }]} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{solicitacao.item}</h1>
          {vinculo && (
            <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              {vinculo.empreendimentoNome} · {vinculo.unidadeLabel} · Torre {vinculo.torre}
            </div>
          )}
        </div>
        <span className="badge badge--tecnico">{statusLabel(solicitacao.status)}</span>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Alteração</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>{solicitacao.de} → {solicitacao.para}</div>
          {solicitacao.diferenca != null && (
            <div className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>Diferença: R$ {solicitacao.diferenca.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          )}
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Prazos</div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Aberta em {fmtDataHora(solicitacao.abertoEm)}</div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>
            {aberta ? `${tempoDecorrido(solicitacao.abertoEm)} em aberto` : `Resolvida em ${tempoDecorrido(solicitacao.abertoEm, solicitacao.encerradoEm)}`}
          </div>
          {solicitacao.responsavel && <div style={{ fontSize: 13 }}>Analisando: <strong>{solicitacao.responsavel}</strong></div>}
        </div>
      </div>

      {vinculo && ambienteDoItem && itemDaSolicitacao && opcaoPara && (
        <div style={{ marginBottom: 24 }}>
          <PreviewAlteracao
            vinculo={vinculo}
            ambiente={ambienteDoItem}
            item={itemDaSolicitacao}
            escolhasBase={activeVinculo?.id === vinculo.id ? vinculoChoices : {}}
            de={opcaoDe}
            para={opcaoPara}
          />
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 14 }}>Linha do tempo</div>
        <Timeline events={solicitacao.timeline} />
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link to="/personalizacoes" className="btn">Voltar</Link>
        {editavel ? (
          <Link to={editLink} className="btn btn--primary" onClick={() => selecionarVinculo(solicitacao.vinculoId)}>
            Editar escolha
          </Link>
        ) : (
          <span className="text-soft" style={{ fontSize: 13, alignSelf: "center" }}>
            Atendimento já iniciado — não é mais possível editar.
          </span>
        )}
      </div>
    </div>
  );
}
