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
import { fornecedorEmUso } from "../domain/usage";
import type { Fornecedor } from "../domain/types";

export function FornecedoresPage() {
  const { construtoraLogadaId, catalogoFornecedores, catalogoMateriais, removerFornecedor } = useApp();
  const { runComLoading } = useLoading();
  const navigate = useNavigate();
  const toast = useToast();
  const construtoraId = construtoraLogadaId ?? "";
  const fornecedores = catalogoFornecedores.list(construtoraId);
  const materiais = catalogoMateriais.list(construtoraId);

  const [query, setQuery] = useState("");
  const [excluindo, setExcluindo] = useState<Fornecedor | null>(null);

  const filtrados = fornecedores.filter((f) => textMatch(query, f.razaoSocial, f.nomeFantasia, f.cidade, f.uf));

  function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    runComLoading(() => removerFornecedor(alvo.id), "Excluindo fornecedor...").then(() => {
      toast.success("Fornecedor excluído.");
      setExcluindo(null);
    });
  }

  return (
    <div className="container">
      <PageHeader
        breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Cadastros auxiliares" }, { label: "Fornecedores" }]}
        title="Fornecedores"
        description="Quem entrega o material — cadastro próprio, independente do material em si."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={() => navigate("/catalogo/fornecedores/novo")}>
            <Plus className="sidebar-nav-icon" /> Novo fornecedor
          </button>
        }
      />

      <FilterBar
        value={query}
        onChange={setQuery}
        placeholder="Buscar razão social, cidade ou UF..."
        suggestions={[...new Set(fornecedores.flatMap((f) => [f.razaoSocial, f.cidade].filter(Boolean)))]}
      />

      <DataTable
        columns={[
          {
            key: "razaoSocial",
            header: "Razão social",
            sortValue: (f) => f.razaoSocial,
            render: (f) => (
              <div>
                <div style={{ fontWeight: 600 }}>{f.razaoSocial || "—"}</div>
                {f.nomeFantasia && <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{f.nomeFantasia}</div>}
              </div>
            ),
          },
          { key: "cidade", header: "Cidade/UF", sortValue: (f) => f.cidade, render: (f) => (f.cidade ? `${f.cidade}${f.uf ? "/" + f.uf : ""}` : "—") },
          { key: "telefone", header: "Telefone", mono: true, render: (f) => f.telefone || "—" },
          { key: "email", header: "E-mail", sortValue: (f) => f.email, render: (f) => f.email || "—" },
          {
            key: "uso",
            header: "Uso",
            width: "110px",
            render: (f) => (fornecedorEmUso(f.id, materiais) ? <span className="badge badge--neutro">Em uso</span> : <span className="text-soft">—</span>),
          },
        ]}
        rows={filtrados}
        rowKey={(f) => f.id}
        emptyMessage={fornecedores.length === 0 ? "Nenhum fornecedor cadastrado ainda." : "Nenhum resultado pra esse filtro."}
        actions={(f) => {
          const bloqueado = fornecedorEmUso(f.id, materiais);
          return (
            <>
              <button type="button" className="table-icon-btn" onClick={() => navigate(`/catalogo/fornecedores/${f.id}`)} aria-label={`Editar ${f.razaoSocial}`}>
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="table-icon-btn table-icon-btn--danger"
                disabled={bloqueado}
                title={bloqueado ? "Usado por materiais cadastrados — remova o vínculo antes de excluir." : undefined}
                onClick={() => setExcluindo(f)}
                aria-label={`Excluir ${f.razaoSocial}`}
              >
                <Trash2 size={14} />
              </button>
            </>
          );
        }}
      />

      {excluindo && (
        <ConfirmDialog
          open
          onClose={() => setExcluindo(null)}
          onConfirm={confirmarExclusao}
          title="Excluir fornecedor"
          description={`Excluir "${excluindo.razaoSocial || excluindo.nomeFantasia}"? Essa ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}
