import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";

interface LoadingContextValue {
  /** Roda `fn`, mostrando o overlay de carregamento (bloqueia clique) por
   * pelo menos `ATRASO_MIN_MS` — sem isso, numa app sem backend de
   * verdade, a ação termina instantânea e o loading nem pisca. */
  runComLoading: <T,>(fn: () => T | Promise<T>, mensagem?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);
const ATRASO_MIN_MS = 550;

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [mensagem, setMensagem] = useState<string | undefined>();

  const runComLoading = useCallback(async <T,>(fn: () => T | Promise<T>, msg?: string): Promise<T> => {
    setMensagem(msg);
    setBusy(true);
    const inicio = Date.now();
    try {
      const resultado = await fn();
      const decorrido = Date.now() - inicio;
      if (decorrido < ATRASO_MIN_MS) await new Promise((r) => setTimeout(r, ATRASO_MIN_MS - decorrido));
      return resultado;
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ runComLoading }}>
      {children}
      {busy && <LoadingOverlay message={mensagem} />}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}
