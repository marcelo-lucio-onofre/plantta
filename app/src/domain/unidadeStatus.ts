import type { Solicitacao, Vinculo } from "./types";

/**
 * Situação de uma unidade (vínculo), do ponto de vista do cliente — deriva
 * de solicitações + assinatura + pagamento, nunca é campo próprio.
 * Compartilhado entre `MinhaUnidadePage` (cliente) e `PainelPage`
 * (construtora, pra saber quem falta confirmar pagamento) pra não duplicar
 * a regra em dois lugares.
 */
export type StatusUnidade = "sem_alteracao" | "em_analise" | "aguardando_pagamento" | "concluido" | "nenhuma";

export const STATUS_UNIDADE_META: Record<StatusUnidade, { label: string; badge: string }> = {
  sem_alteracao: { label: "Sem alteração", badge: "badge--neutro" },
  em_analise: { label: "Em análise", badge: "badge--tecnico" },
  aguardando_pagamento: { label: "Aguardando pagamento", badge: "badge--info" },
  concluido: { label: "Concluído", badge: "badge--simples" },
  nenhuma: { label: "Nenhuma personalização", badge: "badge--neutro" },
};

export function statusDaUnidade(vinculo: Vinculo, todasSolicitacoes: Solicitacao[]): StatusUnidade {
  if (vinculo.semAlteracaoAssinadaEm) return "sem_alteracao";
  const minhas = todasSolicitacoes.filter((s) => s.vinculoId === vinculo.id);
  if (minhas.some((s) => s.status === "pendente" || s.status === "em_analise")) return "em_analise";
  if (minhas.some((s) => s.status === "aguardando_pagamento")) return "aguardando_pagamento";
  if (minhas.some((s) => s.status === "aprovado")) return vinculo.pagamentoConfirmadoEm ? "concluido" : "aguardando_pagamento";
  return "nenhuma";
}
