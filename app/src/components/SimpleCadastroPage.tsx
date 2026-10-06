import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { BreadcrumbItem } from "./Breadcrumb";
import { PageHeader } from "./PageHeader";
import { DataTable } from "./DataTable";
import { FilterBar, textMatch } from "./FilterBar";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormField } from "./FormField";
import { useToast } from "./Toast";
import { useLoading } from "../state/LoadingContext";
import { required } from "../domain/validation";

interface NomeItem {
  id: string;
  nome: string;
}

/**
 * Tabela + modal de criar/editar pra entidades de vocabulário (id + nome) —
 * Categoria e Marca têm exatamente essa forma, então compartilham essa UI
 * em vez de duas cópias quase idênticas (substitui o antigo SimpleNomeCrud,
 * que era só uma lista de inputs salvando a cada tecla).
 */
export function SimpleCadastroPage({
  breadcrumb,
  titulo,
  descricao,
  itemLabel,
  placeholder,
  itens,
  emUso,
  emUsoMsg,
  onCriar,
  onAtualizar,
  onRemover,
}: {
  breadcrumb: BreadcrumbItem[];
  titulo: string;
  descricao: string;
  /** Nome do item no singular, minúsculo — usado nas mensagens ("categoria criada"). */
  itemLabel: string;
  placeholder: string;
  itens: NomeItem[];
  emUso: (id: string) => boolean;
  emUsoMsg: (nome: string) => string;
  onCriar: (nome: string) => void;
  onAtualizar: (id: string, nome: string) => void;
  onRemover: (id: string) => void;
}) {
  const toast = useToast();
  const { runComLoading } = useLoading();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ mode: "criar" | "editar"; id?: string; nome: string; error?: string } | null>(null);
  const [excluindo, setExcluindo] = useState<NomeItem | null>(null);

  const filtrados = itens.filter((i) => textMatch(query, i.nome));

  function salvar() {
    if (!modal) return;
    const err = required()(modal.nome);
    if (err) {
      setModal({ ...modal, error: err });
      return;
    }
    const criando = modal.mode === "criar";
    const nome = modal.nome.trim();
    const id = modal.id;
    runComLoading(() => {
      if (criando) onCriar(nome);
      else if (id) onAtualizar(id, nome);
    }, criando ? `Criando ${itemLabel}...` : `Salvando ${itemLabel}...`).then(() => {
      toast.success(criando ? `${capitalize(itemLabel)} criada.` : `${capitalize(itemLabel)} atualizada.`);
      setModal(null);
    });
  }

  function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    runComLoading(() => onRemover(alvo.id), `Excluindo ${itemLabel}...`).then(() => {
      toast.success(`${capitalize(itemLabel)} excluída.`);
      setExcluindo(null);
    });
  }

  return (
    <div className="container">
      <PageHeader
        breadcrumb={breadcrumb}
        title={titulo}
        description={descricao}
        action={
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setModal({ mode: "criar", nome: "" })}>
            <Plus className="sidebar-nav-icon" /> Nova {itemLabel}
          </button>
        }
      />

      <FilterBar value={query} onChange={setQuery} placeholder={`Buscar ${itemLabel}...`} suggestions={itens.map((i) => i.nome)} />

      <DataTable
        columns={[
          { key: "nome", header: "Nome", sortValue: (i) => i.nome, render: (i) => i.nome },
          {
            key: "uso",
            header: "Uso",
            width: "120px",
            render: (i) => (emUso(i.id) ? <span className="badge badge--neutro">Em uso</span> : <span className="text-soft">—</span>),
          },
        ]}
        rows={filtrados}
        rowKey={(i) => i.id}
        emptyMessage={itens.length === 0 ? `Nenhuma ${itemLabel} cadastrada ainda.` : "Nenhum resultado pra esse filtro."}
        actions={(i) => {
          const bloqueada = emUso(i.id);
          return (
            <>
              <button type="button" className="table-icon-btn" onClick={() => setModal({ mode: "editar", id: i.id, nome: i.nome })} aria-label={`Editar ${i.nome}`}>
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="table-icon-btn table-icon-btn--danger"
                disabled={bloqueada}
                title={bloqueada ? emUsoMsg(i.nome) : undefined}
                onClick={() => setExcluindo(i)}
                aria-label={`Excluir ${i.nome}`}
              >
                <Trash2 size={14} />
              </button>
            </>
          );
        }}
      />

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.mode === "criar" ? `Nova ${itemLabel}` : `Editar ${itemLabel}`}>
        {modal && (
          <form onSubmit={(e) => { e.preventDefault(); salvar(); }}>
            <FormField label="Nome" htmlFor="nome-cadastro" required error={modal.error}>
              <input
                id="nome-cadastro"
                className={modal.error ? "input input--invalid" : "input"}
                value={modal.nome}
                placeholder={placeholder}
                onChange={(e) => setModal({ ...modal, nome: e.target.value, error: undefined })}
                onBlur={() => setModal((m) => (m ? { ...m, error: required()(m.nome) } : m))}
              />
            </FormField>
            <div className="row gap-sm" style={{ justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" className="btn btn--sm" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn--primary btn--sm">Salvar</button>
            </div>
          </form>
        )}
      </Modal>

      {excluindo && (
        <ConfirmDialog
          open
          onClose={() => setExcluindo(null)}
          onConfirm={confirmarExclusao}
          title={`Excluir ${itemLabel}`}
          description={`Excluir "${excluindo.nome}"? Essa ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
