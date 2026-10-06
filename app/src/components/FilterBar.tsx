import { SugestaoInput } from "./SugestaoInput";

/** Barra de filtro das listagens — busca com dropdown de sugestão custom
 * (SugestaoInput) + slot pra filtros adicionais (select de categoria,
 * chips de papel, etc.), tudo client-side. */
export function FilterBar({
  value,
  onChange,
  placeholder,
  suggestions,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suggestions: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="filter-bar">
      <div style={{ flex: "1 1 240px" }}>
        {/* .input já é --paper por padrão (contraste dentro de um .card);
            aqui a busca fica direto na página, cujo fundo também é
            --paper, então o campo precisa de --card pra não sumir. */}
        <SugestaoInput
          value={value}
          options={[...new Set(suggestions)]}
          onChange={onChange}
          placeholder={placeholder}
          ariaLabel={placeholder}
          inputStyle={{ background: "var(--card)" }}
        />
      </div>
      {children}
    </div>
  );
}

/** Substring case-insensitive contra vários campos de uma vez — usado pra
 * filtrar linhas de tabela pela busca do FilterBar. */
export function textMatch(query: string, ...fields: (string | undefined | null)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}
