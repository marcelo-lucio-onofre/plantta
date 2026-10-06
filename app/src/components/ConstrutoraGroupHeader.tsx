import type { Brand } from "../domain/types";

const iniciais = (nome: string): string =>
  nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/**
 * Construtora identity mark — the one place that decides how a construtora
 * is represented (real logo on a dark chip, or colored initials). Shared by
 * every screen that groups by construtora so they can't drift apart
 * (Personalizações tree, wizard step 1).
 */
export function ConstrutoraMark({ nome, brand, size = 30 }: { nome: string; brand: Brand | null | undefined; size?: number }) {
  const radius = Math.round(size * 0.27);
  // Ícone (favicon), não a logomarca — o chip é pequeno/quadrado e o logo
  // grande do hero costuma ser largo, não coube bem aqui.
  const imagem = brand?.favicon ?? brand?.logo;
  if (imagem) {
    return (
      <span
        style={{
          width: size, height: size, borderRadius: radius, flexShrink: 0,
          background: brand?.color ?? "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <img src={imagem} alt={nome} style={{ maxWidth: size - 8, maxHeight: size - 8, objectFit: "contain" }} />
      </span>
    );
  }
  return (
    <span
      style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        background: brand?.color ?? "var(--navy)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: Math.round(size * 0.41),
      }}
    >
      {iniciais(nome)}
    </span>
  );
}

export function ConstrutoraGroupHeader({ nome, brand }: { nome: string; brand: Brand | null | undefined }) {
  return (
    <div className="row gap-sm" style={{ alignItems: "center", marginBottom: 14 }}>
      <ConstrutoraMark nome={nome} brand={brand} />
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{nome}</div>
    </div>
  );
}
