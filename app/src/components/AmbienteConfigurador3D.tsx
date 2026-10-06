import { Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture, useGLTF } from "@react-three/drei";
import { DoubleSide, Mesh, RepeatWrapping, SRGBColorSpace, Shape, Vector2, type Texture } from "three";
import { KTX2Loader } from "three-stdlib";
import { Box, MapPin } from "lucide-react";
import { bboxCentralizado, centralizarPoligono, gerarParedes, indiceParedeDeFundo, indicesParedesVisiveis } from "../lib/plantaGeometria3D";

// Mobília real (não placeholder): modelos licenciados do repositório oficial
// de amostras da Khronos (glTF-Sample-Assets), baixados com
// scripts/fetch-sample-assets.mjs e comprimidos com Draco (geometria) +
// KTX2/Basis Universal ETC1S (textura) via scripts/compress-model.mjs. Os
// decoders (public/decoders/) são os mesmos que o three.js usa em produção
// — nada depende de CDN externo em runtime.
const DRACO_DECODER_PATH = `${import.meta.env.BASE_URL}decoders/draco/`;
const KTX2_TRANSCODER_PATH = `${import.meta.env.BASE_URL}decoders/basis/`;

interface ModeloReferencia {
  url: string;
  /** Redução real medida (original -> comprimido), ver scripts/compress-model.mjs. */
  reducao: string;
  credito: string;
}

const MODELOS: Record<"cadeira" | "sofa" | "geladeira", ModeloReferencia> = {
  cadeira: {
    url: `${import.meta.env.BASE_URL}models/sheen-chair.glb`,
    reducao: "3,93MB → 0,69MB (−82%)",
    credito: "Cadeira: Eric Chadwick/Wayfair, CC0 — glTF-Sample-Assets (Khronos)",
  },
  sofa: {
    url: `${import.meta.env.BASE_URL}models/sheen-sofa.glb`,
    reducao: "10,11MB → 3,57MB (−63%)",
    credito: "Sofá: Darmstadt Graphics Group/Fran Calvente, CC-BY 4.0 — glTF-Sample-Assets (Khronos)",
  },
  geladeira: {
    url: `${import.meta.env.BASE_URL}models/commercial-refrigerator.glb`,
    reducao: "9,66MB → 3,33MB (−66%)",
    credito: "Geladeira: Darmstadt Graphics Group/Sean Thomas, CC-BY 4.0 — glTF-Sample-Assets (Khronos)",
  },
};

const ROOM_W = 5;
const ROOM_D = 3.6;
const ROOM_H = 2.6;
/** Espessura de parede pro ambiente gerado a partir da planta real (DXF) —
 * fixa, já que o padrão (docs/padrao-plantas-dxf.md) não exige a camada
 * ARQ-ALV pra medir a espessura de verdade. */
const ESPESSURA_PAREDE = 0.12;
/** Posição fixa da câmera do Canvas — extraída pra constante porque
 * CenaReal também precisa dela (pra saber quais paredes ficam "atrás" da
 * câmera e podem ser escondidas). */
const CAMERA_POS: [number, number, number] = [3.4, 2.0, 4.2];

export interface SuperficieMaterial {
  imagemUrl: string;
  roughness?: number;
  metalness?: number;
  /** Nome do material — vira legenda na cena, não usado no render em si. */
  nome: string;
}

function onTextureLoad(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
}

/** Piso/parede com a foto real do material — componente próprio (não
 * condicional dentro de outro) porque useTexture não pode ser chamado
 * condicionalmente; só monta quando a superfície tem material vinculado. */
function SuperficieComFoto({
  args,
  position,
  rotation,
  material,
  repeatScale,
}: {
  args: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  material: SuperficieMaterial;
  repeatScale: number;
}) {
  const texture = useTexture(material.imagemUrl, (t) => {
    onTextureLoad(t);
    t.repeat.set(repeatScale, repeatScale * (args[1] / args[0]));
  });
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial map={texture} roughness={material.roughness ?? 0.5} metalness={material.metalness ?? 0} />
    </mesh>
  );
}

function SuperficieNeutra({
  args,
  position,
  rotation,
}: {
  args: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial color="#efece3" roughness={0.92} />
    </mesh>
  );
}

function Superficie(props: {
  args: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  material?: SuperficieMaterial;
  repeatScale?: number;
}) {
  const { material, repeatScale = 4, ...rest } = props;
  return material ? <SuperficieComFoto {...rest} material={material} repeatScale={repeatScale} /> : <SuperficieNeutra {...rest} />;
}

/** Carrega um .glb real (Draco + KTX2) com os decoders locais — mesma
 * configuração que qualquer modelo de ambiente real usaria. Componente
 * próprio (não condicional) porque useGLTF não pode ser chamado
 * condicionalmente, igual ao motivo do SuperficieComFoto acima. */
function ModeloReal({
  modelo,
  position,
  rotationY = 0,
  scale = 1,
}: {
  modelo: ModeloReferencia;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const { gl } = useThree();
  const extendLoader = useMemo(
    () => (loader: Parameters<NonNullable<Parameters<typeof useGLTF>[3]>>[0]) => {
      const ktx2Loader = new KTX2Loader().setTranscoderPath(KTX2_TRANSCODER_PATH).detectSupport(gl);
      loader.setKTX2Loader(ktx2Loader);
    },
    [gl],
  );
  const { scene } = useGLTF(modelo.url, DRACO_DECODER_PATH, false, extendLoader);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} position={position} rotation={[0, rotationY, 0]} scale={scale} />;
}

/** Peça(s) de mobília real pra dar escala/contexto ao ambiente — cada tipo
 * usa o .glb mais próximo disponível no catálogo CC0/CC-BY da Khronos (ver
 * MODELOS acima). Sem equivalente pronto pra cama/louça de banheiro nesse
 * catálogo, então quarto e banheiro ainda usam formas simples. */
function MobiliaDeReferencia({
  tipo,
  fatorEscala = 1,
}: {
  tipo: "quarto" | "banheiro" | "cozinha" | "sala" | "generico";
  /** Ambientes reais (vindos de planta DXF) raramente têm o tamanho do
   * cômodo genérico 5×3,6 — sem isso, a mobília de referência (posicionada
   * pensando nesse tamanho fixo) vaza pelas paredes de um banheiro ou
   * cozinha real bem menor. 1 = tamanho original. */
  fatorEscala?: number;
}) {
  const cinza = "#d8d4c6";
  const branco = "#ffffff";
  const esc = ([x, y, z]: [number, number, number]): [number, number, number] => [x * fatorEscala, y, z * fatorEscala];
  if (tipo === "sala") {
    return (
      <>
        <ModeloReal modelo={MODELOS.sofa} position={esc([-1.1, 0, -0.6])} rotationY={Math.PI * 0.08} scale={1.05 * fatorEscala} />
        <ModeloReal modelo={MODELOS.cadeira} position={esc([0.9, 0, 0.7])} rotationY={-Math.PI * 0.35} scale={fatorEscala} />
      </>
    );
  }
  if (tipo === "cozinha") {
    return <ModeloReal modelo={MODELOS.geladeira} position={esc([-1.9, 0, -1.5])} rotationY={Math.PI * 0.5} scale={fatorEscala} />;
  }
  if (tipo === "quarto") {
    return (
      <group position={esc([-0.9, 0, 0])} scale={fatorEscala}>
        <mesh position={[0, 0.16, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.32, 2.0]} />
          <meshStandardMaterial color={cinza} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.39, -1.0]} castShadow>
          <boxGeometry args={[1.5, 0.14, 0.5]} />
          <meshStandardMaterial color={branco} roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (tipo === "banheiro") {
    return (
      <mesh position={esc([-1.7, 0.4, -1.4])} scale={fatorEscala} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.8, 0.5]} />
        <meshStandardMaterial color={branco} roughness={0.3} />
      </mesh>
    );
  }
  return null;
}

/** Créditos dos modelos reais mostrados nesse tipo de ambiente — exigência
 * de licença (CC-BY pede atribuição; CC0 não exige mas é boa prática). */
function creditosPorTipo(tipo: "quarto" | "banheiro" | "cozinha" | "sala" | "generico"): ModeloReferencia[] {
  if (tipo === "sala") return [MODELOS.sofa, MODELOS.cadeira];
  if (tipo === "cozinha") return [MODELOS.geladeira];
  return [];
}

/** Deriva o "tipo" de ambiente pelo nome pra escolher a peça de referência —
 * heurística de texto, não um campo do domínio (Ambiente não modela tipo). */
export function tipoAmbientePorNome(nome: string): "quarto" | "banheiro" | "cozinha" | "sala" | "generico" {
  const n = nome.toLowerCase();
  if (n.includes("quarto") || n.includes("suíte") || n.includes("suite")) return "quarto";
  if (n.includes("banheiro") || n.includes("lavabo")) return "banheiro";
  if (n.includes("cozinha") || n.includes("gourmet")) return "cozinha";
  if (n.includes("sala")) return "sala";
  return "generico";
}

function Cena({
  tipo,
  piso,
  revestimento,
  bancada,
  geometriaReal,
}: {
  tipo: ReturnType<typeof tipoAmbientePorNome>;
  piso?: SuperficieMaterial;
  revestimento?: SuperficieMaterial;
  bancada?: SuperficieMaterial;
  geometriaReal?: { pontosM: [number, number][]; peDireitoM: number };
}) {
  if (geometriaReal) {
    return <CenaReal tipo={tipo} piso={piso} revestimento={revestimento} bancada={bancada} {...geometriaReal} />;
  }
  return (
    <>
      <hemisphereLight intensity={0.7} color="#f3f3ec" groundColor="#3a3a34" />
      <directionalLight position={[4, 6, 3]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <ambientLight intensity={0.25} />

      <Superficie args={[ROOM_W, ROOM_D]} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={piso} repeatScale={4} />
      <Superficie args={[ROOM_W, ROOM_H]} position={[0, ROOM_H / 2, -ROOM_D / 2]} material={revestimento} repeatScale={5} />
      <SuperficieNeutra args={[ROOM_D, ROOM_H]} position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} />

      {bancada && (
        <mesh position={[1.4, 0.5, -1.2]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.06, 0.7]} />
          <Suspense fallback={<meshStandardMaterial color="#d8d4c6" />}>
            <TextureMaterial material={bancada} />
          </Suspense>
        </mesh>
      )}

      <MobiliaDeReferencia tipo={tipo} />
    </>
  );
}

function TextureMaterial({ material }: { material: SuperficieMaterial }) {
  const texture = useTexture(material.imagemUrl, onTextureLoad);
  return <meshStandardMaterial map={texture} roughness={material.roughness ?? 0.4} metalness={material.metalness ?? 0.05} />;
}

/** Piso com o contorno REAL do ambiente (polígono vindo do DXF, ver
 * lib/plantaGeometria3D) — mesma ideia da Superficie genérica, mas com
 * `shapeGeometry` no lugar de um retângulo fixo. */
function PisoFormaComFoto({ shape, tamanho, material }: { shape: Shape; tamanho: number; material: SuperficieMaterial }) {
  const repeat = Math.max(1, Math.round(tamanho));
  const texture = useTexture(material.imagemUrl, (t) => {
    onTextureLoad(t);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat, repeat);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial map={texture} roughness={material.roughness ?? 0.5} metalness={material.metalness ?? 0} side={DoubleSide} />
    </mesh>
  );
}

function PisoFormaNeutra({ shape }: { shape: Shape }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#efece3" roughness={0.92} side={DoubleSide} />
    </mesh>
  );
}

/** Uma parede (aresta do polígono real) com foto de revestimento — só a
 * parede "de fundo" (ver indiceParedeDeFundo) usa isso; as outras ficam
 * neutras, igual ao ambiente genérico só tinha uma parede texturizável. */
function ParedeComFoto({
  comprimento,
  peDireitoM,
  centro,
  rotacaoY,
  material,
}: {
  comprimento: number;
  peDireitoM: number;
  centro: { x: number; z: number };
  rotacaoY: number;
  material: SuperficieMaterial;
}) {
  const texture = useTexture(material.imagemUrl, (t) => {
    onTextureLoad(t);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round(comprimento)), Math.max(1, Math.round(peDireitoM)));
  });
  return (
    <mesh position={[centro.x, peDireitoM / 2, centro.z]} rotation={[0, rotacaoY, 0]} receiveShadow castShadow>
      <boxGeometry args={[comprimento, peDireitoM, ESPESSURA_PAREDE]} />
      <meshStandardMaterial map={texture} roughness={material.roughness ?? 0.5} metalness={material.metalness ?? 0} />
    </mesh>
  );
}

/** Cena montada a partir do contorno real do ambiente (planta DXF) — piso
 * na forma exata do cômodo e paredes extrudadas por aresta, no lugar da
 * caixa genérica 5×3,6 fixa que a Cena acima sempre desenhava. */
function CenaReal({
  tipo,
  pontosM,
  peDireitoM,
  piso,
  revestimento,
  bancada,
}: {
  tipo: ReturnType<typeof tipoAmbientePorNome>;
  pontosM: [number, number][];
  peDireitoM: number;
  piso?: SuperficieMaterial;
  revestimento?: SuperficieMaterial;
  bancada?: SuperficieMaterial;
}) {
  const pontos = useMemo(() => centralizarPoligono(pontosM), [pontosM]);
  const paredes = useMemo(() => gerarParedes(pontos), [pontos]);
  // Mesma direção da câmera fixa do Canvas (ver AmbienteConfigurador3D) —
  // só as paredes do lado oposto são desenhadas, senão a câmera (de fora,
  // olhando pra dentro) bate de frente numa parede sólida.
  const direcaoCamera = useMemo(() => {
    const norma = Math.hypot(CAMERA_POS[0], CAMERA_POS[2]);
    return { x: CAMERA_POS[0] / norma, z: CAMERA_POS[2] / norma };
  }, []);
  const visiveisIdx = useMemo(() => indicesParedesVisiveis(paredes, direcaoCamera), [paredes, direcaoCamera]);
  const fundoIdx = useMemo(() => indiceParedeDeFundo(paredes, visiveisIdx, direcaoCamera), [paredes, visiveisIdx, direcaoCamera]);
  const { largura, profundidade } = useMemo(() => bboxCentralizado(pontos), [pontos]);
  const shape = useMemo(() => new Shape(pontos.map((p) => new Vector2(p.x, -p.z))), [pontos]);
  // Mobília de referência foi calibrada pro cômodo genérico 5×3,6 — sem
  // isso, vaza pelas paredes de ambientes reais menores (banheiro, cozinha
  // compacta etc.).
  const fatorEscala = Math.min(1, Math.max(0.35, Math.min(largura / ROOM_W, profundidade / ROOM_D)));

  return (
    <>
      <hemisphereLight intensity={0.7} color="#f3f3ec" groundColor="#3a3a34" />
      <directionalLight position={[4, 6, 3]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <ambientLight intensity={0.25} />

      {piso ? <PisoFormaComFoto shape={shape} tamanho={Math.max(largura, profundidade)} material={piso} /> : <PisoFormaNeutra shape={shape} />}

      {visiveisIdx.map((i) => {
        const p = paredes[i];
        return i === fundoIdx && revestimento ? (
          <ParedeComFoto key={i} comprimento={p.comprimento} peDireitoM={peDireitoM} centro={p.centro} rotacaoY={p.rotacaoY} material={revestimento} />
        ) : (
          <mesh key={i} position={[p.centro.x, peDireitoM / 2, p.centro.z]} rotation={[0, p.rotacaoY, 0]} receiveShadow>
            <boxGeometry args={[p.comprimento, peDireitoM, ESPESSURA_PAREDE]} />
            <meshStandardMaterial color="#efece3" roughness={0.92} />
          </mesh>
        );
      })}

      {bancada && (
        <mesh position={[largura * 0.22, 0.5, -profundidade * 0.22]} castShadow receiveShadow>
          <boxGeometry args={[Math.min(1.4, largura * 0.6), 0.06, Math.min(0.7, profundidade * 0.4)]} />
          <Suspense fallback={<meshStandardMaterial color="#d8d4c6" />}>
            <TextureMaterial material={bancada} />
          </Suspense>
        </mesh>
      )}

      <MobiliaDeReferencia tipo={tipo} fatorEscala={fatorEscala} />
    </>
  );
}

/** Configurador 3D do ambiente inteiro — mostra piso/parede/bancada juntos,
 * refletindo as opções já escolhidas pelo cliente em todos os itens do
 * ambiente (não só o item que está sendo editado). Quando a Planta tem
 * `geometria3D` (extraída de um DXF real — ver docs/padrao-plantas-dxf.md e
 * lib/dxfPlanta.ts), o casco do cômodo usa o contorno de verdade em vez da
 * caixa genérica 5×3,6; sem isso, mantém o comportamento genérico de
 * sempre. A mobília de referência de sala e cozinha já usa .glb reais,
 * comprimidos com Draco+KTX2 (ver MODELOS/ModeloReal acima). */
export function AmbienteConfigurador3D({
  ambienteNome,
  piso,
  revestimento,
  bancada,
  geometriaReal,
  height = 280,
}: {
  ambienteNome: string;
  piso?: SuperficieMaterial;
  revestimento?: SuperficieMaterial;
  bancada?: SuperficieMaterial;
  /** Contorno real do ambiente + pé-direito, vindo de Planta.geometria3D. */
  geometriaReal?: { pontosM: [number, number][]; peDireitoM: number };
  height?: number;
}) {
  const tipo = tipoAmbientePorNome(ambienteNome);
  const legendas = [piso && `Piso: ${piso.nome}`, revestimento && `Revestimento: ${revestimento.nome}`, bancada && `Bancada: ${bancada.nome}`].filter(Boolean);
  const creditos = creditosPorTipo(tipo);

  if (!piso && !revestimento && !bancada) {
    return (
      <div
        className="text-soft"
        style={{
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          borderRadius: 10,
          border: "1px dashed var(--rule-strong)",
          background: "var(--paper)",
          fontSize: 12.5,
          textAlign: "center",
          padding: 12,
        }}
      >
        <Box size={20} />
        Nenhum item deste ambiente tem material com foto cadastrada ainda.
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)", background: "var(--paper-2)" }}>
      <div style={{ height }}>
        <Canvas camera={{ position: CAMERA_POS, fov: 42 }} shadows>
          <Suspense fallback={null}>
            <Cena tipo={tipo} piso={piso} revestimento={revestimento} bancada={bancada} geometriaReal={geometriaReal} />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={2.5} maxDistance={8} maxPolarAngle={Math.PI / 2.05} target={[0, 1, -0.3]} />
        </Canvas>
      </div>
      {geometriaReal && (
        <div className="row gap-xs" style={{ alignItems: "center", padding: "6px 12px", borderTop: "1px solid var(--rule)", fontSize: 10.5, color: "var(--green-ink)", background: "var(--green-bg)" }}>
          <MapPin size={11} /> Ambiente gerado a partir da planta real (DXF) — não é um cômodo genérico.
        </div>
      )}
      {legendas.length > 0 && (
        <div className="mono" style={{ display: "flex", flexWrap: "wrap", gap: 0, borderTop: "1px solid var(--rule)", fontSize: 11.5 }}>
          {legendas.map((l, i) => (
            <div key={i} style={{ padding: "8px 12px", borderRight: i < legendas.length - 1 ? "1px solid var(--rule)" : undefined, color: "var(--ink-soft)" }}>
              {l}
            </div>
          ))}
        </div>
      )}
      {creditos.length > 0 && (
        <div style={{ padding: "6px 12px", borderTop: "1px solid var(--rule)", fontSize: 10, color: "var(--ink-softer)", lineHeight: 1.5 }}>
          {creditos.map((c) => c.credito).join(" · ")}
        </div>
      )}
    </div>
  );
}
