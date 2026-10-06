import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "plantta:theme";

function loadTheme(): Theme {
  try {
    return sessionStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Product theme (light/dark) — separate from AppContext on purpose: it's
 * pure UI preference, not business state, and only the authenticated
 * portal shell (SidebarShell) actually reads it (see design.md §3). The
 * product stays light/paper by default; dark is an option, never forced —
 * only the marca (landing, social) lives in dark permanently.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    try {
      sessionStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage unavailable — theme just won't survive a refresh.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
