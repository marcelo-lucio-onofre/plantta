import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { ArtBadge, NivelBadge } from "./Badge";
import { ImageThumb } from "./ImageThumb";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { MoedaInput } from "./MaskedInput";
import { useToast } from "./Toast";
import { deInputDate, numeroUnidade, paraInputDate } from "../domain/calculations";
import type { AllowanceGroup, Ambiente, Categoria, CategoriaArquivoPlanta, Item, MaterialCatalogItem, NivelAprovacao, Opcao, Planta, Torre, UnidadeAssociada } from "../domain/types";
import { useApp } from "../state/AppContext";

export const gerarId = (prefixo: string) => `${prefixo}-${Date.now()}-${Math.round(Math.random() * 10000)}`;

function OpcaoRow({
  opcao,
  imagemUrl,
  onChange,
  onRemove,
}: {
  opcao: Opcao;
  imagemUrl?: string | null;
  onChange: (patch: Partial<Opcao>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ padding: "8px 0", borderTop: "1px solid var(--rule)" }}>
      <div className="row gap-sm" style={{ alignItems: "center", marginBottom: opcao.materialCatalogItemId ? 4 : 0 }}>
        {opcao.materialCatalogItemId && <ImageThumb url={imagemUrl} alt={opcao.nome} size={28} />}
        <input className="input" style={{ flex: "2 1 160px" }} value={opcao.nome} onChange={(e) => onChange({ nome: e.target.value })} placeholder="Nome da opção" />
        <MoedaInput style={{ flex: "1 1 100px" }} value={opcao.preco} onChange={(n) => onChange({ preco: n })} />
        <label className="row gap-xs" style={{ fontSize: 12, flexShrink: 0 }}>
          <input type="checkbox" checked={Boolean(opcao.remocao)} onChange={(e) => onChange({ remocao: e.target.checked })} /> Remoção
        </label>
        <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4, flexShrink: 0 }} onClick={onRemove} aria-label="Remover opção">
          <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} />
        </button>
      </div>
      {opcao.materialCatalogItemId && (
        <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          Vinculado a um material — o preço acima é só deste item e pode ser diferente do preço padrão do material no catálogo.
        </div>
      )}
    </div>
  );
}

/** Material + nome da marca já resolvido — CatalogoPlantaEditor monta essa
 * junção uma vez (categoriaId/marcaId são só chave de referência, a UI
 * precisa do nome). */
export type MaterialResolvido = MaterialCatalogItem & { marcaNome: string; categoriaNome: string };

interface ItemRowProps {
  item: Item;
  categorias: Categoria[];
  materiais: MaterialResolvido[];
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  onOpcoesChange: (updater: (opcoes: Opcao[]) => Opcao[]) => void;
}

function ItemRow({ item, categorias, materiais, onChange, onRemove, onOpcoesChange }: ItemRowProps) {
  const [materialParaAdicionar, setMaterialParaAdicionar] = useState("");
  const materiaisDaCategoria = item.categoriaId ? materiais.filter((m) => m.categoriaId === item.categoriaId) : [];

  function adicionarMaterial() {
    const material = materiaisDaCategoria.find((m) => m.id === materialParaAdicionar);
    if (!material) return;
    onOpcoesChange((opcoes) => [
      ...opcoes,
      { id: gerarId("op"), nome: `${material.marcaNome} ${material.modelo}`, preco: 0, materialCatalogItemId: material.id },
    ]);
    setMaterialParaAdicionar("");
  }

  return (
    <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: 14, background: "var(--paper)" }}>
      <div className="row gap-sm" style={{ alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap" }}>
        <input className="input" style={{ flex: "1 1 200px" }} value={item.nome} onChange={(e) => onChange({ nome: e.target.value })} placeholder="Nome do item" />
        <select className="input" style={{ flex: "1 1 160px" }} value={item.categoriaId ?? ""} onChange={(e) => onChange({ categoriaId: e.target.value || undefined })}>
          <option value="">Categoria de material...</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <NivelBadge nivel={item.nivel} />
        <ArtBadge requerArt={item.requerArt} />
        <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4 }} onClick={onRemove} aria-label="Remover item">
          <Trash2 className="sidebar-nav-icon" style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div className="grid grid-2" style={{ gap: 8, marginBottom: 10 }}>
        <div>
          <label className="label">Especificação padrão</label>
          <select className="input" value={item.padrao} disabled={materiaisDaCategoria.length === 0} onChange={(e) => onChange({ padrao: e.target.value })}>
            <option value="">{item.categoriaId ? "Selecione o material..." : "Escolha a categoria acima primeiro"}</option>
            {materiaisDaCategoria.map((m) => {
              const label = `${m.marcaNome} ${m.modelo}`;
              return <option key={m.id} value={label}>{label}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="label">Preço base / verba (R$)</label>
          <MoedaInput value={item.valorPadrao} onChange={(n) => onChange({ valorPadrao: n })} />
        </div>
        <div>
          <label className="label">Nível de aprovação</label>
          <select className="input" value={item.nivel} onChange={(e) => onChange({ nivel: Number(e.target.value) as NivelAprovacao })}>
            <option value={1}>1 — Simples (automático)</option>
            <option value={2}>2 — Técnico (responsável obrigatório)</option>
            <option value={3}>3 — Proibido (bloqueio imediato)</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label className="row gap-xs" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={Boolean(item.requerArt)} onChange={(e) => onChange({ requerArt: e.target.checked })} /> Exige ART/RRT do responsável técnico
          </label>
        </div>
        {item.requerArt && (
          <div>
            <label className="label">Taxa de ART (R$) — cobrada do cliente</label>
            <MoedaInput value={item.custoArt ?? 0} onChange={(n) => onChange({ custoArt: n })} />
          </div>
        )}
        <div>
          <label className="label">Prazo de decisão — início</label>
          <input
            className="input"
            type="date"
            value={item.prazoInicio ? paraInputDate(item.prazoInicio) : ""}
            onChange={(e) => onChange({ prazoInicio: e.target.value ? deInputDate(e.target.value) : null })}
          />
        </div>
        <div>
          <label className="label">Prazo de decisão — fim</label>
          <input
            className="input"
            type="date"
            value={item.prazoFim ? paraInputDate(item.prazoFim) : ""}
            onChange={(e) => onChange({ prazoFim: e.target.value ? deInputDate(e.target.value) : null })}
          />
        </div>
        <div>
          <label className="label">Lead time do material (dias)</label>
          <input className="input" type="number" min={0} value={item.leadTimeDias ?? ""} onChange={(e) => onChange({ leadTimeDias: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <label className="label">Necessário em obra</label>
          <input className="input" type="date" value={item.necessarioEmObra ?? ""} onChange={(e) => onChange({ necessarioEmObra: e.target.value || undefined })} />
        </div>
      </div>

      {item.nivel === 3 && (
        <div style={{ marginBottom: 10 }}>
          <label className="label">Motivo do bloqueio</label>
          <input className="input" value={item.motivoBloqueio ?? ""} onChange={(e) => onChange({ motivoBloqueio: e.target.value })} placeholder="Elemento estrutural — alteração proibida por norma..." />
        </div>
      )}

      {item.parametrico ? (
        <div className="grid grid-2" style={{ gap: 8 }}>
          <div>
            <label className="label">Quantidade padrão incluída</label>
            <input className="input" type="number" min={0} value={item.qtdPadrao ?? 0} onChange={(e) => onChange({ qtdPadrao: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Custo por unidade extra (R$)</label>
            <MoedaInput value={item.custoPorUnidade?.total ?? 0} onChange={(n) => onChange({ custoPorUnidade: { ...item.custoPorUnidade, total: n } })} />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Opções</div>
          {item.opcoes.map((opt) => (
            <OpcaoRow
              key={opt.id}
              opcao={opt}
              imagemUrl={materiais.find((m) => m.id === opt.materialCatalogItemId)?.imagemUrl}
              onChange={(patch) => onOpcoesChange((opcoes) => opcoes.map((o) => (o.id === opt.id ? { ...o, ...patch } : o)))}
              onRemove={() => onOpcoesChange((opcoes) => opcoes.filter((o) => o.id !== opt.id))}
            />
          ))}
          <div className="row gap-sm" style={{ marginTop: 10, flexWrap: "wrap" }}>
            {materiaisDaCategoria.length > 0 ? (
              <div className="row gap-xs" style={{ alignItems: "center" }}>
                <select className="input" style={{ width: 220 }} value={materialParaAdicionar} onChange={(e) => setMaterialParaAdicionar(e.target.value)}>
                  <option value="">Adicionar material...</option>
                  {materiaisDaCategoria.map((m) => (
                    <option key={m.id} value={m.id}>{m.marcaNome} {m.modelo}</option>
                  ))}
                </select>
                <button type="button" className="btn btn--sm" disabled={!materialParaAdicionar} onClick={adicionarMaterial}>Adicionar</button>
              </div>
            ) : item.categoriaId ? (
              <span className="text-soft" style={{ fontSize: 12 }}>Nenhum material cadastrado nessa categoria ainda.</span>
            ) : (
              <span className="text-soft" style={{ fontSize: 12 }}>Escolha a categoria acima pra adicionar um material.</span>
            )}
          </div>
          <label className="row gap-xs" style={{ fontSize: 12.5, alignItems: "center", marginTop: 10 }}>
            <input
              type="checkbox"
              checked={item.permiteMaterialProprio ?? true}
              onChange={(e) => onChange({ permiteMaterialProprio: e.target.checked })}
            />
            Cliente pode enviar material próprio pra análise
          </label>
        </div>
      )}
    </div>
  );
}

const ARQUIVOS_PLANTA_VAZIOS: Planta["arquivos"] = {
  plantaArquitetonicaPdf: [], plantaImagem: [], dwg: [], plantaHumanizada: [], plantaMobiliada: [],
  plantaEletrica: [], plantaHidraulica: [], plantaPontos: [], memorialTipologia: [], renderizacoes: [],
};

const META_ARQUIVOS_PLANTA: { key: CategoriaArquivoPlanta; label: string; accept: string }[] = [
  { key: "plantaArquitetonicaPdf", label: "Planta arquitetônica (PDF)", accept: ".pdf" },
  { key: "plantaImagem", label: "Planta em imagem", accept: "image/*" },
  { key: "dwg", label: "DWG", accept: ".dwg,.dxf" },
  { key: "plantaHumanizada", label: "Planta humanizada", accept: "image/*,.pdf" },
  { key: "plantaMobiliada", label: "Planta mobiliada", accept: "image/*,.pdf" },
  { key: "plantaEletrica", label: "Planta elétrica", accept: ".pdf,.dwg" },
  { key: "plantaHidraulica", label: "Planta hidráulica", accept: ".pdf,.dwg" },
  { key: "plantaPontos", label: "Planta de pontos", accept: ".pdf,.dwg" },
  { key: "memorialTipologia", label: "Memorial da tipologia", accept: ".pdf,.doc,.docx" },
  { key: "renderizacoes", label: "Renderizações dos ambientes", accept: "image/*" },
];

/** Linha compacta de upload — uma por categoria, sem drop-zone grande
 * (registro com muito campo — Planta, Pessoa — 6-10 categorias em caixa
 * tracejada ficaria gigante). Mostra só contagem + limpar, não chip por
 * arquivo. Compartilhado entre Planta e Pessoa, não uma cópia por tela. */
export function UploadCompactRow({ label, accept, arquivos, onAdd, onClear }: { label: string; accept: string; arquivos: { id: string; name: string; size: number }[]; onAdd: (list: FileList | null) => void; onClear: () => void }) {
  const has = arquivos.length > 0;
  return (
    <div className="row gap-sm" style={{ alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--rule)", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, flex: "1 1 180px" }}>{label}</span>
      <span className="row gap-sm" style={{ alignItems: "center", flexShrink: 0 }}>
        {has ? (
          <>
            <span className="badge badge--simples" style={{ fontSize: 11 }}>✓ {arquivos.length}</span>
            <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", fontSize: 11, padding: 0 }} onClick={onClear}>
              Limpar
            </button>
          </>
        ) : (
          <input type="file" multiple accept={accept} onChange={(e) => onAdd(e.target.files)} style={{ fontSize: 11, maxWidth: 170 }} />
        )}
      </span>
    </div>
  );
}

/**
 * Upload dos arquivos de uma planta — uma área de arraste-e-solte só, com
 * o tipo escolhido num select ao lado (em vez de 10 linhas sempre visíveis,
 * uma por categoria). Seleção múltipla de arquivo é nativa do input; lista
 * abaixo só mostra categorias que já têm arquivo, pra não virar parede de
 * campo vazio.
 */
function PlantaUploadsManager({ empreendimentoId, planta }: { empreendimentoId: string; planta: Planta }) {
  const { salvarPlanta } = useApp();
  const [tipo, setTipo] = useState<CategoriaArquivoPlanta>(META_ARQUIVOS_PLANTA[0].key);
  const [arrastando, setArrastando] = useState(false);
  const metaAtual = META_ARQUIVOS_PLANTA.find((m) => m.key === tipo)!;
  const totalArquivos = META_ARQUIVOS_PLANTA.reduce((n, m) => n + planta.arquivos[m.key].length, 0);

  function adicionar(list: FileList | null) {
    if (!list?.length) return;
    const incoming = Array.from(list).map((f) => ({ id: `${tipo}-${Date.now()}-${f.name}`, name: f.name, size: f.size }));
    salvarPlanta(empreendimentoId, { ...planta, arquivos: { ...planta.arquivos, [tipo]: [...planta.arquivos[tipo], ...incoming] } });
  }
  function remover(key: CategoriaArquivoPlanta, id: string) {
    salvarPlanta(empreendimentoId, { ...planta, arquivos: { ...planta.arquivos, [key]: planta.arquivos[key].filter((a) => a.id !== id) } });
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label className="label" style={{ margin: 0 }}>Uploads</label>
        {totalArquivos > 0 && <span className="text-soft" style={{ fontSize: 12 }}>{totalArquivos} arquivo{totalArquivos === 1 ? "" : "s"}</span>}
      </div>

      <select className="input" style={{ marginBottom: 10, maxWidth: 320 }} value={tipo} onChange={(e) => setTipo(e.target.value as CategoriaArquivoPlanta)}>
        {META_ARQUIVOS_PLANTA.map((m) => (
          <option key={m.key} value={m.key}>{m.label}{planta.arquivos[m.key].length ? ` (${planta.arquivos[m.key].length})` : ""}</option>
        ))}
      </select>

      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          border: `2px dashed ${arrastando ? "var(--brand)" : "var(--rule-strong)"}`,
          borderRadius: 10,
          padding: "22px 16px",
          cursor: "pointer",
          background: arrastando ? "var(--green-bg)" : "var(--paper)",
          textAlign: "center",
        }}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionar(e.dataTransfer.files); }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>Arraste arquivos aqui ou clique pra selecionar</span>
        <span className="text-soft" style={{ fontSize: 11.5 }}>Tipo selecionado: {metaAtual.label} · aceita vários arquivos de uma vez</span>
        <input type="file" multiple accept={metaAtual.accept} onChange={(e) => adicionar(e.target.files)} style={{ display: "none" }} />
      </label>

      {totalArquivos > 0 && (
        <div className="stack gap-sm" style={{ marginTop: 12 }}>
          {META_ARQUIVOS_PLANTA.filter((m) => planta.arquivos[m.key].length > 0).map((m) => (
            <div key={m.key}>
              <div className="text-soft" style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
              <div className="stack gap-xs">
                {planta.arquivos[m.key].map((f) => (
                  <div key={f.id} className="row" style={{ justifyContent: "space-between", alignItems: "center", border: "1px solid var(--rule)", borderRadius: 6, padding: "5px 9px", fontSize: 12 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <button
                      type="button"
                      style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", fontWeight: 700, fontSize: 13, padding: 0 }}
                      onClick={() => remover(m.key, f.id)}
                      aria-label={`Remover ${f.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * CRUD de ambientes (Sala, Cozinha, Suíte...) de uma planta — vive dentro
 * do card da própria planta porque uma planta tem vários ambientes, não
 * faz sentido cadastrá-los num passo separado do wizard. Persiste direto
 * no repositório a cada mudança (sem buffer/"salvar"): é só a lista, e ela
 * precisa refletir na aba Catálogo assim que muda, já que lá o item/opção
 * de cada ambiente é montado em cima dessa mesma lista (ver
 * CatalogoPlantaEditor). Grupo de verba ligado a um ambiente removido é
 * limpo junto, senão fica orfão.
 *
 * Nome vem sempre de `/catalogo/ambientes` (combo, não texto livre) —
 * mesma taxonomia fechada de Categoria/Marca (design.md §5).
 */
export function AmbientesManager({ empreendimentoId, plantaId }: { empreendimentoId: string; plantaId: string }) {
  const { catalogo, salvarCatalogo, catalogoAmbientes, construtoraLogadaId } = useApp();
  const construtoraId = construtoraLogadaId ?? "";
  const ambientes = catalogo.getAmbientesByPlanta(empreendimentoId, plantaId);
  const tipos = catalogoAmbientes.list(construtoraId);
  const [novoTipoId, setNovoTipoId] = useState(tipos[0]?.id ?? "");

  function addAmbiente() {
    const tipo = tipos.find((t) => t.id === novoTipoId);
    if (!tipo) return;
    const grupos = catalogo.getAllowanceGroupsByPlanta(empreendimentoId, plantaId);
    salvarCatalogo(empreendimentoId, plantaId, [...ambientes, { id: gerarId("amb"), nome: tipo.nome, itens: [] }], grupos);
  }
  function renomearAmbiente(ambienteId: string, nome: string) {
    const grupos = catalogo.getAllowanceGroupsByPlanta(empreendimentoId, plantaId);
    salvarCatalogo(empreendimentoId, plantaId, ambientes.map((a) => (a.id === ambienteId ? { ...a, nome } : a)), grupos);
  }
  function removeAmbiente(ambienteId: string) {
    const grupos = catalogo.getAllowanceGroupsByPlanta(empreendimentoId, plantaId).filter((g) => g.ambienteId !== ambienteId);
    salvarCatalogo(empreendimentoId, plantaId, ambientes.filter((a) => a.id !== ambienteId), grupos);
  }

  return (
    <div>
      <div className="stack gap-xs" style={{ marginBottom: 8 }}>
        <label className="label" style={{ margin: 0 }}>Ambientes desta planta</label>
        <div className="row gap-xs" style={{ alignItems: "center", flexWrap: "nowrap" }}>
          <select className="input" style={{ width: 160, flexShrink: 0 }} value={novoTipoId} onChange={(e) => setNovoTipoId(e.target.value)} disabled={tipos.length === 0}>
            {tipos.length === 0 && <option value="">Nenhum tipo cadastrado</option>}
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          <button type="button" className="btn btn--sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }} onClick={addAmbiente} disabled={!novoTipoId}>
            <Plus className="sidebar-nav-icon" /> Ambiente
          </button>
        </div>
      </div>
      {tipos.length === 0 && (
        <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 8 }}>
          Nenhum tipo de ambiente cadastrado ainda — cadastre em{" "}
          <Link to="/catalogo/ambientes">Cadastros auxiliares → Ambientes</Link>.
        </div>
      )}
      {ambientes.length === 0 && <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 8 }}>Nenhum ambiente ainda — adicione ao menos um (Sala, Cozinha, Suíte...).</div>}
      <div className="stack gap-xs">
        {ambientes.map((a) => (
          <div key={a.id} className="row gap-sm" style={{ alignItems: "center", border: "1px solid var(--rule)", borderRadius: 8, padding: "8px 10px", background: "var(--paper)" }}>
            <select className="input" style={{ flex: 1, minWidth: 0 }} value={a.nome} onChange={(e) => renomearAmbiente(a.id, e.target.value)}>
              {/* Se o ambiente foi renomeado/excluído no cadastro auxiliar depois de já usado aqui, a grafia atual continua aparecendo. */}
              {!tipos.some((t) => t.nome === a.nome) && <option value={a.nome}>{a.nome}</option>}
              {tipos.map((t) => (
                <option key={t.id} value={t.nome}>{t.nome}</option>
              ))}
            </select>
            <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4, flexShrink: 0 }} onClick={() => removeAmbiente(a.id)} aria-label="Remover ambiente">
              <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ))}
      </div>
      {ambientes.length > 0 && (
        <div className="text-soft" style={{ fontSize: 12, marginTop: 8 }}>
          Itens, materiais e opções de cada ambiente ficam na aba Catálogo do empreendimento.
        </div>
      )}
    </div>
  );
}

/**
 * CRUD de plantas (tipologias de unidade) de um empreendimento — passo
 * "Plantas" do wizard de Cadastro. Card não-selecionado mostra resumo
 * compacto; o formulário completo (características, ambientes, uploads)
 * só aparece pra planta selecionada. Uploads é a última seção — vem
 * depois de ambientes, que é o que se cadastra primeiro numa planta nova.
 */
export function PlantasManager({ empreendimentoId, plantaSelecionadaId, onSelecionar }: { empreendimentoId: string; plantaSelecionadaId?: string; onSelecionar?: (plantaId: string) => void }) {
  const { catalogo, salvarPlanta, removerPlanta } = useApp();
  const plantas = catalogo.listPlantas(empreendimentoId);

  function adicionarPlanta() {
    const id = gerarId("planta");
    salvarPlanta(empreendimentoId, {
      id, codigo: "", nome: "Nova planta", tipologia: "", versao: "1.0", dataVersao: null, status: "ativa",
      opcoesPermitidas: "", restricoes: "", arquivos: ARQUIVOS_PLANTA_VAZIOS,
    });
    onSelecionar?.(id);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Plantas do empreendimento</div>
        <button type="button" className="btn btn--sm" onClick={adicionarPlanta}>
          <Plus className="sidebar-nav-icon" /> Nova planta
        </button>
      </div>
      <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 16 }}>
        Um empreendimento raramente tem uma unidade só de tipologia — cadastre cada planta (código, características, versão) e depois
        monte o catálogo de cada uma separadamente. Clique numa planta pra editar os detalhes.
      </div>

      {plantas.length === 0 && <div className="text-soft" style={{ fontSize: 13 }}>Nenhuma planta cadastrada ainda.</div>}

      <div className="stack gap-sm">
        {plantas.map((p) => {
          const selecionada = p.id === plantaSelecionadaId;
          if (!selecionada) {
            return (
              <div
                key={p.id}
                className="row gap-sm"
                style={{ alignItems: "center", justifyContent: "space-between", border: "1px solid var(--rule)", borderRadius: 8, padding: "10px 12px", background: "var(--paper)", cursor: onSelecionar ? "pointer" : "default" }}
                onClick={() => onSelecionar?.(p.id)}
              >
                <div className="row gap-sm" style={{ alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nome || "Sem nome"}</span>
                  {p.codigo && <span className="mono text-soft" style={{ fontSize: 11 }}>{p.codigo}</span>}
                  <span className={p.status === "ativa" ? "badge badge--simples" : "badge badge--bloqueado"} style={{ fontSize: 10.5 }}>{p.status === "ativa" ? "Ativa" : "Inativa"}</span>
                </div>
                <span className="text-soft" style={{ fontSize: 12 }}>
                  {p.areaPrivativaM2 ? `${p.areaPrivativaM2} m² · ` : ""}{p.quartos != null ? `${p.quartos} quartos` : p.tipologia}
                </span>
              </div>
            );
          }
          return (
            <div key={p.id} className="card" style={{ border: "1px solid var(--rule-strong)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Identificação</div>
              <div className="grid grid-2" style={{ gap: 8, marginBottom: 14 }}>
                <div>
                  <label className="label">Código</label>
                  <input className="input" value={p.codigo} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, codigo: e.target.value })} placeholder="PA-01" />
                </div>
                <div>
                  <label className="label">Nome</label>
                  <input className="input" value={p.nome} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, nome: e.target.value })} placeholder="Planta A — 2 quartos" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Tipologia</label>
                  <input className="input" value={p.tipologia} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, tipologia: e.target.value })} placeholder="2 quartos, Studio, Garden..." />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Características</div>
              <div className="grid grid-2" style={{ gap: 8, marginBottom: 14 }}>
                <div>
                  <label className="label">Área privativa (m²)</label>
                  <input className="input" type="number" min={0} value={p.areaPrivativaM2 ?? ""} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, areaPrivativaM2: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="label">Área total (m²)</label>
                  <input className="input" type="number" min={0} value={p.areaTotalM2 ?? ""} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, areaTotalM2: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--rule)", margin: "4px 0 14px", paddingTop: 14 }}>
                <AmbientesManager empreendimentoId={empreendimentoId} plantaId={p.id} />
              </div>

              <div style={{ borderTop: "1px solid var(--rule)", margin: "4px 0 14px", paddingTop: 14 }}>
                <PlantaUploadsManager empreendimentoId={empreendimentoId} planta={p} />
              </div>

              <button
                type="button"
                style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0 }}
                onClick={() => removerPlanta(empreendimentoId, p.id)}
              >
                <Trash2 className="sidebar-nav-icon" style={{ width: 13, height: 13, marginRight: 4 }} /> Remover planta
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CelulaUnidade {
  numero: string;
  torreId: string;
  pavimento: number;
  posicao: number;
}

/**
 * Heatmap clicável pra associar unidade → planta/comprador/valor. Número
 * é sempre derivado de torre+pavimento+posição (numeroUnidade), nunca
 * digitado — o grid inteiro é gerado ao vivo a partir das Torres, só o
 * que o construtora clica e preenche (planta/cliente/valor) é persistido
 * (IUnidadeRepository, esparso por número).
 *
 * Clique alterna seleção (multi-seleção direta, sem modificador) — com
 * várias unidades selecionadas, "Associar planta" abre um modal e aplica
 * a mesma planta a todas de uma vez (cliente/valor não fazem sentido em
 * lote, cada venda é diferente). Com exatamente uma selecionada, o mesmo
 * modal também edita cliente/valor daquela unidade.
 */
/** Cor por planta, gerada automaticamente pelo índice (ângulo dourado
 * pra distribuir hues bem mesmo com poucas ou muitas plantas) — não é
 * uma paleta fixa de N cores que estoura quando o empreendimento cresce. */
function corPlanta(index: number): { bg: string; border: string } {
  const hue = Math.round((index * 137.508) % 360);
  return { bg: `hsl(${hue} 65% 88%)`, border: `hsl(${hue} 45% 55%)` };
}

/**
 * Dois modos: "Pintar planta" (padrão) — escolhe a planta-pincel numa
 * barra de chips coloridos (mesma cor da legenda) e clica nas unidades
 * pra aplicar direto, sem modal, sem passo de seleção; clique de novo
 * limpa. É o caminho rápido pra associar dezenas/centenas de unidades.
 * "Vendas / detalhes" — clique abre a unidade pra registrar cliente,
 * valor e (se preciso) trocar a planta, um registro de venda por vez.
 * `somentePintura` esconde o modo "Vendas / detalhes" inteiro — usado no
 * wizard de cadastro (só associação inicial de planta, cadastro simples).
 * `somenteVendas` é o oposto — trava em "detalhes", esconde o toggle e o
 * campo Planta do modal (isso já foi decidido no cadastro) e troca o campo
 * Cliente por autocomplete contra `clientesConhecidos` — usado na ação
 * "Vendas" da listagem de empreendimentos (ver UnidadesVendasPage), que só
 * existe pra registrar venda rápido, não pra reassociar planta.
 */
export function UnidadesHeatmap({
  empreendimentoId,
  torres,
  plantas,
  somentePintura,
  somenteVendas,
  clientesConhecidos = [],
}: {
  empreendimentoId: string;
  torres: Torre[];
  plantas: Planta[];
  somentePintura?: boolean;
  somenteVendas?: boolean;
  clientesConhecidos?: string[];
}) {
  const { unidadesRepo, salvarUnidade, garantirVinculoDaUnidade } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const salvas = unidadesRepo.listByEmpreendimento(empreendimentoId);
  const [modo, setModo] = useState<"pintar" | "detalhes">(somenteVendas ? "detalhes" : "pintar");
  const [pincel, setPincel] = useState<string | null>(plantas[0]?.id ?? null);
  const [unidadeModal, setUnidadeModal] = useState<CelulaUnidade | null>(null);
  const [plantaModal, setPlantaModal] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [valor, setValor] = useState(0);

  function corDaCelula(salva: UnidadeAssociada | undefined): string {
    if (salva?.clienteNome) return "var(--green-bg)";
    if (salva?.plantaId) {
      const idx = plantas.findIndex((p) => p.id === salva.plantaId);
      return idx >= 0 ? corPlanta(idx).bg : "var(--paper-2)";
    }
    return "var(--paper-2)";
  }

  function clicarCelula(cel: CelulaUnidade) {
    const existente = salvas.find((u) => u.numero === cel.numero);
    if (modo === "pintar") {
      if (existente?.clienteNome) {
        toast.error(`${cel.numero} já vendida — edite no modo "Vendas / detalhes".`);
        return;
      }
      salvarUnidade({
        numero: cel.numero,
        empreendimentoId,
        torreId: cel.torreId,
        pavimento: cel.pavimento,
        posicao: cel.posicao,
        plantaId: existente?.plantaId === pincel ? null : pincel,
        clienteNome: "",
        valor: existente?.valor ?? null,
      });
      return;
    }
    setUnidadeModal(cel);
    setPlantaModal(existente?.plantaId ?? "");
    setClienteNome(existente?.clienteNome ?? "");
    setValor(existente?.valor ?? 0);
  }

  function salvarDetalhes() {
    if (!unidadeModal) return;
    salvarUnidade({
      numero: unidadeModal.numero,
      empreendimentoId,
      torreId: unidadeModal.torreId,
      pavimento: unidadeModal.pavimento,
      posicao: unidadeModal.posicao,
      plantaId: plantaModal || null,
      clienteNome,
      valor: valor > 0 ? valor : null,
    });
    toast.success(`Unidade ${unidadeModal.numero} atualizada.`);
    setUnidadeModal(null);
  }

  /** Construtora inicia a personalização em nome do cliente que não sabe
   * usar o app — mesmo wizard do portal do cliente, ver NovaPersonalizacaoPage. */
  function iniciarPersonalizacao(unidade: UnidadeAssociada) {
    const vinculo = garantirVinculoDaUnidade(unidade);
    if (!vinculo) {
      toast.error("Essa unidade precisa de uma planta associada antes de personalizar.");
      return;
    }
    navigate(`/personalizar?vinculoId=${vinculo.id}`);
  }

  if (torres.length === 0) return null;

  const nomePincel = pincel ? (plantas.find((p) => p.id === pincel)?.nome ?? "") : "Sem planta";
  const unidadeSalvaAtual = unidadeModal ? salvas.find((u) => u.numero === unidadeModal.numero) : undefined;
  const jaVendida = somenteVendas && Boolean(unidadeSalvaAtual?.clienteNome);

  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{somenteVendas ? "Unidades" : "Associar unidades"}</div>
      <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Número gerado automaticamente (torre + pavimento + posição, ex. A301).
      </div>

      {!somentePintura && !somenteVendas && (
        <div className="row gap-sm" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn--sm"
            style={modo === "pintar" ? { background: "color-mix(in srgb, var(--brand) 14%, var(--card))", borderColor: "var(--brand)", color: "var(--brand)" } : {}}
            onClick={() => setModo("pintar")}
          >
            Pintar planta
          </button>
          <button
            type="button"
            className="btn btn--sm"
            style={modo === "detalhes" ? { background: "color-mix(in srgb, var(--brand) 14%, var(--card))", borderColor: "var(--brand)", color: "var(--brand)" } : {}}
            onClick={() => setModo("detalhes")}
          >
            Vendas / detalhes
          </button>
        </div>
      )}

      {(somentePintura || (modo === "pintar" && !somenteVendas)) ? (
        <div style={{ marginBottom: 14 }}>
          <div className="row gap-xs" style={{ flexWrap: "wrap", marginBottom: 8 }}>
            <button
              type="button"
              className="btn btn--sm"
              style={pincel === null ? { borderColor: "var(--ink)", boxShadow: "inset 0 0 0 1px var(--ink)" } : {}}
              onClick={() => setPincel(null)}
            >
              Sem planta
            </button>
            {plantas.map((p, i) => {
              const cor = corPlanta(i);
              const ativo = pincel === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="btn btn--sm"
                  style={{ background: cor.bg, borderColor: cor.border, boxShadow: ativo ? `inset 0 0 0 2px ${cor.border}` : "none" }}
                  onClick={() => setPincel(p.id)}
                >
                  {p.nome}
                </button>
              );
            })}
          </div>
          <div className="text-soft" style={{ fontSize: 12 }}>
            Clique numa unidade pra pintar com "{nomePincel}" — clique de novo pra limpar. Unidade já vendida não é repintada aqui.
          </div>
        </div>
      ) : (
        <div className="text-soft" style={{ fontSize: 12, marginBottom: 14 }}>
          {somenteVendas
            ? "Clique numa unidade pra registrar a venda (cliente e valor)."
            : "Clique numa unidade pra registrar cliente, valor e (se precisar) trocar a planta."}
        </div>
      )}

      <div className="stack gap-lg">
        {torres.map((t, ti) => (
          <div key={t.id}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{t.nome}</div>
            <div className="stack gap-xs">
              {Array.from({ length: t.unidadesPorPavimento.length }, (_, i) => t.unidadesPorPavimento.length - i).map((pav) => (
                <div key={pav} className="row gap-xs" style={{ alignItems: "center" }}>
                  <span className="mono text-soft" style={{ fontSize: 10, width: 20, flexShrink: 0, textAlign: "right" }}>{pav}</span>
                  {Array.from({ length: t.unidadesPorPavimento[pav - 1] }, (_, i) => i + 1).map((pos) => {
                    const numero = numeroUnidade(t.nome, ti, pav, pos);
                    const salva = salvas.find((u) => u.numero === numero);
                    const cel: CelulaUnidade = { numero, torreId: t.id, pavimento: pav, posicao: pos };
                    return (
                      <button
                        key={numero}
                        type="button"
                        onClick={() => clicarCelula(cel)}
                        title={numero}
                        style={{
                          width: 36,
                          height: 26,
                          fontSize: 9.5,
                          fontFamily: "'JetBrains Mono', monospace",
                          border: "1px solid var(--rule)",
                          borderRadius: 4,
                          background: corDaCelula(salva),
                          cursor: "pointer",
                          flexShrink: 0,
                          padding: 0,
                        }}
                      >
                        {numero}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="row gap-sm" style={{ marginTop: 16, fontSize: 11.5, color: "var(--ink-soft)", flexWrap: "wrap" }}>
        <span className="row gap-xs" style={{ alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--paper-2)", border: "1px solid var(--rule)" }} /> Unidade sem planta</span>
        {plantas.map((p, i) => (
          <span key={p.id} className="row gap-xs" style={{ alignItems: "center" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: corPlanta(i).bg }} /> {p.nome}
          </span>
        ))}
        {!somentePintura && (
          <span className="row gap-xs" style={{ alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--green-bg)" }} /> Vendida</span>
        )}
      </div>

      <Modal open={unidadeModal != null} onClose={() => setUnidadeModal(null)} title={unidadeModal ? `Unidade ${unidadeModal.numero}` : ""}>
        <div className="stack gap-sm">
          {!somenteVendas && (
            <FormField label="Planta">
              <select className="input" value={plantaModal} onChange={(e) => setPlantaModal(e.target.value)}>
                <option value="">Sem planta associada</option>
                {plantas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Valor (R$)">
            <MoedaInput value={valor} onChange={setValor} />
          </FormField>
          <FormField label="Cliente / comprador">
            {somenteVendas ? (
              <select className="input" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)}>
                <option value="">Selecione o cliente</option>
                {clientesConhecidos.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            ) : (
              <input className="input" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do comprador" />
            )}
          </FormField>
          {jaVendida && unidadeSalvaAtual && (
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", background: "var(--green-bg)", borderRadius: 8, padding: "8px 10px" }}>
              <span style={{ fontSize: 12, color: "var(--green-ink)" }}>Unidade já vendida — inicie a personalização em nome do cliente.</span>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => iniciarPersonalizacao(unidadeSalvaAtual)}>
                Iniciar personalização
              </button>
            </div>
          )}
          <div className="row gap-sm" style={{ justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" className="btn btn--sm" onClick={() => setUnidadeModal(null)}>Cancelar</button>
            <button type="button" className="btn btn--primary btn--sm" onClick={salvarDetalhes}>Salvar unidade</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface EditorProps {
  empreendimentoId: string;
  plantaId: string;
  construtoraId: string;
}

/** Mounted once per planta card dentro de PlantasManager — troca de planta
 * selecionada desmonta/remonta essa árvore, então o buffer local sempre
 * parte do catálogo salvo daquela planta, sem vazar edição entre plantas.
 * Verba compartilhada (AllowanceGroup) não tem mais UI de edição aqui —
 * removida a pedido; `grupos` só é lido e repassado intacto pra não
 * apagar dado legado ao salvar edição de item. */
export function CatalogoPlantaEditor({ empreendimentoId, plantaId, construtoraId }: EditorProps) {
  const { catalogo, catalogoMateriais, catalogoCategorias, catalogoMarcas, salvarCatalogo } = useApp();
  const ambientes = catalogo.getAmbientesByPlanta(empreendimentoId, plantaId);
  const grupos = catalogo.getAllowanceGroupsByPlanta(empreendimentoId, plantaId);
  const categorias = catalogoCategorias.list(construtoraId);
  const marcas = catalogoMarcas.list(construtoraId);
  const materiais: MaterialResolvido[] = catalogoMateriais.list(construtoraId).map((m) => ({
    ...m,
    categoriaNome: categorias.find((c) => c.id === m.categoriaId)?.nome ?? "?",
    marcaNome: marcas.find((mm) => mm.id === m.marcaId)?.nome ?? "?",
  }));

  function salvar(ambientesNovos: Ambiente[], gruposNovos: AllowanceGroup[]) {
    salvarCatalogo(empreendimentoId, plantaId, ambientesNovos, gruposNovos);
  }

  function updateItem(ambienteId: string, itemId: string, patch: Partial<Item>) {
    salvar(ambientes.map((a) => (a.id !== ambienteId ? a : { ...a, itens: a.itens.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) })), grupos);
  }
  function addItem(ambienteId: string) {
    salvar(
      ambientes.map((a) =>
        a.id !== ambienteId
          ? a
          : { ...a, itens: [...a.itens, { id: gerarId("item"), nome: "Novo item", nivel: 1, padrao: "", valorPadrao: 0, prazoInicio: null, prazoFim: null, opcoes: [] }] },
      ),
      grupos,
    );
  }
  function removeItem(ambienteId: string, itemId: string) {
    salvar(
      ambientes.map((a) => (a.id !== ambienteId ? a : { ...a, itens: a.itens.filter((i) => i.id !== itemId) })),
      grupos.map((g) => ({ ...g, itemIds: g.itemIds.filter((id) => id !== itemId) })),
    );
  }
  function updateItemOpcoes(ambienteId: string, itemId: string, updater: (opcoes: Opcao[]) => Opcao[]) {
    salvar(
      ambientes.map((a) => (a.id !== ambienteId ? a : { ...a, itens: a.itens.map((i) => (i.id !== itemId ? i : { ...i, opcoes: updater(i.opcoes) })) })),
      grupos,
    );
  }
  return (
    <div className="stack gap-lg">
      <div style={{ fontWeight: 700, fontSize: 16 }}>Catálogo — itens e opções por ambiente</div>

      {ambientes.length === 0 && (
        <div className="card text-soft" style={{ fontSize: 13 }}>Nenhum ambiente cadastrado nesta planta ainda — volte ao passo "Plantas" e adicione ambientes (Sala, Cozinha, Suíte...).</div>
      )}

      <div className="stack gap-lg">
        {ambientes.map((amb) => {
          return (
            <div key={amb.id} className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{amb.nome}</div>

              <div className="stack gap-sm" style={{ marginBottom: 14 }}>
                {amb.itens.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    categorias={categorias}
                    materiais={materiais}
                    onChange={(patch) => updateItem(amb.id, item.id, patch)}
                    onRemove={() => removeItem(amb.id, item.id)}
                    onOpcoesChange={(updater) => updateItemOpcoes(amb.id, item.id, updater)}
                  />
                ))}
              </div>

              <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
                <button type="button" className="btn btn--sm" onClick={() => addItem(amb.id)}>
                  <Plus className="sidebar-nav-icon" /> Item
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
