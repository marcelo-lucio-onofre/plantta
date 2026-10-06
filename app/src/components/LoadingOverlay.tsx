/**
 * Overlay de carregamento — bloqueia clique embaixo (backdrop + z-index
 * alto) e mostra o símbolo da marca pulsando dentro de um anel também
 * pulsando (fora de fase, evita as duas animações ficarem idênticas).
 * Usado tanto pela transição de rota (RouteTransitionOverlay) quanto por
 * ações pontuais na mesma tela (ver state/LoadingContext.tsx).
 */
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-ring">
        <img src="/brand/plantta-icon.png" alt="" width={34} height={34} className="loading-logo" />
      </div>
      <div className="loading-message">{message ?? "Preparando o canteiro..."}</div>
    </div>
  );
}
