import { useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { UnidadesHeatmap } from "../components/CatalogoAuthoring";
import { useApp } from "../state/AppContext";

/**
 * Ação "Vendas" da listagem de empreendimentos — só plota as unidades e,
 * ao clicar, abre modal com valor + cliente (autocomplete contra as
 * Pessoas já cadastradas como Cliente). Nada de planta ou modo aqui —
 * isso é trabalho de cadastro inicial (UnidadesHeatmap somentePintura no
 * wizard); essa tela é só pra registrar venda rápido.
 */
export function UnidadesVendasPage() {
  const { id } = useParams<{ id: string }>();
  const { cadastros, catalogo, pessoasRepo } = useApp();
  const empreendimento = cadastros.find((c) => c.id === id);

  if (!empreendimento) {
    return (
      <div className="container container--wide">
        <PageHeader breadcrumb={[{ label: "Empreendimentos", to: "/cadastro" }, { label: "Vendas" }]} title="Empreendimento não encontrado" description="" />
      </div>
    );
  }

  const plantas = catalogo.listPlantas(empreendimento.id);
  const clientesConhecidos = [...new Set(
    pessoasRepo.list(empreendimento.construtoraId).filter((p) => p.papeis.includes("Cliente")).map((p) => p.nome),
  )];

  return (
    <div className="container container--wide">
      <PageHeader
        breadcrumb={[{ label: "Empreendimentos", to: "/cadastro" }, { label: empreendimento.nome }]}
        title={`Vendas — ${empreendimento.nome}`}
        description="Clique numa unidade pra registrar cliente e valor."
      />
      <UnidadesHeatmap
        empreendimentoId={empreendimento.id}
        torres={empreendimento.torres}
        plantas={plantas}
        somenteVendas
        clientesConhecidos={clientesConhecidos}
      />
    </div>
  );
}
