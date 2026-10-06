import { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import { BarChart3, Building2, ChevronDown, Contact, Package, Palette, Settings2, LayoutDashboard, Users } from "lucide-react";
import { SidebarShell } from "./SidebarShell";
import { planttaBrand } from "../data/mockData";
import { useApp } from "../state/AppContext";

interface NavItem {
  /** Sem `to` = grupo recolhível (ex. "Cadastros auxiliares" — só organiza
   * os filhos, cada um é cadastro próprio; não navega por si). */
  to?: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children?: { to: string; label: string }[];
}

const operacao: NavItem[] = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
];
const configuracao: NavItem[] = [
  { to: "/cadastro", label: "Empreendimentos", icon: Building2 },
  {
    label: "Cadastros auxiliares",
    icon: Package,
    children: [
      { to: "/catalogo/materiais", label: "Materiais" },
      { to: "/catalogo/categorias", label: "Categorias" },
      { to: "/catalogo/marcas", label: "Marcas" },
      { to: "/catalogo/ambientes", label: "Ambientes" },
      { to: "/catalogo/fornecedores", label: "Fornecedores" },
    ],
  },
  {
    label: "Pessoas",
    icon: Users,
    children: [
      { to: "/pessoas/funcionarios", label: "Funcionários" },
      { to: "/pessoas/clientes", label: "Clientes" },
    ],
  },
  { to: "/contatos", label: "Contatos", icon: Contact },
  { to: "/marca", label: "Marca", icon: Palette },
];

function NavGroupItem({ item }: { item: NavItem }) {
  const location = useLocation();
  const hasActiveChild = item.children?.some((child) => location.pathname.startsWith(child.to)) ?? false;
  const [open, setOpen] = useState(true);

  if (!item.children) {
    return (
      <NavLink to={item.to!} end className={({ isActive }) => "sidebar-nav-btn" + (isActive ? " active" : "")}>
        <item.icon className="sidebar-nav-icon" /> {item.label}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={"sidebar-nav-btn sidebar-nav-btn--group" + (hasActiveChild ? " active" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <item.icon className="sidebar-nav-icon" /> {item.label}
        <ChevronDown className={"sidebar-nav-chevron" + (open ? " sidebar-nav-chevron--open" : "")} />
      </button>
      <div className="sidebar-nav-children" style={{ maxHeight: open ? `${item.children.length * 36}px` : "0px" }}>
        {item.children.map((child) => (
          <NavLink key={child.to} to={child.to} className={({ isActive }) => "sidebar-nav-btn sidebar-nav-btn--sub" + (isActive ? " active" : "")}>
            {child.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function NavGroup({ items }: { items: NavItem[] }) {
  return (
    <nav className="stack" style={{ gap: 2 }}>
      {items.map((item) => (
        <NavGroupItem key={item.label} item={item} />
      ))}
    </nav>
  );
}

/**
 * Construtora back-office shell, built on the shared SidebarShell template
 * — same consolidated sidebar as the client portal, always plantta-branded
 * (only the client portal can go white-label). "Aprovação" and "Termo"
 * aren't static nav items on purpose: they're reached in context —
 * Aprovação from a row in Painel, Termo from an approved solicitação —
 * not as standalone legacy shortcuts.
 */
export function ConstrutoraPortalLayout() {
  const { role, vinculos, construtoraLogadaId, logout } = useApp();

  if (role !== "construtora") return <Navigate to="/login/construtora" replace />;

  const construtoraNome = vinculos.find((v) => v.construtoraId === construtoraLogadaId)?.construtoraNome ?? "Construtora";

  return (
    <SidebarShell
      brandName={planttaBrand.nome}
      brandColor={planttaBrand.color}
      brandLogo={planttaBrand.logo}
      brandTag={construtoraNome}
      sections={[
        { label: "Operação", icon: LayoutDashboard, content: <NavGroup items={operacao} /> },
        { label: "Configuração", icon: Settings2, content: <NavGroup items={configuracao} /> },
      ]}
      onLogout={logout}
    >
      <Outlet />
    </SidebarShell>
  );
}
