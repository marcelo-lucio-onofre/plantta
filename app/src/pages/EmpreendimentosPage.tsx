import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Grid3x3, Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { FilterBar, textMatch } from "../components/FilterBar";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { useApp } from "../state/AppContext";
import { totalUnidadesTorres } from "../domain/calculations";
import type { EmpreendimentoCadastrado, StatusComercialEmpreendimento } from "../domain/types";

const STATUS: StatusComercialEmpreendimento[] = ["Planejamento", "Lançamento", "Em obras", "Entregue"];

export function EmpreendimentosPage() {
  const { construtoraLogadaId, cadastros, unidadesRepo, garantirVinculoDaUnidade } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const construtoraId = construtoraLogadaId ?? "";
  const empreendimentos = cadastros.filter((c) => c.construtoraId === construtoraId);

  const [query, setQuery] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusComercialEmpreendimento | "">("");
  const [personalizarEmp, setPersonalizarEmp] = useState<EmpreendimentoCadastrado | null>(null);
  const [unidadeEscolhida, setUnidadeEscolhida] = useState("");

  const unidadesVendidas = personalizarEmp
    ? unidadesRepo.listByEmpreendimento(personalizarEmp.id).filter((u) => u.clienteNome)
    : [];

  function abrirPersonalizar(emp: EmpreendimentoCadastrado) {
    setPersonalizarEmp(emp);
    setUnidadeEscolhida("");
  }

  function confirmarPersonalizar() {
    const unidade = unidadesVendidas.find((u) => u.numero === unidadeEscolhida);
    if (!unidade) return;
    const vinculo = garantirVinculoDaUnidade(unidade);
    if (!vinculo) {
      toast.error("Essa unidade precisa de uma planta associada antes de personalizar.");
      return;
    }
    navigate(`/personalizar?vinculoId=${vinculo.id}`);
  }

  const filtrados = empreendimentos.filter(
    (e) => textMatch(query, e.nome, e.cidade) && (!statusFiltro || e.statusComercial === statusFiltro),
  );

  return (
    <div className="container container--wide">
      <PageHeader
        breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Empreendimentos" }]}
        title="Empreendimentos"
        description="Cada empreendimento aqui vira torres/unidades e um catálogo próprio de personalização."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={() => navigate("/cadastro/novo")}>
            <Plus className="sidebar-nav-icon" /> Novo empreendimento
          </button>
        }
      />

      <FilterBar value={query} onChange={setQuery} placeholder="Buscar nome ou cidade..." suggestions={[...new Set(empreendimentos.flatMap((e) => [e.nome, e.cidade].filter(Boolean)))]}>
        <select className="input" style={{ maxWidth: 200 }} value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as StatusComercialEmpreendimento | "")}>
          <option value="">Todo estágio</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FilterBar>

      <DataTable
        columns={[
          { key: "nome", header: "Nome", sortValue: (e) => e.nome, render: (e) => <div style={{ fontWeight: 600 }}>{e.nome}</div> },
          { key: "tipo", header: "Tipo", sortValue: (e) => e.tipo, render: (e) => e.tipo },
          { key: "cidade", header: "Cidade/UF", sortValue: (e) => e.cidade ?? "", render: (e) => (e.cidade ? `${e.cidade}${e.uf ? "/" + e.uf : ""}` : "—") },
          { key: "status", header: "Estágio", sortValue: (e) => e.statusComercial, render: (e) => <span className="badge badge--neutro">{e.statusComercial}</span> },
          { key: "unidades", header: "Unidades", mono: true, sortValue: (e) => totalUnidadesTorres(e.torres), render: (e) => String(totalUnidadesTorres(e.torres)) },
          { key: "criadoEm", header: "Criado em", mono: true, sortValue: (e) => new Date(e.criadoEm), render: (e) => new Date(e.criadoEm).toLocaleDateString("pt-BR") },
        ]}
        rows={filtrados}
        rowKey={(e) => e.id}
        emptyMessage={empreendimentos.length === 0 ? "Nenhum empreendimento cadastrado ainda." : "Nenhum resultado pra esse filtro."}
        actions={(e) => (
          <>
            <button type="button" className="table-icon-btn" onClick={() => abrirPersonalizar(e)} aria-label={`Criar personalização em ${e.nome}`} title="Criar personalização">
              <SlidersHorizontal size={14} />
            </button>
            <button type="button" className="table-icon-btn" onClick={() => navigate(`/cadastro/${e.id}/vendas`)} aria-label={`Vendas e unidades de ${e.nome}`} title="Vendas e unidades">
              <Grid3x3 size={14} />
            </button>
            <button type="button" className="table-icon-btn" onClick={() => navigate(`/cadastro/${e.id}`)} aria-label={`Continuar cadastro de ${e.nome}`} title="Continuar cadastro">
              <ArrowRight size={14} />
            </button>
          </>
        )}
      />

      <Modal open={personalizarEmp != null} onClose={() => setPersonalizarEmp(null)} title={personalizarEmp ? `Criar personalização — ${personalizarEmp.nome}` : ""}>
        {personalizarEmp && (
          <div className="stack gap-sm">
            <FormField label="Cliente e unidade">
              <select className="input" value={unidadeEscolhida} onChange={(e) => setUnidadeEscolhida(e.target.value)}>
                <option value="">Selecione...</option>
                {unidadesVendidas.map((u) => (
                  <option key={u.numero} value={u.numero}>{u.clienteNome} — {u.numero}</option>
                ))}
              </select>
            </FormField>
            {unidadesVendidas.length === 0 && (
              <div className="text-soft" style={{ fontSize: 12.5 }}>
                Nenhuma unidade vendida ainda nesse empreendimento — registre a venda em "Vendas e unidades" primeiro.
              </div>
            )}
            <div className="row gap-sm" style={{ justifyContent: "flex-end", marginTop: 10 }}>
              <button type="button" className="btn btn--sm" onClick={() => setPersonalizarEmp(null)}>Cancelar</button>
              <button type="button" className="btn btn--primary btn--sm" disabled={!unidadeEscolhida} onClick={confirmarPersonalizar}>
                Personalizar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
