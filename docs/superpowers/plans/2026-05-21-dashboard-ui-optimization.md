# Dashboard UI 優化實現計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改善 Dashboard 的信息層級，添加快速行動區、漸進式警告卡片和餘額趨勢圖表。

**Architecture:** 在現有 Dashboard 組件基礎上添加新的功能區塊，使用 Recharts 繪製趨勢圖，保持現有的暗色主題和玻璃態設計風格。

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Recharts (新增), Lucide React

---

## 文件結構

**新增文件：**
- `src/components/dashboard/QuickActions.tsx` - 快速行動區組件
- `src/components/dashboard/WarningCard.tsx` - 漸進式警告卡片組件
- `src/components/dashboard/BalanceTrendChart.tsx` - 餘額趨勢圖表組件
- `src/types/dashboard.ts` - Dashboard 相關類型定義

**修改文件：**
- `src/pages/Dashboard.tsx` - 整合新組件
- `package.json` - 添加 Recharts 依賴
- `src/lib/api.ts` - 添加歷史數據 API 調用（如需要）

---

## Task 1: 安裝 Recharts 依賴

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安裝 Recharts**

```bash
npm install recharts
```

- [ ] **Step 2: 驗證安裝成功**

```bash
npm list recharts
```

Expected: `recharts@x.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts for balance trend visualization"
```

---

## Task 2: 創建類型定義

**Files:**
- Create: `src/types/dashboard.ts`

- [ ] **Step 1: 創建類型定義文件**

```typescript
// src/types/dashboard.ts

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'outline';
}

export interface WarningLevel {
  level: 'normal' | 'warning' | 'critical';
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface BalanceTrendData {
  date: string;
  balance: number;
  currency: string;
}

export interface AccountWithWarning {
  id: string;
  apple_id: string;
  balance: number;
  currency: string;
  monthlyBurn: number;
  monthsLeft: number;
  subscriptions: any[];
  warningLevel: WarningLevel;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/dashboard.ts
git commit -m "feat: add dashboard type definitions"
```

---

## Task 3: 創建快速行動區組件

**Files:**
- Create: `src/components/dashboard/QuickActions.tsx`

- [ ] **Step 1: 創建 QuickActions 組件**

```typescript
// src/components/dashboard/QuickActions.tsx

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, Download } from 'lucide-react';

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

function QuickActionButton({ icon, label, onClick, variant = 'secondary' }: QuickActionProps) {
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500',
    secondary: 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-200 border-neutral-700',
    outline: 'bg-transparent hover:bg-neutral-800/40 text-neutral-300 border-neutral-700'
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all
        backdrop-blur-sm font-medium text-sm
        ${variantStyles[variant]}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function QuickActions() {
  const handleQuickRecharge = () => {
    // Navigate to recharge page
    window.location.href = '/recharge';
  };

  const handleViewUpcoming = () => {
    // Scroll to warnings section
    const warningsSection = document.getElementById('warnings-section');
    if (warningsSection) {
      warningsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportReport = () => {
    // Export functionality
    console.log('Export report');
  };

  return (
    <Card className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 shadow-2xl">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <span className="text-lg">🎯</span>
          </div>
          <h3 className="text-lg font-bold text-neutral-100">快速行動</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <QuickActionButton
            icon={<Plus className="w-4 h-4" />}
            label="一鍵加值"
            onClick={handleQuickRecharge}
            variant="primary"
          />
          <QuickActionButton
            icon={<Calendar className="w-4 h-4" />}
            label="查看即將到期"
            onClick={handleViewUpcoming}
            variant="secondary"
          />
          <QuickActionButton
            icon={<Download className="w-4 h-4" />}
            label="匯出報告"
            onClick={handleExportReport}
            variant="outline"
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/QuickActions.tsx
git commit -m "feat: add QuickActions component for dashboard"
```

---

## Task 4: 創建漸進式警告卡片組件

**Files:**
- Create: `src/components/dashboard/WarningCard.tsx`

- [ ] **Step 1: 創建 WarningCard 組件**

```typescript
// src/components/dashboard/WarningCard.tsx

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface WarningCardProps {
  account: {
    id: string;
    apple_id: string;
    balance: number;
    currency: string;
    _monthlyBurn?: number;
    _monthsLeft?: number;
    subscriptions?: any[];
  };
}

function getWarningLevel(monthsLeft: number) {
  if (monthsLeft < 0.5) {
    return {
      level: 'critical',
      color: 'red',
      bgColor: 'bg-red-950/20',
      borderColor: 'border-red-600/50',
      textColor: 'text-red-300',
      badgeClass: 'bg-red-600 animate-pulse',
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />
    };
  } else if (monthsLeft < 1.5) {
    return {
      level: 'warning',
      color: 'orange',
      bgColor: 'bg-orange-950/20',
      borderColor: 'border-orange-600/50',
      textColor: 'text-orange-300',
      badgeClass: 'bg-orange-600',
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />
    };
  } else {
    return {
      level: 'normal',
      color: 'yellow',
      bgColor: 'bg-yellow-950/20',
      borderColor: 'border-yellow-600/50',
      textColor: 'text-yellow-300',
      badgeClass: 'bg-yellow-600',
      icon: <TrendingUp className="w-4 h-4 text-yellow-500" />
    };
  }
}

export function WarningCard({ account }: WarningCardProps) {
  const monthsLeft = account._monthsLeft || 0;
  const warning = getWarningLevel(monthsLeft);

  return (
    <div
      className={`
        p-4 rounded-xl border backdrop-blur-md
        flex flex-col gap-2 transition-all
        ${warning.bgColor} ${warning.borderColor}
        hover:scale-[1.02] hover:shadow-lg
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-neutral-800/40 pb-2">
        <div className="flex items-center gap-2">
          {warning.icon}
          <div className="font-bold text-sm md:text-base truncate pr-2">
            {account.apple_id}
          </div>
        </div>
        <Badge className={warning.badgeClass}>
          {monthsLeft.toFixed(1)} 月
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-neutral-500">餘額</span>
          <span className={`font-bold ${warning.textColor}`}>
            {account.currency} {account.balance.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-neutral-500">月支出</span>
          <span className={`font-bold ${warning.textColor}`}>
            {account.currency} {(account._monthlyBurn || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Subscriptions */}
      {account.subscriptions && account.subscriptions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-800/40">
          <div className="text-xs text-neutral-500 mb-1">訂閱服務</div>
          <div className="space-y-1">
            {account.subscriptions.slice(0, 3).map((sub: any) => (
              <div key={sub.id} className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 truncate max-w-[120px]">
                  {sub.service_name}
                </span>
                <span className="font-mono text-neutral-300">
                  {sub.currency} {(sub.base_price || 0).toFixed(2)}
                </span>
              </div>
            ))}
            {account.subscriptions.length > 3 && (
              <div className="text-xs text-neutral-500">
                +{account.subscriptions.length - 3} 更多...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/WarningCard.tsx
git commit -m "feat: add WarningCard component with progressive severity levels"
```

---

## Task 5: 創建餘額趨勢圖表組件

**Files:**
- Create: `src/components/dashboard/BalanceTrendChart.tsx`

- [ ] **Step 1: 創建 BalanceTrendChart 組件**

```typescript
// src/components/dashboard/BalanceTrendChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface BalanceTrendChartProps {
  data: Array<{
    date: string;
    balance: number;
  }>;
  currency?: string;
}

export function BalanceTrendChart({ data, currency = 'HK$' }: BalanceTrendChartProps) {
  return (
    <Card className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          餘額趨勢
        </CardTitle>
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] md:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${currency}${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value: number) => [`${currency}${value.toFixed(2)}`, '餘額']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                name="餘額"
                stroke="#818CF8"
                strokeWidth={2}
                dot={{ fill: '#818CF8', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#6366F1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/BalanceTrendChart.tsx
git commit -m "feat: add BalanceTrendChart component with recharts"
```

---

## Task 6: 更新 Dashboard 頁面

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: 導入新組件**

在文件頂部添加導入：

```typescript
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WarningCard } from '@/components/dashboard/WarningCard';
import { BalanceTrendChart } from '@/components/dashboard/BalanceTrendChart';
```

- [ ] **Step 2: 添加模擬趨勢數據**

在 `Dashboard` 組件內，`return` 之前添加：

```typescript
// Mock trend data - in real app, this would come from API
const balanceTrendData = [
  { date: '12月', balance: 1200 },
  { date: '1月', balance: 1350 },
  { date: '2月', balance: 1180 },
  { date: '3月', balance: 1420 },
  { date: '4月', balance: 1280 },
  { date: '5月', balance: totalBalanceHKD },
];
```

- [ ] **Step 3: 添加快速行動區**

在 KPI Cards 之後添加：

```typescript
{/* Quick Actions */}
<QuickActions />
```

- [ ] **Step 4: 添加趨勢圖表**

在 KPI Cards 區域，將 grid 改為 3 列並添加趨勢圖：

```typescript
<div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* 總餘額卡片 */}
  <Card className="bg-neutral-900/40 backdrop-blur-xl border border-indigo-500/20 shadow-2xl overflow-hidden relative group">
    {/* ... existing code ... */}
  </Card>

  {/* 月支出卡片 */}
  <Card className="bg-neutral-900/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl overflow-hidden relative group">
    {/* ... existing code ... */}
  </Card>

  {/* 餘額趨勢圖 */}
  <BalanceTrendChart data={balanceTrendData} currency="HK$" />
</div>
```

- [ ] **Step 5: 更新警告區域**

將低餘額警告區域更新為使用 WarningCard：

```typescript
<div className="space-y-5" id="warnings-section">
  <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-3">
    <div className="p-2 bg-red-500/10 rounded-lg">
      <AlertTriangle className="w-5 h-5 text-red-500" />
    </div>
    <h3 className="text-xl font-bold text-neutral-100 tracking-tight">低餘額警告</h3>
  </div>

  {lowBalanceAccounts.length === 0 ? (
    <div className="text-neutral-500 border border-neutral-800/40 rounded-2xl p-6 text-center bg-neutral-900/20 backdrop-blur-sm text-sm">
      所有帳號餘額充足。
    </div>
  ) : (
    <div className="grid gap-3 md:grid-cols-2">
      {lowBalanceAccounts.map((acc: any) => (
        <WarningCard key={acc.id} account={acc} />
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: integrate QuickActions, WarningCard, and BalanceTrendChart into Dashboard"
```

---

## Task 7: 測試和驗證

**Files:**
- None (testing only)

- [ ] **Step 1: 啟動開發服務器**

```bash
npm run dev
```

- [ ] **Step 2: 驗證功能**

在瀏覽器中檢查：
1. 快速行動區是否正確顯示
2. 點擊「一鍵加值」是否導航到正確頁面
3. 點擊「查看即將到期」是否滾動到警告區域
4. 警告卡片是否根據餘額顯示不同顏色
5. 趨勢圖表是否正確渲染

- [ ] **Step 3: 檢查響應式設計**

調整瀏覽器窗口大小，確認：
- 移動端佈局正確
- 卡片在小屏幕上堆疊顯示
- 文字大小適中

- [ ] **Step 4: 運行 lint**

```bash
npm run lint
```

Expected: No errors

---

## Task 8: 最終提交

**Files:**
- None (git operations only)

- [ ] **Step 1: 查看所有變更**

```bash
git status
```

- [ ] **Step 2: 確認所有文件已提交**

如果有未提交的文件：

```bash
git add .
git commit -m "feat: complete Dashboard UI optimization phase 1"
```

- [ ] **Step 3: 推送到遠程**

```bash
git push origin main
```

---

## 驗收標準

完成後，Dashboard 應該具備：

1. ✅ **快速行動區** - 頂部有明顯的行動按鈕
2. ✅ **漸進式警告卡片** - 根據餘額剩餘時間顯示不同顏色（紅/橙/黃）
3. ✅ **餘額趨勢圖** - 顯示過去 6 個月的餘額變化
4. ✅ **響應式設計** - 在移動端和桌面端都能正常顯示
5. ✅ **無 lint 錯誤** - 代碼質量良好

---

## 後續優化建議

完成 Phase 1 後，可以考慮：

1. **真實數據整合** - 從 API 獲取歷史餘額數據
2. **更多圖表** - 添加支出分佈圖、服務對比圖
3. **動畫效果** - 添加卡片進入動畫
4. **暗色/亮色主題切換** - 支持主題切換
5. **國際化** - 支持多語言
