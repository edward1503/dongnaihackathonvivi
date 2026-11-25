import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Thư mục la-chan-so/: app dùng chung ds.css, icons.js, phông chữ với bản thiết kế
const designRoot = fileURLToPath(new URL('..', import.meta.url))
const api = process.env.LCS_API || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  // Đường dẫn tương đối để chạy được cả khi đóng gói vào ứng dụng Android (file://)
  base: './',
  server: {
    host: true,
    port: 5173,
    fs: { allow: [designRoot] },
    proxy: {
      '/api': api,
      '/ws': { target: api.replace(/^http/, 'ws'), ws: true },
    },
  },
})
