import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { MaskedInput } from "../components/MaskedInput";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";
import { required } from "../domain/validation";
import { maskCEP, maskCPF, maskTelefone } from "../domain/mask";
import { mockEnderecoPorCep } from "../domain/cepMock";
import type { Pessoa, StatusRegistroProfissional, TipoPapel } from "../domain/types";

/** Cliente vive em ClienteFormPage agora — este formulário é só pra quem
 * a construtora contrata/consulta (arquiteto, engenheiro, técnico...). */
const PAPEIS: Exclude<TipoPapel, "Cliente">[] = ["Arquiteto", "Engenheiro", "Técnico", "Designer", "Projetista", "Consultor", "Responsável pela construtora", "Outro"];
const STATUS_REGISTRO: StatusRegistroProfissional[] = ["Ativo", "Inativo"];

/** Só esses papéis têm registro em conselho profissional de verdade (CAU/
 * CREA) — Designer/Projetista/Consultor/Responsável/Outro não, então o
 * card de "Registro profissional" nem aparece pra eles (dinâmico pelo
 * papel selecionado, como pedido — sem campo que não faz sentido pro
 * papel escolhido). */
const PAPEIS_COM_REGISTRO: TipoPapel[] = ["Arquiteto", "Engenheiro", "Técnico"];

const ARQUIVOS_VAZIOS: Pessoa["arquivos"] = {
  documentoProfissional: [], carteiraRegistro: [], certificados: [], artRrt: [], contratos: [], projetosDocumentosTecnicos: [],
};

type Draft = Omit<Pessoa, "id" | "construtoraId">;
type Errors = Partial<Record<"nome" | "papeis", string>>;

const VAZIO: Draft = {
  papeis: [], nome: "", cpf: "", email: "", telefone: "", empresa: "", cargoEspecialidade: "",
  conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo",
  endereco: "", estadoCivil: "", canalContatoPreferencial: "", observacoes: "", arquivos: ARQUIVOS_VAZIOS,
};

export function FuncionarioFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { construtoraLogadaId, pessoasRepo, criarPessoa, atualizarPessoa } = useApp();
  const { runComLoading } = useLoading();
  const construtoraId = construtoraLogadaId ?? "";
  const existente = id ? pessoasRepo.list(construtoraId).find((p) => p.id === id) : undefined;

  const [draft, setDraft] = useState<Draft>(existente ? { ...existente } : VAZIO);
  const [errors, setErrors] = useState<Errors>({});
  // Pessoa só guarda `endereco` como string única (sem cep/cidade/uf
  // próprios) — o CEP aqui é só um atalho de UI que compõe essa string,
  // não um campo persistido à parte.
  const [cep, setCep] = useState("");

  if (id && !existente) {
    return (
      <div className="container">
        <PageHeader breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Funcionários", to: "/pessoas/funcionarios" }, { label: "Não encontrado" }]} title="Funcionário não encontrado" />
      </div>
    );
  }

  const precisaRegistro = draft.papeis.some((p) => PAPEIS_COM_REGISTRO.includes(p));

  function togglePapel(papel: TipoPapel) {
    setDraft((d) => ({ ...d, papeis: d.papeis.includes(papel) ? d.papeis.filter((x) => x !== papel) : [...d.papeis, papel] }));
    setErrors((e) => ({ ...e, papeis: undefined }));
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleCepBlur() {
    if (cep.replace(/\D/g, "").length !== 8) return;
    const mock = mockEnderecoPorCep(cep);
    if (mock) runComLoading(() => set("endereco", `${mock.rua}, ${mock.cidade}/${mock.uf}`), "Buscando endereço pelo CEP...");
  }

  function validarTudo(): boolean {
    const next: Errors = {
      nome: required("Nome é obrigatório")(draft.nome),
      papeis: draft.papeis.length === 0 ? "Selecione pelo menos um papel" : undefined,
    };
    Object.keys(next).forEach((k) => next[k as keyof Errors] === undefined && delete next[k as keyof Errors]);
    setErrors(next);
    if (next.papeis) document.getElementById("func-papeis")?.scrollIntoView({ block: "center" });
    else if (next.nome) document.getElementById("func-nome")?.focus();
    return Object.keys(next).length === 0;
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!validarTudo()) return;
    if (existente) {
      atualizarPessoa(existente.id, draft);
    } else {
      criarPessoa({ construtoraId, ...draft });
    }
    toast.success(existente ? "Funcionário atualizado." : "Funcionário criado.");
    navigate("/pessoas/funcionarios");
  }

  return (
    <div className="container container--narrow">
      <PageHeader
        breadcrumb={[
          { label: "Painel", to: "/painel" },
          { label: "Funcionários", to: "/pessoas/funcionarios" },
          { label: existente ? existente.nome || "Editar" : "Novo funcionário" },
        ]}
        backTo="/pessoas/funcionarios"
        title={existente ? "Editar funcionário" : "Novo funcionário"}
      />

      <form onSubmit={salvar}>
        <div className="card" style={{ marginBottom: 16 }} id="func-papeis">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 4 }}>Papel(éis)</div>
          <div className="row gap-sm" style={{ flexWrap: "wrap" }}>
            {PAPEIS.map((papel) => (
              <label key={papel} className="row gap-xs" style={{ fontSize: 12.5, alignItems: "center", border: "1px solid var(--rule)", borderRadius: 6, padding: "4px 8px" }}>
                <input type="checkbox" checked={draft.papeis.includes(papel)} onChange={() => togglePapel(papel)} /> {papel}
              </label>
            ))}
          </div>
          {errors.papeis && <div className="field-error">{errors.papeis}</div>}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 12 }}>Dados essenciais</div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <FormField label="Nome" htmlFor="func-nome" required error={errors.nome}>
              <input
                id="func-nome"
                className={errors.nome ? "input input--invalid" : "input"}
                value={draft.nome}
                placeholder="Nome completo"
                onChange={(e) => { set("nome", e.target.value); setErrors((er) => ({ ...er, nome: undefined })); }}
                onBlur={() => setErrors((er) => ({ ...er, nome: required("Nome é obrigatório")(draft.nome) }))}
              />
            </FormField>
            <FormField label="CPF" htmlFor="func-cpf">
              <MaskedInput id="func-cpf" mask={maskCPF} maxDigits={11} value={draft.cpf} placeholder="000.000.000-00" onChange={(v) => set("cpf", v)} />
            </FormField>
            <FormField label="E-mail" htmlFor="func-email">
              <input id="func-email" type="email" className="input" value={draft.email} placeholder="nome@email.com" onChange={(e) => set("email", e.target.value)} />
            </FormField>
            <FormField label="Telefone / WhatsApp" htmlFor="func-telefone">
              <MaskedInput id="func-telefone" mask={maskTelefone} maxDigits={11} value={draft.telefone} placeholder="(11) 90000-0000" onChange={(v) => set("telefone", v)} />
            </FormField>
            <FormField label="Empresa" htmlFor="func-empresa">
              <input id="func-empresa" className="input" value={draft.empresa} placeholder="Empresa/escritório" onChange={(e) => set("empresa", e.target.value)} />
            </FormField>
            <FormField label="Cargo / especialidade" htmlFor="func-cargo">
              <input id="func-cargo" className="input" value={draft.cargoEspecialidade} placeholder="Arquiteta responsável" onChange={(e) => set("cargoEspecialidade", e.target.value)} />
            </FormField>
          </div>
        </div>

        {precisaRegistro && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 12 }}>Registro profissional</div>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <FormField label="Conselho" htmlFor="func-conselho">
                <input id="func-conselho" className="input" value={draft.conselho} placeholder="CAU, CREA, CFT..." onChange={(e) => set("conselho", e.target.value)} />
              </FormField>
              <FormField label="Número do registro" htmlFor="func-numeroRegistro">
                <input id="func-numeroRegistro" className="input" value={draft.numeroRegistro} onChange={(e) => set("numeroRegistro", e.target.value)} />
              </FormField>
              <FormField label="UF" htmlFor="func-ufRegistro">
                <input id="func-ufRegistro" className="input" value={draft.ufRegistro} maxLength={2} placeholder="SP" onChange={(e) => set("ufRegistro", e.target.value.toUpperCase())} />
              </FormField>
              <FormField label="Status" htmlFor="func-statusRegistro">
                <select id="func-statusRegistro" className="input" value={draft.statusRegistro} onChange={(e) => set("statusRegistro", e.target.value as StatusRegistroProfissional)}>
                  {STATUS_REGISTRO.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 12 }}>Endereço / contato</div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div>
              <FormField label="CEP" htmlFor="func-cep">
                <MaskedInput id="func-cep" mask={maskCEP} maxDigits={8} value={cep} onChange={setCep} onBlur={handleCepBlur} />
              </FormField>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="Endereço" htmlFor="func-endereco" hint="Rua/cidade/UF vêm do CEP — complete com o número.">
                <input id="func-endereco" className="input" value={draft.endereco} placeholder="Rua, número, cidade/UF" onChange={(e) => set("endereco", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Canal de contato preferencial" htmlFor="func-canal">
              <input id="func-canal" className="input" value={draft.canalContatoPreferencial} placeholder="WhatsApp, e-mail, telefone..." onChange={(e) => set("canalContatoPreferencial", e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <FormField label="Observações" htmlFor="func-observacoes">
            <textarea id="func-observacoes" className="input" rows={2} style={{ resize: "vertical", fontFamily: "inherit" }} value={draft.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </FormField>
        </div>

        {/* Upload de documentos removido temporariamente (pedido explícito) —
            META_ARQUIVOS/ARQUIVOS_VAZIOS continuam existindo no tipo Pessoa,
            só a UI de anexar some daqui até voltar. */}

        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={() => navigate("/pessoas/funcionarios")}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Salvar funcionário</button>
        </div>
      </form>
    </div>
  );
}
