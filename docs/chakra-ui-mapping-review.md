# Chakra UI v3 Styling & Theming 審查報告 - Mapping 頁面

**審查日期**: 2026-05-23  
**文件路徑**: `src/pages/Mapping.tsx`  
**審查範圍**: Token 使用、Semantic Tokens、Color Mode 支援、Spacing 一致性、Design System 合規

---

## 執行摘要

Mapping 頁面存在嚴重的 Chakra UI v3 合規問題，主要集中在使用 v2 的 `useColorModeValue` 模式、硬編碼顏色值、以及直接引用 CSS 變數。這些問題會導致 dark mode 支援不完整，並違反 Chakra v3 的設計系統原則。

**問題統計**:
- **Critical**: 5 個問題（必須修復）
- **Improvements**: 4 個建議（應該改進）
- **Optional**: 3 個優化（可選）

---

## Critical 問題（必須修復）

### 1. 使用 v2 的 `useColorModeValue` 模式

**位置**: Line 43, 92-106

**問題描述**:  
使用了 Chakra UI v2 的 `useColorModeValue` hook，這在 v3 中已被 semantic tokens 取代。v3 的語義化 token 系統會自動根據 color mode 切換顏色，無需手動處理。

**當前代碼**:
```tsx
import { useColorModeValue } from '@/components/ui/color-mode';

// Line 92-106
const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
const headerTitleColor = useColorModeValue('gray.900', 'white');
const headerTextColor = useColorModeValue('gray.600', 'gray.300');
const mutedTextColor = useColorModeValue('gray.500', 'gray.500');

const cardBg = useColorModeValue('white', 'gray.900/40');
const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
const textColor = useColorModeValue('gray.900', 'white');
const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

const inputBg = useColorModeValue('gray.50', 'gray.800');
const inputBorderColor = useColorModeValue('gray.300', 'gray.600');
const labelColor = useColorModeValue('gray.700', 'gray.300');
const inputFocusBorderColor = useColorModeValue('blue.400', 'blue.300');
```

**修復建議**:
```tsx
// 移除 useColorModeValue import
// 直接使用 semantic tokens

// 在組件中使用 semantic tokens
<Box bg="bg.panel" borderColor="border.emphasized">
  <Text color="fg.default">...</Text>
  <Text color="fg.muted">...</Text>
</Box>
```

**影響範圍**: 整個頁面的顏色系統

---

### 2. 硬編碼 RGBA 顏色值

**位置**: Line 363

**問題描述**:  
使用硬編碼的 rgba 顏色值，這些值不會隨 color mode 變化，導致 dark mode 下可能出現對比度問題。

**當前代碼**:
```tsx
<Box
    position="absolute"
    inset={0}
    bg="linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), rgba(20, 184, 166, 0.05))"
    opacity={0}
    _groupHover={{ opacity: 1 }}
    transition="opacity"
    pointerEvents="none"
/>
```

**修復建議**:
```tsx
// 使用 Chakra 的 gradient API 和 semantic tokens
<Box
    position="absolute"
    inset={0}
    bgGradient="to-br"
    gradientFrom="accent.emerald/5"
    gradientTo="accent.teal/5"
    opacity={0}
    _groupHover={{ opacity: 1 }}
    transition="opacity"
    pointerEvents="none"
/>
```

**或者使用 CSS 變數**:
```tsx
// 在 theme 中定義
const theme = {
  semanticTokens: {
    colors: {
      gradient: {
        hover: {
          start: { value: 'rgba(16, 185, 129, 0.05)' },
          end: { value: 'rgba(20, 184, 166, 0.05)' }
        }
      }
    }
  }
}

// 在組件中使用
<Box bg="linear-gradient(to bottom right, var(--colors-gradient-hover-start), var(--colors-gradient-hover-end))" />
```

---

### 3. 直接引用 CSS 變數

**位置**: Line 371

**問題描述**:  
直接使用 `var(--chakra-colors-...)` CSS 變數，這不是 Chakra v3 的推薦做法。應該使用 Chakra 的 style props 或 semantic tokens。

**當前代碼**:
```tsx
<Box h={1} w="full" bg="linear-gradient(to right, var(--chakra-colors-emerald-500), var(--chakra-colors-teal-500))" />
```

**修復建議**:
```tsx
// 使用 Chakra 的 gradient API
<Box 
    h={1} 
    w="full" 
    bgGradient="to-r" 
    gradientFrom="emerald.500" 
    gradientTo="teal.500" 
/>
```

---

### 4. 動態顏色拼接（模板字符串）

**位置**: Line 283, 306, 688, 710

**問題描述**:  
使用模板字符串動態拼接顏色值，這違反了 Chakra 的 token 系統原則，且可能導致類型安全問題。

**當前代碼**:
```tsx
// Line 283
_focus={{
    borderColor: inputFocusBorderColor,
    boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`,
}}

// Line 306
_focus={{
    borderColor: inputFocusBorderColor,
    boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`,
}}

// Line 688, 710 - 類似模式
```

**修復建議**:
```tsx
// 方案 1: 使用 Chakra 的 ring style prop
<Input
    _focus={{
        borderColor: "border.focused",
        ring: "2px",
        ringColor: "blue.400/20",
        ringOffset: "2px"
    }}
/>

// 方案 2: 使用 theme 中的 focus ring token
<Input
    _focus={{
        borderColor: "border.focused",
        boxShadow: "focusRing"  // 在 theme 中定義
    }}
/>
```

**Theme 配置**:
```tsx
// 在 theme 中定義 focus ring shadow
const theme = {
  tokens: {
    shadows: {
      focusRing: {
        value: '0 0 0 3px var(--colors-blue-400-alpha-20)'
      }
    }
  }
}
```

---

### 5. 混合使用硬編碼顏色與 Palette 顏色

**位置**: Line 346, 379, 380, 541, 542, 564, 565, 581, 582, 621, 757, 819

**問題描述**:  
大量使用 `gray.900/40`、`gray.950/40` 等帶透明度的 palette 顏色，這些不會自動適應 dark mode，且透明度語法 `/40` 在某些情況下可能不被正確解析。

**當前代碼**:
```tsx
// Line 346
<Box bg="gray.900/40" backdropFilter="blur(20px)" />

// Line 379-380
<Box borderColor="gray.700" bg="gray.950/40" />

// Line 541-542
<NativeSelectField bg="gray.950/50" borderColor="gray.800" />

// Line 621
<Box bg="gray.900/20" />

// Line 757
<Flex bg="gray.950/50" />

// Line 819
<HStack bg="gray.950/60" />
```

**修復建議**:
```tsx
// 使用 semantic tokens
<Box bg="bg.subtle" backdropFilter="blur(20px)" />
<Box borderColor="border.muted" bg="bg.muted" />
<NativeSelectField bg="bg.input" borderColor="border.default" />
<Box bg="bg.canvas" />
<Flex bg="bg.elevated" />
<HStack bg="bg.panel" />

// 或者在 theme 中定義帶透明度的 semantic tokens
const theme = {
  semanticTokens: {
    colors: {
      bg: {
        glass: { value: 'rgba(17, 24, 39, 0.4)' },  // gray.900/40
        glassLight: { value: 'rgba(17, 24, 39, 0.2)' },  // gray.900/20
        elevated: { value: 'rgba(3, 7, 18, 0.5)' },  // gray.950/50
      }
    }
  }
}
```

---

## Improvements（建議改進）

### 1. 缺少 Semantic Tokens 使用

**問題描述**:  
頁面沒有使用 Chakra v3 的 semantic tokens 如 `bg.subtle`、`fg.muted`、`border.emphasized` 等，而是大量使用 palette 顏色如 `gray.500`、`emerald.400`。

**建議**:
```tsx
// 當前
<Text color="gray.500">...</Text>
<Text color="emerald.400">...</Text>
<Box borderColor="gray.700">...</Box>

// 改進後
<Text color="fg.muted">...</Text>
<Text color="accent.emerald">...</Text>
<Box borderColor="border.muted">...</Box>
```

---

### 2. Color Mode 支援不完整

**問題描述**:  
由於大量使用硬編碼顏色和 `useColorModeValue`，dark mode 支援不完整且維護困難。許多顏色在 dark mode 下可能對比度不足。

**建議**:
- 遷移到 semantic tokens 系統
- 在 theme 中定義完整的 semantic color palette
- 移除所有 `useColorModeValue` 調用

---

### 3. 重複的樣式模式可提取為 Recipes

**問題描述**:  
多處重複的樣式模式可以提取為 component recipes，提高代碼復用性和一致性。

**重複模式示例**:

1. **Account Card 樣式** (Line 344-358):
```tsx
<Box
    bg="gray.900/40"
    backdropFilter="blur(20px)"
    border="1px solid"
    borderColor="gray.700"
    shadow="xl"
    overflow="hidden"
    position="relative"
    rounded="xl"
    _hover={{ shadow: '2xl', borderColor: 'emerald.500/30' }}
    transition="all"
    display="flex"
    flexDirection="column"
/>
```

2. **Input Focus 樣式** (Line 281-288, 304-311, 686-693, 708-713):
```tsx
_focus={{
    borderColor: inputFocusBorderColor,
    boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`,
}}
```

3. **Button Hover 樣式** (Line 514-515, 647-648, 771-772, 800, 828, 843):
```tsx
_hover={{ color: 'red.400', bg: 'red.500/10' }}
_hover={{ color: 'emerald.300', bg: 'emerald.500/10' }}
```

**建議**:
```tsx
// 在 theme 中定義 recipes
const theme = {
  recipes: {
    accountCard: {
      base: {
        bg: 'bg.glass',
        backdropFilter: 'blur(20px)',
        border: '1px solid',
        borderColor: 'border.muted',
        shadow: 'xl',
        overflow: 'hidden',
        position: 'relative',
        rounded: 'xl',
        transition: 'all',
        display: 'flex',
        flexDirection: 'column',
      },
      variants: {
        hover: {
          shadow: '2xl',
          borderColor: 'accent.emerald/30',
        }
      }
    },
    inputFocus: {
      base: {
        _focus: {
          borderColor: 'border.focused',
          ring: '2px',
          ringColor: 'accent.blue/20',
          ringOffset: '2px'
        }
      }
    }
  }
}
```

---

### 4. 響應式設計良好但可優化

**優點**:  
頁面使用了響應式 props，如 `fontSize={{ base: '2xl', md: '3xl' }}`、`gap={{ base: 6, md: 10 }}`，這符合 Chakra v3 規範。

**建議優化**:
```tsx
// 當前 - 多處重複的響應式值
fontSize={{ base: '10px', md: 'sm' }}
fontSize={{ base: 'xs', md: 'sm' }}
h={{ base: 11, md: 12 }}

// 可以在 theme 中定義響應式 tokens
const theme = {
  semanticTokens: {
    fontSizes: {
      label: {
        base: { value: '10px' },
        md: { value: 'sm' }
      }
    },
    sizes: {
      input: {
        base: { value: '44px' },  // 11 * 4
        md: { value: '48px' }     // 12 * 4
      }
    }
  }
}

// 使用
<Input fontSize="label" h="input" />
```

---

## Optional（可選優化）

### 1. 組件結構優化

**問題描述**:  
文件長達 858 行，包含多個對話框邏輯，可讀性和維護性較差。

**建議**:
- 提取 `AccountDialog` 組件
- 提取 `SubscriptionDialog` 組件
- 提取 `MemberDialog` 組件
- 提取 `AccountCard` 組件

**預期結構**:
```
src/pages/Mapping.tsx (主頁面邏輯)
src/components/mapping/
  ├── AccountCard.tsx
  ├── AccountDialog.tsx
  ├── SubscriptionDialog.tsx
  └── MemberDialog.tsx
```

---

### 2. Accessibility 改進

**優點**:  
大部分按鈕都有 `aria-label`，表單字段都使用了 `Field.Root` 和 `Field.Label`。

**建議改進**:
```tsx
// Line 425-430 - 點擊餘額更新
<Text
    fontSize={{ base: 'xl', md: '2xl' }}
    fontWeight="black"
    color="gray.100"
    fontFamily="mono"
    textShadow="sm"
    cursor="pointer"
    _hover={{ color: 'emerald.400' }}
    transition="color"
    onClick={() => { /* ... */ }}
    // 添加 keyboard accessibility
    onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            // trigger update
        }
    }}
    tabIndex={0}
    role="button"
    aria-label={`更新餘額，當前餘額 ${account.balance}`}
>
```

---

### 3. 類型安全改進

**問題描述**:  
部分類型定義不完整，如 Line 87 使用 `any[]`。

**當前代碼**:
```tsx
const { data: services } = useSWR<any[]>('services', api.getServices);
```

**建議**:
```tsx
interface Service {
    id: string;
    name: string;
    price: number;
    currency: string;
    cycle: string;
}

const { data: services } = useSWR<Service[]>('services', api.getServices);
```

---

## Spacing 一致性分析

### ✅ 正確使用 Token Units

頁面在 spacing 方面表現良好，正確使用了 Chakra 的 token units：

```tsx
// 間距使用 token units
gap={{ base: 6, md: 10 }}    // Line 208
gap={{ base: 5, md: 6 }}      // Line 342
gap={4}                       // Line 268, 472, 673
gap={2}                       // Line 225, 764
gap={1.5}                     // Line 744

// Padding 使用 token units
p={{ base: 6, md: 8 }}        // Line 217
px={{ base: 0, sm: 4 }}       // Line 208
px={5}                        // Line 381
px={4}                        // Line 617
py={3}                        // Line 618

// Margin 使用 token units
mt={2}                        // Line 231
mt={4}                        // Line 437
mb={6}                        // Line 629
mb={3}                        // Line 630
```

### 建議統一

部分地方使用了小數值，建議統一為整數或明確定義在 theme 中：

```tsx
// 當前
gap={1.5}    // Line 744
px={1.5}     // Line 398
py={0.5}     // Line 399
h={1}        // Line 371

// 建議在 theme 中定義
const theme = {
  tokens: {
    spacing: {
      xs: { value: '4px' },    // 1
      sm: { value: '8px' },    // 2
      md: { value: '12px' },   // 3
      lg: { value: '16px' },   // 4
      xl: { value: '24px' },   // 6
      '2xl': { value: '32px' }, // 8
    }
  }
}
```

---

## 總結與優先級

### 必須修復（Critical）

1. ✅ 移除 `useColorModeValue`，遷移到 semantic tokens
2. ✅ 替換硬編碼 rgba 顏色為 semantic tokens
3. ✅ 移除直接引用 CSS 變數，使用 Chakra gradient API
4. ✅ 修復動態顏色拼接，使用 ring style props 或 theme shadows
5. ✅ 替換帶透明度的 palette 顏色為 semantic tokens

### 應該改進（Improvements）

1. 全面採用 semantic tokens 系統
2. 完善 dark mode 支援
3. 提取重複樣式為 component recipes
4. 優化響應式設計

### 可選優化（Optional）

1. 重構組件結構，提取對話框
2. 改進 accessibility
3. 加強類型安全

---

## 遷移建議

### 第一階段：修復 Critical 問題

1. 在 theme 中定義完整的 semantic tokens
2. 移除所有 `useColorModeValue` 調用
3. 替換硬編碼顏色為 semantic tokens
4. 修復動態顏色拼接

### 第二階段：改進設計系統

1. 提取 component recipes
2. 統一 spacing tokens
3. 完善響應式設計

### 第三階段：優化代碼結構

1. 提取對話框組件
2. 改進 accessibility
3. 加強類型安全

---

## 參考資源

- [Chakra UI v3 Semantic Tokens](https://chakra-ui.com/docs/styled-system/semantic-tokens)
- [Chakra UI v3 Color Mode](https://chakra-ui.com/docs/styled-system/color-mode)
- [Chakra UI v3 Recipes](https://chakra-ui.com/docs/styled-system/recipes)
- [Chakra UI v3 Migration Guide](https://chakra-ui.com/docs/migration)
