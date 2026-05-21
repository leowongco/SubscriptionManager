# 部署文檔

本文檔詳細說明如何將 Subscription Master 部署到 Cloudflare Pages。

---

## 目錄

1. [前置需求](#前置需求)
2. [環境變量配置](#環境變量配置)
3. [資料庫遷移](#資料庫遷移)
4. [部署步驟](#部署步驟)
5. [部署後配置](#部署後配置)
6. [常見問題](#常見問題)

---

## 前置需求

### 必要工具

- **Node.js** v18 或更高版本
- **npm** 或 **pnpm**
- **Wrangler CLI** (Cloudflare 官方 CLI 工具)

### 安裝 Wrangler

```bash
npm install -g wrangler
```

### Cloudflare 帳號

1. 前往 [Cloudflare](https://dash.cloudflare.com/) 註冊帳號
2. 驗證電子郵件地址
3. （建議）啟用兩步驗證

---

## 環境變量配置

### 必要環境變量

| 變量名稱 | 說明 | 是否必填 |
|---------|------|---------|
| 無 | 基本功能無需環境變量 | - |

### 可選環境變量

| 變量名稱 | 說明 | 預設值 |
|---------|------|--------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | 無 |
| `TELEGRAM_CHAT_ID` | 接收通知的 Chat ID | 無 |

### 設置環境變量

#### 方法一：Cloudflare Dashboard

1. 登入 Cloudflare Dashboard
2. 進入 **Workers & Pages** > 選擇您的專案
3. 點擊 **Settings** > **Environment variables**
4. 點擊 **Add variable** 添加變量
5. 選擇 **Production** 和/或 **Preview** 環境

#### 方法二：Wrangler CLI

```bash
# 設置生產環境變量
wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name=subscription-manager
wrangler pages secret put TELEGRAM_CHAT_ID --project-name=subscription-manager
```

---

## 資料庫遷移

### 創建 D1 資料庫

```bash
# 創建資料庫（如果尚未創建）
wrangler d1 create subscription-manager
```

創建完成後，複製顯示的 `Database ID`。

### 更新 wrangler.toml

編輯專案根目錄的 `wrangler.toml`，將 `database_id` 替換為您的資料庫 ID：

```toml
name = "subscription-master"
compatibility_date = "2024-03-20"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "subscription-manager"
database_id = "您的資料庫ID"
migrations_dir = "migrations"
```

### 執行資料庫遷移

#### 遠端資料庫（生產環境）

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

#### 本地資料庫（開發環境）

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

### 驗證資料庫結構

```bash
# 列出所有表（遠端）
wrangler d1 execute subscription-manager --command="SELECT name FROM sqlite_master WHERE type='table';"

# 列出所有表（本地）
wrangler d1 execute subscription-manager --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# 查看特定表結構
wrangler d1 execute subscription-manager --command="PRAGMA table_info(accounts);"
```

---

## 部署步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. 構建專案

```bash
npm run build
```

構建完成後，靜態檔案會輸出到 `dist/` 目錄。

### 3. 部署到 Cloudflare Pages

#### 方法一：Wrangler CLI（推薦）

```bash
npx wrangler pages deploy dist --project-name=subscription-manager
```

首次部署會提示創建新專案，選擇 **Create a new project**。

#### 方法二：Git 整合

1. 將代碼推送到 GitHub 或 GitLab
2. 在 Cloudflare Dashboard 中：
   - 進入 **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
   - 選擇您的 Git 倉庫
   - 配置構建設定：
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - 點擊 **Save and Deploy**

### 4. 獲取部署 URL

部署完成後，您會獲得一個 `.pages.dev` 域名，例如：
```
https://subscription-manager.pages.dev
```

---

## 部署後配置

### 1. 綁定 D1 資料庫

**重要**：首次部署後必須手動綁定資料庫。

1. 進入 Cloudflare Dashboard
2. 選擇您的 Pages 專案
3. 點擊 **Settings** > **Functions**
4. 找到 **D1 database bindings**
5. 點擊 **Add binding**：
   - **Variable name**: `DB`
   - **D1 database**: 選擇 `subscription-manager`
6. 點擊 **Save**

### 2. 重新部署

綁定資料庫後，需要重新部署：

```bash
npx wrangler pages deploy dist --project-name=subscription-manager
```

或在 Dashboard 中點擊 **Retry deployment**。

### 3. 配置自定義域名（可選）

1. 進入 **Settings** > **Custom domains**
2. 點擊 **Set up a custom domain**
3. 輸入您的域名
4. 按照指示添加 DNS 記錄

### 4. 配置 Telegram 通知（可選）

如需啟用 Telegram 通知：

1. 向 @BotFather 申請 Bot Token
2. 獲取您的 Chat ID（可使用 @userinfobot）
3. 在環境變量中設置：
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

---

## 常見問題

### Q: 部署後 API 返回 500 錯誤

**A**: 檢查以下項目：
1. D1 資料庫是否正確綁定
2. 資料庫表是否已創建
3. 環境變量是否正確設置

### Q: 如何查看 API 日誌

**A**: 
1. 進入 Cloudflare Dashboard
2. 選擇您的 Pages 專案
3. 點擊 **Logs** > **Real-time Logs**
4. 發送請求以查看即時日誌

### Q: 如何回滾到之前的版本

**A**:
1. 進入 Cloudflare Dashboard
2. 選擇您的 Pages 專案
3. 在 **Deployments** 列表中找到目標版本
4. 點擊 **...** > **Rollback to this deployment**

### Q: 如何更新資料庫結構

**A**:
```bash
# 創建新的遷移文件
# update_schema_v9.sql

# 執行遷移
npx wrangler d1 execute subscription-manager --remote --file=./update_schema_v9.sql
```

### Q: 本地開發如何連接生產資料庫

**A**: 編輯 `vite.config.ts` 中的 proxy 配置：

```typescript
proxy: {
  '/api': {
    target: 'https://your-production-url.pages.dev',
    changeOrigin: true
  }
}
```

### Q: 如何設置定時同步扣款

**A**: 使用 Cloudflare Workers Cron Triggers：

1. 創建一個 Worker 調用 `/api/sync` 端點
2. 在 `wrangler.toml` 中配置 cron 觸發器：

```toml
[triggers]
crons = ["0 0 1 * *"]  # 每月 1 日 00:00 UTC
```

---

## 安全建議

1. **啟用 Cloudflare Access**：為管理介面添加額外的身份驗證層
2. **配置 CORS**：在 `_middleware.ts` 中限制允許的來源
3. **定期備份**：定期導出 D1 資料庫數據
4. **監控用量**：關注 D1 和 Pages Functions 的用量

---

## 效能優化

1. **啟用 Cloudflare CDN**：自動啟用，無需配置
2. **圖片優化**：使用 Cloudflare Images 服務
3. **快取策略**：在 `_middleware.ts` 中配置適當的快取標頭

---

## 支援

如有問題，請：
1. 查閱 [Cloudflare 文檔](https://developers.cloudflare.com/)
2. 提交 GitHub Issue
3. 加入官方社群討論
