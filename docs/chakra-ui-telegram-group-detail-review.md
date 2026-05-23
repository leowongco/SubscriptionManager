# TelegramGroupDetail.tsx - Chakra UI v3 審查報告

**審查日期**: 2026-05-23  
**審查範圍**: Token 使用、Semantic Tokens、Color Mode 支援、Spacing 一致性  
**Chakra UI 版本**: v3

---

## 審查摘要

| 類別 | Critical | Improvements | Optional |
|------|----------|--------------|----------|
| 數量 | 2 | 8 | 3 |

---

## Critical Issues

### 1. Hooks 在渲染週期中被錯誤調用

**位置**: [`src/pages/TelegramGroupDetail.tsx:355`](src/pages/TelegramGroupDetail.tsx:355), [`src/pages/TelegramGroupDetail.tsx:364`](src/pages/TelegramGroupDetail.tsx:364), [`src/pages/TelegramGroupDetail.tsx:398`](src/pages/TelegramGroupDetail.tsx:398), [`src/pages/TelegramGroupDetail.tsx:408`](src/pages/TelegramGroupDetail.tsx:408)

**問題**: 在 JSX 的屬性中直接調用 `useColorModeValue()`，這違反了 React Hooks 規則。Hooks 不能在條件語句、循環或嵌套函數中調用。

```tsx
// ❌ 錯誤 - 在 JSX 屬性中調用 hook
<Table.Row bg={useColorModeValue('gray.50', 'gray.900')}>

// ✅ 正確 - 在組件頂層調用
const tableHeaderBg = useColorModeValue('gray.50', 'gray.900');
// 然後在 JSX 中使用
<Table.Row bg={tableHeaderBg}>
```

**影響**: 可能導致 React 運行時錯誤或不可預測的行為。

---

### 2. 使用 v2 的 `useColorModeValue` 模式

**位置**: [`src/pages/TelegramGroupDetail.tsx:20`](src/pages/TelegramGroupDetail.tsx:20)

**問題**: 導入並使用了 Chakra UI v2 的 `useColorModeValue` hook。在 v3 中，應該使用 semantic tokens 自動處理 dark mode。

```tsx
// ❌ v2 模式
import { useColorModeValue } from '@/components/ui/color-mode';
const headerBg = useColorModeValue('white', 'bg.subtle');

// ✅ v3 模式 - 直接使用 semantic tokens
<Box bg="bg.subtle">  // 自動支援 dark mode
```

**影響**: 代碼冗餘，無法充分利用 v3 的 semantic token 系統。

---

## Improvements

### 3. 硬編碼 Hex 顏色值

**位置**: [`src/pages/TelegramGroupDetail.tsx:36`](src/pages/TelegramGroupDetail.tsx:36)

**問題**: 使用帶透明度的硬編碼顏色值 `'gray.900/40'`，這不是標準的 semantic token。

```tsx
// ❌ 硬編碼透明度
const cardBg = useColorModeValue('white', 'gray.900/40');

// ✅ 使用 semantic token
<Box bg="bg.subtle" opacity={0.4}>
// 或在 theme 中定義自定義 token
```

---

### 4. 直接使用 Palette 顏色

**位置**: 多處

| 行號 | 顏色 | 建議替代 |
|------|------|----------|
| 157 | `blue.400` | `fg.info` 或 `colorPalette.fg` |
| 223 | `blue.400` | `fg.info` |
| 281 | `blue.400` | `fg.info` |
| 301 | `green.400` | `fg.success` |
| 321 | `orange.400` | `fg.warning` |
| 346 | `blue.500` | `bg.info` 或 `colorPalette.solid` |
| 389 | `blue.500` | `bg.info` |
| 416-417 | `green.400` | `fg.success` |
| 421-422 | `red.400` | `fg.error` |

**問題**: 直接使用 palette 顏色（如 `blue.400`）不支援 dark mode，且無法透過 theme 統一管理。

```tsx
// ❌ 直接使用 palette
<Spinner color="blue.400" />

// ✅ 使用 semantic token
<Spinner color="fg.info" />
```

---

### 5. 混合使用硬編碼和 Semantic Tokens

**位置**: [`src/pages/TelegramGroupDetail.tsx:31-44`](src/pages/TelegramGroupDetail.tsx:31-44)

**問題**: 同一變量定義中混合使用硬編碼值和 semantic tokens。

```tsx
// ❌ 混合使用
const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');

// ✅ 統一使用 semantic tokens
// 在 theme 中定義：
// bg: { header: { value: { base: 'white', _darkMode: 'bg.subtle' } } }
// border: { header: { value: { base: 'gray.200', _darkMode: 'gray.700' } } }
```

---

### 6. 使用原生 `<a>` 標籤

**位置**: [`src/pages/TelegramGroupDetail.tsx:224-233`](src/pages/TelegramGroupDetail.tsx:224-233)

**問題**: 使用原生 `<a>` 標籤而非 Chakra 的 `Link` 組件。

```tsx
// ❌ 原生 a 標籤
<a href={group.telegram_link} target="_blank" rel="noopener noreferrer">
  <Text color="blue.400">Telegram 群組</Text>
</a>

// ✅ 使用 Chakra Link
import { Link } from '@chakra-ui/react';
<Link 
  href={group.telegram_link} 
  target="_blank" 
  rel="noopener noreferrer"
  color="fg.info"
>
  Telegram 群組
</Link>
```

---

### 7. 表格樣式重複

**位置**: [`src/pages/TelegramGroupDetail.tsx:336-374`](src/pages/TelegramGroupDetail.tsx:336-374), [`src/pages/TelegramGroupDetail.tsx:379-433`](src/pages/TelegramGroupDetail.tsx:379-433)

**問題**: 兩個表格使用完全相同的容器樣式，應該提取為可重用組件或 recipe。

```tsx
// 重複的樣式模式
<Box
  rounded="3xl"
  border="1px solid"
  borderColor={tableBorderColor}
  bg={tableBg}
  backdropFilter="blur(20px)"
  overflow="hidden"
  shadow="2xl"
>
  <Box h={1.5} w="full" bg="blue.500" />
  {/* ... */}
</Box>
```

---

### 8. Icon 使用 `Box as={Icon}` 模式

**位置**: 多處（第 208, 223, 248, 263, 281, 301, 321, 416, 421 行）

**問題**: 使用 `Box as={Icon}` 而非 Chakra 的 `Icon` 組件。

```tsx
// ❌ Box as={Icon}
<Box as={ArrowLeft} w={4} h={4} />

// ✅ 使用 Icon 組件
import { Icon } from '@chakra-ui/react';
<Icon as={ArrowLeft} boxSize={4} />
```

---

### 9. 缺少響應式斷點

**位置**: [`src/pages/TelegramGroupDetail.tsx:272`](src/pages/TelegramGroupDetail.tsx:272)

**問題**: `SimpleGrid` 的 `columns` 只定義了 `base` 和 `md`，缺少 `lg` 和 `xl` 斷點。

```tsx
// ❌ 缺少完整斷點
<SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>

// ✅ 完整響應式定義
<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
```

---

### 10. 按鈕內使用 `HStack` 包裹圖標和文字

**位置**: [`src/pages/TelegramGroupDetail.tsx:207-210`](src/pages/TelegramGroupDetail.tsx:207-210), [`src/pages/TelegramGroupDetail.tsx:247-250`](src/pages/TelegramGroupDetail.tsx:247-250), [`src/pages/TelegramGroupDetail.tsx:262-265`](src/pages/TelegramGroupDetail.tsx:262-265)

**問題**: Button 組件內部使用 `HStack` 包裹圖標和文字，增加了不必要的嵌套。

```tsx
// ❌ 不必要的嵌套
<Button>
  <HStack gap={2}>
    <Box as={Calendar} w={4} h={4} />
    <Text>生成貼文</Text>
  </HStack>
</Button>

// ✅ 直接使用 Button 的 children
<Button gap={2}>
  <Icon as={Calendar} boxSize={4} />
  生成貼文
</Button>
```

---

## Optional Suggestions

### 11. 提取 InfoCard 組件

**位置**: [`src/pages/TelegramGroupDetail.tsx:273-331`](src/pages/TelegramGroupDetail.tsx:273-331)

**建議**: 三個信息卡片（扣費日、關聯 Apple ID、收費週期）使用相同的結構，可以提取為 `InfoCard` 組件。

```tsx
// 提取為可重用組件
interface InfoCardProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
}

function InfoCard({ icon: Icon, iconColor, label, value }: InfoCardProps) {
  return (
    <Box p={5} bg="bg.subtle" rounded="xl" border="1px" borderColor="border.subtle">
      <HStack gap={3}>
        <Icon boxSize={8} color={iconColor} />
        <VStack align="start" gap={1}>
          <Text fontSize="sm" color="fg.muted">{label}</Text>
          <Text fontSize="xl" fontWeight="bold">{value}</Text>
        </VStack>
      </HStack>
    </Box>
  );
}
```

---

### 12. 建立 TableContainer Recipe

**建議**: 為重複的表格容器樣式建立 slot recipe。

```tsx
// theme/recipes.ts
export const tableContainerRecipe = defineSlotRecipe({
  slots: ['root', 'headerBar', 'content'],
  base: {
    root: {
      rounded: '3xl',
      border: '1px solid',
      borderColor: 'border.subtle',
      bg: 'bg.subtle',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
      shadow: '2xl',
    },
    headerBar: {
      h: 1.5,
      w: 'full',
      bg: 'bg.info',
    },
  },
});
```

---

### 13. 使用 ColorPalette 統一品牌色

**建議**: 為頁面定義統一的 colorPalette，而非散落各處的 `blue.400`。

```tsx
// 在頁面頂層或 theme 中定義
<Box colorPalette="blue">
  {/* 所有子組件自動繼承 colorPalette */}
  <Button colorPalette="blue">...</Button>
  <Badge colorPalette="blue">...</Badge>
</Box>
```

---

## Token 使用統計

| 類型 | 使用次數 | 正確使用 | 需改進 |
|------|----------|----------|--------|
| Semantic Tokens | 3 | 1 | 2 |
| Palette Colors | 15 | 0 | 15 |
| Hardcoded Values | 2 | 0 | 2 |
| Spacing Tokens | 28 | 28 | 0 |

---

## Dark Mode 支援評估

| 元素 | 支援狀態 | 問題 |
|------|----------|------|
| 背景 | ⚠️ 部分 | 使用 `useColorModeValue` 而非 semantic tokens |
| 文字 | ⚠️ 部分 | 混合使用 semantic 和 palette 顏色 |
| 邊框 | ⚠️ 部分 | 使用硬編碼顏色值 |
| 圖標 | ❌ 不支援 | 直接使用 palette 顏色 |
| 表格 | ⚠️ 部分 | Hooks 調用位置錯誤 |

---

## 修復優先級建議

1. **立即修復 (Critical)**
   - 移除 JSX 屬性中的 `useColorModeValue` 調用
   - 遷移到 v3 semantic tokens

2. **短期改進 (Improvements)**
   - 替換所有 palette 顏色為 semantic tokens
   - 使用 Chakra `Link` 組件替代原生 `<a>`
   - 統一 Icon 組件使用方式

3. **長期優化 (Optional)**
   - 提取 InfoCard 組件
   - 建立 TableContainer recipe
   - 統一 colorPalette 管理

---

## 總結

此頁面存在典型的 Chakra UI v2 到 v3 遷移未完成的問題。主要問題集中在：

1. **過度依賴 `useColorModeValue`** - 這是 v2 的核心模式，在 v3 中應該使用 semantic tokens
2. **硬編碼顏色值** - 直接使用 palette 顏色（如 `blue.400`）無法支援 dark mode
3. **Hooks 調用位置錯誤** - 在 JSX 屬性中調用 hooks 違反 React 規則

建議優先處理 Critical 問題，確保代碼符合 React 和 Chakra UI v3 最佳實踐。
