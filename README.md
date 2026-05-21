# Subscription Master (全能訂閱管理系統)

Subscription Master 是一個基於 Cloudflare 生態系統（Pages Functions + D1 SQLite）構建的全端訂閱與帳號餘額管理工具。它可以協助您集中追蹤 Apple ID 的儲值餘額、發配給多位家庭成員的 Google 帳號訂閱狀態，並每月自動模擬扣費與警報。

## 🌟 核心功能 (Features)

*   **📊 總覽儀表板 (Dashboard)**：即時掌握所有蘋果帳號總餘額，自動加總各個 Apple ID 下的「多個訂閱服務」推算本月預期支出，當餘額不足 2 個月時自動發出紅色預警聲明。
*   **🔗 訂閱關係對應 (Relationship Mapping)**：視覺化的卡片層級，展示 `[群組/主帳號名稱] -> [群組成員] -> [Apple ID 付款人] -> [多項訂閱服務]` 之間的脈絡。支援在單一 Apple ID 下綁定多個擁有獨立「扣款日」及「計費週期（月/年）」的服務。
*   **💳 禮品卡批次加值 (Batch Recharge)**：提供批次表單介面，一次性輸入多張 Apple Gift Card 序號與金額，並寫入對應的蘋果帳號餘額中，附帶歷史紀錄分頁。
*   **🛠️ 服務定價管理 (Service Manager)**：維護各項訂閱服務（例如 YouTube Premium, iCloud）的價格、計費週期。支援設定**未來漲價日期**，系統時間到達後自動採用新費率。
*   **🤖 自動化扣款與通知 (Automation & Notifications)**：透過 API 端點模擬每月排程扣費，精準地依照每個獨立訂閱項目的「起始扣款日」與「年/月費」進行分攤扣款。結合 **Telegram Bot**，餘額觸底時第一時間傳送通知。
*   **🛡️ 企業級安全防護 (Cloudflare Access)**：內建中介層攔截器 (`_middleware.ts`)，可驗證 JWT Token 保障 API 端點不被惡意呼叫。

---

## 💻 技術棧 (Tech Stack)

### 前端
*   **框架**：React 18 + TypeScript + Vite
*   **樣式與組件**：Chakra UI v3 + Tailwind CSS + Lucide Icons
*   **路由**：React Router v7
*   **資料獲取**：SWR (Stale-While-Revalidate)
*   **圖表**：Recharts

### 後端
*   **API**：Cloudflare Pages Functions (Serverless)
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

1. 建立資料庫：
   ```bash
   wrangler d1 create subscription-manager
   ```

2. 複製畫面上的 `Database ID`。

3. 打開專案根目錄的 `wrangler.toml` 檔案，尋找 `[[d1_databases]]` 區塊，並將 `database_id` 替換為您的 ID：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "subscription-manager"
   database_id = "您的-資料庫-ID"
   migrations_dir = "migrations"
   ```

4. 將表格結構推送到雲端資料庫：
   ```bash
   # 基礎結構
   wrangler d1 execute subscription-manager --file=schema.sql

   # 版本更新遷移
   wrangler d1 execute subscription-manager --file=update_schema_v2.sql
   wrangler d1 execute subscription-manager --file=update_schema_v3.sql
   wrangler d1 execute subscription-manager --file=update_schema_v4.sql
   wrangler d1 execute subscription-manager --file=update_schema_v5.sql
   wrangler d1 execute subscription-manager --file=update_schema_v6.sql
   wrangler d1 execute subscription-manager --file=update_schema_v7.sql
   wrangler d1 execute subscription-manager --file=update_schema_v8.sql
   ```

5. 本地開發時使用本地資料庫：
   ```bash
   # 基礎結構
   wrangler d1 execute subscription-manager --local --file=schema.sql

   # 版本更新遷移
   wrangler d1 execute subscription-manager --local --file=update_schema_v2.sql
   wrangler d1 execute subscription-manager --local --file=update_schema_v3.sql
   wrangler d1 execute subscription-manager --local --file=update_schema_v4.sql
   wrangler d1 execute subscription-manager --local --file=update_schema_v5.sql
   wrangler d1 execute subscription-manager --local --file=update_schema_v6.sql
   wrangler d1 execute subscription-manager --local --file=update_schema_v7.sql
   wrangler d1 execute subscription-manager --local --file=update_schema_v8.sql
   ```

### 3. 本地端開發伺服器 (Local Development)

當您的 API 已經部署在線上後，只要修改專案 `vite.config.ts` 中的 `proxy` 將 `/api` 指向您的 Pages 網址，您就可以使用以下指令在本機調試完美 UI 介面，並讀寫雲端真實數據：

```bash
npm run dev
```

### 4. 構建生產版本

```bash
npm run build
```

---

## ☁️ 部署到 Cloudflare Pages

### 1. 構建並部署

```bash
npm run build
npx wrangler pages deploy dist
```

### 2. 配置 D1 資料庫綁定

第一次部署後，請至 Cloudflare 網頁控制台進行以下設定：

1. 進入您的 Pages 專案頁面
2. **Settings (設定)** -> **Functions (函式)** -> **D1 database bindings**
3. 新增綁定：
   - **Variable name**: `DB`
   - **D1 database**: 選擇您建立的 `subscription-manager`
4. 點擊右上角 **Retry deployment** 重新部署

### 3. 環境變數設定（選配）

在 **Settings** -> **Environment variables** 中新增：

| 變數名稱 | 說明 |
|---------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token（透過 @BotFather 申請）|
| `TELEGRAM_CHAT_ID` | 接收通知的個人或群組 ID |

---

## 🔌 API 文檔

詳細的 API 文檔請參閱 [docs/API.md](docs/API.md)。

### 主要端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/accounts` | GET, POST | 帳號管理 |
| `/api/services` | GET, POST | 服務管理 |
| `/api/subscriptions` | GET, POST | 訂閱關係管理 |
| `/api/members` | GET, POST | 成員管理 |
| `/api/recharge` | POST | 批次加值 |
| `/api/sync` | POST | 同步扣款 |
| `/api/telegram-groups` | GET, POST | Telegram 群組管理 |

---

## 🔔 Telegram 機器人通知設定 (選配)

本專案支援可用餘額小於 2 個月時的自動推送。設定完成後，呼叫 `/api/sync` 端點時系統即會進行扣繳運算並推送警示。

---

## 📁 專案結構

```
SubscriptionManager/
├── src/                    # 前端源碼
│   ├── components/         # React 組件
│   │   ├── ui/            # UI 基礎組件
│   │   ├── dashboard/     # 儀表板組件
│   │   ├── accounts/      # 帳號管理組件
│   │   └── recharge/      # 加值相關組件
│   ├── pages/             # 頁面組件
│   ├── lib/               # 工具函數
│   └── types/             # TypeScript 類型定義
├── functions/             # Cloudflare Pages Functions (API)
│   └── api/               # API 端點
├── docs/                  # 文檔
├── public/                # 靜態資源
└── schema.sql            # 資料庫結構
```

---

## 📄 授權

MIT License

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！
