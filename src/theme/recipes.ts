import { defineRecipe, defineSlotRecipe } from "@chakra-ui/react"

/**
 * Component Recipes 定義
 * 
 * 根據全系統審查報告，定義統一的 component recipes，
 * 讓所有頁面可以統一使用，減少代碼重複。
 * 
 * Recipes 清單：
 * 1. cardRecipe - 統一卡片樣式
 * 2. inputRecipe - 統一輸入框樣式
 * 3. statCardRecipe - 統計卡片樣式（slot recipe）
 * 4. iconBadgeRecipe - 圖標徽章樣式
 * 5. tableContainerRecipe - 表格容器樣式（slot recipe）
 * 
 * 使用方式：
 * ```tsx
 * // Card Recipe
 * <Box css={cardRecipe({ variant: 'elevated', hoverable: true })}>
 *   {children}
 * </Box>
 * 
 * // Input Recipe
 * <Input css={inputRecipe({ size: 'md', variant: 'outline' })} />
 * 
 * // StatCard Recipe (slot recipe)
 * <Box css={statCardRecipe.root({ colorPalette: 'blue' })}>
 *   <Box css={statCardRecipe.iconWrapper()}>
 *     <Icon />
 *   </Box>
 *   <Text css={statCardRecipe.label()}>Label</Text>
 *   <Text css={statCardRecipe.value()}>Value</Text>
 * </Box>
 * 
 * // IconBadge Recipe
 * <Box css={iconBadgeRecipe({ colorPalette: 'blue', size: 'md' })}>
 *   <Icon />
 * </Box>
 * 
 * // TableContainer Recipe (slot recipe)
 * <Box css={tableContainerRecipe.root()}>
 *   <Box css={tableContainerRecipe.headerBar()} />
 *   <Box css={tableContainerRecipe.content()}>
 *     <Table />
 *   </Box>
 * </Box>
 * ```
 */

// ============================================================================
// 1. Card Recipe（優先級：高）
// ============================================================================

/**
 * Card Recipe
 * 
 * 用於統一所有卡片的基礎樣式。
 * 
 * Variants:
 * - elevated: 帶陰影的卡片（預設）
 * - outlined: 僅邊框的卡片
 * - glass: 玻璃效果卡片
 * 
 * Options:
 * - hoverable: 是否啟用懸停效果
 * - interactive: 是否為可互動卡片（包含 cursor 和 active 狀態）
 */
export const cardRecipe = defineRecipe({
  className: "card",
  base: {
    bg: "bg.panel",
    backdropFilter: "blur(20px)",
    border: "1px solid",
    borderColor: "border.default",
    rounded: "xl",
    shadow: "xl",
    overflow: "hidden",
    transition: "all",
  },
  variants: {
    variant: {
      elevated: {
        shadow: "2xl",
      },
      outlined: {
        shadow: "none",
        borderColor: "border.emphasized",
      },
      glass: {
        bg: "bg.glass",
        backdropFilter: "blur(20px)",
      },
    },
    hoverable: {
      true: {
        _hover: {
          shadow: "2xl",
          transform: "translateY(-2px)",
          borderColor: "border.emphasized",
        },
      },
    },
    interactive: {
      true: {
        cursor: "pointer",
        _hover: {
          shadow: "2xl",
          transform: "translateY(-2px)",
        },
        _active: {
          transform: "translateY(0)",
        },
      },
    },
  },
  defaultVariants: {
    variant: "elevated",
    hoverable: false,
  },
})

// ============================================================================
// 2. Input Recipe（優先級：高）
// ============================================================================

/**
 * Input Recipe
 * 
 * 用於統一所有輸入框的樣式。
 * 
 * Variants:
 * - outline: 透明背景（預設）
 * - filled: 填充背景
 * 
 * Sizes:
 * - sm: 小型輸入框（h: 10）
 * - md: 中型輸入框（h: 12，預設）
 * - lg: 大型輸入框（h: 14）
 */
export const inputRecipe = defineRecipe({
  className: "input",
  base: {
    bg: "bg.input",
    borderColor: "border.default",
    rounded: "xl",
    h: 12,
    transition: "all 0.2s",
    _focus: {
      borderColor: "border.focused",
      ring: "2px",
      ringColor: "border.focused/20",
      ringOffset: "2px",
    },
    _placeholder: {
      color: "fg.subtle",
    },
  },
  variants: {
    size: {
      sm: { h: 10, rounded: "lg" },
      md: { h: 12, rounded: "xl" },
      lg: { h: 14, rounded: "2xl" },
    },
    variant: {
      outline: {
        bg: "transparent",
      },
      filled: {
        bg: "bg.muted",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
})

// ============================================================================
// 3. StatCard Recipe（優先級：中）- Slot Recipe
// ============================================================================

/**
 * StatCard Recipe (Slot Recipe)
 * 
 * 用於 Dashboard 和其他頁面的統計卡片。
 * 包含多個 slots：root, iconWrapper, label, value, description
 * 
 * Slots:
 * - root: 卡片容器
 * - iconWrapper: 圖標容器
 * - label: 標籤文字
 * - value: 數值文字
 * - description: 描述文字
 * 
 * ColorPalettes:
 * - blue: 資訊類統計
 * - green: 成功/正向統計
 * - orange: 警告類統計
 * - red: 錯誤/負向統計
 */
export const statCardRecipe = defineSlotRecipe({
  className: "stat-card",
  slots: ["root", "iconWrapper", "label", "value", "description"],
  base: {
    root: {
      bg: "bg.panel",
      backdropFilter: "blur(20px)",
      border: "1px solid",
      borderColor: "border.default",
      rounded: "xl",
      shadow: "xl",
      p: 5,
      overflow: "hidden",
      position: "relative",
    },
    iconWrapper: {
      p: 2,
      rounded: "xl",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: "sm",
      fontWeight: "medium",
      color: "fg.muted",
    },
    value: {
      fontSize: "2xl",
      fontWeight: "bold",
      color: "fg.default",
    },
    description: {
      fontSize: "xs",
      color: "fg.subtle",
    },
  },
  variants: {
    colorPalette: {
      blue: {
        iconWrapper: { bg: "bg.info.subtle" },
        // iconWrapper 內的 icon 顏色需要在使用時設定 color="fg.info"
      },
      green: {
        iconWrapper: { bg: "bg.success.subtle" },
      },
      orange: {
        iconWrapper: { bg: "bg.warning.subtle" },
      },
      red: {
        iconWrapper: { bg: "bg.error.subtle" },
      },
    },
  },
  defaultVariants: {
    colorPalette: "blue",
  },
})

// ============================================================================
// 4. IconBadge Recipe（優先級：中）
// ============================================================================

/**
 * IconBadge Recipe
 * 
 * 用於圖標徽章，顯示帶有背景色的圖標。
 * 
 * ColorPalettes:
 * - blue: 資訊類徽章
 * - green: 成功類徽章
 * - orange: 警告類徽章
 * - red: 錯誤類徽章
 * 
 * Sizes:
 * - sm: 小型徽章（p: 1.5）
 * - md: 中型徽章（p: 2，預設）
 * - lg: 大型徽章（p: 2.5）
 */
export const iconBadgeRecipe = defineRecipe({
  className: "icon-badge",
  base: {
    p: 2,
    borderRadius: "lg",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  variants: {
    colorPalette: {
      blue: {
        bg: "bg.info.subtle",
        "& > svg": { color: "fg.info" },
      },
      green: {
        bg: "bg.success.subtle",
        "& > svg": { color: "fg.success" },
      },
      orange: {
        bg: "bg.warning.subtle",
        "& > svg": { color: "fg.warning" },
      },
      red: {
        bg: "bg.error.subtle",
        "& > svg": { color: "fg.error" },
      },
    },
    size: {
      sm: { p: 1.5 },
      md: { p: 2 },
      lg: { p: 2.5 },
    },
  },
  defaultVariants: {
    colorPalette: "blue",
    size: "md",
  },
})

// ============================================================================
// 5. TableContainer Recipe（優先級：低）- Slot Recipe
// ============================================================================

/**
 * TableContainer Recipe (Slot Recipe)
 * 
 * 用於統一表格容器樣式。
 * 包含多個 slots：root, headerBar, content
 * 
 * Slots:
 * - root: 表格容器
 * - headerBar: 頂部裝飾條
 * - content: 表格內容區域
 */
export const tableContainerRecipe = defineSlotRecipe({
  className: "table-container",
  slots: ["root", "headerBar", "content"],
  base: {
    root: {
      rounded: "3xl",
      border: "1px solid",
      borderColor: "border.default",
      bg: "bg.panel",
      backdropFilter: "blur(20px)",
      overflow: "hidden",
      shadow: "2xl",
    },
    headerBar: {
      h: 1.5,
      w: "full",
      bg: "bg.info.subtle",
    },
    content: {
      overflow: "auto",
    },
  },
})