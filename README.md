# Subscription Master (全能訂閱管理系統)

Subscription Master 是一個自架（self-hosted）的全端訂閱與帳號餘額管理工具，用於集中追蹤 Apple 帳號的儲值餘額、分配給多位家庭成員/Telegram 群組的訂閱服務，並每日自動執行扣費與 Telegram 低餘額警報。

整個系統（前端、API、SQLite 資料庫、每日排程扣款、Telegram 通知）打包成單一 Docker 容器，部署在自己的 VPS 上運行，不依賴任何雲端平台。

## 🌟 核心功能 (Features)

* **📊 總覽儀表板**：即時掌握所有帳號總餘額，自動推算本月預期支出，餘額不足 2 個月時發出警報，並列出即將生效的個別調價。
* **🔗 訂閱關係對應**：`[群組/主帳號] -> [群組成員] -> [Apple 帳號付款人] -> [多項訂閱服務]` 的視覺化卡片。每筆訂閱可獨立設定「服務登入帳號」（例如某個訂閱實際是用 Google 帳號登入 YouTube，但扣款仍走 Apple 帳號餘額）。
* **🌍 帳號地區與貨幣鎖定**：每個帳號可設定 App Store 地區（香港/土耳其/美國⋯），該帳號之後的加值與訂閱扣款都會強制使用對應貨幣，前後端雙重檢查、跨地區批次加值會被擋下。
* **📈 每筆訂閱獨立調價排程**：同一服務在不同帳號上可能因各自續訂週期而有不同的調漲生效日，調漲後價格／生效日是每筆訂閱各自設定，不是全服務共用。
* **💳 禮品卡批次加值**：批次輸入多張 Apple Gift Card 序號與金額，寫入對應帳號餘額，附帶歷史紀錄。
* **🛠️ 服務定價管理**：維護各項服務的價格、計費週期，可設定預設調漲計畫（新增訂閱時作為預設值繼承）。
* **🤖 自動扣款與 Telegram 通知**：容器內建 `node-cron` 每日排程，依每筆訂閱的起始扣款日與月/年費自動分攤扣款，餘額觸底時透過 Telegram Bot 通知。
* **💬 Telegram 繳費提醒 Bot**：成員綁定自己的 Telegram 後，未繳費且帳單週期仍進行中會定期收到私訊提醒，可在對話裡按「我已繳費」回報——回報只是待確認狀態，仍要管理員在後台按「確認收款」才會真的標記為已繳費，避免任何人隨口一按就讓系統誤判收到錢。
* **🔒 登入保護**：進站要先過一個網頁登入表單（帳密即 `.env` 的 `APP_USERNAME`/`APP_PASSWORD`），登入後用 session cookie 維持 7 天，避免部署到公開 VPS 後任何人都能讀寫財務資料；`/api/*` 也同時支援 HTTP Basic Auth，方便 curl/腳本呼叫。

---

## 💻 技術棧 (Tech Stack)

### 前端
* React 19 + TypeScript + Vite
* Chakra UI v3 + Lucide/React Icons
* React Router v7、SWR、Recharts

### 後端
* Node.js + Express
* better-sqlite3（同步 SQLite，資料存在容器掛載的 volume 裡）
* node-cron（容器內建每日排程，不依賴外部 cron 服務）

整個後端打包成單一 Docker image，`server/dist/public` 內嵌前端編譯後的靜態檔案，一個容器同時提供網頁與 API。

---

## 🚀 部署到自己的 VPS (Docker)

### 1. 前置需求

VPS 上安裝好 Docker 與 Docker Compose（1Panel 等面板通常已內建）。

### 2. 取得專案

```bash
git clone https://github.com/leowongco/SubscriptionManager.git
cd SubscriptionManager
```

### 3. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`：

| 變數 | 說明 |
|------|------|
| `APP_USERNAME` | 登入帳號，預設 `admin` |
| `APP_PASSWORD` | 登入密碼，**強烈建議一定要設定**，未設定時整站不會要求密碼（僅適合本機開發） |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token（選填，跟 [@BotFather](https://t.me/BotFather) 申請）。同一個 bot 同時用於低餘額通知、繳費提醒、成員綁定 |
| `TELEGRAM_CHAT_ID` | 接收低餘額通知的 chat ID（選填）|
| `TELEGRAM_REMINDER_CRON_SCHEDULE` | 繳費提醒排程，預設 `0 1 * * *`（UTC 01:00，約台灣/香港早上 9 點）|
| `TELEGRAM_REMINDER_INTERVAL_DAYS` | 同一筆未繳款項兩次提醒間隔幾天，預設 `3` |
| `SYNC_SECRET` | 手動觸發 `/api/sync` 端點用的密鑰（選填，每日自動扣款不需要這個）|
| `SYNC_CRON_SCHEDULE` | 每日扣款排程，預設 `10 0 * * *`（UTC 00:10）|

設定好 `TELEGRAM_BOT_TOKEN` 後，到「Apple ID 管理」或「訂閱關係對應」頁面，每個成員旁邊會出現一個紙飛機圖示——按下去會產生一個一次性的綁定連結（`https://t.me/你的bot/?start=...`），複製傳給該成員本人，對方在 Telegram 點開、按 Start 就完成綁定，之後繳費提醒會私訊發給他。

### 4. 啟動

用自己 build（適合會改程式碼的情況）：

```bash
docker compose up -d --build
```

或直接拉 GitHub Actions 自動建置好的 image（`docker-compose.prod.yml`，見下方 CI/CD 章節），不用在 VPS 上跑 build：

```bash
docker compose -f docker-compose.prod.yml up -d
```

啟動後打開 `http://<你的VPS>:<PANEL_APP_PORT_HTTP，預設 28174>`，用 `.env` 裡設定的帳密登入。

資料庫存在 named volume `subscription-manager-data`，容器重建、image 更新都不會遺失資料。

### 5. 更新版本

```bash
git pull
docker compose up -d --build
# 或使用 prod compose 檔時：
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d
```

### 6. 備份與還原

所有資料（帳號、訂閱、餘額、Telegram 群組⋯）都只存在 named volume `subscription-manager-data` 裡的一個 SQLite 檔案。VPS 本身出問題、被誤刪容器都會直接丟資料，**務必定期備份**。

**備份**（先短暫停機幾秒，確保沒有寫入到一半的資料被備份進去）：

```bash
docker compose stop
docker run --rm \
  -v subscriptionmanager_subscription-manager-data:/data \
  -v "$(pwd)/backups":/backup \
  alpine tar czf /backup/sm-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
docker compose start
```

（volume 實際名稱可能因 compose 專案資料夾名稱而不同，用 `docker volume ls` 確認正確名稱。）

建議寫成 cron job 排程，例如每天凌晨備份一次：

```bash
crontab -e
# 加入：
0 3 * * * cd /path/to/SubscriptionManager && docker compose stop && docker run --rm -v subscriptionmanager_subscription-manager-data:/data -v /path/to/backups:/backup alpine tar czf /backup/sm-backup-$(date +\%Y\%m\%d).tar.gz -C /data . && docker compose start
```

**還原**：

```bash
docker compose stop
docker run --rm \
  -v subscriptionmanager_subscription-manager-data:/data \
  -v "$(pwd)/backups":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/sm-backup-YYYYMMDD-HHMMSS.tar.gz -C /data"
docker compose start
```

---

## 🖥️ 本機開發

前端：

```bash
npm install
npm run dev
```

後端：

```bash
cd server
npm install
npm run dev
```

後端預設監聽 `3000` port，開發模式下未設定 `APP_PASSWORD` 則不要求登入。

### 測試

```bash
npm test          # 前端：vitest，測 src/lib 底下的工具函數
cd server && npm test   # 後端：node:test + supertest，測認證、刪除防呆、貨幣驗證等 API 行為
```

`.github/workflows/test.yml` 會在每次 push/PR 時自動跑這兩組測試 + build。

---

## 🔄 CI/CD

- `.github/workflows/test.yml`：每次 push/PR 自動跑前後端測試與 build，確保沒有明顯壞掉。
- `.github/workflows/docker-publish.yml`：push `v*` tag 時自動 build 這個 repo 的 Dockerfile，並推到 GitHub Container Registry（`ghcr.io/leowongco/subscriptionmanager`），不需要額外設定任何 secret。若想同時推到 Docker Hub，在 repo 的 Settings → Secrets 裡加上 `DOCKERHUB_USERNAME` 與 `DOCKERHUB_TOKEN` 即可自動一併推送，詳見 workflow 檔案內註解。

---

## 🔌 API 文檔

詳見 [docs/API.md](docs/API.md)。所有 `/api/*` 端點都受保護：瀏覽器走 `/api/auth/login` 拿到的 session cookie，或 curl/腳本可直接用 `APP_USERNAME`/`APP_PASSWORD` 的 Basic Auth。

---

## 📁 專案結構

```
SubscriptionManager/
├── src/                    # 前端源碼
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── types/
├── server/                 # 自架後端（Express + better-sqlite3）
│   └── src/
│       ├── routes/         # API 路由
│       ├── middleware/     # Basic Auth
│       ├── lib/            # audit/telegram/currency 等工具
│       ├── schema.sql      # 資料庫結構
│       └── cron.ts         # 每日自動扣款排程
├── docs/                   # 文檔
├── Dockerfile              # 前端+後端多階段建置
├── docker-compose.yml      # 本機 build 部署
└── docker-compose.prod.yml # 使用 CI 建置好的 image 部署
```

---

## 📄 授權

MIT License
