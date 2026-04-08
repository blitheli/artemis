import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 使用相对路径，避免部署在子目录（如 GitHub Pages /project/）时 JS/CSS 404 导致白屏
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api/horizons': {
        target: 'https://ssd.jpl.nasa.gov',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/horizons/, '/api/horizons.api'),
      },
    },
  },
  preview: {
    proxy: {
      '/api/horizons': {
        target: 'https://ssd.jpl.nasa.gov',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/horizons/, '/api/horizons.api'),
      },
    },
  },
})
