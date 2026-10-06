import { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Miniatura de imagem com fallback — mesmo padrão visual da imagem de
 * empreendimento em "Minhas personalizações" (ver PersonalizacoesPage),
 * generalizado pra qualquer imagem cadastrada (hoje: material do
 * catálogo). `url` null/undefined ou que falha ao carregar cai no ícone
 * "sem imagem" em vez de quebrar o layout.
 */
export function ImageThumb({ url, alt, size = 32 }: { url: string | null | undefined; alt: string; size?: number }) {
  const [falhou, setFalhou] = useState(false);
  if (url && !falhou) {
    return (
      <img
        src={url}
        alt={alt}
        onError={() => setFalhou(true)}
        style={{ width: size, height: size, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      title="Sem imagem"
      role="img"
      aria-label="Sem imagem"
      style={{
        width: size, height: size, borderRadius: 6, flexShrink: 0,
        background: "var(--paper-2)", color: "var(--ink-softer)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <ImageOff size={Math.round(size * 0.45)} strokeWidth={1.8} />
    </span>
  );
}
