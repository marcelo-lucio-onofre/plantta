import { BoxGeometry, Mesh, MeshStandardMaterial, Scene, SRGBColorSpace, TextureLoader, type Texture } from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

/** Tamanho genérico da amostra em metros — não é a dimensão real do
 * produto (MaterialCatalogItem não guarda largura/altura), é um "corpo de
 * prova" do tamanho de uma amostra física comum, pra ficar em escala
 * plausível quando colocado no chão/parede via AR. */
const AMOSTRA_LARGURA_M = 0.5;
const AMOSTRA_ESPESSURA_M = 0.015;

function carregarTextura(url: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    new TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

/** Gerar o .glb envolve carregar a imagem, montar a cena e serializar —
 * caro o bastante pra valer cache. Reabrir o AR do mesmo material (fechar
 * e abrir de novo, trocar de opção e voltar) é o caso comum, então cacheia
 * por (imagem + aparência) em vez de reconstruir toda vez. Efeito colateral
 * aceito: a blob: URL fica viva pelo resto da sessão da página (não é
 * revogada) — para o número de materiais de um catálogo isso é ruído de
 * memória irrelevante; um cache com LRU só valeria a pena com centenas de
 * materiais distintos vistos numa única sessão. */
const cacheGlb = new Map<string, Promise<string>>();

/**
 * Gera um .glb de verdade — em memória, no navegador — a partir da foto de
 * um material: uma placa texturizada, no tamanho de uma amostra física.
 * É esse arquivo que o <model-viewer> abre em AR (Quick Look no iOS, Scene
 * Viewer no Android). A URL retornada é cacheada (ver acima) — não chame
 * `URL.revokeObjectURL` nela.
 */
export function gerarGlbAmostraMaterial(imagemUrl: string, opts: { roughness?: number; metalness?: number } = {}): Promise<string> {
  const roughness = opts.roughness ?? 0.5;
  const metalness = opts.metalness ?? 0;
  const chave = `${imagemUrl}|${roughness}|${metalness}`;

  const emCache = cacheGlb.get(chave);
  if (emCache) return emCache;

  const promessa = (async () => {
    const texture = await carregarTextura(imagemUrl);

    const scene = new Scene();
    const geometry = new BoxGeometry(AMOSTRA_LARGURA_M, AMOSTRA_ESPESSURA_M, AMOSTRA_LARGURA_M);
    const material = new MeshStandardMaterial({ map: texture, roughness, metalness });
    scene.add(new Mesh(geometry, material));

    const exporter = new GLTFExporter();
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(scene, (result) => resolve(result as ArrayBuffer), reject, { binary: true });
    });

    return URL.createObjectURL(new Blob([arrayBuffer], { type: "model/gltf-binary" }));
  })();

  cacheGlb.set(chave, promessa);
  promessa.catch(() => cacheGlb.delete(chave)); // não guarda falha em cache
  return promessa;
}
