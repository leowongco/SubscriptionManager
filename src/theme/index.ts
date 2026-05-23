import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
import { semanticTokensConfig } from "./semantic-tokens"
import {
  cardRecipe,
  inputRecipe,
  statCardRecipe,
  iconBadgeRecipe,
  tableContainerRecipe,
} from "./recipes"

/**
 * Chakra UI v3 Theme System
 *
 * 整合 semantic tokens 和 component recipes，建立完整的 theme system。
 *
 * 使用方式：
 * ```tsx
 * import { system } from "@/theme"
 *
 * <ChakraProvider value={system}>
 *   {children}
 * </ChakraProvider>
 * ```
 *
 * Recipes 使用方式：
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

// 整合 recipes 到 config
const recipesConfig = defineConfig({
  theme: {
    recipes: {
      card: cardRecipe,
      input: inputRecipe,
      iconBadge: iconBadgeRecipe,
    },
    slotRecipes: {
      statCard: statCardRecipe,
      tableContainer: tableContainerRecipe,
    },
  },
})

// 建立完整的 theme system
export const system = createSystem(
  defaultConfig,
  semanticTokensConfig,
  recipesConfig
)

// 匯出 semantic tokens 供直接使用
export { semanticTokensConfig } from "./semantic-tokens"

// 匯出 recipes 供直接使用
export {
  cardRecipe,
  inputRecipe,
  statCardRecipe,
  iconBadgeRecipe,
  tableContainerRecipe,
} from "./recipes"