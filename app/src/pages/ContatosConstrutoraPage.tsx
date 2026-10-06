import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { MaskedInput } from "../components/MaskedInput";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";
import { cnpjCpf, email as emailValidator, required, uf as ufValidator } from "../domain/validation";
import { maskCEP, maskCNPJ, maskTelefone } from "../domain/mask";
import { mockEnderecoPorCep } from "../domain/cepMock";
import type { ContatoConstrutora } from "../domain/types";

type Errors = Partial<Record<keyof ContatoConstrutora, string>>;

const VAZIO: ContatoConstrutora = {
  razaoSocial: "", nomeFantasia: "", cnpj: "", telefone: "", email: "", site: "", cep: "", endereco: "", cidade: "", uf: "", responsavel: "",
};

const VALIDATORS: Partial<Record<keyof ContatoConstrutora, (v: string) => string | undefined>> = {
  razaoSocial: required("Razão social é obrigatória"),
  cnpj: cnpjCpf(),
  email: emailValidator(),
  uf: ufValidator(),
};

export function ContatosConstrutoraPage() {
  const { vinculos, construtoraLogadaId, contatoConstrutoraRepo, saveContatoConstrutora } = useApp();
  const { runComLoading } = useLoading();
  const toast = useToast();
  const construtoraId = construtoraLogadaId ?? "";
  const construtoraNome = vinculos.find((v) => v.construtoraId === construtoraId)?.construtoraNome ?? "Construtora";
  const salvo = contatoConstrutoraRepo.getContato(construtoraId);

  const [draft, setDraft] = useState<ContatoConstrutora>(salvo ?? { ...VAZIO, razaoSocial: construtoraNome });
  const [errors, setErrors] = useState<Errors>({});

  function setField<K extends keyof ContatoConstrutora>(key: K, value: ContatoConstrutora[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function blurField(key: keyof ContatoConstrutora) {
    const validator = VALIDATORS[key];
    if (!validator) return;
    setErrors((e) => ({ ...e, [key]: validator(draft[key]) }));
  }

  function handleCepBlur() {
    if (draft.cep.replace(/\D/g, "").length !== 8) return;
    const mock = mockEnderecoPorCep(draft.cep);
    if (mock) {
      runComLoading(() => {
        setField("endereco", mock.rua);
        setField("cidade", mock.cidade);
        setField("uf", mock.uf);
      }, "Buscando endereço pelo CEP...");
    }
  }

  function validarTudo(): boolean {
    const next: Errors = {};
    for (const key of Object.keys(VALIDATORS) as (keyof ContatoConstrutora)[]) {
      const err = VALIDATORS[key]!(draft[key]);
      if (err) next[key] = err;
    }
    setErrors(next);
    const firstKey = Object.keys(next)[0];
    if (firstKey) document.getElementById(`contato-${firstKey}`)?.focus();
    return Object.keys(next).length === 0;
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!construtoraId || !validarTudo()) return;
    runComLoading(() => saveContatoConstrutora(construtoraId, draft), "Salvando dados da construtora...").then(() => {
      toast.success("Dados da construtora atualizados.");
    });
  }

  return (
    <div className="container container--narrow">
      <PageHeader
        breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Contatos" }]}
        title="Contatos da construtora"
        description="Dados institucionais e de contato — quem procurar em caso de dúvida sobre um empreendimento ou solicitação."
      />

      <form onSubmit={salvar}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 12 }}>Identificação</div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <FormField label="Razão social" htmlFor="contato-razaoSocial" required error={errors.razaoSocial}>
              <input
                id="contato-razaoSocial"
                className={errors.razaoSocial ? "input input--invalid" : "input"}
                value={draft.razaoSocial}
                placeholder="Prado Engenharia Ltda"
                onChange={(e) => setField("razaoSocial", e.target.value)}
                onBlur={() => blurField("razaoSocial")}
              />
            </FormField>
            <FormField label="Nome fantasia" htmlFor="contato-nomeFantasia">
              <input id="contato-nomeFantasia" className="input" value={draft.nomeFantasia} placeholder="Prado Engenharia" onChange={(e) => setField("nomeFantasia", e.target.value)} />
            </FormField>
            <FormField label="CNPJ" htmlFor="contato-cnpj" error={errors.cnpj}>
              <MaskedInput
                id="contato-cnpj"
                className={errors.cnpj ? "input input--invalid" : "input"}
                mask={maskCNPJ}
                maxDigits={14}
                value={draft.cnpj}
                placeholder="00.000.000/0001-00"
                onChange={(v) => setField("cnpj", v)}
                onBlur={() => blurField("cnpj")}
              />
            </FormField>
            <FormField label="Responsável" htmlFor="contato-responsavel">
              <input id="contato-responsavel" className="input" value={draft.responsavel} placeholder="Nome do contato principal" onChange={(e) => setField("responsavel", e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 12 }}>Contato</div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <FormField label="Telefone" htmlFor="contato-telefone">
              <MaskedInput id="contato-telefone" mask={maskTelefone} maxDigits={11} value={draft.telefone} placeholder="(11) 3000-0000" onChange={(v) => setField("telefone", v)} />
            </FormField>
            <FormField label="E-mail" htmlFor="contato-email" error={errors.email}>
              <input
                id="contato-email"
                type="email"
                className={errors.email ? "input input--invalid" : "input"}
                value={draft.email}
                placeholder="contato@construtora.com.br"
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => blurField("email")}
              />
            </FormField>
            <FormField label="Site" htmlFor="contato-site">
              <input id="contato-site" className="input" value={draft.site} placeholder="www.construtora.com.br" onChange={(e) => setField("site", e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 12 }}>Endereço</div>
          <div style={{ marginBottom: 12, maxWidth: 200 }}>
            <FormField label="CEP" htmlFor="contato-cep">
              <MaskedInput id="contato-cep" mask={maskCEP} maxDigits={8} value={draft.cep} placeholder="00000-000" onChange={(v) => setField("cep", v)} onBlur={handleCepBlur} />
            </FormField>
          </div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FormField label="Endereço" htmlFor="contato-endereco" hint="Rua vem do CEP — complete com o número.">
                <input id="contato-endereco" className="input" value={draft.endereco} placeholder="Rua, número" onChange={(e) => setField("endereco", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Cidade" htmlFor="contato-cidade">
              <input id="contato-cidade" className="input" value={draft.cidade} placeholder="São Paulo" onChange={(e) => setField("cidade", e.target.value)} />
            </FormField>
            <FormField label="UF" htmlFor="contato-uf" error={errors.uf}>
              <input
                id="contato-uf"
                className={errors.uf ? "input input--invalid" : "input"}
                value={draft.uf}
                maxLength={2}
                placeholder="SP"
                onChange={(e) => setField("uf", e.target.value.toUpperCase())}
                onBlur={() => blurField("uf")}
              />
            </FormField>
          </div>
        </div>

        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn--primary">Salvar dados</button>
        </div>
      </form>
    </div>
  );
}
