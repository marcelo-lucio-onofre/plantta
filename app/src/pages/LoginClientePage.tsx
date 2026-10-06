import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { planttaBrand } from "../data/mockData";
import { useApp } from "../state/AppContext";
import { compose, email as emailValidator, required } from "../domain/validation";

/**
 * Branded (white-label) client login — reachable at `/login/marca/:slug`,
 * one URL per construtora (set in MarcaPage). Signing in here goes
 * straight to that construtora's first vínculo (skipping the "meus
 * imóveis" picker the generic login uses) and the portal renders with its
 * brand throughout. Reads the brand live from the repository (what
 * MarcaPage edits) — this page renders before any session exists, so it
 * can't rely on loginScopeConstrutoraId.
 */
export function LoginClientePage() {
  const { slug } = useParams<{ slug: string }>();
  const { vinculos, brandRepo, loginCliente } = useApp();
  const navigate = useNavigate();

  const construtoraId = slug ? brandRepo.getConstrutoraIdBySlug(slug) : null;
  const brand = (construtoraId && brandRepo.getBrand(construtoraId)) || planttaBrand;
  const vinculoAlvo = vinculos.find((v) => v.construtoraId === construtoraId);

  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erroIdentificador, setErroIdentificador] = useState<string>();
  const [erroSenha, setErroSenha] = useState<string>();

  useEffect(() => {
    if (!brand.favicon) return;
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']") ?? document.createElement("link");
    link.rel = "icon";
    link.href = brand.favicon;
    document.head.appendChild(link);
  }, [brand.favicon]);

  if (!construtoraId) return <Navigate to="/login/cliente" replace />;

  function handleEnter() {
    const erroId = compose(required("Informe a unidade ou e-mail"), emailValidator())(identificador);
    const erroSe = required("Informe o CPF ou senha")(senha);
    setErroIdentificador(erroId);
    setErroSenha(erroSe);
    if (erroId || erroSe) return;
    loginCliente(vinculoAlvo?.id);
    navigate("/personalizacoes");
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexWrap: "wrap", fontFamily: "'Barlow','Plus Jakarta Sans',sans-serif" }}>
      <div
        style={{
          flex: "1 1 460px",
          minHeight: 420,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(160deg, ${brand.color} 0%, #0a0a0a 120%)`,
          color: "#fff",
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Foto da construtora — bem translúcida, é fundo mesmo, não
            protagonista: a marca (logo grande, estampada) é que domina. */}
        {brand.background && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('${brand.background}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.28,
              mixBlendMode: "luminosity",
            }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 70%, rgba(0,0,0,.9) 100%)" }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center" }}>
          {brand.logo ? (
            <img src={brand.logo} alt={brand.nome} style={{ maxHeight: 96, maxWidth: "70%", objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(0,0,0,.4))" }} />
          ) : (
            <div style={{ fontFamily: "'Noto Serif Display',serif", fontSize: 40, letterSpacing: ".08em", textTransform: "uppercase" }}>
              {brand.nome}
            </div>
          )}
          <svg width="140" height="14" viewBox="0 0 130 14" style={{ marginTop: 14 }}>
            <path d="M2 4 C 40 14, 90 14, 128 3" stroke={brand.color} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ position: "relative" }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.75)", marginBottom: 12, fontWeight: 600 }}>
            Portal exclusivo do cliente
          </div>
          <h1 style={{ fontFamily: "'Noto Serif Display',serif", fontWeight: 400, fontSize: "clamp(22px,3vw,28px)", lineHeight: 1.22, marginBottom: 12, maxWidth: "24ch" }}>
            Acompanhe a personalização do seu apartamento em tempo real.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,.85)", maxWidth: "40ch", marginBottom: 0 }}>
            Escolhas, crédito gerado e aprovação técnica — tudo num só lugar, sem planilha e sem e-mail perdido.
          </p>
        </div>
      </div>

      <div style={{ flex: "1 1 340px", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", background: "#fff" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div className="row gap-sm" style={{ alignItems: "center", marginBottom: 6 }}>
            {brand.favicon && <img src={brand.favicon} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }} />}
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#222" }}>Acesse seu apartamento</h2>
          </div>
          <p style={{ fontSize: 13, color: "#7b7b7b", marginBottom: 24, lineHeight: 1.5 }}>
            Entre com os dados enviados pela {brand.nome} no e-mail de boas-vindas.
          </p>

          <div className="stack gap-sm" style={{ marginBottom: 20 }}>
            <div>
              <label className="label">Unidade ou e-mail</label>
              <input
                className={erroIdentificador ? "input input--invalid" : "input"}
                type="email"
                value={identificador}
                placeholder="apto501@allianceboulevard.com.br"
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

          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ background: brand.color, textTransform: "uppercase", letterSpacing: ".04em" }}
            onClick={handleEnter}
          >
            Entrar
          </button>

          <div className="mono text-center text-soft" style={{ fontSize: 10.5, marginTop: 16 }}>
            Ambiente de demonstração — qualquer valor entra.
          </div>
        </div>
      </div>
    </div>
  );
}
