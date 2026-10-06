import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { useApp } from "../state/AppContext";
import { compose, email as emailValidator, required } from "../domain/validation";

export function LoginConstrutoraPage() {
  const { vinculos, loginConstrutora } = useApp();
  const navigate = useNavigate();

  const construtoras = [...new Map(vinculos.map((v) => [v.construtoraId, v.construtoraNome])).entries()];
  const [construtoraId, setConstrutoraId] = useState(construtoras[0]?.[0] ?? "");
  const [emailCorp, setEmailCorp] = useState("");
  const [senha, setSenha] = useState("");
  const [erroEmail, setErroEmail] = useState<string>();
  const [erroSenha, setErroSenha] = useState<string>();

  function handleEnter() {
    if (!construtoraId) return;
    const erroEm = compose(required("Informe o e-mail corporativo"), emailValidator())(emailCorp);
    const erroSe = required("Informe a senha")(senha);
    setErroEmail(erroEm);
    setErroSenha(erroSe);
    if (erroEm || erroSe) return;
    loginConstrutora(construtoraId);
    navigate("/painel");
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", background: "var(--navy)" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 16, padding: "32px 28px", boxShadow: "0 20px 50px -30px rgba(0,0,0,.5)" }}>
        <div className="row gap-sm" style={{ marginBottom: 22 }}>
          <BrandMark light={false} />
          <span
            className="mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--ink-soft)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              borderLeft: "1px solid var(--rule-strong)",
              paddingLeft: 8,
            }}
          >
            Construtora
          </span>
        </div>

        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Painel da construtora</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 22, lineHeight: 1.5 }}>
          Acesse a fila de aprovação, o cadastro de empreendimentos e a marca do seu portal de cliente.
        </p>

        <div className="stack gap-sm" style={{ marginBottom: 20 }}>
          <div>
            <label className="label">Construtora</label>
            <select className="input" value={construtoraId} onChange={(e) => setConstrutoraId(e.target.value)}>
              {construtoras.map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">E-mail corporativo</label>
            <input
              className={erroEmail ? "input input--invalid" : "input"}
              type="email"
              value={emailCorp}
              placeholder="voce@construtora.com.br"
              onChange={(e) => { setEmailCorp(e.target.value); setErroEmail(undefined); }}
              onBlur={() => setErroEmail(compose(required("Informe o e-mail corporativo"), emailValidator())(emailCorp))}
            />
            {erroEmail && <div style={{ fontSize: 11.5, color: "var(--red-ink)", marginTop: 4 }}>{erroEmail}</div>}
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              className={erroSenha ? "input input--invalid" : "input"}
              type="password"
              value={senha}
              placeholder="••••••••"
              onChange={(e) => { setSenha(e.target.value); setErroSenha(undefined); }}
              onBlur={() => setErroSenha(required("Informe a senha")(senha))}
            />
            {erroSenha && <div style={{ fontSize: 11.5, color: "var(--red-ink)", marginTop: 4 }}>{erroSenha}</div>}
          </div>
        </div>

        <button type="button" className="btn btn--primary btn--block" onClick={handleEnter}>
          Entrar
        </button>

        <div className="mono text-center text-soft" style={{ fontSize: 10.5, marginTop: 16 }}>
          Ambiente de demonstração — qualquer valor entra.
        </div>
      </div>
    </div>
  );
}
