import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
  mono?: boolean;
  /** Reference code (SKU, ID) — mono + `--blue-strong`, same treatment the
   * kit gives an identifier column (e.g. "SOL-013"). Only for genuine
   * identifiers, never for a phone/date/count that just happens to be mono. */
  idColumn?: boolean;
  /** Present ⇒ column header is clickable and sorts by this value. Separate
   * from `render` because `render` can return JSX (badges, links) that
   * isn't directly comparable. */
  sortValue?: (row: T) => string | number | Date;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

/** Tabela genérica com paginação client-side fixa em 10/página — usada por
 * todos os cadastros (Categorias, Marcas, Fornecedores, Materiais,
 * Pessoas, Empreendimentos). Ações da linha ficam à direita, coluna própria. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  emptyMessage,
  pageSize = 10,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  emptyMessage: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const withValue = rows.map((row) => ({ row, value: col.sortValue!(row) }));
    withValue.sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0));
    if (sort.dir === "desc") withValue.reverse();
    return withValue.map((w) => w.row);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  function toggleSort(key: string) {
    setPage(0);
    setSort((s) => {
      if (s?.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="table-card">
      {/* overflow-x:auto vive num wrapper à parte — .table-card precisa de
          overflow:hidden pra arredondar os cantos, e as duas regras no
          mesmo elemento colidem (hidden vence e mata o scroll horizontal,
          cortando a coluna de Ações no celular sem dar pra chegar nela). */}
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, cursor: c.sortValue ? "pointer" : undefined }}
                  onClick={c.sortValue ? () => toggleSort(c.key) : undefined}
                >
                  <span className="table-sort-label">
                    {c.header}
                    {c.sortValue &&
                      (sort?.key === c.key ? (
                        sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="table-sort-icon" />
                      ))}
                  </span>
                </th>
              ))}
              {actions && <th style={{ textAlign: "right" }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={c.mono || c.idColumn ? "mono" : undefined}
                    style={c.idColumn ? { color: "var(--blue-strong)", fontWeight: 500 } : undefined}
                  >
                    {c.render(row)}
                  </td>
                ))}
                {actions && (
                  <td>
                    <div className="table-actions">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && <div className="table-empty">{emptyMessage}</div>}

      {rows.length > 0 && (
        <div className="pagination">
          <span>{start + 1}–{Math.min(start + pageSize, rows.length)} de {rows.length}</span>
          <div className="row gap-xs">
            <button
              type="button"
              className="table-icon-btn"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="mono" style={{ fontSize: 12, padding: "0 4px" }}>{currentPage + 1}/{pageCount}</span>
            <button
              type="button"
              className="table-icon-btn"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
