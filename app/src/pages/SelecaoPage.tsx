import { lazy, Suspense, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Box, Smartphone } from "lucide-react";
import { Breadcrumb } from "../components/Breadcrumb";
import { PrazoBadge } from "../components/Badge";
import { fmtBRL, fmtSigned, saldoAllowanceGroup } from "../domain/calculations";
import { registrarVisualizacao } from "../lib/analytics";
import { useApp } from "../state/AppContext";
import type { Opcao } from "../domain/types";

// Carregado sob demanda — puxa three.js/R3F/model-viewer, só quando o
// cliente pede pra ver uma opção (ou o ambiente inteiro) em 3D/AR.
const Material3DPreview = lazy(() => import("../components/Material3DPreview").then((m) => ({ default: m.Material3DPreview })));
const AmbienteConfigurador3D = lazy(() => import("../components/AmbienteConfigurador3D").then((m) => ({ default: m.AmbienteConfigurador3D })));
const MaterialARSwatch = lazy(() => import("../components/MaterialARSwatch").then((m) => ({ default: m.MaterialARSwatch })));

type Preview = { optId: string; modo: "3d" | "ar" } | null;

/** Nomes de categoria que o configurador 3D do ambiente sabe desenhar —
 * ver CATEGORIAS_MATERIAL em domain/catalogoReferencia.ts. Um item cujo
 * material caia numa categoria fora dessa lista (ex.: Louças e Metais)
 * simplesmente não aparece na cena — não é um erro. */
type SuperficieCategoria = "Piso" | "Revestimento" | "Bancada";

export function SelecaoPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { catalogo, catalogoMateriais, catalogoCategorias, activeVinculo, vinculoChoices: choices, chooseOption } = useApp();
  const allowanceGroups = activeVinculo ? catalogo.getAllowanceGroups(activeVinculo.id) : [];
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview>(null);
  const [showAmbiente3D, setShowAmbiente3D] = useState(false);

  const materiaisPorId = useMemo(() => {
    if (!activeVinculo) return new Map<string, ReturnType<typeof catalogoMateriais.list>[number]>();
    return new Map(catalogoMateriais.list(activeVinculo.construtoraId).map((m) => [m.id, m]));
  }, [catalogoMateriais, activeVinculo]);

  const categoriaNomePorId = useMemo(() => {
    if (!activeVinculo) return new Map<string, string>();
    return new Map(catalogoCategorias.list(activeVinculo.construtoraId).map((c) => [c.id, c.nome]));
  }, [catalogoCategorias, activeVinculo]);

  function materialDaOpcao(opt: Opcao) {
    if (!opt.materialCatalogItemId) return undefined;
    const material = materiaisPorId.get(opt.materialCatalogItemId);
    if (!material?.imagemUrl) return undefined;
    return { ...material, imagemUrl: material.imagemUrl };
  }

  const found = useMemo(() => {
    if (!activeVinculo) return null;
    for (const amb of catalogo.getAmbientes(activeVinculo.id)) {
      const item = amb.itens.find((i) => i.id === itemId);
      if (item) return { ambiente: amb, item };
    }
    return null;
  }, [catalogo, activeVinculo, itemId]);

  // Contorno real do ambiente, se a Planta desta unidade já tiver um DXF
  // processado (ver docs/padrao-plantas-dxf.md) — sem isso, o configurador
  // 3D cai de volta no cômodo genérico de sempre. Calculado antes do early
  // return abaixo pra não violar a ordem dos Hooks.
  const geometria3D = useMemo(() => {
    if (!activeVinculo || !found) return undefined;
    const planta = catalogo.listPlantas(activeVinculo.empreendimentoId).find((p) => p.id === activeVinculo.plantaId);
    const ambienteGeo = planta?.geometria3D?.ambientes.find((a) => a.ambienteId === found.ambiente.id);
    if (!ambienteGeo || !planta?.geometria3D) return undefined;
    return { pontosM: ambienteGeo.pontosM, peDireitoM: planta.geometria3D.peDireitoM };
  }, [catalogo, activeVinculo, found]);

  if (!found) return <Navigate to="/personalizacoes" replace />;
  const { ambiente, item } = found;
  const allowanceGroup = allowanceGroups.find((g) => g.id === item.allowanceGroupId);
  const itensDoGrupo = allowanceGroup ? ambiente.itens.filter((i) => allowanceGroup.itemIds.includes(i.id)) : [];

  /** Varre todos os itens do ambiente (não só o item desta página) e pega,
   * pra cada categoria de superfície, o material da opção já escolhida —
   * é isso que deixa o configurador do ambiente reagir a piso + revestimento
   * juntos, mesmo escolhidos em páginas de item diferentes. */
  function superficieDaCategoria(categoria: SuperficieCategoria) {
    for (const it of ambiente.itens) {
      const escolhidoId = choices[it.id] ?? it.opcoes.find((o) => o.padrao)?.id;
      const opt = it.opcoes.find((o) => o.id === escolhidoId);
      const material = opt?.materialCatalogItemId ? materiaisPorId.get(opt.materialCatalogItemId) : undefined;
      if (material?.imagemUrl && categoriaNomePorId.get(material.categoriaId) === categoria) {
        return { imagemUrl: material.imagemUrl, roughness: material.roughness, metalness: material.metalness, nome: material.modelo };
      }
    }
    return undefined;
  }

  const superficiesAmbiente = {
    piso: superficieDaCategoria("Piso"),
    revestimento: superficieDaCategoria("Revestimento"),
    bancada: superficieDaCategoria("Bancada"),
  };
  const temSuperficieComFoto = Boolean(superficiesAmbiente.piso || superficiesAmbiente.revestimento || superficiesAmbiente.bancada);

  const chosenId = choices[item.id] ?? item.opcoes.find((o) => o.padrao)?.id;
  const custoOpcao = item.opcoes.find((o) => o.id === chosenId)?.preco ?? 0;
  const custoArt = item.requerArt ? (item.custoArt ?? 0) : 0;
  const saldo = item.valorPadrao - custoOpcao - custoArt;

  return (
    <div className="container container--narrow">
      <Breadcrumb items={[{ label: "Minhas personalizações", to: "/personalizacoes" }, { label: ambiente.nome }, { label: item.nome }]} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          {item.nome} — {ambiente.nome}
        </h1>
        <span className="badge badge--simples">Simples</span>
      </div>
      <div className="row gap-sm" style={{ alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <PrazoBadge item={item} />
        {item.leadTimeDias != null && (
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Material leva {item.leadTimeDias} dias para chegar após aprovação.</span>
        )}
      </div>

      {temSuperficieComFoto && (
        <div className="card" style={{ padding: 0, marginBottom: 24, overflow: "hidden" }}>
          <button
            type="button"
            className="row"
            style={{ justifyContent: "space-between", alignItems: "center", width: "100%", padding: 14, background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => {
              setShowAmbiente3D((v) => {
                if (!v) registrarVisualizacao({ nome: "preview_3d_ambiente", ambiente: ambiente.nome });
                return !v;
              });
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              <Box size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
              Ver {ambiente.nome} completo em 3D
            </div>
            <span className="text-soft" style={{ fontSize: 12.5 }}>{showAmbiente3D ? "Ocultar" : "Mostrar"}</span>
          </button>
          {showAmbiente3D && (
            <div style={{ padding: "0 14px 14px" }}>
              <Suspense fallback={<div className="text-soft" style={{ fontSize: 12.5, padding: 12 }}>Carregando ambiente 3D…</div>}>
                <AmbienteConfigurador3D
                  ambienteNome={ambiente.nome}
                  piso={superficiesAmbiente.piso}
                  revestimento={superficiesAmbiente.revestimento}
                  bancada={superficiesAmbiente.bancada}
                  geometriaReal={geometria3D}
                  height={280}
                />
              </Suspense>
            </div>
          )}
        </div>
      )}

      {(() => {
        const emUso = Boolean(choices[item.id]);
        const atualOpt = item.opcoes.find((o) => o.id === chosenId);
        const opcoesDeTroca = item.opcoes.filter((o) => o.id !== chosenId);
        return (
          <>
            {atualOpt && (
              <div className="card" style={{ background: "var(--paper)", marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 8 }}>
                  {emUso ? "Em uso atualmente" : "Padrão do empreendimento"}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{emUso ? atualOpt.nome : item.padrao}</div>
                <div className="mono" style={{ fontSize: 14, color: "var(--green-ink)" }}>
                  Valor: {fmtBRL(atualOpt.remocao ? item.valorPadrao : atualOpt.preco)} {!emUso && "(incluído no preço da unidade)"}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>
                  Ao trocar ou remover este item, {fmtBRL(item.valorPadrao)} entram como crédito no seu ledger.
                </div>
              </div>
            )}

            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Opções de troca</div>
            <div className="stack gap-sm" style={{ marginBottom: 24 }}>
              {opcoesDeTroca.map((opt) => {
                const sel = chosenId === opt.id;
                const diff = opt.preco - item.valorPadrao;
                const diffLabel = opt.remocao ? "+" + fmtBRL(item.valorPadrao) : diff !== 0 ? fmtSigned(diff) : null;
                const diffColor = opt.remocao || diff < 0 ? "var(--green-ink)" : "var(--red-ink)";
                const material = materialDaOpcao(opt);
                const modoAberto = preview?.optId === opt.id ? preview.modo : null;
                return (
                  <div key={opt.id} className="card" style={{ padding: 0, border: sel ? "2px solid var(--brand)" : "2px solid var(--rule)", background: sel ? "var(--green-bg)" : "#fff" }}>
                  <button
                    type="button"
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      padding: 14,
                      background: "transparent",
                      border: "none",
                    }}
                    onClick={() => chooseOption(item.id, opt.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{opt.nome}</div>
                      <div className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                        {opt.remocao ? "R$ 0 (remoção)" : fmtBRL(opt.preco)}
                      </div>
                    </div>
                    {diffLabel && (
                      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: diffColor }}>
                        {diffLabel}
                      </div>
                    )}
                  </button>
                  {material && (
                    <div style={{ padding: "0 14px 14px" }}>
                      <div className="row gap-sm" style={{ marginBottom: modoAberto ? 10 : 0 }}>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (modoAberto !== "3d") registrarVisualizacao({ nome: "preview_3d_opcao", ambiente: ambiente.nome, item: item.nome, opcao: opt.nome });
                            setPreview(modoAberto === "3d" ? null : { optId: opt.id, modo: "3d" });
                          }}
                        >
                          <Box size={14} /> {modoAberto === "3d" ? "Ocultar 3D" : "Ver em 3D"}
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (modoAberto !== "ar") registrarVisualizacao({ nome: "preview_ar_opcao", ambiente: ambiente.nome, item: item.nome, opcao: opt.nome });
                            setPreview(modoAberto === "ar" ? null : { optId: opt.id, modo: "ar" });
                          }}
                        >
                          <Smartphone size={14} /> {modoAberto === "ar" ? "Ocultar AR" : "Ver em AR"}
                        </button>
                      </div>
                      {modoAberto === "3d" && (
                        <Suspense fallback={<div className="text-soft" style={{ fontSize: 12.5, padding: 12 }}>Carregando preview 3D…</div>}>
                          <Material3DPreview imagemUrl={material.imagemUrl} roughness={material.roughness} metalness={material.metalness} height={200} />
                        </Suspense>
                      )}
                      {modoAberto === "ar" && (
                        <Suspense fallback={<div className="text-soft" style={{ fontSize: 12.5, padding: 12 }}>Preparando visualização em AR…</div>}>
                          <MaterialARSwatch imagemUrl={material.imagemUrl} nome={opt.nome} roughness={material.roughness} metalness={material.metalness} height={280} />
                        </Suspense>
                      )}
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      <div className="card" style={{ border: "2px solid var(--brand)", marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "var(--green-ink)" }}>Impacto no ledger de crédito</div>
        <div className="grid grid-2" style={{ textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Crédito gerado</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--green-ink)" }}>+{fmtBRL(item.valorPadrao)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Custo da opção</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--red-ink)" }}>
              {custoOpcao > 0 ? "−" + fmtBRL(custoOpcao) : "R$ 0"}
            </div>
          </div>
        </div>
        {item.requerArt && (
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 14, padding: "10px 12px", background: "var(--paper)", borderRadius: 8 }}>
            <div>
              <span className="badge badge--tecnico">Requer ART</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)", marginLeft: 8 }}>Taxa de ART/RRT cobrada junto com esta alteração.</span>
            </div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--red-ink)" }}>
              {custoArt > 0 ? "−" + fmtBRL(custoArt) : "R$ 0"}
            </div>
          </div>
        )}
        <div className="text-center" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Saldo líquido</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: saldo >= 0 ? "var(--green-ink)" : "var(--red-ink)" }}>
            {fmtSigned(saldo)}
          </div>
        </div>
      </div>

      {allowanceGroup && (() => {
        const saldo = saldoAllowanceGroup(allowanceGroup, itensDoGrupo, choices);
        return (
          <div className="card" style={{ border: "2px solid var(--rule-strong)", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Saldo do grupo de verba — {allowanceGroup.nome}</div>
            <div className="text-soft" style={{ fontSize: 12.5, marginBottom: 12 }}>
              Compartilhada entre {itensDoGrupo.map((i) => i.nome).join(", ")}. Gastar mais aqui reduz o saldo dos outros itens do grupo.
            </div>
            <div className="grid grid-2" style={{ textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Verba total</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{fmtBRL(saldo.valorTotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Saldo restante</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: saldo.saldo >= 0 ? "var(--green-ink)" : "var(--red-ink)" }}>
                  {fmtBRL(saldo.saldo)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link to="/personalizacoes" className="btn">
          Voltar
        </Link>
        <button type="button" className="btn btn--primary" onClick={() => navigate("/personalizacoes")}>
          Confirmar seleção
        </button>
      </div>
    </div>
  );
}
