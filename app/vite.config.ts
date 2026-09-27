import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import istanbul from 'vite-plugin-istanbul'

// https://vite.dev/config/
export default defineConfig({
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
