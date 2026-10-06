import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "../components/Breadcrumb";
import { useApp } from "../state/AppContext";

const SWATCHES = ["#35492e", "#fd3541", "#2e9e68", "#0163a3", "#7c3aed", "#d9622b", "#0891b2"];

function slugify(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MarcaPage() {
  const { vinculos, construtoraLogadaId, brandRepo, saveBrand } = useApp();
  const navigate = useNavigate();

  const construtoraNome = vinculos.find((v) => v.construtoraId === construtoraLogadaId)?.construtoraNome ?? "Construtora";
  const brand = construtoraLogadaId ? brandRepo.getBrand(construtoraLogadaId) : null;

  const [nome, setNome] = useState(brand?.nome ?? construtoraNome);
  const [slug, setSlug] = useState(brand?.slug ?? slugify(construtoraNome));
  const [slugTocado, setSlugTocado] = useState(Boolean(brand?.slug));
  const [color, setColor] = useState(brand?.color ?? SWATCHES[0]);
  const [logo, setLogo] = useState<string | null>(brand?.logo ?? null);
  const [background, setBackground] = useState<string | null>(brand?.background ?? null);
  const [favicon, setFavicon] = useState<string | null>(brand?.favicon ?? null);

  const initial = nome.trim()[0]?.toUpperCase() ?? "P";
  const loginUrl = `${window.location.origin}/login/marca/${slug || "sua-marca"}`;

  function handleNome(v: string) {
    setNome(v);
    if (!slugTocado) setSlug(slugify(v));
  }

  function handleSlug(v: string) {
    setSlugTocado(true);
    setSlug(slugify(v));
  }

  function handleLogo(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleBackground(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBackground(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleFavicon(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFavicon(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!construtoraLogadaId) return;
    saveBrand(construtoraLogadaId, { nome, slug, color, logo, background, favicon });
    navigate("/painel");
  }

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Painel", to: "/painel" }, { label: "Marca" }]} />
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Personalizar portal do cliente</h1>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 28, maxWidth: "58ch", lineHeight: 1.5 }}>
        Cor e logo aparecem na tela de login e no portal que o comprador acessa — o resto da plataforma continua com a marca padrão.
      </p>

      <div className="row gap-lg" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 380px" }} className="stack gap">
          <div className="card">
            <label className="label">Nome de exibição</label>
            <input className="input" value={nome} onChange={(e) => handleNome(e.target.value)} placeholder="Prado Engenharia" />
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6 }}>
              Substitui "plantta" no cabeçalho do login e do portal do cliente.
            </div>
          </div>

          <div className="card">
            <label className="label">Endereço de login (URL)</label>
            <input className="input mono" value={slug} onChange={(e) => handleSlug(e.target.value)} placeholder="sua-marca" />
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6, wordBreak: "break-all" }}>
              Link que você divulga pro cliente: <span className="mono">{loginUrl}</span>
            </div>
          </div>

          <div className="card">
            <label className="label">Cor primária</label>
            <div className="row gap-sm" style={{ marginBottom: 12 }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 44, height: 36, border: "1px solid var(--rule-strong)", borderRadius: 7, padding: 2, cursor: "pointer" }} />
              <span className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>{color}</span>
            </div>
            <div className="row gap-sm">
              {SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  onClick={() => setColor(hex)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    border: `2px solid ${color === hex ? "var(--ink)" : "transparent"}`,
                    background: hex,
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <label className="label">Logo</label>
            <div className="row gap">
              {logo ? (
                <span style={{ width: 52, height: 52, borderRadius: 12, background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={logo} alt="Logo" style={{ maxWidth: 38, maxHeight: 38, objectFit: "contain" }} />
                </span>
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 12, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>
                  {initial}
                </div>
              )}
              <div className="stack gap-xs">
                <input type="file" accept="image/*" onChange={(e) => handleLogo(e.target.files)} style={{ fontSize: 12 }} />
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  PNG ou SVG, fundo transparente. Formato horizontal — ex. 400×120px. Evite arquivo quadrado ou vertical, corta na tela de login.
                </div>
                {logo && (
                  <button
                    type="button"
                    style={{ fontSize: 11.5, color: "var(--red-ink)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                    onClick={() => setLogo(null)}
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <label className="label">Background do login</label>
            <div className="row gap">
              <span style={{ width: 90, height: 52, borderRadius: 8, background: background ? `url(${background}) center/cover` : "var(--navy)", flexShrink: 0, border: "1px solid var(--rule-strong)" }} />
              <div className="stack gap-xs">
                <input type="file" accept="image/*" onChange={(e) => handleBackground(e.target.files)} style={{ fontSize: 12 }} />
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  Foto do empreendimento/obra, formato paisagem — ex. 1600×900px (16:9). Aparece grande e translúcida atrás do formulário.
                </div>
                {background && (
                  <button
                    type="button"
                    style={{ fontSize: 11.5, color: "var(--red-ink)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                    onClick={() => setBackground(null)}
                  >
                    Remover background
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <label className="label">Favicon / ícone</label>
            <div className="row gap">
              <span style={{ width: 40, height: 40, borderRadius: 8, background: favicon ? `url(${favicon}) center/cover` : "var(--navy)", flexShrink: 0, border: "1px solid var(--rule-strong)" }} />
              <div className="stack gap-xs">
                <input type="file" accept="image/*" onChange={(e) => handleFavicon(e.target.files)} style={{ fontSize: 12 }} />
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  Ícone pequeno e quadrado — ex. 64×64px. Aparece na aba do navegador e ao lado do formulário de login.
                </div>
                {favicon && (
                  <button
                    type="button"
                    style={{ fontSize: 11.5, color: "var(--red-ink)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                    onClick={() => setFavicon(null)}
                  >
                    Remover favicon
                  </button>
                )}
              </div>
            </div>
          </div>

          <button type="button" className="btn btn--primary" style={{ alignSelf: "flex-start", background: color }} onClick={handleSave}>
            Salvar e aplicar no portal
          </button>
        </div>

        <div style={{ flex: "1 1 280px" }} className="sticky-side">
          <div className="mono text-soft" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
            Pré-visualização — tela de login
          </div>
          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--rule-strong)" }}>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                minHeight: 220,
                background: `linear-gradient(160deg, ${color} 0%, #0a0a0a 120%)`,
                color: "#fff",
                padding: "24px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {background && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url('${background}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.28,
                    mixBlendMode: "luminosity",
                  }}
                />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 70%, rgba(0,0,0,.9) 100%)" }} />
              <div style={{ position: "relative" }}>
                {logo ? (
                  <img src={logo} alt={nome} style={{ maxHeight: 46, maxWidth: 160, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,.4))" }} />
                ) : (
                  <div style={{ fontFamily: "'Noto Serif Display',serif", fontSize: 22, letterSpacing: ".06em", textTransform: "uppercase" }}>{nome}</div>
                )}
              </div>
            </div>
            <div style={{ background: "#fff", padding: "18px 16px" }}>
              <div className="row gap-sm" style={{ alignItems: "center", marginBottom: 4 }}>
                {favicon && <img src={favicon} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: "cover" }} />}
                <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>Acesse seu apartamento</div>
              </div>
              <div style={{ fontSize: 10.5, color: "#7b7b7b", marginBottom: 12, lineHeight: 1.4 }}>
                Entre com os dados enviados pela {nome} no e-mail de boas-vindas.
              </div>
              <div style={{ height: 26, borderRadius: 6, border: "1px solid #e2e2e2", marginBottom: 8 }} />
              <div style={{ height: 26, borderRadius: 6, border: "1px solid #e2e2e2", marginBottom: 12 }} />
              <div style={{ height: 30, borderRadius: 7, background: color, color: "#fff", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Entrar
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.4 }}>
            É assim que a tela de login da {nome} aparece pro cliente — cor, logo e background em tempo real.
          </div>
        </div>
      </div>
    </div>
  );
}
