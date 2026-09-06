import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { pwaOptions } from './pwa.config.js'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(`v${pkg.version}`),
  },
  plugins: [react(), tailwindcss(), VitePWA(pwaOptions)],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('date-fns')) return 'dates'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    setupFiles: ['./src/test/setup.js'],
  },
})
