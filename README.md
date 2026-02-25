# Subscription Master (全能訂閱管理系統)

Subscription Master 是一個基於 Cloudflare 生態系統（Pages Functions + D1 SQLite）構建的全端訂閱與帳號餘額管理工具。它可以協助您集中追蹤 Apple ID 的儲值餘額、發配給多位家庭成員的 Google 帳號訂閱狀態，並每月自動模擬扣費與警報。

## 🌟 核心功能 (Features)

*   **📊 總覽儀表板 (Dashboard)**：即時掌握所有蘋果帳號總餘額、推算本月預期支出，當餘額不足 2 個月時自動發出紅色預警聲明。
*   **🔗 訂閱關係對應 (Relationship Mapping)**：視覺化的卡片層級，展示 `[Google 子帳號] -> [群組成員] -> [Apple ID 付款人]` 之間的脈絡，並可一鍵切換成員的本期繳費狀態。
*   **💳 禮品卡批次加值 (Batch Recharge)**：提供批次表單介面，一次性輸入多張 Apple Gift Card 序號與金額，並寫入對應的蘋果帳號餘額中。
*   **🛠️ 服務定價管理 (Service Manager)**：維護各項訂閱服務（例如 YouTube Premium）的跨區價格、計費週期。支援設定**未來漲價日期**，系統時間到達後自動採用新費率。
*   **🤖 自動化扣款與通知 (Automation & Notifications)**：透過 API 端點模擬每月排程扣費，更新剩餘可用餘額（Months Left）。結合 **Telegram Bot**，餘額觸底時第一時間傳送通知。
*   **🛡️ 企業級安全防護 (Cloudflare Access)**：內建中介層攔截器 (`_middleware.ts`)，可驗證 JWT Token 保障 API 端點不被惡意呼叫。

---

## 💻 技術棧 (Tech Stack)

*   **前端框架**：React 18 + TypeScript + Vite
*   **樣式與組件**：Tailwind CSS + Shadcn UI + Lucide Icons
*   **資料獲取**：SWR (Stale-While-Revalidate)
*   **後端與 API**：Cloudflare Pages Functions (Serverless)
*   **資料庫**：Cloudflare D1 (Serverless SQLite)

---

## 🚀 快速開始 (Getting Started)

### 1. 安裝環境依賴
請確保您的電腦已安裝 [Node.js](https://nodejs.org/) (建議 v18+) 與 `npm`。
```bash
git clone https://github.com/leowongco/SubscriptionManager.git
cd SubscriptionManager
npm install
```

### 2. 資料庫初始化 (Cloudflare D1)
本專案依賴 Cloudflare D1 作為資料庫（免費額度非常夠用）。
1. 登入您的 Cloudflare 帳號，前往 **Workers & Pages** -> **D1 SQL Database**。
2. 建立一個名為 `subscription-manager` 的資料庫。
3. 複製畫面上的 `Database ID`。
4. 打開專案根目錄的 `wrangler.toml` 檔案，尋找 `[[d1_databases]]` 區塊，並將 `database_id` 替換為您的 ID：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "subscription-manager"
   database_id = "您的-資料庫-ID"
   migrations_dir = "migrations"
   ```
5. 將表格結構 (`schema.sql`) 正式推送到雲端資料庫：
   ```bash
   npx wrangler d1 execute subscription-manager --remote --file=./schema.sql
   ```

### 3. 本地端開發伺服器 (Local Development)
當您的 API 已經部署在線上後（見下方章節），只要修改專案 `vite.config.ts` 中的 `proxy` 將 `/api` 指向您的 Pages 網址，您就可以使用以下指令在本機調試完美 UI 介面，並讀寫雲端真實數據：
```bash
npm run dev
```

---

## ☁️ 部署到 Cloudflare Pages

1. 確保已編譯最新的靜態檔案：
   ```bash
   npm run build
   ```
2. 使用 Wrangler CLI 一鍵上傳：
   ```bash
   npx wrangler pages deploy dist
   ```
3. **重要設定**：第一次部署後，請至 Cloudflare 網頁控制台 -> 進入您的 Pages 專案頁面 -> **Settings (設定)** -> **Functions (函式)** -> 尋找 **D1 database bindings (D1 資料庫綁定)**。
   * **Variable name**: 輸入 `DB`
   * **D1 database**: 選擇您建立的 `subscription-manager`
   配置完成後請點擊右上角 **Retry deployment** 重新部署一次，網站即可正常連線使用。

---

## 🔔 Telegram 機器人通知設定 (選配)
本專案支援可用餘額小於 2 個月時的自動推送。請至 Cloudflare Pages 控制台的 **Settings (設定)** -> **Environment variables (環境變數)** 中新增以下機密變數：
- `TELEGRAM_BOT_TOKEN`: 透過 @BotFather 申請的機器人 Token。
- `TELEGRAM_CHAT_ID`: 您接收通知的個人或群組 ID。

一旦設定完畢，呼叫 `/api/sync` 端點時系統即會進行扣繳運算並推送警示。
