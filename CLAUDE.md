# 《一念飛仙外傳-墨塵傳》專案規則（Claude 每次開工先讀）

橫版動作 RPG（Boss Rush，隻狼式彈刀與架勢）。上線檔是單檔 `index.html`（Canvas 2D、Web Audio、無外部依賴）＋ `assets/` 圖片音檔；**原始碼在 `src/`，`index.html` 由 `tools/build.py` 組出，不要直接改 `index.html`**。使用者在手機（Android Chrome，橫向）測試。
- 網址：https://mashin-84.github.io/mochen/（GitHub Pages，main 分支根目錄）
- **開工順序**：讀本檔 → 讀 `HANDOFF.md` 第〇節「現況總覽」（目前進度、待辦、各關狀態）→ 做新關卡再讀 `STAGE_PIPELINE.md`（單關標準流程、提示詞模板、驗收清單）。
- 劇情來源：`mashin-84/Cultivation` 的 `source` 分支。

## 與使用者合作的規則
- 回覆要短、先給結論，手機閱讀，每段一個螢幕內。繁體中文。
- 討論型問題先評估、提方案；使用者說「做」或明確同意才動手。使用者已描述清楚的小改動（例：移按鈕、拿掉某招）可直接做。
- 版面類改動先截圖確認（可自己用 Playwright 截圖檢查）再推送。不要整份輸出程式碼。
- 節省額度：輕量驗證（語法檢查＋針對性測試）；動到存檔結構、關卡流程才做完整流程測試。
- 說話要誠實：沒驗證的就說沒驗證；之前說錯的要主動更正（例：光圈時機一度沒對齊判定，已更正）。
- 本機看不到音效、感受不到手感、手機震動：這些一律列為「請使用者實測」。

## 每次改版流程
改 `src/` → `HANDOFF.md` 標題版本號 +1 並在版本紀錄加一段（寫清楚做法、數值、檔名）→ `python3 tools/build.py` → `python3 tools/build.py --check` → `node tools/check.js index.html` → 動到戰鬥／流程時 `NODE_PATH=$(npm root -g) node tools/smoke.js index.html 20 <關卡>` → commit（訊息尾端加系統提醒給的 Co-Authored-By 與 Claude-Session 行）→ `git push origin HEAD:main` **並** push 到目前工作分支。推送後約 1～2 分鐘網站更新。
- `ASSET_VER` 自 v0.8.135 起由 `build.py` 依 assets/ 內容雜湊自動填入（網址加 `?v=<雜湊>`），**不用手動改**；新增 assets 後重跑 build 即可。
- Stop hook 會檢查未追蹤檔案：產生的檔案要嘛 commit，要嘛放 scratchpad／`/tmp`；`__audit_tmp.html`、`dbg_tmp.html` 已在 .gitignore。

## 工作偏好（使用者定案，每個 session 都遵守）
1. **音效不用程式合成**：給英文搜尋關鍵字讓使用者找真實音檔，或給 ElevenLabs 提示詞（每條寫明秒數）；拿到檔案後由 Claude 裁切、正規化（峰值 -1.5 dBFS、單聲道 mp3）、接入。
2. **美術與特效一律生圖**（使用者 2026-11-09 再次強調：「需要生圖都可以生圖」）：給 Gemini 生圖提示詞，使用者生好後由 Claude 切圖接入；程式繪製只當備案，用了程式畫的要主動告知並列為待換。
3. **影片提示詞**：一律連續運鏡（最多 2 處轉場）、鎖定單一地點與色調；每關先給分鏡構想，使用者同意後才給提示詞。（目前登場／轉場已改「戰場上導演演出」，影片少用。）
4. **生成提示詞交出前自我檢查**：逐行對照使用者需求與角色設定反覆檢查，並實際查看使用者附的參考圖，避免浪費生成額度。使用者要「完整貼出來」時，把每段提示詞完整放在各自的程式碼框。
5. **對話太長時**：主動提醒使用者；更新並推送 `HANDOFF.md`（版本、進度、待辦）與本檔、commit＋推送所有改動，並給一句可直接貼在新對話第一句的提示。建議在「一關收尾、下一關開工」時換對話。
6. 做 Boss 招式、判定、手感時，先載入 `mochen-action-combat` skill；環境沒有就告訴使用者。
7. **（2026-11-09 新增）正式實作前先建議模型**：每個要動手的任務，開工前用一句話告訴使用者「建議用哪個模型做」與理由，讓使用者決定要不要切換（`/model`），避免浪費額度。原則：
   - **Opus**：新機制／架構設計、Boss 招式與判定、手感數值、導演演出（登場、階段轉換）的設計與第一次實作、難除錯的 bug、需要大量上下文判斷的工作。
   - **Sonnet**：已有設計卡、照既有模式接圖接特效、切圖、補關卡資料、一般 bug、寫提示詞、跑測試。
   - **Haiku**：查檔案、改文字、更新 HANDOFF、機械式替換。
   - 使用者切換後照常做；不確定時建議 Sonnet，並說明哪一步可能需要 Opus。

## 依任務難度分派子代理（`.claude/agents/`）
遇到對應任務主動派給對的子代理，主代理負責綜合結果、驗證與推送。
- `quick-helper`（haiku）：搜尋檔案、查版本號、改文字、更新 `HANDOFF.md` 等雜事。
- `implementer`（sonnet）：一般功能實作、接圖／影片／音效、切圖、跑 build／check／smoke。
- `combat-designer`（opus）：Boss 招式、判定、手感、數值、影片分鏡構想、戰鬥程式審查。
- 小到一兩步就能做完的事，直接自己做，不必派。

## 最高原則
- **夠精緻**：參考各式動作遊戲的手法（空洞騎士、隻狼、九日 Nine Sols、死亡細胞、褻瀆神明、奧日、火影忍者式大招演出等），但維持本作淡彩、透光、薄霧的風格聖經；學手法不學色調。
- 路線圖與製作流程見 `HANDOFF.md` 第二十二節（M0～M9、單關七步、完成定義）與 `STAGE_PIPELINE.md`。

## 分工
- 交給 Gemini：全部生圖與影片（動作表、關鍵格、背景、半身像、特效圖）。
- **程式變形（`dfm` 拉伸、傾斜、位移）只做簡單輕微的幅度**；要動作變大、浮誇、更滑順，一律改生關鍵格圖片。
- **戰鬥特效一律生圖**（每位 Boss 專屬 4×4 黑底特效圖），除非現有特效圖真的剛好適合才借用；不要用程式畫的刀弧／光效當正式美術。
- 留給 Claude：架構、招式引擎、AI、數值平衡、測試、切圖去背對齊、推送。Gemini 的自我檢查表不可當驗證依據。

## 生圖提示詞規則
- 整段放在**單一程式碼框**內（框內不可再有三個反引號）；開頭放**完整風格聖經（直接寫進去，不可用佔位符）**；寫「EXACTLY N」格；一張盡量多塞。交出前不得殘留任何 `[ ]` 佔位符，並用 `python3 tools/check_prompt.py 檔案`（影片加 `--video`）檢查。
- 提示詞檔存在 `prompts<關卡>/`（例：`prompts5/`）並 commit，使用者要重貼時從檔案原文貼。
- 角色／不發光物底色：洋紅 #FF00FF；**發光特效用純黑 #000000**（程式用疊加 `lighter` 播放，黑底自動透明）。
- 敵人與特效在圖裡一律面向右（遊戲內依 facing 鏡像）；**程式生成特效時必須帶 `facing`**，否則一瞬間反向。
- 角色關鍵格提示詞要寫：附參考圖（單格單角色）、同體型同地平線、面向右、不畫嘴外特效。
- AI 分不清左右腳，行走／跑步用影片抽幀（綠幕 #00FF00，`tools/proc.py`），不要用生圖。
- 風格聖經：Style bible: quiet fantasy-journey anime aesthetic set in ancient China. Soft muted pastel palette (pale sky blue, sage green, cream white, lavender, warm beige) with small accents of cinnabar red and jade green, thin delicate line art with slightly stronger outer silhouette lines, soft cel shading with slightly feathered shadow edges, subtle highlights, slender natural proportions, restrained but distinct expressions, each character with a small signature gesture. Luminous light, soft haze, layered depth in any scenery; backgrounds look hand-painted with watercolor-like texture. Icons and items in the same soft pastel cel style with thin dark outlines and one soft highlight, readable at small size.

## 素材處理
- 黑底特效圖：`python3 tools/fx_black.py 輸入.jpg assets/fx/名.webp [列:淡出px]`（縮 1024、扣底噪 18、每格邊緣淡出 12px；畫到格邊的煙霧類用 `3:70` 加大）。
- 洋紅底 4×4 動作表：`tools/sheet.py`（`band_cells` 可做 2×2）；有黑格線：`tools/sheetpad.py`；**不規則格子**：`tools/cut_keys.py 設定.json`（矩形裁切、統一縮放、質心對 x=450、腳底 y=560、輸出 900×600，並印出嘴部發光座標）。
- 角色格統一：900×600 透明 webp、腳底 y=560、腳中心 x=450；縮放對齊該 Boss 的 `01_idle1` 高度。
- 影片抽幀：`tools/proc.py`；倒地三格：`tools/fall3.py`。

## 程式結構速查（以名稱搜尋，行號會變）
- 常數與狀態：`CHAR_K`、`Config`、`Game`、`Player`、`Boss`、`Progress`
- 關卡資料（`src/21_stages.js`）：`Stages`（九關；`NINE_MAP`、`LegacyStages` 為舊 15 關素材庫）、`moves`、`stances`（姿態與 `pool`）、`sprite`、`spriteExtras`、`fxSheets`、`arcArt`、`zoneArt`、`cueArt`、`sfxClass`
- 招式欄位（資料化）：`frames{windup,active,recover}`（陣列依進度平均切格）、`fxAct`／`fxHit`／`fxLand`／`fxVanish`／`fxAppear`（可陣列）、`fxWind`（前搖全程預警圖）、`sfx{w,a,h}`、`isPerilous`＋`perilType`（thrust 可完美招架／sweep 跳／grab、leap 瞬步側閃）、`isZone`＋`zoneDx`／`zoneTall`／`zoneNoDraw`／`zoneWarn`、`beam`（魔焰獸玉：嘴部座標表 `mouthW`／`mouthA`）、`hintText`／`hintKey`
- 流程：`loadStage`、`beginBattleIntro`、`returnToHub`、`hubTick`、`handleStageClear`、`bossDeathOut`、`showSettlement`、`onBossPhase2`、`bossPhaseCinematic`
- 戰鬥：`updatePhysics`、`updateBossAI`、`triggerBossMove`、`resolveBossStrike`、`doPerfectDeflect`、`doNormalAttack`、`doAirAttack`、`performExecution`、`takeDamage`、`zoneDamage`（氣血歸零＝敗北重打）
- **招架時機提示**：`Boss.nextImpactIn`（命中前 0.35 秒倒數，與判定同源）；`cueArt` 關卡在 `drawBossEntity` 的 C4 區塊畫生圖光圈 `cue.webp`，否則畫程式光圈；`drawThreatMarker` 畫前搖色圈與首次提示文字。
- 部位 Boss（第 4、7 關）：`53_parts.js`（`Stages[n].parts`、`Boss._pp`、`partsUpdate`／`partsTryHit`／`partStrike`／`drawPartsBack`／`drawPartsFront`）
- **戰場上導演演出**（登場／階段轉換，取代影片）：`54_director.js`（`DIR_CFG[n] = {intro, phase, form, phase3, p2Aura}`、`dirStart`／`dirUpdate`／`dirEnd`／`dirBurst`、各 kind 的 step：drop／mirror／dash／graveyard／formtrans／descend／wolf／morph、`drawDirWorld`、`stMovie`）。**新增登場 kind 時，要把它加進 `src/80_flow.js` 的 `_introHide` 清單（登場前 Boss 不可站在場上）**。
- 玄天珠（輔助技）：`assistStart`／`activateAssist`／`applyAssistEffect`（靈光／替身兩種，營地選擇）
- 美術特效：`spawnFx(sheet,row,x,y,{w,h,dur,loop,fps,facing,follow,c0,nf,vx,vy,alpha,anchor})`／`updateFx`／`drawFx`（`assets/fx/*.webp`，4×4 格、每格 256px）、`spawnMoveFx`、`executionFx`、`drawUltArt`、`landingFx`
- Boss 繪製：`drawBossEntity`、`getBossSprite`、`bossVis`、`getWalkNorm`；玩家：`drawPlayer`
- 音樂：`Music`、`STAGE_BGM`／`STAGE_BGM_P2`；音效：`Sound`（`s_*`／`g_*` 外部取樣、`SFX_CLASS` 輕重武器、`bsfx`）
- 對話：`DLG`、`dlgStart`；HUD：`hintOnce`、`showBanner`、`bossNameCard`
- localStorage 鍵：`qingyun_*`（`qingyun_assist` 玄天珠選擇、`qingyun_floattext` 浮字開關）

## 測試與工具
- 自動對打：`NODE_PATH=$(npm root -g) node tools/smoke.js index.html 20 [關卡如 5]`（抓頁面錯誤、NaN、卡狀態、招式不輪替、讀不到的 assets；已知缺圖列在 `tools/missing_ok.txt`）。
- 特效盲點檢查：`tools/audit_fx.js`（部位 Boss 有誤報）。
- `tools/check.js`：語法＋載入檢查，推送前必跑。
- GitHub workflow `.github/workflows/check.yml` 已改手動執行。
- **Playwright 自訂測試做法**：讀 `index.html`，在 `window.onload = function () {` 前插入 `window.__B=Boss;window.__P=Player;window.__G=Game;window.__L=loadStage;window.__PR=Progress;window.__S=Stages;window.__C=Config;window.__TM=triggerBossMove;window.__BI=beginBattleIntro;window.__DLG=DLG;window.__PC=bossPhaseCinematic;window.__P2=onBossPhase2;`，寫到暫存資料夾（assets 用 symlink），Node 內建 http 伺服器載入，`require('playwright')`（`NODE_PATH=$(npm root -g)`）。
  - 進戰場看登場：`__PR.unlockedStages=9; __L(5); __G.mode='enter'; __BI();`；測「登場前是否隱藏」：`__L(5,{hub:true})` 後看 `Boss._introHide`。
  - 跳過對話：對 `#dlg-skip` 送 `pointerdown`；等 `!__G.dir && __G.introT<=0 && !__DLG.active` 再測招式。
  - 強制二階段：`__C.bossPhase=2; __PC(); __P2();`；指定招式：`__B.state='idle'; __B.aiCooldown=99; __TM('招式名')`。
  - 截圖給自己看用 deviceScaleFactor 1，拼成縮圖網格再看。
- 不要用 `pkill -f "http.server …"`（會殺掉自己的 shell）；不要用 `rm -rf` 加萬用字元。

## 每位 Boss 的標準流程（詳見 STAGE_PIPELINE.md）
1. 設計卡（登場、階段轉換、招式表、要玩家學什麼）→ 使用者定案。
2. Claude 寫提示詞（動作表、關鍵格、倒地、半身像、背景、專屬特效圖、登場／轉換特效圖）→ 使用者在 Gemini 生圖後貼回。
3. Claude 切圖去背對齊、接入、截圖自檢、smoke、推送。
4. 使用者手機實測回饋 → Claude 調整（常見：方向、登場前隱藏、節奏、亮度、傷害）。
5. 使用者說「這關可以了」才進下一關。
