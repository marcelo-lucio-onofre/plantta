import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface ToastItem {
  id: number;
  type: "success" | "error";
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TITULO: Record<ToastItem["type"], string> = { success: "Feito", error: "Algo deu errado" };

/** Pilha de toasts de feedback de ação (salvar/excluir) — canto inferior
 * direito, título + descrição (maior/mais visível que uma linha só de
 * texto), some sozinho em 4.2s ou no × manual. `aria-live="polite"` pra
 * não atropelar leitor de tela no meio de outra leitura. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastItem["type"], message: string) => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value: ToastContextValue = {
    success: useCallback((message: string) => push("success", message), [push]),
    error: useCallback((message: string) => push("error", message), [push]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <span className="toast-icon">
              {t.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </span>
            <div style={{ flex: 1 }}>
              <div className="toast-title">{TITULO[t.type]}</div>
              <div className="toast-message">{t.message}</div>
            </div>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fechar">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
