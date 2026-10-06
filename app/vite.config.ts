import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import istanbul from 'vite-plugin-istanbul'

interface Brand {
  nome: string
  slug: string
  logo: string | null
  favicon: string | null
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const DEFAULT_TITLE = 'plantta — personalização de obra'
const DEFAULT_DESCRIPTION = 'Motor de personalização em obra — escolhas, crédito gerado e aprovação técnica num só lugar.'
const DEFAULT_IMAGE = '/brand/plantta-icon.png'

/**
 * Link-preview (Open Graph) tags — WhatsApp, iMessage etc. fetch the raw
 * HTML and never run JS, so any brand-aware <title>/logo the app sets
 * client-side is invisible to them. This middleware serves every
 * navigation request (the SPA's own routes, matched by "no file
 * extension in the last segment") with meta tags baked in server-side
 * instead: brand-specific for `/login/marca/:slug`, plantta's own
 * default everywhere else (so sharing the bare app link, `/login/cliente`,
 * etc. all get a preview too). Dev-only (matches how this prototype is
 * shared, via ngrok straight to `vite dev`) — a real deploy needs the
 * equivalent logic in whatever serves production.
 */
function brandOgPreviewPlugin(): Plugin {
  return {
    name: 'brand-og-preview',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (req.method !== 'GET') return next()
        const pathname = url.split('?')[0]
        // Vite's own internal endpoints (@vite/client, @react-refresh, HMR
        // websocket upgrade, etc.) have no file extension either — must be
        // excluded by name, not just by the "has a dot" asset heuristic
        // below, or the browser gets our rewritten HTML as their JS module
        // (MIME type mismatch, blank app).
        if (pathname.startsWith('/@') || pathname.startsWith('/node_modules/')) return next()
        const lastSegment = pathname.split('/').pop() ?? ''
        if (lastSegment.includes('.')) return next() // asset request (.js, .png, .css...)

        const origin = `https://${req.headers.host}`
        const slugMatch = pathname.match(/^\/login\/marca\/([^/?]+)/)

        let title = DEFAULT_TITLE
        let description = DEFAULT_DESCRIPTION
        let absoluteImage: string | undefined = `${origin}${DEFAULT_IMAGE}`

        if (pathname === '/login/cliente') {
          title = 'Acesse seu apartamento — plantta'
          description = 'Entre com os dados enviados pela sua construtora no e-mail de boas-vindas.'
        } else if (pathname === '/login/construtora') {
          title = 'Painel da construtora — plantta'
          description = 'Acesse a fila de aprovação, o cadastro de empreendimentos e a marca do seu portal de cliente.'
        }

        if (slugMatch) {
          const slug = decodeURIComponent(slugMatch[1])
          // Loaded via Vite's own module graph (not a static import) so this
          // config file — type-checked under tsconfig.node.json, a stricter,
          // separate project from the app's tsconfig.app.json — never pulls
          // in app source and its settings.
          const mod = (await server.ssrLoadModule('/src/data/mockData.ts')) as { SEED_BRANDS: Record<string, Brand> }
          const brand = Object.values(mod.SEED_BRANDS).find((b) => b.slug === slug)
          if (brand) {
            // Favicon first: it's square/icon-shaped, crops cleanly into
            // WhatsApp/iMessage's thumbnail. The wordmark logo is wide with
            // transparent background — looks broken squeezed into a square.
            const image = brand.favicon ?? brand.logo
            absoluteImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : undefined
            title = `${brand.nome} — portal do cliente`
            description = `Acesse o portal de personalização do seu apartamento pela ${brand.nome}.`
          }
        }

        const raw = fs.readFileSync(path.resolve(import.meta.dirname, 'index.html'), 'utf-8')
        const transformed = await server.transformIndexHtml(url, raw)

        const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    ${absoluteImage ? `<meta property="og:image" content="${absoluteImage}" />` : ''}
    <meta property="og:url" content="${origin}${url}" />
    <meta name="twitter:card" content="${absoluteImage ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${absoluteImage ? `<meta name="twitter:image" content="${absoluteImage}" />` : ''}
  </head>`

        const html = transformed
          .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
          .replace('</head>', ogTags)

        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serve este repo em /plantta/ (repo de projeto, não
  // de usuário/org) — sem isso os assets gerados apontariam pra raiz do
  // domínio e dariam 404. Só ativa no build do workflow de deploy; dev/
  // preview locais, Codespaces e StackBlitz continuam servindo da raiz.
  base: process.env.GITHUB_PAGES === 'true' ? '/plantta/' : '/',
  plugins: [
    react(),
    brandOgPreviewPlugin(),
    // Instruments src/ for code coverage during `vite dev` — only active
    // when VITE_COVERAGE=true (set by the e2e test scripts), never during
    // normal `npm run dev` or `npm run build`.
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'src/vite-env.d.ts'],
      extension: ['.ts', '.tsx'],
      requireEnv: true,
    }),
  ],
  server: {
    host: true,
    allowedHosts: true,
  },
})
