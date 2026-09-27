# Padrão de planta DXF para o 3D/AR

Este documento define o que uma construtora precisa entregar (formato de arquivo,
camadas, nomenclatura) para que a plataforma gere automaticamente o ambiente 3D
real usado no preview de material e na Realidade Aumentada — em vez do cômodo
genérico/placeholder usado hoje.

Sem uma planta que siga este padrão, a plataforma cai no fallback manual
(ver "O que acontece se a planta não seguir o padrão", no fim).

## Por que DXF (e não DWG)

- **DXF** é um formato aberto e documentado — dá pra ler com bibliotecas
  gratuitas e de código aberto no navegador (`dxf-parser`), sem depender de
  nenhum serviço pago de conversão.
- **DWG** é um formato binário proprietário da Autodesk. Não existe parser
  livre e confiável pra ele (o único projeto open-source relevante,
  LibreDWG, é instável pra muitas versões de DWG). Por isso a plataforma
  **não vai processar DWG diretamente**.

Praticamente todo software de CAD profissional (AutoCAD, Revit, ArchiCAD,
SketchUp) exporta pra DXF nativamente — não é um formato exótico, é uma
exportação padrão em qualquer um desses programas. A construtora não precisa
adotar uma ferramenta nova, só marcar "exportar como DXF" (em vez de DWG) na
hora de entregar a planta.

## Base do padrão: ASBEA

Em vez de propor uma convenção nova, este padrão usa como base o **Manual de
Diretrizes Gerais para Intercambialidade de Projetos em CAD**, publicado pela
ASBEA (Associação Brasileira dos Escritórios de Arquitetura) em 2002 e
referenciado até hoje por prefeituras e pelo CAU/BR para padronização de
camadas em projetos de arquitetura. É a referência mais próxima de um "padrão
de mercado" que existe no Brasil para isso — a maioria dos escritórios de
arquitetura já conhece essa convenção, mesmo que nem todos a sigam à risca.

A ASBEA organiza o nome de cada camada em campos separados por hífen:

```
AGE-ELE-QUA-...
```

- **AGE** (Agente): disciplina responsável — `ARQ` para arquitetura
- **ELE** (Elemento): o que a camada representa — `ALV` (alvenaria/parede),
  `AMB` (ambiente), `POR` (porta), `JAN` (janela)
- **QUA** (Qualificação): diferenciação adicional (ex.: altura da parede)

Exemplos completos: `ARQ-ALV` (paredes de arquitetura), `ARQ-AMB` (contorno
de ambiente), `ARQ-AMB-TXT` (texto/legenda do nome do ambiente).

## Camadas exigidas pela plataforma

| Camada (nome ASBEA) | Conteúdo exigido | Uso pelo parser |
|---|---|---|
| `ARQ-AMB` | Um polígono **fechado** (`LWPOLYLINE` com `closed=true`) por ambiente, delimitando toda a área do cômodo | Vira o piso e a base da extrusão das paredes — **é a camada mais importante do padrão** |
| `ARQ-AMB-TXT` | Um texto (`TEXT` ou `MTEXT`) dentro de cada polígono de `ARQ-AMB`, com o nome do ambiente | Casa o texto mais próximo do centro de cada polígono com o `ambiente.id` do catálogo (ver tabela de nomenclatura abaixo) |
| `ARQ-ALV` | Linhas/polilinhas representando as paredes (opcional se `ARQ-AMB` já describe o contorno) | Usada só se quisermos desenhar a espessura real da parede; se ausente, a plataforma extruda o próprio contorno de `ARQ-AMB` com espessura padrão |

Camadas de porta (`ARQ-POR`) e janela (`ARQ-JAN`) **não são obrigatórias na
v1** — a plataforma gera paredes sem vãos por enquanto (o objetivo aqui é
preview de acabamento, não navegação arquitetônica).

## Regras adicionais (fora do escopo da ASBEA, específicas da plataforma)

1. **Unidades declaradas.** O DXF deve estar em metros ou centímetros — e a
   construtora precisa informar qual, no upload (a plataforma não adivinha
   escala a partir do arquivo).
2. **Um polígono fechado por ambiente, sem sobreposição.** Cada `ARQ-AMB`
   precisa ser uma poligonal fechada válida (sem ambiente cortando outro).
3. **Pé-direito não vem do DXF.** Plantas 2D não têm altura. A construtora
   informa o pé-direito (padrão sugerido: 2,60 m) uma vez, no cadastro da
   planta — não por ambiente.
4. **Nome do ambiente no texto deve bater com o catálogo.** A tabela abaixo é
   a lista fechada de nomes reconhecidos. Variações de acentuação/maiúsculas
   são normalizadas automaticamente; nomes fora dessa lista ficam sem
   ambiente 3D gerado (fallback manual).

| Texto esperado em `ARQ-AMB-TXT` | `ambiente.id` no catálogo |
|---|---|
| `SALA`, `SALA DE ESTAR` | `sala` |
| `COZINHA` | `cozinha` |
| `BANHEIRO`, `BANHEIRO SUÍTE`, `BANHEIRO SOCIAL` | `banheiro` |
| `QUARTO`, `DORMITÓRIO`, `SUÍTE` | `quarto` |

(Lista viva — cresce junto com os `ambiente.id` cadastrados no catálogo de
cada construtora.)

## O que acontece se a planta não seguir o padrão

Isso não é "tudo ou nada". Quando o DXF chega:

- **Segue o padrão** → geração 100% automática do ambiente 3D real.
- **Tem `ARQ-AMB` mas nomes de camada diferentes** → a plataforma mostra a
  lista de camadas encontradas no arquivo e pede pra construtora indicar, uma
  única vez por planta, qual camada corresponde a qual papel (contorno de
  ambiente / texto / parede). Não precisa redesenhar nada, só mapear.
- **Não tem contorno fechado nenhum** (só linhas soltas de parede) → cai pro
  fallback manual: a construtora traça o contorno do ambiente por cima da
  planta renderizada, direto no navegador (ferramenta de digitalização simples,
  clique-a-clique) — ainda usa a planta real como referência visual, só que
  o contorno é feito à mão em vez de extraído automaticamente do DXF.
- **Não tem DXF nenhum** (só PDF/imagem/DWG) → mantém o comportamento atual
  (ambiente genérico/placeholder), até que uma versão em DXF seja enviada.

## Fontes

- Manual de Diretrizes Gerais para Intercambialidade de Projetos em CAD —
  ASBEA (2002), referenciado por prefeituras e pelo CAU/BR como padrão de
  nomenclatura de camadas em projetos de arquitetura no Brasil.
- AIA CAD Layer Guidelines (American Institute of Architects) — base
  internacional sobre a qual o padrão ASBEA foi construído.
