import type { CSSProperties } from "react";

interface BrandMarkProps {
  size?: number;
  withLabel?: boolean;
  /** Text sits on a dark background (white) vs a light one (`--ink`). The
   * "tt" stays blue regardless — see the wordmark rule below. */
  light?: boolean;
}

/**
 * The plantta symbol (navy badge, gray "TT" posts) + wordmark. Wordmark
 * rule — REGRA FIXA (design.md §3): whenever "plantta" appears as a brand
 * mark, the two "tt" are always `--plantta-tt` (the icon's gray, not
 * `--blue`); "plan"/"a" inherit the surrounding text color. Never override
 * the "tt" color.
 */
export function BrandMark({ size = 22, withLabel = true, light = true }: BrandMarkProps) {
  return (
    <span className="brandmark-lockup" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <img src="/brand/plantta-icon.png" alt="" width={size} height={size} style={{ flexShrink: 0, objectFit: "contain" }} />
      {withLabel && <Wordmark style={{ color: light ? "#fff" : "var(--ink)" }} />}
    </span>
  );
}

/** `plan` + `tt` (always `--plantta-tt`) + `a` — use anywhere "plantta" is
 * set as a brand wordmark instead of typing the word out. */
export function Wordmark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={className} style={{ fontFamily: "'Archivo Expanded','Archivo',sans-serif", fontWeight: 800, letterSpacing: "-0.01em", ...style }}>
      plan<span style={{ color: "var(--plantta-tt)" }}>tt</span>a
    </span>
  );
}
