import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',     // expone fuera del contenedor
    port: 5173,
    watch: {
      usePolling: true,  // hot-reload en Docker
    },
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
      }
    }
  }
})