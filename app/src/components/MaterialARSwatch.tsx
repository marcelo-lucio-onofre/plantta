import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { ARViewer } from "./ARViewer";
import { gerarGlbAmostraMaterial } from "../lib/materialGlb";

/**
 * "Ver em AR" pra um material isolado — gera uma amostra .glb a partir da
 * foto do material (ver lib/materialGlb) e abre no <model-viewer>. Cliente
 * aponta a câmera pro chão/parede e vê a amostra em escala real, sem app.
 *
 * Diferente do ARViewer puro (que espera um modeloUrl já pronto — o
 * ambiente real da planta, Fase 3→4), este componente monta esse modelo na
 * hora a partir de qualquer material com foto, então funciona hoje pra
 * qualquer item do catálogo, mesmo sem nenhum .glb de ambiente cadastrado.
 */
export function MaterialARSwatch({
  imagemUrl,
  nome,
  roughness,
  metalness,
  height = 320,
}: {
  imagemUrl: string;
  nome: string;
  roughness?: number;
  metalness?: number;
  height?: number;
}) {
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setGlbUrl(null);
    setErro(false);

    // gerarGlbAmostraMaterial cacheia por material — reabrir o AR do mesmo
    // material (fechar/abrir, trocar de opção e voltar) é instantâneo, e a
    // URL retornada não deve ser revogada aqui (ver lib/materialGlb).
    gerarGlbAmostraMaterial(imagemUrl, { roughness, metalness })
      .then((url) => {
        if (!cancelado) setGlbUrl(url);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      });

    return () => {
      cancelado = true;
    };
  }, [imagemUrl, roughness, metalness]);

  if (erro) {
    return (
      <div
        className="text-soft"
        style={{ height, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px dashed var(--rule-strong)", background: "var(--paper)", fontSize: 12.5, padding: 12, textAlign: "center" }}
      >
        Não foi possível gerar a amostra 3D desta foto.
      </div>
    );
  }

  if (!glbUrl) {
    return (
      <div
        className="text-soft"
        style={{ height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, background: "var(--paper-2)", fontSize: 12.5 }}
      >
        <Smartphone size={20} />
        Preparando amostra pra AR…
      </div>
    );
  }

  return <ARViewer modeloUrl={glbUrl} alt={`Amostra de ${nome} em realidade aumentada`} height={height} />;
}
