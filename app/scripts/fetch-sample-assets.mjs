// Baixa o(s) modelo(s) 3D reais usados como fonte pro pipeline de
// compressão (scripts/compress-model.mjs). Não versionamos o .glb original
// (pesado, é só matéria-prima) — rode isso sempre que precisar regenerar
// assets-source/ do zero.
//
// Fonte: glTF-Sample-Assets da Khronos (github.com/KhronosGroup/glTF-Sample-Assets).
// Licença por modelo (ver README de cada pasta no repositório de origem):
// SheenChair é CC0; SheenWoodLeatherSofa e CommercialRefrigerator são
// CC-BY 4.0 (atribuição exibida no rodapé do configurador 3D, ver
// AmbienteConfigurador3D.tsx).
import { writeFileSync, mkdirSync } from "node:fs";

const MODELOS = [
  {
    nome: "sheen-chair.original.glb",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb",
  },
  {
    nome: "sheen-sofa.original.glb",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenWoodLeatherSofa/glTF-Binary/SheenWoodLeatherSofa.glb",
  },
  {
    nome: "commercial-refrigerator.original.glb",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb",
  },
];

mkdirSync("assets-source", { recursive: true });

for (const { nome, url } of MODELOS) {
  console.log(`Baixando ${nome}...`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(`assets-source/${nome}`, buffer);
  console.log(`  -> assets-source/${nome} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}
