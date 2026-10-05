import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import istanbul from 'vite-plugin-istanbul'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serve este repo em /temp-personalize/ (repo de projeto, não
  // de usuário/org) — sem isso os assets gerados apontariam pra raiz do
  // domínio e dariam 404. Só ativa no build do workflow de deploy; dev/
  // preview locais, Codespaces e StackBlitz continuam servindo da raiz.
  base: process.env.GITHUB_PAGES === 'true' ? '/temp-personalize/' : '/',
  plugins: [
    react(),
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
