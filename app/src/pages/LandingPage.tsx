import { NavLink, useNavigate } from "react-router-dom";
import { BrandMark, Wordmark } from "../components/BrandMark";

/**
 * Public marketing page — always dark ("a marca vive no escuro", design.md
 * §3), independent of the app's own light/dark toggle (that one only
 * applies inside the authenticated portal, see SidebarShell). Forcing
 * `data-theme="dark"` on this local wrapper resolves every `var(--*)`
 * token to its dark value regardless of the rest of the app.
 */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div data-theme="dark" style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav className="container container--wide row" style={{ justifyContent: "space-between", padding: "26px 16px" }}>
        <NavLink to="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          <BrandMark size={26} />
        </NavLink>
        <div className="row gap-lg" style={{ alignItems: "center" }}>
          <a href="#como" style={{ font: "600 14px 'Archivo'", color: "var(--ink-soft)" }}>
            Como funciona
          </a>
          <NavLink to="/login/cliente" style={{ font: "600 14px 'Archivo'", color: "var(--ink-soft)", textDecoration: "none" }}>
            Portal do cliente
          </NavLink>
          <NavLink
            to="/login/construtora"
            className="btn btn--sm"
            style={{ background: "var(--paper-2)", borderColor: "var(--rule-strong)", color: "var(--ink)" }}
          >
            Entrar
          </NavLink>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1120 620"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0, opacity: 0.5 }}
        >
          <defs>
            <pattern id="hero-grid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M38 0 H0 V38" fill="none" stroke="var(--rule)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1120" height="620" fill="url(#hero-grid)" />
        </svg>
        <div className="container container--wide" style={{ position: "relative", padding: "64px 16px 88px" }}>
          <div style={{ maxWidth: 760 }}>
            <div
              className="mono"
              style={{
                display: "inline-flex",
                padding: "7px 13px",
                borderRadius: 999,
                background: "var(--blue-bg)",
                border: "1px solid var(--blue-strong)",
                fontSize: 12,
                letterSpacing: ".5px",
                color: "var(--blue-strong)",
                marginBottom: 24,
              }}
            >
              Personalização de obra
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(32px,6vw,64px)",
                lineHeight: 1.05,
                margin: "0 0 20px",
              }}
            >
              A construtora monta o catálogo e as regras. O comprador monta a unidade dele.
            </h1>
            <p style={{ fontSize: "clamp(16px,2vw,19px)", lineHeight: 1.6, color: "var(--ink-soft)", maxWidth: 580, margin: "0 0 30px" }}>
              A <Wordmark /> transforma cada escolha de material numa decisão documentada: crédito calculado, aprovação
              técnica e termo assinado — para construtora, arquiteto e cliente no mesmo fluxo.
            </p>
            <div className="row gap-sm">
              <button type="button" className="btn btn--confirm" onClick={() => navigate("/login/construtora")}>
                Começar agora
              </button>
              <a href="#como" className="btn">
                Ver como funciona
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* MÉTRICAS */}
      <section className="container container--wide" style={{ padding: "0 16px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 1,
            background: "var(--rule)",
            border: "1px solid var(--rule)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {[
            { valor: "40%", label: "das unidades em personalização", cor: "var(--ink)" },
            { valor: "R$ 284 mil", label: "em crédito gerado no período", cor: "var(--green-ink)" },
            { valor: "1,8 dia", label: "tempo médio de aprovação técnica", cor: "var(--ink)" },
            { valor: "0", label: "planilha de acabamento", cor: "var(--blue-strong)" },
          ].map((m) => (
            <div key={m.label} style={{ background: "var(--card)", padding: 28 }}>
              <div className="mono" style={{ fontWeight: 600, fontSize: 34, color: m.cor }}>{m.valor}</div>
              <div style={{ font: "500 14px 'Archivo'", color: "var(--ink-soft)", marginTop: 6 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="container container--wide" style={{ padding: "72px 16px 40px" }}>
        <h2 className="display" style={{ fontSize: "clamp(26px,3.5vw,38px)", margin: "0 0 40px" }}>
          Três passos, um documento
        </h2>
        <div className="grid grid-auto">
          {[
            { n: "01", titulo: "Escolha o acabamento", texto: "O cliente navega o catálogo da construtora e monta a unidade — cada opção mostra o impacto no crédito na hora." },
            { n: "02", titulo: "Aprove tecnicamente", texto: "Arquiteto e engenheiro validam o que exige projeto. O que é simples segue direto; o que trava fica sinalizado." },
            { n: "03", titulo: "Assine o termo", texto: "Tudo vira um termo de alteração com valores e assinaturas — sem retrabalho, sem versão perdida no WhatsApp." },
          ].map((s) => (
            <div key={s.n} className="card stack gap-sm" style={{ background: "var(--card)" }}>
              <div className="mono" style={{ fontWeight: 600, fontSize: 13, color: "var(--blue)" }}>{s.n}</div>
              <h3 style={{ fontSize: 20, margin: 0 }}>{s.titulo}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>{s.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUATRO PEÇAS */}
      <section className="container container--wide" style={{ padding: "40px 16px" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-softer)", textTransform: "uppercase", marginBottom: 12 }}>
          Quatro peças, um motor
        </div>
        <h2 className="display" style={{ fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 28px" }}>
          O que nenhum concorrente brasileiro entrega junto.
        </h2>
        <div className="grid grid-auto">
          <div className="card" style={{ background: "var(--paper-2)", border: "none" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Catálogo de materiais</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)" }}>
              Marca, SKU, preço e prazo de entrega — cadastrados uma vez, reutilizados em quantos itens quiser. Memorial, personalização e custo saem da mesma fonte.
            </div>
          </div>
          <div className="card" style={{ background: "var(--green-bg)", border: "none" }}>
            <div style={{ fontWeight: 700, color: "var(--green-ink)", marginBottom: 8 }}>Ledger de crédito</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)" }}>
              Cada item padrão removido gera saldo. Cada upgrade consome saldo. Extrato em tempo real — como conta corrente da personalização.
            </div>
          </div>
          <div className="card" style={{ background: "var(--blue-bg)", border: "none" }}>
            <div style={{ fontWeight: 700, color: "var(--blue-strong)", marginBottom: 8 }}>Motor paramétrico</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)" }}>
              Preço por fórmula: (material + mão de obra) × quantidade. Pontos elétricos, metros de tubulação — não só SKU de catálogo.
            </div>
          </div>
          <div className="card" style={{ background: "var(--amber-bg)", border: "none" }}>
            <div style={{ fontWeight: 700, color: "var(--amber-ink)", marginBottom: 8 }}>Governança técnica</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)" }}>
              3 níveis: Simples (automático), Técnico (responsável técnico obrigatório), Bloqueado (impedido). Alinhado à NBR 16280.
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="container container--wide" style={{ padding: "40px 16px 72px" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-softer)", textTransform: "uppercase", marginBottom: 12 }}>
          Planos
        </div>
        <h2 className="display" style={{ fontSize: "clamp(24px,3.2vw,32px)", margin: "0 0 28px" }}>
          Cobrança por unidade ativa em personalização.
        </h2>
        <div className="grid grid-auto">
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Starter</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              R$ 499<span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-soft)" }}>/mês</span>
            </div>
            <div className="text-soft" style={{ fontSize: 13 }}>1 empreendimento · até 50 unidades</div>
          </div>
          <div className="card" style={{ background: "var(--blue)", color: "var(--on-blue)", border: "none" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Professional</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              R$ 999<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.85 }}>/mês</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>3 empreendimentos · 300 unidades</div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Enterprise</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              R$ 1.999+<span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-soft)" }}>/mês</span>
            </div>
            <div className="text-soft" style={{ fontSize: 13 }}>white label · API · % sobre upgrade</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container container--wide" style={{ padding: "0 16px 96px" }}>
        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, var(--blue-strong), var(--blue))",
            borderRadius: 22,
            padding: "clamp(36px,6vw,72px)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 540 }}>
            <h2 className="display" style={{ fontSize: "clamp(26px,4vw,42px)", color: "#fff", margin: "0 0 16px" }}>
              Pronto para tirar a obra da planilha?
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "rgba(255,255,255,.85)", margin: "0 0 28px" }}>
              Fale com a gente e veja a <Wordmark style={{ color: "#fff" }} /> rodando com o catálogo da sua construtora.
            </p>
            <button
              type="button"
              className="btn"
              style={{ background: "#fff", color: "var(--blue-strong)", border: "none" }}
              onClick={() => navigate("/login/construtora")}
            >
              Agendar demonstração
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--rule)" }}>
        <div className="container container--wide row gap-sm" style={{ justifyContent: "space-between", padding: "28px 16px" }}>
          <Wordmark style={{ fontSize: 16 }} />
          <div className="row gap-lg" style={{ alignItems: "center" }}>
            <NavLink to="/login/marca/engemax" style={{ font: "500 13px 'Archivo'", color: "var(--ink-softer)" }}>
              Portal com marca da construtora
            </NavLink>
            <span style={{ font: "500 13px 'Archivo'", color: "var(--ink-softer)" }}>© 2026 · Personalização de obra</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
