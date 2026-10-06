import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useTheme } from "../state/ThemeContext";

export interface SidebarSection {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  content: ReactNode;
}

interface SidebarShellProps {
  brandName: string;
  brandColor: string;
  brandLogo?: string | null;
  brandTag: string;
  /** Level 2 (section label) + level 3 (section content, usually nav links). */
  sections: SidebarSection[];
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  children: ReactNode;
}

/**
 * The one consolidated template for every authenticated area (client
 * portal, construtora back-office) — modeled on the sidebar pattern used
 * across the team's other products (reservas-hub, omnix): real icons,
 * subtle tinted-background + left-border active state (not a solid fill),
 * uppercase small-caps group labels, and a footer identity card separate
 * from the brand header. Both portal layouts build on this instead of
 * keeping their own nav markup.
 */
export function SidebarShell({
  brandName,
  brandColor,
  brandLogo,
  brandTag,
  sections,
  userName,
  userRole,
  onLogout,
  children,
}: SidebarShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const isPlanttaBrand = brandName === "plantta";
  const brandInitial = brandName.trim()[0]?.toUpperCase() ?? "P";
  const userInitials = (userName ?? "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        {brandLogo ? (
          <img src={brandLogo} alt={brandName} className="sidebar-brand-logo" />
        ) : isPlanttaBrand ? (
          <BrandMark size={26} />
        ) : (
          <span className="sidebar-brand-mark" style={{ background: brandColor }}>
            {brandInitial}
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          {!brandLogo && !isPlanttaBrand && <div className="sidebar-brand-name">{brandName}</div>}
          <div className="sidebar-brand-tag" style={brandLogo || isPlanttaBrand ? { marginTop: 6 } : undefined}>{brandTag}</div>
        </div>
      </div>

      <div className="sidebar-scroll">
        {sections.map((section) => (
          <div key={section.label} className="sidebar-section">
            <div className="sidebar-section-label">
              {section.icon && <section.icon className="sidebar-section-icon" />}
              {section.label}
            </div>
            {section.content}
          </div>
        ))}
      </div>

      {userName && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar">{userInitials}</span>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{userName}</div>
              {userRole && <div className="sidebar-user-role">{userRole}</div>}
            </div>
          </div>
          <button type="button" className="sidebar-logout" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="sidebar-nav-icon" /> : <Moon className="sidebar-nav-icon" />} Tema {theme === "dark" ? "claro" : "escuro"}
          </button>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <LogOut className="sidebar-nav-icon" /> Sair
          </button>
        </div>
      )}
      {!userName && (
        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="sidebar-nav-icon" /> : <Moon className="sidebar-nav-icon" />} Tema {theme === "dark" ? "claro" : "escuro"}
          </button>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <LogOut className="sidebar-nav-icon" /> Sair
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="portal-shell" data-theme={theme} style={{ ["--brand" as string]: brandColor }}>
      <header className="portal-topbar">
        <div className="row gap-sm" style={{ alignItems: "center" }}>
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="portal-topbar-logo" />
          ) : isPlanttaBrand ? (
            <BrandMark size={24} />
          ) : (
            <>
              <span className="portal-topbar-mark" style={{ background: brandColor }}>
                {brandInitial}
              </span>
              <span className="portal-topbar-name">{brandName}</span>
            </>
          )}
        </div>
        <button type="button" className="nav-toggle" aria-label="Abrir menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
          <Menu className="sidebar-nav-icon" />
        </button>
      </header>

      <div className="portal-body">
        <aside className="portal-sidebar">{sidebarContent}</aside>

        {drawerOpen && (
          <>
            <button type="button" className="nav-drawer-backdrop" aria-label="Fechar menu" onClick={() => setDrawerOpen(false)} />
            <aside className="portal-sidebar portal-sidebar--drawer">
              <button type="button" className="nav-drawer-close" aria-label="Fechar" onClick={() => setDrawerOpen(false)}>
                <X className="sidebar-nav-icon" />
              </button>
              {sidebarContent}
            </aside>
          </>
        )}

        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}
