# 部署文檔

本專案已從 Cloudflare Pages + D1 完全遷移到自架 Docker 架構，不再依賴任何雲端平台。

完整的部署步驟（環境變數、啟動、更新版本、CI/CD 自動建置 image）請參閱根目錄的 [README.md](../README.md#-部署到自己的-vps-docker)。

## 摘要

1. VPS 上安裝 Docker / Docker Compose
2. `git clone` 這個 repo，`cp .env.example .env` 並填入 `APP_PASSWORD`（務必設定，否則整站不需要密碼即可存取）
3. `docker compose up -d --build`，或使用 `docker compose -f docker-compose.prod.yml up -d` 直接拉 CI 建置好的 image
4. 資料庫存在 named volume `subscription-manager-data`，重建容器不會遺失資料
5. 每日自動扣款由容器內建的 `node-cron` 排程執行，不需要額外設定外部 cron

如需舊版 Cloudflare Pages 部署方式（已停用，僅供歷史參考），請查閱 git 歷史紀錄中此檔案的舊版本。
