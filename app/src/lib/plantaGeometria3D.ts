/**
 * Geometria pura (sem three.js) usada pra transformar o polígono de um
 * ambiente (vindo do DXF, ver lib/dxfPlanta.ts) em piso + paredes reais no
 * AmbienteConfigurador3D — separado do componente React pra ficar testável
 * sem precisar montar um canvas WebGL.
 */

export interface PontoMundo {
  x: number;
  z: number;
}

export interface ParedeGerada {
  comprimento: number;
  centro: PontoMundo;
  /** Rotação em Y (radianos) pra alinhar a largura da parede com a aresta. */
  rotacaoY: number;
}

/** Centraliza o polígono no próprio centroide (fica em torno da origem, é
 * assim que a câmera do configurador espera receber a cena) e converte do
 * plano do DXF (x, y) pro plano do mundo 3D (x, z). */
export function centralizarPoligono(pontosM: [number, number][]): PontoMundo[] {
  const n = pontosM.length;
  const [cx, cy] = pontosM.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]).map((v) => v / n) as [
    number,
    number,
  ];
  // y do DXF cresce "pra cima" no desenho 2D; -z do mundo 3D é "pra dentro
  // da cena" a partir da câmera (ver Cena em AmbienteConfigurador3D) — daí
  // o sinal invertido, pra planta e cena concordarem sobre o que é "fundo".
  return pontosM.map(([x, y]) => ({ x: x - cx, z: -(y - cy) }));
}

/** Uma parede por aresta do polígono — cada uma vira um `boxGeometry`
 * (largura=comprimento da aresta, altura=pé-direito, profundidade=espessura)
 * posicionado no meio da aresta e rotacionado pra acompanhar sua direção. */
export function gerarParedes(pontos: PontoMundo[]): ParedeGerada[] {
  const n = pontos.length;
  const paredes: ParedeGerada[] = [];
  for (let i = 0; i < n; i++) {
    const a = pontos[i];
    const b = pontos[(i + 1) % n];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    paredes.push({
      comprimento: Math.hypot(dx, dz),
      centro: { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 },
      rotacaoY: -Math.atan2(dz, dx),
    });
  }
  return paredes;
}

/**
 * Só as paredes do "fundo" (do lado oposto de onde a câmera fica) devem ser
 * desenhadas — o ambiente genérico original também só tinha 2 das 4
 * paredes (fundo + uma lateral), senão a câmera (que fica do lado de fora,
 * olhando pra dentro) bate de frente numa parede sólida e não vê o
 * ambiente nenhum. `direcaoCamera` é a posição XZ da câmera normalizada;
 * uma parede fica do lado de "fora" (fica de fora) quando seu centro
 * projetado nessa direção é positivo.
 */
export function indicesParedesVisiveis(paredes: ParedeGerada[], direcaoCamera: PontoMundo): number[] {
  return paredes
    .map((p, i) => ({ i, projecao: p.centro.x * direcaoCamera.x + p.centro.z * direcaoCamera.z }))
    .filter((e) => e.projecao <= 0)
    .map((e) => e.i);
}

/** Entre as paredes visíveis, a "de fundo" (mais distante da câmera) é a
 * que recebe a textura de revestimento — mesma posição visual que a
 * parede fixa do ambiente genérico ocupava. */
export function indiceParedeDeFundo(paredes: ParedeGerada[], indicesVisiveis: number[], direcaoCamera: PontoMundo): number {
  let indice = indicesVisiveis[0] ?? 0;
  let menorProjecao = Infinity;
  for (const i of indicesVisiveis) {
    const p = paredes[i];
    const projecao = p.centro.x * direcaoCamera.x + p.centro.z * direcaoCamera.z;
    if (projecao < menorProjecao) {
      menorProjecao = projecao;
      indice = i;
    }
  }
  return indice;
}

/** Bounding box do polígono já centralizado — usado pra posicionar bancada/
 * mobília proporcionalmente ao tamanho real do ambiente em vez de um valor
 * fixo que só fazia sentido pro cômodo genérico 5×3,6. */
export function bboxCentralizado(pontos: PontoMundo[]): { largura: number; profundidade: number } {
  const xs = pontos.map((p) => p.x);
  const zs = pontos.map((p) => p.z);
  return { largura: Math.max(...xs) - Math.min(...xs), profundidade: Math.max(...zs) - Math.min(...zs) };
}
