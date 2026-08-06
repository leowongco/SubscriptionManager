# API 文檔

本文檔描述 Subscription Master 的所有 API 端點。

## 基礎 URL

```
http://<你的VPS>:3000/api
```

## 認證

所有 `/api/*` 端點都受保護，支援兩種方式（擇一即可）：

1. **Session cookie**（給瀏覽器用）：`POST /api/auth/login` 帶 `{ username, password }`，成功後伺服器會設一個 7 天效期、HttpOnly 的 `sm_session` cookie，之後同一瀏覽器的請求都會自動帶上。`POST /api/auth/logout` 登出、`GET /api/auth/me` 查詢目前登入狀態。
2. **HTTP Basic Auth**（給 curl / 腳本用）：帳密為 `.env` 裡的 `APP_USERNAME` / `APP_PASSWORD`，例如 `curl -u admin:your-password http://.../api/accounts`。

未設定 `APP_PASSWORD` 時（僅限本機開發）不要求認證。

---

## 帳號管理 (Accounts)

### GET /api/accounts

獲取所有帳號列表，包含關聯的訂閱和成員信息。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "apple_id": "example@icloud.com",
    "group_name": "家庭群組",
    "balance": 150.00,
    "currency": "HKD",
    "last_sync_date": "2024-01-15T10:30:00Z",
    "subscriptions": [
      {
        "id": "sub-uuid",
        "service_id": "service-uuid",
        "service_name": "YouTube Premium",
        "base_price": 15.00,
        "currency": "HKD",
        "cycle": "monthly",
        "start_date": "2024-01-01",
        "members": [
          {
            "id": "member-uuid",
            "email": "member1@gmail.com"
          }
        ]
      }
    ]
  }
]
```

### POST /api/accounts

創建新帳號。

**請求體：**
```json
{
  "apple_id": "example@icloud.com",
  "group_name": "家庭群組",
  "balance": 100.00
}
```

**響應：**
```json
{
  "id": "uuid",
  "message": "Account created successfully"
}
```

### PUT /api/accounts

更新現有帳號。

**請求體：**
```json
{
  "id": "uuid",
  "apple_id": "example@icloud.com",
  "group_name": "家庭群組",
  "balance": 200.00
}
```

### DELETE /api/accounts?id={uuid}

刪除帳號。

**查詢參數：**
- `id` (必填): 帳號 UUID

---

## 服務管理 (Services)

### GET /api/services

獲取所有服務列表。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "name": "YouTube Premium",
    "base_price": 15.00,
    "currency": "HKD",
    "cycle": "monthly",
    "future_price": null,
    "future_price_date": null
  }
]
```

### POST /api/services

創建新服務。

**請求體：**
```json
{
  "name": "YouTube Premium",
  "base_price": 15.00,
  "currency": "HKD",
  "cycle": "monthly",
  "future_price": 18.00,
  "future_price_date": "2024-06-01"
}
```

### PUT /api/services

更新現有服務。

### DELETE /api/services?id={uuid}

刪除服務。

---

## 訂閱關係管理 (Subscriptions)

### GET /api/subscriptions

獲取所有訂閱關係。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "account_id": "account-uuid",
    "service_id": "service-uuid",
    "group_name": "家庭方案",
    "start_date": "2024-01-01",
    "service_name": "YouTube Premium",
    "base_price": 15.00,
    "currency": "HKD",
    "cycle": "monthly"
  }
]
```

### POST /api/subscriptions

創建新訂閱關係。

**請求體：**
```json
{
  "account_id": "account-uuid",
  "service_id": "service-uuid",
  "group_name": "家庭方案",
  "start_date": "2024-01-15"
}
```

### DELETE /api/subscriptions?id={uuid}

刪除訂閱關係。

---

## 成員管理 (Members)

### GET /api/members

獲取所有成員列表。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "subscription_id": "sub-uuid",
    "email": "member@gmail.com"
  }
]
```

### POST /api/members

創建新成員。

**請求體：**
```json
{
  "subscription_id": "sub-uuid",
  "email": "member@gmail.com"
}
```

### DELETE /api/members?id={uuid}

刪除成員。若該成員仍有繳費紀錄（`member_payments`）會被擋下來，需先在收款週期裡處理。

### POST /api/members/{id}/telegram-bind-link

產生一次性的 Telegram 綁定連結，複製傳給成員本人，對方在 Telegram 點開並按 Start 即完成綁定。需要伺服器已設定 `TELEGRAM_BOT_TOKEN`。

**響應示例：**
```json
{ "bind_url": "https://t.me/your_bot?start=<token>" }
```

### DELETE /api/members/{id}/telegram-bind

解除該成員的 Telegram 綁定（例如成員換了帳號）。

---

## Telegram 群組管理 (Telegram Groups)

### GET /api/telegram-groups

獲取所有 Telegram 群組。`chat_id` 是群組聊天室本身的 chat_id（選填），設定後繳費提醒會整批發到這個群組，不需要每個成員各自綁定。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "name": "家庭群組",
    "telegram_link": "https://t.me/your-group",
    "start_date": "2024-01-01",
    "billing_cycle_type": "monthly",
    "chat_id": "-1001234567890",
    "notes": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /api/telegram-groups

創建新 Telegram 群組。

**請求體：**
```json
{
  "name": "家庭群組",
  "start_date": "2024-01-01",
  "billing_cycle_type": "monthly",
  "chat_id": "-1001234567890"
}
```

要指定哪些訂閱屬於這個群組，用 `PUT /api/subscriptions?id={uuid}` 帶 `{ "telegram_group_id": "<這個群組的 id>" }`（前端「Telegram 群組」詳情頁的「管理關聯訂閱」就是包了這支端點）。

---

## 批次加值 (Recharge)

### POST /api/recharge

執行批次加值操作。

**請求體：**
```json
{
  "recharges": [
    {
      "account_id": "account-uuid",
      "amount": 100.00,
      "card_code": "XXXX-XXXX-XXXX",
      "currency": "HKD"
    }
  ]
}
```

**響應示例：**
```json
{
  "success": true,
  "results": [
    {
      "account_id": "account-uuid",
      "amount": 100.00,
      "status": "success"
    }
  ]
}
```

---

## 餘額調整 (Balance Adjustments)

### GET /api/balance-adjustments

獲取餘額調整歷史記錄。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "account_id": "account-uuid",
    "amount": 50.00,
    "type": "recharge",
    "description": "禮品卡加值",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### POST /api/balance-adjustments

創建餘額調整記錄。

**請求體：**
```json
{
  "account_id": "account-uuid",
  "amount": 50.00,
  "type": "adjustment",
  "description": "手動調整"
}
```

---

## 帳號餘額操作

### POST /api/accounts/{id}/balance

調整特定帳號的餘額。

**路徑參數：**
- `id`: 帳號 UUID

**請求體：**
```json
{
  "amount": 100.00,
  "type": "recharge",
  "description": "禮品卡加值"
}
```

---

## 同步與扣款 (Sync)

### POST /api/sync

執行月度扣款同步。此端點會：
1. 計算所有訂閱的月度費用
2. 從對應帳號扣除費用
3. 發送 Telegram 通知（如餘額不足）

**響應示例：**
```json
{
  "success": true,
  "deducted": [
    {
      "account_id": "account-uuid",
      "amount": 15.00,
      "service": "YouTube Premium"
    }
  ],
  "warnings": [
    {
      "account_id": "account-uuid",
      "balance": 30.00,
      "months_left": 1.5
    }
  ]
}
```

---

## 歷史記錄 (History)

### GET /api/history

獲取所有歷史記錄。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "account_id": "account-uuid",
    "type": "recharge",
    "amount": 100.00,
    "description": "禮品卡加值",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## 帳單週期 (Billing Cycles)

### GET /api/billing-cycles

獲取帳單週期列表。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "telegram_group_id": "group-uuid",
    "cycle_name": "2024年1月",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "status": "active"
  }
]
```

---

## 成員付款 (Member Payments)

### GET /api/member-payments

獲取成員付款記錄。`payment_reported_at` 是成員在 Telegram bot 裡自己按「我已繳費」回報的時間——這只是回報，不代表已收款；要靠 `PUT /api/member-payments?id=` 帶 `paid: true` 才是管理員確認收款，`paid` 才會變成 `1`。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "member_id": "member-uuid",
    "billing_cycle_id": "cycle-uuid",
    "amount": 15.00,
    "paid": 0,
    "paid_at": null,
    "payment_reported_at": "2024-01-15T10:00:00Z",
    "last_reminded_at": "2024-01-14T01:00:00Z"
  }
]
```

---

## 審計日誌 (Audit)

### GET /api/audit

獲取系統審計日誌。

**響應示例：**
```json
[
  {
    "id": "uuid",
    "action": "account_created",
    "entity_type": "account",
    "entity_id": "account-uuid",
    "details": "{\"apple_id\":\"example@icloud.com\"}",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## 錯誤響應

所有端點在發生錯誤時會返回以下格式：

```json
{
  "error": "錯誤信息描述",
  "status": 400
}
```

常見 HTTP 狀態碼：
- `200` - 成功
- `201` - 創建成功
- `400` - 請求參數錯誤
- `404` - 資源不存在
- `500` - 服務器錯誤

---

## 認證

API 端點可選擇配置 JWT 認證。如需啟用，請在 Cloudflare Pages 設置環境變量並配置 `_middleware.ts`。
