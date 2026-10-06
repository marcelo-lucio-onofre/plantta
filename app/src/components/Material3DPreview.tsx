import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { SRGBColorSpace, type Texture } from "three";
import { Box } from "lucide-react";

function onTextureLoad(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
}

/** Placa 3D texturizada com a foto do material — a peça central do preview:
 * cliente gira/aproxima pra ver o padrão antes de decidir. Usa a mesma
 * imagem cadastrada em MaterialCatalogItem.imagemUrl, sem asset 3D à parte
 * (fase seguinte do plano troca a placa por um modelo real do ambiente). */
function Swatch({ imagemUrl, roughness, metalness }: { imagemUrl: string; roughness: number; metalness: number }) {
  const texture = useTexture(imagemUrl, onTextureLoad);

  return (
    <mesh rotation={[-0.55, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.2, 2.2, 0.1]} />
      <meshStandardMaterial map={texture} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

export function Material3DPreview({
  imagemUrl,
  roughness = 0.5,
  metalness = 0,
  height = 220,
}: {
  imagemUrl: string | null;
  /** 0 = espelhado, 1 = fosco — ver MaterialCatalogItem.roughness. */
  roughness?: number;
  /** 0 = não-metal, 1 = metal puro — ver MaterialCatalogItem.metalness. */
  metalness?: number;
  height?: number;
}) {
  if (!imagemUrl) {
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
        Sem foto cadastrada — envie uma imagem do material pra ver o preview 3D.
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: 10, overflow: "hidden", border: "1px solid var(--rule)", background: "var(--paper-2)" }}>
      <Canvas camera={{ position: [0, 2.2, 3.4], fov: 38 }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow />
        <Suspense fallback={null}>
          <Swatch imagemUrl={imagemUrl} roughness={roughness} metalness={metalness} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
      </Canvas>
    </div>
  );
}
