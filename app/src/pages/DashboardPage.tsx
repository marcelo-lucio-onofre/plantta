import { Breadcrumb } from "../components/Breadcrumb";
import { useApp } from "../state/AppContext";

export function DashboardPage() {
  const { dashboard } = useApp();
  const d = dashboard.getDashboard();
  const maxVal = Math.max(...d.porMes.map((m) => m.valor));

  return (
    <div className="container container--wide">
      <Breadcrumb items={[{ label: "Painel", to: "/painel" }, { label: "Dashboard" }]} />
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 4 }}>Dashboard de personalização</h1>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>Canoa, Engemax</p>

      <div className="grid grid-auto" style={{ marginBottom: 28 }}>
        {/* Azul (marca/informativo) — "Adesão" é uma métrica de produto, não
            crédito/aprovação, então não pega o verde funcional (design.md §1). */}
        <div className="card" style={{ background: "var(--blue)", color: "var(--on-blue)" }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>Adesão</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{(d.taxaAdesao * 100).toFixed(1)}%</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{d.unidadesPersonalizando} de {d.unidadesTotal} unidades</div>
        </div>
        <div className="card">
          <div className="text-soft" style={{ fontSize: 12, marginBottom: 4 }}>Receita incremental</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>R$ {Math.round(d.receitaUpgrade / 1000)}k</div>
          <div className="text-soft" style={{ fontSize: 12 }}>ticket médio R$ {d.ticketMedioUpgrade.toLocaleString("pt-BR")}</div>
        </div>
        <div className="card">
          <div className="text-soft" style={{ fontSize: 12, marginBottom: 4 }}>SLA médio aprovação</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {d.tempoMedioAprovacao} <span style={{ fontSize: 15, fontWeight: 500 }}>dias</span>
          </div>
        </div>
        <div className="card">
          <div className="text-soft" style={{ fontSize: 12, marginBottom: 4 }}>Crédito gerado / utilizado</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: "var(--green-ink)" }}>R$ {Math.round(d.creditoGerado / 1000)}k</span>{" "}
            <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-soft)" }}>/ R$ {Math.round(d.creditoUtilizado / 1000)}k</span>
          </div>
        </div>
      </div>

      <div className="row gap" style={{ alignItems: "stretch", marginBottom: 24 }}>
        <div className="card" style={{ flex: "1.5 1 380px" }}>
          <div style={{ fontWeight: 700, marginBottom: 18 }}>Receita de upgrades por mês</div>
          <div className="row" style={{ alignItems: "flex-end", gap: 12, height: 170 }}>
            {d.porMes.map((m) => (
              <div key={m.mes} className="stack" style={{ alignItems: "center", gap: 8, flex: 1 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{Math.round(m.valor / 1000)}k</div>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 34,
                    borderRadius: "6px 6px 0 0",
                    background: "var(--blue)",
                    height: Math.round((m.valor / maxVal) * 130),
                  }}
                />
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{m.mes}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 260px" }}>
          <div style={{ fontWeight: 700, marginBottom: 18 }}>Solicitações por nível</div>
          <div className="stack gap-sm">
            {[
              { label: "Simples", value: d.porNivel.simples, color: "var(--green)" },
              { label: "Técnico", value: d.porNivel.tecnico, color: "var(--amber-ink)" },
              { label: "Proibido", value: d.porNivel.proibido, color: "var(--red-ink)" },
            ].map((row) => {
              const total = d.porNivel.simples + d.porNivel.tecnico + d.porNivel.proibido;
              const pct = Math.round((row.value / total) * 100);
              return (
                <div key={row.label}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span>{row.label}</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                  <div style={{ height: 8, background: "var(--paper-2)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: row.color, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 18 }}>Upgrades mais escolhidos</div>
        <div className="stack gap-sm">
          {d.topUpgrades.map((u) => (
            <div key={u.nome}>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>{u.nome}</span>
                <span className="mono text-soft">{Math.round(u.pct * 100)}% · R$ {Math.round(u.receita / 1000)}k</span>
              </div>
              <div style={{ height: 6, background: "var(--paper-2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--blue)", width: `${Math.round(u.pct * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
