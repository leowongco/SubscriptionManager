# Chakra UI v3 審查報告 - Recharge 頁面

**審查日期**: 2026-05-23  
**審查範圍**: `src/pages/Recharge.tsx` 及相關組件  
**Chakra UI 版本**: v3

---

## 執行摘要

Recharge 頁面及其子組件存在多個 Chakra UI v3 合規性問題，主要集中在：

1. **廣泛使用 v2 的 `useColorModeValue` 模式** - 應遷移到 v3 semantic tokens
2. **大量硬編碼顏色值** - 不支援 dark mode 自動切換
3. **混合使用 Tailwind CSS classes** - 違反 Chakra UI 設計系統一致性
4. **直接引用 CSS 變數** - 使用 `var(--chakra-colors-...)` 模式
5. **動態顏色拼接** - 使用模板字符串和條件表達式拼接顏色值

---

## Critical - 必須修復的問題

### 1. RechargePreview.tsx 和 RechargeProgress.tsx 完全不支援 Light Mode

**問題描述**: 這兩個組件完全硬編碼深色主題顏色，沒有任何 color mode 支援。

**受影響檔案**:
- [`src/components/recharge/RechargePreview.tsx`](src/components/recharge/RechargePreview.tsx:1)
- [`src/components/recharge/RechargeProgress.tsx`](src/components/recharge/RechargeProgress.tsx:1)

**問題代碼示例** (RechargePreview.tsx):

```tsx
// 第 32-35 行
<Box
  bg="gray.800"           // ❌ 硬編碼深色背景
  border="1px solid"
  borderColor="gray.700"  // ❌ 硬編碼深色邊框
  borderRadius="xl"
  p={6}
>
```

```tsx
// 第 74-78 行
<Box
  bg="rgba(72, 187, 120, 0.1)"  // ❌ 硬編碼 rgba 顏色
  border="1px solid"
  borderColor="green.500"
  borderRadius="lg"
  p={4}
>
```

**問題代碼示例** (RechargeProgress.tsx):

```tsx
// 第 100-106 行
<Box
  bg={failed > 0 ? 'rgba(245, 101, 101, 0.1)' : 'gray.900'}  // ❌ 動態拼接硬編碼顏色
  borderRadius="lg"
  p={3}
  textAlign="center"
  border={failed > 0 ? '1px solid' : 'none'}
  borderColor={failed > 0 ? 'red.500' : 'transparent'}
>
```

**影響**: 
- 在 light mode 下這些組件仍然顯示深色背景，造成視覺不一致
- 用戶無法在淺色主題下正常使用這些功能

**修復建議**:
```tsx
// 使用 semantic tokens
<Box
  bg="bg.subtle"
  border="1px solid"
  borderColor="border.emphasized"
  borderRadius="xl"
  p={6}
>
```

---

### 2. 直接引用 CSS 變數

**問題描述**: 在 AccountSelector.tsx 中直接引用 CSS 變數，這是 v2 模式。

**受影響檔案**: [`src/components/recharge/AccountSelector.tsx`](src/components/recharge/AccountSelector.tsx:145)

**問題代碼**:
```tsx
// 第 145 行
_focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
```

**影響**: 
- 違反 Chakra v3 API 設計原則
- 未來版本可能不支援此模式

**修復建議**:
```tsx
_focus={{ 
  borderColor: 'blue.500', 
  ring: '2px',
  ringColor: 'blue.500/20'
}}
```

---

## Improvements - 建議改進

### 3. 使用 v2 的 `useColorModeValue` 模式

**問題描述**: Recharge.tsx 和 AccountSelector.tsx 大量使用 `useColorModeValue`，這是 v2 模式，應遷移到 v3 semantic tokens。

**受影響檔案**:
- [`src/pages/Recharge.tsx`](src/pages/Recharge.tsx:33) - 第 33 行引入，第 41-53 行定義
- [`src/components/recharge/AccountSelector.tsx`](src/components/recharge/AccountSelector.tsx:15) - 第 15 行引入，第 33-39 行定義

**問題代碼** (Recharge.tsx):
```tsx
// 第 41-53 行
const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
const headerTitleColor = useColorModeValue('gray.900', 'white');
const headerTextColor = useColorModeValue('gray.600', 'gray.300');

const cardBg = useColorModeValue('white', 'gray.900/40');
const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
```

**問題代碼** (AccountSelector.tsx):
```tsx
// 第 33-39 行
const cardBg = useColorModeValue('white', 'gray.900/40');
const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
const headerTitleColor = useColorModeValue('gray.900', 'white');
const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
const inputBg = useColorModeValue('gray.50', 'gray.900/50');
const inputBorderColor = useColorModeValue('gray.300', 'gray.700');
```

**影響**:
- 代碼冗餘，每個組件都需要重複定義顏色變數
- 維護困難，修改主題需要改動多處
- 不符合 Chakra v3 最佳實踐

**修復建議**:
```tsx
// 直接使用 semantic tokens
<Box bg="bg.subtle" borderColor="border.emphasized">
  <Text color="fg.default">標題</Text>
  <Text color="fg.muted">次要文字</Text>
</Box>
```

---

### 4. 硬編碼 Hex 和 Palette 顏色值

**問題描述**: 大量使用硬編碼顏色值，無法自動適應 dark mode。

**受影響檔案**: 所有四個檔案

**問題代碼示例**:

```tsx
// Recharge.tsx 第 307-308 行
<Box p={2} bg={useColorModeValue('blue.100', 'blue.500/10')} rounded="xl">
  <Icon as={CreditCard} color={useColorModeValue('blue.600', 'blue.400')} boxSize={6} />
</Box>
```

```tsx
// AccountSelector.tsx 第 189 行
bg={isSelected ? useColorModeValue('blue.50', 'rgba(49, 130, 206, 0.2)') : useColorModeValue('gray.50', 'rgba(26, 32, 44, 0.5)')}
```

**影響**:
- 無法自動適應主題變化
- 與設計系統脫節

**修復建議**:
```tsx
// 使用 semantic tokens 和 colorPalette
<Box p={2} bg="bg.info.subtle" rounded="xl">
  <Icon as={CreditCard} color="fg.info" boxSize={6} />
</Box>

// 或使用 colorPalette prop
<Box p={2} colorPalette="blue" bg="bg.subtle" rounded="xl">
  <Icon as={CreditCard} color="fg.emphasized" boxSize={6} />
</Box>
```

---

### 5. 混合使用 Tailwind CSS Classes

**問題描述**: 在 Chakra UI 組件上混合使用 Tailwind CSS classes，違反設計系統一致性。

**受影響檔案**: [`src/pages/Recharge.tsx`](src/pages/Recharge.tsx:350)

**問題代碼**:
```tsx
// 第 350 行
<SelectTrigger className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg">
```

```tsx
// 第 353 行
<SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
```

**影響**:
- 混合兩套設計系統，維護困難
- Tailwind 的 `dark:` 前綴與 Chakra 的 color mode 機制衝突
- 未來難以統一主題

**修復建議**:
```tsx
// 使用 Chakra UI 的 style props
<SelectTrigger
  bg="bg.subtle"
  borderColor="border.emphasized"
  color="fg.default"
  borderRadius="lg"
>
```

---

### 6. 動態顏色拼接模式

**問題描述**: 使用條件表達式和模板字符串動態拼接顏色值。

**受影響檔案**:
- [`src/components/recharge/AccountSelector.tsx`](src/components/recharge/AccountSelector.tsx:189) - 第 189-199 行
- [`src/components/recharge/RechargeProgress.tsx`](src/components/recharge/RechargeProgress.tsx:100) - 第 100-106 行

**問題代碼** (AccountSelector.tsx):
```tsx
// 第 189-199 行
bg={isSelected ? useColorModeValue('blue.50', 'rgba(49, 130, 206, 0.2)') : useColorModeValue('gray.50', 'rgba(26, 32, 44, 0.5)')}
borderRadius="lg"
border="1px solid"
borderColor={isSelected ? 'blue.500' : cardBorderColor}
cursor="pointer"
onClick={() => handleToggle(account.id)}
transition="all 0.2s"
_hover={{
  borderColor: isSelected ? 'blue.400' : useColorModeValue('gray.300', 'gray.600'),
  bg: isSelected ? useColorModeValue('blue.100', 'rgba(49, 130, 206, 0.3)') : useColorModeValue('gray.100', 'rgba(26, 32, 44, 0.7)'),
}}
```

**影響**:
- 代碼可讀性差
- 難以維護和擴展
- 容易出錯

**修復建議**:
```tsx
// 使用 data attribute 和 CSS 變數
<Box
  data-selected={isSelected ? '' : undefined}
  bg="bg.subtle"
  borderRadius="lg"
  border="1px solid"
  borderColor="border.emphasized"
  cursor="pointer"
  onClick={() => handleToggle(account.id)}
  transition="all 0.2s"
  _hover={{ bg: 'bg.muted' }}
  _selected={{
    bg: 'bg.info.subtle',
    borderColor: 'border.info',
  }}
>
```

---

## Optional - 可選優化

### 7. 提取重複的 Icon + Box 模式為 Recipe

**問題描述**: 多處使用相同的「圖標 + 背景框」模式，可以提取為 recipe。

**受影響檔案**: 所有四個檔案

**重複模式示例**:
```tsx
// Recharge.tsx 第 307-309 行
<Box p={2} bg={useColorModeValue('blue.100', 'blue.500/10')} rounded="xl">
  <Icon as={CreditCard} color={useColorModeValue('blue.600', 'blue.400')} boxSize={6} />
</Box>

// Recharge.tsx 第 332-334 行
<Box p={2} bg={useColorModeValue('blue.100', 'blue.500/10')} rounded="lg">
  <Icon as={Filter} color={useColorModeValue('blue.600', 'blue.400')} boxSize={5} />
</Box>

// AccountSelector.tsx 第 114-116 行
<Box p={2} bg={useColorModeValue('blue.100', 'blue.500/10')} rounded="lg">
  <Icon as={Users} color={useColorModeValue('blue.600', 'blue.400')} boxSize={5} />
</Box>
```

**建議**: 創建 `iconBadge` recipe:

```typescript
// 在 theme.ts 或 recipes.ts 中
export const iconBadgeRecipe = defineRecipe({
  className: 'icon-badge',
  base: {
    p: 2,
    borderRadius: 'lg',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variants: {
    colorPalette: {
      blue: {
        bg: 'bg.info.subtle',
        '& > svg': { color: 'fg.info' },
      },
      green: {
        bg: 'bg.success.subtle',
        '& > svg': { color: 'fg.success' },
      },
    },
    size: {
      sm: { p: 1.5 },
      md: { p: 2 },
      lg: { p: 2.5 },
    },
  },
  defaultVariants: {
    colorPalette: 'blue',
    size: 'md',
  },
});
```

---

### 8. Spacing 一致性良好

**正面發現**: 整體 spacing 使用一致，都使用 Chakra token units。

**示例**:
```tsx
// 使用 token units
p={6}        // padding
gap={4}      // gap
mb={2}       // margin-bottom
mt={2}       // margin-top
```

**無需修改**。

---

### 9. 組件結構合理

**正面發現**: 組件層級結構清晰，使用了正確的 layout primitives。

**示例**:
```tsx
// 正確使用 VStack, HStack, SimpleGrid
<VStack gap={{ base: 6, md: 10 }} maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }} align="stretch">
<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
```

**無需修改**。

---

## 問題統計

| 類別 | 數量 | 優先級 |
|------|------|--------|
| Critical | 2 | 必須修復 |
| Improvements | 4 | 建議改進 |
| Optional | 2 | 可選優化 |

---

## 修復優先順序建議

### Phase 1 - Critical (必須修復)

1. **RechargePreview.tsx 和 RechargeProgress.tsx** - 添加 color mode 支援
   - 將所有硬編碼顏色替換為 semantic tokens
   - 移除 `rgba()` 硬編碼值

2. **AccountSelector.tsx** - 移除 CSS 變數引用
   - 替換 `var(--chakra-colors-...)` 為 Chakra style props

### Phase 2 - Improvements (建議改進)

3. **所有檔案** - 遷移 `useColorModeValue` 到 semantic tokens
   - 移除所有 `useColorModeValue` 調用
   - 使用 `bg.subtle`, `fg.muted`, `border.emphasized` 等 semantic tokens

4. **Recharge.tsx** - 移除 Tailwind CSS classes
   - 將 `className` 替換為 Chakra style props

5. **AccountSelector.tsx 和 RechargeProgress.tsx** - 簡化動態顏色邏輯
   - 使用 data attributes 和 CSS 變數

### Phase 3 - Optional (可選優化)

6. **所有檔案** - 提取重複模式為 recipes
   - 創建 `iconBadge` recipe
   - 創建 `statCard` recipe (用於統計卡片)

---

## Semantic Tokens 對照表

以下是建議使用的 semantic tokens 對照：

| 當前使用 | 建議使用 | 說明 |
|---------|---------|------|
| `useColorModeValue('white', 'bg.subtle')` | `bg.subtle` | 卡片背景 |
| `useColorModeValue('gray.200', 'gray.700')` | `border.emphasized` | 邊框顏色 |
| `useColorModeValue('gray.900', 'white')` | `fg.default` | 主要文字 |
| `useColorModeValue('gray.600', 'gray.300')` | `fg.muted` | 次要文字 |
| `useColorModeValue('gray.500', 'gray.500')` | `fg.subtle` | 提示文字 |
| `useColorModeValue('blue.100', 'blue.500/10')` | `bg.info.subtle` | 資訊背景 |
| `useColorModeValue('blue.600', 'blue.400')` | `fg.info` | 資訊文字 |
| `rgba(72, 187, 120, 0.1)` | `bg.success.subtle` | 成功背景 |
| `rgba(245, 101, 101, 0.1)` | `bg.error.subtle` | 錯誤背景 |

---

## 結論

Recharge 頁面的 Chakra UI v3 合規性存在顯著問題，特別是 **RechargePreview.tsx** 和 **RechargeProgress.tsx** 完全不支援 light mode，這是必須立即修復的 critical 問題。

建議按照上述優先順序進行修復，確保所有組件都符合 Chakra UI v3 最佳實踐，並正確支援 dark mode。

---

**審查完成時間**: 2026-05-23 11:42 HKT
