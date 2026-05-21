import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 將 any 類型警告降級為警告，允許漸進式類型改善
      '@typescript-eslint/no-explicit-any': 'warn',
      // 允許空接口（常用於擴展第三方類型）
      '@typescript-eslint/no-empty-object-type': 'off',
      // 允許導出非組件（工具函數等）
      'react-refresh/only-export-components': 'warn',
      // 允許在 useEffect 中調用 setState（數據加載場景）
      'react-hooks/set-state-in-effect': 'warn',
      // 允許未使用的變量（Chakra UI 組件解構需要保留接口）
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_|className|htmlFor|ref'
      }],
    },
  },
])
