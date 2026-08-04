import { defineConfig } from "@chakra-ui/react"

/**
 * Design tokens：字體與強調色（accent）
 *
 * 依 ui-ux-pro-max 的 Data-Dense Dashboard 設計系統：
 * - 介面文字用 Fira Sans（清楚、專業、適合資料密集介面）
 * - 金額／數字用 Fira Code（等寬，避免小數點對不齊，強化「這是精確數據」的感覺）
 * - 新增 accent（琥珀色）色階，跟既有的 blue 系統區分：
 *   blue = 資訊／中性操作，accent = 需要使用者特別留意的主要行動（例如「新增」「批次加值」）
 */
const tokensConfig = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif" },
        body: { value: "'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif" },
        mono: { value: "'Fira Code', ui-monospace, SFMono-Regular, monospace" },
      },
      colors: {
        accent: {
          50: { value: "#FFFBEB" },
          100: { value: "#FEF3C7" },
          200: { value: "#FDE68A" },
          300: { value: "#FCD34D" },
          400: { value: "#FBBF24" },
          500: { value: "#F59E0B" },
          600: { value: "#D97706" },
          700: { value: "#B45309" },
          800: { value: "#92400E" },
          900: { value: "#78350F" },
          950: { value: "#451A03" },
        },
      },
    },
    semanticTokens: {
      colors: {
        accent: {
          solid: { value: "{colors.accent.600}" },
          contrast: { value: "{colors.white}" },
          fg: { value: { _light: "{colors.accent.700}", _dark: "{colors.accent.300}" } },
          muted: { value: { _light: "{colors.accent.100}", _dark: "{colors.accent.900}" } },
          subtle: { value: { _light: "{colors.accent.50}", _dark: "{colors.accent.950}" } },
          emphasized: { value: { _light: "{colors.accent.200}", _dark: "{colors.accent.800}" } },
          focusRing: { value: "{colors.accent.600}" },
        },
      },
    },
    recipes: {
      // 金額／數字專用文字樣式：等寬字 + tabular-nums，避免同一欄位小數點忽左忽右
      figure: {
        className: "figure",
        base: {
          fontFamily: "mono",
          fontVariantNumeric: "tabular-nums",
          fontWeight: "semibold",
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      fontFamily: "body",
    },
    // 讓可點擊元素統一有游標提示，避免忘記個別加 cursor="pointer"
    "button:not(:disabled), [role='button']:not([aria-disabled='true'])": {
      cursor: "pointer",
    },
  },
})

export { tokensConfig }
