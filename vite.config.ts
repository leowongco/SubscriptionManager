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
  build: {
    rollupOptions: {
      output: {
        // 所有 node_modules（React、Chakra UI 等）強制打進同一個 vendor chunk。
        // 不這樣做的話，Rollup 有時會把同一個套件拆進兩個不同的 async chunk，
        // 導致 React 被載入兩份實例，跨 chunk 呼叫 hook 時炸出
        // "Invalid hook call" (React error #321)。
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
