import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { localApiPlugin } from './vite-plugin-local-api.js'

export default defineConfig({
  plugins: [react(), localApiPlugin(), viteSingleFile()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 100,
      ignored: ['**/Desain tanpa judul (18).webp'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
