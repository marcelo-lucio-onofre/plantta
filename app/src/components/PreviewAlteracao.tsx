import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowRight, Box, Smartphone } from "lucide-react";
import { ImageThumb } from "./ImageThumb";
import { registrarVisualizacao } from "../lib/analytics";
import { useApp } from "../state/AppContext";
import type { Ambiente, Item, Opcao, Vinculo } from "../domain/types";
import type { SuperficieMaterial } from "./AmbienteConfigurador3D";

// Carregado sob demanda — puxa three.js/R3F/model-viewer, só quando o
// cliente pede pra ver o ambiente ou o material em 3D/AR.
const Material3DPreview = lazy(() => import("./Material3DPreview").then((m) => ({ default: m.Material3DPreview })));
const AmbienteConfigurador3D = lazy(() => import("./AmbienteConfigurador3D").then((m) => ({ default: m.AmbienteConfigurador3D })));
const MaterialARSwatch = lazy(() => import("./MaterialARSwatch").then((m) => ({ default: m.MaterialARSwatch })));

/** Categorias que o configurador 3D do ambiente sabe desenhar. */
type SuperficieCategoria = "Piso" | "Revestimento" | "Bancada";
type Modo = "ambiente" | "material3d" | "ar" | null;

const fallback = (texto: string) => <div className="text-soft" style={{ fontSize: 12.5, padding: 12 }}>{texto}</div>;

/**
 * "Como fica no seu ambiente" — mostra, pra uma troca de opção, o que muda
 * (de → para) e como o cômodo fica antes e depois, em 3D, mais o material
 * isolado em 3D/AR. Usado no wizard de Nova personalização (onde o cliente
 * escolhe) e no detalhe de uma solicitação já enviada.
 *
 * `escolhasBase` = escolhas já feitas pelo cliente nos outros itens do
 * ambiente (itemId → opcaoId); o item em questão é sobrescrito por
 * `de`/`para`, então piso e revestimento aparecem juntos mesmo escolhidos
 * em momentos diferentes.
 */
export function PreviewAlteracao({
  vinculo,
  ambiente,
  item,
  escolhasBase,
  de,
  para,
}: {
  vinculo: Vinculo;
  ambiente: Ambiente;
  item: Item;
  escolhasBase: Record<string, string>;
  de: Opcao | undefined;
  para: Opcao;
}) {
  const { catalogo, catalogoMateriais, catalogoCategorias } = useApp();
  const [modo, setModo] = useState<Modo>(null);
  const [momento, setMomento] = useState<"antes" | "depois">("depois");

  const materiaisPorId = useMemo(() => new Map(catalogoMateriais.list(vinculo.construtoraId).map((m) => [m.id, m])), [catalogoMateriais, vinculo.construtoraId]);
  const categoriaNomePorId = useMemo(() => new Map(catalogoCategorias.list(vinculo.construtoraId).map((c) => [c.id, c.nome])), [catalogoCategorias, vinculo.construtoraId]);

  const geometria3D = useMemo(() => {
    const planta = catalogo.listPlantas(vinculo.empreendimentoId).find((p) => p.id === vinculo.plantaId);
    const geo = planta?.geometria3D?.ambientes.find((a) => a.ambienteId === ambiente.id);
    return planta?.geometria3D && geo ? { pontosM: geo.pontosM, peDireitoM: planta.geometria3D.peDireitoM } : undefined;
  }, [catalogo, vinculo.empreendimentoId, vinculo.plantaId, ambiente.id]);

  const materialDe = de?.materialCatalogItemId ? materiaisPorId.get(de.materialCatalogItemId) : undefined;
  const materialPara = para.materialCatalogItemId ? materiaisPorId.get(para.materialCatalogItemId) : undefined;

  /** Superfícies do ambiente com o item em questão trocado por `opcaoDoItem`. */
  function superficies(opcaoDoItem: Opcao | undefined) {
    const resultado: Partial<Record<SuperficieCategoria, SuperficieMaterial>> = {};
    for (const it of ambiente.itens) {
      const opt = it.id === item.id ? opcaoDoItem : it.opcoes.find((o) => o.id === (escolhasBase[it.id] ?? it.opcoes.find((o2) => o2.padrao)?.id));
      const material = opt?.materialCatalogItemId ? materiaisPorId.get(opt.materialCatalogItemId) : undefined;
      const categoria = material ? (categoriaNomePorId.get(material.categoriaId) as SuperficieCategoria | undefined) : undefined;
      if (material?.imagemUrl && (categoria === "Piso" || categoria === "Revestimento" || categoria === "Bancada") && !resultado[categoria]) {
        resultado[categoria] = { imagemUrl: material.imagemUrl, roughness: material.roughness, metalness: material.metalness, nome: material.modelo };
      }
    }
    return resultado;
  }

  if (para.remocao || (!materialPara?.imagemUrl && !materialDe?.imagemUrl)) return null;

  const surfaces = superficies(momento === "antes" ? de : para);
  const temSuperficie = Boolean(surfaces.Piso || surfaces.Revestimento || surfaces.Bancada);
  const abrir = (novo: Exclude<Modo, null>, evento: "preview_3d_ambiente" | "preview_3d_opcao" | "preview_ar_opcao") => {
    if (modo !== novo) registrarVisualizacao({ nome: evento, ambiente: ambiente.nome, item: item.nome, opcao: para.nome });
    setModo(modo === novo ? null : novo);
  };

  return (
    <div className="card" style={{ marginTop: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 10 }}>Como fica no seu ambiente</div>

      <div className="row gap-sm" style={{ alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <div className="row gap-sm" style={{ alignItems: "center" }}>
          {materialDe?.imagemUrl && <ImageThumb url={materialDe.imagemUrl} alt={de?.nome ?? "Atual"} size={44} />}
          <div>
            <div className="text-soft" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Atual</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{de?.nome ?? item.padrao}</div>
          </div>
        </div>
        <ArrowRight size={16} className="text-soft" />
        <div className="row gap-sm" style={{ alignItems: "center" }}>
          {materialPara?.imagemUrl && <ImageThumb url={materialPara.imagemUrl} alt={para.nome} size={44} />}
          <div>
            <div className="text-soft" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Nova escolha</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{para.nome}</div>
          </div>
        </div>
      </div>

      <div className="row gap-sm" style={{ flexWrap: "wrap", marginBottom: modo ? 12 : 0 }}>
        {temSuperficie && (
          <button type="button" className="btn btn--sm" onClick={() => abrir("ambiente", "preview_3d_ambiente")}>
            <Box size={14} /> {modo === "ambiente" ? "Ocultar" : "Ver"} {ambiente.nome} em 3D
          </button>
        )}
        {materialPara?.imagemUrl && (
          <>
            <button type="button" className="btn btn--sm" onClick={() => abrir("material3d", "preview_3d_opcao")}>
              <Box size={14} /> {modo === "material3d" ? "Ocultar material 3D" : "Material em 3D"}
            </button>
            <button type="button" className="btn btn--sm" onClick={() => abrir("ar", "preview_ar_opcao")}>
              <Smartphone size={14} /> {modo === "ar" ? "Ocultar AR" : "Material em AR"}
            </button>
          </>
        )}
      </div>

      {modo === "ambiente" && (
        <>
          <div className="row gap-sm" style={{ marginBottom: 8 }} role="group" aria-label="Comparar antes e depois">
            <button type="button" className={momento === "antes" ? "btn btn--sm btn--primary" : "btn btn--sm"} aria-pressed={momento === "antes"} onClick={() => setMomento("antes")}>
              Como está
            </button>
            <button type="button" className={momento === "depois" ? "btn btn--sm btn--primary" : "btn btn--sm"} aria-pressed={momento === "depois"} onClick={() => setMomento("depois")}>
              Como fica
            </button>
          </div>
          <Suspense fallback={fallback("Carregando ambiente 3D…")}>
            <AmbienteConfigurador3D
              ambienteNome={ambiente.nome}
              piso={surfaces.Piso}
              revestimento={surfaces.Revestimento}
              bancada={surfaces.Bancada}
              geometriaReal={geometria3D}
              height={280}
            />
          </Suspense>
        </>
      )}
      {modo === "material3d" && materialPara?.imagemUrl && (
        <Suspense fallback={fallback("Carregando preview 3D…")}>
          <Material3DPreview imagemUrl={materialPara.imagemUrl} roughness={materialPara.roughness} metalness={materialPara.metalness} height={220} />
        </Suspense>
      )}
      {modo === "ar" && materialPara?.imagemUrl && (
        <Suspense fallback={fallback("Preparando visualização em AR…")}>
          <MaterialARSwatch imagemUrl={materialPara.imagemUrl} nome={para.nome} roughness={materialPara.roughness} metalness={materialPara.metalness} height={280} />
        </Suspense>
      )}
    </div>
  );
}
