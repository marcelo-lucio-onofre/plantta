import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ArtBadge, NivelBadge } from "./Badge";
import { SugestaoInput } from "./SugestaoInput";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { useToast } from "./Toast";
import { deInputDate, numeroUnidade, paraInputDate } from "../domain/calculations";
import { AMBIENTES_SUGERIDOS } from "../domain/catalogoReferencia";
import type { AllowanceGroup, Ambiente, CategoriaArquivoPlanta, Item, MaterialCatalogItem, NivelAprovacao, Opcao, Planta, StatusPlanta, Torre, UnidadeAssociada } from "../domain/types";
import { useApp } from "../state/AppContext";

export const gerarId = (prefixo: string) => `${prefixo}-${Date.now()}-${Math.round(Math.random() * 10000)}`;

/** Combina o que já está em uso (prioridade — mantém a grafia real do
 * construtora) com a lista de sugestão, sem duplicar por caixa/espaço. */
function dedupeCi(...listas: readonly (readonly string[])[]): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const lista of listas) {
    for (const v of lista) {
      const t = v.trim();
      if (!t || vistos.has(t.toLowerCase())) continue;
      vistos.add(t.toLowerCase());
      out.push(t);
    }
  }
  return out;
}

function OpcaoRow({ opcao, onChange, onRemove }: { opcao: Opcao; onChange: (patch: Partial<Opcao>) => void; onRemove: () => void }) {
  return (
    <div style={{ padding: "8px 0", borderTop: "1px solid var(--rule)" }}>
      <div className="row gap-sm" style={{ alignItems: "center", marginBottom: opcao.materialCatalogItemId ? 4 : 0 }}>
        <input className="input" style={{ flex: "2 1 160px" }} value={opcao.nome} onChange={(e) => onChange({ nome: e.target.value })} placeholder="Nome da opção" />
        <input className="input" style={{ flex: "1 1 100px" }} type="number" min={0} value={opcao.preco} onChange={(e) => onChange({ preco: Number(e.target.value) })} />
        <label className="row gap-xs" style={{ fontSize: 12, flexShrink: 0 }}>
          <input type="checkbox" checked={Boolean(opcao.padrao)} onChange={(e) => onChange({ padrao: e.target.checked })} /> Padrão
        </label>
        <label className="row gap-xs" style={{ fontSize: 12, flexShrink: 0 }}>
          <input type="checkbox" checked={Boolean(opcao.remocao)} onChange={(e) => onChange({ remocao: e.target.checked })} /> Remoção
        </label>
        <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4, flexShrink: 0 }} onClick={onRemove} aria-label="Remover opção">
          <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} />
        </button>
      </div>
      {opcao.materialCatalogItemId && (
        <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          Vinculado à biblioteca — o preço acima é só deste item e pode ser diferente do preço padrão do material na biblioteca.
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
  grupos: AllowanceGroup[];
  materiais: MaterialResolvido[];
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  onOpcoesChange: (updater: (opcoes: Opcao[]) => Opcao[]) => void;
  onAtribuirGrupo: (groupId: string) => void;
}

function ItemRow({ item, grupos, materiais, onChange, onRemove, onOpcoesChange, onAtribuirGrupo }: ItemRowProps) {
  const [materialParaAnexar, setMaterialParaAnexar] = useState("");

  function anexarOpcaoDaBiblioteca() {
    const material = materiais.find((m) => m.id === materialParaAnexar);
    if (!material) return;
    onOpcoesChange((opcoes) => [
      ...opcoes,
      { id: gerarId("op"), nome: `${material.marcaNome} ${material.modelo}`, preco: 0, materialCatalogItemId: material.id },
    ]);
    setMaterialParaAnexar("");
  }

  return (
    <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: 14, background: "var(--paper)" }}>
      <div className="row gap-sm" style={{ alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap" }}>
        <input className="input" style={{ flex: "1 1 200px" }} value={item.nome} onChange={(e) => onChange({ nome: e.target.value })} placeholder="Nome do item" />
        <NivelBadge nivel={item.nivel} />
        <ArtBadge requerArt={item.requerArt} />
        <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4 }} onClick={onRemove} aria-label="Remover item">
          <Trash2 className="sidebar-nav-icon" style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div className="grid grid-2" style={{ gap: 8, marginBottom: 10 }}>
        <div>
          <label className="label">Especificação padrão</label>
          <input className="input" value={item.padrao} onChange={(e) => onChange({ padrao: e.target.value })} placeholder="Porcelanato Standard 60×60" />
        </div>
        <div>
          <label className="label">Preço base / verba (R$)</label>
          <input className="input" type="number" min={0} value={item.valorPadrao} onChange={(e) => onChange({ valorPadrao: Number(e.target.value) })} />
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
            <input
              className="input"
              type="number"
              min={0}
              value={item.custoArt ?? 0}
              onChange={(e) => onChange({ custoArt: Number(e.target.value) })}
            />
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
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Grupo de verba compartilhada</label>
          <select className="input" value={item.allowanceGroupId ?? ""} onChange={(e) => onAtribuirGrupo(e.target.value)}>
            <option value="">Nenhum — verba própria do item</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
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
            <input
              className="input"
              type="number"
              min={0}
              value={item.custoPorUnidade?.total ?? 0}
              onChange={(e) => onChange({ custoPorUnidade: { ...item.custoPorUnidade, total: Number(e.target.value) } })}
            />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Opções</div>
          {item.opcoes.map((opt) => (
            <OpcaoRow
              key={opt.id}
              opcao={opt}
              onChange={(patch) => onOpcoesChange((opcoes) => opcoes.map((o) => (o.id === opt.id ? { ...o, ...patch } : o)))}
              onRemove={() => onOpcoesChange((opcoes) => opcoes.filter((o) => o.id !== opt.id))}
            />
          ))}
          <div className="row gap-sm" style={{ marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn--sm" onClick={() => onOpcoesChange((opcoes) => [...opcoes, { id: gerarId("op"), nome: "Nova opção", preco: 0 }])}>
              <Plus className="sidebar-nav-icon" /> Opção em branco
            </button>
            {materiais.length > 0 && (
              <div className="row gap-xs" style={{ alignItems: "center" }}>
                <select className="input" style={{ width: 200 }} value={materialParaAnexar} onChange={(e) => setMaterialParaAnexar(e.target.value)}>
                  <option value="">Anexar da biblioteca...</option>
                  {materiais.map((m) => (
                    <option key={m.id} value={m.id}>{m.categoriaNome} · {m.marcaNome} {m.modelo}</option>
                  ))}
                </select>
                <button type="button" className="btn btn--sm" disabled={!materialParaAnexar} onClick={anexarOpcaoDaBiblioteca}>Anexar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ARQUIVOS_PLANTA_VAZIOS: Planta["arquivos"] = {
  plantaArquitetonicaPdf: [], plantaImagem: [], dwg: [], plantaHumanizada: [], plantaMobiliada: [],
  plantaEletrica: [], plantaHidraulica: [], plantaPontos: [], memorialTipologia: [], renderizacoes: [],
  modelo3d: [],
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
  { key: "modelo3d", label: "Modelo 3D dos ambientes (.glb)", accept: ".glb,.gltf" },
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
 * CRUD de plantas (tipologias de unidade) de um empreendimento — usado
 * tanto no wizard de Cadastro (passo "Plantas e unidades") quanto em
 * CatalogoPage (pra trocar de planta antes de editar o catálogo dela).
 * Card não-selecionado mostra resumo compacto; o formulário completo
 * (características, versão, personalização, uploads) só aparece pra
 * planta selecionada — com 10 categorias de upload por planta, mostrar
 * tudo expandido pra toda planta ao mesmo tempo vira parede de campo.
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
            <div key={p.id} style={{ border: "2px solid var(--brand)", borderRadius: 8, padding: 14, background: "var(--green-bg)" }}>
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
                <div>
                  <label className="label">Quartos</label>
                  <input className="input" type="number" min={0} value={p.quartos ?? ""} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, quartos: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="label">Suítes</label>
                  <input className="input" type="number" min={0} value={p.suites ?? ""} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, suites: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="label">Banheiros</label>
                  <input className="input" type="number" min={0} value={p.banheiros ?? ""} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, banheiros: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label className="label">Vagas</label>
                  <input className="input" type="number" min={0} value={p.vagas ?? ""} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, vagas: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Configuração</div>
              <div style={{ marginBottom: 14 }}>
                <label className="label">Número de ambientes</label>
                <input className="input" style={{ maxWidth: 160 }} type="number" min={0} value={p.numeroAmbientes ?? ""} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, numeroAmbientes: e.target.value ? Number(e.target.value) : undefined })} />
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Versão / Status</div>
              <div className="grid grid-2" style={{ gap: 8, marginBottom: 14 }}>
                <div>
                  <label className="label">Versão da planta</label>
                  <input className="input" value={p.versao} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, versao: e.target.value })} placeholder="1.0" />
                </div>
                <div>
                  <label className="label">Data da versão</label>
                  <input
                    className="input"
                    type="date"
                    value={p.dataVersao ? paraInputDate(p.dataVersao) : ""}
                    onChange={(e) => salvarPlanta(empreendimentoId, { ...p, dataVersao: e.target.value ? deInputDate(e.target.value) : null })}
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={p.status} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, status: e.target.value as StatusPlanta })}>
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Personalização</div>
              <div className="grid grid-2" style={{ gap: 8, marginBottom: 14 }}>
                <div>
                  <label className="label">Opções permitidas</label>
                  <input className="input" value={p.opcoesPermitidas} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, opcoesPermitidas: e.target.value })} placeholder="Piso, revestimento, metais..." />
                </div>
                <div>
                  <label className="label">Restrições</label>
                  <input className="input" value={p.restricoes} onChange={(e) => salvarPlanta(empreendimentoId, { ...p, restricoes: e.target.value })} placeholder="Sem alteração de estrutura..." />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Unidades associadas a esta planta</label>
                  <input
                    className="input"
                    value={p.unidadesLabel ?? ""}
                    onChange={(e) => salvarPlanta(empreendimentoId, { ...p, unidadesLabel: e.target.value })}
                    placeholder="Ex.: 101-110, 201-210, Torre A andares 2-14"
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Uploads</div>
              <div style={{ marginBottom: 14 }}>
                {META_ARQUIVOS_PLANTA.map((m) => (
                  <UploadCompactRow
                    key={m.key}
                    label={m.label}
                    accept={m.accept}
                    arquivos={p.arquivos[m.key]}
                    onAdd={(list) => {
                      if (!list?.length) return;
                      const incoming = Array.from(list).map((f) => ({ id: `${m.key}-${Date.now()}-${f.name}`, name: f.name, size: f.size }));
                      salvarPlanta(empreendimentoId, { ...p, arquivos: { ...p.arquivos, [m.key]: [...p.arquivos[m.key], ...incoming] } });
                    }}
                    onClear={() => salvarPlanta(empreendimentoId, { ...p, arquivos: { ...p.arquivos, [m.key]: [] } })}
                  />
                ))}
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
export function UnidadesHeatmap({ empreendimentoId, torres, plantas }: { empreendimentoId: string; torres: Torre[]; plantas: Planta[] }) {
  const { unidadesRepo, salvarUnidade } = useApp();
  const toast = useToast();
  const salvas = unidadesRepo.listByEmpreendimento(empreendimentoId);
  const [selecionadas, setSelecionadas] = useState<Map<string, CelulaUnidade>>(new Map());
  const [modalAberto, setModalAberto] = useState(false);
  const [plantaId, setPlantaId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [valor, setValor] = useState("");

  function toggle(cel: CelulaUnidade) {
    setSelecionadas((prev) => {
      const next = new Map(prev);
      if (next.has(cel.numero)) next.delete(cel.numero);
      else next.set(cel.numero, cel);
      return next;
    });
  }

  function abrirModal() {
    if (selecionadas.size === 1) {
      const numero = [...selecionadas.keys()][0];
      const salva = salvas.find((u) => u.numero === numero);
      setPlantaId(salva?.plantaId ?? "");
      setClienteNome(salva?.clienteNome ?? "");
      setValor(salva?.valor != null ? String(salva.valor) : "");
    } else {
      setPlantaId("");
      setClienteNome("");
      setValor("");
    }
    setModalAberto(true);
  }

  function aplicar() {
    const unica = selecionadas.size === 1;
    for (const [numero, cel] of selecionadas) {
      const existente = salvas.find((u) => u.numero === numero);
      const registro: UnidadeAssociada = {
        numero,
        empreendimentoId,
        torreId: cel.torreId,
        pavimento: cel.pavimento,
        posicao: cel.posicao,
        plantaId: plantaId || null,
        clienteNome: unica ? clienteNome : (existente?.clienteNome ?? ""),
        valor: unica ? (valor ? Number(valor) : null) : (existente?.valor ?? null),
      };
      salvarUnidade(registro);
    }
    toast.success(unica ? "Unidade atualizada." : `${selecionadas.size} unidades associadas.`);
    setModalAberto(false);
    setSelecionadas(new Map());
  }

  if (torres.length === 0) return null;

  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Associar unidades</div>
      <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 16 }}>
        Número gerado automaticamente (torre + pavimento + posição, ex. A301) — clique pra selecionar uma ou várias unidades, depois associe a planta de uma vez.
      </div>

      <div className="stack gap-lg">
        {torres.map((t, ti) => (
          <div key={t.id}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{t.nome}</div>
            <div className="stack gap-xs">
              {Array.from({ length: t.pavimentos }, (_, i) => t.pavimentos - i).map((pav) => (
                <div key={pav} className="row gap-xs" style={{ alignItems: "center" }}>
                  <span className="mono text-soft" style={{ fontSize: 10, width: 20, flexShrink: 0, textAlign: "right" }}>{pav}</span>
                  {Array.from({ length: t.unidadesPorPavimento }, (_, i) => i + 1).map((pos) => {
                    const numero = numeroUnidade(t.nome, ti, pav, pos);
                    const salva = salvas.find((u) => u.numero === numero);
                    const isSel = selecionadas.has(numero);
                    let bg = "var(--paper-2)";
                    if (salva?.clienteNome) bg = "var(--green-bg)";
                    else if (salva?.plantaId) bg = "var(--amber-bg)";
                    return (
                      <button
                        key={numero}
                        type="button"
                        onClick={() => toggle({ numero, torreId: t.id, pavimento: pav, posicao: pos })}
                        title={numero}
                        style={{
                          width: 36,
                          height: 26,
                          fontSize: 9.5,
                          fontFamily: "'IBM Plex Mono', monospace",
                          border: isSel ? "2px solid var(--brand)" : "1px solid var(--rule)",
                          borderRadius: 4,
                          background: bg,
                          boxShadow: isSel ? "inset 0 0 0 1px var(--brand)" : "none",
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

      <div className="row gap-sm" style={{ marginTop: 16, fontSize: 11.5, color: "var(--ink-soft)" }}>
        <span className="row gap-xs" style={{ alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--paper-2)", border: "1px solid var(--rule)" }} /> Livre</span>
        <span className="row gap-xs" style={{ alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--amber-bg)" }} /> Planta associada</span>
        <span className="row gap-xs" style={{ alignItems: "center" }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--green-bg)" }} /> Vendida</span>
      </div>

      {selecionadas.size > 0 && (
        <div className="row gap-sm" style={{ marginTop: 16, alignItems: "center", justifyContent: "space-between", background: "var(--paper)", borderRadius: 8, padding: "10px 14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {selecionadas.size} unidade{selecionadas.size > 1 ? "s" : ""} selecionada{selecionadas.size > 1 ? "s" : ""}
          </span>
          <div className="row gap-sm">
            <button type="button" className="btn btn--sm" onClick={() => setSelecionadas(new Map())}>Limpar seleção</button>
            <button type="button" className="btn btn--primary btn--sm" onClick={abrirModal}>Associar planta</button>
          </div>
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={selecionadas.size === 1 ? `Unidade ${[...selecionadas.keys()][0]}` : `Associar planta — ${selecionadas.size} unidades`}
      >
        <div className="stack gap-sm">
          <FormField label="Planta">
            <select className="input" value={plantaId} onChange={(e) => setPlantaId(e.target.value)}>
              <option value="">Sem planta associada</option>
              {plantas.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </FormField>
          {selecionadas.size === 1 && (
            <>
              <FormField label="Valor (R$)">
                <input className="input" type="number" min={0} value={valor} onChange={(e) => setValor(e.target.value)} />
              </FormField>
              <FormField label="Cliente / comprador">
                <input className="input" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do comprador" />
              </FormField>
            </>
          )}
          <div className="row gap-sm" style={{ justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" className="btn btn--sm" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="button" className="btn btn--primary btn--sm" onClick={aplicar}>
              {selecionadas.size === 1 ? "Salvar unidade" : `Aplicar a ${selecionadas.size} unidades`}
            </button>
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

/** Remounted (via `key`) every time the selected empreendimento+planta
 * changes, so its local edit buffer always starts from that planta's own
 * saved catalog instead of leaking edits across plantas/empreendimentos.
 * Usado tanto em CatalogoPage quanto no wizard de Cadastro. */
export function CatalogoPlantaEditor({ empreendimentoId, plantaId, construtoraId }: EditorProps) {
  const { catalogo, catalogoMateriais, catalogoCategorias, catalogoMarcas, salvarCatalogo } = useApp();
  const [ambientes, setAmbientes] = useState<Ambiente[]>(() => catalogo.getAmbientesByPlanta(empreendimentoId, plantaId));
  const [grupos, setGrupos] = useState<AllowanceGroup[]>(() => catalogo.getAllowanceGroupsByPlanta(empreendimentoId, plantaId));
  const [dirty, setDirty] = useState(false);
  const categorias = catalogoCategorias.list(construtoraId);
  const marcas = catalogoMarcas.list(construtoraId);
  const materiais: MaterialResolvido[] = catalogoMateriais.list(construtoraId).map((m) => ({
    ...m,
    categoriaNome: categorias.find((c) => c.id === m.categoriaId)?.nome ?? "?",
    marcaNome: marcas.find((mm) => mm.id === m.marcaId)?.nome ?? "?",
  }));

  function mutarAmbientes(updater: (prev: Ambiente[]) => Ambiente[]) {
    setAmbientes(updater);
    setDirty(true);
  }
  function mutarGrupos(updater: (prev: AllowanceGroup[]) => AllowanceGroup[]) {
    setGrupos(updater);
    setDirty(true);
  }

  function updateAmbiente(ambienteId: string, patch: Partial<Ambiente>) {
    mutarAmbientes((prev) => prev.map((a) => (a.id === ambienteId ? { ...a, ...patch } : a)));
  }
  function addAmbiente() {
    mutarAmbientes((prev) => [...prev, { id: gerarId("amb"), nome: "Novo ambiente", itens: [] }]);
  }
  function removeAmbiente(ambienteId: string) {
    mutarAmbientes((prev) => prev.filter((a) => a.id !== ambienteId));
    mutarGrupos((prev) => prev.filter((g) => g.ambienteId !== ambienteId));
  }

  function updateItem(ambienteId: string, itemId: string, patch: Partial<Item>) {
    mutarAmbientes((prev) => prev.map((a) => (a.id !== ambienteId ? a : { ...a, itens: a.itens.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) })));
  }
  function addItem(ambienteId: string) {
    mutarAmbientes((prev) =>
      prev.map((a) =>
        a.id !== ambienteId
          ? a
          : { ...a, itens: [...a.itens, { id: gerarId("item"), nome: "Novo item", nivel: 1, padrao: "", valorPadrao: 0, prazoInicio: null, prazoFim: null, opcoes: [] }] },
      ),
    );
  }
  function removeItem(ambienteId: string, itemId: string) {
    mutarAmbientes((prev) => prev.map((a) => (a.id !== ambienteId ? a : { ...a, itens: a.itens.filter((i) => i.id !== itemId) })));
    mutarGrupos((prev) => prev.map((g) => ({ ...g, itemIds: g.itemIds.filter((id) => id !== itemId) })));
  }
  function updateItemOpcoes(ambienteId: string, itemId: string, updater: (opcoes: Opcao[]) => Opcao[]) {
    mutarAmbientes((prev) =>
      prev.map((a) => (a.id !== ambienteId ? a : { ...a, itens: a.itens.map((i) => (i.id !== itemId ? i : { ...i, opcoes: updater(i.opcoes) })) })),
    );
  }
  function atribuirGrupo(ambienteId: string, itemId: string, novoGroupId: string) {
    updateItem(ambienteId, itemId, { allowanceGroupId: novoGroupId || undefined });
    mutarGrupos((prev) =>
      prev.map((g) => {
        if (g.id === novoGroupId) return g.itemIds.includes(itemId) ? g : { ...g, itemIds: [...g.itemIds, itemId] };
        return g.itemIds.includes(itemId) ? { ...g, itemIds: g.itemIds.filter((id) => id !== itemId) } : g;
      }),
    );
  }

  function addGrupo(ambienteId: string) {
    mutarGrupos((prev) => [...prev, { id: gerarId("ag"), nome: "Nova verba", ambienteId, valorTotal: 0, itemIds: [] }]);
  }
  function updateGrupo(groupId: string, patch: Partial<AllowanceGroup>) {
    mutarGrupos((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  }
  function removeGrupo(groupId: string) {
    mutarGrupos((prev) => prev.filter((g) => g.id !== groupId));
    mutarAmbientes((prev) => prev.map((a) => ({ ...a, itens: a.itens.map((i) => (i.allowanceGroupId === groupId ? { ...i, allowanceGroupId: undefined } : i)) })));
  }

  function handleSalvar() {
    salvarCatalogo(empreendimentoId, plantaId, ambientes, grupos);
    setDirty(false);
  }

  return (
    <div className="stack gap-lg">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Ambientes e itens</div>
        <div className="row gap-sm" style={{ alignItems: "center" }}>
          {dirty && <span style={{ fontSize: 12, color: "var(--amber-ink)" }}>Alterações não salvas</span>}
          <button type="button" className="btn btn--primary btn--sm" onClick={handleSalvar}>Salvar catálogo</button>
        </div>
      </div>

      {ambientes.length === 0 && (
        <div className="card text-soft" style={{ fontSize: 13 }}>Nenhum ambiente cadastrado nesta planta ainda.</div>
      )}

      <div className="stack gap-lg">
        {ambientes.map((amb) => {
          const gruposDoAmbiente = grupos.filter((g) => g.ambienteId === amb.id);
          const ambientesConhecidos = dedupeCi(ambientes.map((a) => a.nome), AMBIENTES_SUGERIDOS);
          return (
            <div key={amb.id} className="card">
              <div className="row gap-sm" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <SugestaoInput
                  style={{ maxWidth: 260, fontWeight: 700 }}
                  value={amb.nome}
                  options={ambientesConhecidos}
                  onChange={(v) => updateAmbiente(amb.id, { nome: v })}
                />
                <button type="button" className="btn btn--sm" onClick={() => removeAmbiente(amb.id)}>
                  <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} /> Remover ambiente
                </button>
              </div>

              <div className="stack gap-sm" style={{ marginBottom: 14 }}>
                {amb.itens.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    grupos={gruposDoAmbiente}
                    materiais={materiais}
                    onChange={(patch) => updateItem(amb.id, item.id, patch)}
                    onRemove={() => removeItem(amb.id, item.id)}
                    onOpcoesChange={(updater) => updateItemOpcoes(amb.id, item.id, updater)}
                    onAtribuirGrupo={(groupId) => atribuirGrupo(amb.id, item.id, groupId)}
                  />
                ))}
              </div>

              <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
                <button type="button" className="btn btn--sm" onClick={() => addItem(amb.id)}>
                  <Plus className="sidebar-nav-icon" /> Item
                </button>
                <button type="button" className="btn btn--sm" onClick={() => addGrupo(amb.id)}>
                  <Plus className="sidebar-nav-icon" /> Verba compartilhada neste ambiente
                </button>
              </div>

              {gruposDoAmbiente.length > 0 && (
                <div className="stack gap-sm" style={{ marginTop: 14 }}>
                  {gruposDoAmbiente.map((g) => (
                    <div key={g.id} className="row gap-sm" style={{ alignItems: "center", border: "1px dashed var(--rule-strong)", borderRadius: 8, padding: 10, flexWrap: "wrap" }}>
                      <input className="input" style={{ flex: "1 1 160px" }} value={g.nome} onChange={(e) => updateGrupo(g.id, { nome: e.target.value })} />
                      <input className="input" style={{ flex: "0 1 140px" }} type="number" min={0} value={g.valorTotal} onChange={(e) => updateGrupo(g.id, { valorTotal: Number(e.target.value) })} />
                      <span className="text-soft" style={{ fontSize: 12 }}>{g.itemIds.length} item(ns) vinculado(s) — atribua pelo campo "Grupo de verba" em cada item</span>
                      <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer" }} onClick={() => removeGrupo(g.id)} aria-label="Remover verba">
                        <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="btn" style={{ alignSelf: "flex-start" }} onClick={addAmbiente}>
        <Plus className="sidebar-nav-icon" /> Novo ambiente
      </button>
    </div>
  );
}
