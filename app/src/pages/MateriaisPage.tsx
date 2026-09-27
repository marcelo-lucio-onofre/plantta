import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2, ImageOff, Box, Smartphone } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { FilterBar, textMatch } from "../components/FilterBar";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { registrarVisualizacao } from "../lib/analytics";

// Carregado sob demanda — puxa three.js/R3F/model-viewer, ~400KB, só quando
// o modal com foto cadastrada é aberto (a maioria das páginas nunca precisa
// desse peso).
const Material3DPreview = lazy(() => import("../components/Material3DPreview").then((m) => ({ default: m.Material3DPreview })));
const MaterialARSwatch = lazy(() => import("../components/MaterialARSwatch").then((m) => ({ default: m.MaterialARSwatch })));
import { useApp } from "../state/AppContext";
import { materiaisEmUsoIds } from "../domain/usage";
import { required } from "../domain/validation";
import type { MaterialCatalogItem } from "../domain/types";

interface Draft {
  id?: string;
  categoriaId: string;
  marcaId: string;
  fornecedorId: string;
  modelo: string;
  sku: string;
  imagemUrl: string | null;
  roughness: number;
  metalness: number;
  errors: Partial<Record<"categoriaId" | "marcaId" | "fornecedorId" | "modelo", string>>;
}

export function MateriaisPage() {
  const { construtoraLogadaId, catalogo, catalogoMateriais, catalogoCategorias, catalogoMarcas, catalogoFornecedores, criarMaterial, atualizarMaterial, removerMaterial } = useApp();
  const toast = useToast();
  const construtoraId = construtoraLogadaId ?? "";
  const materiais = catalogoMateriais.list(construtoraId);
  const categorias = catalogoCategorias.list(construtoraId);
  const marcas = catalogoMarcas.list(construtoraId);
  const fornecedores = catalogoFornecedores.list(construtoraId);
  const semPreRequisito = categorias.length === 0 || marcas.length === 0 || fornecedores.length === 0;
  const emUsoIds = materiaisEmUsoIds(catalogo, construtoraId);

  const [query, setQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [fornecedorFiltro, setFornecedorFiltro] = useState("");
  const [modal, setModal] = useState<Draft | null>(null);
  const [previewModo, setPreviewModo] = useState<"3d" | "ar">("3d");
  const [excluindo, setExcluindo] = useState<MaterialCatalogItem | null>(null);

  const categoriaNome = (id: string) => categorias.find((c) => c.id === id)?.nome ?? "?";
  const marcaNome = (id: string) => marcas.find((m) => m.id === id)?.nome ?? "?";
  const fornecedorNome = (id: string) => fornecedores.find((f) => f.id === id)?.razaoSocial ?? "?";

  const filtrados = materiais.filter(
    (m) =>
      textMatch(query, m.modelo, m.sku) &&
      (!categoriaFiltro || m.categoriaId === categoriaFiltro) &&
      (!marcaFiltro || m.marcaId === marcaFiltro) &&
      (!fornecedorFiltro || m.fornecedorId === fornecedorFiltro),
  );

  function abrirCriar() {
    setPreviewModo("3d");
    setModal({
      categoriaId: categorias[0]?.id ?? "",
      marcaId: marcas[0]?.id ?? "",
      fornecedorId: fornecedores[0]?.id ?? "",
      modelo: "",
      sku: "",
      imagemUrl: null,
      roughness: 0.5,
      metalness: 0,
      errors: {},
    });
  }
  function abrirEditar(m: MaterialCatalogItem) {
    setPreviewModo("3d");
    setModal({
      id: m.id,
      categoriaId: m.categoriaId,
      marcaId: m.marcaId,
      fornecedorId: m.fornecedorId,
      modelo: m.modelo,
      sku: m.sku,
      imagemUrl: m.imagemUrl,
      roughness: m.roughness ?? 0.5,
      metalness: m.metalness ?? 0,
      errors: {},
    });
  }

  function onFotoSelecionada(file: File | undefined) {
    if (!file || !modal) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setModal((m) => (m ? { ...m, imagemUrl: ev.target?.result as string } : m));
    };
    reader.readAsDataURL(file);
  }

  function validar(d: Draft): Draft["errors"] {
    return {
      categoriaId: required()(d.categoriaId),
      marcaId: required()(d.marcaId),
      fornecedorId: required()(d.fornecedorId),
      modelo: required()(d.modelo),
    };
  }

  function salvar() {
    if (!modal) return;
    const errors = validar(modal);
    if (Object.values(errors).some(Boolean)) {
      setModal({ ...modal, errors });
      return;
    }
    const payload = {
      categoriaId: modal.categoriaId,
      marcaId: modal.marcaId,
      fornecedorId: modal.fornecedorId,
      modelo: modal.modelo.trim(),
      sku: modal.sku.trim(),
      imagemUrl: modal.imagemUrl,
      roughness: modal.roughness,
      metalness: modal.metalness,
    };
    if (modal.id) {
      atualizarMaterial(modal.id, payload);
      toast.success("Material atualizado.");
    } else {
      criarMaterial({ construtoraId, ...payload });
      toast.success("Material criado.");
    }
    setModal(null);
  }

  function confirmarExclusao() {
    if (!excluindo) return;
    removerMaterial(excluindo.id);
    toast.success("Material excluído.");
    setExcluindo(null);
  }

  return (
    <div className="container">
      <PageHeader
        breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Cadastros auxiliares" }, { label: "Materiais" }]}
        title="Materiais"
        description="Identidade do produto — categoria, marca, fornecedor, modelo, SKU. Preço e prazo entram por item, no momento em que o material é anexado a uma opção."
        action={
          <button type="button" className="btn btn--primary btn--sm" disabled={semPreRequisito} onClick={abrirCriar}>
            <Plus className="sidebar-nav-icon" /> Novo material
          </button>
        }
      />

      {semPreRequisito && (
        <div className="card text-soft" style={{ fontSize: 13, marginBottom: 16 }}>
          Cadastre pelo menos uma <Link to="/catalogo/categorias">categoria</Link>, uma <Link to="/catalogo/marcas">marca</Link> e um{" "}
          <Link to="/catalogo/fornecedores">fornecedor</Link> antes de criar material.
        </div>
      )}

      {!semPreRequisito && (
        <FilterBar value={query} onChange={setQuery} placeholder="Buscar modelo ou SKU..." suggestions={materiais.map((m) => m.modelo)}>
          <select className="input" style={{ maxWidth: 200 }} value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
            <option value="">Toda categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <select className="input" style={{ maxWidth: 200 }} value={marcaFiltro} onChange={(e) => setMarcaFiltro(e.target.value)}>
            <option value="">Toda marca</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          <select className="input" style={{ maxWidth: 220 }} value={fornecedorFiltro} onChange={(e) => setFornecedorFiltro(e.target.value)}>
            <option value="">Todo fornecedor</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>{f.nomeFantasia || f.razaoSocial}</option>
            ))}
          </select>
        </FilterBar>
      )}

      {!semPreRequisito && (
        <DataTable
          columns={[
            {
              key: "foto",
              header: "Foto",
              width: "56px",
              render: (m) =>
                m.imagemUrl ? (
                  <img src={m.imagemUrl} alt={m.modelo} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid var(--rule)" }} />
                ) : (
                  <div
                    style={{ width: 36, height: 36, borderRadius: 6, border: "1px dashed var(--rule-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-softer)" }}
                  >
                    <ImageOff size={14} />
                  </div>
                ),
            },
            { key: "categoria", header: "Categoria", render: (m) => categoriaNome(m.categoriaId) },
            { key: "marca", header: "Marca", render: (m) => marcaNome(m.marcaId) },
            { key: "fornecedor", header: "Fornecedor", render: (m) => fornecedorNome(m.fornecedorId) },
            { key: "modelo", header: "Modelo", render: (m) => m.modelo },
            { key: "sku", header: "SKU", mono: true, render: (m) => m.sku || "—" },
            {
              key: "uso",
              header: "Uso",
              width: "110px",
              render: (m) => (emUsoIds.has(m.id) ? <span className="badge badge--neutro">Em uso</span> : <span className="text-soft">—</span>),
            },
          ]}
          rows={filtrados}
          rowKey={(m) => m.id}
          emptyMessage={materiais.length === 0 ? "Nenhum material cadastrado ainda." : "Nenhum resultado pra esse filtro."}
          actions={(m) => {
            const bloqueado = emUsoIds.has(m.id);
            return (
              <>
                <button type="button" className="table-icon-btn" onClick={() => abrirEditar(m)} aria-label={`Editar ${m.modelo}`}>
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn table-icon-btn--danger"
                  disabled={bloqueado}
                  title={bloqueado ? "Anexado a uma opção de item — remova o anexo antes de excluir." : undefined}
                  onClick={() => setExcluindo(m)}
                  aria-label={`Excluir ${m.modelo}`}
                >
                  <Trash2 size={14} />
                </button>
              </>
            );
          }}
        />
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.id ? "Editar material" : "Novo material"} maxWidth={560}>
        {modal && (
          <form onSubmit={(e) => { e.preventDefault(); salvar(); }} className="stack gap-sm">
            <FormField label="Categoria" htmlFor="mat-categoria" required error={modal.errors.categoriaId}>
              <select
                id="mat-categoria"
                className={modal.errors.categoriaId ? "input input--invalid" : "input"}
                value={modal.categoriaId}
                onChange={(e) => setModal({ ...modal, categoriaId: e.target.value, errors: { ...modal.errors, categoriaId: undefined } })}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Marca" htmlFor="mat-marca" required error={modal.errors.marcaId}>
              <select
                id="mat-marca"
                className={modal.errors.marcaId ? "input input--invalid" : "input"}
                value={modal.marcaId}
                onChange={(e) => setModal({ ...modal, marcaId: e.target.value, errors: { ...modal.errors, marcaId: undefined } })}
              >
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Fornecedor" htmlFor="mat-fornecedor" required error={modal.errors.fornecedorId}>
              <select
                id="mat-fornecedor"
                className={modal.errors.fornecedorId ? "input input--invalid" : "input"}
                value={modal.fornecedorId}
                onChange={(e) => setModal({ ...modal, fornecedorId: e.target.value, errors: { ...modal.errors, fornecedorId: undefined } })}
              >
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nomeFantasia || f.razaoSocial}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Modelo" htmlFor="mat-modelo" required error={modal.errors.modelo}>
              <input
                id="mat-modelo"
                className={modal.errors.modelo ? "input input--invalid" : "input"}
                value={modal.modelo}
                placeholder="Premium 80×80"
                onChange={(e) => setModal({ ...modal, modelo: e.target.value, errors: { ...modal.errors, modelo: undefined } })}
                onBlur={() => setModal((m) => (m ? { ...m, errors: { ...m.errors, modelo: required()(m.modelo) } } : m))}
              />
            </FormField>
            <FormField label="SKU" htmlFor="mat-sku">
              <input id="mat-sku" className="input" value={modal.sku} placeholder="PTB-PREM-8080" onChange={(e) => setModal({ ...modal, sku: e.target.value })} />
            </FormField>

            <FormField label="Foto do material" htmlFor="mat-foto" hint="Usada no preview 3D — foto do padrão em close, o mais reta possível.">
              <input id="mat-foto" type="file" accept="image/*" className="input" onChange={(e) => onFotoSelecionada(e.target.files?.[0])} />
            </FormField>

            {modal.imagemUrl && (
              <>
                <div className="grid grid-2" style={{ gap: 10 }}>
                  <FormField label={`Aspereza (roughness) — ${modal.roughness.toFixed(2)}`} htmlFor="mat-roughness" hint="0 = espelhado, 1 = fosco">
                    <input
                      id="mat-roughness"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={modal.roughness}
                      onChange={(e) => setModal({ ...modal, roughness: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label={`Metalicidade — ${modal.metalness.toFixed(2)}`} htmlFor="mat-metalness" hint="0 = não-metal, 1 = metal puro">
                    <input
                      id="mat-metalness"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={modal.metalness}
                      onChange={(e) => setModal({ ...modal, metalness: Number(e.target.value) })}
                    />
                  </FormField>
                </div>
                <div className="row gap-sm" style={{ marginBottom: 10 }}>
                  <button type="button" className={previewModo === "3d" ? "btn btn--sm btn--primary" : "btn btn--sm"} onClick={() => setPreviewModo("3d")}>
                    <Box size={14} /> Preview 3D
                  </button>
                  <button
                    type="button"
                    className={previewModo === "ar" ? "btn btn--sm btn--primary" : "btn btn--sm"}
                    onClick={() => {
                      if (previewModo !== "ar" && modal.id) registrarVisualizacao({ nome: "preview_ar_material_catalogo", materialId: modal.id, modelo: modal.modelo });
                      setPreviewModo("ar");
                    }}
                  >
                    <Smartphone size={14} /> Ver em AR
                  </button>
                </div>
                {previewModo === "3d" ? (
                  <Suspense fallback={<div className="text-soft" style={{ fontSize: 12.5, padding: 12 }}>Carregando preview 3D…</div>}>
                    <Material3DPreview imagemUrl={modal.imagemUrl} roughness={modal.roughness} metalness={modal.metalness} height={200} />
                  </Suspense>
                ) : (
                  <Suspense fallback={<div className="text-soft" style={{ fontSize: 12.5, padding: 12 }}>Preparando visualização em AR…</div>}>
                    <MaterialARSwatch imagemUrl={modal.imagemUrl} nome={modal.modelo || "Material"} roughness={modal.roughness} metalness={modal.metalness} height={280} />
                  </Suspense>
                )}
              </>
            )}

            <div className="row gap-sm" style={{ justifyContent: "flex-end", marginTop: 10 }}>
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
          title="Excluir material"
          description={`Excluir "${excluindo.modelo}"? Essa ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}
