import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { FormField } from "../components/FormField";
import { useToast } from "../components/Toast";
import { MaskedInput } from "../components/MaskedInput";
import { useApp } from "../state/AppContext";
import { useLoading } from "../state/LoadingContext";
import { compose, email as emailValidator, required } from "../domain/validation";
import { maskCPF, maskTelefone } from "../domain/mask";
import { gerarSenhaAcesso } from "../domain/calculations";
import { enviarEmail } from "../domain/email";
import type { Pessoa } from "../domain/types";

const ARQUIVOS_VAZIOS: Pessoa["arquivos"] = {
  documentoProfissional: [], carteiraRegistro: [], certificados: [], artRrt: [], contratos: [], projetosDocumentosTecnicos: [],
};

type Draft = Omit<Pessoa, "id" | "construtoraId">;
type Errors = Partial<Record<"nome" | "email", string>>;

const VAZIO: Draft = {
  papeis: ["Cliente"], nome: "", cpf: "", email: "", telefone: "", empresa: "", cargoEspecialidade: "",
  conselho: "", numeroRegistro: "", ufRegistro: "", statusRegistro: "Ativo",
  endereco: "", estadoCivil: "", canalContatoPreferencial: "", observacoes: "", arquivos: ARQUIVOS_VAZIOS,
};

/**
 * Cadastro de cliente — enxuto de propósito (design.md: cliente não
 * precisa de registro profissional, empresa, cargo nem upload). Ao
 * cadastrar, gera e "envia" (toast, sem backend de e-mail real neste
 * protótipo) a senha de acesso ao portal; "Reenviar senha" gera uma nova
 * a qualquer momento — mesmo fluxo, só reaproveitado pro reset.
 */
export function ClienteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { construtoraLogadaId, pessoasRepo, criarPessoa, atualizarPessoa } = useApp();
  const { runComLoading } = useLoading();
  const construtoraId = construtoraLogadaId ?? "";
  const existente = id ? pessoasRepo.list(construtoraId).find((p) => p.id === id) : undefined;

  const [draft, setDraft] = useState<Draft>(existente ? { ...existente } : VAZIO);
  const [errors, setErrors] = useState<Errors>({});

  if (id && !existente) {
    return (
      <div className="container">
        <PageHeader breadcrumb={[{ label: "Painel", to: "/painel" }, { label: "Clientes", to: "/pessoas/clientes" }, { label: "Não encontrado" }]} title="Cliente não encontrado" />
      </div>
    );
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function validarTudo(): boolean {
    const next: Errors = {
      nome: required("Nome é obrigatório")(draft.nome),
      email: compose(required("E-mail é obrigatório — é pra lá que vai a senha de acesso"), emailValidator())(draft.email),
    };
    Object.keys(next).forEach((k) => next[k as keyof Errors] === undefined && delete next[k as keyof Errors]);
    setErrors(next);
    if (next.nome) document.getElementById("cliente-nome")?.focus();
    else if (next.email) document.getElementById("cliente-email")?.focus();
    return Object.keys(next).length === 0;
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!validarTudo()) return;

    if (existente) {
      atualizarPessoa(existente.id, draft);
      toast.success("Cliente atualizado.");
      navigate("/pessoas/clientes");
      return;
    }

    const senha = gerarSenhaAcesso();
    runComLoading(async () => {
      criarPessoa({ construtoraId, ...draft, senhaAcesso: senha });
      return enviarEmail({
        to_email: draft.email,
        to_name: draft.nome,
        subject: "Acesso ao portal de personalização",
        message: `Seu cadastro foi criado. Senha de acesso: ${senha}`,
      });
    }, "Enviando e-mail de boas-vindas...").then((enviado) => {
      // Sem EmailJS configurado (.env), cai no modo simulado — a senha
      // aparece aqui mesmo, mesmo aviso das telas de login de cliente.
      toast.success(enviado ? `Cadastro criado. E-mail enviado para ${draft.email}.` : `Cadastro criado. Senha de acesso enviada para ${draft.email}: ${senha}`);
      navigate("/pessoas/clientes");
    });
  }

  function reenviarSenha() {
    if (!existente) return;
    const senha = gerarSenhaAcesso();
    runComLoading(async () => {
      atualizarPessoa(existente.id, { senhaAcesso: senha });
      return enviarEmail({
        to_email: existente.email,
        to_name: existente.nome,
        subject: "Nova senha de acesso",
        message: `Sua nova senha de acesso: ${senha}`,
      });
    }, "Enviando nova senha...").then((enviado) => {
      toast.success(enviado ? `Nova senha enviada para ${existente.email}.` : `Nova senha enviada para ${existente.email}: ${senha}`);
    });
  }

  return (
    <div className="container container--narrow">
      <PageHeader
        breadcrumb={[
          { label: "Painel", to: "/painel" },
          { label: "Clientes", to: "/pessoas/clientes" },
          { label: existente ? existente.nome || "Editar" : "Novo cliente" },
        ]}
        backTo="/pessoas/clientes"
        title={existente ? "Editar cliente" : "Novo cliente"}
        action={
          existente && (
            <button type="button" className="btn btn--sm" onClick={reenviarSenha}>
              <KeyRound className="sidebar-nav-icon" /> Reenviar senha
            </button>
          )
        }
      />

      <form onSubmit={salvar}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <FormField label="Nome" htmlFor="cliente-nome" required error={errors.nome}>
              <input
                id="cliente-nome"
                className={errors.nome ? "input input--invalid" : "input"}
                value={draft.nome}
                placeholder="Nome completo"
                onChange={(e) => { set("nome", e.target.value); setErrors((er) => ({ ...er, nome: undefined })); }}
                onBlur={() => setErrors((er) => ({ ...er, nome: required("Nome é obrigatório")(draft.nome) }))}
              />
            </FormField>
            <FormField label="CPF" htmlFor="cliente-cpf">
              <MaskedInput id="cliente-cpf" mask={maskCPF} maxDigits={11} value={draft.cpf} placeholder="000.000.000-00" onChange={(v) => set("cpf", v)} />
            </FormField>
            <FormField label="E-mail" htmlFor="cliente-email" required error={errors.email} hint={existente ? undefined : "Pra onde vai a senha de acesso ao portal."}>
              <input
                id="cliente-email"
                type="email"
                className={errors.email ? "input input--invalid" : "input"}
                value={draft.email}
                placeholder="nome@email.com"
                onChange={(e) => { set("email", e.target.value); setErrors((er) => ({ ...er, email: undefined })); }}
                onBlur={() => setErrors((er) => ({ ...er, email: compose(required("E-mail é obrigatório — é pra lá que vai a senha de acesso"), emailValidator())(draft.email) }))}
              />
            </FormField>
            <FormField label="Telefone / WhatsApp" htmlFor="cliente-telefone">
              <MaskedInput id="cliente-telefone" mask={maskTelefone} maxDigits={11} value={draft.telefone} placeholder="(11) 90000-0000" onChange={(v) => set("telefone", v)} />
            </FormField>
            <FormField label="Canal de contato preferencial" htmlFor="cliente-canal">
              <input id="cliente-canal" className="input" value={draft.canalContatoPreferencial} placeholder="WhatsApp, e-mail, telefone..." onChange={(e) => set("canalContatoPreferencial", e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <FormField label="Observações" htmlFor="cliente-observacoes">
            <textarea id="cliente-observacoes" className="input" rows={2} style={{ resize: "vertical", fontFamily: "inherit" }} value={draft.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </FormField>
        </div>

        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={() => navigate("/pessoas/clientes")}>Cancelar</button>
          <button type="submit" className="btn btn--primary">{existente ? "Salvar cliente" : "Cadastrar e enviar senha"}</button>
        </div>
      </form>
    </div>
  );
}
