import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // target: 'http://localhost:9866',
        target: 'https://homestaybackend.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
    },
  },
})

