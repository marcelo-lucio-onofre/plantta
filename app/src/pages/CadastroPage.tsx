import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building, Building2, FileStack, CheckCircle2, Grid3x3, Layers, Package, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { JanelaBadge } from "../components/Badge";
import { CatalogoPlantaEditor, PlantasManager, UnidadesHeatmap } from "../components/CatalogoAuthoring";
import { MaskedInput } from "../components/MaskedInput";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";
import { deInputDate, paraInputDate, totalUnidadesTorres } from "../domain/calculations";
import { maskCEP } from "../domain/mask";
import { mockEnderecoPorCep } from "../domain/cepMock";
import type { ArquivoCadastro, CategoriaArquivo, StatusComercialEmpreendimento, TipoEmpreendimento, Torre } from "../domain/types";

interface CategoriaMeta {
  key: CategoriaArquivo;
  label: string;
  accept: string;
  hint: string;
}

const META: CategoriaMeta[] = [
  { key: "logo", label: "Logo do empreendimento", accept: "image/*", hint: "Marca do empreendimento — capa, e-mails, material comercial." },
  { key: "imagens", label: "Imagens / renderizações", accept: "image/*", hint: "Fachada, perspectivas e fotos da obra." },
  { key: "memorialGeral", label: "Memorial descritivo geral", accept: ".pdf,.doc,.docx", hint: "Especificação de acabamentos e materiais padrão do empreendimento." },
  { key: "manualProprietario", label: "Manual do proprietário", accept: ".pdf,.doc,.docx", hint: "Entregue ao comprador na chave — uso e manutenção da unidade." },
  { key: "projetos", label: "Projetos", accept: ".dwg,.dxf,.pdf", hint: "Projetos técnicos completos (arquitetônico, estrutural, instalações)." },
  { key: "documentosTecnicos", label: "Documentos técnicos", accept: ".pdf,.doc,.docx", hint: "Laudos, ARTs/RRTs, licenças e demais documentos técnicos." },
  { key: "plantasGerais", label: "Plantas gerais", accept: ".pdf", hint: "Plantas baixas e cortes gerais do empreendimento." },
  { key: "tabelaUnidades", label: "Tabela de unidades", accept: ".pdf,.xls,.xlsx,.csv", hint: "Planilha ou PDF com a relação de unidades e valores." },
  { key: "materialComercial", label: "Material comercial", accept: "image/*,.pdf", hint: "Folder, book de vendas e demais peças comerciais." },
];

const ARQUIVOS_VAZIOS: Record<CategoriaArquivo, ArquivoCadastro[]> = {
  logo: [], imagens: [], memorialGeral: [], manualProprietario: [], projetos: [], documentosTecnicos: [], plantasGerais: [], tabelaUnidades: [], materialComercial: [],
};

const TIPOS: TipoEmpreendimento[] = ["Residencial", "Comercial", "Misto", "Loteamento"];

const gerarIdTorre = () => `torre-${Date.now()}-${Math.round(Math.random() * 10000)}`;

/** Input numérico com estado local — deixa o campo vazio enquanto o usuário
 * apaga e redigita (ex.: trocar "1" por "12"). Só valida/aplica o mínimo
 * quando o campo perde o foco; um input controlado direto pelo valor
 * clampado reescreve o dígito a cada tecla e trava em "1". */
function NumeroInput({ value, min, disabled, onCommit }: { value: number; min: number; disabled: boolean; onCommit: (n: number) => void }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => setRaw(String(value)), [value]);
  return (
    <input
      className="input"
      type="number"
      min={min}
      disabled={disabled}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        if (e.target.value === "") return;
        const n = Number(e.target.value);
        if (!Number.isNaN(n)) onCommit(Math.max(min, n));
      }}
      onBlur={() => {
        const n = Number(raw);
        setRaw(String(Math.max(min, Number.isNaN(n) ? value : n)));
      }}
      placeholder="Unidades"
    />
  );
}

/** Torres do empreendimento — pavimentos ficam por torre (nem sempre são
 * iguais entre torres), e cada pavimento tem sua própria quantidade de
 * unidades (raramente igual em todos os pavimentos). Total de unidades é
 * sempre derivado, nunca digitado à parte. */
function TorresManager({ torres, onChange, disabled }: { torres: Torre[]; onChange: (torres: Torre[]) => void; disabled: boolean }) {
  function addTorre() {
    onChange([...torres, { id: gerarIdTorre(), nome: `Torre ${String.fromCharCode(65 + torres.length)}`, unidadesPorPavimento: [1] }]);
  }
  function updateTorre(id: string, patch: Partial<Torre>) {
    onChange(torres.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function removeTorre(id: string) {
    onChange(torres.filter((t) => t.id !== id));
  }
  function addPavimento(t: Torre) {
    updateTorre(t.id, { unidadesPorPavimento: [...t.unidadesPorPavimento, 1] });
  }
  function updatePavimento(t: Torre, index: number, unidades: number) {
    const proximo = t.unidadesPorPavimento.map((u, i) => (i === index ? Math.max(1, unidades) : u));
    updateTorre(t.id, { unidadesPorPavimento: proximo });
  }
  function removePavimento(t: Torre, index: number) {
    updateTorre(t.id, { unidadesPorPavimento: t.unidadesPorPavimento.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <div className="row gap-sm" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <label className="label" style={{ margin: 0 }}>Torres / blocos *</label>
        {!disabled && (
          <button type="button" className="btn btn--sm" onClick={addTorre}>
            <Plus className="sidebar-nav-icon" /> Torre
          </button>
        )}
      </div>
      {torres.length === 0 && <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 8 }}>Nenhuma torre ainda — adicione ao menos uma.</div>}
      <div className="stack gap-sm">
        {torres.map((t) => (
          <div key={t.id} style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "8px 10px", background: "var(--paper)" }}>
            <div className="row gap-sm" style={{ alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <input className="input" style={{ flex: "1 1 140px" }} value={t.nome} disabled={disabled} onChange={(e) => updateTorre(t.id, { nome: e.target.value })} placeholder="Torre A" />
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, marginLeft: "auto" }}>
                = {t.unidadesPorPavimento.reduce((s, n) => s + n, 0)} unidades em {t.unidadesPorPavimento.length} pavimento{t.unidadesPorPavimento.length === 1 ? "" : "s"}
              </span>
              {!disabled && (
                <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4 }} onClick={() => removeTorre(t.id)} aria-label="Remover torre">
                  <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
            <div className="stack gap-xs">
              {t.unidadesPorPavimento.map((unidades, index) => (
                <div key={index} className="row gap-xs" style={{ alignItems: "center" }}>
                  <span className="text-soft" style={{ fontSize: 12, width: 90, flexShrink: 0 }}>Pavimento {index + 1}</span>
                  <div style={{ flex: "0 1 130px" }}>
                    <NumeroInput value={unidades} min={1} disabled={disabled} onCommit={(n) => updatePavimento(t, index, n)} />
                  </div>
                  <span className="text-soft" style={{ fontSize: 12 }}>unidades</span>
                  {!disabled && t.unidadesPorPavimento.length > 1 && (
                    <button type="button" style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", padding: 4 }} onClick={() => removePavimento(t, index)} aria-label="Remover pavimento">
                      <Trash2 className="sidebar-nav-icon" style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              ))}
              {!disabled && (
                <button type="button" className="btn btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => addPavimento(t)}>
                  <Plus className="sidebar-nav-icon" /> Pavimento
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {torres.length > 0 && (
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8 }}>
          Total do empreendimento: <strong className="mono" style={{ color: "var(--ink)" }}>{totalUnidadesTorres(torres)} unidades</strong> em {torres.length} torre{torres.length === 1 ? "" : "s"}.
        </div>
      )}
    </div>
  );
}

const STEPS = [
  { label: "Empreendimento", icon: Building2 },
  { label: "Torres", icon: Building },
  { label: "Plantas", icon: Layers },
  { label: "Associação", icon: Grid3x3 },
  { label: "Catálogo", icon: Package },
  { label: "Arquivos", icon: FileStack },
  { label: "Revisão", icon: CheckCircle2 },
];

function fmtSize(bytes: number): string {
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

/**
 * Cadastro de empreendimento — segue a hierarquia completa (ver design.md):
 * Empreendimento → Torres → Plantas (tipologias) → Associação (unidade →
 * planta/comprador) → Catálogo (ambientes/itens/opções, mesmo editor
 * reaproveitado no passo "Catálogo") → Arquivos → Revisão.
 *
 * O empreendimento só é criado de verdade (repositório) ao sair do passo
 * "Torres" — não antes — porque Empreendimento+Torres formam um bloco só
 * que trava junto (mudar torre depois que unidades/heatmap já existem
 * dessincroniza a numeração). Os dois primeiros passos vivem só em estado
 * local até lá. Os passos seguintes (Plantas/Associação/Catálogo) salvam
 * ao vivo no repositório assim que o empreendimento existe; "Confirmar
 * cadastro" no fim só anexa os arquivos, que é a única coisa ainda pendente.
 */
export function CadastroPage() {
  const { id } = useParams<{ id: string }>();
  const { vinculos, construtoraLogadaId, cadastros, cadastrarEmpreendimento, atualizarArquivosCadastro, catalogo, unidadesRepo, pessoasRepo } = useApp();
  const { runComLoading } = useLoading();
  const navigate = useNavigate();

  /** Retomando um cadastro existente (`/cadastro/:id`, vindo da listagem) —
   * Empreendimento+Torres já foram preenchidos e travam (ver `locked`
   * abaixo), só falta plantas/associação/catálogo/arquivos. `/cadastro/novo`
   * não tem :id, fluxo em branco. */
  const existente = id ? cadastros.find((c) => c.id === id) : undefined;

  const construtoraNome = vinculos.find((v) => v.construtoraId === construtoraLogadaId)?.construtoraNome ?? "Construtora";

  const [step, setStep] = useState(existente ? 2 : 0);
  const [nome, setNome] = useState(existente?.nome ?? "");
  const [codigoInterno, setCodigoInterno] = useState(existente?.codigoInterno ?? "");
  const [tipo, setTipo] = useState<TipoEmpreendimento>(existente?.tipo ?? "Residencial");
  const [endereco, setEndereco] = useState(existente?.endereco ?? "");
  const [cidade, setCidade] = useState(existente?.cidade ?? "");
  const [uf, setUf] = useState(existente?.uf ?? "");
  const [cep, setCep] = useState(existente?.cep ?? "");
  // Busca só dispara com CEP completo (8 dígitos) e no blur — não a cada
  // tecla, senão troca de endereço a cada dígito digitado.
  function handleCepBlur() {
    if (cep.replace(/\D/g, "").length !== 8) return;
    const mock = mockEnderecoPorCep(cep);
    if (mock) {
      runComLoading(() => {
        setEndereco(mock.rua);
        setCidade(mock.cidade);
        setUf(mock.uf);
      }, "Buscando endereço pelo CEP...");
    }
  }
  const [torres, setTorres] = useState<Torre[]>(existente?.torres ?? []);
  const [lancamento, setLancamento] = useState<string | null>(existente?.lancamento ?? null);
  const [previsaoEntrega, setPrevisaoEntrega] = useState<string | null>(existente?.previsaoEntrega ?? null);
  const [statusComercial] = useState<StatusComercialEmpreendimento>(existente?.statusComercial ?? "Planejamento");
  const [responsavelConstrutora, setResponsavelConstrutora] = useState(existente?.responsavelConstrutora ?? "");
  const [gerenteObra, setGerenteObra] = useState(existente?.gerenteObra ?? "");
  const [regrasPersonalizacao, setRegrasPersonalizacao] = useState(existente?.regrasPersonalizacao ?? "");
  const [empreendimentoIdCriado, setEmpreendimentoIdCriado] = useState<string | null>(existente?.id ?? null);
  const [plantaSelecionadaId, setPlantaSelecionadaId] = useState("");
  const [files, setFiles] = useState<Record<CategoriaArquivo, ArquivoCadastro[]>>(existente?.arquivos ?? ARQUIVOS_VAZIOS);
  const [finalizado, setFinalizado] = useState(false);

  function addFiles(key: CategoriaArquivo, list: FileList | null) {
    if (!list?.length) return;
    const incoming: ArquivoCadastro[] = Array.from(list).map((f) => ({ id: `${key}-${Date.now()}-${f.name}`, name: f.name, size: f.size }));
    setFiles((prev) => ({ ...prev, [key]: [...prev[key], ...incoming] }));
  }

  function removeFile(key: CategoriaArquivo, id: string) {
    setFiles((prev) => ({ ...prev, [key]: prev[key].filter((f) => f.id !== id) }));
  }

  const pessoasResponsaveis = (construtoraLogadaId ? pessoasRepo.list(construtoraLogadaId) : []).filter(
    (p) => !(p.papeis.length === 1 && p.papeis[0] === "Cliente"),
  );
  const nomesResponsaveis = [...new Set(pessoasResponsaveis.map((p) => p.nome))];

  const locked = Boolean(empreendimentoIdCriado);
  const nomePreenchido = Boolean(nome.trim());
  const torresPreenchidas = torres.length > 0 && torres.every((t) => t.unidadesPorPavimento.length > 0 && t.unidadesPorPavimento.every((u) => u > 0));
  const doneCount = META.filter((m) => files[m.key].length > 0).length;
  const totalFiles = META.reduce((n, m) => n + files[m.key].length, 0);
  const plantas = empreendimentoIdCriado ? catalogo.listPlantas(empreendimentoIdCriado) : [];
  const plantaId = plantas.some((p) => p.id === plantaSelecionadaId) ? plantaSelecionadaId : (plantas[0]?.id ?? "");
  const unidadesComPlanta = empreendimentoIdCriado ? unidadesRepo.listByEmpreendimento(empreendimentoIdCriado).filter((u) => u.plantaId).length : 0;

  function irPara(i: number) {
    if (i < step) setStep(i);
  }

  function handleCriarEmpreendimento() {
    if (!construtoraLogadaId || !nomePreenchido || !torresPreenchidas) return;
    if (!empreendimentoIdCriado) {
      const created = cadastrarEmpreendimento({
        nome,
        codigoInterno,
        construtoraId: construtoraLogadaId,
        construtora: construtoraNome,
        tipo,
        endereco,
        cidade,
        uf,
        cep,
        torres,
        lancamento,
        previsaoEntrega,
        statusComercial,
        responsavelConstrutora,
        gerenteObra,
        regrasPersonalizacao,
        arquivos: files,
      });
      setEmpreendimentoIdCriado(created.id);
    }
    setStep(2);
  }

  function handleConfirmar() {
    if (!empreendimentoIdCriado) return;
    atualizarArquivosCadastro(empreendimentoIdCriado, files);
    setFinalizado(true);
  }

  if (finalizado) {
    return (
      <div className="container container--narrow text-center" style={{ paddingTop: 64 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--green-bg)",
            color: "var(--green-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            margin: "0 auto 20px",
          }}
        >
          ✓
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 10 }}>Empreendimento cadastrado</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 26, maxWidth: "46ch", marginInline: "auto", lineHeight: 1.5 }}>
          {nome} foi criado com {plantas.length} planta{plantas.length === 1 ? "" : "s"} e {totalFiles} arquivos para {construtoraNome}.
        </p>
        <div className="row gap-sm" style={{ justifyContent: "center" }}>
          <Link to="/cadastro" className="btn btn--primary">Ver empreendimentos</Link>
          <button type="button" className="btn" onClick={() => navigate("/painel")}>Ir para o painel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <PageHeader
        breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Empreendimentos", to: "/cadastro" }, { label: existente ? nome || "Continuar" : "Novo empreendimento" }]}
        backTo="/cadastro"
        title={existente ? `Continuar cadastro — ${nome}` : "Cadastrar empreendimento"}
        description={`Empreendimento → plantas e unidades → catálogo (ambientes, itens, especificações e opções) → arquivos — em ${construtoraNome}.`}
      />

      <div className="row gap-sm" style={{ marginBottom: 28, flexWrap: "wrap" }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => irPara(i)}
              disabled={i > step}
              className="row gap-xs"
              style={{
                border: "none",
                background: "none",
                cursor: i < step ? "pointer" : "default",
                padding: "4px 8px 4px 0",
                opacity: i > step ? 0.4 : 1,
                fontSize: 12.5,
                fontWeight: current ? 700 : 600,
                color: current ? "var(--brand)" : done ? "var(--ink)" : "var(--ink-soft)",
              }}
            >
              <s.icon className="sidebar-nav-icon" />
              {i + 1}. {s.label}
              {i < STEPS.length - 1 && <span style={{ color: "var(--rule-strong)", marginLeft: 6 }}>›</span>}
            </button>
          );
        })}
      </div>

      {step === 0 && (
        <div className="stack gap-lg">
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Identificação</div>
            <div className="grid grid-2" style={{ gap: 8, marginBottom: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Nome do empreendimento *</label>
                <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Residencial Aurora" disabled={locked} />
              </div>
              <div>
                <label className="label">Código interno</label>
                <input className="input" value={codigoInterno} onChange={(e) => setCodigoInterno(e.target.value)} placeholder="EMP-AURORA-01" disabled={locked} />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Localização</div>
            <div style={{ marginBottom: 8, maxWidth: 200 }}>
              <label className="label">CEP</label>
              <MaskedInput mask={maskCEP} maxDigits={8} value={cep} onChange={setCep} onBlur={handleCepBlur} placeholder="00000-000" disabled={locked} />
            </div>
            <div className="grid grid-2" style={{ gap: 8, marginBottom: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Endereço</label>
                <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número" disabled={locked} />
                <div className="text-soft" style={{ fontSize: 11, marginTop: 4 }}>Rua vem do CEP — complete com o número.</div>
              </div>
              <div>
                <label className="label">Cidade</label>
                <input className="input" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="São Paulo" disabled={locked} />
              </div>
              <div>
                <label className="label">UF</label>
                <input className="input" value={uf} maxLength={2} onChange={(e) => setUf(e.target.value.toUpperCase())} placeholder="SP" disabled={locked} />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Características</div>
            <div>
              <label className="label">Tipo do empreendimento</label>
              <select className="input" style={{ maxWidth: 260 }} value={tipo} onChange={(e) => setTipo(e.target.value as TipoEmpreendimento)} disabled={locked}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", margin: "16px 0 4px" }}>Comercial</div>
            <div className="grid grid-2" style={{ gap: 8, marginBottom: 16 }}>
              <div>
                <label className="label">Lançamento</label>
                <input
                  className="input"
                  type="date"
                  disabled={locked}
                  value={lancamento ? paraInputDate(lancamento) : ""}
                  onChange={(e) => setLancamento(e.target.value ? deInputDate(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="label">Previsão de entrega</label>
                <input
                  className="input"
                  type="date"
                  disabled={locked}
                  value={previsaoEntrega ? paraInputDate(previsaoEntrega) : ""}
                  onChange={(e) => setPrevisaoEntrega(e.target.value ? deInputDate(e.target.value) : null)}
                />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Responsáveis</div>
            <div className="grid grid-2" style={{ gap: 8, marginBottom: 16 }}>
              <div>
                <label className="label">Responsável da construtora</label>
                <input
                  className="input"
                  list="responsaveis-sugestoes"
                  value={responsavelConstrutora}
                  onChange={(e) => setResponsavelConstrutora(e.target.value)}
                  placeholder="Nome"
                  disabled={locked}
                />
              </div>
              <div>
                <label className="label">Gerente da obra</label>
                <input
                  className="input"
                  list="responsaveis-sugestoes"
                  value={gerenteObra}
                  onChange={(e) => setGerenteObra(e.target.value)}
                  placeholder="Nome"
                  disabled={locked}
                />
              </div>
              <datalist id="responsaveis-sugestoes">
                {nomesResponsaveis.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Personalização</div>
            <div>
              <label className="label">Regras de personalização</label>
              <textarea
                className="input"
                rows={3}
                style={{ resize: "vertical", fontFamily: "inherit" }}
                value={regrasPersonalizacao}
                onChange={(e) => setRegrasPersonalizacao(e.target.value)}
                placeholder="Ex.: alterações estruturais vetadas, prazo mínimo de 15 dias entre escolha e execução..."
                disabled={locked}
              />
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>
                Não existe "prazo de personalização" próprio do empreendimento — a janela (início/fim) é calculada a partir do prazo de
                cada item no Catálogo (menor início, maior fim entre todos os itens). Assim que o primeiro item abrir, o registro já
                fica habilitado. Este campo é só pra regras em texto (o que pode/não pode), não datas.
              </div>
            </div>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="btn btn--primary" disabled={!nomePreenchido} onClick={() => setStep(1)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="stack gap-lg">
          <div className="card">
            <TorresManager torres={torres} onChange={setTorres} disabled={locked} />
            {locked && (
              <div style={{ fontSize: 12, color: "var(--green-ink)", marginTop: 16 }}>
                ✓ Empreendimento criado — dados básicos e torres ficam travados a partir daqui; o resto ainda pode ser ajustado depois.
              </div>
            )}
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn" onClick={() => setStep(0)}>Voltar</button>
            <button type="button" className="btn btn--primary" disabled={!torresPreenchidas} onClick={handleCriarEmpreendimento}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && empreendimentoIdCriado && (
        <div className="stack gap-lg">
          <PlantasManager empreendimentoId={empreendimentoIdCriado} plantaSelecionadaId={plantaId} onSelecionar={setPlantaSelecionadaId} />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn" onClick={() => setStep(1)}>Voltar</button>
            <button type="button" className="btn btn--primary" disabled={plantas.length === 0} onClick={() => setStep(3)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && empreendimentoIdCriado && (
        <div className="stack gap-lg">
          <UnidadesHeatmap empreendimentoId={empreendimentoIdCriado} torres={torres} plantas={plantas} somentePintura />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn" onClick={() => setStep(2)}>Voltar</button>
            <button type="button" className="btn btn--primary" onClick={() => setStep(4)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 4 && empreendimentoIdCriado && (
        <div className="stack gap-lg">
          {plantas.length > 1 && (
            <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
              {plantas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="btn btn--sm"
                  style={p.id === plantaId ? { background: "color-mix(in srgb, var(--brand) 14%, var(--card))", borderColor: "var(--brand)", color: "var(--brand)" } : {}}
                  onClick={() => setPlantaSelecionadaId(p.id)}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          )}
          {plantaId && (
            <CatalogoPlantaEditor key={plantaId} empreendimentoId={empreendimentoIdCriado} plantaId={plantaId} construtoraId={construtoraLogadaId ?? ""} />
          )}
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn" onClick={() => setStep(3)}>Voltar</button>
            <button type="button" className="btn btn--primary" onClick={() => setStep(5)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="container--narrow stack gap-lg" style={{ padding: 0 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Arquivos do empreendimento</div>
            <div className="mono text-soft" style={{ fontSize: 11 }}>{doneCount} de {META.length} categorias enviadas</div>
          </div>
          <div className="grid grid-2">
            {META.map((cat) => {
              const list = files[cat.key];
              const has = list.length > 0;
              return (
                <div
                  key={cat.key}
                  style={{
                    border: `2px dashed ${has ? "var(--green)" : "var(--rule-strong)"}`,
                    borderRadius: 10,
                    padding: 16,
                    background: has ? "var(--green-bg)" : "var(--paper)",
                  }}
                >
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{cat.label}</div>
                    <span className={has ? "badge badge--simples" : "badge badge--tecnico"}>
                      {has ? `✓ ${list.length} arquivo${list.length > 1 ? "s" : ""}` : "Opcional"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 10, lineHeight: 1.4 }}>{cat.hint}</div>
                  <input type="file" multiple accept={cat.accept} onChange={(e) => addFiles(cat.key, e.target.files)} style={{ fontSize: 12, maxWidth: "100%" }} />
                  {has && (
                    <div className="stack gap-xs" style={{ marginTop: 10 }}>
                      {list.map((chip) => (
                        <div key={chip.id} className="row" style={{ justifyContent: "space-between", background: "#fff", border: "1px solid var(--rule)", borderRadius: 6, padding: "6px 9px", fontSize: 11.5, gap: 8 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chip.name}</span>
                          <span className="row gap-sm" style={{ flexShrink: 0 }}>
                            <span className="mono text-soft">{fmtSize(chip.size)}</span>
                            <button
                              type="button"
                              style={{ border: "none", background: "none", color: "var(--red-ink)", cursor: "pointer", fontWeight: 700, fontSize: 14, padding: 0 }}
                              onClick={() => removeFile(cat.key, chip.id)}
                              aria-label={`Remover ${chip.name}`}
                            >
                              ×
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn" onClick={() => setStep(4)}>Voltar</button>
            <button type="button" className="btn btn--primary" onClick={() => setStep(6)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="container--narrow stack gap-lg" style={{ padding: 0 }}>
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Resumo</div>
            <div className="stack gap-sm">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Construtora</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{construtoraNome}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Empreendimento</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{nome}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Tipo</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tipo}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Localização</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{cidade && uf ? `${cidade}/${uf}` : "—"}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Torres / Unidades</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{torres.length} / {totalUnidadesTorres(torres)}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Status comercial</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{statusComercial}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Plantas cadastradas</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{plantas.length}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Unidades associadas a planta</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{unidadesComPlanta} / {totalUnidadesTorres(torres)}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Janela de personalização</span>
                {empreendimentoIdCriado ? <JanelaBadge itens={catalogo.listTodosItensDoEmpreendimento(empreendimentoIdCriado)} /> : <span style={{ fontSize: 13 }}>—</span>}
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="text-soft" style={{ fontSize: 13 }}>Arquivos enviados</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{totalFiles} ({doneCount} de {META.length} categorias)</span>
              </div>
            </div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn" onClick={() => setStep(5)}>Voltar</button>
            <button type="button" className="btn btn--primary" onClick={handleConfirmar}>
              Confirmar cadastro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
