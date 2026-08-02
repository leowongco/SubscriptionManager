# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-03

第一個正式自架版本：整個系統從 Cloudflare Pages Functions + D1 完全遷移到自架 Docker（Node/Express + better-sqlite3），修復了大量遷移過程中發現的資料邏輯錯誤，並補上原本完全缺乏的存取控制。

### Breaking Changes
- **後端架構全面遷移**：Cloudflare Pages Functions + D1 → 自架 Node/Express + better-sqlite3，打包成單一 Docker image；`functions/`、`wrangler.toml`、`schema.sql`、`update_schema_v*.sql` 等 Cloudflare 專屬檔案已移除（[`server/`](server/) 為現在唯一的後端）
- **每日自動扣款改為容器內建排程**（`node-cron`），不再需要外部觸發 `/api/sync`
- **新增整站登入保護**：所有 `/api/*` 端點與前端頁面現在受 `APP_PASSWORD`（HTTP Basic Auth）保護，部署到 VPS 前務必在 `.env` 設定，否則等同完全公開

### Added
- Docker 一鍵部署：[`Dockerfile`](Dockerfile)（多階段建置）、[`docker-compose.yml`](docker-compose.yml)（本機 build）、[`docker-compose.prod.yml`](docker-compose.prod.yml)（拉 CI 建置好的 image）
- GitHub Actions 自動建置並推送 image 到 GHCR（可選同時推 Docker Hub）：[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)
- 帳號類型標記（Apple/Google/其他）與每筆訂閱獨立的「服務登入帳號」欄位，解決登入時混淆 Apple ID 與 Google ID 的問題
- 帳號地區（App Store 區域）設定，同帳號之後的加值與訂閱扣款強制鎖定同一貨幣，前後端雙重檢查
- 每筆訂閱可各自設定獨立的調漲後價格／生效日（不同帳號同一服務的調漲時間可能不同），新增訂閱時預設繼承服務層級設定
- HTTP Basic Auth 全站登入保護（`APP_USERNAME` / `APP_PASSWORD`）與 `helmet` 安全標頭

### Fixed
- 自動扣款計算錯誤（`sync.ts` 統計帳號數用錯欄位）
- 四支 API 的 audit log 寫入欄位對不上資料庫結構（`accounts`、`recharge`、`telegram-groups`、`billing-cycles`、`member-payments`）
- 帳號建立/查詢誤用不存在的 `group_name` 欄位，導致新增帳號直接失敗
- Telegram 群組帳單週期建立成員繳費紀錄時遺漏必填的 `account_id`／`amount`
- 會員退款端點未正確註冊、欄位名稱寫錯（`refund_at` → `refunded_at`）
- 手機版側邊選單（Drawer）因缺少 `Drawer.Positioner` 而顯示在畫面外
- 部分編輯對話框因 `onOpenChange` 回傳值判斷錯誤（誤把整個 `{open}` 物件當布林值）導致無法關閉
- 批次加值未檢查帳號地區貨幣是否一致，可能把不同幣別的金額混在同一筆加值

### Removed
- 移除舊 Cloudflare 專屬檔案的 git 追蹤：`functions/`、`wrangler.toml`、`schema.sql`、`update_schema_v*.sql`、`.wrangler/`、根目錄 `database.db`（皆為空資料庫，非正式資料）
- 移除前端對 `wrangler` / `@cloudflare/workers-types` 的相依

## [0.1.0] - 2025-05-21

### Added
- **Telegram Groups Management**: New pages for managing Telegram groups with billing cycles and member payments
  - [`TelegramGroups.tsx`](src/pages/TelegramGroups.tsx) - Group list page
  - [`TelegramGroupDetail.tsx`](src/pages/TelegramGroupDetail.tsx) - Group detail page with billing cycle cards
- **Account Management**: Enhanced account management with balance adjustment dialog
  - [`Accounts.tsx`](src/pages/Accounts.tsx) - Apple ID management page
  - [`BalanceAdjustDialog.tsx`](src/components/accounts/BalanceAdjustDialog.tsx) - Balance adjustment dialog
- **Enhanced Recharge**: Batch recharge with preview and progress tracking
  - [`Recharge.tsx`](src/pages/Recharge.tsx) - Enhanced batch recharge page
  - [`AccountSelector.tsx`](src/components/recharge/AccountSelector.tsx) - Account selection component
  - [`RechargePreview.tsx`](src/components/recharge/RechargePreview.tsx) - Recharge preview component
  - [`RechargeProgress.tsx`](src/components/recharge/RechargeProgress.tsx) - Progress tracking component
- **Dashboard Components**: New dashboard visualization components
  - [`BalanceTrendChart.tsx`](src/components/dashboard/BalanceTrendChart.tsx) - Balance trend chart with recharts
  - [`QuickActions.tsx`](src/components/dashboard/QuickActions.tsx) - Quick action buttons
  - [`WarningCard.tsx`](src/components/dashboard/WarningCard.tsx) - Warning cards with progressive severity
- **Backend API**: New API endpoints for extended functionality
  - [`telegram-groups.ts`](functions/api/telegram-groups.ts) - Telegram groups CRUD
  - [`billing-cycles.ts`](functions/api/billing-cycles.ts) - Billing cycle management
  - [`member-payments.ts`](functions/api/member-payments.ts) - Member payment tracking
  - [`audit.ts`](functions/api/audit.ts) - Audit log queries
  - [`balance-adjustments.ts`](functions/api/balance-adjustments.ts) - Balance adjustment records
  - [`accounts/[id]/balance.ts`](functions/api/accounts/[id]/balance.ts) - Account balance adjustment endpoint
- **Database Migrations**: Schema updates for new features
  - [`update_schema_v6.sql`](update_schema_v6.sql) - telegram_groups, billing_cycles, member_payments tables
  - [`update_schema_v7.sql`](update_schema_v7.sql) - audit_logs, balance_adjustments tables
  - [`update_schema_v8.sql`](update_schema_v8.sql) - Additional fields
- **UI Components**: Chakra UI v3 components
  - [`checkbox.tsx`](src/components/ui/checkbox.tsx) - Checkbox component
  - [`color-mode.tsx`](src/components/ui/color-mode.tsx) - Color mode toggle
  - [`field.tsx`](src/components/ui/field.tsx) - Form field wrapper
  - [`provider.tsx`](src/components/ui/provider.tsx) - Chakra provider
  - [`toaster.tsx`](src/components/ui/toaster.tsx) - Toast notifications
  - [`tooltip.tsx`](src/components/ui/tooltip.tsx) - Tooltip component

### Changed
- Migrated from Tailwind CSS to Chakra UI v3 for all components
- Enhanced ESLint configuration for better TypeScript support
- Updated all dashboard components with Chakra UI styling
- Improved type safety with new type definitions

### Technical
- Added VERSION file for semantic versioning
- Updated package.json version to 0.1.0
- Configured ESLint rules for progressive type improvement
