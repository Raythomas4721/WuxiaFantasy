---
name: jianghu-dev
description: 開發《江湖一生》（這個 repo 的武俠人生模擬卡牌遊戲）的做法：新增或修改事件、劇情線、門派、結局、首領、方針、數值平衡，以及改完之後怎麼驗證、怎麼在瀏覽器裡檢查、怎麼回報。只要是在這個 repo 裡動遊戲內容或引擎，或使用者問「還可以優化什麼」「加故事」「某件事遇不到」「結局太集中」「太難／太簡單」，都先讀這份，即使使用者沒有提到 skill。
---

# 江湖一生：開發做法

這份文件記的是這個專案反覆用過、而且踩過坑才確定的做法。固定規矩（語言、commit、push）寫在 repo 根目錄的 `CLAUDE.md`，這裡不重複。

## 專案長什麼樣

純函式引擎加內容資料，React 只負責畫面。

| 位置 | 內容 |
|---|---|
| `src/engine/` | 規則。`game.ts`（回合流程）、`select.ts`（挑事件）、`conditions.ts`、`effects.ts`、`text.ts`（文字樣板）、`duel.ts`／`duelAI.ts`（過招）、`threads.ts`（心事）、`advice.ts`（「宜」標籤）、`autoplay.ts`（自動玩一生）、`validate.ts` |
| `src/content/` | 資料。`events/*.ts`（事件）、`threads.ts`（心事）、`endings.ts`（結局與志向）、`world.ts`（方針、門派、人物、地區）、`duel.ts`／`taunts.ts`（對手）、`market.ts`、`dsl.ts`（寫效果用的短函式） |
| `src/content/index.ts` | 內容總表。新的事件檔要在這裡匯入並加進 `events` |
| `src/ui/` | 畫面 |
| `tests/` | vitest |
| `scripts/` | `simulate.ts`、`validate-content.ts`、`duel-sim.ts` |

型別都在 `src/engine/types.ts`。寫條件前先看 `Condition`，寫效果前先看 `dsl.ts`，不要憑印象猜欄位名。

## 加一件事（事件）的步驟

1. 找一個寫法相近的現有事件照著寫。門派的事放 `events/sects.ts`，成家的事放 `events/family.ts`，其餘依人生階段或主題放。
2. 效果用 `dsl.ts` 的函式（`flag`、`rel`、`xp`、`later`、`goTo`…）。用到新的函式記得加進該檔的 import，漏掉的話 `tsc` 會過不了；多匯入沒用到的也會過不了（`noUnusedLocals`）。
3. 文字裡的 `{name}`、`{companion}`、`{spouse}`、`{ageCn}` 等只能用 `text.ts` 的 `TEMPLATE_KEYS` 裡有的；事件自己的變數放 `vars`。
4. 值得寫進一生回顧的結果加 `recap: { weight, text }`。
5. 新檔案要在 `src/content/index.ts` 註冊。
6. 如果這件事是一條線的一環，在 `content/threads.ts` 加一條心事，`advances` 指向它，玩家才看得到這條線在哪裡。

名字和文字一律原創：不借用任何現有小說、遊戲、影視的人名、門派名、招式名、台詞。

## 最容易白做的地方：後續事件遇不到

事件的挑選順序是：`forced`（條件符合就一定發生）→ 到期的排程 → 依權重從池子裡抽。池子很大，一生只有三十幾回合，所以**靠隨機抽的後續事件幾乎遇不到**。這個專案裡好幾條線（醉劍三碗酒、門派故事、成家）第一版都是寫了卻沒人遇到。

所以，凡是「做了 A 之後應該會有 B」：

- 在 A 的選項結果裡用 `later('B', 最早幾年後, 最晚幾年後, 過期年數)` 排上日程，B 設 `scheduledOnly: true`（或保留條件，讓它也能被抽到）。
- 「到了那個時候一定要發生」的事（例如圍城時的斷糧）用 `kind: 'forced'` 加 `priority`。
- B 的條件不要綁死地區。玩家多半已經離開了，需要回去就在 A 的效果裡加 `goTo`，或乾脆不設地區。
- 牽涉到人物的事用 `npcAlive`，免得人死了事件還在等。

寫完一定用下面的小工具量一次，不要假設它會出現。

另外兩個相關的坑：

- 幼年的回合很少（六歲前每回合兩年），固定的 forced 事件會佔掉大半，新的幼年事件要確認真的排得進去。
- 新結局要看 `priority`：條件較寬、優先度又高的結局會把別的結局吃掉。加了讓某個旗標更容易拿到的事件，對應的結局比例會跟著漲。

## 改完之後的驗證

測試從簡，但這四步每次都跑（都很快）：

```bash
npx tsc --noEmit -p .
```

```bash
npm run validate
```

```bash
npx vitest run
```

```bash
npm run simulate -- --runs 300
```

看模擬結果時對照這些基準（2026-11 的數字，改了平衡之後請更新這一段）：

- 過招勝率約 91%，死在生死之戰的人生約 1%。使用者要的是第一輪好玩、容易走完，這兩個數字不該變差。
- 結局分布：鐵骨丹心約 20%（使用者說先不動），江湖大俠約 13%，其餘各在 12% 以下；一代魔頭約 7%（隨機選選項時偏高，不走邪路的真人不會拿到）。有哪個結局突然衝高，多半是新事件送了某個旗標。
- 小戰：一生約 10 場，同一種對手連著來兩次應該不到 0.3 次（引擎用 `s.recent` 記最近的對手和句子）。新增可重複的事件時，素材句子寫三種以上才不會重複。
- 自動玩是隨機選選項的，所以「要玩家答應才有」的結局在模擬裡會偏低，真人會高一些。回報時要講明這一點。

**量某幾件事遇不遇得到**（這個 skill 附的工具）：

```bash
npx tsx .claude/skills/jianghu-dev/scripts/event-rate.ts qinghen_junior baina_mantle --runs 300
```

加 `--sect baina` 或 `--flag married` 可以只看走上那條路的人。輸出裡的「例：seed N」可以拿去在瀏覽器裡直接跳到那一幕。

需要更細的統計時，寫一支暫時的 `scripts/_diag.ts` 用 `playLife(seed, { until, persona })` 跑，用完刪掉，不要 commit。

新功能加一個小測試檔就好（`tests/xxx.test.ts`），測「條件對不對、排程有沒有排上、文字裡沒有殘留的 `{}`」這類會悄悄壞掉的事，不必追求覆蓋率。

## 在瀏覽器裡看

只有畫面看得到的改動才需要。用 preview_start 啟動 `wuxia-dev`（port 5173）。

**使用者就在同一個瀏覽器分頁裡玩，存檔是共用的。** 注入測試狀態之前先備份，看完還原：

```js
// 備份（只在第一次注入前做一次）
const KEY = 'jianghu.save.v1';
const old = localStorage.getItem(KEY);
sessionStorage.setItem('backup.had', old === null ? 'no' : 'yes');
if (old !== null) sessionStorage.setItem('backup.save', old);

// 跳到某一幕
const { playLife } = await import('/src/engine/autoplay.ts?t=' + Date.now());
const r = playLife(4, { until: (s) => s.current?.eventId === 'qinghen_junior' });
localStorage.setItem(KEY, JSON.stringify(r.state));
location.reload();
```

重新載入後用 JS 點「繼續這一生」。看完：

```js
const KEY = 'jianghu.save.v1';
if (sessionStorage.getItem('backup.had') === 'yes') localStorage.setItem(KEY, sessionStorage.getItem('backup.save'));
else localStorage.removeItem(KEY);
sessionStorage.removeItem('backup.save'); sessionStorage.removeItem('backup.had');
```

存檔就是整個 GameState 的 JSON。新增欄位一律設成 optional，舊存檔才讀得進來，也就不用升版本號。

## 使用者問「還可以優化什麼」的時候

先跑模擬、看數字，再回答。給三到五項、編號、每項一兩句，寫清楚玩家會感覺到什麼差別，並標出你建議先做哪幾項。使用者通常回「先做 1 跟 2」。不要一口氣把清單全做完，也不要主動開始沒被點到的項目。

目前擱置、使用者沒重新提起就不要做的：輪迴／跨世代的成長、地圖、說書人模式、調降鐵骨丹心的比例。

## 做完之後怎麼回報

用繁體中文，寫給玩這個遊戲的人看，不是寫給工程師看：

- 先講玩家會遇到什麼新東西（事件用它的標題和一句話的情境，不用 id）。
- 有數字的用「原本／現在」的小表格。
- 測試結果兩三行：測試通過幾個、勝率和死亡率有沒有變。
- 沒做的、變差的、要使用者決定的，單獨列出來，不要埋在中間。
- 動過瀏覽器的話，講明存檔有沒有還原。

## 這台機器上的小事

- Windows、檔案是 CRLF。直接用 Edit 工具改檔；要批次改很多處時，把腳本用 Write 工具寫到暫存目錄再執行。不要用 Bash heredoc 寫含反引號的內容，會失敗。
- 推上 `main` 之後 GitHub Actions 會自動部署到 Pages。
