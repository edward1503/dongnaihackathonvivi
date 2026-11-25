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
      '^/(prototype/|vendor/|screens/|assets/fonts/|ds\\.css$|icons\\.js$|motion\\.(css|js)$)': api,
      // The comic reader uses the original illustrations by their public names.
      '^/assets/[\\w-]+\\.png$': {
        target: api,
        bypass: (req) => '/@fs' + designRoot + req.url.slice(1),
      },
      '/ws': { target: api.replace(/^http/, 'ws'), ws: true },
    },
  },
})
