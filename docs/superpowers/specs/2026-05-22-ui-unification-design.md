# UI 統一設計規格

## 一、概述

### 1.1 目標
全面統一系統 UI，以 Services 頁面為標準，確保所有頁面在視覺設計、交互模式和代碼實現上保持一致。

### 1.2 範圍
需要統一的頁面：
- Dashboard.tsx
- Mapping.tsx
- TelegramGroupDetail.tsx
- Accounts.tsx
- Recharge.tsx
- TelegramGroups.tsx

### 1.3 設計標準來源
Services.tsx 頁面的設計規範（參見前期分析報告）

---

## 二、Services 頁面設計標準

### 2.1 頁面結構模式
**標準結構**：
- **Header Section**：大標題 + 描述文字 + 主要操作按鈕
- **Content Section**：表格或卡片列表展示數據
- **容器**：`VStack gap={10} maxW="7xl" mx="auto" pb={10} align="stretch"`

### 2.2 UI 組件規範

#### Header 組件標準
```tsx
<Box
  position="relative"
  overflow="hidden"
  rounded="3xl"
  bg={headerBg}
  border="1px solid"
  borderColor={headerBorderColor}
  p={8}
  shadow="2xl"
  backdropFilter="blur(20px)"
>
  <Flex justify="space-between" alignItems="center">
    <Box>
      <Text fontSize="3xl" fontWeight="black" letterSpacing="tight">
        標題
      </Text>
      <Text color={headerTextColor} mt={2} fontSize="sm" fontWeight="medium">
        描述文字
      </Text>
    </Box>
    <Button colorPalette="blue" rounded="xl" h={12} px={6} shadow="lg">
      操作按鈕
    </Button>
  </Flex>
</Box>
```

#### 表格組件標準
```tsx
<Box
  rounded="3xl"
  border="1px solid"
  borderColor={tableBorderColor}
  bg={tableBg}
  backdropFilter="blur(20px)"
  overflow="hidden"
  shadow="2xl"
>
  <Box h={1.5} w="full" bg="blue.500" /> {/* 頂部色條 */}
  <Table.Root>
    {/* 表格內容 */}
  </Table.Root>
</Box>
```

#### 對話框標準
```tsx
<DialogContent
  maxW="450px"
  bg={dialogBg}
  backdropFilter="blur(40px)"
  color={dialogColor}
  borderColor={dialogBorderColor}
  rounded="2xl"
  shadow="2xl"
>
  {/* 表單內容 */}
</DialogContent>
```

### 2.3 樣式系統

#### 顏色系統
- **主色**：`blue` (blue.500, blue.400)
- **輔助色**：`purple` (用於 yearly badge)
- **警告色**：`orange` (未來價格調整)
- **危險色**：`red` (刪除操作)
- **成功色**：`green` (未使用，但應保留)

#### 間距系統
- **頁面級間距**：`gap={10}`
- **卡片內間距**：`p={8}` (header), `p={6}` (table cell)
- **按鈕尺寸**：`h={12} px={6}` (主要), `h={11}` (次要)
- **圓角**：`rounded="3xl"` (大型容器), `rounded="2xl"` (對話框), `rounded="xl"` (按鈕/輸入框)

#### 字體系統
- **標題**：`fontSize="3xl" fontWeight="black" letterSpacing="tight"`
- **副標題**：`fontSize="sm" fontWeight="medium"`
- **標籤**：`fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider"`
- **數值**：`fontFamily="mono" fontWeight="bold"`

### 2.4 交互模式
- **懸停效果**：`_hover={{ transform: 'scale(1.02)' }}` (按鈕)
- **過渡動畫**：`transition="all"`
- **焦點狀態**：`_focus={{ borderColor: 'blue.500/50' }}`

### 2.5 響應式設計標準
- **字體**：`fontSize={{ base: '2xl', md: '3xl' }}`
- **間距**：`gap={{ base: 6, md: 10 }}`
- **容器**：`maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }}`

---

## 三、分階段實施計劃

### Phase 1：基礎統一（1-2 天）

#### 3.1.1 移除 AI Slop 元素

**Dashboard.tsx**
- 移除漸變背景（`from-indigo-900/40 via-purple-900/20`）
- 移除裝飾性模糊圓形（`blur-[80px]` 圓形）
- 移除 emoji 作為設計元素

**Mapping.tsx**
- 移除 emerald/teal 漸變模糊圓形
- 移除裝飾性背景元素

#### 3.1.2 統一顏色主題

**Mapping.tsx**
- 將所有 `emerald` 改為 `blue`
- 將所有 `teal` 改為 `blue`
- 更新相關的顏色變量

**Dashboard.tsx**
- 統一 KPI 卡片顏色
- 移除多色混亂，使用 blue 作為主色

#### 3.1.3 添加標準 Header Section

**TelegramGroupDetail.tsx**
- 添加標準 Header Section（參考 Services.tsx）
- 保留返回按鈕，但整合到 Header 中
- 使用標準的顏色變量和樣式

#### 3.1.4 支持亮色模式

**Mapping.tsx**
- 添加 `useColorModeValue` 定義顏色變量
- 移除硬編碼的 `gray.800`、`gray.900` 等
- 確保所有顏色都支持亮色/暗色模式

**TelegramGroupDetail.tsx**
- 添加 `useColorModeValue` 定義顏色變量
- 移除硬編碼的深色背景
- 確保所有顏色都支持亮色/暗色模式

---

### Phase 2：樣式統一（2-3 天）

#### 3.2.1 統一按鈕樣式

**標準按鈕樣式**：
```tsx
// 主要按鈕
<Button colorPalette="blue" rounded="xl" h={12} px={6} shadow="lg">
  主要操作
</Button>

// 次要按鈕
<Button variant="outline" rounded="xl" h={12} px={6}>
  次要操作
</Button>

// 小按鈕
<Button size="sm" variant="ghost" rounded="lg">
  小操作
</Button>
```

**需要統一的頁面**：
- Dashboard.tsx
- Mapping.tsx
- TelegramGroupDetail.tsx
- Accounts.tsx
- Recharge.tsx
- TelegramGroups.tsx

#### 3.2.2 統一卡片樣式

**標準卡片樣式**：
```tsx
<Box
  bg={cardBg}
  backdropFilter="blur(20px)"
  border="1px solid"
  borderColor={cardBorderColor}
  rounded="xl"
  shadow="xl"
  p={6}
>
  {/* 內容 */}
</Box>
```

**需要統一的組件**：
- Dashboard KPI 卡片
- AccountCard
- GroupCard
- BillingCycleCard

#### 3.2.3 統一響應式設計

**標準響應式模式**：
```tsx
// 字體
fontSize={{ base: '2xl', md: '3xl' }}

// 間距
gap={{ base: 6, md: 10 }}

// 容器
maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }}
```

**需要統一的頁面**：
- Services.tsx（添加響應式支持）
- 其他所有頁面（統一響應式標準）

#### 3.2.4 統一對話框樣式

**標準對話框樣式**：
```tsx
<DialogContent
  maxW="450px"
  bg={dialogBg}
  backdropFilter="blur(40px)"
  color={dialogColor}
  borderColor={dialogBorderColor}
  rounded="2xl"
  shadow="2xl"
>
  {/* 表單內容 */}
</DialogContent>
```

**需要統一的對話框**：
- CreateGroupDialog
- BalanceAdjustDialog
- Mapping 頁面的所有對話框

---

### Phase 3：結構優化（3-5 天）

#### 3.3.1 統一數據展示方式

**展示規則**：
- **列表數據**：優先使用表格（參考 Services.tsx）
- **概覽數據**：使用卡片（Dashboard 除外）
- **詳情數據**：使用表格 + 卡片組合

**需要調整的頁面**：
- Accounts.tsx：考慮是否改用表格展示帳戶列表
- TelegramGroups.tsx：考慮是否改用表格展示群組列表

#### 3.3.2 統一表格樣式

**標準表格樣式**：
```tsx
<Box
  rounded="3xl"
  border="1px solid"
  borderColor={tableBorderColor}
  bg={tableBg}
  backdropFilter="blur(20px)"
  overflow="hidden"
  shadow="2xl"
>
  <Box h={1.5} w="full" bg="blue.500" /> {/* 頂部色條 */}
  <Table.Root>
    {/* 表格內容 */}
  </Table.Root>
</Box>
```

**需要統一的表格**：
- Recharge.tsx 歷史記錄表格
- TelegramGroupDetail.tsx 的兩個表格

#### 3.3.3 優化組件結構

**Mapping.tsx**
- 簡化嵌套對話框結構
- 提取可重用組件
- 改善組件職責分離

**Dashboard.tsx**
- 優化 KPI 卡片組件
- 統一圖表樣式
- 改善數據流

#### 3.3.4 添加統一的空狀態組件

**標準空狀態**：
```tsx
<Box textAlign="center" py={10}>
  <Text color={textColor} fontSize="lg">
    暫無數據
  </Text>
  <Text color={textMutedColor} fontSize="sm" mt={2}>
    描述文字
  </Text>
</Box>
```

---

## 四、顏色變量定義

### 4.1 標準顏色變量

```tsx
// Header
const headerBg = useColorModeValue('white', 'gray.800');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
const headerTextColor = useColorModeValue('gray.600', 'gray.400');

// Table
const tableBg = useColorModeValue('white', 'gray.800');
const tableBorderColor = useColorModeValue('gray.200', 'gray.700');

// Card
const cardBg = useColorModeValue('white', 'gray.800');
const cardBorderColor = useColorModeValue('gray.200', 'gray.700');

// Dialog
const dialogBg = useColorModeValue('white', 'gray.800');
const dialogColor = useColorModeValue('gray.900', 'white');
const dialogBorderColor = useColorModeValue('gray.200', 'gray.700');

// Text
const textColor = useColorModeValue('gray.900', 'white');
const textMutedColor = useColorModeValue('gray.600', 'gray.400');
```

### 4.2 禁止使用的硬編碼顏色

❌ **禁止**：
- `bg="gray.800"`
- `bg="gray.900"`
- `color="white"` （在暗色模式下）
- `color="gray.900"` （在亮色模式下）

✅ **正確**：
- 使用 `useColorModeValue` 定義顏色變量
- 使用語義化的顏色名稱

---

## 五、驗收標準

### 5.1 Phase 1 驗收標準

- [ ] Dashboard 和 Mapping 頁面無 AI Slop 元素
- [ ] 所有頁面使用 blue 作為主色
- [ ] TelegramGroupDetail 有標準 Header Section
- [ ] Mapping 和 TelegramGroupDetail 支持亮色模式
- [ ] 所有頁面在亮色和暗色模式下都正常顯示

### 5.2 Phase 2 驗收標準

- [ ] 所有按鈕符合標準樣式
- [ ] 所有卡片符合標準樣式
- [ ] 所有頁面響應式設計一致
- [ ] 所有對話框符合標準樣式

### 5.3 Phase 3 驗收標準

- [ ] 數據展示方式統一
- [ ] 所有表格有頂部色條
- [ ] 組件結構清晰，職責分離
- [ ] 有統一的空狀態展示

---

## 六、風險與緩解措施

### 6.1 風險

1. **亮色模式兼容性**：部分頁面可能未完全支持亮色模式
   - **緩解**：使用 `useColorModeValue` 定義所有顏色變量

2. **響應式設計**：某些頁面可能在移動端顯示不佳
   - **緩解**：統一使用標準響應式模式，並在多種設備上測試

3. **組件依賴**：修改某個組件可能影響其他頁面
   - **緩解**：使用組件測試確保修改不會破壞現有功能

### 6.2 回滾計劃

每個 Phase 完成後創建 Git tag，如有問題可快速回滾：
- `phase-1-complete`
- `phase-2-complete`
- `phase-3-complete`

---

## 七、時間估算

| Phase | 預估時間 | 任務數量 |
|-------|---------|---------|
| Phase 1 | 1-2 天 | 4 個主要任務 |
| Phase 2 | 2-3 天 | 4 個主要任務 |
| Phase 3 | 3-5 天 | 4 個主要任務 |
| **總計** | **6-10 天** | **12 個主要任務** |

---

## 八、成功指標

1. **設計一致性**：> 90%（當前約 60%）
2. **AI Slop 問題**：0 個（當前 2 個頁面）
3. **亮色模式支持**：100%（當前約 70%）
4. **響應式設計**：100% 頁面支持
5. **代碼質量**：無硬編碼顏色，所有顏色使用變量
