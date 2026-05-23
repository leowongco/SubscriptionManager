import { defineConfig } from "@chakra-ui/react"

/**
 * Semantic Tokens 定義
 * 
 * 根據全系統審查報告，定義統一的 semantic tokens，
 * 讓所有頁面可以統一使用，支援 light/dark mode 自動切換。
 * 
 * 使用方式：
 * - bg.panel → 卡片/面板背景
 * - bg.subtle → 次要背景
 * - bg.glass → 玻璃效果背景
 * - bg.input → 輸入框背景
 * - bg.info.subtle → 資訊背景
 * - bg.success.subtle → 成功背景
 * - bg.warning.subtle → 警告背景
 * - bg.error.subtle → 錯誤背景
 * - fg.default → 預設文字顏色
 * - fg.muted → 次要文字顏色
 * - fg.subtle → 提示文字顏色
 * - fg.info → 資訊文字顏色
 * - fg.success → 成功文字顏色
 * - fg.warning → 警告文字顏色
 * - fg.error → 錯誤文字顏色
 * - border.default → 預設邊框
 * - border.focused → 焦點邊框
 * 
 * Light/Dark Mode 自動切換：
 * - 使用 _light 和 _dark 屬性定義不同模式的值
 * - 使用 {colors.xxx} 引用基礎 palette 顏色
 */

const semanticTokensConfig = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        // === Background Tokens ===
        bg: {
          // 卡片/面板背景 - 主要容器背景
          panel: {
            value: {
              _light: "{colors.white}",
              _dark: "{colors.gray.900}",
            },
          },
          // 次要背景 - 用於次要區域或嵌套容器
          subtle: {
            value: {
              _light: "{colors.gray.50}",
              _dark: "{colors.gray.800}",
            },
          },
          // 靜音背景 - 用於不活躍或禁用狀態
          muted: {
            value: {
              _light: "{colors.gray.100}",
              _dark: "{colors.gray.700}",
            },
          },
          // 強調背景 - 用於突出顯示區域
          emphasized: {
            value: {
              _light: "{colors.gray.200}",
              _dark: "{colors.gray.600}",
            },
          },
          // 懸停背景 - 用於互動元素懸停狀態
          hover: {
            value: {
              _light: "{colors.gray.100}",
              _dark: "{colors.gray.700}",
            },
          },
          // 玻璃效果背景 - 用於 glass morphism 效果
          glass: {
            value: {
              _light: "{colors.white}",
              _dark: "{colors.gray.900}",
            },
          },
          // 輸入框背景 - 用於表單輸入框
          input: {
            value: {
              _light: "{colors.white}",
              _dark: "{colors.gray.800}",
            },
          },
          // 資訊背景 - 用於資訊提示
          info: {
            subtle: {
              value: {
                _light: "{colors.blue.100}",
                _dark: "{colors.blue.900}",
              },
            },
          },
          // 成功背景 - 用於成功提示
          success: {
            subtle: {
              value: {
                _light: "{colors.green.100}",
                _dark: "{colors.green.900}",
              },
            },
          },
          // 警告背景 - 用於警告提示
          warning: {
            subtle: {
              value: {
                _light: "{colors.orange.100}",
                _dark: "{colors.orange.900}",
              },
            },
          },
          // 錯誤背景 - 用於錯誤提示
          error: {
            subtle: {
              value: {
                _light: "{colors.red.100}",
                _dark: "{colors.red.900}",
              },
            },
          },
        },

        // === Foreground Tokens ===
        fg: {
          // 預設文字顏色 - 主要文字
          default: {
            value: {
              _light: "{colors.gray.900}",
              _dark: "{colors.white}",
            },
          },
          // 次要文字顏色 - 描述、說明文字
          muted: {
            value: {
              _light: "{colors.gray.600}",
              _dark: "{colors.gray.300}",
            },
          },
          // 提示文字顏色 - 輕微提示、placeholder
          subtle: {
            value: {
              _light: "{colors.gray.500}",
              _dark: "{colors.gray.500}",
            },
          },
          // 強調文字顏色 - 重要標題、突出文字
          emphasized: {
            value: {
              _light: "{colors.gray.900}",
              _dark: "{colors.white}",
            },
          },
          // 資訊狀態顏色 - 資訊訊息
          info: {
            value: {
              _light: "{colors.blue.600}",
              _dark: "{colors.blue.400}",
            },
          },
          // 成功狀態顏色 - 成功訊息、正向狀態
          success: {
            value: {
              _light: "{colors.green.600}",
              _dark: "{colors.green.400}",
            },
          },
          // 警告狀態顏色 - 警告訊息、注意狀態
          warning: {
            value: {
              _light: "{colors.orange.600}",
              _dark: "{colors.orange.400}",
            },
          },
          // 錯誤狀態顏色 - 錯誤訊息、危險狀態
          error: {
            value: {
              _light: "{colors.red.600}",
              _dark: "{colors.red.400}",
            },
          },
        },

        // === Border Tokens ===
        border: {
          // 預設邊框 - 主要邊框
          default: {
            value: {
              _light: "{colors.gray.200}",
              _dark: "{colors.gray.700}",
            },
          },
          // 次要邊框 - 輕微分隔線
          muted: {
            value: {
              _light: "{colors.gray.100}",
              _dark: "{colors.gray.800}",
            },
          },
          // 強調邊框 - 突出邊框、分隔線
          emphasized: {
            value: {
              _light: "{colors.gray.300}",
              _dark: "{colors.gray.600}",
            },
          },
          // 焦點邊框 - 用於 focus 狀態
          focused: {
            value: {
              _light: "{colors.blue.500}",
              _dark: "{colors.blue.400}",
            },
          },
        },

        // === Focus Tokens ===
        focus: {
          // 焦點環 - 用於 focus 狀態的環顏色
          ring: {
            value: {
              _light: "{colors.blue.500}",
              _dark: "{colors.blue.400}",
            },
          },
        },
      },
    },
  },
})

export { semanticTokensConfig }