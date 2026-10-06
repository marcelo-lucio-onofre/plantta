/**
 * Telemetria de uso das visualizações 3D/AR — pra responder "quantos
 * clientes realmente usam isso" (plano de implementação, Fase 4). Sem
 * backend de analytics no protótipo, então só loga; trocar por uma chamada
 * real (endpoint próprio, PostHog, Segment...) é a única mudança que essa
 * troca exige — nenhum call site precisa mudar.
 */
export type EventoVisualizacao =
  | { nome: "preview_3d_opcao"; ambiente: string; item: string; opcao: string }
  | { nome: "preview_ar_opcao"; ambiente: string; item: string; opcao: string }
  | { nome: "preview_3d_ambiente"; ambiente: string }
  | { nome: "preview_3d_material_catalogo"; materialId: string; modelo: string }
  | { nome: "preview_ar_material_catalogo"; materialId: string; modelo: string };

export function registrarVisualizacao(evento: EventoVisualizacao) {
  console.info("[telemetria:3d-ar]", evento.nome, evento);
}
