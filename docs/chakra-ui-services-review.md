# Services.tsx Chakra UI v3 審查報告

**審查日期**: 2026-05-23  
**審查範圍**: `src/pages/Services.tsx`  
**審查目標**: Chakra UI v3 最佳實踐合規性

---

## 執行摘要

| 類別 | 數量 | 嚴重程度 |
|------|------|----------|
| Critical | 0 | 無阻塞性問題 |
| Improvements | 14 | 建議改進 |
| Optional | 3 | 可選優化 |

**整體評分**: ⭐⭐⭐☆☆ (3/5)  
**主要問題**: 大量使用 v2 的 `useColorModeValue` 模式，應遷移至 v3 semantic tokens

---

## Critical (必須修復)

**無 Critical 問題** - 代碼功能正常，無 accessibility 或 runtime bug。

---

## Improvements (建議改進)

### 1. 🔴 使用 v2 的 `useColorModeValue` 模式

**嚴重程度**: High  
**影響範圍**: Color mode 支援、維護性

#### 問題位置

| 行號 | 代碼 |
|------|------|
| 28 | `import { useColorModeValue } from '@/components/ui/color-mode';` |
| 55-68 | 14 個 `useColorModeValue` 調用定義顏色變數 |
| 335 | `bg={useColorModeValue('gray.50', 'gray.950/60')}` |
| 382 | `color={useColorModeValue('gray.900', 'gray.100')}` |

#### 問題說明

Chakra UI v3 引入了 **semantic tokens** 系統，顏色會根據 color mode 自動切換，不再需要手動使用 `useColorModeValue`。

#### 建議修復

**Before (v2 模式)**:
```tsx
const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');

<Box bg={headerBg} borderColor={headerBorderColor}>
```

**After (v3 模式)**:
```tsx
// 使用 semantic tokens，自動支援 dark mode
<Box bg="bg.panel" borderColor="border.emphasized">
```

**Semantic Tokens 對照表**:

| 當前使用 | 建議 Semantic Token |
|----------|---------------------|
| `useColorModeValue('white', 'bg.subtle')` | `bg.panel` 或 `bg.default` |
| `useColorModeValue('gray.200', 'gray.700')` | `border.emphasized` |
| `useColorModeValue('gray.900', 'white')` | `fg.default` |
| `useColorModeValue('gray.600', 'gray.300')` | `fg.muted` |
| `useColorModeValue('gray.50', 'gray.800')` | `bg.subtle` |
| `useColorModeValue('gray.500', 'gray.500')` | `fg.subtle` |

---

### 2. 🟠 硬編碼顏色值（不支援 Dark Mode）

**嚴重程度**: Medium  
**影響範圍**: Dark mode 一致性

#### 問題位置

| 行號 | 代碼 | 問題 |
|------|------|------|
| 254 | `color="blue.400"` | 硬編碼，dark mode 不變 |
| 255 | `bg="blue.400"` | 硬編碼，dark mode 不變 |
| 332 | `bg="blue.500"` | 硬編碼，dark mode 不變 |
| 372 | `borderColor="gray.700"` | 硬編碼，light mode 可能太暗 |
| 373 | `_hover={{ bg: 'gray.800/40' }}` | 硬編碼，light mode 不適用 |
| 376 | `color="gray.200"` | 硬編碼，light mode 太淺 |
| 407 | `bg="gray.950/50"` | 硬編碼，light mode 不適用 |
| 410 | `borderColor="gray.700"` | 硬編碼 |
| 412 | `color="orange.400"` | 硬編碼 |
| 420 | `color="gray.600"` | 硬編碼 |
| 430 | `_hover={{ color: 'blue.400', bg: 'blue.500/10' }}` | 硬編碼 |
| 441 | `_hover={{ color: 'red.400', bg: 'red.500/10' }}` | 硬編碼 |

#### 建議修復

使用 semantic tokens 或 `colorPalette`:

```tsx
// Before
<Text color="blue.400">未來價格調整</Text>

// After - 使用 colorPalette
<Text colorPalette="blue" color="fg.emphasized">未來價格調整</Text>

// Before
<Box _hover={{ bg: 'gray.800/40' }}>

// After - 使用 semantic token
<Box _hover={{ bg: 'bg.emphasized' }}>
```

---

### 3. 🟡 動態顏色拼接（模板字符串）

**嚴重程度**: Medium  
**影響範圍**: Type safety、維護性

#### 問題位置

| 行號 | 代碼 |
|------|------|
| 168 | `boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`` |
| 190 | `boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`` |
| 212 | `boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`` |
| 236 | `boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`` |
| 274 | `boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`` |
| 295 | `boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`` |

#### 問題說明

使用模板字符串拼接顏色值（`${inputFocusBorderColor}20`）會：
1. 失去 TypeScript 類型檢查
2. 在某些情況下可能產生無效的顏色值
3. 違反 Chakra v3 的設計系統原則

#### 建議修復

```tsx
// Before
_focus={{
    borderColor: inputFocusBorderColor,
    boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`,
}}

// After - 使用 Chakra 的 focus ring 系統
_focus={{
    borderColor: 'border.focus',
    boxShadow: 'focusRing',  // 使用預設 focus ring
}}

// 或使用 colorPalette
_focus={{
    borderColor: 'colorPalette.400',
    boxShadow: '0 0 0 3px token(colorPalette.400, 0.2)',
}}
```

---

### 4. 🟠 Table Header 使用 `useColorModeValue`

**嚴重程度**: Medium  
**影響範圍**: Dark mode 支援

#### 問題位置

```tsx
// Line 335
<Table.Header bg={useColorModeValue('gray.50', 'gray.950/60')}>
```

#### 建議修復

```tsx
// Before
<Table.Header bg={useColorModeValue('gray.50', 'gray.950/60')}>

// After - 使用 semantic token
<Table.Header bg="bg.subtle">
```

---

## Optional (可選優化)

### 1. 💡 提取重複的 Input 樣式為 Recipe

**觀察**: 表單中的 Input 元件重複使用相同的樣式：

```tsx
bg={inputBg}
borderColor={inputBorderColor}
rounded="xl"
h={12}
_focus={{
    borderColor: inputFocusBorderColor,
    boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`,
}}
transition="all 0.2s"
```

**建議**: 在 theme 中定義 `inputRecipe`:

```tsx
// theme.ts
const inputRecipe = defineRecipe({
  className: 'input',
  base: {
    rounded: 'xl',
    h: 12,
    transition: 'all 0.2s',
    _focus: {
      borderColor: 'border.focus',
      boxShadow: 'focusRing',
    },
  },
  variants: {
    variant: {
      default: {
        bg: 'bg.subtle',
        borderColor: 'border.default',
      },
    },
  },
});
```

---

### 2. 💡 提取 Table Row Hover 樣式

**觀察**: Table.Row 的 hover 樣式重複：

```tsx
_hover={{ bg: 'gray.800/40' }}
```

**建議**: 使用 semantic token:

```tsx
_hover={{ bg: 'bg.hover' }}
```

---

### 3. 💡 統一 Button Icon 樣式

**觀察**: 編輯和刪除按鈕使用相同的樣式模式：

```tsx
<Button
    variant="ghost"
    size="sm"
    color={secondaryTextColor}
    _hover={{ color: 'xxx', bg: 'xxx/10' }}
    rounded="lg"
>
```

**建議**: 提取為 `iconButtonRecipe` 或使用 Chakra 的 `IconButton` 元件。

---

## 正面發現 ✅

### 1. 正確使用 `colorPalette`

```tsx
// Line 130, 305
<Button colorPalette="blue">

// Line 389
<Badge colorPalette={service.cycle === 'yearly' ? 'purple' : 'blue'}>
```

這是 Chakra v3 的正確用法，`colorPalette` 會自動處理 dark mode。

---

### 2. 正確使用響應式 Spacing

```tsx
// Line 102
<VStack gap={{ base: 6, md: 10 }}>

// Line 111
<Box p={{ base: 5, md: 8 }}>

// Line 107
<Box rounded={{ base: '2xl', md: '3xl' }}>
```

正確使用 token units 和響應式物件。

---

### 3. 正確使用 Badge Variant

```tsx
// Line 390
<Badge variant="subtle">
```

使用 Chakra v3 的 variant 系統。

---

### 4. 正確使用 Button Variant

```tsx
// Line 426, 436
<Button variant="ghost">
```

---

## 遷移建議

### 優先順序

1. **P0 (立即)**: 移除所有 `useColorModeValue`，改用 semantic tokens
2. **P1 (本週)**: 替換硬編碼顏色為 semantic tokens
3. **P2 (下週)**: 移除動態顏色拼接，使用 focus ring 系統
4. **P3 (可選)**: 提取重複樣式為 recipes

### Semantic Tokens 快速參考

| Token | Light Mode | Dark Mode | 用途 |
|-------|------------|-----------|------|
| `bg.default` | white | gray.900 | 預設背景 |
| `bg.subtle` | gray.50 | gray.800 | 次級背景 |
| `bg.panel` | white | gray.900 | 面板背景 |
| `bg.emphasized` | gray.100 | gray.800 | 強調背景 |
| `fg.default` | gray.900 | white | 預設文字 |
| `fg.muted` | gray.600 | gray.300 | 次級文字 |
| `fg.subtle` | gray.500 | gray.400 | 提示文字 |
| `border.default` | gray.200 | gray.700 | 預設邊框 |
| `border.emphasized` | gray.300 | gray.600 | 強調邊框 |
| `border.focus` | blue.400 | blue.300 | 焦點邊框 |

---

## 總結

`Services.tsx` 在功能上運作正常，但存在大量 Chakra UI v2 的 `useColorModeValue` 模式，這會導致：

1. **維護成本增加** - 需要手動維護 light/dark 兩套顏色
2. **Dark mode 不一致** - 硬編碼顏色在 dark mode 下可能不合適
3. **違反 v3 設計系統** - 未充分利用 semantic tokens 的自動切換能力

建議優先處理 `useColorModeValue` 的遷移，這將大幅改善代碼品質和 dark mode 支援。

---

**審查完成** ✅
