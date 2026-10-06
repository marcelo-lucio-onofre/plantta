import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { LoadingOverlay } from "./LoadingOverlay";

const DURACAO_MS = 420;

/**
 * Mostra o LoadingOverlay por um instante a cada troca de rota — cobre
 * "de graça" toda navegação que já existia (salvar/cancelar/excluir quase
 * sempre terminam com `navigate(...)`), sem precisar envolver cada botão
 * do app manualmente. Não dispara no primeiro carregamento da página.
 */
export function RouteTransitionOverlay() {
  const location = useLocation();
  const [visivel, setVisivel] = useState(false);
  const primeiraRef = useRef(true);

  useEffect(() => {
    if (primeiraRef.current) {
      primeiraRef.current = false;
      return;
    }
    setVisivel(true);
    const t = setTimeout(() => setVisivel(false), DURACAO_MS);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!visivel) return null;
  return <LoadingOverlay />;
}
