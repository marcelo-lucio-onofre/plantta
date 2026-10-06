import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { FilterBar, textMatch } from "../components/FilterBar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";
import type { Pessoa, TipoPapel } from "../domain/types";

const PAPEIS: Exclude<TipoPapel, "Cliente">[] = ["Arquiteto", "Engenheiro", "Técnico", "Designer", "Projetista", "Consultor", "Responsável pela construtora", "Outro"];

/**
 * Funcionários — arquiteto, engenheiro, técnico, designer, projetista,
 * consultor, responsável pela construtora — separado de Clientes
 * (ClientesPage), que tem cadastro/ações bem diferentes (senha de acesso,
 * sem registro profissional). Ambos ainda são `Pessoa` no domínio, só a
 * tela é segregada.
 */
export function FuncionariosPage() {
  const { construtoraLogadaId, pessoasRepo, removerPessoa } = useApp();
  const { runComLoading } = useLoading();
  const navigate = useNavigate();
  const toast = useToast();
  const construtoraId = construtoraLogadaId ?? "";
  const funcionarios = pessoasRepo.list(construtoraId).filter((p) => !p.papeis.includes("Cliente"));

  const [query, setQuery] = useState("");
  const [papelFiltro, setPapelFiltro] = useState<TipoPapel | "todos">("todos");
  const [excluindo, setExcluindo] = useState<Pessoa | null>(null);

  const filtrados = funcionarios.filter(
    (p) => textMatch(query, p.nome, p.empresa) && (papelFiltro === "todos" || p.papeis.includes(papelFiltro)),
  );

  function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    runComLoading(() => removerPessoa(alvo.id), "Excluindo funcionário...").then(() => {
      toast.success("Funcionário excluído.");
      setExcluindo(null);
    });
  }

  return (
    <div className="container">
      <PageHeader
        breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Pessoas" }, { label: "Funcionários" }]}
        title="Funcionários"
        description="Arquiteto, engenheiro, técnico, designer, projetista, consultor, responsável pela construtora — a mesma pessoa pode ter mais de um papel."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={() => navigate("/pessoas/funcionarios/novo")}>
            <Plus className="sidebar-nav-icon" /> Novo funcionário
          </button>
        }
      />

      <div className="row gap-xs" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn--sm" style={papelFiltro === "todos" ? { background: "color-mix(in srgb, var(--brand) 14%, var(--card))", borderColor: "var(--brand)", color: "var(--brand)" } : {}} onClick={() => setPapelFiltro("todos")}>
          Todos <span className="mono" style={{ opacity: 0.7, marginLeft: 4 }}>{funcionarios.length}</span>
        </button>
        {PAPEIS.map((papel) => {
          const count = funcionarios.filter((p) => p.papeis.includes(papel)).length;
          if (count === 0) return null;
          const active = papelFiltro === papel;
          return (
            <button key={papel} type="button" className="btn btn--sm" style={active ? { background: "color-mix(in srgb, var(--brand) 14%, var(--card))", borderColor: "var(--brand)", color: "var(--brand)" } : {}} onClick={() => setPapelFiltro(papel)}>
              {papel} <span className="mono" style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <FilterBar value={query} onChange={setQuery} placeholder="Buscar nome ou empresa..." suggestions={[...new Set(funcionarios.flatMap((p) => [p.nome, p.empresa].filter(Boolean)))]} />

      <DataTable
        columns={[
          { key: "nome", header: "Nome", sortValue: (p) => p.nome, render: (p) => <div style={{ fontWeight: 600 }}>{p.nome || "—"}</div> },
          {
            key: "papeis",
            header: "Papéis",
            render: (p) => (
              <div className="row gap-xs" style={{ flexWrap: "wrap" }}>
                {p.papeis.length === 0 ? <span className="text-soft">—</span> : p.papeis.map((pp) => <span key={pp} className="badge badge--neutro">{pp}</span>)}
              </div>
            ),
          },
          { key: "empresa", header: "Empresa", sortValue: (p) => p.empresa, render: (p) => p.empresa || "—" },
          {
            key: "contato",
            header: "Contato",
            render: (p) => (
              <div>
                <div style={{ fontSize: 12.5 }}>{p.email || "—"}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{p.telefone}</div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Registro",
            render: (p) =>
              p.conselho || p.numeroRegistro ? (
                <span className={p.statusRegistro === "Ativo" ? "badge badge--simples" : "badge badge--bloqueado"}>{p.statusRegistro}</span>
              ) : (
                <span className="text-soft">—</span>
              ),
          },
        ]}
        rows={filtrados}
        rowKey={(p) => p.id}
        emptyMessage={funcionarios.length === 0 ? "Nenhum funcionário cadastrado ainda." : "Nenhum resultado pra esse filtro."}
        actions={(p) => (
          <>
            <button type="button" className="table-icon-btn" onClick={() => navigate(`/pessoas/funcionarios/${p.id}`)} aria-label={`Editar ${p.nome}`}>
              <Pencil size={14} />
            </button>
            <button type="button" className="table-icon-btn table-icon-btn--danger" onClick={() => setExcluindo(p)} aria-label={`Excluir ${p.nome}`}>
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      {excluindo && (
        <ConfirmDialog
          open
          onClose={() => setExcluindo(null)}
          onConfirm={confirmarExclusao}
          title="Excluir funcionário"
          description={`Excluir "${excluindo.nome}"? Essa ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}
