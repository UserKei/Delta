import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@repo/fa-service': fileURLToPath(
        new URL('../../packages/fa-service/dist/index.js', import.meta.url),
      ),
      '@repo/ll1-service': fileURLToPath(
        new URL('../../packages/ll1-service/dist/index.js', import.meta.url),
      ),
      '@repo/lr-service': fileURLToPath(
        new URL('../../packages/lr-service/dist/index.js', import.meta.url),
      ),
      '@repo/shared-types': fileURLToPath(
        new URL('../../packages/shared-types/dist/index.js', import.meta.url),
      ),
    },
  },
})
