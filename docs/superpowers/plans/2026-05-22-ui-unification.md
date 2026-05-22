# UI 統一實施計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面統一系統 UI，以 Services 頁面為標準

**Architecture:** 分三個階段實施：Phase 1 基礎統一、Phase 2 樣式統一、Phase 3 結構優化

**Tech Stack:** React, TypeScript, Chakra UI v3

---

## 文件結構映射

### Phase 1 文件
- `src/pages/Dashboard.tsx` - 統一 KPI 卡片顏色為 blue
- `src/pages/Mapping.tsx` - 移除 AI Slop，統一顏色，支持亮色模式
- `src/pages/TelegramGroupDetail.tsx` - 添加標準 Header，支持亮色模式

### Phase 2 文件
- 所有頁面文件 - 統一按鈕、卡片、響應式設計
- 所有對話框組件 - 統一對話框樣式

### Phase 3 文件
- `src/pages/Accounts.tsx` - 統一數據展示方式
- `src/pages/TelegramGroups.tsx` - 統一數據展示方式
- `src/pages/Recharge.tsx` - 統一表格樣式
- `src/pages/TelegramGroupDetail.tsx` - 統一表格樣式
- `src/pages/Mapping.tsx` - 優化組件結構
- `src/pages/Dashboard.tsx` - 優化組件結構

---

## Phase 1: 基礎統一（1-2 天）

### Task 1.1: 統一 Dashboard KPI 卡片顏色

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**目標:** 將所有 KPI 卡片的顏色統一為 blue，移除 indigo、teal 等多色混亂

- [ ] **Step 1: 統一總可用餘額卡片顏色**

找到第 118-156 行的「總可用餘額」卡片，將 `indigo` 改為 `blue`：

```tsx
// 原代碼（第 123 行）
borderColor={useColorModeValue('indigo.200', 'indigo.500/20')}

// 替換為
borderColor={useColorModeValue('blue.200', 'blue.500/20')}
```

```tsx
// 原代碼（第 140 行）
<Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color={useColorModeValue('indigo.700', 'indigo.400')} textTransform="uppercase" letterSpacing="wider">

// 替換為
<Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color={useColorModeValue('blue.700', 'blue.400')} textTransform="uppercase" letterSpacing="wider">
```

```tsx
// 原代碼（第 143 行）
<Box p={2} bg={useColorModeValue('indigo.100', 'indigo.500/10')} rounded={{ base: 'lg', md: 'xl' }}>

// 替換為
<Box p={2} bg={useColorModeValue('blue.100', 'blue.500/10')} rounded={{ base: 'lg', md: 'xl' }}>
```

```tsx
// 原代碼（第 144 行）
<Box as={Wallet} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color={useColorModeValue('indigo.600', 'indigo.400')} />

// 替換為
<Box as={Wallet} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color={useColorModeValue('blue.600', 'blue.400')} />
```

- [ ] **Step 2: 統一預估每月總支出卡片顏色**

找到第 158-197 行的「預估每月總支出」卡片，將 `teal` 改為 `blue`：

```tsx
// 原代碼（第 163 行）
borderColor={useColorModeValue('teal.200', 'teal.500/20')}

// 替換為
borderColor={useColorModeValue('blue.200', 'blue.500/20')}
```

```tsx
// 原代碼（第 170-178 行）
<Box
    position="absolute"
    inset={0}
    bg="linear-gradient(to bottom right, var(--chakra-colors-teal-500/10), var(--chakra-colors-teal-600/5))"
    opacity={0}
    _groupHover={{ opacity: 1 }}
    transition="opacity 0.5s"
    pointerEvents="none"
/>

// 替換為
<Box
    position="absolute"
    inset={0}
    bg="linear-gradient(to bottom right, var(--chakra-colors-blue-500/10), var(--chakra-colors-blue-600/5))"
    opacity={0}
    _groupHover={{ opacity: 1 }}
    transition="opacity 0.5s"
    pointerEvents="none"
/>
```

```tsx
// 原代碼（第 180 行）
<Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color={useColorModeValue('teal.700', 'teal.400')} textTransform="uppercase" letterSpacing="wider">

// 替換為
<Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color={useColorModeValue('blue.700', 'blue.400')} textTransform="uppercase" letterSpacing="wider">
```

```tsx
// 原代碼（第 183 行）
<Box p={2} bg={useColorModeValue('teal.100', 'teal.500/10')} rounded={{ base: 'lg', md: 'xl' }}>

// 替換為
<Box p={2} bg={useColorModeValue('blue.100', 'blue.500/10')} rounded={{ base: 'lg', md: 'xl' }}>
```

```tsx
// 原代碼（第 184 行）
<Box as={TrendingDown} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color={useColorModeValue('teal.600', 'teal.400')} />

// 替換為
<Box as={TrendingDown} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color={useColorModeValue('blue.600', 'blue.400')} />
```

- [ ] **Step 3: 驗證頁面正常顯示**

```bash
npm run dev
# 打開 http://localhost:5173 檢查 Dashboard 頁面
# 確認所有 KPI 卡片使用統一的 blue 色系
# 測試亮色/暗色模式切換
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/Dashboard.tsx
git commit -m "refactor(dashboard): unify KPI card colors to blue theme"
```

---

### Task 1.2: 移除 Mapping AI Slop 元素並支持亮色模式

**Files:**
- Modify: `src/pages/Mapping.tsx`

**目標:** 移除裝飾性模糊圓形，統一顏色為 blue，添加亮色模式支持

- [ ] **Step 1: 添加顏色變量定義**

在第 57 行 `export default function Mapping() {` 之後，添加顏色變量：

```tsx
export default function Mapping() {
    const { data: accounts, mutate: mutateAccounts } = useSWR<Account[]>('accounts', api.getAccounts);
    const { data: services } = useSWR<any[]>('services', api.getServices);

    // 添加以下顏色變量
    const headerBg = useColorModeValue('white', 'bg.subtle');
    const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
    const headerTitleColor = useColorModeValue('gray.900', 'white');
    const headerTextColor = useColorModeValue('gray.600', 'gray.300');
    
    const cardBg = useColorModeValue('white', 'gray.900/40');
    const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.900', 'white');
    const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
    const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
```

需要在文件頂部添加 import：

```tsx
// 在第 1 行之後添加
import { useColorModeValue } from '@/components/ui/color-mode';
```

- [ ] **Step 2: 移除裝飾性模糊圓形**

找到第 156-182 行的兩個裝飾性模糊圓形，完全刪除：

```tsx
// 刪除以下代碼（第 156-182 行）
{/* Decorative blur elements */}
<Box
    position="absolute"
    top={0}
    right={0}
    mt={-16}
    mr={-16}
    w={{ base: 48, md: 64 }}
    h={{ base: 48, md: 64 }}
    bg="emerald.500/10"
    filter={{ base: 'blur(80px)', md: 'blur(100px)' }}
    rounded="full"
    pointerEvents="none"
/>
<Box
    position="absolute"
    bottom={0}
    left={0}
    mb={-16}
    ml={-16}
    w={{ base: 48, md: 64 }}
    h={{ base: 48, md: 64 }}
    bg="teal.500/10"
    filter={{ base: 'blur(80px)', md: 'blur(100px)' }}
    rounded="full"
    pointerEvents="none"
/>
```

- [ ] **Step 3: 更新 Header Section 使用顏色變量**

找到第 145-155 行的 Header Section，更新為：

```tsx
{/* Header Section */}
<Box
    position="relative"
    overflow="hidden"
    rounded={{ base: '2xl', md: '3xl' }}
    bg={headerBg}
    border="1px solid"
    borderColor={headerBorderColor}
    p={{ base: 6, md: 8 }}
    shadow="2xl"
    backdropFilter="blur(20px)"
>
```

- [ ] **Step 4: 更新 Header 標題和描述文字顏色**

找到第 190-196 行，更新顏色：

```tsx
// 原代碼
<Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="white" textShadow="md">
    訂閱關係對應
</Text>
<Text color="gray.300" mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium">
    管理 Apple ID、獨立服務、與成員的繳費關係。
</Text>

// 替換為
<Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color={headerTitleColor} textShadow="md">
    訂閱關係對應
</Text>
<Text color={headerTextColor} mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium">
    管理 Apple ID、獨立服務、與成員的繳費關係。
</Text>
```

- [ ] **Step 5: 驗證頁面正常顯示**

```bash
npm run dev
# 打開 http://localhost:5173/mapping 檢查 Mapping 頁面
# 確認無裝飾性模糊圓形
# 測試亮色/暗色模式切換
```

- [ ] **Step 6: 提交**

```bash
git add src/pages/Mapping.tsx
git commit -m "refactor(mapping): remove AI slop elements and add light mode support"
```

---

### Task 1.3: TelegramGroupDetail 添加標準 Header 並支持亮色模式

**Files:**
- Modify: `src/pages/TelegramGroupDetail.tsx`

**目標:** 添加標準 Header Section，支持亮色模式

- [ ] **Step 1: 添加顏色變量定義**

在第 21 行 `export default function TelegramGroupDetail() {` 之後，添加顏色變量：

```tsx
export default function TelegramGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<TelegramGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 添加以下顏色變量
  const headerBg = useColorModeValue('white', 'bg.subtle');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const headerTitleColor = useColorModeValue('gray.900', 'white');
  const headerTextColor = useColorModeValue('gray.600', 'gray.300');
  
  const cardBg = useColorModeValue('white', 'gray.900/40');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
```

需要在文件頂部添加 import：

```tsx
// 在 import 區域添加
import { useColorModeValue } from '@/components/ui/color-mode';
```

- [ ] **Step 2: 重構 Header Section**

找到第 165-200 行，將現有的返回按鈕和標題重構為標準 Header：

```tsx
// 原代碼（第 165-200 行）
<Container maxW="container.xl" py={8}>
  <VStack align="stretch" gap={6}>
    {/* 返回按鈕和標題 */}
    <HStack justify="space-between" align="center">
      <HStack gap={4}>
        <Button
          size="sm"
          variant="ghost"
          colorPalette="gray"
          onClick={() => navigate('/groups')}
        >
          <HStack gap={2}>
            <Box as={ArrowLeft} w={4} h={4} />
            <Text>返回</Text>
          </HStack>
        </Button>
        <VStack align="start" gap={1}>
          <HStack gap={3}>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {group.name}
            </Text>
            <Badge colorPalette="blue" fontSize="xs">
              {cycleLabel[group.billing_cycle_type]}
            </Badge>
          </HStack>
          {group.telegram_link && (
            <HStack gap={1}>
              <Box as={ExternalLink} w={4} h={4} color="blue.400" />
              <a
                href={group.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Text

// 替換為標準 Header Section
<Container maxW="container.xl" py={8}>
  <VStack align="stretch" gap={6}>
    {/* Header Section */}
    <Box
      position="relative"
      overflow="hidden"
      rounded={{ base: '2xl', md: '3xl' }}
      bg={headerBg}
      border="1px solid"
      borderColor={headerBorderColor}
      p={{ base: 5, md: 8 }}
      shadow="2xl"
      backdropFilter="blur(20px)"
      transition="all 0.3s"
    >
      <Flex justify="space-between" alignItems="center" flexWrap="wrap" gap={4}>
        <HStack gap={4}>
          <Button
            size="sm"
            variant="ghost"
            colorPalette="gray"
            onClick={() => navigate('/groups')}
          >
            <HStack gap={2}>
              <Box as={ArrowLeft} w={4} h={4} />
              <Text>返回</Text>
            </HStack>
          </Button>
          <VStack align="start" gap={1}>
            <HStack gap={3}>
              <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color={headerTitleColor}>
                {group.name}
              </Text>
              <Badge colorPalette="blue" fontSize="xs">
                {cycleLabel[group.billing_cycle_type]}
              </Badge>
            </HStack>
            {group.telegram_link && (
              <HStack gap={1}>
                <Box as={ExternalLink} w={4} h={4} color="blue.400" />
                <a
                  href={group.telegram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Text color="blue.400" fontSize="sm" _hover={{ color: 'blue.300' }}>
                    {group.telegram_link}
                  </Text>
                </a>
              </HStack>
            )}
          </VStack>
        </HStack>
        <HStack gap={3}>
          <Button
            colorPalette="blue"
            variant="outline"
            rounded="xl"
            h={12}
            px={6}
            onClick={generatePost}
          >
            <HStack gap={2}>
              <Box as={Calendar} w={4} h={4} />
              <Text>生成貼文</Text>
            </HStack>
          </Button>
          <Button
            colorPalette="blue"
            rounded="xl"
            h={12}
            px={6}
            shadow="lg"
            _hover={{ transform: 'scale(1.02)' }}
            transition="all"
            onClick={() => setDialogOpen(true)}
          >
            <HStack gap={2}>
              <Box as={Edit} w={4} h={4} />
              <Text>編輯群組</Text>
            </HStack>
          </Button>
        </HStack>
      </Flex>
    </Box>
```

- [ ] **Step 3: 更新其他硬編碼顏色**

搜索文件中所有 `color="white"` 和 `color="gray.300"` 等硬編碼顏色，替換為對應的顏色變量：

```tsx
// 搜索並替換以下模式
color="white" → color={textColor}
color="gray.300" → color={secondaryTextColor}
color="gray.500" → color={mutedTextColor}
```

- [ ] **Step 4: 驗證頁面正常顯示**

```bash
npm run dev
# 打開 http://localhost:5173/groups/{id} 檢查 TelegramGroupDetail 頁面
# 確認 Header Section 符合標準
# 測試亮色/暗色模式切換
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/TelegramGroupDetail.tsx
git commit -m "feat(telegram-group-detail): add standard header and light mode support"
```

---

### Task 1.4: 創建 Phase 1 Git Tag

- [ ] **Step 1: 確認所有 Phase 1 任務完成**

```bash
# 確認所有修改已提交
git status

# 查看提交歷史
git log --oneline -5
```

- [ ] **Step 2: 創建 Git Tag**

```bash
git tag -a phase-1-complete -m "Phase 1: 基礎統一完成

- 統一 Dashboard KPI 卡片顏色為 blue
- 移除 Mapping AI Slop 元素並支持亮色模式
- TelegramGroupDetail 添加標準 Header 並支持亮色模式
"
git push origin phase-1-complete
```

---

## Phase 2: 樣式統一（2-3 天）

### Task 2.1: 統一所有頁面的按鈕樣式

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Mapping.tsx`
- Modify: `src/pages/TelegramGroupDetail.tsx`
- Modify: `src/pages/Accounts.tsx`
- Modify: `src/pages/Recharge.tsx`
- Modify: `src/pages/TelegramGroups.tsx`

**目標:** 確保所有按鈕符合標準樣式

**標準按鈕樣式規範:**
```tsx
// 主要按鈕
<Button colorPalette="blue" rounded="xl" h={12} px={6} shadow="lg" _hover={{ transform: 'scale(1.02)' }} transition="all">
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

- [ ] **Step 1: 檢查並統一 Dashboard.tsx 按鈕**

搜索 Dashboard.tsx 中所有 `<Button` 標籤，確保符合標準：

```bash
# 搜索按鈕
grep -n "Button" src/pages/Dashboard.tsx
```

確保所有主要操作按鈕包含：
- `colorPalette="blue"`
- `rounded="xl"`
- `h={12}` (主要按鈕) 或 `size="sm"` (小按鈕)
- `shadow="lg"` (主要按鈕)
- `_hover={{ transform: 'scale(1.02)' }}`
- `transition="all"`

- [ ] **Step 2: 檢查並統一 Mapping.tsx 按鈕**

```bash
# 搜索按鈕
grep -n "Button" src/pages/Mapping.tsx
```

更新不符合標準的按鈕樣式。

- [ ] **Step 3: 檢查並統一其他頁面按鈕**

依次檢查並更新：
- `src/pages/TelegramGroupDetail.tsx`
- `src/pages/Accounts.tsx`
- `src/pages/Recharge.tsx`
- `src/pages/TelegramGroups.tsx`

- [ ] **Step 4: 驗證所有頁面按鈕樣式一致**

```bash
npm run dev
# 逐一檢查所有頁面的按鈕樣式
# 確認視覺一致性
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/*.tsx
git commit -m "style: unify button styles across all pages"
```

---

### Task 2.2: 統一所有卡片樣式

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Accounts.tsx`
- Modify: `src/pages/TelegramGroups.tsx`
- Modify: `src/components/accounts/AccountCard.tsx`
- Modify: `src/components/telegram-groups/GroupCard.tsx`
- Modify: `src/components/telegram-groups/BillingCycleCard.tsx`

**目標:** 統一所有卡片樣式

**標準卡片樣式規範:**
```tsx
<Box
  bg={cardBg}
  backdropFilter="blur(20px)"
  border="1px solid"
  borderColor={cardBorderColor}
  rounded="xl"
  shadow="xl"
  p={6}
  transition="all"
  _hover={{ shadow: '2xl' }}
>
  {/* 內容 */}
</Box>
```

- [ ] **Step 1: 統一 Dashboard KPI 卡片樣式**

確認 Dashboard.tsx 中的 KPI 卡片已使用標準樣式（已在 Phase 1 完成）。

- [ ] **Step 2: 統一 AccountCard 組件樣式**

打開 `src/components/accounts/AccountCard.tsx`，確保卡片容器使用標準樣式：

```tsx
<Box
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
  {/* 卡片內容 */}
</Box>
```

- [ ] **Step 3: 統一 GroupCard 組件樣式**

打開 `src/components/telegram-groups/GroupCard.tsx`，確保卡片容器使用標準樣式。

- [ ] **Step 4: 統一 BillingCycleCard 組件樣式**

打開 `src/components/telegram-groups/BillingCycleCard.tsx`，確保卡片容器使用標準樣式。

- [ ] **Step 5: 驗證所有卡片樣式一致**

```bash
npm run dev
# 檢查所有頁面的卡片樣式
# 確認視覺一致性
```

- [ ] **Step 6: 提交**

```bash
git add src/components/**/*.tsx src/pages/*.tsx
git commit -m "style: unify card styles across all components"
```

---

### Task 2.3: 統一響應式設計

**Files:**
- Modify: `src/pages/Services.tsx`
- Modify: 所有其他頁面文件

**目標:** 確保所有頁面使用統一的響應式設計模式

**標準響應式模式:**
```tsx
// 字體
fontSize={{ base: '2xl', md: '3xl' }}

// 間距
gap={{ base: 6, md: 10 }}

// 容器
maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }}

// 圓角
rounded={{ base: '2xl', md: '3xl' }}

// 內距
p={{ base: 5, md: 8 }}
```

- [ ] **Step 1: 為 Services.tsx 添加響應式支持**

打開 `src/pages/Services.tsx`，找到第 103 行的 VStack 和第 105 行的 Header Section：

```tsx
// 原代碼（第 103 行）
<VStack gap={10} maxW="7xl" mx="auto" pb={10} align="stretch">

// 替換為
<VStack gap={{ base: 6, md: 10 }} maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }} align="stretch">
```

```tsx
// 原代碼（第 105-115 行）
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

// 替換為
<Box
    position="relative"
    overflow="hidden"
    rounded={{ base: '2xl', md: '3xl' }}
    bg={headerBg}
    border="1px solid"
    borderColor={headerBorderColor}
    p={{ base: 5, md: 8 }}
    shadow="2xl"
    backdropFilter="blur(20px)"
    transition="all 0.3s"
>
```

```tsx
// 原代碼（第 118 行）
<Text fontSize="3xl" fontWeight="black" letterSpacing="tight" color={headerTitleColor} textShadow="md">

// 替換為
<Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color={headerTitleColor} textShadow="md">
```

```tsx
// 原代碼（第 121 行）
<Text color={headerTextColor} mt={2} fontSize="sm" fontWeight="medium">

// 替換為
<Text color={headerTextColor} mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium">
```

- [ ] **Step 2: 檢查其他頁面響應式設計**

確認其他頁面已使用統一的響應式模式（Dashboard、Mapping、Accounts 等已在 Phase 1 完成）。

- [ ] **Step 3: 驗證響應式設計**

```bash
npm run dev
# 使用瀏覽器開發者工具測試不同螢幕尺寸
# 測試 320px, 768px, 1024px, 1440px 等斷點
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/*.tsx
git commit -m "style: unify responsive design patterns across all pages"
```

---

### Task 2.4: 統一對話框樣式

**Files:**
- Modify: `src/components/telegram-groups/CreateGroupDialog.tsx`
- Modify: `src/components/accounts/BalanceAdjustDialog.tsx`
- Modify: `src/pages/Mapping.tsx` (內含對話框)
- Modify: `src/pages/Services.tsx` (內含對話框)

**目標:** 統一所有對話框樣式

**標準對話框樣式規範:**
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
  <DialogHeader>
    <DialogTitle fontSize="xl" fontWeight="bold">
      標題
    </DialogTitle>
  </DialogHeader>
  {/* 表單內容 */}
</DialogContent>
```

- [ ] **Step 1: 統一 CreateGroupDialog 樣式**

打開 `src/components/telegram-groups/CreateGroupDialog.tsx`，確保 DialogContent 使用標準樣式：

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
```

需要添加顏色變量：

```tsx
const dialogBg = useColorModeValue('white', 'gray.900/90');
const dialogColor = useColorModeValue('gray.800', 'gray.50');
const dialogBorderColor = useColorModeValue('gray.200', 'gray.700');
```

- [ ] **Step 2: 統一 BalanceAdjustDialog 樣式**

打開 `src/components/accounts/BalanceAdjustDialog.tsx`，確保 DialogContent 使用標準樣式。

- [ ] **Step 3: 統一 Mapping.tsx 中的對話框樣式**

找到 Mapping.tsx 中的所有 DialogContent，確保使用標準樣式。

- [ ] **Step 4: 統一 Services.tsx 中的對話框樣式**

確認 Services.tsx 中的對話框已使用標準樣式（應該已經符合）。

- [ ] **Step 5: 驗證所有對話框樣式一致**

```bash
npm run dev
# 測試所有頁面的對話框
# 確認視覺一致性
```

- [ ] **Step 6: 提交**

```bash
git add src/components/**/*.tsx src/pages/*.tsx
git commit -m "style: unify dialog styles across all components"
```

---

### Task 2.5: 創建 Phase 2 Git Tag

- [ ] **Step 1: 確認所有 Phase 2 任務完成**

```bash
# 確認所有修改已提交
git status

# 查看提交歷史
git log --oneline -10
```

- [ ] **Step 2: 創建 Git Tag**

```bash
git tag -a phase-2-complete -m "Phase 2: 樣式統一完成

- 統一所有頁面的按鈕樣式
- 統一所有卡片樣式
- 統一響應式設計模式
- 統一對話框樣式
"
git push origin phase-2-complete
```

---

## Phase 3: 結構優化（3-5 天）

### Task 3.1: 統一數據展示方式

**Files:**
- Modify: `src/pages/Accounts.tsx`
- Modify: `src/pages/TelegramGroups.tsx`

**目標:** 評估是否需要將卡片列表改為表格展示，確保數據展示方式一致

**決策規則:**
- **列表數據**：優先使用表格（參考 Services.tsx）
- **概覽數據**：使用卡片（Dashboard 除外）
- **詳情數據**：使用表格 + 卡片組合

- [ ] **Step 1: 評估 Accounts.tsx 數據展示方式**

分析 Accounts.tsx 當前使用卡片列表展示帳戶：
- 優點：視覺化強，適合展示概覽信息
- 缺點：數據量大時不易比較

決定是否改為表格展示，或保持卡片但優化佈局。

**建議：保持卡片展示，因為帳戶信息適合卡片形式**

- [ ] **Step 2: 評估 TelegramGroups.tsx 數據展示方式**

分析 TelegramGroups.tsx 當前使用卡片列表展示群組：
- 優點：視覺化強，適合展示概覽信息
- 缺點：數據量大時不易比較

決定是否改為表格展示。

**建議：保持卡片展示，因為群組信息適合卡片形式**

- [ ] **Step 3: 提交決策文檔**

```bash
# 如果決定保持現狀，記錄決策原因
git add docs/superpowers/plans/2026-05-22-ui-unification.md
git commit -m "docs: document data display decision for Accounts and TelegramGroups"
```

---

### Task 3.2: 統一表格樣式

**Files:**
- Modify: `src/pages/Recharge.tsx`
- Modify: `src/pages/TelegramGroupDetail.tsx`

**目標:** 確保所有表格使用統一樣式，包含頂部色條

**標準表格樣式規範:**
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

- [ ] **Step 1: 統一 Recharge.tsx 歷史記錄表格樣式**

找到 Recharge.tsx 中的歷史記錄表格，添加頂部色條和標準樣式：

```tsx
// 找到歷史記錄表格容器，添加頂部色條
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
  <Table.Root>
    {/* 表格內容 */}
  </Table.Root>
</Box>
```

- [ ] **Step 2: 統一 TelegramGroupDetail.tsx 表格樣式**

找到 TelegramGroupDetail.tsx 中的兩個表格（成員表格和付款記錄表格），添加頂部色條：

```tsx
// 成員表格
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
  <Table.Root>
    {/* 成員表格內容 */}
  </Table.Root>
</Box>

// 付款記錄表格
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
  <Table.Root>
    {/* 付款記錄表格內容 */}
  </Table.Root>
</Box>
```

- [ ] **Step 3: 驗證所有表格樣式一致**

```bash
npm run dev
# 檢查所有頁面的表格樣式
# 確認所有表格都有頂部色條
# 測試亮色/暗色模式切換
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/*.tsx
git commit -m "style: unify table styles with top color bar"
```

---

### Task 3.3: 優化 Mapping.tsx 組件結構

**Files:**
- Modify: `src/pages/Mapping.tsx`

**目標:** 簡化嵌套對話框結構，提取可重用組件，改善組件職責分離

- [ ] **Step 1: 分析當前組件結構**

Mapping.tsx 當前包含多個嵌套對話框：
- 帳號對話框（新增/編輯 Apple ID）
- 訂閱對話框（新增訂閱服務）
- 成員對話框（新增/編輯成員）

評估是否需要提取為獨立組件。

- [ ] **Step 2: 提取對話框組件（可選）**

如果決定提取，創建以下文件：
- `src/components/mapping/AccountDialog.tsx`
- `src/components/mapping/SubscriptionDialog.tsx`
- `src/components/mapping/MemberDialog.tsx`

- [ ] **Step 3: 簡化嵌套結構**

確保對話框之間的狀態管理清晰，避免過度嵌套。

- [ ] **Step 4: 驗證功能正常**

```bash
npm run dev
# 測試所有對話框功能
# 確認無狀態管理問題
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/Mapping.tsx src/components/mapping/*.tsx
git commit -m "refactor(mapping): optimize component structure and extract dialogs"
```

---

### Task 3.4: 優化 Dashboard.tsx 組件結構

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/components/dashboard/*.tsx`

**目標:** 優化 KPI 卡片組件，統一圖表樣式，改善數據流

- [ ] **Step 1: 檢查 KPI 卡片組件**

確認 KPI 卡片是否需要提取為獨立組件：
- 總可用餘額卡片
- 預估每月總支出卡片
- 餘額趨勢圖表

- [ ] **Step 2: 統一圖表樣式**

確保 BalanceTrendChart 組件使用標準顏色和樣式：
- 使用 blue 作為主色
- 支持亮色/暗色模式
- 響應式設計

- [ ] **Step 3: 改善數據流**

確保數據計算邏輯清晰，避免重複計算：
- 總餘額計算
- 每月支出計算
- 警告數據計算

- [ ] **Step 4: 驗證功能正常**

```bash
npm run dev
# 測試 Dashboard 所有功能
# 確認數據顯示正確
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/*.tsx
git commit -m "refactor(dashboard): optimize component structure and chart styles"
```

---

### Task 3.5: 添加統一的空狀態組件

**Files:**
- Create: `src/components/ui/empty-state.tsx`

**目標:** 創建統一的空狀態組件，確保所有頁面使用一致的空狀態展示

**標準空狀態組件:**
```tsx
import { Box, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');

  return (
    <Box textAlign="center" py={10}>
      {icon && (
        <Box mb={4} color={textColor}>
          {icon}
        </Box>
      )}
      <Text color={textColor} fontSize="lg" fontWeight="medium">
        {title}
      </Text>
      {description && (
        <Text color={mutedTextColor} fontSize="sm" mt={2}>
          {description}
        </Text>
      )}
      {action && (
        <Box mt={4}>
          {action}
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 1: 創建 EmptyState 組件**

創建 `src/components/ui/empty-state.tsx` 文件，添加上述代碼。

- [ ] **Step 2: 在 Accounts.tsx 中使用 EmptyState**

```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { Inbox } from 'lucide-react';

// 替換現有的空狀態
{filteredAccounts.length === 0 && (
  <EmptyState
    title="沒有找到帳號"
    description="請調整篩選條件或新增帳號"
    icon={<Inbox size={48} />}
  />
)}
```

- [ ] **Step 3: 在 TelegramGroups.tsx 中使用 EmptyState**

```tsx
{filteredGroups.length === 0 && (
  <EmptyState
    title="沒有找到群組"
    description="請調整搜尋條件或新增群組"
    icon={<Users size={48} />}
  />
)}
```

- [ ] **Step 4: 在其他頁面中使用 EmptyState**

檢查所有頁面，統一使用 EmptyState 組件：
- Dashboard.tsx
- Mapping.tsx
- Recharge.tsx
- TelegramGroupDetail.tsx

- [ ] **Step 5: 驗證所有空狀態顯示一致**

```bash
npm run dev
# 測試各頁面的空狀態
# 確認視覺一致性
```

- [ ] **Step 6: 提交**

```bash
git add src/components/ui/empty-state.tsx src/pages/*.tsx
git commit -m "feat: add unified EmptyState component"
```

---

### Task 3.6: 創建 Phase 3 Git Tag

- [ ] **Step 1: 確認所有 Phase 3 任務完成**

```bash
# 確認所有修改已提交
git status

# 查看提交歷史
git log --oneline -15
```

- [ ] **Step 2: 創建 Git Tag**

```bash
git tag -a phase-3-complete -m "Phase 3: 結構優化完成

- 統一數據展示方式
- 統一表格樣式（添加頂部色條）
- 優化 Mapping.tsx 組件結構
- 優化 Dashboard.tsx 組件結構
- 添加統一的 EmptyState 組件
"
git push origin phase-3-complete
```

---

## 驗收標準

### Phase 1 驗收標準

- [ ] Dashboard 和 Mapping 頁面無 AI Slop 元素
- [ ] 所有頁面使用 blue 作為主色
- [ ] TelegramGroupDetail 有標準 Header Section
- [ ] Mapping 和 TelegramGroupDetail 支持亮色模式
- [ ] 所有頁面在亮色和暗色模式下都正常顯示

### Phase 2 驗收標準

- [ ] 所有按鈕符合標準樣式
- [ ] 所有卡片符合標準樣式
- [ ] 所有頁面響應式設計一致
- [ ] 所有對話框符合標準樣式

### Phase 3 驗收標準

- [ ] 數據展示方式統一
- [ ] 所有表格有頂部色條
- [ ] 組件結構清晰，職責分離
- [ ] 有統一的空狀態展示

---

## 風險與緩解措施

### 風險

1. **亮色模式兼容性**：部分頁面可能未完全支持亮色模式
   - **緩解**：使用 `useColorModeValue` 定義所有顏色變量

2. **響應式設計**：某些頁面可能在移動端顯示不佳
   - **緩解**：統一使用標準響應式模式，並在多種設備上測試

3. **組件依賴**：修改某個組件可能影響其他頁面
   - **緩解**：使用組件測試確保修改不會破壞現有功能

### 回滾計劃

每個 Phase 完成後創建 Git tag，如有問題可快速回滾：
- `phase-1-complete`
- `phase-2-complete`
- `phase-3-complete`

回滾命令：
```bash
# 回滾到 Phase 2
git checkout phase-2-complete

# 回滾到 Phase 1
git checkout phase-1-complete
```

---

## 時間估算

| Phase | 預估時間 | 任務數量 |
|-------|---------|---------|
| Phase 1 | 1-2 天 | 4 個主要任務 |
| Phase 2 | 2-3 天 | 5 個主要任務 |
| Phase 3 | 3-5 天 | 6 個主要任務 |
| **總計** | **6-10 天** | **15 個主要任務** |

---

## 成功指標

1. **設計一致性**：> 90%（當前約 60%）
2. **AI Slop 問題**：0 個（當前 2 個頁面）
3. **亮色模式支持**：100%（當前約 70%）
4. **響應式設計**：100% 頁面支持
5. **代碼質量**：無硬編碼顏色，所有顏色使用變量

---

## 附錄：顏色變量定義

### 標準顏色變量

```tsx
// Header
const headerBg = useColorModeValue('white', 'bg.subtle');
const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
const headerTitleColor = useColorModeValue('gray.900', 'white');
const headerTextColor = useColorModeValue('gray.600', 'gray.300');

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
const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
```

### 禁止使用的硬編碼顏色

❌ **禁止**：
- `bg="gray.800"`
- `bg="gray.900"`
- `color="white"` （在暗色模式下）
- `color="gray.900"` （在亮色模式下）

✅ **正確**：
- 使用 `useColorModeValue` 定義顏色變量
- 使用語義化的顏色名稱

---

## 附錄：Chakra UI v3 組件參考

### Button 組件

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

### Card 組件

```tsx
<Box
  bg={cardBg}
  backdropFilter="blur(20px)"
  border="1px solid"
  borderColor={cardBorderColor}
  rounded="xl"
  shadow="xl"
  p={6}
  transition="all"
  _hover={{ shadow: '2xl' }}
>
  {/* 內容 */}
</Box>
```

### Table 組件

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
  <Box h={1.5} w="full" bg="blue.500" />
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.ColumnHeader>標題</Table.ColumnHeader>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell>內容</Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table.Root>
</Box>
```

### Dialog 組件

```tsx
<DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
  <DialogContent
    maxW="450px"
    bg={dialogBg}
    backdropFilter="blur(40px)"
    color={dialogColor}
    borderColor={dialogBorderColor}
    rounded="2xl"
    shadow="2xl"
  >
    <DialogHeader>
      <DialogTitle fontSize="xl" fontWeight="bold">
        標題
      </DialogTitle>
    </DialogHeader>
    {/* 表單內容 */}
  </DialogContent>
</DialogRoot>
```

---

## 結語

本實施計劃提供了詳細的步驟和代碼示例，確保 UI 統一工作可以順利進行。每個任務都設計為 2-5 分鐘可完成的小步驟，便於追蹤進度和驗收。

執行時請遵循以下原則：
1. **按順序執行**：Phase 1 → Phase 2 → Phase 3
2. **小步提交**：每個任務完成後立即提交
3. **及時測試**：每個步驟完成後驗證功能正常
4. **創建 Tag**：每個 Phase 完成後創建 Git tag

如有問題，可隨時回滾到上一個 Phase 的 tag。