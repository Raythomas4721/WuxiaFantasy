# 江湖一生

繁體中文的武俠人生模擬卡牌遊戲。React 18 + TypeScript + Vite，引擎是純函式（`src/engine/`），內容是資料（`src/content/`）。

## 固定規矩

- 回覆使用者一律用繁體中文。
- 所有人名、門派、招式、文字都要原創，不借用現有作品。
- commit 訊息用繁體中文。每做完一個功能就 commit 並 push 到 `main`（會自動部署到 GitHub Pages）。
- 測試從簡：`npx tsc --noEmit -p .`、`npm run validate`、`npx vitest run`、`npm run simulate -- --runs 300`。
- 不要安裝外部的 skill 或 plugin。
- 目標是第一輪人生就好玩、容易走完；不要為了深度把難度調高。

## 動手之前

在這個 repo 裡改遊戲內容或引擎之前，先讀 `.claude/skills/jianghu-dev/SKILL.md`。裡面有加事件的步驟、後續事件為什麼常常遇不到、驗證基準、在瀏覽器裡檢查時怎麼保護使用者的存檔，以及回報的寫法。
