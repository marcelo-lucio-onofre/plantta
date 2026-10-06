import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { useApp } from "../state/AppContext";
import { compose, email as emailValidator, required } from "../domain/validation";

/**
 * Default client login — plantta's own look, entry point for clients who
 * may hold units across several construtoras. Doesn't know in advance
 * which one they want, so it sends them to "Meus imóveis" to pick.
 */
export function SimpleLoginClientePage() {
  const { loginCliente } = useApp();
  const navigate = useNavigate();

  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erroIdentificador, setErroIdentificador] = useState<string>();
  const [erroSenha, setErroSenha] = useState<string>();

  function handleEnter() {
    const erroId = compose(required("Informe a unidade ou e-mail"), emailValidator())(identificador);
    const erroSe = required("Informe o CPF ou senha")(senha);
    setErroIdentificador(erroId);
    setErroSenha(erroSe);
    if (erroId || erroSe) return;
    loginCliente();
    navigate("/personalizacoes");
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
            Cliente
          </span>
        </div>

        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Acesse seu apartamento</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 24, lineHeight: 1.5 }}>
          Entre com os dados enviados pela sua construtora no e-mail de boas-vindas.
        </p>

        <div className="stack gap-sm" style={{ marginBottom: 20 }}>
          <div>
            <label className="label">Unidade ou e-mail</label>
            <input
              className={erroIdentificador ? "input input--invalid" : "input"}
              type="email"
              value={identificador}
              placeholder="apto1204@aurora.com.br"
              onChange={(e) => { setIdentificador(e.target.value); setErroIdentificador(undefined); }}
              onBlur={() => setErroIdentificador(compose(required("Informe a unidade ou e-mail"), emailValidator())(identificador))}
            />
            {erroIdentificador && <div style={{ fontSize: 11.5, color: "var(--red-ink)", marginTop: 4 }}>{erroIdentificador}</div>}
          </div>
          <div>
            <label className="label">CPF ou senha</label>
            <input
              className={erroSenha ? "input input--invalid" : "input"}
              type="password"
              value={senha}
              placeholder="••••••••"
              onChange={(e) => { setSenha(e.target.value); setErroSenha(undefined); }}
              onBlur={() => setErroSenha(required("Informe o CPF ou senha")(senha))}
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
