import { defineConfig } from 'vitest/config';
import path from 'path';

// 只測前端 src/，server/ 是獨立的 Node 專案（有自己的 package.json/測試指令），
// 不然 vitest 預設會遞迴掃進 server/src 底下的測試檔，但那邊的模組不在這個
// 專案的 node_modules 裡，會直接失敗。
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
