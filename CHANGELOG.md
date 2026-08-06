# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-06

### Added
- **Telegram 繳費提醒 Bot**：成員可以綁定自己的 Telegram（在「Apple ID 管理」/「訂閱關係對應」頁面的成員旁邊按紙飛機圖示產生一次性綁定連結），未繳費且帳單週期仍進行中的成員會定期收到私訊提醒（預設每 3 天一次，可用 `TELEGRAM_REMINDER_INTERVAL_DAYS` 調整）
  - 成員可在提醒訊息按「✅ 我已繳費」回報，但這只會標記「待確認」（`payment_reported_at`），**不會**自動變成已繳費——一定要管理員在「Telegram 群組」的帳單週期卡片按「確認收款」才算數，避免任何人隨口一按就讓系統誤判收到錢
  - Bot 用長輪詢（long polling）接收訊息，不需要對外開放額外的 webhook 端點；跟現有的低餘額通知共用同一個 `TELEGRAM_BOT_TOKEN`
  - 新增 [`server/src/lib/telegramBot.ts`](server/src/lib/telegramBot.ts)（綁定/回報邏輯）、[`server/src/reminders.ts`](server/src/reminders.ts)（提醒排程邏輯），新增 2 個後端整合測試

## [1.2.0] - 2026-08-05

系統邏輯全面審視後的修正：起因是發現「編輯帳號」表單可以不留原因、不留紀錄地直接改掉餘額，順勢檢查了整套後端邏輯，一併修掉發現的其他資料正確性與安全問題。

### Fixed
- **「編輯帳號」不再能直接改餘額**：餘額欄位改成唯讀顯示，只能透過「調整餘額」留下原因與操作者，後端 `PUT /api/accounts` 也直接忽略 body 裡的 `balance`，避免帳目跟 `balance_adjustments` 歷史脫鉤
- **自動扣款（sync）新增防重複機制**：手動觸發 `/api/sync` 若剛好跟每日排程落在同一天，過去會對同一筆訂閱重複扣款；現在每筆訂閱記錄 `last_deducted_date`，同一天只扣一次
- **月費起扣日在短月份（29/30/31 號）不會再整月被跳過**：改成扣款日超過當月天數時，自動改在當月最後一天扣款
- `services`（服務定價）、`members`（成員）的新增/修改/刪除補上完整的欄位驗證與 `audit_logs` 稽核紀錄——先前這兩張表完全沒有審計軌跡，改價格、加減成員查不到是誰、何時、改了什麼
- 刪除「訂閱」時，若底下仍有成員會擋下來（先前會靜默留下孤兒成員紀錄）
- 帳單週期建立後才加入的成員，現在會自動補上這一期的待繳紀錄，不會被漏掉催繳
- 登入的帳密比對、Basic Auth 比對改用固定長度雜湊後再比較，避免明碼字串比較留下時序側信道
- 移除未使用、且會讓歷史紀錄跟實際餘額脫鉤的 `POST /api/history` 端點

### Added
- 補上 6 個後端整合測試涵蓋以上修正（餘額編輯防護、sync 防重複扣款、服務驗證、訂閱刪除防護、帳單週期補登）

## [1.1.0] - 2026-08-05

### Added
- **網頁登入表單取代瀏覽器原生 Basic Auth 彈窗**：`/api/auth/login`（session cookie，7 天效期）+ 前端 [`Login.tsx`](src/pages/Login.tsx)；`/api/*` 仍同時支援 Basic Auth，curl/腳本呼叫方式不變
- 側邊欄新增「登出」按鈕
- 全站套用新的 Chakra v3 設計系統（Fira Sans/Fira Code 字體、accent 強調色、金額統一等寬對齊）
- 修正「訂閱關係對應」頁可讀性：卡片內文字從普遍 9-10px 加大、資訊改用清楚的分行呈現取代堆疊的彩色徽章

### Fixed
- Mapping.tsx 裡 18 處使用了 Chakra v3 不存在的 `emerald` 色名，實際上從未正確渲染，改回 `green`
- `trust proxy` 設定過於寬鬆，可被偽造 X-Forwarded-For 繞過登入限流

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
