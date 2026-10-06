import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { FilterBar, textMatch } from "../components/FilterBar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";
import { gerarSenhaAcesso } from "../domain/calculations";
import type { Pessoa } from "../domain/types";

/**
 * Clientes — separado de Funcionários (FuncionariosPage): cadastro enxuto
 * (nome, CPF, contato) e a ação central é a senha de acesso ao portal,
 * não registro profissional.
 */
export function ClientesPage() {
  const { construtoraLogadaId, pessoasRepo, removerPessoa, atualizarPessoa } = useApp();
  const { runComLoading } = useLoading();
  const navigate = useNavigate();
  const toast = useToast();
  const construtoraId = construtoraLogadaId ?? "";
  const clientes = pessoasRepo.list(construtoraId).filter((p) => p.papeis.includes("Cliente"));

  const [query, setQuery] = useState("");
  const [excluindo, setExcluindo] = useState<Pessoa | null>(null);

  const filtrados = clientes.filter((p) => textMatch(query, p.nome, p.email));

  function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    runComLoading(() => removerPessoa(alvo.id), "Excluindo cliente...").then(() => {
      toast.success("Cliente excluído.");
      setExcluindo(null);
    });
  }

  function reenviarSenha(p: Pessoa) {
    const senha = gerarSenhaAcesso();
    runComLoading(() => atualizarPessoa(p.id, { senhaAcesso: senha }), "Enviando nova senha...").then(() => {
      toast.success(`Nova senha enviada para ${p.email}: ${senha}`);
    });
  }

  return (
    <div className="container">
      <PageHeader
        breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Pessoas" }, { label: "Clientes" }]}
        title="Clientes"
        description="Cadastro enxuto — nome, CPF e contato. A senha de acesso ao portal é enviada por e-mail ao cadastrar e pode ser reenviada a qualquer momento."
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={() => navigate("/pessoas/clientes/novo")}>
            <Plus className="sidebar-nav-icon" /> Novo cliente
          </button>
        }
      />

      <FilterBar value={query} onChange={setQuery} placeholder="Buscar nome ou e-mail..." suggestions={[...new Set(clientes.flatMap((p) => [p.nome, p.email].filter(Boolean)))]} />

      <DataTable
        columns={[
          { key: "nome", header: "Nome", sortValue: (p) => p.nome, render: (p) => <div style={{ fontWeight: 600 }}>{p.nome || "—"}</div> },
          { key: "cpf", header: "CPF", idColumn: true, sortValue: (p) => p.cpf, render: (p) => p.cpf || "—" },
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
            key: "senha",
            header: "Acesso",
            render: (p) => (p.senhaAcesso ? <span className="badge badge--simples">Senha enviada</span> : <span className="text-soft">—</span>),
          },
        ]}
        rows={filtrados}
        rowKey={(p) => p.id}
        emptyMessage={clientes.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum resultado pra esse filtro."}
        actions={(p) => (
          <>
            <button type="button" className="table-icon-btn" onClick={() => navigate(`/pessoas/clientes/${p.id}`)} aria-label={`Editar ${p.nome}`}>
              <Pencil size={14} />
            </button>
            <button type="button" className="table-icon-btn" title="Reenviar senha" onClick={() => reenviarSenha(p)} aria-label={`Reenviar senha para ${p.nome}`}>
              <KeyRound size={14} />
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
          title="Excluir cliente"
          description={`Excluir "${excluindo.nome}"? Essa ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}
