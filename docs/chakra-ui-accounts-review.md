# Accounts 頁面 Chakra UI v3 審查報告

**審查日期**: 2026-05-23  
**審查範圍**: Accounts.tsx 及相關組件  
**Chakra UI 版本**: v3.35.0  
**框架**: Vite + React

---

## 執行摘要

本次審查發現 **3 個 Critical 問題**、**6 個 Improvements 建議**、**3 個 Optional 優化**。主要問題與 Dashboard 審查結果一致，集中在使用 Chakra v2 的 `useColorModeValue` 模式，以及硬編碼顏色值而非使用 semantic tokens。

---

## 🔴 Critical - 必須修復

### 1. 使用 v2 的 `useColorModeValue` 模式

**影響範圍**: 所有 3 個文件  
**問題**: Chakra v3 應使用 semantic tokens 自動處理 dark mode，而非 `useColorModeValue`

**Accounts.tsx** (第 29, 63-72, 206-209 行):
```tsx
// ❌ 錯誤 - v2 模式
import { useColorModeValue } from '@/components/ui/color-mode';

const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
const headerTitleColor = useColorModeValue('gray.900', 'white');
const headerTextColor = useColorModeValue('gray.600', 'gray.300');
const cardBg = useColorModeValue('white', 'gray.900/40');
const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
const textColor = useColorModeValue('gray.900', 'white');
const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
const iconColor = useColorModeValue('gray.500', 'gray.300');
const inputBg = useColorModeValue('gray.50', 'gray.800');
const inputBorderColor = useColorModeValue('gray.300', 'gray.600');
const labelColor = useColorModeValue('gray.700', 'gray.300');
const inputFocusBorderColor = useColorModeValue('blue.400', 'blue.300');
```

```tsx
// ✅ 正確 - v3 semantic tokens
// 直接在組件中使用 semantic tokens
<Box bg="bg.panel" borderColor="border.emphasized">
<Text color="fg.default">
<Text color="fg.muted">
```

**AccountCard.tsx** (第 11, 50-58 行):
```tsx
// ❌ 錯誤 - v2 模式
const cardBg = useColorModeValue('white', 'gray.800');
const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
const cardHoverBorderColor = useColorModeValue('gray.300', 'gray.600');
const textColor = useColorModeValue('gray.900', 'white');
const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
const balanceColor = useColorModeValue('green.600', 'green.400');
const expenseBg = useColorModeValue('gray.100', 'gray.700');
const expenseColor = useColorModeValue('orange.600', 'orange.400');
```

**BalanceAdjustDialog.tsx** (第 21, 45-50 行):
```tsx
// ❌ 錯誤 - v2 模式
const inputBg = useColorModeValue('gray.50', 'gray.800');
const inputBorderColor = useColorModeValue('gray.300', 'gray.600');
const labelColor = useColorModeValue('gray.700', 'gray.300');
const infoBoxBg = useColorModeValue('blue.50/50', 'blue.900/20');
const previewBoxBg = useColorModeValue('gray.100/80', 'gray.800/50');
const inputFocusBorderColor = useColorModeValue('blue.400', 'blue.300');
```

**修復建議**:
- 移除所有 `useColorModeValue` 調用
- 使用 semantic tokens: `bg.subtle`, `bg.panel`, `fg.muted`, `border.emphasized` 等
- Chakra v3 的 semantic tokens 會自動根據 color mode 切換

---

### 2. BalanceAdjustDialog.tsx 硬編碼 Hex 顏色值

**位置**: [`BalanceAdjustDialog.tsx`](src/components/accounts/BalanceAdjustDialog.tsx:106) 第 106 行

```tsx
// ❌ 錯誤 - 硬編碼 hex 值，不支援 dark mode
_before={{
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    h: '2px',
    bg: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
}}
```

**問題**: 
- 硬編碼的 hex 值無法自動適應 dark mode
- 違反 Chakra v3 的 semantic token 原則
- 與設計系統不一致

**修復建議**:
```tsx
// ✅ 正確 - 使用 CSS 變數或 semantic tokens
// 在 theme 中定義 gradient semantic token
_before={{
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    h: '2px',
    bg: 'gradient.primary',
}}

// 或使用 Chakra 的 gradient 工具
_before={{
    bg: 'linear-gradient(90deg, blue.500 0%, purple.500 100%)',
}}
```

---

### 3. 模板字符串中的動態顏色拼接

**位置**: [`BalanceAdjustDialog.tsx`](src/components/accounts/BalanceAdjustDialog.tsx:162) 第 162, 229 行

```tsx
// ❌ 錯誤 - 動態拼接顏色值
_focus={{ 
    borderColor: inputFocusBorderColor,
    boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`,
}}
```

**問題**: 
- 使用模板字符串拼接顏色值不符合 Chakra v3 最佳實踐
- 透明度後綴（如 `20`）應使用 Chakra 的語法 `/20`

**修復建議**:
```tsx
// ✅ 正確 - 使用 Chakra 的透明度語法
_focus={{ 
    borderColor: 'blue.400',
    boxShadow: '0 0 0 3px blue.400/20',
}}

// 或在 theme 中定義 focus ring semantic token
_focus={{ 
    borderColor: 'focus.ring',
    boxShadow: '0 0 0 3px focus.ring/20',
}}
```

---

## 🟡 Improvements - 建議改進

### 1. Accounts.tsx 統計區塊內聯 useColorModeValue

**位置**: [`Accounts.tsx`](src/pages/Accounts.tsx:389) 第 389, 396, 402, 408 行

```tsx
// ❌ 不理想 - 在 JSX 中直接調用 useColorModeValue
<HStack gap={6} p={4} bg={useColorModeValue('gray.50', 'gray.800/60')} rounded="xl" border="1px solid" borderColor={cardBorderColor}>
    ...
    <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('green.600', 'green.400')}>
    ...
    <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('orange.600', 'orange.400')}>
    ...
    <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('red.600', 'red.400')}>
</HStack>
```

**問題**: 
- 在 JSX 中直接調用 hooks 會導致每次渲染都重新執行
- 應在組件頂層統一定義

**修復建議**:
```tsx
// ✅ 正確 - 使用 semantic tokens
<HStack gap={6} p={4} bg="bg.subtle" rounded="xl" border="1px solid" borderColor="border.muted">
    ...
    <Text fontSize="2xl" fontWeight="bold" color="fg.success">
    ...
    <Text fontSize="2xl" fontWeight="bold" color="fg.warning">
    ...
    <Text fontSize="2xl" fontWeight="bold" color="fg.error">
</HStack>
```

---

### 2. 硬編碼的 Palette 顏色值

**位置**: 多處

```tsx
// ❌ 不理想 - 使用 palette 顏色值
color="gray.900"
color="gray.600"
color="gray.500"
color="blue.500"
color="green.600"
color="orange.600"
color="red.500"
bg="gray.50"
bg="gray.100"
bg="gray.800"
borderColor="gray.200"
borderColor="gray.700"
```

**問題**: 
- Palette 顏色值不會自動適應 dark mode
- 應使用 semantic tokens 確保一致性

**修復建議**:
```tsx
// ✅ 正確 - 使用 semantic tokens
color="fg.default"          // gray.900
color="fg.muted"           // gray.600
color="fg.subtle"          // gray.500
color="fg.success"         // green.600
color="fg.warning"         // orange.600
color="fg.error"           // red.500
bg="bg.subtle"             // gray.50
bg="bg.muted"              // gray.100
borderColor="border.muted" // gray.200
borderColor="border.emphasized" // gray.700
```

---

### 3. 重複的 Input 樣式模式

**位置**: Accounts.tsx 和 BalanceAdjustDialog.tsx 多處

```tsx
// ❌ 不理想 - 重複的樣式定義
<Input
    bg={inputBg}
    borderColor={inputBorderColor}
    rounded="xl"
    h={12}
    _focus={{
        borderColor: inputFocusBorderColor,
        boxShadow: `0 0 0 3px ${inputFocusBorderColor}20`,
    }}
    fontFamily="mono"
    transition="all 0.2s"
/>
```

**問題**: 
- 相同的 Input 樣式在多處重複定義
- 維護困難，容易不一致

**修復建議**:
```tsx
// ✅ 正確 - 提取為 recipe 或 variant
// 在 theme.ts 中定義
const inputRecipe = defineRecipe({
    base: {
        rounded: 'xl',
        h: 12,
        fontFamily: 'mono',
        transition: 'all 0.2s',
        bg: 'bg.subtle',
        borderColor: 'border.muted',
        _focus: {
            borderColor: 'focus.ring',
            boxShadow: '0 0 0 3px focus.ring/20',
        },
    },
});

// 在組件中使用
<Input recipe="inputRecipe" />
```

---

### 4. 缺少響應式斷點

**位置**: [`Accounts.tsx`](src/pages/Accounts.tsx:389) 第 389-412 行

```tsx
// ❌ 不理想 - 統計區塊缺少響應式設計
<HStack gap={6} p={4} bg={...} rounded="xl" border="1px solid" borderColor={...}>
    <VStack align="start" gap={0}>
        <Text fontSize="sm" color={...}>總 Apple ID 數</Text>
        <Text fontSize="2xl" fontWeight="bold" color={...}>{accounts.length}</Text>
    </VStack>
    ...
</HStack>
```

**問題**: 
- 在小螢幕上可能會溢出
- 應添加響應式斷點

**修復建議**:
```tsx
// ✅ 正確 - 添加響應式斷點
<SimpleGrid columns={{ base: 2, md: 4 }} gap={4} p={4} bg="bg.subtle" rounded="xl">
    <VStack align="start" gap={0}>
        <Text fontSize={{ base: "xs", md: "sm" }} color="fg.muted">總 Apple ID 數</Text>
        <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="fg.default">
            {accounts.length}
        </Text>
    </VStack>
    ...
</SimpleGrid>
```

---

### 5. AccountCard.tsx 缺少 hover 狀態的 borderColor

**位置**: [`AccountCard.tsx`](src/components/accounts/AccountCard.tsx:71) 第 71 行

```tsx
// ❌ 不完整 - hover 狀態只改變 shadow 和 transform
_hover={{ shadow: '2xl', transform: 'translateY(-2px)' }}
```

**問題**: 
- 定義了 `cardHoverBorderColor` 但未使用
- 應添加 borderColor 變化以增強視覺反饋

**修復建議**:
```tsx
// ✅ 正確 - 添加 borderColor 變化
_hover={{ 
    shadow: '2xl', 
    transform: 'translateY(-2px)',
    borderColor: 'border.emphasized',
}}
```

---

### 6. BalanceAdjustDialog.tsx 使用 `/` 語法的透明度

**位置**: [`BalanceAdjustDialog.tsx`](src/components/accounts/BalanceAdjustDialog.tsx:48) 第 48-49 行

```tsx
// ⚠️ 需確認 - Chakra v3 的透明度語法
const infoBoxBg = useColorModeValue('blue.50/50', 'blue.900/20');
const previewBoxBg = useColorModeValue('gray.100/80', 'gray.800/50');
```

**問題**: 
- Chakra v3 支援 `/` 語法的透明度，但應確認是否正確應用
- 建議使用 semantic tokens 替代

**修復建議**:
```tsx
// ✅ 正確 - 使用 semantic tokens
bg="bg.info"      // 定義為 blue.50/50 (light) / blue.900/20 (dark)
bg="bg.preview"   // 定義為 gray.100/80 (light) / gray.800/50 (dark)
```

---

## 🟢 Optional - 可選優化

### 1. 提取 AccountCard 為獨立 Recipe

**位置**: [`AccountCard.tsx`](src/components/accounts/AccountCard.tsx:61) 第 61-72 行

```tsx
// 可提取為 recipe
<Box
    p={5}
    bg={cardBg}
    backdropFilter="blur(20px)"
    border="1px solid"
    borderColor={cardBorderColor}
    rounded="xl"
    shadow="xl"
    overflow="hidden"
    transition="all"
    _hover={{ shadow: '2xl', transform: 'translateY(-2px)' }}
>
```

**建議**:
```tsx
// 在 theme.ts 中定義
const cardRecipe = defineRecipe({
    base: {
        p: 5,
        backdropFilter: 'blur(20px)',
        border: '1px solid',
        borderColor: 'border.muted',
        rounded: 'xl',
        shadow: 'xl',
        overflow: 'hidden',
        transition: 'all',
    },
    variants: {
        hover: {
            true: {
                _hover: { 
                    shadow: '2xl', 
                    transform: 'translateY(-2px)',
                    borderColor: 'border.emphasized',
                },
            },
        },
    },
});
```

---

### 2. 使用 ButtonGroup 統一篩選按鈕

**位置**: [`Accounts.tsx`](src/pages/Accounts.tsx:357) 第 357-385 行

```tsx
// ❌ 不理想 - 多個獨立按鈕
<HStack gap={2}>
    <Button size="sm" variant={balanceFilter === 'all' ? 'solid' : 'outline'} ...>全部</Button>
    <Button size="sm" variant={balanceFilter === 'low' ? 'solid' : 'outline'} ...>餘額不足</Button>
    <Button size="sm" variant={balanceFilter === 'negative' ? 'solid' : 'outline'} ...>餘額為負</Button>
</HStack>
```

**建議**:
```tsx
// ✅ 正確 - 使用 ButtonGroup 或 SegmentGroup
<SegmentGroup.Root value={balanceFilter} onValueChange={(e) => setBalanceFilter(e.value)}>
    <SegmentGroup.Indicator />
    <SegmentGroup.Items items={[
        { value: 'all', label: '全部' },
        { value: 'low', label: '餘額不足' },
        { value: 'negative', label: '餘額為負' },
    ]} />
</SegmentGroup.Root>
```

---

### 3. 提取統計區塊為獨立組件

**位置**: [`Accounts.tsx`](src/pages/Accounts.tsx:389) 第 389-412 行

```tsx
// 可提取為獨立組件
<AccountsStats 
    total={accounts.length}
    totalBalance={accounts.reduce((sum, a) => sum + (a.balance || 0), 0)}
    lowBalance={accounts.filter(a => a.balance >= 0 && a.balance < 100).length}
    negativeBalance={accounts.filter(a => a.balance < 0).length}
/>
```

---

## 📊 問題統計

| 級別 | 數量 | 說明 |
|------|------|------|
| 🔴 Critical | 3 | 必須修復 |
| 🟡 Improvements | 6 | 建議改進 |
| 🟢 Optional | 3 | 可選優化 |

---

## 🎯 修復優先級

1. **P0 - 立即修復**: 移除所有 `useColorModeValue` 調用，改用 semantic tokens
2. **P1 - 高優先級**: 修復硬編碼 hex 顏色值和動態顏色拼接
3. **P2 - 中優先級**: 提取重複樣式為 recipes
4. **P3 - 低優先級**: 組件提取和響應式優化

---

## 📝 Semantic Tokens 建議

根據審查結果，建議在 theme 中定義以下 semantic tokens：

```tsx
const theme = {
    semanticTokens: {
        colors: {
            // Background
            'bg.panel': { value: { _light: 'white', _dark: 'gray.800' } },
            'bg.subtle': { value: { _light: 'gray.50', _dark: 'gray.900' } },
            'bg.muted': { value: { _light: 'gray.100', _dark: 'gray.800' } },
            'bg.info': { value: { _light: 'blue.50/50', _dark: 'blue.900/20' } },
            'bg.preview': { value: { _light: 'gray.100/80', _dark: 'gray.800/50' } },
            
            // Foreground
            'fg.default': { value: { _light: 'gray.900', _dark: 'white' } },
            'fg.muted': { value: { _light: 'gray.600', _dark: 'gray.300' } },
            'fg.subtle': { value: { _light: 'gray.500', _dark: 'gray.400' } },
            'fg.success': { value: { _light: 'green.600', _dark: 'green.400' } },
            'fg.warning': { value: { _light: 'orange.600', _dark: 'orange.400' } },
            'fg.error': { value: { _light: 'red.600', _dark: 'red.400' } },
            
            // Border
            'border.muted': { value: { _light: 'gray.200', _dark: 'gray.700' } },
            'border.emphasized': { value: { _light: 'gray.300', _dark: 'gray.600' } },
            
            // Focus
            'focus.ring': { value: { _light: 'blue.400', _dark: 'blue.300' } },
            
            // Gradient
            'gradient.primary': { 
                value: { 
                    _light: 'linear-gradient(90deg, blue.500 0%, purple.500 100%)',
                    _dark: 'linear-gradient(90deg, blue.400 0%, purple.400 100%)',
                } 
            },
        },
    },
};
```

---

## 總結

Accounts 頁面的 Chakra UI styling 存在與 Dashboard 頁面相同的問題模式，主要是使用了 v2 的 `useColorModeValue` 模式。修復這些問題將：

1. **提升 Dark Mode 支援** - Semantic tokens 會自動適應 color mode
2. **降低維護成本** - 統一的 token 系統更容易維護
3. **提升一致性** - 與 Chakra v3 設計系統保持一致
4. **改善效能** - 減少不必要的 hook 調用

建議在修復 Dashboard 頁面後，一併修復 Accounts 頁面，確保整個應用程式的 styling 一致性。
