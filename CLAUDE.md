# 《一念飛仙外傳-墨塵傳》專案規則（Claude 每次開工先讀）

橫版動作 RPG（Boss Rush，隻狼式彈刀與架勢），上線檔是單檔 `index.html`（Canvas 2D、Web Audio、無外部依賴）＋ `assets/` 圖片；**原始碼在 `src/`（v0.8.37 起分檔），`index.html` 由 `tools/build.py` 組出，不要直接改 `index.html`**。使用者在手機（Android Chrome，橫向）測試。
網址：https://mashin-84.github.io/mochen/（GitHub Pages，main 分支根目錄）。
詳細版本紀錄與設計決定看 `HANDOFF.md`；劇情來源是 `mashin-84/Cultivation` 的 `source` 分支。

## 與使用者合作的規則
- 回覆要短、先給結論，手機閱讀，每段一個螢幕內。繁體中文。
- 討論型問題先評估、提方案；使用者說「做」或明確同意才動手。
- 版面類改動先截圖確認再推送。不要整份輸出程式碼。
- 節省額度：輕量驗證（語法檢查＋針對性測試）；動到存檔結構、關卡流程才做完整流程測試。
- 每次改版：改 `src/` → 遞增版本號（`src/10_boot.js` 的 `ASSET_VER` 與 `HANDOFF.md` 標題）→ `python3 tools/build.py` → `python3 tools/build.py --check` → 跑 `tools/check.js` → 動到戰鬥／流程時跑 `tools/smoke.js` → commit → `git push origin HEAD:main`；commit 訊息尾端加系統提醒給的 Co-Authored-By 與 Session 行。推送後約 1～2 分鐘網站更新。
- 本機看不到音效；音效、手感、手機震動要請使用者實測。
- 新增或更新任何 `assets/` 圖片都要遞增 `ASSET_VER`（圖片網址自動加 `?v=`），否則手機會讀到舊快取。

## 工作偏好（使用者 2026-11-07 定案，每個 session 都遵守）
1. **音效不用程式合成**：給英文搜尋關鍵字讓使用者找真實音檔，或給 ElevenLabs 提示詞（每條寫明秒數）；拿到檔案後由 Claude 裁切、正規化、接入。
2. **美術與特效盡量不用程式畫**：給 Gemini 生圖提示詞，使用者生好後由 Claude 切圖接入；程式繪製只當備案。
3. **影片提示詞**：一律連續運鏡（最多 2 處轉場）、鎖定單一地點與色調；每關先給分鏡構想，使用者同意後才給提示詞。
4. **生成提示詞交出前自我檢查**：逐行對照使用者需求與角色設定反覆檢查，並實際查看使用者附的參考圖，避免浪費生成額度。
5. **對話太長時**：主動提醒使用者，自動更新並推送 `HANDOFF.md`（版本、進度、待辦）、commit＋推送所有未完成的改動，並給一句可直接貼在新對話第一句的提示（要求先讀 CLAUDE.md、HANDOFF.md、掛載 mashin-84/mochen 並附 push 權限、說明目前版本與待辦）。
6. 做 Boss 招式、判定、手感時，先載入 `mochen-action-combat` skill；環境沒有就告訴使用者。

## 依任務難度分派子代理（`.claude/agents/`）
遇到對應任務主動派給對的子代理，不要全部自己做；主代理負責綜合結果、驗證與推送。
- `quick-helper`（haiku）：搜尋檔案、查版本號、改文字、更新 `HANDOFF.md` 等雜事。
- `implementer`（sonnet）：一般功能實作、接圖／影片／音效、切圖、跑 build／check／smoke。
- `combat-designer`（opus）：Boss 招式、判定、手感、數值、影片分鏡構想、戰鬥程式審查。
- 小到一兩步就能做完的事，直接自己做，不必派。

## 最高原則
- **夠精緻**：參考各式動作遊戲的手法（空洞騎士、隻狼、九日 Nine Sols、死亡細胞、褻瀆神明、奧日等），但維持本作淡彩、透光、薄霧的風格聖經；學手法不學色調。
- 路線圖與製作流程見 `HANDOFF.md` 第二十二節（M0～M9、單關七步、完成定義）。

## 分工
- 交給 Gemini：全部生圖與影片（動作表、背景、半身像、特效圖）、招式資料與對白草稿、純資料型修補（FIND/REPLACE）。給 Gemini 改東西時只附 `src/` 裡要改的那一個檔的最新版。
- **程式變形（`dfm` 拉伸、傾斜、位移）只做簡單輕微的幅度**；要動作變大、強化某個動作，一律改生關鍵格圖片。
- **戰鬥特效一律生圖**（每位 Boss 一張專屬 4×4 黑底特效圖），除非現有特效圖真的剛好適合才借用；不要用程式畫的刀弧／光效當正式美術。
- 留給 Claude：架構改動、新招式引擎、AI、數值平衡、測試、切圖去背對齊、推送。Gemini 的自我檢查表不可當驗證依據。

## 生圖提示詞規則
- 整段放在**單一程式碼框**內（框內不可再有三個反引號）；開頭放完整風格聖經；寫「EXACTLY N」格；一張盡量多塞。
- 角色／特效底色：不發光的用洋紅 #FF00FF；**發光特效用純黑 #000000**（程式用疊加發光 `lighter` 播放，黑底自動透明）。
- 敵人與特效在圖裡一律面向右（遊戲內依 facing 鏡像）；附參考圖只附單格單角色。
- AI 分不清左右腳，行走／跑步用影片抽幀（綠幕 #00FF00），不要用生圖。
- 風格聖經：Style bible: quiet fantasy-journey anime aesthetic set in ancient China. Soft muted pastel palette (pale sky blue, sage green, cream white, lavender, warm beige) with small accents of cinnabar red and jade green, thin delicate line art with slightly stronger outer silhouette lines, soft cel shading with slightly feathered shadow edges, subtle highlights, slender natural proportions, restrained but distinct expressions, each character with a small signature gesture. Luminous light, soft haze, layered depth in any scenery; backgrounds look hand-painted with watercolor-like texture. Icons and items in the same soft pastel cel style with thin dark outlines and one soft highlight, readable at small size.

## 程式結構速查（以名稱搜尋，行號會變）
- 常數與狀態：`CHAR_K`、`Config`、`Game`、`Player`、`Boss`、`Progress`
- 關卡資料：`Stages`（九關；`NINE_MAP`、`LegacyStages` 為舊 15 關素材庫）、`moves`、`pool/poolP2`、`sprite`、`bg`、`dialogue`
- 流程：`loadStage`、`returnToHub`、`hubTick`、`handleStageClear`、`bossDeathOut`、`showSettlement`
- 戰鬥：`updatePhysics`、`updateBossAI`、`triggerBossMove`、`resolveBossStrike`、`doPerfectDeflect`、`doNormalAttack`、`doAirAttack`、`performExecution`、`takeDamage`（氣血歸零＝敗北重打）
- 部位 Boss（v0.8.83，第 4、7 關）：`53_parts.js`（`Stages[n].parts`、`Boss._pp`、`partsUpdate`／`partsTryHit`／`partStrike`／`drawPartsBack`／`drawPartsFront`）
- 美術特效：`spawnFx`／`updateFx`／`drawFx`（`assets/fx/*.webp`，4×4 格、每格 256px）、`executionFx`、`drawUltArt`、`drawThreatMarker`、`landingFx`
- Boss 繪製：`drawBossEntity`、`getBossSprite`、`getWalkNorm`；玩家：`drawPlayer`
- 音樂：`Music`、`STAGE_BGM`（關卡配曲）；音效：`Sound`（程式合成＋`s_*` 外部取樣）
- 對話：`DLG`、`dlgStart`；HUD：`hintOnce`、`showBanner`
- localStorage 鍵：`qingyun_*`

## 測試與工具
- GitHub 自動檢查（2026-11-07）：`.github/workflows/check.yml`，（已改為手動執行，不再自動跑、不寄信；要恢復見 workflow 檔註解）原本每次推送到 main 自動跑 `build.py --check`、`check.js`、`smoke.js`（每關 20 秒）；smoke 會抓讀不到的 `assets/` 檔，已知還沒做的素材列在 `tools/missing_ok.txt`（不算失敗）。失敗時 GitHub 通知使用者，截圖在該次執行的 Artifacts。
- 自動對打：`NODE_PATH=$(npm root -g) node tools/smoke.js index.html 20`（九關各 20 秒鍵盤亂數對打；抓頁面錯誤、NaN、卡狀態、招式不輪替；截圖存 /home/claude/smoke/；可加第三個參數指定關卡如 `1,5`）。
- 原始碼分檔：`src/manifest.txt` 決定組合順序；`00_head`／`01_style.css`／`02_body` 是版面，`10_boot`～`91_main` 是程式（`20_legacy_stages`、`81_legacy_story` 為舊系統，Beta 期清除）。新增檔案要加進 manifest。
- 測試：Playwright（Chromium 已預裝）。做除錯副本，在 `window.onload = function () {` 前面插入 `window.__B=Boss;window.__P=Player;window.__G=Game;window.__L=loadStage;…` 掛鉤，用 `python3 -m http.server` 從本機載入（要和測試在同一個 Bash 指令內啟動）。測試前先開 `Progress.unlockedStages=9`，並用 `#dlg-skip` 跳過開場對話。
- 不要用 `pkill -f "http.server …"`（會連自己的 shell 一起殺）；用 `kill %1`。
- 不要用 `rm -rf` 加萬用字元；用新資料夾代替。
- `tools/`：`check.js`（語法＋載入檢查，推送前必跑）、`sheet.py`（洋紅底 4×4 動作表切圖去背）、`slice.py`、`proc.py`（影片抽幀）、`fall3.py`（倒地）、`apply_fuzzy.py`（套用 FIND/REPLACE）。

## 每位 Boss 的標準流程
1. Claude 寫動作表、倒地、半身像、背景（以及特效）的提示詞。
2. 使用者在 Gemini 生圖／影片後貼回。
3. Claude 切圖去背對齊、放進 `assets/boss{n}/`、推送。
4. Gemini 輸出招式資料與對白，Claude 套用、測試、推送。
5. 使用者實測手感，Claude 調數字。
