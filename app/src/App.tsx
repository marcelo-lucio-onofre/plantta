import { Navigate, Route, Routes } from "react-router-dom";
import { ClientPortalLayout } from "./components/ClientPortalLayout";
import { ConstrutoraPortalLayout } from "./components/ConstrutoraPortalLayout";
import { RouteTransitionOverlay } from "./components/RouteTransitionOverlay";
import { AprovacaoPage } from "./pages/AprovacaoPage";
import { CadastroPage } from "./pages/CadastroPage";
import { CalculadoraPage } from "./pages/CalculadoraPage";
import { CarrinhoPage } from "./pages/CarrinhoPage";
import { AmbientesPage } from "./pages/AmbientesPage";
import { CategoriasPage } from "./pages/CategoriasPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DescadastroPage } from "./pages/DescadastroPage";
import { EmpreendimentosPage } from "./pages/EmpreendimentosPage";
import { FornecedoresPage } from "./pages/FornecedoresPage";
import { FornecedorFormPage } from "./pages/FornecedorFormPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginClientePage } from "./pages/LoginClientePage";
import { LoginConstrutoraPage } from "./pages/LoginConstrutoraPage";
import { MarcaPage } from "./pages/MarcaPage";
import { ContatosConstrutoraPage } from "./pages/ContatosConstrutoraPage";
import { MarcasPage } from "./pages/MarcasPage";
import { MateriaisPage } from "./pages/MateriaisPage";
import { FuncionariosPage } from "./pages/FuncionariosPage";
import { FuncionarioFormPage } from "./pages/FuncionarioFormPage";
import { ClientesPage } from "./pages/ClientesPage";
import { ClienteFormPage } from "./pages/ClienteFormPage";
import { NovaPersonalizacaoPage } from "./pages/NovaPersonalizacaoPage";
import { PainelPage } from "./pages/PainelPage";
import { PersonalizacaoDetalhePage } from "./pages/PersonalizacaoDetalhePage";
import { PersonalizacoesPage } from "./pages/PersonalizacoesPage";
import { PortalPage } from "./pages/PortalPage";
import { SelecaoPage } from "./pages/SelecaoPage";
import { SimpleLoginClientePage } from "./pages/SimpleLoginClientePage";
import { TermoPage } from "./pages/TermoPage";
import { UnidadesVendasPage } from "./pages/UnidadesVendasPage";

export default function App() {
  return (
    <>
      <RouteTransitionOverlay />
      <Routes>
      {/* Public — no app nav here on purpose: marketing/login pages don't
          expose internal product navigation. */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/cliente" element={<SimpleLoginClientePage />} />
      <Route path="/login/marca/:slug" element={<LoginClientePage />} />
      <Route path="/login/construtora" element={<LoginConstrutoraPage />} />
      <Route path="/descadastro" element={<DescadastroPage />} />
      {/* Reachable from both portals (cliente's "Minhas personalizações" and
          construtora's Aprovação) — lives outside either layout, with its
          own role check, since it's a standalone document, not nav-bound
          to one portal. */}
      <Route path="/termo/:vinculoId" element={<TermoPage />} />

      {/* Client portal — brand-themed (plantta or construtora, see
          ClientPortalLayout / effectiveBrand). "Minhas personalizações" is
          the landing page and the only sidebar destination — it unified the
          old "Minha unidade" screen into its Construtora → Empreendimento →
          Unidade → Ambiente → Item tree, so /minha-unidade just redirects
          there. The unit picker for a new request lives inside the wizard
          (step 1), not as its own menu item. Portal/Carrinho/Calculadora/Seleção stay reachable (mainly
          from "Editar escolha" on a personalização's detail) but aren't
          advertised in the sidebar anymore. */}
      <Route element={<ClientPortalLayout />}>
        <Route path="/minha-unidade" element={<Navigate to="/personalizacoes" replace />} />
        <Route path="/personalizacoes" element={<PersonalizacoesPage />} />
        <Route path="/personalizacoes/nova" element={<NovaPersonalizacaoPage />} />
        <Route path="/personalizacoes/:id" element={<PersonalizacaoDetalhePage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/selecao/:itemId" element={<SelecaoPage />} />
        <Route path="/carrinho" element={<CarrinhoPage />} />
        <Route path="/calculadora" element={<CalculadoraPage />} />
      </Route>

      {/* Construtora back-office — always plantta-branded. */}
      <Route element={<ConstrutoraPortalLayout />}>
        <Route path="/catalogo/materiais" element={<MateriaisPage />} />
        <Route path="/catalogo/categorias" element={<CategoriasPage />} />
        <Route path="/catalogo/ambientes" element={<AmbientesPage />} />
        <Route path="/catalogo/marcas" element={<MarcasPage />} />
        <Route path="/catalogo/fornecedores" element={<FornecedoresPage />} />
        <Route path="/catalogo/fornecedores/novo" element={<FornecedorFormPage />} />
        <Route path="/catalogo/fornecedores/:id" element={<FornecedorFormPage />} />
        <Route path="/cadastro" element={<EmpreendimentosPage />} />
        <Route path="/cadastro/novo" element={<CadastroPage />} />
        <Route path="/cadastro/:id" element={<CadastroPage />} />
        <Route path="/cadastro/:id/vendas" element={<UnidadesVendasPage />} />
        {/* Mesmo componente do portal do cliente (NovaPersonalizacaoPage) —
            construtora inicia em nome de cliente que não sabe usar o app,
            via ?vinculoId=, vindo da unidade vendida (Vendas) ou do modal
            "Criar personalização" na listagem de empreendimentos. */}
        <Route path="/personalizar" element={<NovaPersonalizacaoPage />} />
        <Route path="/pessoas" element={<Navigate to="/pessoas/funcionarios" replace />} />
        <Route path="/pessoas/funcionarios" element={<FuncionariosPage />} />
        <Route path="/pessoas/funcionarios/novo" element={<FuncionarioFormPage />} />
        <Route path="/pessoas/funcionarios/:id" element={<FuncionarioFormPage />} />
        <Route path="/pessoas/clientes" element={<ClientesPage />} />
        <Route path="/pessoas/clientes/novo" element={<ClienteFormPage />} />
        <Route path="/pessoas/clientes/:id" element={<ClienteFormPage />} />
        <Route path="/marca" element={<MarcaPage />} />
        <Route path="/contatos" element={<ContatosConstrutoraPage />} />
        <Route path="/painel" element={<PainelPage />} />
        <Route path="/aprovacao/:id" element={<AprovacaoPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
