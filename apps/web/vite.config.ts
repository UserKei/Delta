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
      '@repo/fa-judge': fileURLToPath(
        new URL('../../packages/fa-judge/dist/index.js', import.meta.url),
      ),
      '@repo/shared-types': fileURLToPath(
        new URL('../../packages/shared-types/dist/index.js', import.meta.url),
      ),
    },
  },
})
