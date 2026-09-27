// Pipeline real de compressão de assets 3D — Fase 4 do plano.
// Uso: node scripts/compress-model.mjs <entrada.glb> <saida.glb>
//
// Ordem importa: o comando de textura da CLI decodifica qualquer Draco já
// presente ao reescrever o arquivo (perde a compressão de geometria se ela
// vier primeiro) — por isso texturas primeiro, Draco por último.
//
// 1) KTX2/Basis Universal (compressão de textura pra GPU) via
//    @gltf-transform/cli, que chama o binário `toktx` do KTX-Software
//    (precisa estar instalado e no PATH). ETC1S = bitstream de menor
//    tamanho do Basis Universal, o que de fato reduz peso pra entrega
//    web/mobile (UASTC prioriza qualidade e costuma ficar do tamanho do
//    PNG original ou maior — serve mais pra normal maps "hero").
// 2) Draco (compressão de geometria) via @gltf-transform/functions, em
//    memória, com o encoder WASM do pacote draco3dgltf.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { draco, dedup, prune } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { execFileSync } from "node:child_process";
import { statSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , entrada, saida] = process.argv;
if (!entrada || !saida) {
  console.error("Uso: node scripts/compress-model.mjs <entrada.glb> <saida.glb>");
  process.exit(1);
}

function tamanhoMB(caminho) {
  return (statSync(caminho).size / (1024 * 1024)).toFixed(2);
}

console.log(`Entrada: ${entrada} (${tamanhoMB(entrada)} MB)`);

const tmpDir = mkdtempSync(join(tmpdir(), "gltf-compress-"));
const comKtx2 = join(tmpDir, "com-ktx2.glb");

// 1) Texturas primeiro.
execFileSync(
  "npx",
  ["--no-install", "gltf-transform", "etc1s", entrada, comKtx2, "--quality", "192", "--compression", "3"],
  { stdio: "inherit", cwd: process.cwd() },
);
console.log(`Após KTX2 (texturas): ${tamanhoMB(comKtx2)} MB`);

// 2) Geometria por último — remove duplicatas/dados não usados, depois Draco.
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

const document = await io.read(comKtx2);
await document.transform(dedup(), prune(), draco({ method: "edgebreaker" }));
await io.write(saida, document);

rmSync(tmpDir, { recursive: true, force: true });

console.log(`Saída final (KTX2 + Draco): ${saida} (${tamanhoMB(saida)} MB)`);
const reducao = (1 - statSync(saida).size / statSync(entrada).size) * 100;
console.log(`Redução total: ${reducao.toFixed(1)}%`);
