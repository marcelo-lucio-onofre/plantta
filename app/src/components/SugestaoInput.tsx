import { useId, useState, type CSSProperties } from "react";
import { normalizarContraLista } from "../domain/calculations";

/**
 * Texto livre com sugestões (busca, marca, ambiente) — dropdown custom
 * (não datalist nativo, que o navegador renderiza do jeito dele e não dá
 * pra estilizar) — filtra por `includes` case-insensitive, no máx.
 * `maxItems`. `onMouseDown` no item, não `onClick`, pra disparar antes do
 * blur do input; blur fecha com atraso (140ms) pra esse clique ainda
 * acontecer com a lista montada. `normalizarContraLista` corrige grafia
 * no blur quando o texto só difere de uma opção conhecida por
 * caixa/espaço — assim "Portobello" e "portobello" não viram duas linhas
 * diferentes num relatório.
 */
export function SugestaoInput({
  value,
  options,
  onChange,
  placeholder,
  className = "input",
  style,
  inputStyle,
  maxItems = 6,
  ariaLabel,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  /** Aplicado no wrapper (`position:relative`) — pra sizing em flex/grid. */
  style?: CSSProperties;
  /** Aplicado no `<input>` em si — pra casos como sobrescrever o fundo. */
  inputStyle?: CSSProperties;
  maxItems?: number;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const q = value.trim().toLowerCase();
  const matches = (q ? options.filter((o) => o.toLowerCase().includes(q)) : [...options]).slice(0, maxItems);

  return (
    <div style={{ position: "relative", ...style }}>
      <input
        id={inputId}
        className={className}
        style={inputStyle}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          setTimeout(() => setOpen(false), 140);
          const normalizado = normalizarContraLista(e.target.value, options);
          if (normalizado !== e.target.value) onChange(normalizado);
        }}
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 20,
            background: "var(--card)",
            border: "1px solid var(--rule-strong)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)",
            overflow: "hidden",
            animation: "fadeUp .16s ease",
          }}
        >
          {matches.map((m, i) => (
            <div
              key={m}
              onMouseDown={() => {
                onChange(m);
                setOpen(false);
              }}
              className="sugestao-item"
              style={{ borderBottom: i === matches.length - 1 ? "none" : "1px solid var(--rule)" }}
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
