import "@google/model-viewer";
import { Smartphone } from "lucide-react";

/** Visualização em realidade aumentada de um modelo 3D (.glb) — Android abre
 * o Scene Viewer (ARCore) e iOS abre o Quick Look (USDZ gerado automatico-
 * amente pelo model-viewer), os dois direto do navegador, sem app.
 *
 * Depende de um modelo 3D real do ambiente (arquivo .glb cadastrado na
 * categoria `modelo3d` da Planta) — enquanto a planta não tem esse arquivo,
 * o componente não tem o que exibir. Ver plano de implementação, Fase 3. */
export function ARViewer({
  modeloUrl,
  alt,
  height = 320,
}: {
  modeloUrl: string | null;
  alt: string;
  height?: number;
}) {
  if (!modeloUrl) {
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
        <Smartphone size={20} />
        Esta planta ainda não tem modelo 3D do ambiente cadastrado — AR fica disponível assim que o arquivo .glb for anexado.
      </div>
    );
  }

  return (
    <model-viewer
      src={modeloUrl}
      alt={alt}
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      auto-rotate
      shadow-intensity="0.8"
      style={{ width: "100%", height, borderRadius: 10, background: "var(--paper-2)" }}
    />
  );
}
