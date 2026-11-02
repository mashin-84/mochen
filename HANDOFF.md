# 《一念飛仙外傳-墨塵傳》交接文件（對應版本 v0.8.13）

> 新對話開始時：上傳這份文件，第一句話寫「請先讀交接文件，照文件的流程繼續」。
> Claude 要先把倉庫掛進工作階段（add_repo：mashin-84/mochen，push 權限）、clone，再讀 `index.html` 的關鍵段落。

---

## 一、專案概要

- **名稱**：《一念飛仙外傳-墨塵傳》。《一念飛仙》的前傳，橫版動作 RPG（Boss Rush，隻狼式彈刀、架勢），使用者在**手機（Android Chrome，橫向）**上測試。
- **網址**：https://mashin-84.github.io/mochen/（GitHub Pages，main 分支根目錄）。
- **倉庫**：`mashin-84/mochen`（公開）。`index.html` ＝ 單檔遊戲（Canvas 2D、Web Audio、無外部依賴）；`assets/` ＝ webp 圖片（相對路徑載入，離線單檔開啟會退回方塊／程式繪製）。
- **劇情與世界觀來源**：`mashin-84/Cultivation` 的 `source` 分支（正傳）。角色：墨塵、司徒衡、師妹、灰珠（太初玄天珠）。
- **設計稿（Docs）**：《九關 Boss 設計稿 v1》https://claude.ai/artifact/QC3D7KZhTLkSBidsNcHEgP （doc id `bbccbb5a-e843-456e-ac0c-325536ae9110`，可用 Docs 的 read 讀取）。

## 二、使用者偏好與工作規則

- 回覆要短、先給結論；手機閱讀，每段一個螢幕內。討論型問題先評估、提方案，使用者說「做」或明確同意才動手。
- 版面類改動先給截圖確認再推送。不要整份輸出程式碼。
- 節省 Claude 額度：能由 Gemini 做的交給 Gemini（見第八節分工）。輕量驗證：語法檢查加針對性測試；動到存檔結構、關卡流程時才做完整流程測試。
- **生圖提示詞規則**：整段放在**單一程式碼框**內（框內不可再有三個反引號，手機會被切斷）；開頭放完整風格聖經；洋紅 #FF00FF 背景；寫「EXACTLY N」格；一張盡量多塞；敵人角色在動作表裡面向右（遊戲內程式會依 Boss.facing 鏡像）；要附參考圖時只附**單格單角色**的圖，不要附整張動作表（Gemini 會直接複製）。
- **風格聖經**（每個提示詞都要放）：Style bible: quiet fantasy-journey anime aesthetic set in ancient China. Soft muted pastel palette (pale sky blue, sage green, cream white, lavender, warm beige) with small accents of cinnabar red and jade green, thin delicate line art with slightly stronger outer silhouette lines, soft cel shading with slightly feathered shadow edges, subtle highlights, slender natural proportions, restrained but distinct expressions, each character with a small signature gesture. Luminous light, soft haze, layered depth in any scenery; backgrounds look hand-painted with watercolor-like texture. Icons and items in the same soft pastel cel style with thin dark outlines and one soft highlight, readable at small size.
- 影片提示詞：Gemini 圖生影片，背景純綠 #00FF00、鏡頭固定、人物原地循環；Claude 從影片抽幀（見第六節）。AI 生圖分不清左右腳，所以行走／跑步一律用影片抽幀，不要用生圖。
- **當對話過長時提醒使用者並提供交接檔**（已寫入記憶）。

## 三、目前完成的功能（v0.6.0）

- 主角墨塵、第 1 關 Boss 已換成美術圖；人物放大（`CHAR_K = 1.25`，攻擊範圍與 Boss 招式 `range` 同步放大）。
- 手感：普攻變慢（出招間隔約 0.47／0.67 秒，`Player.atkCd` 控制）、普攻架勢上限 60%（`damageBossPosture(amount, label, cap)`）、攻擊後搖後半段可用方向鍵取消、打擊感（Boss 受擊後仰、閃白、斬痕、火星、分級回饋、連擊數「N 連」與音階遞增、揚塵與落地震動）、完美招架演出（拉近、震動、停頓）、受擊紅閃與手機震動（設定可關）。
- Boss 演出：登場名字卡、階段轉換、擊殺慢動作、大招（grab_peril 標為 ultimate：背景變暗、聚光、拉近、招式名）、跪地→倒下→淡出。
- HUD：單一齒輪、長扁血條、隱藏即時資訊列；教學提示首次遇到才浮現（`hintOnce`，約 6.5 秒），齒輪選單有「戰報紀錄」「重看教學提示」「震動回饋」。
- **營地系統（Game.mode = hub / enter / battle）**：營地在戰場左側的負座標區（x -1280..0），走到山門中央（`HUB_GATE_X`）觸發 enter，畫面橫移、自動跑進戰場（`ARENA_ENTER_X`），Boss 登場，接戰前對話，對話結束才開打；擊敗後戰後對話→Boss 倒下→結算→回營地，播下一關營地劇情（`Stages[n].dialogue.camp`，每關一次）。
- 場景對話框（`DLG`）：底部文字框、左右半身像（`assets/portrait/{key}.webp`，支援 `_alt` 表情，台詞加 `expr:"alt"`），無圖時退回圓形大字；旁白時隱藏半身像。
- 美術：營地背景 `assets/bg/camp.webp`、第 1 關背景 `assets/bg/arena1.webp`（視差，疊暗化）、半身像（墨塵、師妹、統領各 2 表情）、統領動作表 16 格、行走 12 幀、倒地 3 格、墨塵 16 格＋衝刺跑 10 幀。

## 四、已定案的設計決定（詳見 Docs 設計稿）

- **縮減為九關（名稱改「九難」，程式與文字裡所有「十五難」要改）**：1 赤煞神衛統領、2 千幻長老・顧天風、3 莫無咎＋玄鐵真君（雙劍／重劍兩姿態）、4 萬劍古靈、5 九幽魔將（**兩形態**：魔狼→冥骨夜叉，吸收白骨煞招式）、6 魅月仙子＋化血老祖、7 金甲天將＋玄武神相、8 司徒衡（人→魔染→天道附體三階段，吸收無相天魔與天道劫眼）、9 心魔・墨塵（鏡像、適應型 AI，**戰場另生新背景**，角色美術直接用墨塵現有圖調暗加紅光暈）。
- 每位 Boss 8～10 招：共用骨架 5 招（基礎斬、連段、突刺【危】、橫掃【危】、大招）＋專屬 3～5 招＋二階段新增 2 招。舊 15 關資料不刪，留作招式素材庫。
- 機制解鎖對位（目前程式仍是舊的 15 關數字）：替身 3、蓄力 4、極處決 5 不變；格擋窗口加成 1–3 關 +40ms、4–6 關 +20ms、7–9 關 0；處決扣血 1–3 關 45%、4–6 關 30%、7–9 關 20%；空中攻擊第 6 與 8 關；通關回響改為第 5～8 關各一個。
- HP 曲線（依 Claude 設定）：2200／2600／3200／3600／4600／5000／5400／7000／5200。
- 順序建議：先做心魔原型（幾乎不用新美術，驗證鏡像 AI）→ 補第 1 關二階段 2 招 → 第 2、3 關 → 4、5 → 6、7 → 8 → 營地劇情與對話改寫。

## 五、程式結構速查（以名稱搜尋，行號會變）

| 區塊 | 搜尋關鍵字 |
|---|---|
| 常數與模式 | `const CHAR_K`、`HUB_START_X`、`const Game = {`（`mode`、`introT`、`bossDeath`、`comboCount`…）、`const Config`、`const Player`、`const Boss` |
| 關卡資料 | `const Stages = {`（`moves`、`dialogue.pre/post/camp`、`bgType`、`bodyType`、`size`、`unlockText`、`loreSnippet`） |
| 載入與流程 | `function loadStage(stageId, opts)`（opts.hub / opts.skipPre）、`returnToHub`、`hubTick`、`beginBattleIntro`、`handleStageClear`→`bossDeathOut`→`showSettlement` |
| Boss 繪製 | `function drawBossEntity`、`MB1_`（第 1 關專用圖片載入，之後要資料化）、`MBD`（倒地圖）、`useBossSprite` |
| 玩家繪製 | `function drawPlayer`、`MC_`、`MCR_`（衝刺跑循環，依移動距離換幀） |
| Boss AI | `function updateBossAI`、`function triggerBossMove`（含大招 `m.ultimate` 的演出） |
| 打擊感 | `function bossHitFx`、`emitDust`、`drawHitFx`、`hapticBuzz`、`hurtFlash`、`screenFlash`、`showBanner` |
| 戰鬥主迴圈 | `function updatePhysics`、`function updateCamera`、`function render`、`function loop`（含慢動作 `Game.slowT`） |
| 營地畫面 | `function drawHubScene`、`BG_ART`、`drawArenaArt` |
| 對話框 | `const DLG`、`dlgStart`、`dlgShow`、`getPortrait` |
| HUD | `.hud-header`、`v0.4.16` 的 CSS 區塊、`elCombo`、`hintOnce`、`BATTLE_LOG` |
| 舊的劇情視窗 | `StoryEngine`、`CinemaEngine`（齒輪選單的 📜 仍在用；新流程已不依賴，之後可評估移除） |

- localStorage 鍵：`qingyun_echoes`、`qingyun_parry_cue`、`qingyun_haptic`、`qingyun_hints`、`qingyun_hubstage`、`qingyun_prologue`、`qingyun_camp_{n}`。
- 已知待清理：`Progress.unlockedStages: 15` 是測試用全解鎖，九關版要改成依進度解鎖；開場劇情、第 2 關營地劇情、師妹互動台詞是暫代文字；營地的師妹是程式畫的暫代造型；營地山門在手機上下半部會被觸控按鈕蓋住一部分。

## 六、美術資產規格與處理流程

- **角色動作圖**：900×560（主角）／900×600（Boss）透明畫布，人物**面向右**，水平錨點 450，腳底基準線主角 529、Boss 560；繪製用 `translate(x,y)`、`scale(±S)`、`drawImage(img,-450,-529/-560)`。主角比例 `MC_SCALE=0.506`，Boss `MB1_SCALE=0.64`（可乘 `Stages[n].size`）。
- **動作表**：4×4 共 16 格＝12 格標準（idle1/2、walk 備用、windup、windup_thrust、slash、slash_rec、thrust、thrust_rec、sweep、cast、hurt、stagger）＋4 格專屬；檔名 `NN_name.webp`。倒地 3 格：`17_kneel`、`18_fall`、`19_lie`（Boss 往左倒，頭在左）。
- **行走／跑步**：影片抽一個完整週期（約 10～12 幀），檔名 `walk_NN.webp`／`run_NN.webp`，依距離換幀（`MB1_STRIDE`、`MC_STRIDE`）。
- **半身像**：`assets/portrait/{mochen|shidi|boss{n}}[_alt].webp`，高 1000 像素，全部畫成**面向右**；程式在對話右側自動左右鏡像（其他角色一律面朝左）。
- **背景**：營地 16:9（地面上緣在高度 79%）；戰場為至少 2.5:1 的寬幅全景，底部 21% 為薄霧（地面由程式畫）。
- 工具（倉庫 `tools/`）：`slice.py`（洋紅底網格切圖＋去背）、`proc.py`（影片綠幕抽幀＋對齊）、`apply_fuzzy.py`（套用 Gemini 的 FIND/REPLACE 修補，忽略縮排差異）、`check.js`（語法＋Playwright 載入檢查）。去背用 `min(r,b)-g` 判斷洋紅、綠幕用 `g-max(r,b)`，只在邊緣 4 像素做去溢色，避免誤傷淡紫色衣物。

## 七、測試與推送方法

- 測試：Playwright（Chromium 已預裝）。做一份除錯副本，把 `window.onload = function () {` 前面插入 `window.__B=Boss;window.__P=Player;window.__G=Game;window.__L=loadStage;…` 之類的掛鉤，再用 `python3 -m http.server`（**要和測試在同一個 Bash 指令內啟動**，否則跨指令會被中止）從本機載入。截圖、狀態讀取都靠 evaluate。
- 不要用 `rm -rf` 加萬用字元（會被安全檢查擋）；用新資料夾代替。
- 推送：`git add -A && git commit && git push origin HEAD:main`，commit 訊息尾端加 Claude 的 Co-Authored-By 與 Session 行（系統提醒會給）。推送後約 1～2 分鐘網站更新。
- 本機看不到音效；音效、手感、手機震動要請使用者實測。

## 八、Gemini 與 Claude 的分工

**交給 Gemini（使用者貼回結果給 Claude）**
1. 全部生圖與影片：動作表、行走影片、倒地三格、半身像、背景、師妹全身圖（提示詞由 Claude 寫）。
2. 每位 Boss 的招式資料與對白草稿：`Stages[n].moves = {...}` 的欄位填寫、戰前／戰後／營地對話草稿（依正傳設定）。
3. 純資料型程式修補：依 Claude 給的規格輸出 FIND/REPLACE 片段（規則見下）。

**留給 Claude**
1. 架構改動：九關資料結構與對照表、Boss 精靈系統資料化（目前只有第 1 關寫死 `MB1_`，要改成 `Stages[n].sprite` 資料驅動，之後每位 Boss 的圖只是一筆資料）。
2. 新招式類型引擎：衝鋒、投擲、延遲爆炸標記、形態變換、護盾、反制架式、鏡像。
3. 心魔 AI、數值平衡、全部測試、圖片切割去背對齊、推送。

**Gemini 修補固定規則（每次附上）**：只輸出 FIND/REPLACE 片段；FIND 逐字複製且在全檔唯一、長度 3～40 行；REPLACE 不可省略；不得改名既有識別字；變數先宣告再使用（const 有暫時死區）；引用既有屬性前先確認存在；新增招式資料要填滿 windup/active/recover/range/lunge/damage；新增邏輯不可放在會被 return 跳過的位置；回覆結構為 摘要／修補／自我檢查表／手動測試步驟／發現但未修改。Gemini 的自我檢查表不可當驗證依據，Claude 必須自行測試。

## 九、每位 Boss 的標準流程

1. Claude 寫該 Boss 的動作表、倒地、半身像、背景提示詞（以及行走影片提示詞）。
2. 使用者在 Gemini 生圖／影片，貼回。
3. Claude 切圖去背對齊、放進 `assets/boss{n}/`、推送。
4. Gemini 依規格輸出該 Boss 的招式資料與對白修補，Claude 套用、測試、推送。
5. 使用者實測手感，Claude 調數字。

## 十、近期待辦（建議順序）

1. 第 3 關（莫無咎＋玄鐵真君，雙姿態）：生圖提示詞 → 切圖接入 → 招式資料與對白。
2. 第 4～8 關逐批製作（流程同第九節）。
3. 心魔補完：登場「倒影升起」、擊敗「化光點」、三段一劍青雲、影分身畫面、專屬新戰場背景（需生圖）。
4. 營地師妹全身圖、營地劇情與每關對話改寫（要和使用者一起審劇情）。
5. 第 4～8 關美術到位前，這些關仍用舊 15 關的程式繪製方塊暫代。

## 十一、v0.6～v0.7 完成的架構（新對話必讀）

- **九關結構**：`LegacyStages`＝舊 15 關素材庫；`Stages`＝新九關，由 `NINE_MAP`（新編號、舊編號、卷、名稱、HP）組出，淺拷貝並加 `artId`（舊編號，程式繪製與特殊演出以 `Boss.artId` 判斷）。機制閘門用新編號：替身 3、蓄力 4、極處決 5；格擋窗口 1–3 關 +40ms、4–6 關 +20ms；處決扣血 45/30/20%；通關回響第 5～8 關（內部回響編號仍是 11～14）。
- **進度**：`qingyun_cleared`（最高通關關卡）；`Progress.unlockedStages` 由 `refreshUnlocked()` 計算；齒輪選單「測試全解鎖」開關（`qingyun_testall`），測試時請先打開。
- **資料驅動美術**：`Stages[n].sprite = "boss2"` → `assets/boss2/`（16 格 + walk_01~12 + 17~19 倒地）；`Stages[n].bg = "arena2"`（可加 `bgDim`）；半身像 `assets/portrait/boss{n}[_alt].webp`，進關自動預載；招式可用 `frames:{windup,active,recover}` 指定姿勢（例：施法類用 14_cast）。可用 `spriteScale`、`spriteStride` 覆寫縮放與步幅。
- **新招式類型**（第 1 關二階段驗證）：`isCharge`（直線衝鋒，可跳躍越過，`chargeSpeed`）、`bulletKind:"halberd"`（長柄投射物）。
- **心魔（第 9 關）**：`Stages[9].mirror = true`，用墨塵的圖調暗加紅光暈繪製；`Mirror` 物件記錄玩家習慣（連按普攻≥5→反制架式、6 秒內瞬步≥3→預判落點、遠距離→劍氣、貼身→後退反制）；二階段每招後追一招重播玩家上一動作。
- **視覺規則**：地面為霧藍漸層（無距離標尺）；劇情時主角面右、其他角色面左；對話右側半身像程式自動鏡像。
- **工具**：`tools/sheet.py 動作表.jpg 輸出資料夾`（洋紅底 4×4 切圖去背統一縮放，腳底落 y=560、腳中心 x=450）；倒地三格與行走抽幀的做法見 git 歷史與第六節（倒地：依整張圖元件分組，不要按等寬網格切；躺地那格頭需在左，必要時翻轉；行走影片以腳距訊號找週期，第 2 關週期 37 幀、取 12 幀）。
- **第 2 關已完成**：顧天風半身像（2 表情）、迷蹤陣台背景、動作表、倒地三格、行走 12 幀。招式與對白仍沿用舊資料，待審。

## 十二、本輪新規則（使用者要求）

- 地面、劇情朝向、半身像朝向都以使用者在手機上的截圖為準，改完要截圖確認。
- 推送前一律跑 `tools/check.js`；版本號寫在 `index.html` 內（`v0.x.y` 字樣），每次推送遞增。

## 十三、v0.7.2～v0.7.4（第 1～3 關招式與第 3 關接入）

- **招式池機制**（`updateBossAI`）：`Stages[n].p1Pool = [[招式key, 權重],…]` 一階段權重池；`farMoves`／`farMovesP2` 拉開距離（>220）時用的遠距招（約每 0.5 秒一次機會，二階段才有的放 P2）；招式的 `zoneTargetP2` 讓二階段罡風陣鎖定玩家位置；招式的 `pose:"thrust"|"sweep"` 指定使用突刺／橫掃的動作格（不必用固定招式名）。第 1、2 關已套用；第 2 關二階段新招：鏡影雙襲 `teleport_combo`、羅天飛劍垂落 `sky_swords`。
- **雙姿態 Boss（第 3 關）**：`Stages[3].stances = {A:{sprite,stride,pool,poolP2,far,farP2,alias}, B:{…}}`；A＝`assets/boss3/`（青雲雙劍，快），B＝`assets/boss3b/`（玄鐵重劍，慢）；每 `switchEvery`（二階段 `switchEveryP2`）招插入 `stance_switch`（拔劍換姿，前搖 0.6 秒、無傷害、可趁機攻擊），windup→active 時翻轉 `Boss.stance`。姿態專屬招式：A＝十字斬三連、假動作連斬（停 0.3 秒）、疾步突進（`dash_rush`，可跳越）、旋風刃、突刺／橫掃；B＝玄鐵壓頂（霸體）、玄鐵劈砍、戒律鎮壓（震波領域）、撼嶽撞【危】、橫江斬【危】；二階段 A 加「雙劍重劈」（連斬接震波）。大招 `grab_peril`＝叛宗劍陣（兩姿態共用，14_cast 姿勢）。兩姿態不混招（已用模擬驗證）。
- **第 3 關美術**：`assets/boss3/`、`assets/boss3b/` 各含 16 格＋倒地 3 格（兩邊相同，往左倒）＋行走 12 幀；半身像 `assets/portrait/boss3.webp`、`boss3_alt.webp`（戰後對話用 alt）；背景 `assets/bg/arena3.webp`（洗劍池竹林，`bgDim 0.2`）。戰前／戰後／營地對話仍是舊的暫代文字（劇情留到最後一併處理）。
- **新工具**：`tools/sheet.py 動作表.jpg 輸出資料夾 目標高度 band`（加 `band` 會整列標記元件並清掉殘留的黑色細格線，武器跨格時使用；第 3 關重劍表用的）；`tools/fall3.py 倒地.jpg 輸出資料夾 縮放`（單列 3 姿勢依元件分組，只留人、去掉掉落的武器與黏住的劍身）。雙姿態兩張表的目標高度：A 用 505、B 用 492，讓兩姿態的身體一樣大。
- **行走影片**：週期以影片自相關找（第 3 關：雙劍約 29.3 幀、重劍約 36.2 幀，各取 12 幀）；影片左上角若混入參考縮圖，`proc.py` 的「只留最大元件」會去掉。
- **待辦**：第 4～8 關美術與招式（流程同第九節）；第 3 關招式手感待使用者實測；第 3 關之後的劇情一併重寫。

## 十四、v0.7.5 修正（使用者回饋）

- **第 3 關姿態改為依階段**：`Stages[3].stanceByPhase = {1:"A",2:"B"}`，一階段只用雙劍，進二階段（`onBossPhase2()`，在極處決破入二階段時呼叫）換成玄鐵重劍；不再每 3 招換姿（`stance_switch` 與 `switchEvery` 機制仍在程式裡，沒設 `stanceByPhase` 的雙姿態 Boss 才會用）。二階段重劍池加「玄鐵重劈」（連斬接震波）。
- **叛宗劍陣（大招）改成劍雨**：招式欄位 `swordRain: N` → `drawSwordRain()` 前搖由高處落下 N 把劍、出手瞬間插進紅圈（塵土＋小震動）、收招淡出；角色用 07_windup → 09_slash → 10_slash_rec（不再用拔劍姿勢）。其他 Boss 之後要做劍雨類大招可直接設 `swordRain`（需 `perilType:"grab"`）。
- **營地填滿畫面**：寬螢幕（橫向且比 16:9 更寬）時，營地鏡頭放大到營地圖剛好撐滿左右，不露黑邊也不露戰場（`updateCamera` 的 hub 分支，進營地第一幀直接到位）；走進山門切換場景的流程不變。

## 十五、v0.7.6 第 3 關走路改用動作表格子

- 影片抽幀（`walk_01~12`）畫風和動作表差太多，第 3 關改成各姿態的 `walkSeq`（用動作表內的格子依移動距離循環）：A＝03~06 walk1~4；B＝03_walk1 / 01_idle1 / 03_walk1 / 02_idle2（重劍表的 04~06 格沒畫重劍，不能用）。`walk_*.webp` 檔案仍留在 assets/boss3、boss3b，沒設 `walkSeq` 的關卡照舊用影片幀。之後若重生走路影片畫風接近，拿掉 `walkSeq` 即可改回。

## 十六、v0.7.7 第 3 關突刺格修正

- 雙劍動作表改用 `sheet.py … 505 band` 重切（劍身跨格被切斷的問題；凡是武器伸出格子的表都要用 `band`）。
- 雙劍表第 12 格（thrust_rec）原圖只畫了手、沒有劍：姿態設定加 `remap: {"12_thrust_rec":"10_slash_rec"}`（`stances.X.remap`，在最後覆蓋要用的格子），之後哪格畫壞都可用這招頂替。

## 十七、v0.7.8 快取與煞氣地形

- **圖片快取**：腳本開頭有 `ASSET_VER`（目前 "0.7.8"），所有 `assets/` 圖片網址自動加 `?v=版本`。**以後每次更新或新增美術都要把 ASSET_VER 跟著版本遞增**，否則手機瀏覽器可能讀到舊圖（第 3 關劍被切掉就是舊快取）。
- **煞氣地形（hazardZones：罡風陣、戒律鎮壓、白骨地刺…所有 isZone 招式）**：原本每幀呼叫 `takeDamage`，會每幀硬直＋停頓＋震動，站進去就卡死走不了。改成 `zoneDamage()` 每 0.3 秒結算一次持續傷害（不硬直、可走出去；致命時仍走 `takeDamage` 的替身／重整流程）。

## 十八、v0.7.9 主角普攻起手格劍尖

- `assets/mc/09_slash1.webp`（普攻起手）原圖劍尖被切平（原動作表切格時被切掉），已用程式補成尖的（劍身短了約 24px）；原圖備份不在倉庫。ASSET_VER 遞增為 0.7.9。若之後重生主角動作表，這格要請 Gemini 畫完整劍尖。

## 十九、v0.7.10 空中瞬步

- 空中二段瞬步原本位移 520（速度約地面 4.4 倍、距離約 3 倍），改為與地面瞬步相同（vx 780、0.22 秒）；仍保留 0.15 秒無敵與每次騰空限用 1 次。模擬驗證空中與地面位移一致（測試時要先開「測試全解鎖」才解鎖空中瞬步）。

## 二十、v0.8.0 戰鬥體驗強化（第 1 關改完整版的王）

**使用者決定**：戰鬥強化 A～E 都要做、F（場景）之後關卡再說、G 不做；第 1 關是「完整版的王」（不分階段教學）；空中攻擊提早到第 1 關；完美閃避慢動作要（8 秒冷卻）。

**已完成（v0.8.0）**
- Boss 新招式類型：`isLeap`（躍擊：落點紅圈預警、弧線飛行、落地砸；在地面才命中、跳起可躲、空中按跳躍可踩頭；`leapH`、`leapMax`）、`isMobility`（後撤 lunge 為負／衝步，無傷害無特效）、`comboLastDelay`（連段最後一刀延遲）、`chainOnHit`（串接招式只在命中時才接）、`pushback`（震退）、`isRage`（怒氣招式）、`teleportText/teleportColor`。
- 招式池：`Stages[n].pool/poolP2 = [[key, 權重, 標籤],…]`，key 可用 `+` 串接（`"backstep+halberd_throw"` ＝先後撤、收招後擲戈）；`farMoves/farMovesP2` 也支援串接；標籤 `break/ranged/chase/push/mobility`。
- `Reader`：記錄近 8 秒招架／瞬步／跳躍／攻擊與貼身比例，`pickFromPool` 依此調權重（招架≥3 次→霸體破防招×2.5；瞬步≥3 次→遠程／追擊×2.2；貼身>65%→震退×2.6、走位×1.5）。
- 怒氣：`stage.rageMove`、`stage.rageEvery`（預設每損失 18% 氣血累積滿，第 1 關 20%），滿了下一招放怒氣招式。
- 第 1 關招式：破軍、穿雲、斷雲連戟、遲刃連戟（三刀，最後一刀慢 0.36 秒）、貫日槍刺【危】、斷岳掃【危】、躍斬【危】、衝步＋斬、後撤＋擲戈、震戟（霸體震退）；二階段加 衝鋒＋追擊、躍斬接斬、影遁（繞背）＋連段；大招血煞鎖魂陣不變。
- 完美閃避：瞬步無敵期間剛好吃掉一次攻擊 → 慢動作 0.5 秒（`Game.slowScale 0.28`）＋回體力，冷卻 8 秒（`perfectDodgeFx`）。

**v0.8.1 已完成（原待做 1～4）**
- 空中攻擊（`doAirAttack`／`airAttackHit`）：空中按攻擊＝凌空斬（傷害 55、架勢 7，每次騰空限一次，落地重置 `airAtkUsed`）；下落中（vy>-120）在 Boss 頭頂 130×CHAR_K 內按攻擊＝下劈（傷害 85、架勢 18，命中彈起，落地揚塵）；破綻狀態傷害×1.6；不受格擋判定，第 1 關起即可用；消耗 12 體力。
- 破勢反擊：`riposteTimer` 統一 1.2 秒（完美招架、極限側閃、替身反切、踏劍看破）；窗口內出刀（`Player.riposteAtk`）必中、架勢×2、傷害×1.25；腳下金環倒數。
- 預警標記 `drawThreatMarker`：黃＝可招架、紅＝危、藍＝霸體；首次出現各有 `hintOnce` 說明。
- 結算：新增「被擊／完美閃避」，戰意評級改為依被擊、招架、閃避、耗時計算（丁～甲上）。完美招架回體力維持 +20。
- 備註：預設封印含 wenxin 時架勢×2，測試數字會是文件的兩倍。

**v0.8.2 平衡與敗北**
- 處決扣血比例：第 1 關 20%、第 2～3 關 30%（原 45%）；第 4 關以後不變。
- 躍斬權重 11→16，另加保底（`Boss._leapPity`：連續 5 招沒躍斬，下一招權重×3）。
- 真的會輸：氣血歸零（無替身）→ `Game.defeated`、「問心失敗」橫幅，約 1.9 秒後 `loadStage(同關,{skipPre:true})` 重打；`Progress.deathCount` 計次。原「問心重整」自動回滿已移除。

**v0.8.3 美術特效（assets/fx/）**
- 8 張 4×4 特效圖（每格 256px，已壓黑底並邊緣淡出）：`slash`（主角斬痕 4 列：上斬／下撩／突刺／蓄力）、`air`（凌空斬／下劈／招架星芒／破勢反擊）、`spark`（命中／格擋／霸體／破勢碎裂）、`boss1`（戟斬／貫日光束／斷岳掃／躍斬落地）、`boss2`（擲戈拖尾／命中／衝鋒氣浪／怒氣氣焰）、`ult`（血煞鎖魂陣：法陣成長／法陣循環／鎖鏈／光柱）、`mark`（預警符：黃／紅／藍，4 幀由大到小）、`scene`（洋紅底去背：落葉、霧、碎石、塵團）。
- 引擎：`spawnFx(sheet,row,x,y,{w,h,dur,facing,anchor:"c|l|b",rot,loop,fps,follow,add,col,vx,vy,grav,spin,grow,alpha})`；`add` 預設疊加發光（`lighter`）；`Game.fxList` 於 `updateFx`/`drawFx`；`fxReady(sheet)` 沒載入完成時退回程式繪製（`slashArcs` 的 `art` 旗標會跳過舊弧線）。
- 掛接：`playerSlashFx`、`doAirAttack`、`doPerfectDeflect`、`bossHitFx`、`damageBossPosture`（破勢）、Boss 招式 active 起點、`drawUltArt`（大招，只第 1 關 `Boss.stageId===1`）、`drawThreatMarker`、`landingFx`、`initAmbient`（第 1 關落葉與薄霧）。Boss 專屬特效目前只在第 1 關啟用（`Boss.stageId === 1`），其他關仍用舊弧線。
- 招式名書法字卡、墨跡底板（`mark` 第 4 列）尚未使用。

**v0.8.4 處決特效**
- 新增 `assets/fx/exec.webp`（三段斬：斜／反斜／橫貫，第 4 列光點）、`exec2.webp`（裂空、碎光、魂光上升、地面光環）、`ink.webp`（洋紅去背水墨，2 欄×4 列，每格 512×256；第 4 列為字卡底板）。
- `executionFx(ji)`／`executionKillFx()`：所有關卡的處決都用；有圖時 `Game.executionLines`（程式光線）清空；擊殺加光點與魂光。處決橫幅改用水墨底板（`ink` 第 4 列左），字級 64px。
- 所有特效圖在 `loadStage → initAmbient` 預載（避免第一次出招沒特效）。

**v0.8.6**：Boss 影片抽幀走路圖比動作表小（第 1 關約小 14%）→ 載入後依不透明高度算 `SP.walkNorm`（idle 高度／走路平均高度，限 0.9~1.3）自動放大；第 2 關同樣適用，第 3 關用動作表格走路不受影響。擲戈拖尾黃色方塊已修（畫圖前關陰影）。

**v0.8.7**：
- 連段招架：完美招架後舉劍多撐到至少 0.28 秒，300ms 內的下一刀只要還舉著劍就算完美（`Player.lastDeflectMs`、`chainCount`；連段回體力只 +6、浮字「連段招架 ×N」）。「遲刃」最後一刀（間隔 0.36 秒）超過 300ms，仍要重新抓時機。
- 塵浪改在 Boss 後方的地面層（`spawnFx` 的 `back:true`，`drawFx(true)` 在 Boss 之前畫），並壓扁，不再蓋住 Boss。

**v0.8.8 打擊感**（參考 gamedev-cheatsheet.com 的 Game feel 章節）
- **參考的打擊感提示詞（使用者提供，來源 gamedev-cheatsheet.com）**：
  1. 震屏：用 0～1 的 trauma 驅動，每次命中加 0.3～0.6，每秒衰減約 1；每幀鏡頭 x、y、旋轉偏移＝最大偏移 × trauma² × 平滑 Perlin 噪聲（不是每幀亂數）。
  2. 定格（hit stop）：命中時暫停攻擊者與被打者的動畫與移動 50～100ms（依傷害縮放），暫停中仍讀取並緩衝輸入，UI 與粒子照常以正常速度跑。
  3. 無敵幀：受傷後 0.5～1 秒忽略後續傷害，角色以約 10Hz 閃爍，並施加遠離傷害源的擊退。
  4. 有限狀態機：同時只有一個狀態、以「狀態×事件」轉換表決定切換、沒登記的事件忽略、每個狀態有 enter／update／exit。**目前決定不重構**（玩家只有 9 種狀態、風險大於利益），先用下方轉換表記錄；實測遇到狀態卡死再重構。
  - 該網站其他可參考項目（尚未做）：落地擠壓（squash 約 0.7、0.15 秒回彈）、輸入緩衝（約 0.1 秒）、土狼時間（0.1～0.15 秒）、加速度與摩擦、鏡頭死區、單次揮擊每目標只登記一次命中（已確認有）、dt 上限約 0.05 秒（已確認有）。
- **定格毫秒制**：`triggerHitstopMs(ms)`（上限 120ms，`Game.hitstopT` 秒）；`triggerHitstop(frames)` 仍可用（換算成毫秒）。`hitstopByDmg(dmg)`＝clamp(40+dmg×0.5, 50, 100)，用在普攻／重斬／凌空斬／下劈。完美招架＝`parryHitstopFrames`（滑桿）×0.85 約 85ms；踏劍看破 100、踩頭破危 90、反彈飛劍 70、普通格擋 50、極限側閃 60、受擊 70（重擊 100）、替身 80。定格期間只凍結 Boss／主角（`updatePhysics` 提早 return），粒子（`updateHitParticles`）與鏡頭照跑，`executeBuffered()` 照常收輸入。
- **Trauma 震屏**：`Game.camera.trauma`（0～1），`addTrauma(v)`；`triggerShake(dx,dy,amp)` 保留原簽名，內部換算成 trauma（約 0.3～0.65，方向與時長參數已不用）。偏移＝最大偏移 60 × trauma² × `noise1`（平滑梯度噪聲，`shakeClock×28`），另有最大 0.035 rad 的旋轉；每秒衰減 1；「震屏強度」滑桿＝倍率（`Config.shakeMultiplier`）。
- **受擊無敵**：`Player.hurtInv`＝0.7 秒，`takeDamage` 開頭直接略過；閃爍 10Hz（`drawPlayer` 的 globalAlpha 0.4）。與 `invulnTimer`（瞬步／招架／替身，會觸發完美閃避判定）分開，所以受擊後不會誤觸「極限側閃」。煞氣地形的持續傷害不吃也不給 `hurtInv`（致命的一刀仍走 `takeDamage`，會被無敵略過一下）。
- 已確認：主迴圈 dt 上限 0.05 秒已存在；單次揮擊只登記一次命中（`attackHitRegistered`，空中攻擊同樣）。
- **玩家狀態轉換表（由程式推出，尚未重構成 FSM）**：狀態有 idle／move／jump／attack／parry／dash／drink／hitstun／execution，另有 staggered／frozen 只被繪圖與少數判定讀取。execution 與 hitstun 時，普攻、空攻、跳躍、喝藥輸入都被忽略；hitstun 剩 ≤0.16 秒可接招架（回 idle）；第 3 關起 hitstun 可用瞬步脫離（替身反切，給 `invulnTimer`＝1.2）；drink 被普攻／招架打斷回 idle；蓄力在 hitstun／execution／parry／dash／drink 時取消。若實測遇到狀態卡死或穿插，再依此表重構成 FSM。
- 未做（之後可選）：落地擠壓（squash）。

**v0.8.9 音樂與外部音效**（素材取自 `mashin-84/Cultivation` 的 `music/`、`sfx/`）
- `assets/music/` 7 首 webm：dongfu 洞府、libie 離別、lilian 歷練、tianjie 天劫、weiju 危局、wenqing 溫情、zhandou 戰鬥（各約 1.4～1.7MB、2.5～3 分鐘，循環）。`assets/sfx/` 5 個 mp3：sfx_hit／hurt／skill／ult／thunder。
- `Music`（`Sound` 物件後面）：`play(name)` 淡入、`fadeOut()` 淡出、`setVol()`（存 `qingyun_bgmvol`）；跟 `Sound.muted` 靜音鍵；分頁隱藏時暫停；瀏覽器擋自動播放時，下一次點擊／按鍵自動重試。設定面板新增「背景音樂音量」滑桿。
- **關卡配曲**：`STAGE_BGM = { 1: "weiju" }`（關卡 id → 曲名；沒列的關卡無音樂）。`loadStage` 進戰場播放、進營地淡出；同一關重打（敗北重來）不會重播；`handleStageClear` 淡出。之後換曲或加關只改這張表。
- **外部音效**：`Sound.loadSamples()` 載入後放進 `Sound.buffers.s_hit` 等（失敗就維持原本程式合成音）；目前疊加用在：主角命中 Boss（`s_hit`，3 處）、主角受擊（`s_hurt`）、處決第一段（`s_ult`）。招架／格擋／踏劍看破仍是程式合成音。`s_skill`、`s_thunder` 已載入但尚未使用。
- 本機只驗證載入與淡入淡出，音量大小、曲目搭不搭要使用者實測。

**v0.8.10 處決大字與預警圈**
- 處決演出：`assets/fx/exec_t1.webp`（「處決」）、`exec_t2.webp`（「一劍青雲」）為生圖書法（黑底，`lighter` 疊加），`drawExecTitle(w,h)` 畫在畫面正中央：「處決」砸出（放大 1.45→1 約 0.16 秒），0.45 秒後「一劍青雲」淡入，最後 0.4 秒整體淡出；圖沒載入時退回舊橫幅。`Game.executionBannerDur` 記錄該次演出總長。**已知問題**：生圖把「劍」寫成簡體「剑」，之後有空請 Gemini 重生一張（提示詞要求 Traditional 劍）。
- **v0.8.13 黑邊修正**：寬螢幕或切場景鏡頭拉遠時，畫面會超出背景範圍露出黑底；`drawArenaArt` 在背景左右各接一張鏡像圖補滿（遮罩暗化範圍同步加寬）。營地場景（`drawHubScene`）另外畫在上層，不受影響。
- **v0.8.12 再修正（取代下一條）**：一般處決只跳「一劍青雲」（`exec_t2`）；終結處決（打贏）只跳「處決」（`exec_t1`），不再跳一劍青雲。以 `Game.executionBannerKill` 切換（終結處決分支設 true 並重置橫幅計時，橫幅起點設 false）；`showWinTitle`／`drawWinTitle` 已停用。
- **v0.8.11 修正**：處決時畫面中央只出現「處決」；「一劍青雲」（`exec_t2`）改成擊敗敵人（終結處決）後約 1.5 秒淡入、停約 2.4 秒（`showWinTitle`／`drawWinTitle`，以真實時間計）。
- 預警：拿掉 Boss 身上的小字（突刺［前閃看破］等）；收縮圈與十字星改以身體中心為圓心（`Boss.y - Boss.h*0.5`），收縮圈半徑 120→30、十字星約 2 倍、預警符圖 200px（`drawThreatMarker`）。

**待做**
1. 第 1 關實測後調數字（凌空斬／下劈傷害、評級門檻）；通用化後套到第 2、3 關。
2. 第 4～8 關美術與招式（流程同第九節）。
