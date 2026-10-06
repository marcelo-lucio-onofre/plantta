# DESIGN.md — plantta

Especificação de identidade visual pra quem (humano ou agente) for mexer na interface deste projeto. Objetivo: qualquer tela nova nasce parecida com as outras sem precisar redescobrir decisão por decisão.

## 1. Conceito de identidade visual

**plantta** é uma plataforma que transforma personalização de acabamentos numa obra — hoje resolvida em planilha e WhatsApp — em processo documentado: crédito calculado, aprovação técnica, termo assinado. A referência visual não é "SaaS genérico", é **papel técnico e canteiro de obra**: blueprint, memorial descritivo, ficha de material (concreto, porcelanato, granito). Isso guia toda decisão de cor/tipografia abaixo.

Princípios:
- **Neutros quentes, nunca azul-marinho.** Preto-azulado é o padrão de qualquer dashboard SaaS gerado. Aqui os neutros puxam pra um cinza-grafite quente, como papel de rascunho técnico.
- **Azul é marca, verde é função — nunca o mesmo papel.** Desde o rebrand (kit "Marca B2B/B2C forte", `--blue`), a identidade plantta (wordmark, símbolo, ação de marca/`--brand`) é azul. Verde (`--green`) ficou **exclusivamente funcional** — crédito, aprovado — e nunca decorativo nem usado como cor de marca.
- **Marca da construtora é dado, não decisão de design.** Quando o portal do cliente está em modo white-label, a cor de destaque (`--brand`) vem do repositório de marca da construtora, não da paleta plantta (que por padrão é `--blue`). Ver seção 6.
- **Sem chrome decorativo.** Nada de eyebrow ALL-CAPS repetindo o que o breadcrumb já disse, nada de seta "→" no fim de botão/link só por estética. Se um elemento não carrega informação nova, ele não existe.

## 2. Paleta de cores

Definida em `src/index.css`, bloco `:root` (claro) + `[data-theme="dark"]` (escuro — **não** escopado a `:root`, de propósito: `SidebarShell` aplica o atributo no `.portal-shell`, não no `<html>`, pra só o produto autenticado herdar o tema, nunca páginas públicas). Valores em hex (fonte da verdade — vieram do kit de rebrand "Marca B2B/B2C forte").

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--ink` / `--ink-soft` / `--ink-softer` | `#211d16` / `#6b6459` / `#938c7e` | `#eef4fb` / `#9db1c9` / `#6f89a8` | Texto principal/secundário/terciário |
| `--paper` / `--paper-2` | `#f6f3ec` / `#ece7db` | `#0d1420` / `#131d2d` | Fundo da página / bloco alternado |
| `--card` | `#fffdf9` | `#111b2a` | Fundo de card |
| `--rule` / `--rule-strong` | `#e4dfd2` / `#d3ccbb` | `#1e2d44` / `#2b3f5c` | Bordas |
| `--navy` / `--navy-2` | `#0d1420` / `#1e2d44` | *(fixo, não varia com o tema)* | Fundo da sidebar — sempre escuro, preto-grafite quente-frio, chrome permanente do app (não segue o toggle claro/escuro do conteúdo) |
| `--blue` / `--blue-strong` / `--blue-bg` / `--on-blue` | `#2f6bd8` / `#24539f` / `#e7effc` / `#fff` | `#4f9bff` / `#7fb2ff` / `#14294a` / `#fff` | **Marca plantta** (wordmark "tt", `--brand` padrão, foco de input, links) |
| `--green` / `--green-ink` / `--green-bg` | `#3f9668` / `#2c6b4b` / `#e4f2ea` | `#46c088` / `#8fe3ba` / `#0f2a20` | Crédito, aprovado — **só função, nunca marca** |
| `--amber-ink` / `--amber-bg` | `#8a6410` / `#f6ecd4` | `#e2b25a` / `#2c2410` | Nível técnico, pendente |
| `--red-ink` / `--red-bg` | `#a83326` / `#f8e4e0` | `#f0968b` / `#2e1512` | Débito, bloqueado, recusado |
| `--violet-bg` / `--violet-ink` | `oklch(95%/42% 0.035/0.12 260)` | *(idem, não redefinido no escuro ainda)* | Em análise |
| `--alert-*` | `oklch(... 40)` (laranja) | *(não redefinido no escuro ainda)* | Ação com consequência que o cliente precisa ler antes — hoje só o termo de não personalização. Não é erro (vermelho) nem pendência (âmbar) |
| `--shadow` | `0 14px 40px rgba(40,30,12,.14)` | `0 16px 48px rgba(0,0,0,.5)` | Sombra de modal/toast/dropdown |
| `--brand` | `var(--blue)` por padrão, **sobrescrito pela marca da construtora logada** | Ver seção 6 |

Tema: produto (telas dentro de `SidebarShell`) nasce **claro** por padrão; escuro é opção, alternável no botão do rodapé da sidebar (`ThemeContext`, `sessionStorage`). Páginas públicas (`LandingPage`, logins) não têm o toggle — a marca (landing, redes sociais) vive **sempre escura**, fixada via `data-theme="dark"` local, independente da preferência do usuário logado.

## 3. Tipografia

**Archivo Expanded** (display/títulos, 700–900) + **Archivo** (corpo/UI, 400–700) + **JetBrains Mono** (dados/números/IDs, 400–600) — trocou IBM Plex no rebrand (kit "Marca B2B/B2C forte"). Carregadas via Google Fonts (`index.html`).

- Escala: display `clamp(32px,6vw,64px)`/800/`-0.02em` (hero de landing), título de seção `28px`/700 Archivo Expanded, corpo `16px/1.6` Archivo, small `13px`, mono `13–18px`. Classe `.display` aplica Archivo Expanded 800 `-0.015em` pra qualquer título fora de `h1/h2/h3` (que já herdam Archivo Expanded via seletor global).
- `.mono` (JetBrains Mono) só em dado tabular de verdade: dinheiro, IDs (`SOL-013`), timestamps, badges de nível. Nunca em prosa decorativa.
- Nunca ALL-CAPS pra rótulo de texto corrido (era `.eyebrow`, removido — ver seção 7). ALL-CAPS só sobrevive em rótulo de agrupamento de UI real (label de seção na sidebar, badge de status) — isso é estrutura de navegação, não decoração de conteúdo.
- **Wordmark — regra fixa.** Sempre que "plantta" aparece como marca (não em prosa comum), os dois `tt` ficam `--blue`, o resto herda a cor do contexto — nunca digitar "plantta" solto onde é marca. Usar `<Wordmark />` (`components/BrandMark.tsx`); `<BrandMark />` combina o símbolo (SVG do blueprint reduzido ao par TT, `viewBox 0 0 120 120`) com o `<Wordmark />`. Exceção deliberada: `LoginClientePage` (white-label da Alliance) usa a tipografia da própria construtora (Barlow/Plus Jakarta Sans/Noto Serif Display) — não é bug, é o portal branded renderizando a marca de quem contratou, não a da plantta.

## 4. Espaçamento & grid

- `--radius-sm/--radius/--radius-lg`: 6/10/16px.
- `--gap`: 16px, escala via classes `.gap-xs`(6) `.gap-sm`(10) `.gap`(16) `.gap-lg`(24).
- `.container` max-width 1100px (`--narrow` 820, `--wide` 1200), padding lateral 16px, breakpoint mobile em 720px (grids de 2/4 colunas viram 1 coluna).
- Sidebar: 860px é o breakpoint — abaixo disso vira topbar+drawer, acima é coluna fixa. Ver `.portal-shell`/`.portal-body` em `index.css`: o shell é `flex-direction: column` (topbar em cima), e sidebar+conteúdo ficam numa `.portal-body` interna em row. **Não inverter isso** — já quebrou uma vez (topbar virando item de flex-row e esticando a tela toda).

## 5. Componentes

- `.card` — bloco com borda, usado pra unidade **clicável/selecionável** (opção de acabamento, vínculo, linha de lista). Se não é clicável, considerar um bloco mais simples (fundo tintado sem borda) em vez de reaproveitar `.card` por preguiça — isso é o "SaaS-card-kit genérico" que a skill de frontend-design aponta como tell de IA.
- `.badge--simples/tecnico/bloqueado` — cor é semântica (nível de aprovação), nunca segue `--brand`.
- `.btn--primary` usa `var(--brand)` — herda automaticamente a cor certa (plantta ou construtora) por estar dentro do escopo de `--brand` setado no `ClientPortalLayout`/`SidebarShell`.
- `Breadcrumb` (`components/Breadcrumb.tsx`) é a única forma de "onde estou" — não duplicar com eyebrow acima do H1.
- `PrazoBadge`/`JanelaBadge` (`components/Badge.tsx`) — nunca campo de data solto num H1/subtítulo. Registro desabilitado (janela de personalização encerrada) numa listagem usa opacidade reduzida (`0.6`, mesmo valor de item bloqueado nivel 3) + borda esquerda vermelha fina — nunca remover o registro da lista, só destacar.
- Consistência de dado em campo de taxonomia — evoluiu de enum fechado pra **CRUD próprio por construtora**: Categoria e Marca (`/catalogo/categorias`, `/catalogo/marcas`) são entidades reais (`Categoria`/`Marca` em `domain/types.ts`, `SimpleNomeCrud` como UI compartilhada — mesma forma id+nome, uma UI só), não mais texto livre nem lista estática. `domain/catalogoReferencia.ts` virou só a **semente inicial** (`CATEGORIAS_MATERIAL`/`MARCAS_SUGERIDAS`), lida uma vez em `mockData.ts` pra popular o repositório — não é mais consultada em runtime pela UI. `SugestaoInput` (datalist nativo + snap de grafia no blur via `normalizarContraLista`) continua pro caso que não virou entidade própria: Ambiente, texto livre com sugestão, nunca `<input>` solto onde já existe conjunto de valores conhecidos.
- Sub-menu de sidebar (`sidebar-nav-btn--sub`, ver `ConstrutoraPortalLayout.tsx`) — item pai vira link clicável (rota "home" daquele grupo) + filhos indentados abaixo, sempre visíveis (sem accordion, só 4 itens no maior caso — Catálogo). Usa `NavLink end` no pai pra não ficar "active" quando um filho está ativo.
- Botões (`.btn`, `index.css`): `.btn--primary` = ação de marca (`var(--brand)`, azul por padrão); `.btn--confirm` = confirmação/crédito (verde fixo, nunca segue marca); `.btn--danger-text` = recusar/excluir (texto vermelho, fundo `--red-bg` no hover); sem classe = secundário (`--card` + borda, hover borda azul). Todos min-height 46px, radius `--radius`, disabled opacity `.45`.

## 6. White-label — regra crítica

O portal do cliente pode rodar com a marca da plantta (padrão, `--blue` desde o rebrand) ou com a marca real da construtora. A marca em si é dado por-construtora, editável em `MarcaPage` e guardado em `IBrandRepository` (`repositories.brand`, chaveado por `construtoraId` — `null` quando a construtora não opinou pelo white-label ainda). `AppContext.effectiveBrand` resolve `state.loginScopeConstrutoraId` (setado só no login do cliente por uma tela de marca específica, nunca por qual vínculo está "ativo" no momento) e lê o brand **ao vivo** do repositório — `repositories.brand.getBrand(loginScopeConstrutoraId) ?? planttaBrand` — nunca um snapshot estático em `Vinculo.brand`. Propagado via CSS var `--brand` no `SidebarShell`. **Qualquer ação de marca (`.btn--primary`, link ativo de sidebar, etc.) deve ler `var(--brand)`, nunca uma cor fixa** — senão a troca de marca fica pela metade (alguns elementos mudam, outros não). Isso não inclui `.btn--confirm` (verde, crédito/aprovação) nem os semânticos âmbar/vermelho — esses são **função**, não marca, e ficam fixos de propósito mesmo em white-label (ver seção 1). O back-office da construtora nunca troca de marca — sempre plantta, mas mostra o nome da construtora logada (`construtoraLogadaId`) como tag no cabeçalho da sidebar.

## 7. Histórico de decisões (não repetir)

- ~~Plus Jakarta Sans~~ → IBM Plex Sans (Plus Jakarta virou clichê de output de IA).
- ~~Sidebar azul-marinho (`oklch(20% 0.025 260)`)~~ → grafite quente (`oklch(19% 0.014 85)`).
- ~~Verde `oklch(55% 0.16 155)` saturado~~ → `oklch(50% 0.10 155)` desaturado.
- ~~`.eyebrow` ALL-CAPS acima de todo H1~~ → removido; info real (quando existe) virou parágrafo normal.
- ~~Seta "→" decorativa no fim de link/botão~~ → removida em todo lugar.
- ~~Ícone emoji na sidebar~~ → `lucide-react` em todo lugar (mesma lib usada em `reservas-hub` e `omnix`, os dois projetos-referência do time).
- ~~Menu lateral com árvore estática de construtora/empreendimento/unidade~~ → removido; seleção de unidade virou passo 1 do wizard "Nova personalização". Sidebar do cliente tem "Minha unidade" (resumo financeiro) + "Minhas personalizações" (a lista) — "Nova personalização" nunca foi item de menu, só o botão na própria página.
- ~~Dois itens de menu no portal do cliente ("Minha unidade" + "Minhas personalizações")~~ → unificados num só, "Minhas personalizações" (`/personalizacoes`; `/minha-unidade` redireciona). A tela virou árvore expansível numa página só: Construtora (logo/iniciais, colapsável, só aparece com mais de uma) → Empreendimento (foto do cadastro ou "imagem indisponível", colapsável, "Baixar plantas") → Unidade (card com resumo financeiro, status agregado, "Ver termo da unidade", "Baixar planta da unidade" e o termo de **não personalização**) → Ambiente (status agregado + termo) → Item (nível + status + termo). Status/termo em todo nível — nunca uma lista plana de solicitações. Termo de não personalização: botão laranja (`--alert-*`) com ícone de alerta, modal com ciência obrigatória (checkbox) antes de assinar; depois de assinado some o "Ver termo da unidade" e aparece o aviso com data/hora + "Revogar termo assinado e iniciar personalização". Chevrons são sempre o mesmo `ChevronDown` do lucide girando -90° quando fechado — um ícone só pra todo nível de expandir/recolher.
- ~~`CatalogoPage` com seletor de construtora local (qualquer construtora logada podia editar o catálogo de qualquer outra)~~ → removido; login de construtora agora carrega identidade real (`construtoraLogadaId`, escolhida num seletor na própria tela de login), e Painel/Catálogo/Marca escopam a ela — nunca mais um seletor cruzado dentro da tela.
- ~~`MarcaPage` salvando num singleton único de marca~~ → marca virou dado por-construtora (`IBrandRepository` chaveado por `construtoraId`) — ver seção 6. O singleton antigo nunca chegava a `effectiveBrand`, então editar marca não tinha efeito visível nenhum; corrigido junto.
- ~~IBM Plex Sans + IBM Plex Mono, marca/`--brand` padrão verde~~ → rebrand "Marca B2B/B2C forte": Archivo Expanded + Archivo + JetBrains Mono, marca padrão `--blue` (`#2f6bd8`/`#4f9bff`), verde vira só função (crédito/aprovado). Símbolo/wordmark novos em `components/BrandMark.tsx`. Tema escuro (`[data-theme="dark"]`) adicionado como opção do produto, alternável via `ThemeContext` — landing/social ficaram fixos em escuro. Não migrado nesse rebrand: `SugestaoInput` (continua datalist nativo, não o dropdown customizado do kit) e os assets PNG de avatar/banner social (ficaram como entrega externa do kit, não geridos pelo app).

## 8. Telas adicionadas (fechamento de gap vs. benchmark de mercado)

Sessão de benchmarking (comparação com Buildertrend/CoConstruct/Nuki/Spotlar/FastBuilt etc.) resultou em cinco fases de trabalho — ver histórico de commits a partir de "Add plantta React prototype; Phase 1 catalog authoring". Novas telas seguem exatamente as convenções acima (nenhum padrão paralelo foi criado):

- `CatalogoPage` (`/catalogo`, construtora) — autoria de ambientes/itens/opções/verbas e biblioteca de materiais reutilizável (`MaterialCatalogItem`). É a tela com maior risco de "SaaS-card-kit genérico" — usa blocos tintados simples (não `.card` aninhado) para linhas de item/opção, só o container de ambiente é `.card`.
- ~~`MinhaUnidadePage` (`/minha-unidade`, cliente)~~ — absorvida pelo card de unidade em `PersonalizacoesPage` (mesmo `resumirUnidade`), ver seção 7.
- `TermoPage` (`/termo/:vinculoId`) — documento de alteração dinâmico, agora fora dos dois shells de portal (acessível por cliente e construtora, guard próprio por `role`), lendo dados reais em vez de conteúdo fixo.
- `AllowanceGroup` (verba compartilhada entre itens de um ambiente) — saldo ao vivo via `domain/calculations.saldoAllowanceGroup`, mostrado como painel adicional ao lado do "Impacto no ledger de crédito" já existente, tanto no wizard quanto em `SelecaoPage`.
- `PrazoBadge` (`components/Badge.tsx`) — status aberto/encerrado do prazo de decisão do item, mesma semântica verde/vermelho de crédito/débito.
- `MateriaisPage`/`CategoriasPage`/`MarcasPage`/`FornecedoresPage` (`/catalogo/materiais|categorias|marcas|fornecedores`) — Catálogo virou sub-menu: Materiais é só identidade de produto (categoria/marca/modelo/SKU, sem preço/lead time — isso é por item, em `Opcao.preco`); Fornecedor é cadastro independente (razão social/CNPJ/contato/endereço), não vinculado ao material ainda.
- `CadastroPage` passo 1 (Empreendimento) expandido pros grupos completos do cadastro real: Identificação, Empresa (travado), Localização, Características (tipo + `TorresManager`), Comercial, Responsáveis, Personalização (só regras em texto — nunca data, ver `JanelaBadge`). Torre virou entidade própria (`Torre`: nome/pavimentos/unidadesPorPavimento) — total de unidades é sempre `totalUnidadesTorres(torres)`, nunca um número digitado à parte (dessincronizava). Categorias de upload do empreendimento (`CategoriaArquivo`) foram de 4 pra 9, nenhuma obrigatória — um cadastro real não trava esperando papelada que ainda não existe.
- `PlantasManager` (`components/CatalogoAuthoring.tsx`) ganhou os grupos completos de Planta (identificação/características/configuração/versão-status/personalização/10 uploads) — mas só pra planta **selecionada**; as demais mostram uma linha-resumo clicável (nome/código/status/área). Regra geral confirmada aqui de novo: quando um card ganha muito campo (essa planta tem ~20), não expandir tudo ao mesmo tempo — progressive disclosure via seleção, não accordion novo por card. Upload de planta usa `UploadPlantaRow`, mais compacto que a caixa tracejada do passo Arquivos do empreendimento (contagem + limpar, não chip por arquivo) — 10 categorias × N plantas na caixa grande viraria parede.
- `UnidadesHeatmap` (`components/CatalogoAuthoring.tsx`, passo "Plantas e unidades" do Cadastro) — grade clicável de unidades geradas ao vivo a partir das Torres (nunca uma lista digitada à mão). Número é sempre `numeroUnidade` (torre+pavimento+posição, ex. `A301`) — nunca editável. Célula colorida por estado (livre/`--paper-2`, com planta/`--amber-bg`, vendida/`--green-bg`) é o padrão de heatmap deste app: cor semântica de estado, texto mono pequeno dentro da célula, nunca ícone. Clique abre um painel de edição abaixo da grade (planta/cliente/valor) — não modal, não editar in-place na célula (célula é grande de mais pra 3 campos, pequena de mais pra caber os 3).
- Pessoa (domínio) segue única (`Pessoa`/`TipoPapel` em `domain/types.ts`, um humano pode acumular papéis), mas a **tela** virou duas, segregadas por cadastro/ações muito diferentes:
  - `FuncionariosPage`/`FuncionarioFormPage` (`/pessoas/funcionarios`) — arquiteto/engenheiro/técnico/designer/projetista/consultor/responsável pela construtora. Papel continua multi-seleção (checkbox), a mesma pessoa acumula papéis (ex.: Arquiteto + Responsável). Card "Registro profissional" (conselho/nº/UF/status) só renderiza quando o papel selecionado é Arquiteto/Engenheiro/Técnico (`PAPEIS_COM_REGISTRO`) — os outros papéis não têm conselho de verdade, então o campo nem aparece, ao invés de aparecer vazio. Upload de documentos (`CategoriaArquivoPessoa`) está temporariamente omitido da UI (pedido explícito) — o tipo/dado continuam existindo, só a seção de anexar sumiu do formulário.
  - `ClientesPage`/`ClienteFormPage` (`/pessoas/clientes`) — cadastro enxuto (nome, CPF, contato), papel fixo `["Cliente"]`, sem registro profissional/empresa/cargo/upload. Ação central é a senha de acesso: cadastrar gera e "envia" (toast, sem backend de e-mail real) a senha; "Reenviar senha" (lista e form) gera uma nova a qualquer momento — mesmo `gerarSenhaAcesso`, reaproveitado pro reset.
  - Sidebar: "Pessoas" virou grupo recolhível como "Cadastros auxiliares" (`ConstrutoraPortalLayout.tsx`), não mais item único.
  - `UploadCompactRow` (movido de `CatalogoAuthoring.tsx`, exportado) continua o padrão pra qualquer tela com muitas categorias de upload — reusar, não recriar caixa tracejada nova.
