import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // 本機開發時把 /api 轉給另外用 `cd server && npm run dev` 跑起來的後端
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
