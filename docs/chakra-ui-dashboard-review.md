# Dashboard 頁面 Chakra UI v3 審查報告

**審查日期**: 2026-05-23  
**審查範圍**: Dashboard.tsx 及相關組件  
**Chakra UI 版本**: v3.35.0  
**框架**: Vite + React

---

## 執行摘要

本次審查發現 **4 個 Critical 問題**、**8 個 Improvements 建議**、**3 個 Optional 優化**。主要問題集中在使用 Chakra v2 的 `useColorModeValue` 模式，以及硬編碼顏色值而非使用 semantic tokens。

---

## 🔴 Critical - 必須修復

### 1. 使用 v2 的 `useColorModeValue` 模式

**影響範圍**: 所有 4 個文件  
**問題**: Chakra v3 應使用 semantic tokens 自動處理 dark mode，而非 `useColorModeValue`

**Dashboard.tsx** (第 9, 16-30 行):
```tsx
// ❌ 錯誤 - v2 模式
import { useColorModeValue } from '@/components/ui/color-mode';

const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
```

```tsx
// ✅ 正確 - v3 semantic tokens
// 直接在組件中使用 semantic tokens
<Box bg="bg.panel" borderColor="border.emphasized">
```

**修復建議**:
- 移除所有 `useColorModeValue` 調用
- 使用 semantic tokens: `bg.subtle`, `bg.panel`, `fg.muted`, `border.emphasized` 等
- Chakra v3 的 semantic tokens 會自動根據 color mode 切換

---

### 2. WarningCard.tsx 中違反 Hooks 規則

**位置**: [`WarningCard.tsx`](src/components/dashboard/WarningCard.tsx:51) 第 51-54 行

```tsx
// ❌ 錯誤 - 在函數內調用 hooks
const getWarningColors = (colorPalette: string) => ({
  bg: useColorModeValue(`${colorPalette}.50`, `${colorPalette}.900/20`),
  border: useColorModeValue(`${colorPalette}.200`, `${colorPalette}.500/50`),
});

const warningColors = getWarningColors(warning.colorPalette); // 在渲染時調用
```

**問題**: React Hooks 不能在普通函數中調用，只能在組件頂層調用。

**修復建議**:
```tsx
// ✅ 正確 - 直接使用 semantic tokens 或在組件頂層定義
const warningColors = {
  red: { bg: 'bg.error', border: 'border.error' },
  orange: { bg: 'bg.warning', border: 'border.warning' },
  yellow: { bg: 'bg.caution', border: 'border.caution' },
};

const colors = warningColors[warning.colorPalette];
```

---

### 3. BalanceTrendChart.tsx 硬編碼 Hex 顏色值

**位置**: [`BalanceTrendChart.tsx`](src/components/dashboard/BalanceTrendChart.tsx:25) 第 25-35 行

```tsx
// ❌ 錯誤 - 硬編碼 hex 值，不支援 dark mode
const gridStroke = useColorModeValue('#E5E7EB', '#374151');
const axisStroke = useColorModeValue('#6B7280', '#9CA3AF');
const tooltipBg = useColorModeValue('#FFFFFF', '#1F2937');
const lineStroke = useColorModeValue('#3B82F6', '#60A5FA');
```

**問題**: 
- 硬編碼的 hex 值無法自動適應 dark mode
- 違反 Chakra v3 的 semantic token 原則
- 與設計系統不一致

**修復建議**:
```tsx
// ✅ 正確 - 使用 CSS 變數或 semantic tokens
// 在 theme 中定義 chart 專用的 semantic tokens
const chartTheme = {
  semanticTokens: {
    colors: {
      'chart.grid': { value: { _light: 'gray.200', _dark: 'gray.700' } },
      'chart.axis': { value: { _light: 'gray.500', _dark: 'gray.400' } },
      'chart.line': { value: { _light: 'blue.500', _dark: 'blue.400' } },
    }
  }
};

// 組件中使用
const gridStroke = 'chart.grid';
const lineStroke = 'blue.500'; // 或使用 colorPalette
```

---

### 4. 硬編碼漸變背景

**位置**: 
- [`Dashboard.tsx`](src/pages/Dashboard.tsx:162) 第 162, 202 行
- [`BalanceTrendChart.tsx`](src/components/dashboard/BalanceTrendChart.tsx:53) 第 53 行

```tsx
// ❌ 錯誤 - 硬編碼 CSS 變數路徑
bg="linear-gradient(to bottom right, var(--chakra-colors-blue-500/10), var(--chakra-colors-blue-600/5))"
```

**問題**: 
- 直接引用內部 CSS 變數結構
- 不符合 Chakra v3 API
- 難以維護

**修復建議**:
```tsx
// ✅ 正確 - 使用 Chakra 的 bgGradient prop
bgGradient="linear(to-br, blue.500/10, blue.600/5)"

// 或在 theme 中定義
layerStyles: {
  'card-hover': {
    bgGradient: 'linear(to-br, blue.500/10, blue.600/5)',
    opacity: 0,
    _groupHover: { opacity: 1 },
  }
}
```

---

## 🟡 Improvements - 建議改進

### 1. Token 使用不一致

**問題**: 混合使用 semantic tokens 和硬編碼值

**Dashboard.tsx**:
```tsx
// ❌ 不一致
const headerBg = useColorModeValue('white', 'bg.subtle'); // 混合
const cardBg = useColorModeValue('white', 'gray.900/40'); // 硬編碼 + opacity
```

**建議**: 統一使用 semantic tokens
```tsx
// ✅ 統一
bg="bg.panel"        // 卡片背景
bg="bg.subtle"       // 次要背景
bg="bg.emphasized"   // 強調背景
```

---

### 2. Color Mode 支援可簡化

**當前狀態**: 每個組件都需手動處理 color mode

**Dashboard.tsx** (第 16-30 行):
```tsx
// ❌ 冗餘 - 15 行代碼僅用於 color mode
const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
const headerTitleColor = useColorModeValue('gray.900', 'white');
// ... 更多
```

**建議**: 使用 semantic tokens 自動處理
```tsx
// ✅ 簡化 - semantic tokens 自動適應
<Box bg="bg.panel" borderColor="border" color="fg">
  <Text color="fg.emphasized">標題</Text>
  <Text color="fg.muted">描述</Text>
</Box>
```

---

### 3. Spacing Token 使用良好但可優化

**優點**: 已正確使用 token units (`p={6}`, `gap={4}`)

**可優化點**:
```tsx
// Dashboard.tsx 第 118 行
<VStack gap={{ base: 6, md: 10 }} ...>

// 建議: 在 theme 中定義 responsive spacing
const theme = {
  semanticTokens: {
    spacing: {
      'section-gap': { value: { base: '6', md: '10' } },
    }
  }
};

// 使用
<VStack gap="section-gap">
```

---

### 4. 重複的卡片結構

**位置**: [`Dashboard.tsx`](src/pages/Dashboard.tsx:148) 第 148-185, 188-226 行

**問題**: Total Balance 和 Monthly Expense 卡片結構幾乎相同

**建議**: 提取為 `KPICard` 組件
```tsx
// ✅ 提取為可重用組件
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  colorPalette?: string;
  prefix?: string;
}

function KPICard({ title, value, subtitle, icon, colorPalette = 'blue', prefix }: KPICardProps) {
  return (
    <Box
      bg="bg.panel"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="border.emphasized"
      rounded="xl"
      shadow="2xl"
      overflow="hidden"
      position="relative"
      role="group"
    >
      {/* Hover gradient */}
      <Box
        position="absolute"
        inset={0}
        bgGradient={`linear(to-br, ${colorPalette}.500/10, ${colorPalette}.600/5)`}
        opacity={0}
        _groupHover={{ opacity: 1 }}
        transition="opacity 0.5s"
        pointerEvents="none"
      />
      
      <Flex p={6} alignItems="center" justifyContent="space-between" pb={2}>
        <Text fontSize="sm" fontWeight="semibold" color={`${colorPalette}.600`} textTransform="uppercase">
          {title}
        </Text>
        <Box p={2} bg={`${colorPalette}.100`} rounded="xl">
          {icon}
        </Box>
      </Flex>
      
      <Box p={6} pt={0}>
        <Flex fontSize="4xl" fontWeight="black" color="fg" alignItems="baseline" gap={1.5}>
          {prefix && <Text fontSize="2xl" color="fg.muted">{prefix}</Text>}
          {value}
        </Flex>
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {subtitle}
        </Text>
      </Box>
    </Box>
  );
}
```

---

### 5. Badge 組件使用正確但可統一

**位置**: [`WarningCard.tsx`](src/components/dashboard/WarningCard.tsx:82) 第 82 行

```tsx
// ✅ 正確使用 colorPalette
<Badge colorPalette={warning.colorPalette}>
  {monthsLeft.toFixed(1)} 月
</Badge>
```

**建議**: 在 theme 中定義 badge variants
```tsx
const theme = {
  recipes: {
    Badge: {
      variants: {
        warning: {
          solid: {
            colorPalette: 'orange',
          },
          critical: {
            colorPalette: 'red',
          },
        },
      },
    },
  },
};
```

---

### 6. EmptyState 組件使用正確

**位置**: [`Dashboard.tsx`](src/pages/Dashboard.tsx:245) 第 245-254 行

```tsx
// ✅ 正確使用 compound components
<EmptyState.Root size="sm">
  <EmptyState.Content>
    <EmptyState.Indicator>
      <Icon as={CheckCircle} />
    </EmptyState.Indicator>
    <VStack textAlign="center" gap={1}>
      <EmptyState.Title>所有帳號餘額充足</EmptyState.Title>
    </VStack>
  </EmptyState.Content>
</EmptyState.Root>
```

**無需修改** - 這是正確的 v3 用法。

---

### 7. Icon 使用方式可改進

**位置**: 多處使用 `Box as={Icon}`

```tsx
// 當前用法
<Box as={Wallet} h={5} w={5} color="blue.600" />

// 建議: 使用 Icon 組件
<Icon as={Wallet} h={5} w={5} color="blue.600" />
```

**優點**: 語義更清晰，自動處理 accessibility

---

### 8. 響應式設計良好

**優點**: 已正確使用響應式 props

```tsx
// ✅ 正確的響應式設計
<Text fontSize={{ base: '2xl', md: '3xl' }}>
<VStack gap={{ base: 6, md: 10 }}>
<Grid templateColumns={{ md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}>
```

**無需修改** - 響應式設計符合最佳實踐。

---

## 🟢 Optional - 可選優化

### 1. 提取重複的卡片樣式為 Recipe

**建議**: 在 theme 中定義 `card` recipe

```tsx
const theme = {
  recipes: {
    Card: {
      base: {
        bg: 'bg.panel',
        backdropFilter: 'blur(20px)',
        border: '1px solid',
        borderColor: 'border.emphasized',
        rounded: 'xl',
        shadow: '2xl',
        overflow: 'hidden',
        position: 'relative',
      },
      variants: {
        variant: {
          elevated: {
            shadow: '2xl',
          },
          outlined: {
            shadow: 'none',
            borderColor: 'border',
          },
        },
      },
    },
  },
};
```

---

### 2. 提取 Warning Level 邏輯為自定義 Hook

**位置**: [`WarningCard.tsx`](src/components/dashboard/WarningCard.tsx:19) 第 19-39 行

```tsx
// ✅ 提取為 hook
function useWarningLevel(monthsLeft: number) {
  const isDark = useColorModeValue(false, true);
  
  return useMemo(() => {
    if (monthsLeft < 0.5) {
      return { level: 'critical', colorPalette: 'red' };
    } else if (monthsLeft < 1.5) {
      return { level: 'warning', colorPalette: 'orange' };
    } else {
      return { level: 'normal', colorPalette: 'yellow' };
    }
  }, [monthsLeft]);
}
```

---

### 3. 添加 TypeScript 類型定義

**建議**: 為重複使用的類型創建共享定義

```tsx
// types/dashboard.ts
export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  colorPalette?: 'blue' | 'green' | 'red' | 'orange';
  prefix?: string;
}

export interface WarningLevel {
  level: 'critical' | 'warning' | 'normal';
  colorPalette: 'red' | 'orange' | 'yellow';
}
```

---

## 組件合規性檢查表

| 組件 | v3 API | Semantic Tokens | Color Mode | Spacing | Accessibility |
|------|--------|-----------------|------------|---------|---------------|
| Dashboard.tsx | ⚠️ v2 模式 | ❌ 硬編碼 | ⚠️ 手動處理 | ✅ 正確 | ✅ 良好 |
| BalanceTrendChart.tsx | ⚠️ v2 模式 | ❌ Hex 值 | ⚠️ 手動處理 | ✅ 正確 | ✅ 良好 |
| QuickActions.tsx | ⚠️ v2 模式 | ⚠️ 部分 | ⚠️ 手動處理 | ✅ 正確 | ✅ 良好 |
| WarningCard.tsx | ⚠️ v2 模式 | ⚠️ 部分 | ❌ Hooks 錯誤 | ✅ 正確 | ✅ 良好 |

---

## 修復優先級

### P0 - 立即修復
1. **WarningCard.tsx Hooks 錯誤** - 違反 React 規則，可能導致運行時錯誤
2. **移除所有 `useColorModeValue`** - 升級到 v3 semantic tokens

### P1 - 本週修復
3. **BalanceTrendChart 硬編碼顏色** - 替換為 semantic tokens
4. **統一 Token 使用** - 確保所有顏色使用 semantic tokens

### P2 - 下個迭代
5. **提取 KPICard 組件** - 減少代碼重複
6. **創建 Card Recipe** - 統一卡片樣式

---

## Semantic Tokens 對照表

建議使用的 semantic tokens:

| 當前用法 | Semantic Token | 用途 |
|---------|---------------|------|
| `useColorModeValue('white', 'gray.900')` | `bg.panel` | 卡片背景 |
| `useColorModeValue('gray.200', 'gray.700')` | `border` | 邊框 |
| `useColorModeValue('gray.900', 'white')` | `fg` | 主要文字 |
| `useColorModeValue('gray.600', 'gray.300')` | `fg.muted` | 次要文字 |
| `useColorModeValue('blue.100', 'blue.500/10')` | `bg.accent` | 強調背景 |
| `useColorModeValue('red.50', 'red.900/20')` | `bg.error` | 錯誤背景 |

---

## 總結

Dashboard 頁面的 Chakra UI 實現存在以下主要問題：

1. **v2 遺留模式**: 大量使用 `useColorModeValue`，應遷移到 v3 semantic tokens
2. **硬編碼顏色**: 特別是 BalanceTrendChart 中的 hex 值
3. **Hooks 規則違反**: WarningCard 中的動態 hooks 調用

**優點**:
- 響應式設計良好
- Spacing 使用正確
- Compound components 使用正確
- Accessibility 基本良好

**下一步行動**:
1. 創建 semantic tokens 配置
2. 移除所有 `useColorModeValue`
3. 修復 WarningCard hooks 錯誤
4. 提取重複組件

---

**審查完成時間**: 2026-05-23 11:35 HKT
