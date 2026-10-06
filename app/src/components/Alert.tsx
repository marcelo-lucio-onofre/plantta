import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

const VARIANTES = {
  sucesso: { bg: "var(--green-bg)", ink: "var(--green-ink)", Icon: CheckCircle2 },
  pendente: { bg: "var(--amber-bg)", ink: "var(--amber-ink)", Icon: AlertTriangle },
  erro: { bg: "var(--red-bg)", ink: "var(--red-ink)", Icon: XCircle },
  info: { bg: "var(--blue-bg)", ink: "var(--blue-strong)", Icon: Info },
} as const;

/**
 * Alerta de 4 variantes (sucesso/pendente/erro/info) — fundo tintado, ícone
 * e título na cor da variante, descrição em --ink-soft, sem borda (ver
 * kit "Marca B2B/B2C forte"). Usar sempre que houver uma mensagem real de
 * status/aviso — nunca reaproveitar `.card` tintado pra isso (esse é o
 * padrão certo, `.card` genérico é só pra bloco clicável/selecionável).
 */
export function Alert({
  variante,
  titulo,
  children,
}: {
  variante: keyof typeof VARIANTES;
  titulo: string;
  children?: ReactNode;
}) {
  const { bg, ink, Icon } = VARIANTES[variante];
  return (
    <div className="row gap-sm" style={{ alignItems: "flex-start", padding: "14px 16px", borderRadius: "var(--radius)", background: bg }}>
      <Icon size={18} style={{ color: ink, flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ font: "700 14px 'Archivo'", color: ink }}>{titulo}</div>
        {children && <div style={{ font: "400 13.5px 'Archivo'", color: "var(--ink-soft)", marginTop: 2 }}>{children}</div>}
      </div>
    </div>
  );
}
