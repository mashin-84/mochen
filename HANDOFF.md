# 《一念飛仙外傳-墨塵傳》交接文件（對應版本 v0.8.186（M2 進行中；M0 分檔＋M1 聲音第一批））

> 新對話開始時：掛載 `mashin-84/mochen`（push 權限）並 clone → 讀 `CLAUDE.md` → 讀本檔**第〇節**（現況總覽）→ 依待辦繼續。做新關卡再讀 `STAGE_PIPELINE.md`。
> 第一節之後是歷史紀錄（舊版本的細節、設計決定的來由）；**版本紀錄最新的在第二十二節中段（v0.8.1xx 由新到舊排列）**，有疑問以程式碼與第〇節為準。

---

## 〇、現況總覽（2026-11-14，v0.8.186；新對話先讀這節）

### 目前進度
- **里程碑**：M0 地基 ✅、M1 聲音 ✅、M2 第 1 關 ✅、M3 第 4 關 ✅、第 5 關內容已做完（等實測）。**目前主線＝「招牌大招重做」**：每關 1 招演出型招牌大招（第 3 關雙姿態各 1 招），一關一關做；第 1、2、3 關已實作，**全部等使用者手機實測**。之後：第 4、5 關招牌大招（第 5 關＝魔焰獸玉已有，可能只補強）→ 各關危招補關鍵格與特效圖 → 第 6 關 → 7 → 8 → 9 → M8 劇情重寫 → M9 Beta。
- **製作方向（使用者定案）**：登場與階段轉換用戰場上的導演演出（`54_director.js`），不用影片；所有美術與特效一律 Gemini 生圖（程式畫只當備案、要主動告知）；音效用真實音檔或 ElevenLabs。

### 各關狀態
| 關 | Boss | 狀態 | 招牌大招 |
|---|---|---|---|
| 1 | 赤煞神衛統領 | ✅（大招等實測） | 「血煞焚岳戟」（二階段） |
| 2 | 千幻長老・顧天風 | ✅（大招等實測） | 「羅天萬劍」（二階段，浮空） |
| 3 | 莫寒川＋玄鐵真君 | ✅（兩招等實測） | 雙劍「寒川十字」（一階段）、重劍「玄鐵龍捲」（二階段） |
| 4 | 萬劍古靈（部位 Boss） | ✅ | 人形劍魂「六劍朝宗」（**灰盒**，v0.8.180） |
| 5 | 九幽魔狼 | 🔧 等實測 | 小狼「幽影噬月」（**灰盒**）、大狼「魔焰獸玉」（已有） |
| 6 | 化血老祖＋魅月仙子（雙 Boss） | 🔧 **灰盒已做（v0.8.179），等使用者手機打「好玩嗎？」** | 「血神大法」（**灰盒**） |
| 7 | 金甲天將（金光盾）→ 玄武神相（**超大型部位戰 v0.8.182**，`58_colossus.js`） | 🔧 **灰盒** | 天將「天罡雷陣」、玄武「玄冥噴泉」（**灰盒**） |
| 8 | 司徒衡 三階段（人→魔染→天道附體） | 🔧 **灰盒（v0.8.180）** | 「青雲劍訣・天河」「無相魔影殺」「天劫・萬象歸墟」（**灰盒**） |
| 9 | 心魔・墨塵（鏡像 AI，引擎早已完成） | 🔧 可玩（佔位美術） | 「三念歸一」（**灰盒**） |

### 招牌大招現況（引擎 `src/55_ult.js`；細節以版本紀錄 v0.8.160～178 與程式為準）
- **共用**：招式資料 `moves.X.ult="種類"`；`ULT_CFG[種類]` 時間軸；各關 `hpTriggers` 在該階段血條 ≤50% 必放一次，之後招式池權重 4～5 偶爾出現；**冷卻 15 秒**（`Boss._sigNext`，必放不受影響）；破綻窗口傷害多半減半（`Boss._ultRest`）。**齒輪「大招測試」**直接進該階段放大招（`sigMove` 或 `sigMoves:[{move,phase,stance}]`）。光圈畫在主角身上（`drawUltTop`）：黃＝可招架、紅＝不能招架、藍＝蓄力斬。特效貼地用 `groundFxY`（`FX_FOOT` 表）。
- **第 1 關 血煞焚岳戟**（`b1fire`）：舉戟蓄勢（拉近壓暗、戟焰）→ 插地 → 地火矮牆三波（間隔 0.9 秒；招架／跳／瞬步都可，完美招架架勢 +12）→ 抱胸蓄力 → 仰天長嘯放**滿屏高火牆**（只有瞬步能過，380）→ 跪地喘息 3 秒。火牆 v0.8.164 起只留一層火焰。
- **第 2 關 羅天萬劍**（`b2sword`）：長老浮空 → 劍雨三輪（紅圈落點，第 3 輪一列留缺口）→ 聚劍成巨劍時**劍陣鎖身**（`Game.ultBind`，只能招架；專屬圖 `boss2bind`）→ 巨劍（2000px）三次方加速斜劈 → **完美招架（220ms）＝角力**：連按招架推角力條（生圖 `assets/ui/clash_bar／clash_medal`），推滿或 2 秒時過半＝碎劍折射、長老摔落破防；落敗吃 200；沒擋 400。
- **第 3 關 寒川十字**（`b3cross`，一階段雙劍）：起勢 → 橫斬（補間 3 格，橫刀芒留到飛出）→ 舉劍 → 豎劈成十字 → 揮出的兩道刀光原樣平移飛出＋尾霧 → 喘息 1.2 秒。解法：**按住青雲斬蓄力**，十字進範圍自動放蓄力斬劈碎（架勢 +40）；瞬步穿過；招架只算格擋 200；跳不過；沒擋 350。**蓄力斬已提前到第 3 關解鎖**（`unlockedStages >= 3`）。
- **第 3 關 玄鐵龍捲**（`b3tornado`，二階段重劍）：旋轉 4 格加速＋吸風（最大 420）＋龍捲割傷 → 停頓閃光（把貼身主角震開）→ 擲劍（腰高、紅圈、跳或瞬步）飛過主角停在空中 → **殘影瞬移空中接劍** → 落地 → 舉劍過頭；**接劍到舉到頂＝時停**（`Game.ultLock`，主角不能動，頂點閃光才放開）→ 下劈：劈地爆裂＋**實體岩石衝擊波**（`boss3bsolid` 第 1 列第 2 格、高 660；招架或瞬步）→ 拄劍喘息 1 秒。
- **素材位置**：關鍵格 `assets/boss1/61～68`、`assets/boss2/61～68`、`assets/boss3/61～78`、`assets/boss3b/71～92`＋`obj_fly`；特效 `assets/fx/boss1ult*`、`boss2ult*`、`boss2bind`、`boss3ult`（v3）、`boss3crack`、`boss3bult`、`boss3btorn`、`boss3bsolid`。提示詞在 `prompts1/`～`prompts3/`。**音效全部暫借各關現有**，正式音效待做（第 1 關 ElevenLabs 提示詞在 `prompts1/4_boss1ult_sfx.txt`）。

### 戰鬥底層（使用者定案）
- **每階段一條血**（第 4 關除外）：一階段＝總血 40%、二階段＝60%（`hpSplit`）。各關血量（一／二階段）：1：880/1320、2：1040/1560、3：1280/1920、5：1840/2760、6：2000/3000、7：2160/3240、8：2800/4200、9：2080/3120。
- **進二階段**：一階段血磨到見底（hp≤1）再破防處決才進二階段（血條補滿）；一階段中途處決只扣一階段血條 30%。二階段中途處決扣 30%。
- **血見底**：架勢拉到 80% 不再恢復，只有防守類（完美招架、普通格擋 +2、踏劍看破、凌空踩頭、折射）能補滿 → 處決。
- **隻狼式攻守閉環**：攻擊類（普攻、重斬、蓄力、凌空斬／下劈）架勢最多加到 60%；Boss 第三劍完美彈刀改扣主角 20 劍勢。普攻每劍 18（第三劍 30），破綻窗口 75／120。
- **手感底層（v0.8.183，Gemini 顧問評估後使用者同意）**：招架窗口全關 150ms；普攻／空中攻擊不扣劍勢；招架無冷卻但 0.5 秒內連按完美窗口 150→70→35ms；血見底時 Boss 破綻中（收招、喘息、擊落）砍可推最後 20% 架勢（半量）；架勢條 60% 刻度＋卡上限閃白＋血見底赤紅。
- **難度（v0.8.159）**：Boss 招式傷害 ×1.25（`BOSS_DMG_K`，地面煞氣與火柱不乘）、出招間隔 0.45／0.25、葫蘆回 350、喝藥 1.2 秒、破防硬直 3.0 秒。不做難度選項、不改招架窗口加成。
- **替身殘影反切**（受擊中按瞬步）：v0.8.170 起限 Boss 420px 內且在地面才觸發（原本會瞬移一大段）。
- **圖片載入器 IMGQ**（v0.8.156）：全部 assets 圖片重試、限流、進關預載、進場等圖。
- 已定案不改：普攻被彈開那一劍照扣血；魔焰獸玉火柱跳起來照樣被打到。

### 待辦（建議順序）
0. **（2026-11-11 使用者指示二：「除了美術都先完成、所有關卡完成、每個形態／武器各一招招牌大招、劇情最後再給、音效能生就生否則給提示詞」）→ v0.8.180 已把第 6～9 關與全部大招做成灰盒，九關都能從頭打到尾。接下來要使用者做的：①手機實測各關灰盒與大招（齒輪「大招測試」可直接看每一招）；②依 `prompts_sfx/ult_sfx_s2_s9.txt` 生音效（Claude 這個環境無法生成音檔）；③灰盒過關的關卡，Claude 給生圖提示詞 → 使用者生圖 → 換掉佔位。還沒做（非美術）：第 6～9 關的導演登場／階段轉換演出（要配合美術一起做，現在用預設橫幅登場）、第 4 關部位階段沒有另做大招（一階段的天劍斬落／萬劍歸宗本身就是演出招）、劇情（使用者最後給）、M9 Beta 清舊系統與難度曲線。**
0b. （前一則指示） 第 6 關灰盒已推送，等實測回饋 → 過關就給第 6 關全套生圖提示詞（老祖動作表、魅月動作表、血池背景、特效圖），同時做第 7 關設計卡＋灰盒；之後 8 → 9 → M8 劇情 → M9 Beta。**第 6～9 關完全沒有美術素材（`assets/boss6`～`9`、`arena6`～`9` 都不存在），每關都要使用者生圖。**
1. **手機實測**：第 1、2、3 關招牌大招（手感、節奏、時停 1.1 秒長短、角力連按難度、龍捲吸力、衝擊波大小、鏡頭）；戰鬥底層與難度調整後的整體節奏；第 5 關（登場、蛻變、幽影殘像、魔焰獸玉）。
2. 各招牌大招的**正式音效**（給 ElevenLabs 提示詞，寫秒數）。
3. 第 4、5 關招牌大招（第 4 關部位 Boss 要不要做、第 5 關魔焰獸玉要不要補強）→ 先提方案、使用者定案。
4. 各關**危招補關鍵格與特效圖**（使用者 2026-11-10 定案的方向）。
5. 第 6 關設計卡 → 7 → 8 → 9。
6. 長期：Boss 半身像 boss4～9、第 5 關狼走路影片抽幀、Beta 清除舊系統（`LegacyStages`、`getCineVideo` 等）、`audit_fx.js` 部位 Boss 誤報。

### 使用者的重要要求（累積）
- 所有美術、特效「需要生圖都可以生圖」，程式畫只當備案且要主動告知。動作要浮誇、要滑順 → 補關鍵格，不用程式大幅變形（旋轉不算變形）。
- 每關登場前 Boss 不可先站在場上。特效圖朝右，程式生成要帶 `facing`。
- 演出要連貫、要有過程，不要突然換成另一個東西（第 3 關踩劍柄→拔劍就因突兀被改掉）。
- 大招要有：蓄力聚焦、出招前訊號（光圈）、出招畫面微晃／震動；「以小博大」的角力感很帥。
- 提示要和判定同步（光圈倒數＝實際命中時刻）；**站太近時也要有預警**（倒數要包含「何時放出＋飛行時間」）。
- 發光特效在亮背景上疊加會變透明：要「實體感」的東西（衝擊波、龍捲）改用不透明版或洋紅底生圖。
- 生圖提示詞：方向容易畫反，用 `)` 這類符號寫死形狀；複合特效（例：十字＋尾霧）分開畫比較容易成功。
- 回答先誠實確認、錯了承認；正式實作前先建議模型；對話太長主動交接。

### 本輪新增的工具／做法
- `tools/fx_black.py`、`tools/cut_keys.py`、`tools/check_prompt.py`、`tools/audit_fx.js`。
- 關鍵格切圖：Gemini 底色不是純洋紅時要調門檻；劍伸進隔壁格時改「按人物連通塊」切（做法見 v0.8.176 紀錄）。
- 判定測試：Playwright 頁面內 `requestAnimationFrame` 逐幀機器人（輪詢太慢會誤判）；要攔截內部函式（如 `takeDamage`）可在 `window.onload` 前注入同作用域的包裝。

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

**v0.8.14**
- 修正沒有背景音樂：營地載入（`loadStage` hub）會 `Music.fadeOut()`，走進戰場（`beginBattleIntro`）原本沒叫 `Music.play`，只有敗北重打才會播；現在 `beginBattleIntro` 依 `STAGE_BGM` 播放。
- 落地擠壓：`Game._squashAmt/_squashT`（重落 0.2、輕落 0.08，0.15 秒平方緩回，以腳底為軸，橫向 +0.6 倍），只作用於主角 `drawPlayer`；Boss 未做。

**v0.8.15**：背景音樂預設音量 0.5→1.0（使用者回報太小聲）。
- **待決（等使用者回覆）**：①第 1 關配曲換哪首（候選「天劫」tianjie 節奏最快最亮、「戰鬥」zhandou 最亮但偏慢；做不做換曲試聽）；②程式合成音效（招架／格擋／揮劍／飛劍／喝藥…純正弦 1.4～3.5kHz 加白噪音，刺耳）改成音效檔：目前只有 5 個外部檔，缺的要從 Cultivation 倉庫 sfx/ 找或請使用者另外生成；先行替代方案是合成音加低通、拿掉高頻泛音。

**v0.8.16 合成音效變柔和**：`Sound.play` 對所有程式合成音（非 `s_*`）加低通 2400Hz；各音效的泛音下移約一個八度（招架 880/1318/1760Hz、揮劍／飛劍哨音降頻）、白噪音降量。若仍刺耳或太悶，調 `lp.frequency.value` 與各 buffer 的頻率。
- 背景音樂：使用者決定第 1 關配曲改為「重新生成」（配合 Boss 招式與形象），效果不好再回頭從 Cultivation 倉庫找；新曲放 `assets/music/` 後只要改 `STAGE_BGM`。

**v0.8.17 第 1 關新配樂**：使用者用 AI 依 Boss 形象生成「赤刃之閾」（原檔 threshold_of_the_crimson_blade.mp3，3:02、-11.7 LUFS，比舊曲大聲約 3.5dB），裁到 3:00 並做 0.8 秒淡出，存 `assets/music/chisha.webm`（opus 80k）；`STAGE_BGM = {1:"chisha"}`。結尾淡出後直接循環回開頭（開頭本來就是滿音量進場，沒做交叉淡化）。舊曲 weiju 等仍留在 assets/music/。之後每位 Boss 可照同樣方式依招式與形象生成專屬曲。

**v0.8.18 Boss 登場動畫（第 1 關先試，`Stages[1].introCine = true`）**
- 程式在「營地走進戰場」的 `beginBattleIntro` 觸發 `startBossCine()`（要 Boss 動作圖與主角圖載入完才播，否則退回舊流程）；敗北重打（`loadStage(...skipPre)`）不播。時間軸常數 `CINE = {A:3.4, FALL:3.95, LAND:4.6, END:5.7}`。
- A 段（`drawCineA`，剪影，座標基準 1280×720）：血月、遠山、崖頂；Boss 用 `silImg()` 把動作圖染成剪影（idle → 07_windup 蓄力 → 08_windup_thrust 躍起飛出畫面頂端）＋主角剪影仰望；結尾白閃。B 段：用真實戰場，`drawCineMark` 落點紅圈，Boss 以 `Boss._cineImg`（09_slash 下墜、10_slash_rec 落地蹲）由天而降；落地 `cineLand()`：震動 0.95、揚塵、`landingFx`、第 1 關 `boss1` 特效列 3、`execution` 與 `s_hit` 音效、名字卡；之後 `introT=0.7` 接戰前劇情。
- 進行中 `body.cine-mode` 隱藏 HUD 與虛擬按鍵，上下黑邊（`drawCineBars`）；右上「跳過」→ 先暫停並跳確認（繼續看／跳過），Esc 也可。`updatePhysics` 遇 `Game.cine` 走 `updateCine` 後直接 return。
- 之後精緻化的想法（待使用者決定要不要生圖）：崖頂背景插圖、Boss 躍起／下墜／落地專用姿勢格、落地衝擊與拖尾特效、書法名字卡。目前這些都是用現有動作格與程式繪製頂替。

**v0.8.19 登場動畫換上生圖素材（第 1 關）**
- `assets/bg/intro1.webp`（崖頂血月背景，原 2576×1438；程式以該座標系 cover 鋪滿，`drawCineA` 內 ledgeY=745、Boss x=1950、主角 x=620、地面 y=1210）；`assets/boss1/20_jump／21_fall／22_land／23_rise.webp`（Boss 躍起／下墜／落地蹲／起身，用新工具 `tools/poses.py 姿勢表.jpg 輸出資料夾 0.52` 切：2×2 洋紅底、縮放比以站姿頭盔羽飾到靴底高度 460 對齊）；`assets/fx/land.webp`（4×4：0 落地衝擊環、1 塵雲、2 風壓環（躍起時用）、3 下墜拖尾）；`assets/boss1/name.webp`（書法「赤煞神衛統領」，疊加發光，由 `bossNameCard()`／`drawNameCard()` 在落地時顯示約 2 秒，圖沒載入退回 DOM 橫幅）。
- 資料欄位：`Stages[n].introCine / introBg / introName / spriteExtras`（`getBossSprite(key, extras)` 載入額外姿勢格）。新 Boss 只要補這四個欄位與素材即可啟用。生圖提示詞做法：姿勢表 2×2（附單格站姿參考）、背景（血月、崖頂平台在 52% 高、左下主角地面在 84% 高）、特效黑底 4×4、書法名字卡（要寫明繁體）。
- 時間軸 `CINE = {A:3.4, FALL:3.95, LAND:4.6, END:6.0}`；落地後 22_land 0.55 秒 → 23_rise 0.5 秒 → 待機。

**v0.8.20 登場動畫 A 段改用影片（高製作路線，第 1 關試點）**
- 場景一致性：崖頂背景 `assets/bg/intro1.webp` 重生成，和戰場同一世界（蒼白滿月、青灰石柱、雲海、松樹）；平台位置（原圖 2576×1438）：Boss 崖頂 y=688、x≈1800；主角左下平台 y≈1240、x≈600。戰場 `Stages[1].bgDim` 0.4→0.28，讓戰場亮度更接近崖頂影片（若戰場太亮、預警符看不清，改回 0.4）。
- 影片：`assets/boss1/intro.mp4`（H.264）與 `intro.webm`（VP9），1280×720、5 秒、無聲（Gemini 原片 10 秒，後半是空崖頂已剪掉；原片有音軌但不用，音樂與音效由遊戲出，躍起時程式放低音 slash）。`getCineVideo(base)` 依 `canPlayType` 選格式，藏在頁面外的 `<video>`，`drawCineA` 用 `drawImage(video)` 以 cover 鋪滿（垂直焦點 0.54，和背景圖一致）；A 段計時以影片 `currentTime` 為準；跳過確認時影片暫停。影片沒載好（`readyState<3`）自動退回引擎剪影版（舊流程保留）。`CINE.A/FALL/LAND/END` 依影片或引擎版在 `startBossCine` 設定（影片版 A=5.0）。
- 影片首幀由 Claude 合成：新背景＋Boss 與主角剪影（Boss 站 x=1800,y=706、主角 x=600,y=1240，縮放 0.9／0.55），生成提示詞要求剪影不變形、鏡頭緩推、2.5 秒蓄力、3.8 秒躍起離開畫面頂端。之後各 Boss 照同樣流程：生背景（附戰場圖當參考）→ Claude 合成首幀／尾幀 → 使用者生影片 → Claude 轉檔接入（`Stages[n].introVideo = "assets/boss{n}/intro"`）。

**v0.8.21 腳底貼地與暫停系統**
- 浮空：角色圖與影子對不上（影子在 groundY+3，圖片腳底約在 groundY-1～-2）→ 新常數 `GROUND_SINK = 5`，主角、Boss 圖片（含心魔鏡像）繪製時 y 整體下移 5px，腳底踩進影子。判定位置不變。
- 暫停（`pauseGame()`／`resumeGame()`，選單 `#pause-menu`）：分頁隱藏（`visibilitychange`）、視窗失焦（`blur`）或按 P 時觸發；`loop` 在 `Game.paused` 時直接跳過（模擬與畫面完全凍結）、`Music.pauseAll()`、`Sound.ctx.suspend()`、登場影片暫停；`Music` 的自動續播與點擊重試都加了 `Game.paused` 防護。回來時顯示選單：繼續戰鬥／重新挑戰（`loadStage(同關,{skipPre:true})`）／退出戰鬥（`returnToHub`，回營地）；後兩者要連按兩次確認。營地與進場時只顯示「繼續遊戲」。戰鬥計時 `Progress.battleStartTime` 扣掉暫停時間。尚未處理：對話打字機計時器（`DLG.timer`）暫停中仍會跑，之後有需要再補。

**v0.8.22 輪廓投影影子**
- `drawSpriteShadow(img, x, anchorY, S, facing, height, alphaK)`：把當下動作格的剪影（`shadowImg()` 以 1/3 解析度快取在 `WeakMap`，染成近黑）用 `ctx.transform` 壓扁（高度×0.16）投到地面、朝螢幕下方（地面在 groundY 以下）、順月光方向向左斜拉 0.38；離地越高越淡（`1-lift/420`，下限 0.15）越窄（`1-lift/900`，下限 0.5）。主角與有 sprite 的 Boss 使用（Boss 登場墜落時依高度淡入）；沒有 sprite 的 Boss、鏡像心魔、倒地旋轉備援仍畫舊橢圓（`bossEllipse`／`playerEllipse`）。調整：透明度 0.46、斜拉 0.38、壓扁 0.16 都在函式裡。

**待做**
1. 第 1 關實測後調數字（凌空斬／下劈傷害、評級門檻）；通用化後套到第 2、3 關。
2. 第 4～8 關美術與招式（流程同第九節）。

---

## 二十一、九關差異化規劃（2026-11-03 與使用者討論定案，v0.8.22 之後的主線）

**問題意識**：主角技能組固定，若 Boss 只是更快更痛更多血，玩家打到中段會無聊。解法：每關要求玩家「換一種想法」——體型、機制、場地、戰鬥形式、主角新工具輪流變化；巨型 Boss 只放第 4、7 關，中間用等大戰隔開。

| 關 | Boss | 體型／形式 | 核心機制（讓玩家換想法的點） | 場地／工具 |
|---|---|---|---|---|
| 1 | 赤煞神衛統領（已完成） | 等大單挑 | 教學：彈刀、危招、側閃、破勢、躍斬 | 登場動畫用影片（已做） |
| 2 | 千幻長老・顧天風 | 等大 | 辨真假：分身會放招，真身影子有差別，打到假的被反擊 | 迷蹤陣台、罡風陣限制走位 |
| 3 | 莫無咎＋玄鐵真君 | 等大雙姿態（依階段） | 一階段輕快雙劍吃走位、二階段重劍霸體吃彈刀破防 | 洗劍池；解鎖替身 |
| 4 | 萬劍古靈 | **巨型 #1（部位 Boss）** | 畫面只見手與巨劍：躲劍陣、趁砸落砍斷劍柄（三處）→ 露出核心 | 劍塚（地上插滿劍當障礙）；解鎖蓄力（蓄力斬破大劍） |
| 5 | **九幽魔狼**（一階段「幽影魔狼」＝小狼；二階段「九幽狼王」＝大狼） | **體型切換** | 小狼：矮、貼地、快，打了就跑，吃反應；轉變：仰天長嘯、黑氣與白骨包住脹大；大狼：約主角 2～2.5 倍，慢而重，吃時機與位置，要跳躍＋空中攻擊才砍得到頭，保留白骨刺陣 | 荒原殘陽；解鎖極處決 |
| 6 | 魅月仙子＋化血老祖 | **雙 Boss 同場** | 魅月遠處加護盾／治療老祖，要先決定切誰 | 血池（踩進去持續扣血）；需雙目標 AI |
| 7 | 金甲天將＋玄武神相 | **兩段式、巨型 #2** | 一段天將（等大，護盾要彈刀）；二段場地變龜背，玄武大如山，在甲殼與平台間跳，打頭與尾 | 沿用第 4 關的部位 Boss 引擎 |
| 8 | 司徒衡 | 等大三階段（期末考） | 人 → 魔染（吸收無相天魔幻影）→ 天道附體（全畫面劫眼預警）；回顧前面學過的東西 | 場地隨階段變 |
| 9 | 心魔・墨塵 | 鏡像、適應型 AI | 針對玩家習慣反制 | 心象新場地；無新機制（引擎已完成） |

- 美術與工程量：第 4、7 關最重（背景層大身體＋前景會動的部位，各部位有獨立判定與破綻）。**「部位 Boss」引擎在第 4 關先做、第 7 關沿用**；第 6 關要新的雙目標 AI。
- 每位 Boss 的生產流程見第九節；登場動畫流程見第 v0.8.20 段（生背景→Claude 合成首幀→使用者生影片→轉檔）。

### 第 5 關 九幽魔狼（使用者指定先做，2026-11-03 開工）

- 名稱（暫定，使用者未另選）：關卡「九幽魔狼」；一階段「幽影魔狼」（小狼）；二階段「九幽狼王」（大狼）。HP 沿用 4600、極處決破入二階段（`onBossPhase2()`），雙姿態資料沿用第 3 關的 `stanceByPhase = {1:"A",2:"B"}` 機制（A＝`assets/boss5/` 小狼，B＝`assets/boss5b/` 大狼）。
- **動作格沿用人形的 16 格命名**（引擎與切圖工具零改動），四足對應：01/02 idle；03–06 walk（用 `walkSeq` 循環動作表格子，不用影片）；07 windup＝伏身蓄勢；08 windup_thrust＝後腿壓低、蓄力撲；09 slash＝前爪揮擊；10 slash_rec＝揮擊收招；11 thrust＝空中撲咬（身體水平拉長）；12 thrust_rec＝落地緩衝；13 sweep＝甩尾旋掃；14 cast＝仰天長嘯（轉變演出用）；15 hurt；16 stagger。大狼另需倒地 17 kneel（前肢跪倒）／18 fall／19 lie（往左倒、頭在左）。
- 切圖：小狼 `sheet.py` 目標高度先抓 210（肩高約主角一半）；大狼體長要在 900×600 畫布內，用 `spriteScale` 放大（目前姿態設定只有 `sprite`、`stride`，要補 `spriteScale`；轉變演出要補「小狼脹大成大狼」的縮放動畫）。
- 招式草案（待使用者審）：
  - 小狼（快、低、打了就跑）：撕咬（2 連）、疾撲（短距離跳撲，可跳越）、繞背突襲（短暫消失再從背後出現，沿用影遁）、血爪三連、【危】狂暴撲（前閃看破）、【危】甩尾旋斬（起跳踩頭）；每招後多半接後撤（`mobility`），判定窗口短。
  - 大狼（慢、重、大範圍）：巨爪橫掃、跳起壓下（躍擊，落點震波）、咆哮震波（震退）、白骨刺陣（地面 zone，沿用）、地面連錘（三連、向前推進）、【危】噬魂吞咬（極限側閃）、【危】魔尾裂風掃（起跳踩頭）；怒氣招式：血海狼嚎。頭部平常高、被打到的機會是吞咬後低頭的破綻與空中攻擊。
- 美術清單（依序生圖）：①小狼 16 格動作表 ②荒原殘陽戰場背景 ③大狼 16 格（附小狼單格當參考）＋倒地 3 格 ④登場動畫背景＋首幀（影片）⑤書法名字卡「九幽魔狼」。半身像不做（狼不說話，戰前戰後對話由墨塵與師妹進行）。

**v0.8.23 第 5 關 九幽魔狼（引擎＋小狼美術已接）**
- 美術：`assets/boss5/`（小狼 16 格，原表第 5 格〔05_walk3〕面向左，切圖前先把該格左右翻轉；`sheet.py … 210 band`）、`assets/bg/arena5.webp`（荒原殘陽）。大狼美術未到：姿態 B 暫用 `boss5` 放大（`spriteScale 1.6`）頂替，**大狼 16 格＋倒地 3 格到位後**：B 的 `sprite` 改 `"boss5b"`、`spriteScale` 改 1.05、`sheet.py` 目標高度用 300（大狼體長要在 900×600 畫布內）。
- 引擎新增：`bossVis(stage)`（姿態各自的 `spriteScale／size／hurtHalf`；`Boss._scaleMul` 為蛻變脹大倍率）、`applyBossBody`（姿態的 `bodyW/bodyH` → `Boss.w/h`）、`bossHurt()`（受擊範圍加成：地面攻擊、空中攻擊、下劈、極處決距離都加上，大狼身體長）；姿態 `speed`（接近速度）、`rageMove`（各姿態自己的怒氣招式）；姿態池改用 `pickFromPool`（支援 `+` 串接與標籤）；接近門檻 `220 + hurtHalf`；鏡頭拉遠依 Boss 目前體型（含蛻變）動態計算；地面與霧帶兩側延伸（鏡頭拉遠不再露黑）。
- 蛻變：進二階段時若 `stage.transformMove`，`onBossPhase2` 改為觸發該招（`transform`，`isSwitch + isTransform`）：windup 1.4 秒長嘯、`Boss._scaleMul` 由 1 脹到 `transformGrow`（2.5）、持續震動與揚塵；active 起點換成姿態 B、重置倍率、震波、震退玩家。
- 招式（`Stages[5].moves`）：小狼 `s_bite／s_bite2／s_claw3／s_pounce（躍擊）／s_rush【危】／s_tail【危】／s_shadow（繞背）／backstep／dash_in／s_rage`；大狼 `b_swipe／b_stomp／b_leap【危】／b_howl／b_bone／b_bite【危】／b_tail【危】／b_rush／b_rage`。池與遠距招在 `stances.A/B`。已本機模擬：兩階段招式都會輪替、蛻變流程正常；手感與數值待實測。
- 大狼美術設定（使用者指定）：被魔氣侵蝕的不死族感，部分身體變成白骨，身上有搖曳的魔焰（生圖時火焰要畫成不透明卡通形狀，洋紅底去背才不會有殘邊；之後可用特效圖疊加動態魔焰）。

**v0.8.24 大狼美術接入**
- `assets/boss5b/`（大狼 16 格；原表有黑色格線邊框 → 新工具 `tools/sheetpad.py 動作表.jpg 輸出資料夾 目標高度 [內縮]`，每格內縮 12px 去格線再走 sheet.py 的流程；目標高度 420，`spriteScale 1.05`、`hurtHalf 230`、`bodyW 520`、`bodyH 300`、`transformGrow 3.0`）。
- AI 生圖各格的骨腿／骨尾有無不一致（01、05、09、13、14、15 有骨腿，其餘是毛腿）→ 站立與走路會閃爍，所以大狼姿態設 `remap {"01_idle1":"02_idle2"}`、`walkSeq ["03_walk1","04_walk2","06_walk4","04_walk2"]`（只用毛腿格）；攻擊格不受影響。
- 待補：大狼倒地 3 格（17_kneel／18_fall／19_lie，用 `fall3.py`）、小狼被打到二階段不需倒地；魔焰特效圖（疊加發光的動態火焰，讓背上火焰真的搖擺）；第 5 關登場動畫（背景＋影片）、書法名字卡「九幽魔狼」。

**v0.8.25 大狼攻擊誇張化（使用者要求「動作更浮誇、有力量感」，走生圖路線）**
- 新圖：`assets/boss5b/` 的 07／08／09／10／11／12／13 換成極端誇張的攻擊姿勢（`tools/poses.py 姿勢表 輸出資料夾 0.77 名稱列表 3 3` 切 3×3，已新增欄數／列數參數），另新增 `20_slam`（雙爪砸地）、`21_bite`（吞咬前撲）兩格（姿態 B 的 `extras` 載入）。新攻擊格是「全頭骨臉」，舊的站立／走路／hurt／stagger／howl 格是「半臉骨」，兩者長相有落差；若使用者在意，再用新攻擊格當參考重生其餘 7 格。
- 特效：`assets/fx/wolf.webp`（4×4：0 三道爪痕、1 魂火獠牙咬合、2 魔焰搖擺循環、3 咆哮音波）。引擎新增資料驅動招式特效：`move.fxAct`（出招起點）、`move.fxHit`（連擊每一下）、`move.fxLand`（躍擊落地的衝擊環與塵雲），欄位 `{sheet,row,ox,oy,w,h,dur,anchor,alpha}`（`spawnMoveFx`）；`stage.fxSheets` 預載。已掛：巨爪橫掃（爪痕）、噬魂吞咬（獠牙）、咆哮震波（音波）、魔尾裂風掃（風壓環）、地面連錘（每下衝擊環）、巨狼躍壓（落地衝擊）、血海狼嚎（連擊爪痕）、小狼血爪三連。
- 魔焰：大狼蛻變完成時在背上生成 3 團循環火焰（疊加、alpha 0.55，跟著 Boss，Boss 死亡後移出畫面），在亮底上用 0.55 避免洗白。
- 狼的 `isLeap` 招式新增 `frames.active = "11_thrust"`（空中撲咬姿勢）。
- 待做：倒地 3 格、引擎端誇張化（蓄力下壓壓扁、出招拉伸殘影、命中震屏頂幀）等實測後再決定要不要加、登場動畫與名字卡。

**v0.8.26 大狼倒地接入（第 5 關可完整打通）**
- `assets/boss5b/17_kneel／18_fall／19_lie.webp`：用 `tools/fall3.py 倒地.jpg 輸出資料夾 0.56` 切；原圖第 3 格（躺地）頭在右，切圖前把該區左右翻轉讓頭在左（約定：躺地頭在左）。已本機驗證倒地序列（跪 → 倒 → 躺 → 淡出）。
- 第 5 關待辦：登場動畫（崖頂換成荒原場景的背景＋首幀＋影片）與書法名字卡「九幽魔狼」（目前沿用一般橫幅）、戰前／戰後對話改寫（目前仍是舊魔狼王的暫代文字）、大狼其餘 7 格（站立／走路／hurt／stagger／howl）若要全頭骨臉再重生、手感與數值待實測。

**v0.8.27 大狼蛻變的衝擊波震飛主角（使用者提案）**
- `blastPlayer(dir)`／`updateBlast(dt)`：蛻變 active 起點呼叫；主角 `Player.blast = {phase: fly → plant → rise}`：被震飛（vx 1250、vy -470，無敵 3 秒、無法操作、面向 Boss）→ 落地滑行（劍在地上拖出 `block` 火花與揚塵、`hitstun` 狀態維持）→ 速度夠小或滑行 0.7 秒就「以劍駐地」（0.85 秒急煞、火花、震屏、浮字〔以劍駐地〕、小衝擊環）→ 0.3 秒拔劍起身，回 idle。`takeDamage` 因 `hurtInv` 全程不受傷。
- 動作格：選用美術 `assets/mc/17_slide`（滑行）、`18_plant`（劍插地穩住）、`19_rise`（拔劍起身）；沒有圖時分別用 `16_hurt`、`13_parry`、`01_idle1` 頂替（`drawPlayer` 的 `Player.blast` 分支，圖用 `MC_IMGS[n].complete` 判斷）。這三格要照主角動作表規格切：900×560 畫布、腳底 y=529、水平中心 x=450、面向右（敵人在右邊）。

**v0.8.28 主角插劍穩住的專用姿勢接入**
- `assets/mc/17_slide／18_plant／19_rise.webp`（使用者從兩張生圖各挑一格：滑行取第一張左格、插劍取第二張中格、起身取第二張右格）；新工具 `tools/mcposes.py 圖.jpg 輸出資料夾 縮放比 名稱列表 [元件序]`（單列多姿勢依元件分組，輸出 900×560、腳底 y=529、x=450，縮放比 0.40 對齊站姿高度 477）。
- 震飛期間不做受擊閃爍（`drawPlayer` 加 `!Player.blast`）；結束時 `hurtInv` 上限 0.6 秒。

**v0.8.29 招式誇張變形（使用者：圖片為了效果變形也可以，像動畫關鍵格——單格看超變形，連起來很有動態）**
- `bossDeform(move)`（只影響 `drawBossEntity` 的 sprite 繪製，不影響判定）：`move.dfm = {w, a, r, pulse, shake, bounce}`；欄位 `sx／sy`（以腳底為軸的縮放）、`rot`（弧度，正＝往前傾；`a.rotEnd` 讓 active 期間旋轉到終值，用在躍擊的抬頭→俯衝）、`ox／oy`（沿面向位移／垂直位移）、`ghost／gap`（殘影張數與間距）。windup 由中立漸入 `w`（蓄力壓扁後縮、可抖動 `shake`）→ active 在前 22% 彈到 `a`（拉長前衝帶殘影）→ recover 回中立並彈性過衝；`pulse` 讓連擊每一下各脈動一次。
- 另有 `move.kick`（出招起點的鏡頭震動量）、`move.kickHit`（連擊每下）、`fxLand` 可為倍率數字（小狼撲擊落地用 0.45）。
- 已套用：小狼 `s_bite／s_bite2／s_claw3／s_pounce／s_rush／s_tail／s_shadow／s_rage／backstep／dash_in`；大狼 `b_swipe／b_stomp／b_leap／b_howl／b_bite／b_tail／b_rush／b_rage`。數值（壓扁程度、拉長倍數、殘影、震動）都在 `Stages[5].moves` 各招的 `dfm`，使用者實測後調。其他關卡的招式可照同樣欄位加 `dfm`。

**v0.8.30 關鍵格序列＋變形降低（使用者：變形可以有但程度低很多，生圖當主要效果）**
- 新增關鍵格：小狼 `assets/boss5/20_bite_crouch／21_bite_lunge／22_pounce_coil／23_pounce_fly／24_pounce_dive／25_pounce_land／26_rush／27_tail_wind／28_tail_spin／29_claw`（原生圖 13 個姿勢，捨棄 p03 咬合（身體被截斷）、p08、p13）；大狼 `assets/boss5b/22_swipe_rear／23_swipe_mid／24_slam_up／25_slam_mid／26_leap_crouch／27_leap_fly／28_leap_dive／29_bite_wind／30_bite_snap／31_rush／32_tail_wind／33_tail_spin`（全頭骨臉）。兩姿態的 `extras` 已列出。
- 新工具 `tools/keyposes.py`：`auto` 模式（姿勢散落無格線，依元件由上到下、左到右輸出 p01…）與 `grid 欄 列` 模式（有格線與英文標籤：每格底部 10% 切掉、近黑元件視為標籤／格線濾掉）。縮放比：小狼 0.58、大狼 0.68。
- 引擎：`frames` 的每個階段可以是陣列，依該階段進度平均切換（例 `windup: ["08_windup_thrust","22_pounce_coil"]`）；`isLeap` 的 07/09 預設切換只在沒有 `frames.active` 時才用。`bossDeform` 加強度倍率 `stage.dfmK`／`move.dfmK`（第 5 關 0.35，只縮放變形量，殘影張數與震動不變）；想更誇張就調高 `S5.dfmK`。
- 各招的幀序列在 `Stages[5].moves` 的 `frames`；調整動作節奏只要改陣列。

**v0.8.31 第 5 關：拿掉程式變形、大狼攻擊格放大（使用者實測回饋）**
- 第 5 關全部招式的 `dfm`（壓扁／拉長／殘影／彈跳）已移除；引擎 `bossDeform` 保留給其他關卡。蛻變脹大（`transformGrow`）仍在。
- 大狼攻擊關鍵格 `assets/boss5b/22~33` 比走路／站立格小約 25%（keyposes 縮放比 0.68 偏小）→ 以腳底中心為軸整批放大 1.3 倍重存。
- **未解**：造型衝突——走路／站立／cast 等標準格是「毛皮完整的狼＋魔焰」，攻擊格是「頭骨臉＋骨尾＋骨肢、較瘦」。要真正統一須讓 Gemini 重生大狼 01~16（全頭骨臉＋骨尾，參考 22~33 的設計），再用 `sheetpad.py` 切圖，並拿掉 `remap`／`walkSeq` 的避骨腿限制。

**v0.8.32 大狼 01~16 重生接入（造型統一）**
- 新表：骨臉、骨尾、骨前肢、紅圍巾、背上藍／紅小魂火，16 格全部一致（`sheet.py … 420`；11_thrust 頭被格子切到，改寬裁切並手動去掉鄰格尾巴碎片）。取代舊 01~16；`remap` 與 `walkSeq` 的避骨腿限制已拿掉（走路用 03~06 全四格）。
- 保留 22~33 關鍵格（同設計，v0.8.31 已放大 1.3）。舊 `20_slam`／`21_bite`（毛絨長尾版）刪除，`b_stomp`／`b_bite` 改用 24／25／30。
- **未解**：倒地 `17_kneel／18_fall／19_lie` 仍是毛絨長尾、背刺版，與新設計不一致（死亡演出才看得到），待重生；引擎蛻變魔焰（白藍大火）疊在畫好的小魂火上，視覺略重複，實測後再決定是否拿掉其中一邊。
- 登場動畫素材已收到：`intro5` 背景（荒原殘陽）、書法名牌「九幽魔狼」；待合成首幀→使用者生影片→接入。

**v0.8.33 第 5 關登場動畫、書法名牌、新魔焰**
- 登場：`Stages[5].introCine/introDash/introVideo = "assets/boss5/intro"`（5.6 秒，Gemini 原片 10 秒，剪到揚塵蓋滿畫面處；剪影墨塵、白骨堆上的小狼、巨狼影子嚎叫、小狼衝刺）。`introDash` 模式（新）：影片結束後以揚塵色（`introFlash` "214,196,170"）淡入戰場，小狼由右側 760px 外用 `26_rush` 衝入、`25_pounce_land` 煞停、`20_bite_crouch` 低伏，落地時震動＋縮小版衝擊（`cineLand` 的 `lk` 0.6）＋書法名牌 `assets/boss5/name.webp`，之後接戰前對白。影片沒載好就直接略過動畫（沒有引擎剪影備案）。`introSfxT` 指定影片內音效時間。`startBossCine` 現可吃雙姿態關卡（用姿態 A 的 sprite）。素材：`assets/bg/intro5.webp`（影片首幀用的背景，備案用）、`assets/boss5/intro.mp4/.webm`。
- 魔焰：`assets/fx/flame.webp`（4×4，每格 256；列 0 藍焰、列 1 紅焰、列 2 紫紅藍大火、列 3 飄散火星；內容已下移讓火底貼近格底）。大狼蛻變後背上改疊 3 團大火＋火星（`Boss.y-185` 為基準，alpha 0.5～0.7）；舊的白藍火（wolf 列 2）不再用。列 0、1 尚未使用（可給小狼或階段轉換）。
- 待辦：戰前／戰後對白改寫（目前仍是暫代文字）、名牌副標題（`realmBadge`）要不要保留、倒地 17~19 重生、實測手感。

**v0.8.34～v0.8.35 第 5 關狼的音效與配樂**
- 配樂：使用者用 AI 生成兩首（原檔 the_ghost_wolf_s_vigil.mp3 176.9 秒 -12.1 LUFS、the_weight_of_a_fallen_realm.mp3 179.9 秒 -13.1 LUFS），各加 +0.4／+1.4 dB 並限幅、尾端 0.8 秒淡出、opus 80k → `assets/music/youying.webm`（一階段小狼，`STAGE_BGM[5]`）、`assets/music/langwang.webm`（二階段大狼，`STAGE_BGM_P2[5]`，蛻變完成時切換）。
- 狼聲：曾做過程式合成版，使用者嫌難聽，已移除，**不要再用程式合成動物聲**。改成外部音效檔機制：`Sound.extSfx` 列出 12 個名字，檔案放 `assets/sfx/<名>.mp3`，載入成功才有聲，沒檔的招式維持原本揮劍音（`sfxA` 要 `Sound.buffers[名]` 存在才取代）。名字：小狼 `w_snarl` 低吼、`w_bark` 吠、`w_snap` 咬合、`w_claw` 爪風、`w_howl` 嚎叫、`w_yelp` 慘叫；大狼 `m_growl` 低吼、`m_roar` 咆哮、`m_bite` 吞咬、`m_swipe` 重爪風壓、`m_stomp` 重踏、`m_howl` 長嚎。招式欄位 `move.sfx = {w 前搖, a 出招, h 連擊每一下}`，第 5 關對照表在 `S5.moves` 後的 `SFX`；蛻變前搖＝w_howl、完成＝m_roar；架勢崩潰：小狼 w_yelp／大狼 m_growl；通關 m_howl；登場影片 `Stages[5].introSfx`（秒、音名、音量、音高）與 `introLandSfx`。使用者找到音效檔後交給 Claude 裁切、正規化、轉 mp3、命名放入。

**v0.8.36 小狼 6 個音效檔接入**：使用者用 ElevenLabs 生成（英文提示詞見對話），Claude 去頭尾靜音、峰值正規化到 -1.5 dBFS、淡入淡出、轉單聲道 mp3：`assets/sfx/w_snarl／w_bark／w_snap／w_claw／w_howl／w_yelp.mp3`（1.03／0.38／0.22／0.53／1.99／0.43 秒）。大狼 6 個（m_growl／m_roar／m_bite／m_swipe／m_stomp／m_howl）還沒到，目前大狼招式維持原揮劍音。使用者給檔順序固定：小狼＝低吼、吠、咬合、爪風、嚎叫、慘叫；大狼＝低吼、咆哮、吞咬、重爪風壓、重踏、長嚎。

**v0.8.37 大狼 6 個音效檔接入**：同小狼流程（去頭尾靜音、峰值 -1.5 dBFS、轉單聲道 mp3）：`assets/sfx/m_growl／m_roar／m_bite／m_swipe／m_stomp／m_howl.mp3`。12 個狼聲到齊；用法見 v0.8.34～35 的對照（大狼前搖＝m_growl，出招＝m_swipe／m_bite／m_roar，地面連錘每下＝m_stomp，蛻變完成＝m_roar，登場影片巨狼影子嚎叫＝m_howl，通關＝m_howl）。音量與時機待使用者實測，過大或過小改各招 `Sound.play` 的音量參數或重新正規化。

## 二十二、改進路線圖與製作流程（2026-11-05 與使用者定案）

**最高原則：夠精緻。** 參考各式動作遊戲的「手法」，維持本作淡彩風格聖經（學手法不學色調）。規劃文件（評價、Gemini 修補核對、架構圖、路線圖、流程圖）：https://claude.ai/artifact/BjxbYyw3oMfbPZkWg5RdQZ

**使用者決定（全部照 Claude 建議）**：從 M0 開始；後四關順序 4→6→7→8；缺配樂的關先用倉庫 7 首舊曲（dongfu 洞府、libie 離別、lilian 歷練、tianjie 天劫、weiju 危局、wenqing 溫情、zhandou 戰鬥）暫代，之後換專屬曲；傷害數字預設關閉、設定裡可開；螢幕暗角只做極淡、每關可調、Boss 前搖時減弱（M2 截圖確認）；故事大綱 M3 期間先定，對白仍最後一次重寫；難度暫定「初見約 3～6 次過關」，實測再調；工期假設使用者每天可生圖與實測（約 23 個工作天）。

**Gemini 2026-11-05 的五項修補（已核對，不套用）**：只有修補一套得上且是死碼；揚塵、落地擠壓、Boss 受擊反應與招式變形 v0.8.x 早已有；修補三公式會讓 Boss 永遠拉高 3%。保留兩個點子：音高隨機微調（M1 在 `Sound.play` 統一做）、處決浮字精簡（M2 做全遊戲浮字規則）。「剑」字在圖檔 `assets/fx/exec_t2.webp`，要重生圖。

**里程碑**
| 里程碑 | 內容 | 過關條件 | 估時 |
|---|---|---|---|
| M0 地基 ✅ | `src/` 分檔＋`tools/build.py`；`tools/smoke.js` 九關自動對打；交接文件改版 | 組回檔與 v0.8.37 逐位元組相同；九關 smoke 0 錯誤 | 1 天 |
| M1 聲音 | 11 個通用合成音（parry block slash flysword hit peril mikiri execution gourd assist victory）換生成檔；音效匯流排（總限幅、同音上限、變體＋±4% 音高）；缺配樂關暫代 | 全遊戲無合成音、使用者手機聽過 | 1～2 天 |
| M2 第 1 關金標準 | 回饋表 FEEL（集中定格／震屏／音效／特效／震動，數字照搬；受擊閃白改以秒計）、浮字規則、分層場景 `Stages[n].layers`＋各關地面、主角攻擊關鍵格（預備／拖影／收招）、「劍」字重生、山門版面；1/2/3/5 關數值實測 | 第 1 關完成定義全過 | 3～4 天 |
| M3 第 4 關 萬劍古靈 | 部位 Boss 引擎（手、巨劍、三處劍柄、核心），灰盒先行 | 完成定義 | 3～4 天 |
| M4 第 6 關 魅月＋化血 | 雙 Boss 同場 AI、血池 | 完成定義 | 2～3 天 |
| M5 第 7 關 金甲天將＋玄武 | 沿用部位引擎、龜背場地 | 完成定義 | 2～3 天 |
| M6 第 8 關 司徒衡 | 三階段期末考 | 完成定義 | 2～3 天 |
| M7 第 9 關 心魔 | 新戰場、倒影升起、化光點 | 九關內容到齊 | 1 天 |
| M8 劇情一次重寫 | 正傳→大綱→對白→使用者審；開場、營地、師妹全身圖 | 使用者審過 | 2～3 天 |
| M9 Beta→1.0 | 難度曲線、清舊系統（`StoryEngine`／`CinemaEngine`／`LegacyStages`／舊 CSS）、效能、設定、片頭片尾 | 九關一輪通關無卡死 | 2～3 天 |

**單關七步（灰盒先行）**：①設計卡（Claude 起草、使用者定案：這關要玩家學什麼、招式表、階段、場地）→②灰盒原型（方塊版做出全部招式）→使用者手機打「好玩嗎？」否→回①→③美術規格＋提示詞→④生圖（使用者＋Gemini，可和下一關灰盒同時跑）→⑤接入→⑥聲音→⑦smoke＋手機實測→「完成定義全過？」否→回⑤調整→打版本標籤。

**完成定義**：美術全部一致、無方塊、倒地三格、分層背景與地面；每招有關鍵格／特效／音效、危招提示清楚；登場動畫、書法名牌、二階段轉場、擊敗演出；Boss 專屬音效與兩階段配樂；smoke 0 錯誤、手機實測 ≥2 次、不掉幀；難度達標；HANDOFF 段落、ASSET_VER、版本標籤。

**參考作品（學手法）**：景深與氣氛——空洞騎士、奧日（多層視差、前景剪影、薄霧光柱）；彈刀與架勢——隻狼、九日 Nine Sols（東方題材、招架為核心的 2D，最接近本作）；打擊回饋與手感——死亡細胞、空洞騎士（定格、拖影、短促回饋）；Boss 演出與部位戰——褻瀆神明、Nine Sols、空洞騎士；介面減法——空洞騎士（幾乎無浮字）。

**v0.8.37＋M0（遊戲內容未變，index.html 與 v0.8.37 逐位元組相同，ASSET_VER 不變）**
- `src/`：25 個檔（`manifest.txt` 決定順序）；`python3 tools/build.py` 組出 `index.html`，`--check` 檢查是否一致。**之後只改 `src/`**。
- `tools/smoke.js`：九關各 20 秒鍵盤亂數對打（首跑結果：九關皆 ok，招式 3～8 種輪替）。
- 下一步：M1 聲音——Claude 先給 11 個通用音效的英文生成提示詞（不合成），使用者生成後交給 Claude 處理接入。

**v0.8.38 M1 聲音（第一批：系統面，不需素材）**
- 音效匯流排：`Sound.master`（總音量 0.9）→ 限幅器（threshold -10、ratio 12）→ 喇叭；所有 `Sound.play` 走這條，多音疊加不爆音。
- `Sound.play`：同名音效同時最多 `maxVoices`=4 個（狂按不疊爆）；音高隨機 ±`pitchJitter`=4%（`noJitter` 列表內不抖，目前 victory）；有變體時隨機挑一個。
- 通用音效換檔機制：檔案放 `assets/sfx/g_<名>.mp3`（變體 `g_<名>_2.mp3`…），在 `Sound.genSfx` 登記 `{名: 變體數}` 才載入；載入成功蓋掉合成音且不過低通。11 個名字：parry block slash flysword hit peril mikiri execution gourd assist victory。目前 `genSfx` 為空（檔案未到）。
- 暫代配樂：`STAGE_BGM` 2 lilian、3 zhandou、4 tianjie、6 weiju、7 zhandou、8 tianjie、9 weiju；營地 `HUB_BGM = "dongfu"`（`loadStage` 進營地播放）。之後每關換專屬曲只改這張表。
- 驗證：check.js 0 錯誤；smoke 九關 ok；無頭測試確認匯流排存在、同音上限生效、營地／第 4 關曲名正確。
- 下一步：使用者依提示詞生成 11 個通用音效（每個 2～3 個變體）→ Claude 裁切、正規化 -1.5 dBFS、命名、登記 `genSfx`；之後進 M2。

**v0.8.39 M2 第一步：浮字規則**（`src/30_state.js` 的 `spawnFloatingText`／`FT_RULE`）
- 傷害數字預設關閉：文字裡的「-123」「+20%」會被拿掉，剩空字就不顯示；`localStorage.qingyun_dmgnum="1"` 才顯示（齒輪選單開關待做，屬版面改動要先截圖）。
- 含「一劍青雲」的浮字一律不出（畫面中央已有書法大字）。
- 同字同位置 0.25 秒內不重複堆疊。
- 已提供 11 個通用音效的 ElevenLabs 提示詞，等使用者貼回。M2 下一步：回饋表 FEEL、分層場景引擎＋分層背景提示詞、主角攻擊關鍵格提示詞。

**v0.8.40 通用音效 10 個接入**（ElevenLabs 生成）：去頭尾靜音、峰值 -1.5 dBFS、單聲道 mp3 → `assets/sfx/g_parry／block／slash／flysword／peril（裁 1.3 秒）／mikiri／execution／gourd（裁 2.2 秒）／assist（裁 2.0 秒）／victory.mp3`，`Sound.genSfx` 已登記（各 1 個變體）。**hit（命中）還沒到**，仍是合成音。音量與長度待使用者實測。

**v0.8.41 命中音效接入**：`assets/sfx/g_hit.mp3`，`genSfx` 加 hit；11 個通用合成音全部換成生成檔。

**v0.8.42 M2 回饋表 FEEL（`src/30_state.js`）**
- `FEEL = {hit, heavy, block, parry}`：每項 `stop` 定格毫秒（-1＝依 `Config.parryHitstopFrames`）、`shake` 震屏（舊 amp 刻度）、`buzz` 手機震動、`flash`／`flashP` Boss／主角閃白（60Hz 幀）；`feel(name, dir)` 一次觸發。`FEEL_K = {stop, shake, buzz}` 全域倍率。
- 已搬：普攻命中／重擊／被格擋（`bossHitFx`）、完美招架（`doPerfectDeflect`）。數字與 v0.8.41 相同，手感不變。其餘事件（受擊、危招閃避、處決、落地）之後逐步搬。
- 閃白改以秒計（`flashFrames -= dt*60`），120Hz 手機閃白長度與 60Hz 相同。

**v0.8.43 M2 分層場景引擎（`src/60_render.js` 的 `drawArenaLayers`）**
- `Stages[n].layers = [{img, par, y, h, fg, alpha, dim}]`：`img`＝`assets/bg/<名>.webp`（透明 webp、橫向重複鋪滿）；`par` 視差（0 天空不動、1 與地面同速、>1 前景比角色快）；`y`／`h` 世界座標上緣與高度；`fg:true` 畫在角色前（`drawLeaves` 之後）；`dim` 該層加暗（brightness）。背景層畫在 `bgDim` 暗化之前。
- 目前沒有任何關卡設 layers，畫面不變；已用暫代圖測過前景層可正常鋪滿、加暗、無錯誤。
- 待素材：第 1 關「崖頂地面帶」與「前景剪影」（提示詞已給使用者），到位後地面帶取代各關共用淺色地面。

**v0.8.44 第 1 關分層場景上線（使用者看截圖確認）**
- `assets/bg/arena1_ground.webp`（崖頂地面帶，洋紅去背）、`arena1_fg.webp`（前景松石剪影）；`Stages[1].layers`：地面 `ground:true, y 475, h 330, dim 0.12`；前景 `fg:true, par 1.35, y 560, h 250, alpha 0.95, dim 0.15`。
- `drawArenaLayers(camX, id, pass)` 分 bg／ground／fg 三道；有 ground 層的關卡不畫共用淺色地面帶與地面線（`arenaHasGround`）。
- 去背做法：洋紅強度 min(R,B)−G 轉透明＋邊緣收縮與去溢色（腳本流程同本次，之後各關地面／前景照做）。
- 其他關卡要做時：提示詞照第 1 關的兩張（地面帶 4:1、行走面在上緣 15%；前景 4:1、只放下緣），換成該關場景描述。

**v0.8.45 主角攻擊三拍關鍵格（M2）**
- 生圖 3×3 → `assets/mc/20_s1a／21_s1b／22_s1c`（第一刀：預備／出刀／收招）、`23_s2a／24_s2b／25_s2c`（第二刀上撩）、`26_t_a／27_t_b／28_t_c`（第三刀突刺）；切圖縮放 0.70（對齊站姿比例），腳底 y=529、以雙腳中心對 x=450。腳本：洋紅去背→依空白帶分 3 列→每列取最大 3 元件分組（刀光併入最近者）。
- `MC_ATK`（`src/64_draw_boss.js`）；`drawPlayer`：判定在出手瞬間，所以預備只閃 0.05 秒、出刀格撐到 45%、之後收招；空中攻擊用出刀格；處決與破勢反擊用 `27_t_b`。舊 09/10/11 留作備援。

**v0.8.46 第 1 關統領四招三拍關鍵格（M2）**
- 使用者生兩張 4×3 姿勢表，主要用第二張（無地面線），橫掃起手 `30_swp_wind` 取第一張（武器在身後較好認）。切圖縮放 1.0、900×600、腳底 y=560、雙腳中心 x=450（`/tmp` 腳本 cutb.py：去背→分列→每列 3 組；細長地面線元件自動排除）。
- `assets/boss1/24_chop_wind／25_chop_hit／26_chop_rec`（破軍 `slash1`）、`27_thr_wind／28_thr_hit／29_thr_rec`（【危】貫日長槍刺 `thrust_peril`）、`30_swp_wind／31_swp_hit／32_swp_rec`（【危】八荒斷岳掃 `sweep_peril`）、`33_leap_crouch／34_leap_air／35_leap_land`（【危】神衛躍斬 `leap_slam`）；各招 `frames {windup, active, recover}`，`Stages[1].spriteExtras` 已加。
- 待做：第 2、3 關 Boss 同樣補 3～4 招（數值實測時一起）；新 Boss（4、6、7、8）美術規格一開始就含招式關鍵格。

**v0.8.47 修正處決暗場只蓋中間一塊**：`render` 的 `darkVignetteAlpha` 原本只畫 `cam.x-100` 起 1480×720 的世界座標矩形，寬螢幕手機（比 16:9 寬）與鏡頭拉遠時兩側露出未變暗的畫面，看起來像一塊半透明黑底；改成蓋滿（同 `ultDim`）。
**使用者決定**：處決書法「一劍青雲」的「剑」字不改（從 M2 待辦移除）。

**v0.8.48 營地減法（使用者看截圖確認）**
- `body.hub-mode` 隱藏回生酒／瞬步／招架／玄天珠／跳躍；大鍵只在走近師妹時出現（`body.hub-near`，`hubTick` 依 `Game.hubNpcNear` 切換），文字改「交談」（`82_dialogue.js` 的按鈕標題、`80_flow.js`）。出山門（mode=enter）移除 hub-mode／hub-near，戰鬥按鈕恢復。
- 山門上的字（第 N 難、Boss 名、境界）拿掉；地上「向右進入 ▶」保留。
- 討論中：山門改成可「走過去」的形式（洛克人 Boss 門概念）、營地美術（山門、營火、師妹全身）提示詞已給使用者。

**v0.8.49～v0.8.50 營地美術（使用者看截圖確認）**
- 素材：`assets/bg/hub_gate.webp`（斜側面牌坊，半解析度 738×657；原圖右後柱缺柱腳，已用自身柱身延長＋左柱柱腳放大補上）、`hub_gate_front.webp`（前柱單獨一層，`drawHubFront` 畫在主角之後＝主角從牌坊底下穿過）、`hub_fire_base.webp`（石圈木柴）、`assets/fx/campfire.webp`（4×4：列 0～1 火焰 8 格 12fps、列 2 火星、列 3 煙，lighter 疊加）、`hub_shimei_1～4.webp`（400×700，腳底 (200,695)；1／2 呼吸循環 0.9 秒、4 招牌撥髮每 8 秒一次、3 交談時；圖面向右，營地鏡像面向左）。
- 位置：`HUB_GATE_S = 0.42`、`HUB_GATE_L = -613`（前柱中心約 -230，橫樑高於主角頭頂）；`HUB_FIRE_X = -900`；`HUB_NPC_X = -660`、`HUB_START_X = -790`；`HUB_GATE_X = -150` 不變。
- 結界光幕：門洞（中柱～前柱）淡青光幕＋流動光絲，主角接近 40～300px 內漸散，散開時 `Sound.play("assist")` 一次。
- 影子：`hubLight(x)` 以營火為光源（方向背向火、越近越深越長、`hubFlick` 火光晃動）；主角在營地的 `drawSpriteShadow` 也改用它；師妹 `hubShadow`；山門四柱各自切剪影（`Game._gateSh`），以各自柱腳底為軸往右後方（畫面右上）投到草地；營火下方接地暗影隨火閃動。
- 營地上的字：山門文字、地上「向右進入」都拿掉，只留上方教學橫幅；師妹名字只在走近時顯示。
- M2 剩：第 1、2、3、5 關數值實測（需使用者手機實測回報）。

**v0.8.51 營火放慢、影子輕晃**：火焰 12→8fps、煙 3→2fps、火星 6→4fps；`hubFlick` 改為 ±約 4.5%、低頻（2.6／6.1 rad/s），影子方向／長度／深淺只輕微晃動。

**v0.8.52 影子起伏再減**：`hubFlick` 改為 ±1%、頻率 1.2／2.9 rad/s（週期約 5 秒）。

**v0.8.53 山門整座投影（使用者看截圖確認）**：`buildGateShadow`（`src/62_hub.js`）把整張牌坊剪影（柱＋橫樑＋屋頂）逐欄（2px）投影，每欄以該欄柱腳為軸（柱間柱腳線性內插），方向／深淺照 `hubLight`；`GATE_SH = {hf 0.35 水平, vf 0.30 垂直, a 1.6 深淺倍率}`；算一次存 `Game._gateSh`（含 1.5px 柔邊），每幀只做 `hubFlick` ±1% 縮放。

**v0.8.54 修正處決大字殘留**：打贏後很快進下一關／回營地，`executionBannerTimer` 只在戰鬥物理裡倒數，營地不跑物理，「處決」字一直留在畫面上；`loadStage` 開頭清掉處決大字、`winTitle`、暗場、閃白、處決線。使用者回報：第 1 關難度還行（數值不調）。

**v0.8.55 第 2 關補強（灰盒：分身＋動態感，不需新素材）**
- 千幻分身（新檔 `src/52_illusion.js`，manifest 在 51 之後）：招式 `mirror_split`（`isSplit`）；二階段開場必出一次（`onBossPhase2` 設 `Boss._splitPending`），之後在 `Stages[2].poolP2` 權重 9。施放時一真兩假站成三處（玩家左右 300＋空間大的一側 600，真身隨機），`Game.illusions` 借 `drawBossEntity` 繪製（`Boss._ilDraw` 時不畫影子、氣場、提示圈、危字、決字）→ **只有真身有影子**。
- 幻影同步：前搖鎖面向、出招同步突進；近戰在真身判定同一刻各自判定（`illusionStrike`，傷害×0.5，危招不判定）；遠程同步射 1～2 把直線飛劍（垂落飛劍不重複）。
- 主角出刀面向最近目標（`aimX()`，不洩漏真身）；打到比真身近的幻影 → 鏡碎，0.3 秒後鏡片反噬（半徑 240、傷害 90、可招架）；打到真身或真身破勢 → 幻影全散「看破真身」；最多 14 秒。數字在 `ILLU`。
- 第 2 關原本沒有 `pool`（二階段是全招式亂數），已補 `pool`／`poolP2`。
- 動態感：`dfmK 0.5`；罡風扇擊、千影穿雲刺（4 張殘影）、八卦風火輪、飛劍、兩種瞬移都加 `dfm`（蓄勢壓縮→出手拉長＋殘影）；`fxAct`：扇擊與風火輪用 `air` 列 0 風刃、穿雲刺用 `slash` 列 2 突刺光；瞬移 `tpFx`：原地 `spark` 列 2 碎散、落點列 0 聚合＋揚塵。
- 驗證：check 0 錯誤；smoke 九關 ok；第 2 關二階段亂數 40 秒：分身出現、8 種招式輪替、無錯誤。待使用者手機實測「好玩嗎」。
- 第 2 關接下來（生圖）：5 招三拍關鍵格、迷蹤陣台地面帶＋前景、開場影片背景、書法名牌。

**v0.8.56 第 2 關美術接入（使用者看截圖確認）**
- 五招三拍關鍵格（生圖 3×5，`tools/keyposes.py … 1.06 auto`）→ `assets/boss2/20_fan_wind／21_fan_hit／22_fan_rec`（罡風扇擊 slash1）、`23～25_thr_*`（千影穿雲刺）、`26～28_swp_*`（八卦風火輪）、`29～31_cast_*`（飛劍＋垂落飛劍）、`32～34_tp_*`（鏡影瞬殺＋雙襲）；`Stages[2].spriteExtras` 已加。
- 分層場景：`assets/bg/arena2_ground.webp`（迷蹤陣台石板＋八卦陣紋，`y 455, h 330, dim 0.08`）、`arena2_fg.webp`（石欄松枝晶石剪影，參數同第 1 關）。

**v0.8.57 第 2 關專屬特效＋名牌＋開場背景**
- **使用者規則（已寫進 CLAUDE.md）：戰鬥特效一律生圖，除非現有特效真的剛好適合才借用。**
- `assets/fx/boss2fx.webp`（4×4 黑底發光：0 扇刃、1 指劍突刺、2 八卦旋風、3 鏡碎）：罡風扇擊／千影穿雲刺／八卦風火輪的 `fxAct`；瞬移原地鏡碎、落點旋風；分身現形與幻影碎裂用鏡碎、鏡片反噬用旋風。`Stages[2].arcArt = "boss2fx"`：特效圖載入後不畫程式橘色刀弧。幻影出招時也同步播 `fxAct`（`illusionMoveFx`，否則特效會洩漏真身）。
- `assets/boss2/name.webp`（書法「千幻長老」，1400×347）、`assets/bg/intro2.webp`（開場背景 1920×1072，原圖 2576×1438：Boss 圓台頂面 y≈612、x≈2190；主角左下石道 y≈1262、x≈560）；`Stages[2].introBg／introName` 已設，`introCine` 未開（等影片）。首幀已合成給使用者（Boss 縮放 0.85 鏡像面左、主角 0.62）。

**v0.8.58 第 2 關開場動畫（影片＋鏡片聚合現身）**
- 影片 `assets/boss2/intro.mp4／.webm`（Gemini 原片 10 秒剪到 7.0 秒、無聲）：剪影顧天風揮扇分身 → 全數碎成鏡片 → 鏡片旋風撲向鏡頭蓋滿畫面。首幀為剪影（照第 1、5 關慣例：全黑剪影，Boss 加極淡青光）。
- 新模式 `introAppear`（`61_cine.js`，掛在 `introDash` 流程下）：影片結束以 `introFlash` 青白色淡入戰場 → 原位播 `boss2fx` 列 2 旋風＋碎光 0.75 秒 → 顧天風閃白現形（列 3 鏡碎）＋書法名牌 → `33_tp_hit`／`34_tp_rec` → 待機 → 戰前對白。影片期間音效 `introSfx`（揮扇、分身、碎裂、旋風）。
- 待使用者實測：影片在手機是否順、音效時間點、名牌在亮背景上夠不夠清楚。

**v0.8.59 第 3 關三拍關鍵格＋專屬特效（雙姿態）**
- A 雙劍表（生圖 3×5，縮放 1.127）→ `assets/boss3/20_hs_*`（疾風雙劍斬 slash1）、`23_x_wind／24_x_hold／25_x_hit`（十字斬、假動作、劍雨前搖）、`26～28_spin_*`（旋風刃 slash2）、`29～31_dash_*`（疾步突進＋危招突刺）、`32～34_low_*`（危招低掃）；B 重劍表（縮放 1.072）→ `assets/boss3b/20～22_slam_*`（玄鐵壓頂／劈砍／重劈）、`23～25_plunge_*`（戒律鎮壓：跳起→插地→扶劍；跳起格手動抬高 70px）、`26～28_charge_*`（撼嶽撞）、`29～31_sweep_*`（千鈞橫江斬）、`35～37_draw_*`（拔重劍；35 兩個資料夾都有，因為前搖仍在 A 姿態）。
- 切圖腳本：`/tmp/cut3.py`（未入庫）＝ keyposes 的 extract＋**以靴子亮色像素定腳底**（插地重劍會低於腳，不能用 bbox 底）；36 格手動擦掉 Gemini 自帶的粉色刀痕。
- 特效：`assets/fx/boss3fx.webp`（A：0 雙月牙、1 旋風環、2 突刺光、3 劍雨飛劍）、`boss3bfx.webp`（B：0 重劍弧、1 落地震波、2 戒律陣紋循環、3 拔劍爆氣）；`arcArt = "boss3fx"`。
- 引擎：`spawnMoveFx`／`illusionMoveFx` 接受陣列（一招多特效）與 `rot`；`Stages[n].swordRainArt`（劍雨改畫生圖，無圖退回程式畫）；`Stages[n].zoneArt = {type: [sheet, row]}`（地面區域改畫陣紋）；`move.burst`（換姿 active 起點爆氣＋震屏＋定格）；`Stages[n].phaseSwitchMove`：進二階段真的播一次拔重劍（前搖 0.75 秒可打），被打斷則 AI 下次出招補播。
- 驗證：check 0 錯誤；第 3 關逐招截圖確認；smoke 九關 ok。**已知偶發**：第 2 關 smoke 約 1/5 機率回報「主角卡住」（都在 Boss 血量 <1700、二階段之後；這版沒動到該流程，單獨重現處決正常），待查。

**v0.8.60 修正第 3 關二階段卡死（使用者回報）**
- 原因：重劍姿態下 AI 仍會出 `sweep_peril`（通用 AI 分支直接呼叫），v0.8.59 把它指向雙劍資料夾的 `32_low_*`，重劍資料夾沒有 → `drawImage(undefined)` 丟錯 → 主迴圈中斷、畫面停住（角色消失、只剩影子與特效）。
- 修正：B 姿態 `alias` 加 `sweep_peril: "heavy_sweep"`；`drawBossEntity` 缺圖時改用通用格（07／09／10／01）；主迴圈 `loop` 包 try/catch（出錯只記一次 console，`ctx.reset()` 後繼續），以後任何單幀錯誤都不會整個卡死。
- 規則：**雙姿態 Boss 的招式關鍵格，每個姿態都要能找到圖**（換姿態借招時用 alias 或兩邊資料夾都放）。

**v0.8.61 第 3 關地面帶＋開場背景**
- `assets/bg/arena3_ground.webp`：Gemini 原圖上半是重複的一段（含洋紅色帶），從 y=177 起裁、縱向拉到 503、上方補透明 136px（石面上緣與 `arena2_ground` 同一列），`Stages[3].layers` 參數同第 2 關（dim 0.06）。
- `assets/bg/intro3.webp`（1920×1072，原圖 2576×1438：Boss 石台頂面約 x 1950、y 800；主角左下石道約 x 450、y 1300），尚未設 `introBg`（等開場影片）。
- 前景 `arena3_fg` 第一張不能用（整片地面＋兩側全景），已給更嚴格的提示詞重生。
- 書法名牌：Gemini 一直寫錯「咎」，使用者考慮換角色名。

**v0.8.62 第 3 關 Boss 改名：莫無咎 → 莫寒川**（使用者決定；Gemini 一直寫錯「咎」）。`src/` 全部替換（含「寒川回旋・旋風刃」「【危】寒川絕命刺」、對白、換姿提示）；舊段落的「莫無咎」是歷史紀錄不改。M8 劇情重寫時沿用新名。

**v0.8.63 第 3 關前景＋名牌**：`assets/bg/arena3_fg.webp`（竹叢五簇，洋紅去背＋去碎片，`fg` 參數同第 2 關、dim 0.18）；`assets/boss3/name.webp`（書法「莫寒川」1400×347），`S3.introName` 已設。開場影片首幀已合成給使用者（`intro3` 背景＋Boss 剪影 0.85 鏡像面左、腳底 (1480,612)，主角 0.62、腳底 (335,975)），等影片回來再設 `introBg／introCine／introVideo／introAppear`。

**v0.8.64 第 3 關開場影片**
- `assets/boss3/intro.mp4／.webm`（Gemini 原片 10 秒剪到 7.6 秒＝亮度最高、飛劍蓋滿畫面，無聲）：剪影莫寒川舉雙劍 → 池中升起飛劍 → 萬劍撲向鏡頭。
- `introAppear` 參數化（`61_cine.js`）：`Stages[n].introAppearCfg = {swirl:[列,寬,高度,高], land:[列,寬,高度], frames:[現身格,收勢格], rain:落劍數, sparks:火花種類或 null}`，預設值＝第 2 關原本寫死的數字（行為不變）。第 3 關：旋風環 boss3fx 列 1 → 7 把飛劍（列 3）落在四周 → 雙月牙爆光（列 0）＋名牌 → `25_x_hit`／`22_hs_rec`；不出第 2 關的青色火花；`introFlash` 淡紫白。
- `introSfx`：揮劍、飛劍升起、萬劍撲來（暫用通用音效，之後換 Boss 專屬音效）。

**v0.8.65 第 2 關飛劍換圖拉高＋smoke「主角卡住」查明**
- 飛劍改畫生圖：`Stages[n].flySwordArt = {sheet, row, frames, fps, w, tip}`（`drawFlyingSwords`，依速度方向旋轉、lighter 疊加、折射後轉金色濾鏡）；第 2 關暫借 `boss2fx` 列 1 指劍突刺光（格 1、2 循環），等專屬飛劍圖。垂落飛劍也套用，且碰到地面就碎（原本穿進地下）。
- 飛劍高度：招式可設 `bulletY`（相對腳底）；第 2 關 `flyswords` 為 -200／-165／-130（肩到腰；主角圖約高 240，原 -77／-55／-33＝膝到大腿）；分身的飛劍也照用。
- 判定改照圖上身高：飛劍打主角 `Player.y - Player.h×2.05`～腳底；折射打 Boss `Boss.y - Boss.h×1.6`～腳底（原本只到大腿，拉高後會穿過）。
- **smoke「主角卡住」查明＝誤報**：亂數對打打贏後結算畫面開著（物理暫停），按鍵仍改主角狀態 → 判成卡住。修正：`inputLocked()`（戰鬥中 `cutsceneActive` 時六個動作鍵不作用）；Boss 倒下後出刀與折射飛劍不再把血量夾回 1；smoke 偵測到結算畫面就記「（擊敗）」結束該關；空中招（`isAerial`，最長 9 秒）卡住門檻放寬到 13 秒（第 6 關原本偶發誤報）。
- 驗證：check 0 錯誤；九關 smoke ok；第 2 關飛劍／垂落飛劍截圖確認；強制擊殺測試結算正常、血量維持 0。

**v0.8.66 第 2 關專屬飛劍圖**
- `assets/fx/boss2sw.webp`（Gemini 4×4 黑底，2048→1024：切格去格線、黑位壓到純黑、列 0 左緣漸隱）：0 飛行循環（劍身微上斜，`rot 0.16` 補正）、1 召喚成形、2 命中碎裂、3 插地碎散。
- `flySwordArt` 加 `tipX／tipY`（格內劍尖座標，對準飛劍判定點）、`summonRow`（前搖時 `summonSwordsFx` 在出手高度召喚成形；幻影也照它要射的高度召喚）、`breakRow`（命中主角／壽命到）、`groundRow`（垂落飛劍插地）；碎裂在 `swordImpactFx`。
- 招式 `bulletX`：劍尖從手前方出發（第 2 關 150；主角太近時退回 30）。

**v0.8.67 第 2 關 Boss 專屬音效（ElevenLabs）**
- `assets/sfx/b2_*.mp3`（20 個檔）：去頭尾靜音（-45 dB）、峰值 -1.5 dBFS、單聲道 96k；`b2_sword_fly` 原檔 3 秒，取主要一段（0.3～1.35 秒／0～0.85 秒）。
- 載入：`Sound.bossSfx = {名: 變體數}`（與 `genSfx` 同一個載入器，無前綴）。
- 指定：招式 `sfx {w 前搖, a 出招}`（扇擊 b2_fan、穿雲刺 b2_thrust、風火輪 b2_vortex、飛劍／垂落前搖 b2_sword_cast）；其他事件 `Stages[n].sfx[事件] = [檔名, 音量, 音高]`，由 `bsfx(事件)` 播放（沒設定就回傳 false，播原本通用音）：tpOut b2_vanish、tpIn b2_appear、split b2_split、ilBreak b2_shatter、ilShard b2_shard_hit、swordFly b2_sword_fly（每把）、swordRain b2_sword_rain（整串一次）、introSwirl b2_vortex、introLand b2_shatter；開場影片 `introSfx` 也換成 b2_*。
- 待使用者實測：各音量是否平衡、飛劍三連音是否太吵（swordFly 音量 0.55）。第 3 關接法相同（`b3_*`＋`S3.sfx`）。

**v0.8.68 第 3 關 Boss 專屬音效（ElevenLabs）**
- `assets/sfx/b3_*.mp3`（16 個檔，處理同 v0.8.67；b3_seal 尾端 0.25 秒淡出）。
- 招式 `sfx`：疾風雙劍斬 b3_twin；十字斬每下／假動作 b3_cross；旋風刃 b3_spin；疾步突進、寒川絕命刺 b3_dash；低掃 b3_low；叛宗劍陣（劍雨）b3_rain；拔重劍（出手爆氣那一刻）b3_draw；玄鐵壓頂／劈砍、重劈每下 b3_heavy；戒律鎮壓插地 b3_plunge；撼嶽撞 b3_charge；千鈞橫江斬 b3_sweep。
- `S3.sfx`：zone（戒律陣紋生成，新事件，`bsfx("zone")` 在 `isZone` 生成時）b3_seal、introSwirl b3_spin、introLand b3_cross；開場影片 `introSfx` 換成 b3_*。
- 待使用者實測音量平衡。

**v0.8.69 第 2、3 關兩階段專屬配樂＋營地配樂（ElevenLabs Music）**
- `assets/music/b2_p1`（Seven Turns of the Fan）、`b2_p2`（Duel of the Bamboo Blade）、`b3_p1`（Swordsman's Winter Oath）、`b3_p2`（Cold Steel Dirge）、`camp`（Before the Ascent）.webm：去掉結尾淡出、尾段與開頭交叉淡化做成無縫循環（戰鬥 1.5 秒、營地 4 秒），響度統一 -12 LUFS（與舊曲相同），opus 96k。
- `STAGE_BGM` 2→b2_p1、3→b3_p1；`STAGE_BGM_P2` 加 2→b2_p2、3→b3_p2，`onBossPhase2` 開頭換曲（有 `transformMove` 的第 5 關仍在蛻變時換）；`HUB_BGM = "camp"`。
- 待使用者實測：循環接縫、與音效的音量比例。

**v0.8.70 配樂對調（使用者決定）**：第 2 關二階段 `b2_p2` 改為 Swordsman's Winter Oath，第 3 關一階段 `b3_p1` 改為 Duel of the Bamboo Blade（竹林雙劍較貼第 3 關）。只換檔案內容，檔名與程式不變。

**v0.8.71 瞬步聲改輕**（使用者回報刺耳）：`doDash` 的 `Sound.play("slash")` 音量 0.55→0.22、音高 1.4→1.12；完美閃避、替身反切的音效不變。

**v0.8.72 第 2 關飛劍：可逐把彈、間隔加長、出手動作加大**（使用者回報第三把擋不到）
- 原因：三把間隔 0.2 秒（共 0.4 秒）＞一次格擋 0.36 秒，且格擋冷卻 0.55 秒、折射成功不清冷卻（近戰彈刀會清）→ 第三把幾乎擋不到。
- 修正：折射成功 `Player.parryCooldown = 0`（同 `doPerfectDeflect`）；招式 `bulletGap`（每把間隔秒數，預設 0.2），第 2 關 0.38（幻影同步放寬）；`windup` 0.45→0.6、`active` 0.15→0.96（出手姿勢撐滿整串）。
- 動作：`dfm` 前搖後仰加大（rot -0.12、ox -22）、出手前傾（rot 0.07、ox 18），新增 `dfm.kick`（每射一把 `Boss._kickMs`，身體往前一頓，110ms 衰減）。
- 驗證：自動測試逐把按＝3 把全折射、0 傷；只按一次＝折射 2 把、第三把中彈；不按＝中彈。smoke ok。

**v0.8.73 規則：程式變形只做輕微幅度**（使用者決定，已寫進 CLAUDE.md 分工）：要動作變大／強化一律生關鍵格。第 2 關飛劍 `dfm` 改回原本輕微值，`kick` 減半保留；已給「飛劍關鍵格」6 格提示詞（蓄勢、一劍劍指、二劍扇掃、三劍反手指、收勢、垂落飛劍舉天），圖到後每射一把換一格（`spawnProjectiles` 依序換 frame）。

**v0.8.74 外部 skill 評估＋音樂閃避（第 1 關測試）**：讀了 gamedev-skills/awesome-gamedev-agent-skills（Apache-2.0）的 game-feel、camera-systems、input-systems、audio-design。結論：本作已做到大部分（trauma² 平滑噪聲震屏、依傷害的頓幀、震屏／頓幀設定滑桿、輸入緩衝、音效多版本＋音高抖動＋同音上限＋總線限幅器），引擎相關範例（Godot／Unity）不適用，**不放進 repo**。唯一明顯缺口是「音樂閃避」：`Music.duck(level, sec)`＋`duckTarget()`，處決時壓到 40%（1.3 秒），Boss 大招壓暗時依 `ultDim` 壓到 60%；獨立倍率不改玩家音量；壓下快、回復慢。**目前只在第 1 關生效**（`duckTarget` 內 `Boss.stageId !== 1` 判斷），使用者實測覺得好再拿掉判斷全關開啟。

**v0.8.75 第 2 關飛劍關鍵格**：生圖 2×3 → `tools/keyposes.py … 0.677 auto`（縮放依收勢格對齊站姿高 490）→ `assets/boss2/35_fs_wind`（扇舉過頭蓄勢）、`36_fs_1`（劍指）、`37_fs_2`（扇掃；左手多的劍已於 v0.8.76 擦掉）、`38_fs_3`（轉身反手指）、`39_fs_rec`（收扇）、`40_sky_cast`（雙手舉天）。`flyswords.frames.active` 為三格陣列（依進度三等分，對準 0.38 秒間隔）；`sky_swords` 前搖／出手用 40、收招 39。

**v0.8.76 擦掉 `37_fs_2` 左手多出的劍**（劍身沿線遮罩去掉、劍柄兩端補成袖子／衣袍色）。
**交接備註**：使用者新增 skill `mochen-action-combat`（墨塵傳 Boss 招式、招架架勢、判定、無敵幀、定格震屏、輸入、鏡頭的設計／實作／手感／審查），之後做這些時先載入。

**v0.8.77 音樂閃避全關開啟**（使用者決定）：`duckTarget` 拿掉 `Boss.stageId !== 1` 判斷。使用者實測回報：第 2、3 關音效／配樂聽不出問題；第 2 關飛劍逐把彈「應該可以」；開場影片效果還行；難度感受：第 2 關比第 1 關簡單、第 3 關有難度、第 5 關小狼攻擊動作不夠明顯。

**v0.8.78 數值：第 2 關折射減量、第 5 關小狼起手拉長**（使用者同意）
- 折射傷害改成每關可設 `Stages[n].reflectDmg = [氣血, 架勢]`（預設 [110, 14]，`51_physics.js`）；第 2 關 [70, 10]：三把都彈得到後一輪原本送 330 血＋42% 架勢，太多（使用者：第 2 關比第 1 關簡單）。
- 第 5 關小狼起手（使用者：攻擊動作不夠明顯；規則：開場招 ≥0.35 秒）：幽影撕咬 0.26→0.40、連環撕咬 0.30→0.38、血爪三連 0.38→0.42。
- 第 3 關「有難度」＝排第三合理，不調。
- 第 5 關美術補強：提示詞已給，圖已於 v0.8.79 接入。

**v0.8.79 第 5 關美術補強（大小狼全招式關鍵格＋大狼倒地＋分層場景）**
- 小狼生圖 4×5 → `assets/boss5/40～59`（縮放 0.77，對齊舊站姿寬度）：撕咬 `40_sb_wind／41_sb_open／42_sb_snap／43_sb_rec`、血爪 `44_sc_rear／45_sc_a／46_sc_b／47_sc_rec`、疾撲 `48_sp_coil／49_sp_rise／50_sp_dive／51_sp_land`、【危】狂暴衝撲 `52_sr_tell`（壓低豎毛）`／53_sr_dart`、幽影閃 `55_ss_hit`、【危】甩尾 `56_st_wind／57_st_spin／58_st_rec`、長嘯 `59_s_howl`（嗜血狂亂與蛻變前搖）；`54_sr_skid` 是回頭姿勢，未使用。
- 大狼生圖 4×5 → `assets/boss5b/40～59`（縮放 1.075）：巨爪 `40_bw_wind／41_bw_mid／42_bw_follow／43_bw_rec`、地面連錘 `44_bs_up／45_bs_down／46_bs_up2／47_bs_rec`、躍壓 `48_bl_crouch／49_bl_fly／50_bl_dive／51_bl_land`、【危】噬魂 `52_bb_tell／53_bb_snap`、衝撞 `54_bc_wind／55_bc_run`、咆哮 `56_b_howl`、白骨刺陣 `57_b_summon`、【危】魔尾 `58_bt_wind／59_bt_spin`。第 4 列兩隻狼在原圖相碰，切圖前在 x=1380 畫洋紅線分開。
- 蛻變 `transform`：前搖 `59_s_howl`（小狼資料夾）→ active 起點換大狼 `56_b_howl`；咆哮前搖用舊 `07_windup`、白骨刺陣前搖用舊 `14_cast`（避免與噬魂的張口前搖混淆）。
- 大狼倒地 `17_kneel／18_fall／19_lie` 重生（`tools/fall3.py … 0.5`），原本畫風不一致。
- 分層場景：`assets/bg/arena5_ground.webp`（Gemini 上緣米白石板帶太像人行道，已依土色重新上色、左右 80px 交叉淡化接縫）、`arena5_fg.webp`（四簇：枯棘、破車輪、傾斜石碑、枯草；去掉一團紫色殘影與碎片）；`S5.layers` 參數同第 2 關。
- 切圖腳本（未入庫）：以全圖元件依中心點分格（避免逐格切會切掉跨格的耳朵／尾巴），再用 keyposes 的 `render` 對齊腳底 y=560。
- 驗證：check 0 錯誤；逐招三拍截圖確認；直接觸發二階段確認蛻變與大狼招式正常；smoke 第 5 關 ok。待使用者手機實測（小狼動作是否夠明顯、第 5 關難度）。

**v0.8.80 依戰鬥規範補齊起手下限**（mochen-action-combat 規範自動檢查九關後修正，使用者同意）
- 第 1 關 神衛連戟・穿雲 `slash2` 0.32→0.36。
- 第 3 關 疾風雙劍斬 `slash1` 0.28→0.36、旋風刃 `slash2` 0.32→0.36、【危】突刺 `thrust_peril` 0.58→0.60。
- 第 5 關【危】狂暴衝撲 `s_rush` 0.50→0.60、【危】甩尾 `s_tail` 0.52→0.60。
- 檢查結果其他項：第 2 關程式變形乘 `dfmK 0.5` 後在輕微範圍內；第 1、2、3、5 關危招都有 `perilType`。
- 已補（v0.8.81）：第 1 關 7 招（穿雲 `slash2`、斷雲連戟 `exclusive_combo`、遲刃 `combo_delay`、擲戈 `halberd_throw`、震戟 `shock_push`、衝鋒 `charge_rush`、影遁斬 `shadow_strike`）4×5；第 2 關 3 招（八荒罡風陣 `exclusive_zone`、【危】千幻雷劫陣 `grab_peril`、鏡影分身 `mirror_split`）＋雙襲第二擊 3×4。

**v0.8.81 第 1、2 關補齊招式關鍵格**
- 第 1 關（生圖 4×5，縮放 1.13 對齊 v0.8.46 關鍵格）→ `assets/boss1/36～55`：穿雲 `36_tq_*`、斷雲連戟 `39_cb_wind／40_cb_h1／41_cb_h2／42_cb_rec`、遲刃停頓 `43_dl_hold`＋重劈 `44_dl_hit`、擲戈 `45_tw_wind／46_tw_rel（空手）／47_tw_catch`、震戟 `48_sp_*`、衝鋒 `51_ch_wind／52_ch_run／53_ch_stop`、影遁 `54_sh_vanish（無戟、轉身）／55_sh_strike`。`combo_delay` active＝[h1, h2, 停頓, 重劈, 重劈]（第三刀前定在高舉）；`rage_chain` 也改用連戟格。
- 第 2 關（生圖 3×4 兩版；第 1 版取第 1、3 列與第 4 列，第 2 版取第 2 列；第 2 版低掃格畫了兩把扇子不用）→ `assets/boss2/41～52`：罡風陣 `41～43_zone_*`、【危】雷劫陣 `44_grab_tell（舉扇結印）／45_grab_hit／46_grab_rec`、鏡影分身 `47～49_mir_*`、雙襲 active＝[`33_tp_hit`, `50_tc_back`, `51_tc_low`]、收招 `52_tc_rec`。兩版第 2 列第 1 格的扇子碰到上一列衣襬，切圖前在兩列間插 40px 洋紅；`50／51` 擦掉殘影（仍有極淡細線）。
- 驗證：check 0 錯誤；逐招截圖；smoke 第 1、2 關 ok。九關「出招池」除移動招（衝步、後撤）外，第 1、2、3、5 關全部招式都有生圖關鍵格。

**v0.8.82 第 5 關第二張專屬特效圖＋小狼放大**
- `assets/fx/wolf2.webp`（生圖 4×4 黑底 → 每格 256；列 0 甩尾魂焰弧〔原為直立新月，處理時逆時針轉 90° 成碗形，左右鏡像不變〕、列 1 錘地震波、列 2 白骨刺〔0 刺尖冒出，1～3 循環〕、列 3 落地衝擊）。
- 接法：`s_tail`／`b_tail` fxAct 改 `wolf2` 列 0（`h` 壓扁成貼地弧）；`b_stomp` fxHit 改列 1；白骨刺陣 `S5.zoneArt = { bone: ["wolf2", 2, "up"] }`（引擎新增 `"up"`：直立物腳底貼地，預警只露刺尖，爆發後 1～3 循環）；躍擊落地 `S5.landArt = ["wolf2", 3]`（引擎：`fxLand` 有 `landArt` 時改用關卡專屬圖，w 600、alpha 0.7，原 760／0.9 太亮會把大狼洗白）。第 5 關不再借用通用 `land` 特效。
- 小狼 `spriteScale` 0.64→0.72（`hurtHalf` 40→45、`bodyW` 150→165），`transformGrow` 3.0→2.67 讓蛻變終點大小不變（使用者決定）。
- 驗證：check 0 錯誤；逐招截圖；smoke 第 5 關 ok。

**v0.8.83 M3 第 4 關萬劍古靈 ②灰盒＋部位 Boss 引擎**（方塊版，待使用者手機打「好玩嗎？」）
- 新檔 `src/53_parts.js`（manifest 在 52 之後）：`Stages[n].parts` 有設定的關卡由 `partsInit` 建 `Boss._pp`。一階段：`updateBossAI` 開頭 `partsUpdate` 接管；主角地面／空中攻擊只判部位（`partsTryHit`，蓄力斬優先判封印、普攻優先判手）；折射飛劍打回巨手（`partsReflectHit`）；`damageBossPosture` 改加在最近的巨手（`partsPosture`）；`aimX` 面向最近可打部位；跳躍不會踩頭；Boss.state／moveType（`p_<招>`）／isPerilous 每幀同步（HUD 危字、smoke）。血條改顯示封印 ●●●、架勢條顯示巨手架勢（`partsHUD`）。傷害：可招架／危招經 `partStrike`→`resolveBossStrike`（暫把 Boss 位置換成部位），不可招架經 `partHitPlayer`→`takeDamage`（瞬步無敵可躲）。
- 一階段招式（`S4.parts.moves`，秒數即實際值）：天劍斬落（前搖 1.0、追蹤到 70%、地面紅線、傷 260；插地 2 秒露封印，只有蓄力斬斬得斷，普攻「鏗」＋提示）、【危】橫掃千軍（前搖 0.8、貼地掃 1500px、跳過、傷 280）、巨掌壓落（前搖 1.1、手影變大、傷 220；落地停 1 秒可砍手）、指劍三連（前搖 0.6、三道劍氣間隔 0.4、可逐把招架折射打手）、萬劍歸宗（三波各 5 個紅圈、預警 0.8、傷 140）、【危】巨手擒拿（前搖 0.85、橫抓 1300px、瞬步側閃、傷 300）。出招池權重 26/16/20/16/10/12，同招不連出 3 次，連 3 招沒天劍斬落必出。
- 巨手架勢（砍 12、重擊／下劈 18、蓄力 30、折射 15，3 秒後每秒 −8）滿 100 → 巨手崩勢 3.6 秒＋「古靈失衡」巨劍插地 3 秒（白送一次封印機會）。
- 第三道封印斷 → 巨劍崩碎、書法橫幅「巨劍崩碎／劍魂現世」、慢動作、主角無敵 3.2 秒、核心從古靈胸口降下（2.8 秒）→ 二階段：一般 Boss AI（核心血 2400、架勢 120），招式 劍魂・驚鴻、環劍旋斬（三連）、【危】核心突進（看破）、繞身飛劍（間隔 0.4）、萬劍歸宗・疾（`partsCall` 交給部位引擎，每波 4 圈、間隔 0.55、預警 0.65）；兩側巨手每 7～10 秒在核心沒出招時壓掌一次（傷 180）。`S4.execKill`：二階段架勢滿處決＝擊敗（`performExecution`）。
- 鏡頭 `S4.camZoomP = {1: 0.85, 2: 0.92}`（`updateCamera` 通用欄位）。
- 驗證：check 0 錯誤；smoke 九關 ok（第 4 關另跑 3×30 秒）；無頭逐招測試：天劍斬落站著中 260、普攻封印不斷、蓄力斬斷；巨掌站著中、落地砍手加架勢；橫掃跳起 0 傷／站著中；擒拿瞬步 0 傷／站著中；指劍逐把招架 0 傷且手加架勢；劍雨站著吃三波；巨手崩勢→插地；三道封印斷→轉場→二階段 5 招＋側掌輪替；架勢滿→處決→血 0→結算對白。真實按鍵「按住 J 0.65 秒」連斷三道封印正常；二階段亂數對打 30 秒無卡住。
- （v0.8.84 已修）canvas 字型字串原本用 `var(--font-serif)`（canvas 不認 CSS 變數，全退回 10px）。

**v0.8.84 畫面字型修正＋危字移到頭頂**（使用者看截圖確認）
- 全部 canvas 字型（浮字、危、決、煞氣預警、處決大字備用、開場字、舊劇情）改用實際字型名 `'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`，字回到原設定大小（字級數字未改）。HTML 裡的 `var(--font-serif)` 不受影響。
- 「危」字：有動作表的 Boss 改放在圖上頭頂上方 28px（`opaqueTop` 掃當格最上緣不透明列、快取在圖上；`Boss._headY` 平滑避免換格跳動，`loadStage` 清空）；沒有動作表的 Boss 維持原位置。
- 待觀察：浮字變清楚後畫面字變多，若覺得吵再減量。

**v0.8.140 古靈降臨補 4 張專屬關鍵格（使用者：補完再做第 5 關）**：Gemini 洋紅底 2×2（參考圖 `ref_b4_idle`＝古靈 idle 單格），`tools/sheet.py` `band_cells(cols=2,rows=2)` 去背；以 idle 身高 490 對齊（縮放 0.502，腳底 y=558、腳中心 x=450）→ `assets/boss4s/51_desc_a`（單膝跪、劍尖點地）／`52_desc_b`（半起身、袍髮上揚）／`53_desc_c`（睜眼劍指、袍袖飄起）／`54_desc_d`（站定）；`S4.spriteExtras` 預載；`drawDescendWorld` 依 `u` 在 0.26／0.5／0.76 切四格（沒載到退回舊 `17_kneel／14_cast／01_idle1` 三格）。截圖確認：剪影蜷伏→半起→睜眼劍指→站定，與 idle 同大小。

**v0.8.141 第 5 關導演登場／二階段／新招／招架光圈**：新特效圖（黑底，`tools/fx_black.py` 處理）`assets/fx/boss5intro`（0 狼眼、1 爪痕、2 狼影消失、3 狼影現身）、`boss5morph`（0 裂紋、1 剝落血肉、2 骨架魔焰、3 重生爆焰）、`boss5flame`（0 吐息、1 地面火毯、2 預警紅線、3 殘像）、`cue`（0 黃／1 紅／2 藍收縮光圈、3 完美招架閃）。`DIR_CFG[5]`：登場 `kind:"wolf"`（暮色壓暗→三對狼眼→爪痕劃過→小狼疾衝滑入煞停→蹲伏→名牌「第五難」）、二階段 `kind:"morph"`（長嚎→裂紋→血肉剝落→骨架竄魔焰→爆焰重生換大狼＋震飛，取代 `transform` 招式；`onBossPhase2` 偵測到導演就不再觸發）。新招：`s_decoy` 幽影殘像（一階段，原地留殘影、真身繞背，用 `fxVanish` 陣列）、`b_breath` 魔焰吐息（二階段，前搖 `fxWind` 紅線＋地面火毯 hazard zone `flame`，玩家離地即免傷，`zoneWarn` 可設預警秒數）。`S5.cueArt`：出招前 0.17 秒在攻擊點收縮光圈（黃可擋／紅危／藍霸體，`Boss._cueDone`）。待辦：光圈提示音（請使用者找短音效）、其他關是否也開 `cueArt`、蓄力姿勢盤點補關鍵格。

**v0.8.142 第 5 關回饋修正**：①`cueArt` 的關卡改由生圖光圈取代舊 `mark` 光圈（`drawThreatMarker` 整段前搖由大縮小，只剩一個；出招瞬間補第 4 格迸發）。②現身剪影 `boss5intro` 列 3 沒鏡像造成一瞬間朝右 → 生成特效圖一律圖朝右，生成時必帶 `facing`。③登場前 Boss 不可站在場上：`80_flow.js` 的 `_introHide` 清單要含該關導演登場 kind（已加 `wolf`；**之後每關新增導演登場都要加進這份清單**）。④二階段蛻變：先低頭（07_windup），0.9 秒起一直抬頭（59_s_howl）不再甩頭，同時緩慢由 1 倍放大到 1.5，骨架接著 1.5→1.8 倍。

**v0.8.143 招架光圈對齊判定＋蛻變改「血肉燃燒」**：①原先生圖光圈用 `p=前搖進度`，和判定時間不同步；改在 `drawBossEntity` 的 C4 區塊，以 `Boss.nextImpactIn`（命中前 0.35 秒、到 0＝命中，與程式光圈同源）驅動，環徑 240→60 連續縮小（依各格環大小換算），≤0.05 秒換第 4 格迸發；`cueArt` 關卡不再畫程式光圈與星芒，`drawThreatMarker` 只留提示文字。②二階段拿掉骨架：低頭→抬頭變大＋裂紋→`Boss` 隱藏、改畫逐格溶解的狼身（離屏畫布、由尾到頭、邊緣泛橘）＋血肉片／火焰 `boss5morph` 列 1 沿身噴出→魔焰柱（列 3 第 2 格）竄起→爆焰換大狼。`boss5morph` 列 2（骨架）暫不使用。

**v0.8.144 魔焰獸玉（大狼噴火大招，取代舊吐息）＋移除白骨刺陣**：新圖 `assets/boss5b/60_br_crouch／61_br_coil／62_br_fire／63_br_rec`（洋紅底 2×2，同比例縮到與 idle 同高、質心對 x=450、腳底 y=560）、`assets/fx/boss5beam.webp`（0 魔焰球凝聚、1 滿蓄力脈動〔未用〕、2 火柱循環、3 火柱收尾）。`b_breath`：前搖 1.5（壓低→後縮，後縮時嘴裡凝出魔焰球 `move.beam.orb*`）→ 噴射 1.1（火柱從嘴部 `beam.mx/my` 射出，一個 `hazardZone`：`zoneDx` 偏移、`zoneTall` 不看高度、`zoneNoDraw`）→ 收招 1.1 破綻。判定區從嘴前方往前 1500px，嘴後方（狼身、狼背後）安全；瞬步一次約 290px 可穿到狼身位置（測試：從 420px 外前搖中瞬步，零傷害；站著吃 3 跳約 380 傷）。噴射期間 `Boss._beamOn`：畫面持續微晃（trauma 下限 0.3）、手機每 0.2 秒低強度震動，剩 0.42 秒換收尾火柱。招式可設 `hintText`／`hintKey` 自訂首次提示。移除 `b_bone` 出現（資料仍在）。

**v0.8.145 左右移動鍵整體右移**：`.dpad-cluster` margin-left -14px → 42px（右移 56px＝半個鍵寬加縫隙，左鍵中心落在原本兩鍵的中間縫隙）；844×390 截圖確認，兩鍵未碰到其他按鈕。

**v0.8.146 魔焰獸玉加強（第一步，等新圖）**：火柱高度 760→1250；前搖 1.5→2.3 秒，魔焰球提早到 22% 出現；蓄力期間畫面壓暗、只留球周圍亮（`Boss._cd`、`60_render` 放射漸層）；火星 `boss5morph` 列 1 第 4 格由四面向球心收集。待新圖：`prompts5/7_boss5b_breath_keys2.txt`（6 格關鍵格：更低壓低、兩段蓄力、最大後縮、嘴張更大的噴射與震動格）、`prompts5/8_boss5charge.txt`（收集光點、繞球光圈、噴口爆發、翻騰魔焰煙團）；到圖後接進 `b_breath` 的 frames、噴射前 0.25 秒放繞球光圈、噴口爆發、火柱外覆煙團。

**v0.8.147 魔焰獸玉接入新圖**：新關鍵格 `assets/boss5b/64_br_deep（壓到最低）／65_br_g1／66_br_g2（兩段蓄力）／67_br_coil2（最大後縮、頭後仰、嘴開最大）／68_br_lunge／69_br_fire2／70_br_fire3（噴射、抖動交替）`（Gemini 一張不規則 7 格：用固定矩形裁切＋`strip_lines`，縮放以 g2 對舊 coil 高度換算＝0.7086，質心對 x=450、腳底 y=560；裁切腳本不入庫，要重做就依 HANDOFF 這段重寫）、`assets/fx/boss5charge.webp`（0 收集光點、1 繞球光圈、2 噴口爆發、3 翻騰魔焰煙團；`tools/fx_black.py` 第 3 參數可對指定列加大邊緣淡出，煙團列用 `3:70`）。`b_breath`：前搖 4 格（deep→g1→g2→coil2），魔焰球在 28% 起跟著各格嘴部座標（`beam.mouthW`／`mouthA`，`beamMouth()`）、球心疊收集光點（取代程式火星）、噴射前 0.3 秒光圈繞球、噴射 6 格（lunge→fire2/fire3 交替抖動），噴口爆發＋火柱外覆三團煙團（alpha 0.5）。壓暗聚焦仍是程式放射漸層（備案）。

**v0.8.148 交接整理**：CLAUDE.md 全面改寫（開工順序、改版流程、工作偏好 7「實作前先建議模型」、素材處理工具、招式欄位速查、Playwright 測試做法）；HANDOFF.md 新增第〇節現況總覽；新增 `tools/cut_keys.py`；`implementer` 子代理移除過時的手動 ASSET_VER 規則。遊戲內容未變。

**v0.8.149 魔焰獸玉噴久一點（使用者：硬抗沒扣多少血、不夠久不夠震撼，多噴約 2 秒）**：`active` 1.1→4.2（實際＝4.2×0.82 二階段×0.78 volume≈2.7 秒，原本 0.7 秒）、`zoneDuration` 2.65 對齊噴射時間、`zoneDamagePerSec` 420→260（持續越久傷害越高，總量控制在滿血 1000 約扣 700）、噴射關鍵格交替 6→12 格（維持抖動節奏）。測試：站著硬吃 1000→298。注意：`Stages[n].volume` 會再壓縮招式時間，算實際秒數要乘 `volSpeedMod`。

**v0.8.150 魔焰獸玉改「血量剩一半必放一次」**（使用者：打贏了都沒放過）：新機制 `Stages[n].hpTriggers=[{move, at:血量比例, phase:最低階段, stance:姿態}]`，`updateBossAI` 在閒置／接近時檢查，達標且該場還沒放過就立刻放（`Boss._hpt[move]`，`loadStage` 重置，重打會再放一次）；之後恢復一般招式池（`b_breath` 仍在池中）。第 5 關：`{move:"b_breath", at:0.5, phase:2, stance:"B"}`。測試：二階段把血量壓到 49%，當前招式結束後下一招即為魔焰獸玉。

**v0.8.185 通關回響封存（使用者）**：`ECHOES_FROZEN=true`（`22_mirror.js`）；讀檔時 `Progress.echoes` 一律清空（舊存檔的回響也不生效）、通關不再新增；所有 `echoes.includes(11～14)` 的效果因此失效（範圍 +8%、劍勢回復 +30%、窗口 +20ms、連段 +10%）。程式保留。第 5～8 關結算的「解鎖」文字（原本寫心印／回響）改成中性戰果句，劇情重寫時再定。主角性能現在固定：招架 150ms、普攻不扣劍勢、架勢 ×2 基準。

**v0.8.186 Gemini 第二輪評估核對後的修正＋主角移動手感（2026-11-14；全部待使用者手機實測）**
- 來源：Gemini 第二輪報告 11 項，Claude 逐項對照原始碼確認後，修純 bug 與使用者同意的方向；設計提案（第 6～9 關調整、架勢倍率 ×2→×1.6、心魔強化、普攻判定延後 0.06 秒）**未做**，等灰盒實測。
- **彈刀反擊啞火**（`50_boss_ai.js` 新增 `pickCounterMove(stage)`；`51_physics.js` Boss 擋第三刀處改呼叫它）：原本寫死 `slash1`／`thrust_peril`，第 5、7、8、9 關沒有這兩招（Boss 彈完不反擊）、第 6 關只有 35% 會反擊、第 3 關重劍姿態會用到雙劍的圖。現在：關卡或姿態可設 `counter:[招式鍵]`；沒設時，無姿態的關與第 3 關雙劍沿用舊規則，其餘從目前姿態招式池挑前搖最短的近戰招（實測結果：3B `heavy_slash`、5A `s_bite2`、5B `b_stomp`、6 `claw`、7A `a_combo`、7B 玄武不反擊、8A `a_slash`、8B `b_combo`、8C `c_smite`、9 `counter_slash`）。
- **連段最後一刀被吃掉**（`updateBossAI`）：active 被階段 0.82／卷數 0.78、0.64 壓短，但出刀間隔沒縮 → 第 4 關環劍旋斬、第 8 關三絕劍・遲刃與魔爪四連、第 9 關青雲斬三連的最後一刀出不來。改成 active 至少撐到最後一刀後 0.08 秒，且還有刀沒出就不收招。**`volSpeedMod` 保留沒移除**（移除會讓第 4～9 關所有招變慢 22～36%）。
- **血見底收尾**（`damageBossPosture`）：一般收招（recover）中普攻只能把架勢推到 95%；大招喘息、擊落、定身仍可推滿。（原本一輪普攻就補滿最後 20%，不用防守。）
- **招架連按誤罰**（`doParry`）：連按判定 500ms → `Config.guardStanceMs`（360ms）；折射飛劍成功也清 `_lastParryPress`。倍率 `PARRY_SPAM_K` 沒動。
- **蓄力斬**：被 Boss 彈刀時取消蓄力並 `atkCd ≥ 0.35`；這一下只是進輸入緩衝時不開始蓄力（`Player._atkBuffered`）。
- **蓄力斬教學**：`Stages[2].unlockText` 改寫成解鎖蓄力斬；第 3 關起第一次遇到霸體招出 `hintOnce("armor_charge")`。
- **魔焰獸玉硬接**（`51_physics.js` hazardZones）：改成第一次碰到火柱那一刻判定（原本只判噴出第一幀）。硬接後仍持續受 25% 灼傷，沒改。
- **第 7 關冰柱** `S7.reflectDmg` [60,22] → [60,11]（架勢基準 ×2 後才是原設計的約 7 發）。
- **主角移動手感**（`40_player.js` 新常數 `MOVE = {speed 580, accel 8500, decel 7500, turnK 2.6, airAccel 5200, airDecel 2600, jumpBufMs 130, coyoteMs 90}`；`51_physics.js` 水平移動）：瞬間 0→580 改成短加速（實測約 0.07 秒到全速）、放開約 0.09 秒煞停（滑約 15px）、轉身約 0.1 秒；空中有一點慣性；左右同時按以後按的為準（`Keys.last`）；兩段跳用完下落時按跳，落地立刻起跳；有平台的關卡離開邊緣 0.09 秒內仍可起跳。**沒改跳躍高度、重力、瞬步、最高速度**（危招跳躍判定不受影響）。全是程式數值，沒有程式畫的美術。
- 驗證：check.js 0 錯誤；無頭測試確認各關反擊招存在、第 8／9 關連段出滿、移動數值如上；smoke 見 commit。**手感（起步、煞停、轉身、空中慣性）本機驗不了，請手機實測；不喜歡可調 `MOVE`，把 accel／decel 設很大就等於改回原本。**
- 之後要更滑順只能靠美術：主角「起跑、煞停、轉身」各 1～2 格關鍵格（待使用者同意後給提示詞）。


**v0.8.184 使用者拍板（Gemini 評估後續）**
- **心印系統封存**：`SEALS_FROZEN=true`（`22_mirror.js`），`equippedSeals` 預設改空、營地「心印參悟」分頁隱藏；程式全部保留，改回 false 即恢復。原預設問心印的**架勢 ×2 併入基準**（`damageBossPosture`、`53_parts` 巨手架勢），所以封存後招架累積架勢的手感不變。
- **大招次佳解**（`ultHardBlock`，`57_gult.js`）：原本「只能瞬步／跳／走開」的段落，**完美招架＝硬接**：只受 25% 傷害（`zoneDamage`，不硬直）、震退、扣劍勢 25，沒有任何獎勵；正解仍是唯一能換破綻／架勢的方法。套用：第 1 關高火牆、第 2 關落劍、第 3 關玄鐵飛劍、第 5 關魔焰獸玉（火柱噴出瞬間完美招架＝整段只吃 25%）、第 6 關血爆、灰盒大招所有紅圈／紅牆／貼地紅帶（含第 7 關玄武踩踏）。寒川十字在 v0.8.183 已做。測試：第 1 關高火牆 380→95、心魔紅圈 200→63。
- **維持不改**：右手按鍵（玄天珠保留，使用者覺得帥）、戰場寬度、第 4 關流程、第 5 關血量、大狼地面可砍軀幹＋跳劈砍頭有額外架勢。
- **通關回響**（`Progress.echoes`，打過第 5～8 關各得一個被動，存 `qingyun_echoes`）：11 攻擊範圍 +8%、12 劍勢回復 +30%、13 招架窗口 +20ms、14 連段傷害 +10%。要不要也封存待使用者決定（Claude 建議封存：13 會讓後段窗口變 170，和「全關統一 150」衝突）。

**v0.8.183 手感底層修正（Gemini 顧問評估；Claude 逐條對原始碼查證後提 8 項，使用者說「做」）**
1. **招架窗口全關統一 150ms**：`getStageParryBonus` 固定 +20（原第 1～3 關 +40、4～6 關 +20、7～9 關 0）。**另外發現**：問心印 `wenxin` 是**預設裝備**（`22_mirror.js` `equippedSeals:["wenxin"]`），原本把窗口 ×0.7，等於所有玩家實際只有 119／105／91ms；這次拿掉問心印的縮窗口（保留架勢 ×2），實際就是 150ms。心印系統要不要封存仍待使用者決定。
2. **普攻、空中攻擊不扣劍勢**（原 15／12；劍勢不足也照樣能砍）。限制連按交給既有的「Boss 格擋第三刀完美彈刀＋扣主角 20 劍勢」。蓄力斬仍扣 25；瞬步 20、普通格擋 28 不變。
3. **招架無冷卻**（原 `parryCooldown` 0.55＞姿勢 0.36，普通格擋後有 0.19 秒按不出來）：改隻狼式 `PARRY_SPAM_K=[1,0.47,0.23]`——0.5 秒內重按，完美窗口 150→70→35ms；完美招架或折射成功歸零。
4. **血見底不再卡死**：`damageBossPosture` 血見底時，Boss 在 `recover`／`_ultRest`／`grounded`／`frozen` 中被攻擊，可以推架勢（半量、不受 60% 上限）；其他時候仍只有防守類能補。
5. **架勢條**：高 6→8px、60% 刻度（從中間長，所以在 20%／80%）、攻擊卡在上限時刻度閃白＋條變灰 0.22 秒（`Boss._capFlash`）、血見底整條赤紅快脈衝（`.hpout`）。已截圖確認。
6. **寒川十字**：完美招架＝不扣血（震退、扣劍勢 30、無架勢獎勵、首次提示「蓄力斬劈碎更好」）；慢了才算格擋 200；蓄力斬劈碎不變。
7. **魔焰獸玉**：大狼背後離牆不到 350 時，先 `dash_in` 衝向場中再放（測試：x 200→485）。
8. **第 1 關減法**：`noReader`（不讀玩家習慣加權）、`rageP2Only`（怒氣連戟只在二階段）；一階段池只留 劈、二連、三連、【危】突刺、【危】橫掃、躍斬、衝步接二連；遲刃、擲戈、震退、後撤、衝鋒等全部移到二階段。
- 驗證（無頭）：第 1／4／7 關窗口都是 150；連按 150→71→35→（隔 0.7 秒）150；連按兩次都能進招架姿勢；劍勢 10 時仍能普攻且不扣；血見底待機時攻擊架勢不動、收招時 +10（半量）；寒川十字完美招架 0 傷害、太早按吃 350；第 1 關池子正確；九關 smoke 七次中六次全過、第一次有一關 FAIL，之後六次都沒重現（smoke 是亂數對打，當時沒留下是哪一關）。**沒驗證**：手感（連按懲罰會不會太重、150ms 在手機上的感覺）。
- **待使用者決定**（Gemini 建議、Claude 暫不動）：右手 6 鍵減 4 鍵（玄天珠改被動、回生酒移血條旁）、封存心印／通關回響、戰場寬度 3200→2000、第 4 關縮短、第 5 關降血、每招大招加「完美招架保命」次佳解、大狼地面能不能砍。Claude 不同意的：第 2 關角力改節奏彈刀、龍捲時停改慢動作（兩者都是使用者先前要求的）。

**第 7 關生圖提示詞（2026-11-12，遊戲內容未變）**：`prompts7/` 共 13 份（全部過 `check_prompt.py`）：1 天將 16 格動作表（無參考圖，定角色設計）→ 2 天將關鍵格 12 格（附 1 的單格）→ 3 天將特效（鐧弧、金光盾四態、天雷、盾衝金牆）→ 4 玄武身體（無腳頭尾，正常／疲憊兩格）→ 5 玄武腳 8 格（前腳／後腳 × 抬起、踩下、踩下裂、抬起裂）→ 6 頭頸尾 12 格（頭：俯視、吐冰、咬、垂首、受擊、吼；頸段 2；尾：平常、高舉、橫掃、癱軟）→ 7 玄武特效（冰柱飛行、冰碎、水柱、冰息蓄力）→ 8 玄武特效 2（踩地衝擊、尾掃水浪、咬合、裂痕爆開）→ 9 背景（天門玉台，21:9，中央留空）→ 10 地面帶＋4 個前景物 → 11 書法名牌兩行 → 12 天將半身像兩表情（附 1 的單格）→ 13 導演特效（金光柱、金環、水柱爆發、水光匯聚）。天將設計：金甲、雲翼盔、右手金鐧、左臂日雲紋圓盾（面向右時盾在前）。玄武：頭尾為蛇形（玄武龜蛇合體），身體面向右、尾在左。

**v0.8.182 玄武改超大型部位戰（`src/58_colossus.js`；使用者 2026-11-11 設計卡，Claude 補四點後使用者說「做」）**
- **設計卡**：玄武身體蓋住半個背景、不可打；**Boss 物件＝頭**，平常浮在主角斜上方俯視（離地 300、打不到、`_introHide`＋`_ultAir`）。循環：等牠出手 → **腳踩下來停 2.4 秒** → 砍腳（扣血＋少量架勢；每隻砍 3 下（蓄力斬 1 下）＝裂）→ **四腳都裂＝倒地 7.5 秒**：身體趴低、龜殼變平台（高 215，二段跳上得去）→ 跑到左端尾巴旁砍（主要輸出）。**架勢**主要靠招架：折射冰柱（每發氣血 60、架勢 22，`reflectDmg`）、完美招架噬咬（+32）；砍腳砍尾屬攻擊類最多加到 60% → 架勢滿＝**頭落地 5 秒**（Boss 方塊出現在主角旁 230）→ 走一般處決流程（扣 30%；血見底後的處決＝擊殺）。
- **Claude 補的四點（使用者同意）**：①兩條進度分工如上；②踩踏用「離主角最近、還沒裂、搆得到（±400）的腳」，裂過的腳變色有裂紋，玩家要走位去引沒裂的腳；③龜殼平常上不去，倒地才變平台（v0.8.181 的浮石、漲潮、甩殼、硬殼規則已停用，平台系統保留）；④頭會出招（冰柱、噬咬）。
- **招式**（`Stages[7].colossus`）：踩踏（紅圈追蹤到 0.35 秒前、前搖 1.0、220）；蛇尾橫掃全場（貼地紅帶、前搖 1.1、240、跳）；冰柱三連（前搖 0.7、間隔 0.55、110、可折射，折射後自動導向頭部）；噬咬（黃圈、前搖 0.95、230、可招架）。選招：踩踏權重最高、同招不連出、每 3 招沒放冰柱就大幅提高冰柱權重；出招間隔 0.9 秒。
- **傷害表** `[氣血, 架勢, 裂痕]`：砍腳 普攻 22/4/1、第三劍 34/6/1.5、蓄力 90/14/3；砍尾 普攻 55/5、第三劍 85/8、蓄力 320/22。二階段血 3240。
- **招牌大招「玄冥噴泉」改版**：水柱來回兩趟找空格（150）→ 四隻腳連環踩踏（間隔 0.7、150）→ **四足齊落不動 3 秒，全部可砍**（裂痕照算，可直接打出倒地）。半血必放一次。
- **做法**：`xwTick`（`mechTick` 呼叫：腳計時、倒地、頭的姿態、冰柱導向）＋`xwAI`（`updateBossAI` 在 `ultUpdate` 之後呼叫，接管出招；頭落地時交回一般流程）；主角出刀先判 `xwTryHit`；`aimX`→`xwAimX`；繪製 `drawXwBack`（身體、腳、尾）／`drawXwFront`（頸、頭）。鏡頭 `camZoomP[2]=0.72`。姿態 B 只留佔位招 `b_wait`；舊的 `b_*` 招式資料留著沒用到。
- 驗證（無頭）：一階段處決 → 進二階段自動啟動玄武；踩踏／噬咬／冰柱都會出；砍三下裂一足、四足裂＝倒地、龜殼平台可站、砍尾 55；冰柱三發全折射＝架勢 +64；架勢滿 → 頭落地 → 處決 −972（30%）→ 頭升回；血見底＋處決＝擊敗；大招跑完無錯誤；九關 smoke 全過。**沒驗證**：手感、2.4 秒夠不夠砍三下（含跑過去）、倒地 7.5 秒夠不夠爬上去跑到尾巴、冰柱斜飛好不好招架、手機上鏡頭拉遠後角色會不會太小。測試中 20 秒內沒抽到尾巴橫掃（機率問題，判定沿用已測過的貼地紅帶）。
- **⚠ 全部佔位**：身體、腳、尾、頸、頭都是程式畫的色塊。這關美術最重：背景層大身體、四腳（抬起／踩下／裂）、尾（平常／高舉／掃）、頭（俯視／吐冰／咬／垂首）要分開生圖。

**v0.8.181 玄武改平台戰（使用者：「玄武那個要做平台」）**
- **平台系統**（`57_gult.js` 尾段）：`Game.plats=[{x,w,y,off}]` 單向平台（從下面跳上去會穿過、下落才站住、走出邊緣掉下去）；`platResolve` 每幀算腳下地面 `Player._floor`；**主角相關的「是否在地面」一律改用 `PG()`**（`51_physics`、`40_player`、`65_draw_player` 共十多處：起跳、落地、空中攻擊判斷、瞬步、揚塵、影子）。沒有平台的關卡 `PG()`＝`Config.groundY`，行為不變。
- **第 7 關二階段**（`Stages[7].shell`）：龜背＝會跟著玄武移動的平台（寬 400、高＝身高 215，要二段跳或從浮石跳上去；站在上面會被載著走）；四塊浮石（x 520／1150／2050／2680、寬 200、高 125，單跳上得去）。玄武方塊改 440×215、走速 90、受擊半寬 190。
- **傷害規則**：站在地面砍＝硬殼只剩三成；**站在高處（離地 90 以上：浮石、龜背、空中）砍＝全額**（打到頭尾，標記變金色）；破綻（收招、破防、喘息）時地面也全額。巨型 Boss 高處命中判定放寬（`platHighHit`）。
- **反制站背**：在龜背上累計 2.6 秒 → 「龜背震動——跳！」預警 0.8 秒 → 還站著就被甩落（110、彈到背外）；起跳可躲。
- **新招 玄冥漲潮** `b_tide`：預警 1.3 秒後整片地面淹水 2.4 秒（每秒 190），站在浮石或龜背上才躲得掉。踏地二連、蛇尾橫掃加 `lowOnly`（站在高處打不到）；噬咬、躍壓、水柱照樣打得到高處。
- 驗證：單跳上浮石、走出邊緣落下、二段跳上龜背、背上普攻 18（全額）／地面 5（三成）、甩殼會震落、漲潮地面 228 傷害／浮石上 0、玄冥噴泉照常跑完；九關 smoke 全過。**沒驗證**：手機上跳平台的手感、鏡頭高度夠不夠、平台位置好不好跳（請實測）。站在平台上時主角影子仍畫在地面（佔位階段先不處理）。

**v0.8.180 全關灰盒：第 7、8 關＋第 4～9 關招牌大招（`src/57_gult.js`；使用者指示「除了美術都先完成」）**
- **灰盒大招引擎**：`moves.X.ult="g_xxx"`，`GULT[kind](U)` 回傳時間軸 `{ev:[[秒,fn]…], rest:[開始,長度], dim, tick}`；兩種危險物——`guStrike`（定點：地上圈預警 → 結算；kind `parry` 黃可招架／`red` 紅不能招架／`jump` 貼地紅帶要跳；`track` 追蹤主角到 `lock` 秒前）與 `guWave`（移動的波：`low` 可跳、否則頂天；`parry`／`red`）。光圈倒數 `guCue` 與判定同源。喘息段 `Boss._ultRest`（傷害減半）沿用。換生圖時：每招在 `drawGultWorld` 的佔位換成專屬特效、Boss 補關鍵格。
- **九招設計卡（要玩家用的動詞）**：
  - 第 4 關人形劍魂「六劍朝宗」`g_s4`：六把劍左右交錯橫穿（逐把招架，間隔 0.5、最後一把 0.85 慢半拍，每把 95）→ 天劍直落（紅圈追蹤，260）→ 喘息 2.2 秒。二階段血 60% 必放。
  - 第 5 關小狼「幽影噬月」`g_s5a`：化影消失 → 三次從天撲落（紅圈追蹤，160／160／220）→ 第三撲落地左右矮震波（跳或招架，110）→ 喘息 1.8 秒。一階段半血必放。
  - 第 6 關「血神大法」`g_s6`：老祖蓄力 6.5 秒且無敵（魅月護法，站在主角另一側 430 處）；**先砍魅月 3 刀到失神 → 護體碎 → 砍老祖一刀＝打斷**（架勢 +45、破綻 3.2 秒）；期間每 1.3 秒腳下血柱（紅圈，100）；沒打斷＝全場血爆 240（只有瞬步無敵幀能躲）。二階段半血必放。
  - 第 7 關天將「天罡雷陣」`g_s7a`：三道天雷（紅圈追蹤，130）→ 舉盾衝鋒兩趟（頂天金牆，180）：**完美招架＝撞停＋金光盾直接碎**、普通格擋扣劍勢、瞬步可穿。
  - 第 7 關玄武「玄冥噴泉」`g_s7b`：水柱從場地一端掃到另一端（每格 230、間隔 0.07 秒），只留一格沒紅圈（安全格在主角左右 2 格內），來回兩趟（180）→ 躍起壓頂（大紅圈 480 追蹤，300）→ 落地左右矮浪（跳，130）→ 喘息 3 秒。
  - 第 8 關一階段「青雲劍訣・天河」`g_s8a`：五把飛劍逐把射出（間隔 0.45、可折射、105）→ 直接接【危】突刺（看破）。
  - 第 8 關二階段「無相魔影殺」`g_s8b`：真身隱去，四道魔影依序撲殺（逐下招架，間隔 0.55／0.45／0.4／0.8，每下 100）→ 真身擒拿（紅圈，300）→ 喘息 2.2 秒。
  - 第 8 關三階段「天劫・萬象歸墟」`g_s8c`（期末考）：劫雷找空格 ×2（150）→ 矮劫波（跳，110）→ 頂天劫牆（瞬步，240）→ 天罰五連（逐下招架，85）→ 喘息 3 秒。
  - 第 9 關心魔「三念歸一」`g_s9`：心魔隱去，連出五式，每式隨機＝斬（黃圈招架 100）／掃（貼地紅帶要跳 170）／絕（紅圈走開或瞬步 200），同一式不連出 → 現身喘息 2.4 秒。
  - 以上傷害為基礎值，實際 ×`BOSS_DMG_K`(1.25)。全部登記在各關 `hpTriggers`＋`sigMove(s)`，**齒輪「大招測試」都列得出來**（第 4 關直接跳人形劍魂、第 8 關第三招直接進三階段）。
- **第 7 關灰盒**（`Stages[7]`：`stances` A 天將／B 玄武、`stanceByPhase`）：一階段**金光盾** `guard{hits:3,k:0.15,down:8}`——盾在時氣血傷害只剩 15%，完美招架 3 次＝破盾 8 秒（全額傷害＋架勢 25），之後重聚；招式 天罰金鐧（霸體）、變速砸、雙鐧連擊、金盾震擊（震退）、【危】突刺／橫掃。二階段**玄武**（方塊 280×210、`size` 2.0、走速 170）**硬殼** `shell{k:0.3}`——只有收招／破防／喘息時頭伸出來才吃全額，其餘三成；招式 噬咬、踏地二連、【危】蛇尾橫掃、【危】躍壓、縮殼旋撞、玄冥水牢。**與原規劃的差異（要誠實告知）**：沒有做「龜背平台跳躍、分打頭與尾」（引擎沒有平台物理），改成「硬殼＋破綻露頭」；要做平台版需另開工。
- **第 8 關灰盒**（`Stages[8]`：`stances` A／B／C）：血條 30%／35%／35%（`hpSplit [0.3,0.35]`＋`hp3`）；**三階段做法**：二階段血見底後的處決被「天道」彈開（`mechPhase3Intercept`，在 `performExecution` 開頭攔截）→ `Boss._form=3`、血條補滿、換姿態 C、震飛主角；`Config.bossPhase` 仍是 2（引擎大量寫死 2）。每階段各 5～7 招（人：劍與遲刃、飛劍；魔染：霸體爪、背襲、四連、魔沼、擒拿；天道：劫光、變速、雷矛垂落、神雷劍、三種危招）。
- **第 9 關**：鏡像 AI 走 `mirrorAI` 會跳過 `hpTriggers`，新增 `hpTrigTry` 讓心魔也能放大招。
- **關卡機制共用**：`mechInit`／`mechTick`／`drawMech`（金光盾、硬殼都用「每幀比對差額退還」做減傷，不動其他傷害程式）；`stage.gbox` 的關卡換姿態時自動 `applyBossBody`。
- **音效**：這個環境沒有音訊生成工具，**沒有生成任何音檔**；改寫 ElevenLabs 提示詞 43 條（每條有秒數與檔名代號）在 `prompts_sfx/ult_sfx_s2_s9.txt`。目前灰盒全部暫借通用音。
- **⚠ 佔位美術清單（全部待換生圖）**：第 6～9 關 Boss 本體（方塊或舊程式畫）、魅月剪影、血池、所有灰盒大招的預警圈／光柱／波／影子、金光盾弧線、玄武「殼／頭」標記；第 6～9 關背景仍是舊程式背景。
- 驗證：check 0 錯誤；九關 smoke 全過；無頭測試九招全部從開始跑到結束無錯誤；機制測試：金光盾 100→15、三次招架後破盾全額；撞停衝鋒＝破盾＋進喘息；血神大法砍魅月 3 刀→護體碎→砍老祖＝打斷；第 8 關 一→二→三階段→擊敗 流程正確（姿態 A→B→C、血條 2100／2450／2450）；玄武硬殼 100→30、破綻時全額。**沒驗證**：手感、難度、每招來不來得及反應、音效、手機效能。

**v0.8.179 第 6 關灰盒：雙 Boss 同場（同伴引擎 `src/56_partner.js`，使用者指示「依目前方案把遊戲完成」後開工）**
- **設計卡（這關教玩家「先決定切誰」）**：主 Boss＝化血老祖（一般 Boss AI、兩階段血條 2000/3000、架勢 150）；魅月仙子＝同伴，站在老祖後方離主角 620 處，**不會死**，頭上有「心神」條。
- **魅月三招（固定輪替 飛花→護體→飛花→回春，`Stages[6].partner`）**：①飛花：2 發（二階段 3 發）、間隔 0.5 秒、傷害 90、可招架折射，折射打回魅月＝打斷＋心神 45。②月華護體：詠唱 2.4 秒，成功後老祖 8 秒內氣血與架勢傷害只剩三成（`Boss._ptShield`，做法＝每幀比對差額退還 70%，不動其他傷害程式）。③回春月露：詠唱 2.8 秒，老祖回該階段血條 8%（血 80% 以下才放、冷卻 14 秒、血見底不放）。
- **反制**：詠唱中砍到任何一刀＝打斷（魅月僵直 0.8 秒、3.2 秒後才再出手）；心神（普攻 26／第三劍 40／凌空 34／蓄力 100／折射 45，每秒回 4）打滿＝**失神 7 秒（二階段 5.5 秒）且護盾立刻碎**。主角靠近 230 內她會「幻渡」閃到遠處（冷卻 7 秒，詠唱中不能逃）→ 詠唱就是抓她的時機。老祖破防或處決演出時魅月不出手。
- **血池**（`Stages[6].pools`、`poolDps` 110）：一階段場地中央一池（x1600、寬 300），二階段換成兩池（x1150、x2050）；站在裡面每 0.3 秒扣血（走 `zoneDamage`），跳或瞬步越過。
- **老祖招式**：化血魔爪、血痕三連、腐骨血錐三連（可折射）、【危】魔煞血河刺（看破）、【危】萬毒化骨掃（跳）；二階段加 血泉湧（主角腳下紅圈）、【危】血海擒拿（側閃）。
- **公平性**：魅月在畫面外詠唱／放飛花時，畫面邊緣有箭頭圓牌（盾／癒／花＋詠唱進度）；詠唱時有連到老祖的光線與頭上進度條；首次有提示文字。鏡頭 `camZoomP` 0.88。
- **掛接點**：`loadStage`→`partnerInit`；`updatePhysics`→`partnerUpdate`；主角出刀先判 `partnerTryHit`（地面與空中兩處）；`aimX`→`partnerAimX`；折射飛劍→`partnerReflectHit`；繪製 `drawPools`／`drawPartner`／`drawPartnerTop`。
- **⚠ 全部是程式畫的佔位美術**（魅月是長裙剪影、老祖是舊方塊、血池是紅色橢圓），灰盒過關後一律換生圖。音效暫借通用音。
- 驗證：check 0 錯誤、九關 smoke 全過；無頭測試確認：輪替施法、護盾時 100 傷害只扣 30、詠唱被一刀打斷、心神滿＝失神且護盾歸零、血池 1.5 秒扣 165、二階段換兩池。**沒驗證**：手感、難度、節奏（請手機實測）。
- **請使用者實測回答**：①來得及衝過去打斷嗎（2.4 秒）？②老祖追打的壓力會不會太大或太小？③護盾三成、回血 8% 的份量？④血池位置擋不擋路？⑤這種「二選一」好玩嗎？

**v0.8.178 玄鐵龍捲時停（使用者）**：Boss 接劍那一刻起 `Game.ultLock = true`（`inputLocked` 讀，移動／跳／瞬步／攻擊／招架全鎖，`Player.vx = 0`），接劍 → 收劍 → 落地 → 起身 → 舉劍，到**頂點閃光（`ct >= ct.raise`，約 1.1 秒）才解鎖**（輕震動提示）；鎖定期間鏡頭焦點偏 Boss（0.7）、拉近 +0.14、壓暗聚焦。閃光到下劈約 0.5 秒＝主角反應時間（身上黃圈倒數），不採「衝擊波出來才解鎖」（落地位置離主角只有約 60～100px，0.1 秒內必中）。首次提示字更新。測試：鎖定期間狂按瞬步／跳／攻擊，位置與狀態不變；閃光後立刻可動；完美招架／瞬步衝擊波仍有效。

**v0.8.177 玄鐵龍捲岩石衝擊波加高加厚、只用一格（使用者）**：`drawUltB3` 衝擊波固定用 `boss3bsolid` 第 1 列第 2 格（第 3 格塵土碰到格邊、前緣會出現垂直硬邊），高 460→660、寬再 ×1.35；判定深度 120→200 配合變厚。

**v0.8.176 第 3 關大招補關鍵格＋玄鐵龍捲後半段重做（使用者）**：
  - 新圖：`assets/boss3b/81_ub_spinA～84_ub_spinD`（旋轉 4 格）、`85_ub_catch／86_ub_pull／87_ub_land／88_ub_rise`、`89_ub_raise／90_ub_peak／91_ub_slam／92_ub_after`（`prompts3/8_*`）；`assets/boss3/71_ua_sw1／72_ua_sw2／73_ua_sw3／74_ua_r1／75_ua_r2／77_ua_x／78_ua_rel`（雙劍補間，`prompts3/9_*`；第 6 格 Gemini 畫成拿背上重劍，棄用）；`assets/fx/boss3bsolid.webp`（`prompts3/10_*`，洋紅底不發光去背成 RGBA，每格 396×336；第 1 列實體衝擊波、第 2 列劈地爆裂，第 2 列第 1 格有方形地面不用）。切圖改「按人物連通塊」切（劍伸進隔壁格也不會切斷）。
  - 玄鐵龍捲新流程：旋轉 4 格循環 → 停頓閃光 → 擲劍（腰高、跳或瞬步、不能招架）飛過主角 300px **停在空中** → 殘影瞬移到劍旁空中接劍（`Boss.x = 劍x − 方向×150×bossK`、離地 170）→ 收劍落下 0.22 秒 → 落地轉身 → 起身 → 舉劍過頭（拉近、壓暗聚焦；頂點閃光；主角身上黃圈倒數到衝擊波抵達）→ 接劍後 1.6 秒下劈：劈地爆裂＋**實體衝擊波**（`boss3bsolid` 第 1 列 source-over、高 460、速度 900、走 `resolveBossStrike`：完美招架／格擋／瞬步／受擊 300）→ 拄劍喘息 1 秒（破綻）。拿掉踩劍柄、跳下、從地面拔劍（`76_ub_perch`／`77_ub_strain`／`obj_stuck`／`boss3bwave` 不再使用）。時間軸 `ULT_CFG.b3tornado.ct`。中斷時若在空中一律落回地面。
  - 寒川十字補間：起勢 → 拉弓 → 過胸 → 到底（橫刀芒 0.75 秒出）→ 舉劍兩格 → 劈成十字 → 推出 → 雙手張開。
  - 測試：站著吃飛劍 300＋衝擊波 300 ✓；跳過飛劍 ✓；照黃圈時機招架衝擊波無傷 ✓；照時機瞬步穿衝擊波 ✓。

**v0.8.175 寒川十字飛行與揮出對齊（使用者：飛出的十字和揮出的十字不在同一水平線）**：原因＝飛行時換成第 3 列十字圖，其交叉點在格子正中（畫面中段），揮出的橫刀芒在胸口高度。改成飛行時直接把揮出的兩道原樣平移：橫刀芒（列 0、560px、胸口高度 `Boss.y−140`）＋直月牙（列 1、與揮出同尺寸同中心），尾霧接在胸口高度；揮出位置記在投射物（`yH`／`Hv`／`cy`）。第 3 列十字圖不再使用。

**v0.8.174 第 3 關兩招修正（使用者實測）**：① 寒川十字：橫刀芒維持到十字飛出（原本 0.9 秒就消失，豎劈時已不見），豎月牙也留到飛出，兩道合體一起飛。② 玄鐵龍捲：旋轉只用 `72_ub_spinf`／`73_ub_spinb` 兩格交替、不再左右翻面（原本劍在兩側跳很怪）；吸力 240→420（`pow(p,0.8)`）；龍捲依起手面向鏡像（旋向對齊擲劍方向）；龍捲與吸入氣流改用不透明版 `assets/fx/boss3btorn.webp`（由原圖亮度算不透明度；亮背景上疊加發光會變透明），背層畫在人物後、另加一層半透明前層罩住人物（`drawUltTop`）；停頓開始 0.25 秒內把 300px 內的主角震開約 225px（被吸到貼身時飛劍一出手就中、沒有反應時間）；擲劍速度 1050→750、旋轉 16→11 rad/s、腰高 G−120，物件縮 0.8（物件劍身比關鍵格粗 1.4 倍，換格會跳）；蹲劍柄（0.45 秒）後新增「跳下劍柄」0.25 秒（`23_plunge_jump`、離地 70px 弧線，插地的劍重新顯示），落地時 `Boss.x = 劍位置 − 面向×74×bossK`，讓 `77_ub_strain` 圖裡的劍剛好疊在插地的劍上；回頭砍衝擊波改用不透明版 `assets/fx/boss3bwave.webp`（source-over，照原圖顏色）。測試：十字站著 350／蓄力劈碎 ✓；龍捲割傷 75、被震開後起跳躲飛劍 ✓、完美招架衝擊波 ✓。

**v0.8.173 寒川十字換新特效（使用者：要參考動圖那種層疊刀光＋尾霧風格；v2 月牙方向反了不用，改十字與尾霧分開畫）**：`assets/fx/boss3ult.webp` 換 v3（`prompts3/7_boss3A_ult_fx_v3.txt`：列 0 水平細長刀芒、列 1 直立 `)` 形層疊月牙、列 2 十字＝直月牙＋水平刀芒、列 3 獨立尾霧；尾霧 `fx_black` 用 70px 淡出）。舊圖另存 `boss3crack.webp`，只用第 4 列（十字碎裂，蓄力斬劈碎時播）。`drawUltB3` 十字改等比（寬＝高×0.85），先畫尾霧（列 3，寬 1100、高＝十字高×0.42、透明度 0.75，亮的那頭接在十字內凹面後方），再畫十字。Gemini 第 4 列畫成橢圓環而非直尾，拉長後當尾霧可接受；不滿意可只重生第 4 列。

**v0.8.172 招牌大招冷卻 20→15 秒（使用者）**：`55_ult.js` `ultEnd` 設 `Boss._sigNext = now + 15000`；全關共用（`pickFromPool` 排除 `ult` 招）。

**v0.8.171 第 3 關兩招招牌大招**：`55_ult.js` 新增 `ULT_CFG.b3cross`（`ultB3A`）、`ULT_CFG.b3tornado`（`ultB3B`）、投射物 `Ult.b3`（`ultB3Tick`／`drawUltB3`：十字、飛劍、插地重劍、衝擊波，大招結束後已放出的仍會飛完）。資料：`S3.moves.u_cross`／`u_tornado`；A 姿態 `pool` 權重 4、B 姿態 `poolP2` 權重 5；`hpTriggers` 一階段（A）與二階段（B）各在血條 ≤50% 必放一次；**`S3.sigMoves=[{move,phase,stance}]`**（大招測試支援一關多招、可測一階段：`ultTestList`／`ultTest(n,i)` 依 phase 決定要不要 `bossRefillP2`、依 stance 換姿態）。
  - **寒川十字**：起勢 0～0.6（拉近壓暗）→ 0.6 橫月牙（`boss3ult` 列 0）→ 0.95 舉劍 → 1.15 豎月牙（列 1，高＝地面到畫面上緣）→ 1.5 十字飛出（列 2，速度 950）→ 1.8 起喘息 1.2 秒（破綻減半）。判定：十字中線碰到主角（rel 20～−70）＝ 280×1.25＝350；招架＝普通格擋 160×1.25＝200＋劍勢 −50；瞬步無敵＝躲；跳不過。**蓄力斬劈碎**：十字進入 260px 內時，若主角正在放蓄力斬，或**已按住蓄力 ≥0.2 秒（自動放出蓄力斬）**＝劈碎（列 3），Boss 架勢 +40、Boss 後仰 0.45 秒。光圈：藍（＝霸體／蓄力斬）。原本「放開才判定」實測太嚴：十字只飛 0.46 秒，蓄力要按 0.45 秒才出，等看到才按一定來不及。
  - **玄鐵龍捲**：橫握 0～0.5 → 旋轉 0.5～3.0（`72_ub_spinf`／`73_ub_spinb`＋左右翻面＝轉一圈，換格間隔 0.22→0.05 秒加速；龍捲 `boss3bult` 列 0＋吸入氣流列 1 越轉越濃；吸力 240×進度 px/s 往 Boss 拉、主角跑速 580 可逃；150px 內龍捲割傷 60×1.25＝75）→ 3.0 停頓閃光（列 2、定格 70ms，**主角身上紅圈倒數到飛劍抵達**）→ 3.4 擲劍（`obj_fly` 旋轉、腰高、速度 1050、從 Boss 前 40px 出手，飛過主角 260px 插地；離地 70px 以上算跳過、瞬步可躲、**不能招架**；240×1.25＝300）→ 插地（`obj_lean`→`obj_stuck`、揚塵震屏）→ 0.25 秒後殘影瞬移到劍柄（隱藏插地物件，改用 `76_ub_perch` 自帶的劍）0.45 秒 → `77_ub_strain` 吃力拔劍 1.2 秒（state=recover＝破綻，**傷害照常**）→ `78_ub_back` 回頭砍：滿高衝擊波（列 3，速度 900，走 `resolveBossStrike`：完美招架／格擋／瞬步／受擊 300）→ `22_slam_rec` 喘息 1.0 秒。
  - 素材：`assets/boss3/61_ua_guard～68_ua_recover`（雙劍 8 格；第 2、4 格 Gemini 自帶淡紫揮砍弧，保留當殘影；第 6 格清掉越界的劍碎片）、`assets/boss3b/71_ub_hold～78_ub_back`（重劍 8 格，清掉每格腳下的地平線）、`assets/boss3b/obj_fly／obj_stuck／obj_lean`（重劍物件，縮到關鍵格裡的劍長 424px）、`assets/fx/boss3ult.webp`、`boss3bult.webp`（用第二版）；`FX_FOOT.boss3bult=[244,256,256,238]`。
  - **蓄力斬解鎖提前**：`40_player.js`／`51_physics.js` 由 `unlockedStages >= 4` 改 `>= 3`（進第 3 關就能用；原本第一次打第 3 關放不出蓄力斬，玄鐵壓頂與寒川十字的解法都用不了）。
  - **招牌大招冷卻**：`pickFromPool` 排除 `ult` 招直到 `Boss._sigNext`（大招結束後 20 秒；換關歸零；血量門檻必放不受影響）。測試時曾看到大招放完又被招式池抽中。
  - 測試（頁面內逐幀機器人）：十字站著 350 ✓、瞬步躲 ✓、招架 200 ✓、按住蓄力劈碎（架勢 +80，含印記加倍）✓；龍捲吸到約 180px ✓、站著吃飛劍 300＋衝擊波 300 ✓、出手瞬間起跳躲飛劍 ✓、完美招架衝擊波（架勢 +40）✓、瞬步躲衝擊波 ✓。音效暫借第 3 關現有（b3_*）。**手機實測待使用者**。

**v0.8.170 角力條換生圖＋修「瞬步瞬移一大段」**：① 角力條改用 `assets/ui/clash_bar.webp`（雕花青銅框，軌道鏤空；軌道在圖中 left 9.11%／width 81.79%／top 14.26%／height 21.01%，程式在框下方填青紅推進量）＋ `assets/ui/clash_medal.webp`（雙劍徽章，位置＝軌道左端＋角力值×軌道寬，隨時間微微顫動），圖用 JS 設 `src`（走 IMGQ、帶版本號）。角力開始時收掉上方提示字（`elHintToast`），避免疊字。② 使用者回報「閃避時會瞬移到敵人身後、距離很遠」：原因是【替身殘影反切】（第 3 關解鎖後，受擊硬直中按瞬步＝瞬移到 Boss 身後 140px、無敵 1.2 秒）沒有距離限制，被遠處劍雨／投射物打中時也會觸發，第 2 關大招時甚至瞬移到浮空長老正下方。`doDash` 加條件：Boss 在 420px 內、不在大招浮空、`Boss.y` 在地面，才反切；否則照原本 `bufferAction("dash")`（硬直結束後一般瞬步）。測試：Boss 900px 外受擊按瞬步＝不移動 ✓；250px 內＝照常反切 ✓。

**v0.8.169 劍陣鎖身換專屬生圖**：`assets/fx/boss2bind.webp`（`prompts2/4_boss2ult_bind.txt`；列 0 落劍成陣、列 1 劍陣光絲循環、列 2 地面陣印循環、列 3 破陣；`fx_black` 列 3 用 70px 淡出），`FX_FOOT.boss2bind=[229,228,147,225]`。聚劍時在主角位置（`U.bx`，寬 440）生成陣印（主角後）＋落劍（0.45 秒），之後換劍陣光絲循環（主角前）直到巨劍刺到；刺到時播破陣。大招中斷時清掉 `boss2bind` 特效。角力條生圖提示詞 `prompts2/5_clash_ui.txt`（洋紅底：雕花青銅空心框＋雙劍交擊徽章，徽章隨角力值左右滑動），等使用者生圖。

**v0.8.168 劍陣鎖身（使用者：巨劍出發時走開或瞬步就閃過了＝漏洞，要強制格擋／敵人先控制住主角）**：聚劍開始（`gather`）時 `Game.ultBind=true`，到巨劍刺到（`ultB2Resolve`）才解除；鎖身中 `startAttackCharge`／`doNormalAttack`／`doDash`／`doJump`／`doDrinkGourd`／`activateAssist` 直接 return、`51_physics` 移動方向歸零、每幀 `Player.vx=0`，**只能招架**（瞬步不再是巨劍的解法，原設計卡已依使用者改）。特效暫借：劍環 `boss2ult` 列 0（主角身後）＋光環 `boss2ult2` 列 2 第 3 格（套在主角身上），浮字「【劍陣鎖身】」、首次提示「被劍陣鎖住了！巨劍只能【完美招架】」。聚劍到發劍期間鏡頭改成焦點 0.45、拉近 +0.06、上抬 −80（原本拉近長老，主角被擠到左下角）。`ultEnd` 也會清 `ultBind`。測試：真實按住左鍵＋狂按瞬步／跳躍 → 位移 0、吃巨劍 400 ✓；完美招架＋連按 → 角力破防 ✓。（v0.8.169 已換專屬圖 `boss2bind`）

**v0.8.167 角力改「連按招架」＋震動加強（使用者：靈感來自 3D 遊戲的格擋角力影片＝以小博大；加速、2 秒都確認可以）**：完美招架後角力條（`ult-clash` DOM，畫面上方 22%：左青＝墨塵、右紅＝敵方，下方黃條＝剩餘時間，標題「連按【招架】頂回去！」）從 50% 開始，長老每秒往回壓 0.22（`mashDecay`），每按一次招架 +0.08（`mashAdd`；`doParry` 在 `Game.ultLock` 時先走 `ultClashPress`，每按一下震 28ms、火花、金屬聲、小震屏）。推滿 100%＝提前破劍；2 秒到時 ≥50%＝破劍折射（破防）；被壓到 0 或 2 秒到時 <50%＝角力落敗：受 160×1.25＝200、震退，巨劍消散、長老落地喘息（走沒折射流程）。招架鈕 `#touch-parry` 角力中加 `clash-pulse` 脈動。持續震動改每 0.12 秒 30～70ms、震屏加大。測試：每秒約 6 下＝約 2 秒推滿並破防 ✓；不按＝2 秒後落敗吃 200 ✓；每秒約 1.5 下＝落敗 ✓。

**v0.8.166 羅天萬劍：巨劍加大、加速飛行、完美招架角力 2 秒（使用者回饋）**：`ULT_CFG.b2sword` 巨劍 `S` 1400→2000；飛行 `fly` 0.35→0.8 秒，劍尖位移用三次方（剛離手慢、一路加速），光圈仍以命中前 0.35 秒倒數（與判定同源）；命中點改主角胸口（`Player.y-70`）。完美招架後新增 `clash` 2 秒角力：`Game.ultLock`（`inputLocked` 讀）鎖操作、主角維持招架姿勢且無敵、被往後推約 44px；劍尖沿劍軸一推一拉（頻率與幅度隨時間加大）、巨劍逐漸疊亮；火花（`boss2ult2` 列 2 前兩格）每 0.11→0.06 秒、金屬摩擦聲（`block`）、震屏與手機震動每 0.14 秒持續；鏡頭拉近 +0.24、焦點偏主角、上抬改 −30、壓暗以接觸點為中心。2 秒到：巨劍碎裂（列 3，1400px）＋爆光（列 2，900px）、定格 130ms、慢動作 0.35 秒、大震屏，碎劍化成 0.6 倍的疊亮劍光沿原路加速倒飛（0.35 秒）→ 擊中長老摔落破防。移除原本 0.12 秒的定格反彈。測試：完美招架 → 角力 → 約 3.3 秒後破防且大招正常收尾；瞬步、站著不動結果不變。

**v0.8.165 第 2 關招牌大招「羅天萬劍」**：`55_ult.js` 新增 `ULT_CFG.b2sword` 與 `ultB2`／`ultB2Round`／`ultB2Rain`／`ultB2Resolve`／`drawUltB2`（`ultUpdate` 依 `U.kind` 分派）。`Stages[2].moves.u_sword={ult:"b2sword"}`、`poolP2` 權重 5、`hpTriggers` 二階段 ≤50%、`sigMove`（大招測試清單已列出）。時間軸（`ULT_CFG.b2sword.t`）：0～0.6 騰空（`Boss.y` 直接抬到地面上 260，浮空時 `Boss._ultAir`，主角地面／空中攻擊都打不到；`51_physics` 兩個攻擊分支加 `!Boss._ultAir`）→ 劍環（`boss2ult` 列 0，畫在 Boss 後面）→ 劍雨 1.2／2.2／3.2 三輪（紅圈 `boss2ult` 列 3 提前 0.6 秒、落劍列 1 下落 0.25 秒、插地列 2；第 1 輪隨機 5 把、第 2 輪圍主角 ±240／±480 與正中、第 3 輪 8 個位置一列留一個缺口且依序 0.05 秒落下；判定半徑 60、120×1.25＝150；瞬步無敵可躲）→ 4.2 聚劍（`boss2ult2` 列 0、拉近 +0.15、壓暗）巨劍淡入並追瞄主角 → 5.4 鎖定、0.35 秒斜下刺到（巨劍＝`boss2ult2` 列 1 放大 1400px 旋轉；主角身上黃色光圈）→ 判定：主角在落點 ±210 內才算命中；**完美招架（窗口 220ms）＝折射**：爆光、定格 120ms、慢動作 0.45 秒、以劍尖為支點轉向並同圖疊亮，0.3 秒倒飛回長老 → 碎裂（列 3）＋爆光、長老 `66_u_struck` 從空中摔落 0.35 秒 → `damageBossPosture(9999)` 破防；瞬步＝完美閃避無傷；普通格擋＝160×1.25＝200＋劍勢 −60；沒擋＝320×1.25＝400。沒折射：巨劍插地 0.45 秒後碎裂，長老 0.6 秒緩降 → 跪地喘息 2.5 秒（破綻傷害減半）→ 起身 0.35 秒。大招開始時二階段分身全部散去（`illusionDispelAll`）。鏡頭：浮空期間 `Game.ultCamY=-150`（`updateCamera` 讀，鏡頭上抬）、`Game.ultFocus=0.5`（焦點在兩人中間，數字＝Boss 權重）。素材：`assets/boss2/61_u_rise～68_u_recover`（Gemini 底色是淡洋紅 (244,110,233)，`key_magenta` 門檻 150 去不掉，另用門檻 95 的去背）、`assets/fx/boss2ult.webp`（列 2 煙霧用 `2:70` 淡出）、`boss2ult2.webp`；`FX_FOOT` 加 `boss2ult: [256,256,228,145]`。測試（頁面內逐幀機器人）：站著吃劍雨 150×2＋巨劍 400；完美招架 → 折射 → 1.4 秒後在地面破防 ✓；瞬步躲巨劍無傷 ✓；太早按招架＝普通格擋 200 ✓；劍雨用瞬步可躲（第 3 輪一列要找缺口）。音效暫借第 2 關現有（b2_appear、b2_sword_cast、b2_shard_hit、b2_vortex、b2_thrust、b2_shatter、b2_sword_rain）。**手機實測待使用者**。

**v0.8.164 滿屏火牆只留一層火焰（使用者要求）**：`55_ult.js` `drawUltWorld` 高火牆拿掉三層疊加火焰（原本 4 層），只留主層（寬 1000、頂到畫面上緣）；深紅實色身體從 1.7 倍寬縮到 1.0 倍（對齊單層火焰）；前緣亮光帶保留。判定不變。

**v0.8.163 大招測試（使用者：要測大招不必打一輪，之後要能隨時測各關大招）**：齒輪（天機閣選單）新增「🔥 大招測試」（`02_body.html` `#btn-ult-test`、`91_main.js` 綁定）→ `openUltTestMenu()` 列出所有有 `Stages[n].sigMove` 的關卡 → 點了 `ultTest(n)`：關閉選單與對話（不觸發後續）、`loadStage(n)` 直接進戰場、跳過登場、`Config.bossPhase=2`＋`bossRefillP2`、有 `stanceByPhase` 的關卡直接換二階段姿態（第 5 關大狼）、換二階段配樂、主角滿血滿劍勢、站在 Boss 左方 560px；`Game.ultTest` 倒數 1.2 秒（`ultTestTick`，在 `ultUpdate` 開頭；倒數中 Boss 待機）後 `triggerBossMove(sigMove)`。不寫進度。目前登記：第 1 關 `u_fire`（血煞焚岳戟）、第 5 關 `b_breath`（魔焰獸玉）。**之後每做好一關的招牌大招，在 21_stages.js 加 `Stages[n].sigMove = "招式鍵"` 就會出現在清單。** 測試：Playwright 點選單兩項都能直接放出（第 1 關 state=ult、第 5 關 stance=B＋b_breath windup），無頁面錯誤。

**v0.8.162 特效浮空修正＋高火牆加寬加厚（使用者：登場落地光圈煙霧浮空、衝擊波浮空、高火牆太細不夠有力）**：原因＝各處把特效格「底邊」對齊地面，沒扣掉圖裡的留白（land 第 0 列光圈中心在格內 y≈203，原本 `G-8` 底對齊＝光圈浮空約 75px）。`70_fx.js` 新增 `FX_FOOT`（各圖各列腳底的格內 y：land [203 光圈圓心, 242, 174, 240]、boss1ult [240,235,232,244]、boss1ult2 [256,256,250,256]）、`fxFootY`、`groundFxY(sheet,row,h,gy)`（＝地面＋GROUND_SINK＋留白補償，光圈則圓心對齊腳底）。套用：`54_director.js` 階段轉換／登場的 ring、dust、狼落地；`50_boss_ai.js` 落地光圈（躍斬 fxLand、以劍駐地、Boss 落地）；`61_cine.js` 舊登場落地；`55_ult.js` 插地爆裂、放波前閃光、招架斬火、竄起火牆、地火矮牆／高火牆的繪製。高火牆：寬 620→1000、高度頂出畫面上緣再 +260、深紅身體漸層加寬到 1.7 倍、火焰四層（多一層尾段）、前緣亮光帶加寬；判定不變。大招提示字延到 1.6 秒（避開大招名橫幅淡出）。截圖確認：地火矮牆貼地、高火牆整片厚實；第 1 關登場落地揚塵從腳底冒起。

**v0.8.161 高火牆改「滿屏」（使用者：要上下滿、超強壓迫感）**：`55_ult.js` `drawUltWorld` 高火牆高度＝地面到畫面上緣再 +120px（`ultViewTop()` 依鏡頭 zoom／cam.y 算畫面頂的世界 y），寬 620；先用 source-over 墊一層深紅漸層實色火牆身體（亮背景上只用疊加發光會變淡粉霧），再用 lighter 疊三層錯格火焰＋前緣亮光帶。長嘯時的竄起火牆也頂到畫面上緣。高火牆在主角 1400px 內：每 0.12 秒小震屏、每 0.22 秒手機震動；越靠近主角全畫面越紅（最多 32% 深紅）。判定不變（本來就不看高度、只有瞬步能過）。

**v0.8.160 第 1 關招牌大招「血煞焚岳戟」**：新檔 `src/55_ult.js`（演出型大招引擎，manifest 在 54_director 之後）。`Stages[1].moves.u_fire = { ult: "b1fire" }`；`poolP2` 加權重 5；`hpTriggers` 二階段血條 ≤50% 必放一次。掛鉤：`triggerBossMove`（`m.ult` → `ultStart`；大招中 `Boss._ult` 時不接其他招）、`updateBossAI`（`ultUpdate` 接管）、`drawBossEntity`（`Boss._ultFrame` 換關鍵格）、`render`（`drawUltWorld` 在 Boss 前畫壓暗＋火牆、`drawUltTop` 在最上層畫主角腳下光圈）、`updateCamera`（`Game.ultCam` 拉近量、`Game.ultFocus` 焦點偏 Boss）、`51_physics`（喘息 `Boss._ultRest` 破綻傷害 ×0.5；大招中 `consecutiveBlocks` 歸零＝不彈刀反斬）、`loadStage`（`ultEnd(true)` 清除）。時間軸（`ULT_CFG.b1fire.t`）：舉戟 0～0.9（0.45 換停頓格，拉近 +0.2、壓暗、戟焰 `boss1ult` 列 0）→ 插地 0.9（爆裂列 1、震屏、震動、鏡頭 −0.04）→ 矮火牆 1.05／1.95／2.85 各左右一道（速度 820、判定深 150、離地 60px 以上算跳過、基礎傷害 120×1.25＝150、完美招架 Boss 架勢 +12、放波前 0.25 秒插地點閃光）→ 抱胸 3.3（爆焰蓋過戟翻面、拉近 +0.24、紅光聚集 `boss1ult2` 列 0）→ 長嘯 4.3（衝擊環列 1、竄起列 2、高火牆速度 950、只有瞬步無敵能過、304×1.25＝380）→ 跪地喘息 5.0～8.0（state=recover、熱氣列 3）→ 拔戟 0.35 秒 → idle。光圈：用 `cue.webp` 畫在主角身上，倒數＝距放波時間＋飛行時間（黃＝矮火牆、紅＝高火牆），站在插地點旁也有 0.35 秒預警。被破防（招架火牆累積架勢）＝大招中斷。素材：`assets/boss1/61_u_raise～68_u_pull`（64_u_hold 未用：Gemini 把插地後的戟畫成刃朝上，用插地格撐過三波、換抱胸時爆焰遮蓋）、`assets/fx/boss1ult.webp`、`boss1ult2.webp`。測試（頁面內逐幀機器人）：站著不動吃 150／150／380（第二波被受擊無敵擋掉）；三波都跳過 ✓；三波都完美招架 ✓（架勢 +72，含印記加倍）；招架三波＋瞬步穿高火牆＝零傷害 ✓；二階段血 49% 自動觸發 ✓；破防中斷後鏡頭與火牆清除 ✓；smoke 1、2、5 關通過。音效暫借（長嘯借狼吼），ElevenLabs 提示詞在 `prompts1/4_boss1ult_sfx.txt`。**手機實測待使用者**。

**v0.8.159 難度方案 B1＋B3＋C1＋C2＋D1＋D2（使用者定案：第 1 關 v0.8.158 玩起來可以；**不做難度選項 F、不改 B2 招架窗口加成**（怕手機觸控延遲）；C3、D3、E 之後再說）**：① B1 Boss 招式傷害 ×1.25：`30_state.js` 新增 `BOSS_DMG_K`／`bossDmg()`，套在 `resolveBossStrike`（普通、危招、劍勢崩潰）、飛劍、部位招；地面煞氣與魔焰獸玉火柱（`zoneDamage`）不乘。實測第 1 關 `slash1` 140→175。② B3 出招間隔（招式收完到下一招）一階段 0.60→0.45、二階段 0.32→0.25（`50_boss_ai.js`）。③ C1 葫蘆回血 450→350（寧神印記 600→500）、C2 喝藥時間 0.85→1.2 秒。④ D1 破防硬直 3.8→**3.0** 秒。⑤ D2 普通格擋（按慢了）給 Boss 架勢 +6→+2。**手機實測待使用者**：吃幾刀要喝葫蘆、喝藥被打斷的機率、破防 3 秒夠不夠走到處決。

**v0.8.158 拉長戰鬥（使用者：第 1～5 關 5 分鐘不死就打完，太快太簡單；難度方案 A）**：① 一階段中途破防處決不再直通二階段：`40_player.js` `performExecution` 新增 `stay1`（`Boss._split && 一階段 && hp>1`）→ `execDmg = min(maxHp×30%, hp−1)`、不改 `Config.bossPhase`、不補血、不播階段轉換（兩個處決分支都改）；hp≤1 後的處決才進二階段。全關（含 `hpSplit` 的第 1、2、3、5～9 關）；第 4 關部位 Boss 不受影響。② 普攻（Boss 對峙中）每劍 41／66 → 18／30（`51_physics.js` `dmgN`，保留回響 14 與絕脈封印倍率）。測試：第 1、5 關處決四種情況（一階段滿血 −30% 留一階段／hp=100 留 1／hp=1 進二階段補滿／二階段 −30%）全對；第 1 關 Boss 不出招只連按普攻 14 秒，血 880→400（原本 7.6 秒就剩 200 並破防）。**手機實測待使用者**。後續（B 傷害壓力、C 回血限制、D 破防窗口、E 新招、F 難度選項）等使用者切 Opus 後出具體數值方案。

**v0.8.157 隻狼式攻守閉環（使用者第 1 關實測：一直普攻就能破防處決進二階段）**：實測（Boss 不出招只連按普攻）第一階段 5 秒、血剩 436/880 就破防進二階段，二階段約 21 秒處決三次打死。原因：`51_physics.js` Boss 連擋第三劍的「敵將彈刀」呼叫 `damageBossPosture(14, …, null, false, true)`，無上限，每 3 劍多 +14（有聞心印記時 ×2）。做法：① 該行改成 `Player.stamina -= 20`、`staminaRecoverDelay ≥ 0.8`，不加 Boss 架勢（反斬照舊）；② `40_player.js` `damageBossPosture` 對 `fromAtk` 統一把上限壓到 `maxPosture × 0.6`（原本蓄力破霸體 +30、普通重斬 +10 沒上限，凌空下劈上限 80% 一併收到 60%）。測試：同樣連按普攻，架勢 10→20→40→60 停住，血見底後 80% 不破防；`tools/smoke.js` 通過。**手機實測待使用者**：彈刀扣 20 劍勢會不會太痛／太輕、純連打到血見底的節奏、凌空下劈少了 80% 上限會不會覺得變弱。

**瘦身（v0.8.156 之後，未升版）**：刪除第 1～4 關舊過場影片 18 個（`assets/boss1～4/` 的 `intro`／`p2`／`form`，mp4＋webm，約 27MB；這四關由 `DIR_CFG` 的 `dirMode` 戰場演出取代，`stMovie` 不播影片，smoke 第 1～4 關通過）。`assets/` 83MB→54MB。**保留**：`boss5/intro.mp4／webm`（`Stages[5].introVideo` 仍被 `loadStage` 預載、是演出失敗的備案）、`music/` 的 `lilian／wenqing／dongfu／libie`（使用者要先留著）、`boss4/h01～h12`（巨手生圖）。

**v0.8.156 共用圖片載入器（使用者回報：有時敵人或場景讀不出來）**：原因是只有 Boss 16 主格、背景、主角有重試，走路／倒地格、招式關鍵格（extras）、特效圖 `fxSheet`、部位圖失敗一次就永久缺圖；進場也不等這些圖。做法：
- `10_boot.js` 接手 `HTMLImageElement.src` 攔截，成立 `IMGQ`：先用隱藏代理圖下載，成功才把網址交給真正的圖（下載中的圖沒有 src，`drawImage` 不會丟錯；失敗狀態的圖會丟錯）。同時最多 12 個下載（`IMGQ_MAX`）；單次 20 秒沒回應算失敗；一輪 4 次（重試間隔 0.6／1.2／1.8 秒，網址加 `&r=`），整輪失敗 6 秒後再一輪，共 8 次都失敗才對原圖發 error 事件。同網址只下載一次。各處舊的重試程式（`getBgArt`、Boss 主格、主角）已拿掉。
- `tools/build.py` 把 assets 內全部 webp 清單填進 `@ASSET_LIST@`（`ASSET_IMGS`）。清單沒有的圖不發請求、直接算失敗，記到 `IMGQ.missing`；`tools/smoke.js` 改從這裡收缺圖。
- `80_flow.js` 新增 `prefetchStageArt`：`loadStage` 時掃 `Stages[n]` 與 `DIR_CFG[n]` 的所有字串，對得上 `fx/`、`bg/`、角色圖資料夾（`boss*`）檔名的全部先載。測試：九關營地階段載完後進場打完全部招式，打到才載的圖都是 0 張。
- 進場閘門 `stageArtGate`（`62_hub.js`）：走到 `ARENA_ENTER_X` 時若還有圖在下載，主角原地站著（`Game.loadHold`），畫面下方顯示「載入中 xx%」，最多等 12 秒就先開打。
- 測試：模擬 30% 圖片請求失敗＋0.05～0.45 秒延遲，第 5 關 367 張圖重試後沒有任何真失敗（只剩 29 個本來就不存在的檔）；閘門有出現並在 12 秒放行。smoke 九關全過。**手機實測待使用者**。

**v0.8.155 普攻一律扣血（使用者：天經地義）**：`51_physics.js` 的「Boss 對峙防守」分支（`isPunishWindow` 以外）原本不扣血，現在也扣：每一劍 41（第三劍 66，＝破綻傷害 75／120 的 55%），回響 14、絕脈封印倍率照算；架勢 +5、連續第三劍 Boss 完美彈刀＋霸體反斬照舊。破綻窗口傷害（75／120）不變，所以仍鼓勵抓破綻。測試：第 1 關待機中連砍四刀 880→839→798→732→691。

**v0.8.154 生圖招架光圈推廣到全部關卡**：`54_director.js` 檔尾對所有 `Stages` 設 `cueArt=true` 並補 `fxSheets` 的 `cue`；各關不再畫程式光圈／星芒與前搖色圈（`drawThreatMarker` 只留提示文字），改由 `drawBossEntity` C4 區塊以 `Boss.nextImpactIn` 畫 `cue.webp`（黃可擋／紅危／藍霸體）。沒載到圖時自動退回程式光圈。截圖確認第 1 關；九關 smoke 通過。
**說明（使用者問：普攻為什麼有時沒扣血）**：設計如此——普攻只在「破綻窗口」扣血（Boss 處於 recover／staggered／frozen／grounded，或剛完成【破勢反擊】`Player.riposteAtk`）；Boss 在待機／前搖／出招中，普攻會被 Boss 格擋：不扣血、架勢 +5（上限 60%），連續第 3 劍 Boss 完美彈刀並霸體反斬；第 2 關打到分身只會打碎分身、不傷真身。空中攻擊（`doAirAttack`）另有傷害路徑。

**v0.8.153 血見底不再自動破防（使用者選方案一：普攻能打滿架勢太簡單）**：hp≤1（分段血關卡）→ 架勢拉到 80% 且停止恢復（`Boss._hpOut`，`updateBossAI` 開頭；架勢衰減加 `!Boss._hpOut`），**不直接破防**；`damageBossPosture` 加第 5 參數 `fromAtk`，血見底時攻擊類來源一律無效（普攻、空中攻擊、重斬、蓄力破霸體、被 Boss 彈刀），只剩防守類能補滿：完美招架（`parryPostureDmg`，多為 14～28）、普通格擋 +6、踏劍看破／凌空踩頭 +34、折射。首次提示「Boss 血見底了！架勢不再恢復：彈刀或完美招架補滿架勢，就能處決」。測試：hp=1 → 架勢 80、3 秒不衰減、連砍 8 刀仍 80、一次完美招架 +22 → 破防。

**v0.8.152 魔焰獸玉噴射只用「嘴張開」一張圖**（使用者：不要兩張來回切）：`active` frames 只留 `69_br_fire2`（`mouthA` 同步改單格）；`68_br_lunge`／`70_br_fire3` 不再使用（檔案保留）。

**v0.8.151 底層改動：每階段一條血（使用者定案方案 A）**
- 原問題：血條只有一條、普攻最低只到 1、第一次處決扣 20～30% 進二階段且不補血 → 磨血越多二階段越短，血剩 30% 以下處決直接擊敗、整個二階段被跳過。
- 新規則（第 4 關部位 Boss 除外，`Stages[n].hpSplit=[0.4,0.6]`，`NINE_MAP` 迴圈裡設）：一階段血條＝總血 40%、二階段＝60%（使用者：二階段較長）。`loadStage` 設 `Boss.maxHp`（一階段）、`Boss.maxHp2`、`Boss._split`。
- 一階段：中途破防處決＝直接進二階段（`execDmg=0`，不會擊敗）；普攻磨到見底（hp≤1）＝`updateBossAI` 開頭自動破防（`damageBossPosture` 滿值、`staggerTimer=99` 等玩家處決、首次提示「Boss 血見底了！按【處決】收下這一條血」）→ 處決進二階段。
- 進二階段：`bossRefillP2()`（`40_player.js`）換成二階段血條並補滿；HUD 血條 1.3 秒由空填滿（`Boss._fillT`，`82_dialogue.js`）。
- 二階段：中途處決扣二階段血條 30%（不夠扣就擊敗）；磨到見底一樣自動破防 → 處決擊敗。
- 第 5 關 `hpTriggers` 的 50% 改為「二階段血條的一半」。
- 測試（Playwright）：第 1、3、5 關 一階段 hp=1→自動破防→處決→二階段補滿；二階段 70%→處決→40%；hp=1→自動破防→處決→hp 0。第 2 關自動破防會晚一點觸發（分身／瞬移期間），結果正確。各關血量：1：880/1320、2：1040/1560、3：1280/1920、5：1840/2760、6：2000/3000、7：2160/3240、8：2800/4200、9：2080/3120。

**v0.8.139 第 4 關：核心珠改生圖、古靈降臨順化、登場營地音樂淡出（使用者三點回饋）**：①**核心藍球**原本是程式畫的圓（`53_parts` `drawPartsBack` 的 `arc #7dd3fc`）→ 改用現有的 `boss4fx` 生圖（列 0 核心珠呼吸＝一階段胸口的淡珠；列 1 蓄光＝降臨時緩降的珠）。②**古靈出場卡卡**：成因＝我新做的 `descend` 導演（3.6 秒光柱）播完後，舊的 `partsTransStep` 還會再跑一次（核心球降下 2.8 秒），最後古靈在 `tt≥2.8` 那一幀「彈出」（`phase 't'` 時人形根本沒畫）。改：`drawDescendWorld`（`54_director.js`）在導演內畫**核心珠降下→人形以現有三格成形**（`17_kneel` 蜷伏→`14_cast` 起身舉手→`01_idle1` 站立，淡入＋`brightness` 亮度漸退＋微上浮，0.3／0.62 切格）；導演結束時 `dirEnd` 直接 `P.tt=2.8` 並在同一幀 `partsTransStep` 接上三階段（`Game.dir=null` 後呼叫），不再重播藍球降下。③**營地音樂**：`dirStart("intro")` 一開始就 `Music.fadeOut()`（原本 `Music.duck` 只壓 0.3 秒就恢復，營地曲一路播到名牌）；關卡曲仍在名牌滑入／蓋章時才開始（第 4 關約 4.5 秒，這段只有音效）；階段轉換維持壓低。實測：進登場 0.1 秒營地曲 target→0、名牌時 `b4_p1` 起；三階段截圖：珠降→光柱＋陣環中白色剪影成形→站定。若要更細緻的降臨動作，可請 Gemini 補生 3～4 張「降臨關鍵格」（光中輪廓→衣袍展開→睜眼→站定）。待手機實測：降臨是否順、登場前 4 秒無配樂是否可接受（要不要放一段低沉環境音）。

**v0.8.138 第 4 關「雙劍合圍」好閃一點＋紅圈提示改寫（使用者：跳起來還是被打到、紅圈不能擋嗎？前幾關好像擋得到）**：①實測：原本 `pincer` 可閃窗口約 0.5 秒（紅警告出現後 0.5～1.0 秒起跳；太早落地時劍才到、太晚被打），且劍飛過速度約 3000px/s，看到劍動再跳只有 0.23 秒（低於反應時間）→ 判定本身正確但太嚴。②修法：`pincer.active` 0.42→**0.8**（劍從場邊飛到身上約 0.4 秒，速度約 1600px/s）、離地門檻 38→**22px**（`53_parts` 的命中判定）、**落地寬限 0.13 秒**（`Player._airMs`，`51_physics` 記錄最後離地 22px 以上時刻）。實測：劍起飛後仍有約 0.43 秒可起跳（原 0.23 秒）。③**紅圈解法說明**（查 `resolveBossStrike`）：【危】只有「突刺」類（`perilType:"thrust"`，例如第 1 關貫日長槍刺）能在完美招架窗口內招架成功並看破反擊；「橫掃」`sweep`＝只能跳（離地 38px）、「橫穿」`grab`／「躍斬」`leap`＝只能瞬步／側閃（瞬步無敵幀）；其餘一律受傷。教學提示（`drawThreatMarker`）改寫為「突刺類可在完美窗口內招架看破；橫掃、橫穿、躍斬類不能擋，要跳、瞬步或側閃」，合圍起手提示改「劍收攏前就要先跳！（不能招架）」。④預警（B）：`boss4warn` 第 4 列有畫（紅色橫線＋兩端「危」字標記＋朝內箭頭），但偏淡又貼地、使用者沒注意到；本版沒動，待使用者再測決定是否加強。待手機實測：合圍難度是否合理（要更寬鬆可把 `active` 再加到 1.0 或寬限加到 0.2 秒）。

**v0.8.137 左右鍵再調（使用者：有點大但好按；兩鍵往左、右鍵靠左鍵；底圖半透明／毛玻璃）**：按鍵 118×104→**106×94**（可按範圍仍外擴 16px）、整組 `margin-left:-14px`、兩鍵間距 18→**6px**；底圖改 `rgba(15,23,42,.22)`＋`backdrop-filter: blur(7px) saturate(1.25)`＋淡邊框與上緣高光，按下變淡金色。844×390：左鍵 [10,278]-[116,372]、右鍵 [122,278]-[228,372]，與右側按鍵群不重疊；截圖確認毛玻璃效果。待手機實測：透明度是否太淡看不到（`.dpad-btn-move-large` 的 `rgba(15,23,42,.22)`）、尺寸。

**v0.8.136 左右移動鍵加大（使用者：有時候會沒按到）**：`.dpad-btn-move-large` 86×74→**118×104**（視覺實際約 62～73 寬 → 118 寬）、兩鍵間距 56→18px、`.dpad-cluster` 縮放 0.72／矮螢幕 0.85 → 0.92／1.0，並加 `::after{inset:-16px -10px}` 把可按範圍再向外擴（視覺不變，手指偏一點也按得到）、`touch-action:none`。規則加在 `01_style.css` 最後（`</style>` 之前，覆蓋舊的 !important）。無頭觸控模擬（844×390、667×375）：左鍵 [24,268]-[142,372]、右鍵 [160,268]-[278,372]，與右側按鍵群無重疊、不擋主角。待手機實測：是否太大擋到畫面左下、要不要再調（`.dpad-btn-move-large` 寬高與 `.dpad-cluster` scale）。

**v0.8.135 載入「好久／沒反應」修正（使用者回報）**：量測開機 **186 個請求、約 9.9 MB**（boss1 68 檔 2.6 MB、mc 77 檔 2.2 MB、fx 22 檔 1.5 MB、營地配樂 1.5 MB…）。成因與修法：①**每發一版全部圖片網址都換**（`?v=ASSET_VER` 我每版都遞增）→ 手機每次更新要重載約 10 MB。改為 `ASSET_VER = "@ASSET_HASH@"`，`tools/build.py` 依 `assets/` 全部檔案內容的 sha1 取前 8 碼自動填入：只有圖片／音檔真的變了網址才換，純程式更新走快取（實測第二次載入 185 個請求全走快取；之後**不用手動遞增 ASSET_VER**，`CLAUDE.md` 已更新）。②載入畫面的「保險」原本在 `window.onload` 之後才開始計時，網路慢時 onload 本身就很晚 → 畫面卡住也沒按鈕（「沒反應」）。改為 `02_body.html` 內嵌計時器（網頁一開始就跑）：3.5 秒出現「網路較慢・先進入」鈕（圖會陸續補上）、9 秒強制揭開。③`80_flow` 不再預載 `dirMode` 關卡的 `formMovie`（第 4 關約 1.1 MB 影片不會播卻被載）。驗證：極慢網路（每檔 1.8 秒）模擬：3.5 秒出現鈕、按下後進入；check／smoke ok。**未做（可再省）**：營地配樂 1.5 MB 與 mc 待機 24 格可延後載入、boss 走路格改按需載入；若仍慢再做。

**v0.8.133～134 第 4 關三段演出改戰場上（取代三支影片；設計卡已同意）**：①`assets/fx/boss4intro.webp`（Gemini 黑底 4×4：列 0 地裂＋光升＋霧、1 三道金環逐一亮起、2 半透明巨手握劍、3 地面震環）、`assets/fx/dir4.webp`（列 0 冰藍白劍刃氣焰、1 劍紋陣環、2 白藍光柱、3 劍刃碎光聚攏）。②`DIR_CFG[4]`（`54_director.js`）三段：**登場 `kind:"graveyard"`**（`graveStep`）：霧中殘劍暗下 → 0.7 地裂 → 1.5 巨劍升起（`sw1` 圖，`drawJadeSword`）→ 鏡頭抬起 → 2.6 三道金環亮起 → 3.2 巨手落下握柄 → 3.9 拔劍高舉＋震環＋名牌「蓋章壓下」（`bossNameCard slam`，小字「第四難」）→ 拉回，結束時巨劍回 `hover`（`dirEnd`）；`Boss._pp._hide`（`53_parts` `drawPartsFront` 開頭跳過）在營地載入／登場開始時藏起巨劍與巨手。**一→二階段 `kind:"formtrans"`**（`formationStart` 結尾 120ms 後 `dirStart("form")`，取代 `formMovie`）：巨劍崩裂、碎片飛散（導演期間 `dirShards` 讓碎片照常飛，否則世界暫停會凍成白方塊）、約 2.2 秒、結束後劍陣冷卻≥1.6 秒。**二→三階段 `kind:"descend"`**（`partsToPhase2` 觸發）：`dir4` 聚氣→光柱＋陣環（alpha 0.7～0.8）→進三階段。影片檔與設定保留（`dirMode` 優先；`formMovieStart`／`p2Movie` 分支留作備案）。③音效：部位引擎的聲音由通用音改成現有專屬音（天劍斬落 `b3_heavy`、掌壓／插地 `b3_plunge`、橫掃 `b3_sweep`、劍氣 `b2_sword_cast`、劍雨 `b2_sword_rain`、飛劍 `b2_sword_fly`）；`S4.sfxClass="light"` 給三階段人形招式。導演音效時序 `sfxT`（`b3_seal`／`b3_plunge`／`b3_draw`／`b2_shatter`／`b2_appear`）。④驗證：登場逐段截圖（地裂光柱、巨劍升起、金環、巨手握柄、震環＋名牌壓下、拉回）、兩段轉場截圖與狀態（劍陣進入、三階段進入）、smoke 第 4 關 ok；`audit_fx` 的部位 Boss 盲點是檢查工具用非部位模式觸發造成的誤報（特效實測都有掛）。待手機實測：登場 6.2 秒是否過長、金環位置（`d.tip-548`）、巨手大小、名牌壓下、轉場時長、新音效音量。

**v0.8.132 莫寒川重劍走路改用影片抽幀（使用者決定「還是用影片好了」）**：Gemini 圖生影片（附 `ref_b3b_walk` 綠幕參考圖、單一固定鏡頭、4 秒 24fps、原地走路；影片全程無漂移：重劍與雙劍都在、步伐均勻、綠幕乾淨）。`tools/proc.py`（`process(d,P,t0,N,refpath,W,H,AX,BY,outdir,prefix,refH)`）：自相關找週期 **35 幀**（一個完整左右兩步），起點第 18 幀，取 12 幀；以「身體高度」對齊動作表（`refH=491`、腳底 `BY=559`、`AX=450`，縮放 0.844；腳底在 550～559 間浮動是抬腳的自然起伏，不拉平）→ `assets/boss3b/walk_01～12.webp`（覆蓋舊的一組）。`stances.B` 移除 `walkSeq`／`walkBob`，改用引擎的 12 幀走路（`SP.walk`，`stride` 260；`getWalkNorm` 依 idle／走路高度比自動校正，實測比值 1.008）。`walkBob` 機制（`64_draw_boss`）保留給之後的姿態用。無頭截圖：左右腳交替、重劍雙劍穩定、與主角大小一致、顏色與動作表一致；smoke 第 3 關 ok。待手機實測：步幅是否貼地（`stride` 260 太快／慢可調）。

**v0.8.131 莫寒川重劍姿態走路修正（使用者回報）**：成因——重劍表 `04～06_walk` 三格**畫的是沒有重劍的走路**（雙劍加空手），所以 v0.7.6 起重劍姿態 `walkSeq` 只用有劍的 `03_walk1`／`01_idle1`／`02_idle2`，但這三格腳位幾乎一樣，再加步幅 200（二階段速度 320 → 每秒 1.6 步）＝原地滑行。改為 `stances.B`：`walkSeq:["03_walk1","01_idle1"]`（跨步／收腳兩格交替）、`stride` 200→300（每步更慢更沉）、新增 `walkBob:7`（走路時身體上下起伏 7px，落腳最低；`64_draw_boss` 每幀歸零後走路分支才設定 `Boss._walkBob`）。無頭截圖確認走路兩格交替且有劍。若仍不順：請 Gemini 補生「重劍行走 4 格」（持重劍、左右腳交替；AI 分不清左右腳，建議走路影片抽幀），這是根本解法。

**v0.8.130 第 3 關登場「疾風入場」＋二階段「拔劍・玄鐵」**（設計卡已同意；二階段不放大、招式不動）：①`assets/fx/boss3intro.webp`（銀藍輕：列 0 橫貫斬線、1 竹葉切開、2 水環、3 雙劍交叉）、`assets/fx/dir3.webp`（暗紅橙重：列 0 炭黑煙＋紅脈氣焰、1 劍紋陣環、2 白熱橙光柱＋鐵片、3 鐵片火星聚氣）；處理同前（縮 1024、扣黑 18、格邊淡出）。②新登場型態 `kind:"dash"`（`54_director.js` `dashStep`）：Boss 藏到衝入（`_introHide`）→ 0.6 劍光橫貫畫面（斬線拉成 1500 寬 + 竹葉切開，畫面中心取 `cam.x+baseWidth/2`）→ 1.05～1.75 Boss 從畫面外 1500px 沿地面疾衝滑入（ease-out、`03_walk1`、揚塵）→ 1.75 煞停：雙劍交叉閃光＋水環＋塵浪＋震屏 → 2.0 名牌滑入（小字「第三難」）＋鏡頭瞬間拉近＋開始關卡曲 → 名牌飛走鏡頭拉回（約 5 秒）。音效時序 `sfxT`：`b3_dash`×2、`b3_cross`、`b3_seal`。③二階段 `DIR_CFG[3].phase`：跪姿→`dir3` 聚氣→氣焰→陣環＋光柱→震飛主角（`blast`），爆發時換重劍（`stance:true`），音效 `b3_draw`＋`b3_plunge`；`p2Aura`＝重劍氣常駐 alpha 0.5；各元素 alpha 0.6～0.85、`flashK` 0.6（第 3 關背景偏亮、已先調透明）。④舊影片 `p2Movie`／`introMovie` 檔與設定保留（`dirMode` 優先）。驗證：登場逐段截圖（斬線＋竹葉、疾衝煞停＋雙劍交叉＋水環、名牌、拉回）、二階段截圖（跪姿聚氣、爆發、震飛、重劍）；audit 第 3 關 0 盲點；smoke ok。待手機實測：登場 5 秒、斬線與竹葉疊加偏亮（已壓 0.7／0.75）、疾衝速度。

**v0.8.129 戰鬥浮字全部關閉（使用者：身上跳的提示小字根本看不清楚，不如不要）**：`spawnFloatingText`（`30_state.js`）加總開關 `FT_RULE.text`，預設關（所有「【完美閃避】」「連段招架 ×N」「太初替身…」「飲仙釀 +N」「破勢」等浮字都不再出現；書法大字橫幅、書法字卡、名牌、HUD、`hintOnce` 提示列不受影響）。要恢復：瀏覽器 localStorage 設 `qingyun_floattext=1`。副作用：按回生酒／玄天珠失敗時（已空、氣血已滿）不再有浮字回饋，仍看得到 HUD 的酒葫蘆與玄天珠鈕狀態。**第 3 關設計卡已同意**（登場「疾風入場」：暗下→劍光橫貫畫面、竹葉切開→疾衝滑入煞停、雙劍交叉震水環→名牌斬線現身；二階段「拔劍・玄鐵」：跪姿→拔劍三格→重劍插地陣紋＋震飛，不放大，暗紅橙重劍氣常駐；招式不動；音效不新生：`b3_dash`／`b3_cross`／`b3_draw`／`b3_plunge`／`b3_seal`）；提示詞（`boss3intro` 銀藍輕、`dir3` 暗紅橙重，輕重對比）已交付，等使用者生圖。

**v0.8.128 第 2 關二階段光太亮→調透明（使用者回饋）**：導演設定新增各元素 `alpha`（`aura`／`gather`／`ring`／`pillar` 都可設，預設 1）與 `flashK`（閃白強度倍率，亮背景的關卡調低）。第 2 關 phase：aura 0.4、gather 0.4、ring 0.55、pillar 0.32、flashK 0.4；`p2Aura` 常駐靈霧 0.75→0.32。原因：加亮疊色（`lighter`）在亮背景（淡紫天空）上容易洗成純白；之後每關按背景亮度調。截圖確認光柱與氣場變淡、Boss 與字卡清楚。

**v0.8.127 第 2 關登場「鏡花水月」＋二階段「真假難辨」（使用者同意設計卡：登場順序 OK、二階段**不放大**〔以詭譎為主〕、招式不動）**：①`assets/fx/boss2intro.webp`（Gemini 黑底 4×4，原圖 2048→1024、扣黑底 18、格邊淡出：列 0 鏡片環〔6 片花格鏡面〕、列 1 鏡面浮現映出剪影、列 2 炸碎、列 3 地面八卦陣紋）、`assets/fx/dir2.webp`（列 0 翠綠淡紫靈霧、列 1 八卦環、列 2 淡紫光柱＋鏡片、列 3 聚氣＋扇裂縫）。②**新登場型態 `kind:"mirror"`**（`54_director.js` `mirrorStep`）：`Boss._introHide` 藏到鏡子炸碎（`dirStart` 設 true、`loadStage` 對營地載入也設）→ 0.15 秒鏡片環繞（越轉越小）→ 1.45 鏡面浮現 → 3.0 炸碎：Boss 現身、`drawIntroGhosts` 畫 8 個分身殘影（立繪 `01_idle1`，半透明排成一圈 1 秒內收攏淡出）、地面八卦陣紋 → 3.25 名牌滑入（`bossNameCard slide`，小字「第二難」）＋鏡頭瞬間拉近＋開始關卡曲 → 名牌飛走鏡頭縮回 → 結束（約 5.5 秒）；背景暗層 `D.dim`（鏡片是加亮疊色，亮背景上會變純白，先暗化背景再畫鏡片）；音效時序 `sfxT`（`b2_vanish`、`b2_appear`、`b2_shatter`、`b2_split`）。③二階段 `DIR_CFG[2].phase`：跪姿→`dir2` 聚氣（扇裂縫）→靈霧升騰→八卦環＋光柱鏡片風暴→震飛主角（`blast:true`），**不放大**；`DIR_CFG[2].p2Aura`＝靈霧 `dir2` 列 0 常駐（alpha 0.75）。④`S2.sfxClass = "light"`：罡風陣、雷劫陣走輕武器類別音效庫。⑤`Stages[2].fxSheets` 預載。驗證：登場逐段截圖（鏡片環、映影、炸碎＋分身一圈＋陣紋＋名牌）、二階段截圖與狀態；`audit_fx` 第 2 關 0 盲點；smoke 第 2 關 ok。待手機實測：登場 5.5 秒長度、鏡片環大小、分身殘影、光柱在亮背景上偏白（可調 alpha）、二階段靈霧亮度。

**v0.8.126 提示詞規則修正（使用者指出：我把風格聖經寫成佔位符叫他自己貼）**：①`STAGE_PIPELINE.md` 的 T2～T4 模板改為**內含完整風格聖經**，主題欄位才用 `[ ]`，並在文件開頭加三條硬規則（聖經直接寫進去、交出前不得殘留 `[ ]`、交出前跑檢查）。②新增 `tools/check_prompt.py`：檢查開頭是完整風格聖經、有 EXACTLY N、底色寫明、無殘留佔位符、無三個反引號、有「不畫人物」或參考圖說明；用法 `python3 tools/check_prompt.py 檔名.txt`（或 stdin）。③`CLAUDE.md`「生圖提示詞規則」同步加上。第 2 關設計卡已同意（登場「鏡花水月」、二階段「真假難辨」**不放大**、招式不動），提示詞已重新交付（`boss2intro`、`dir2`），等使用者生圖。

**第 1 關定案（使用者 2026-11-08：「第一關應該可以了」）**：登場（從天而降＋名牌滑入）、二階段（紅焰常駐、震飛、放大）、全部特效／音效配對（盲點 0）、玄天珠兩種、載入畫面都已完成；之後只做使用者實測後的數字微調。下一關：第 2 關（先出設計卡，同意後才給提示詞，流程見 `STAGE_PIPELINE.md`）。`tools/audit_fx.js` 已修正：`tpFx` 瞬移（第 2 關鏡碎）算有消失／現身圖。

**v0.8.125 回血光點＋Boss 光暈生圖、單關製作流程文件**：①`assets/fx/heal_fx.webp`（Gemini 黑底 4×4：列 0 光粒上升循環、1 酒氣升騰、2 綠色橢圓光環、3 光粒歸入身體）：`doDrinkGourd` 有圖就畫圖（酒氣＋光環跟隨主角＋光粒循環＋收尾歸入），取代程式粒子。②`assets/fx/peril_aura.webp`（列 0 危招紅焰、1 霸體藍殼、2 啟動閃現、3 架勢崩潰碎裂）：`drawBossAura`（`54_director.js`，`render` 在 Boss 後面）依狀態自動畫：`Boss.isPerilous` 且 windup／active＝紅焰；招式 `armor` 且 windup／active＝藍殼；危招起手閃現一次；`state==="staggered"` 碎裂一次；光暈高度＝`bossVis.k×480`、中心對準身體；有圖時不再用 `ctx.filter` 紅色光暈（`64_draw_boss`）。部位 Boss 一階段不畫。③使用者生的紫色刀弧模板（T2 版面）未接入（模板範例，留給之後的 Boss）。④新增 **`STAGE_PIPELINE.md`（單關製作標準流程）**：總流程表、全關共用資產清單（不用重生）、提示詞模板 T2～T5（刀弧、投射物＋影遁、階段轉換專屬圖、天空延伸）、程式設定速查、驗收清單、第 1 關教訓；`CLAUDE.md` 已加連結。第 1 關現況：盲點檢查 0、命中火花／灰塵／回血／危招光暈全生圖；**主角圍巾**經查只在無角色圖的舊方塊備案裡畫，正式畫面不出現，列入 Beta 清除。驗證：危招紅焰、霸體藍殼、回血光環截圖正常；check／smoke 第 1、3 關 ok。待手機實測：光暈大小與亮度（尤其霸體藍殼會不會蓋住 Boss）、回血特效時機。

**v0.8.124 全遊戲共用的命中火花／衝擊波圈／灰塵改生圖（使用者：基本目標是全部生圖、不用程式寫）**：不需要新生圖——現有 `spark`（列 0 命中、1 格擋金環、2 霸體藍環、3 破勢紅爆）、`air`（列 2 招架星芒）、`scene`（列 3 煙團、列 2 碎石）已足夠。`spawnSparks`（`30_state.js`）：`parry`＝spark 列 1 金環＋air 星芒、`mikiri`＝spark 列 2 藍環＋星芒、`execution`＝spark 列 3＋列 1 大環、`block`＝列 1、`hit`＝列 0；**有圖就只畫圖，不再畫 `Game.shockwaves` 圓環與 `Game.particles` 粒子**（圖沒載到才退回程式畫）。`emitDust`：改成 `scene` 列 3 煙團（隨機 4 種、往上飄散、grow 0.7、淡出、畫在 Boss 後面），`fxList` 上限 60→140。`bossHitFx`：有 `spark` 圖時不再產生程式斬線（`hitFx` slash）與火星粒子。第 4 關插地衝擊環（`53_parts.js`）改 spark 列 2（壓扁成 340×170 橢圓）。無頭驗證：五種火花與灰塵一次觸發截圖正常、`Game.shockwaves／particles／hitFx` 皆為 0；smoke 第 1、4 關 ok。**全遊戲仍是程式畫的東西（待辦清單）**：①回生酒回血青綠光點（`40_player.js` `Game.particles`）需新圖；②主角圍巾（`Player.scarfNodes` 線條）；③各種程式陰影橢圓／背景星月（`drawDynamicBackground` 無背景圖的舊關）；④`drawArcs` 程式刀弧備案（第 5～9 關若沒專屬刀弧圖就會用）、`drawThreatMarker`／投射物／陣法的備案；⑤Boss 危招紅光（`ctx.filter` drop-shadow）；⑥`drawMist`（薄霧）、`drawLeaves` 已是圖。

**v0.8.123 第 1 關雕琢②：武器類別音效庫＋擲戈／影遁專屬圖**：①**武器類別音效庫**（`11_audio.js`）：使用者擔心每招都專屬音效工程量太大→改成「類別 × 招式型態」自動配對。`Stages[n].sfxClass = "heavy"｜"light"`（`SFX_CLASS` 表）、`Stages[n].sfxPitch`（音高倍率）；`applyStageSfxClass(stage)`（`loadStage` 時呼叫一次）依招式標記（`sfxArchetype`：mobility／rage／leap／charge／throw／zone／sweep／thrust／push→slam／combo／swing）為**沒有 `move.sfx` 的招**填 `{a|h, w, land, p, v, auto}`；專屬 `move.sfx`／`Stages[n].sfx` 永遠優先。檔案全用現有的 `b2_`／`b3_`／`m_` 音效：heavy＝swing／combo `b3_heavy`、thrust／leap／mobility `b3_dash`、sweep `b3_sweep`、slam／躍斬落地 `b3_plunge`、charge `b3_charge`、throw `b2_sword_fly`、rage 前搖 `m_roar`＋`b3_heavy`、zone `b3_seal`；light 同理對應雙劍組。瞬移用 `SFX_SHARED`（`b2_vanish`／`b2_appear`，`bsfx` 在有 `sfxClass` 的關卡自動回退）；位移招音量 ×0.45（`sfx.v`）；躍斬落地音 `sfx.land`（`50_boss_ai` 落地處）。**第 1 關套用 heavy、音高 0.94 → 新生音效 0 個**。同音已有 ±4% 隨機音高。待手機實測：長戈用重劍音是否合適、哪些要換專屬音。②**`assets/fx/boss1fx2.webp`**（Gemini 黑底 4×4，原圖 2048→1024、扣黑底 18、格邊淡出）：列 0 擲戈飛行（`Stages[1].bulletArts.halberd`：fps 12、w 290、tipX 234、tipY 129）、列 1 擲戈命中（`hitRow`／`hitW`：以投射物位置為中心；`swordImpactFx` 新增 `hitRow` 欄位）、列 2 影遁消失（`fxVanish`，w 470、oy -165）、列 3 影遁現身（`fxAppear`，oy -180）；`Stages[1].fxSheets` 預載。③`tools/audit_fx.js` 更新：顯示每招音效來源（類別自動／專屬）、瞬移走共用音、投射物有圖算有特效；**第 1 關 audit 盲點 0 個**。命中火花／衝擊波圈（全遊戲共用程式畫粒子）仍待評估。待手機實測：擲戈大小與紅光亮度、影遁特效時機、音效配對。

**v0.8.122 第 1 關雕琢①：可重用技巧（工程部分）**：使用者問「第 1 關還有哪些程式畫的特效／能否變成可重用技巧」→ 盤點後做三件事。①**`tools/audit_fx.js`**（特效／音效盲點檢查）：`NODE_PATH=$(npm root -g) node tools/audit_fx.js index.html 1,2,3`，每一招重新載入關卡後觸發、取樣 2 秒，報告用了哪些生圖特效（`sheet:row`）、有無程式畫刀弧、投射物有無圖、瞬移有無 `fxVanish／fxAppear`、位移招有無 `fxAct`、有無專屬音效；標 ⚠ 的就是盲點。**每關完成定義：audit 清零**。第 1 關現況 14 個盲點：擲戈本體程式畫＋13 招沒有專屬音效（影遁斬現身／消失、衝步、後撤已補）。②**投射物資料化**：`Stages[n].bulletArts[bulletKind] = {sheet,row,frames,fps,w,tipX,tipY,rot,breakRow}`（格式同 `flySwordArt`，`drawFlyingSwords`／`swordImpactFx` 依 `sw.kind` 取用，沒圖才退回程式畫）；第 1 關待補 `bulletArts.halberd`（擲戈本體）。③**瞬移／位移特效資料化**：`move.fxVanish`（消失前位置）、`move.fxAppear`（現身後位置）格式同 `fxAct`；位移招（衝步、後撤）本來就能用 `fxAct`（可加 `follow:true`）。第 1 關暫掛同關 `land` 圖（列 1 煙塵、列 0 紅環）：衝步、後撤、影遁斬消失／現身；之後換專屬圖只改 `21_stages.js` 的 sheet／row。已驗證：`bulletArts` 以 `boss2` 圖替代測試擲戈無錯；check／smoke ok。**待辦**：第 1 關專屬音效（`b1_*`）、擲戈本體圖、影遁斬專屬圖；通用特效圖模板提示詞（投射物＋消失現身＋衝步拖尾＋命中火花＋衝擊環），之後每關沿用。命中火花／衝擊波圈（全遊戲共用的程式畫粒子）評估後再決定是否全域換圖。

**v0.8.121 玄天珠改為兩種，各自變弱＋專屬機制（使用者決定：符陣定身與靈光太重疊→合併；防守太弱／太強的討論→「兩招都變弱，各留獨特機制」，每場仍只能用一次）**：①**符陣定身移除**（`applyAssistEffect` 的 fuzhen 分支、營地選項、舊選單按鈕都拿掉；舊存檔 `qingyun_assist=fuzhen` 視為靈光）。②**太初靈光（攻・打斷）**：命中時打斷當下招式（含危招），架勢 +22（問心封印 ×2＝44），Boss `hurt` 只 0.3 秒（原 0.95）、後退 120（原 230）——不給白打時間。③**太初替身（守・護魂）**：施放＝無敵 1.2 秒（原 2.2；`bumie` 封印 2.0）、回血 200（原 300）、護罩待命（`tishenActive`）；之後擋下一次致命傷（`takeDamage` 護魂分支）：氣血只剩 **100**（原 45%）、無敵只 0.4 秒（原 2 秒）＋`hurtInv` 0.7、原位後彈 230。施放與護魂共用同一次機會（`assistAvailable`）。未施放時選替身仍有「被動護魂」（致命傷自動觸發，原本就有）。營地選單與舊選單說明同步更新。無頭驗證：fuzhen 舊存檔→靈光；靈光架勢 44、Boss hurt；替身施放後 tishenActive、護魂擋致命傷後 hp 100／inv 0.4；smoke 第 1、3 關 ok。待手機實測：兩者取捨手感；若替身仍太弱可把致命傷後氣血提到 200 或給 1.0 秒無敵。

**v0.8.120 符陣定身削弱（使用者實測：第 1 關一發架勢直接滿）**：成因＝原本 `damageBossPosture(50)`，預設裝備封印 `wenxin` 對所有架勢加成 ×2 → 實得 100＝滿。改為 `Boss.maxPosture×0.3`（第 1 關 30 點）並新增第 4 參數 `noSeal`（協助技不吃封印倍率）；說明文字（浮字、營地選單）改「削 30% 架勢」。仍有定身 2 秒（可白打）。對照：太初靈光 22 點×封印 2＝44。實測：符陣 30／靈光 44、Boss 進 frozen／hurt。若仍太強可降到 20%，或縮短定身。

**v0.8.119 太初替身護罩生圖**：`assets/fx/xtz_shield.webp`（Gemini 黑底 4×4，原圖 2000 → 1024、扣黑底 18、格邊淡出；列 0 待命循環、列 1 強化雙環〔無敵期〕、列 2 展開〔珠光→大橢圓，0.5 秒〕、列 3 破碎）。`drawTishenAura` 有圖時畫護罩（310 px，中心 `Player.y-125`；`Player._shieldT0` 起 0.5 秒播列 2，之後待命列 0／無敵 `invulnTimer>0.05` 列 1，8 fps 循環）＋前層星塵；無圖退回 v0.8.118 程式光暈。護魂被致命傷消耗時 `spawnFx("xtz_shield",3,…)` 護罩破碎。`91_main` 啟動預載。無頭驗證：施放後待命與無敵期護罩位置比例、截圖看過；smoke 第 1、3 關 ok。待手機實測：護罩大小（310）、亮度、破碎時機。

**v0.8.118 太初替身護體光暈**：`drawTishenAura`（`54_director.js`，`render` 在主角前後各呼叫一次）：`Player.tishenActive`（免死護魂尚未用掉）期間，主角身上有淡藍橢圓光暈＋外圈細環（脈動）、繞身上升星塵、胸口珠光（`xtz` 列 0）；2.2 秒無敵內亮度 1.5 倍，之後待命 0.95 倍；護魂被致命傷消耗時在身上爆開 `xtz` 列 3。演出期間（assist 導演）不畫。待手機實測亮度與是否遮住主角。

**v0.8.117 玄天珠發射頓挫＋營地選擇**：①發射瞬間頓挫：十字星縮到珠心→`freeze` 0.12 秒→新增 `launch` 階段（`tLaunch` 0.12 秒，珠子沿「背離敵人」方向後拉 30px，ease-out）→炸出：`addTrauma(0.8)`、白閃、手機震動、鏡頭 zoom +0.12 瞬間推近、`flysword`＋`hit` 音，進 `dash`（太初替身不經 launch，直接 absorb）。整段約 1.9 秒。②營地選擇：跟師妹說話的最後多一句「今夜要我催動玄天珠的哪一種力量？」→ `showAssistPicker`（`62_hub.js`；全螢幕半透明＋三張選項卡〔太初靈光＝打斷、符陣定身＝控制、太初替身＝護身〕含說明、目前選擇打勾、「保持不變」鈕）；選擇存 `localStorage["qingyun_assist"]`，`loadAssistChoice` 於 `window.onload` 讀回並同步舊選單的 `.assist-seal-btn`；選完 `showHintToast`。`ASSIST_OPTS` 在 `62_hub.js`。無頭驗證：說話→選單出現→選替身→存檔→重新整理後仍是替身；靈光演出 `in→star→freeze→launch→dash` 時序與 trauma 0.8；截圖看過選單；smoke 第 1、3 關 ok。待手機實測：頓挫感是否夠明顯（要更明顯可加長 `tLaunch` 或加大後拉距離）、震動強度、選單是否好按（手機觸控）。

**v0.8.116 玄天珠生圖接入＋演出拉長**（使用者回饋：演出拉到 1.5～2 秒、珠子高度在主角胸口；圖已生好）：①`assets/fx/xtz.webp`（Gemini 黑底 4×4，原圖 2048 → 縮 1024、扣黑底 18、格邊淡出；列 0 珠子脈動、列 1 灰珠、列 2 向右衝刺彗星〔珠頭約在格內 78%〕、列 3 命中爆光）、`assets/fx/xtz_star.webp`（十字星，512×512）、主角前指三格 `assets/mc/41_point_a／42_point_b／43_point_c`（Gemini 洋紅底 2×2，用 `tools/sheet.py` 的 `band_cells`〔cols=2,rows=2〕去背；統一縮放 0.445＝與 `11_thrust` 同大，腳中心 x=450、腳底 y=525；第 4 格〔手舉高〕未用）；已加進 `MC_NAMES` 預載。②`ASSIST_CFG`：`tIn` 0.35、`tStar` 0.8、`tFreeze` 0.12、`dashSpd` 1500（遠處敵人衝刺約 0.3～0.5 秒）→ 整段約 1.6～2 秒；`chestY` 138（珠子繞行高度＝胸口）、`handY` 148（前指指尖）、聚光暗角中心 y-120、替身飛回胸口。③畫法：`drawXtzOrb` 用 `xtz` 列 0／1（尺寸 64／96 px，`lighter`）；衝刺階段改畫列 2 彗星並依飛行方向旋轉（`D.tp*18` 取 3 格循環）；十字星用 `xtz_star`（`2L = 60×s`）；命中 `spawnFx("xtz",3,…)`；營地師妹旁的珠子（`62_hub`）也換成 `xtz` 列 0。無圖時仍退回程式畫。④`tools/missing_ok.txt` 移除 xtz 兩行；啟動時預載 `xtz`、`xtz_star`。無頭驗證：前指三格姿勢切換、胸口高度、十字星、衝刺彗星方向、結束後珠子變灰；smoke 第 1、3 關 ok。待手機實測：整段時長、十字星轉速與亮度（中心偏白）、暗角強度。

**v0.8.115 玄天珠繞身圈＋技能演出（引擎灰盒，美術待生圖）**：使用者構想與決定——①三種協助技（`selectedAssist`：太初靈光〔打斷＋架勢 22，預設〕／符陣定身〔定身 2 秒＋架勢 50〕／太初替身〔無敵＋護魂〕）按建議：靈光與符陣用衝刺版，替身用「珠子飛回胸口」短版；選擇鈕目前只在舊版選單分頁（`data-assist`，主畫面沒有入口，待之後在營地設計）。②用過珠子變灰（保留）。③先用現有圓珠做引擎，再換生圖。**珠子**：`drawXtzOrb`（`54_director.js`）繞主角勻速橢圓（`2.6 rad/s`，用盡 `1.3`；半徑 46×14，`z>0` 畫在主角前、`<0` 在背後，`render` 兩段呼叫），取代 `drawPlayer` 裡舊的背後圓珠。**演出**（`assistStart`／`assistStep`／`assistHit`，`Game.dir.kind==="assist"`，世界暫停、約 1 秒）：`in`（0.2 秒：鏡頭拉近主角〔`camNow`＋`dir.focusX`＝主角〕、聚光暗角 `drawAssistDark`〔世界座標徑向漸層，畫在敵人後、主角前〕、珠子飛到指尖、主角前指）→ `star`（0.42 秒：十字星 3.6→0.6 倍珠徑、轉速 4→50 rad/s 加速）→ `freeze`（0.08 秒定格＋白閃＋「叮」）→ `dash`（珠子以 2400 px/s 衝向敵人胸口、拖尾、鏡頭縮到中點）或 `absorb`（替身：飛回胸口 0.16 秒）→ `assistHit`：命中爆光、**此刻才呼叫 `applyAssistEffect(type)`**（原 `activateAssist` 的效果本體拆出）並結束導演、恢復戰鬥。`Player._pose`＝前指姿勢覆蓋（`65_draw_player`，優先於待機影片格）。**美術掛鉤**（有圖用圖、沒圖用程式畫）：`assets/fx/xtz.webp`（4×4 黑底：列 0 珠子脈動、列 1 灰珠、列 2 拖尾、列 3 命中爆光；現用列 0／1／3）、`assets/fx/xtz_star.webp`（單張十字星）、`assets/mc/41_point_a／42_point_b／43_point_c`（前指三格；沒有時用 `11_thrust` 頂替，需加進 `MC_NAMES` 預載）。無頭驗證：靈光（Boss 進 hurt、珠子變灰）與替身（無敵 2.2 秒）整段流程與結束狀態；截圖確認拉近、暗角、十字星、命中；smoke 第 1、3 關 ok。待手機實測：約 1 秒時長、暗角強度、十字星大小與轉速、衝刺速度。

**v0.8.114 啟動穩定性（使用者回報：重新整理先閃灰盒介面、主角偶爾方塊人、師妹偶爾消失）**：成因＝圖片是「用到才載、載完才畫」，載入前一律畫程式備案。①重新整理 0.25 秒先露出第 1 關戰鬥介面（空暗底＋操作鈕）→ 新增 `#boot-loading` 載入畫面（`02_body.html` 靜態，第一幀就蓋住；`bootGate`〔`91_main.js`〕等 `MC_READY≥16`、`BOOT_KEYS`〔師妹 4 姿勢、山門、山門前柱、營火底〕與所有請求中的 `BG_ART` 載完才淡出，最久 9 秒）。②主角方塊人：`MC_READY` 原本用 `++` 計數，失敗或重複觸發就永遠 `!==16` → 改成每次 onload 重算「實際載入完成的格數」，並加載入失敗自動重試 3 次（`?v=版本&r=n`）；Boss 16 格（`sp.ready`，`_ok` 防重複）與 `getBgArt`（新增 `fail` 旗標）同樣重試。③師妹消失：她的 4 個姿勢原本等姿勢輪到才載（說話／招牌動作那格圖還沒到整個人消失）→ 啟動時全部預載。無頭驗證：慢網路模擬（每個圖 70 ms）0.2 秒載入畫面→淡出→營地主角與師妹完整、無灰盒；smoke 第 1、3 關 ok。**廢棄程式圖**：舊的程式畫備案（主角橢圓／方塊、Boss 灰盒、`LegacyStages`、`81_legacy_story`、舊登場影片碼）仍在，載入畫面後正常情況不會再露出，列為 Beta 期清除項目。

**v0.8.113 第 1 關天空延伸圖（Gemini 生圖）**：使用者用 Gemini 生了新版背景（3170×1344，整張重畫，月亮位置與原圖不同，不能整張用）。取其**最上方純天空**（新圖 x 470～2020、y 0～300〔縮到 2400 寬後〕，避開兩側懸崖與松樹）拉寬到 x 130～2180，以二次曲線只修大範圍色偏對齊原背景頂端，左右懸崖欄位（x<130、>2180）把原圖頂端幾列往上擠出並漸漸融進天空色，三塊「正—鏡像—正」連續疊成 2400×900（鏡像讓星空與色調連續），烘進調暗（`bgDim` 0.28，因為天空畫在調暗之後）、底端 40 列 alpha 淡出蓋接縫 → `assets/bg/arena1_sky.webp`（RGBA，約 30 KB）。`Stages[1].bgSky = "arena1_sky"`；`drawSkyExtension`（`60_render.js`）先畫純色漸層，有 `bgSky` 且載入完成就再畫圖（同背景的左右鏡像補滿與視差，圖底端往下重疊 40 列）；`80_flow` 預載。腳本不在倉庫（做法見此段，可重做）。無頭驗證：下落畫面逐格截圖（星空→接縫→落地）；smoke 第 1 關 ok。待手機實測：接縫那道淡霧是否可接受、星空亮度。

**v0.8.112 第 1 關登場再調（使用者實測六點）**：①進場時 Boss 不再先站在右邊：`Boss._introHide`（`loadStage` 對 `{hub:true}` 營地載入且該關有 drop 登場時設 true，`64_draw_boss` 開頭不畫；`beginBattleIntro` 一開始解除；直接進戰鬥／敗北重打不隱藏，避免 Boss 看不到）。②延伸天空：改成直接取剛畫好的背景頂端像素（含調暗，只取一次，快取在 `BG_ART[key].top`），漸層往上延伸並向下羽化 140px 蓋接縫（`drawSkyExtension`）；使用者問是否改生圖→建議生圖（見對話；若生圖則在 `drawSkyExtension` 優先畫圖）。③下落放慢：`fall` 1.0→1.3。④震動更久更慢：`shake` 1.0→1.6、`shakeRate` 0.45（`cam.shakeRate` 乘在 `render` 的震動噪聲頻率上，頻率放慢＝更沉重；導演結束／`dirReset` 還原 1）、trauma 1.0→0.6。⑤名牌置中（`cy = h*0.5`，可蓋到敵人）。⑥名牌停留 `hold` 0.85→2.05 秒。總長 `dur` 6.0 秒。無頭驗證：營地載入時隱藏→進場解除→登場結束→戰鬥；直接載入不隱藏；截圖確認天空接縫消失與名牌置中；smoke 第 1、2 關 ok。待手機實測：6 秒是否過長、震動頻率手感。

**v0.8.111 第 1 關登場改版（使用者指定新節奏）**：鏡頭跟著 Boss 往下走（`camNow.y = (Boss.y-G)*0.85`，不再夾住；鏡頭超出背景頂端時 `drawSkyExtension`〔`60_render.js`〕取背景圖最上緣平均色往上延伸，不露黑底）→ 落地後 `shake`＝1.0 秒持續高 trauma（1.0→0.7，震動更大）→ 名牌從左快速滑進（`drawNameSlide`，導演時間為準：`tin` 0.22／`hold` 0.85／`tout` 0.3，疊加發光、移動時拖三道殘影、**無黑底**，小字「第一難」跟著走）＋同一刻瞬間拉近到 Boss、停震、`Game.dir.freeze`（特效 `updateHitParticles` 暫停、環境落葉與圍巾暫停）→ 名牌往右飛走時鏡頭縮回戰鬥大小（`camNow.zoom = targetZoom`，rate 7）→ 起身格 `23_rise` → 結束。配樂在名牌滑進時開始。總長約 3.95 秒（`dur` 3.95）。移除舊的蓋章（`slam`）黑底條；`slam` 模式保留但本關不用。無頭驗證：下落鏡頭跟隨（cam.y -591→0）、落地 trauma 0.98→0.72、名牌期間 freeze＋trauma 0＋zoom 1.95、之後縮回 1.0；截圖看過天空延伸與名牌滑動；smoke 第 1、2 關 ok。待手機實測：晃動 1 秒夠不夠「晃一點」、名牌滑進速度與停留、拉近／縮回時機、整體 3.95 秒。

**v0.8.110 過傳送門音量再減半**：`slash` 0.2→0.1、`assist` 0.3→0.15、`execution` 0.22→0.11（`62_hub.js`；相對原值已降為 1/4）。

**v0.8.109 音量減半（使用者回饋）**：①過傳送門：出山門 `slash` 0.4→0.2、門開鈴聲 `assist` 0.6→0.3、進戰場 `execution` 0.45→0.22（`62_hub.js`）。②瞬步閃過敵人：瞬步本身沒聲音，使用者聽到的是閃過後的看破／替身音——踏劍看破 `mikiri` 0.95→0.47（`40_player.js` 兩處）、部位 Boss 看破 1.0→0.5（`53_parts.js`）、替身反切 `assist` 1.0→0.5（`40_player.js`）。處決、破勢硬直的 `mikiri`（Boss 架勢滿，0.95~1.0）未動。若使用者指的是別的聲音再改。

**v0.8.108 第 1 關登場與二階段調整（使用者實測回饋五點）**：①從天而降拉長：`dur` 4.3、`fall` 1.0、`zoomAt` 1.3、`zoomOutAt` 3.15，名牌停留 2.3 秒。②下落時上方露黑底：鏡頭往上看的 `cam.y` 夾在 `-baseHeight/2·(1-1/zoom)`（不超出背景頂端），Boss 改由畫面上緣外落入。③二階段全程紅焰：`DIR_CFG[n].p2Aura`（第 1 關＝`dir1` 列 0、w 330、跟著 Boss、隨放大倍率），`dirAuraTick`（physics 每幀檢查，Boss 倒下即清除；`Game._p2AuraFx`）。④二階段套用第 5 關震飛：`cfg.blast` → 爆發時呼叫 `blastPlayer`（沿用 `updateBlast`；導演凍結期間由 `dirPlayerStep` 讓主角照飛，剩下的滑行／駐地／起身在導演結束後由一般 physics 接手；主角關鍵格 `mc/17_slide`、`18_plant`、`19_rise` 本來就有，不需補）；鏡頭在震飛期間改對焦雙方中點。⑤二階段放大：`cfg.grow` 1.18（爆發後 0.5 秒由 1 放大，結束時 `Boss._scaleMul`＝1.18 並同步放大 `Boss.w／h`；招式 `range` 未放大＝視覺比判定長，對玩家安全）。無頭驗證：震飛飛行→駐地→起身、放大倍率與 bw 118、結束後紅焰仍在、Boss 照常出招；smoke 第 1、2、3、5 關 ok。待手機實測：放大倍率是否剛好、紅焰大小、震飛的距離與鏡頭、二階段重新打的節奏。

**v0.8.107 第 1 關專屬階段轉換特效圖**：使用者用 Gemini 生了 `assets/fx/dir1.webp`（原圖 2048×2048 JPG → 縮成 1024、扣黑底 18 並重新拉伸、各格邊緣淡出〔氣焰與光柱底邊不淡〕；4×4：列 0 氣焰循環、列 1 正圓紅環〔引擎壓扁 0.4 成地面橢圓〕、列 2 光柱、列 3 聚氣）。`DIR_CFG[1].phase` 改用 dir1；導演新增 `gather`（蓄勢時光點向 Boss 匯聚，播滿整段蓄勢時間；`D.gather`）。第 2、3 關仍借用現有特效圖，等使用者生 `dir2`、`dir3`（提示詞已給，換圖只改 DIR_CFG 的 sheet／row，並在 `Stages[n].fxSheets` 預載）。無頭驗證：蓄勢（聚氣＋氣焰）→爆發（環＋光柱）→結束；截圖確認位置與亮度；smoke 第 1 關 ok。

**v0.8.106 第 1 關「從天而降」登場（戴夫式 Boss 登場）**：使用者想要「從天而降→落地震動→畫面突然拉近到敵人→稱謂彈出」。`DIR_CFG[1].intro` 改為 `kind:"drop"`（`dropStep`，`54_director.js`）：Boss 由上方落下（`G - height·(1-k²)`，鏡頭先往上看、陰影隨高度變大，沿用 `Game.dir.c.kind==="drop"` 讓 `64_draw_boss` 的影子與縮放走空中邏輯）→ 落地（塵浪 `land` 列 1、衝擊環 `land` 列 0、震屏 0.95、命中停頓 110 ms、閃白、`execution` 音）→ `zoomAt` 瞬間拉近（`Game.dir.camNow = {zoom, y, rate:60}`＝約一幀到位，垂直對焦用新的 `cam.y`，`60_render` 的鏡頭變換已加 `- cam.y`）＋白閃＋放射速度線（`drawDirOverlay` 程式畫，備案，之後可換生圖）＋黑暗角 → 0.18 秒後名牌**蓋章**（`bossNameCard(st,{slam,sub,dur})`：2.6 倍砸到 1.0、過衝回彈、震動、半透明黑底條；小字 `sub`＝「第一難」）＋關卡曲此刻開始 → `zoomOutAt` 拉回、起身格 `23_rise` → 結束。總長 3.5 秒、戰鬥全程暫停。其他參數：`fall` 0.85、`height` 760、`zoomAt` 1.15、`zoomOutAt` 2.65。第 2、3 關登場仍是 v0.8.105 的「跪姿→爆發」，等第 1 關手感確定後再各自設計（第 5 關狼：撲出；第 3 關：疾衝；第 2 關：鏡碎現身）。拉近用 Boss 立繪本身（900×600，畫在 0.64 倍），拉近約 1.9 倍仍夠清楚。無頭驗證：下落→落地→拉近→蓋章→拉回→結束時序、截圖確認；smoke 第 1～3 關 ok。**待手機實測**：下落速度、落地震動強度、拉近是否夠「突然」、名牌蓋章的大小與停留時間（1.9 秒）、速度線、整體 3.5 秒會不會太長。

**v0.8.105 戰場上的登場／階段轉換導演（取代第 1～3 關的影片過場）**：使用者試玩後覺得影片過場突兀，決定改成像九日、空洞騎士那樣「留在戰場上」演（登場也改）。新檔 `src/54_director.js`（manifest 在 53 之後）：`DIR_CFG[關卡] = { intro, phase }`，每段設定 `dur`／`burstAt`（爆發時刻）／`poses:[[秒,格名]…]`（用 `Boss._cineImg` 擺姿勢，17_kneel 取自 `SP.death.kneel`）／`tint`＋`tintA`（暗角變色）／`aura`（氣場，循環跟隨 Boss）／`ring`（地面衝擊波環）／`pillar`（光柱）／`title`（書法橫幅）／`sfx`／`name`（登場爆發時出名牌）。`dirMode:true` 的關卡由 `stMovie(st,key)` 回傳 null，不播 introMovie／p2Movie（檔案與設定保留，把 `dirMode` 拿掉就切回影片）。**流程**：`Game.dir`（physics 在 `Game.cine` 之後 `dirUpdate`，戰鬥暫停、鏡頭沿用登場推近 `introOn`、特效照跑）→ 爆發：換曲（階段＝`STAGE_BGM_P2`，登場＝`STAGE_BGM`）、第 3 關在此刻 `applyP2Stance` 換重劍、衝擊波把近身玩家推開、閃白＋震屏＋命中停頓＋橫幅 → 結束：Boss 回待機（`aiCooldown` 0.7）、玩家無敵 1.2 秒、登場結束後 0.35 秒才跳開場對話。入口：`beginBattleIntro`（登場）、`bossPhaseCinematic`（階段）。目前第 1 關：跪姿＋紅氣焰（`boss2` 列 3）＋紅衝擊環（`land` 列 0）＋光柱（`ult` 列 3）、「煞氣暴走」；第 2 關：跪姿＋八卦風圈（`boss2fx` 列 2）＋白環（`exec2` 列 3）、「真假難辨」；第 3 關：跪姿＋陣紋（`boss3bfx` 列 2）、爆發換重劍＋拔劍爆氣（`boss3bfx` 列 3）、「拔劍・玄鐵」。**借用現有特效圖**；之後可請 Gemini 生每位 Boss 專屬的氣場／衝擊波 4×4 黑底圖替換（只改 DIR_CFG 的 sheet／row）。第 4 關暫仍用影片（有自己的部位轉場）；第 5～9 關日後同樣加 DIR_CFG。無頭驗證：三關登場與階段轉換姿勢、特效、第 3 關換姿態、結束狀態；smoke 第 1～3 關 ok。**待手機實測**：演出長度（登場 2.5 秒、階段約 2.6 秒，全程暫停戰鬥）、氣場位置與亮度、第 3 關爆發是否太白、暗角顏色、是否還需要「最後 0.3 秒就還控制權」。

**v0.8.104 第 4 關三支影片**（純文字生影片、日式賽璐璐、8 秒有聲、loudnorm -16 LUFS）：①登場「劍塚甦醒」`assets/boss4/intro`（Gemini 原片 8 秒，6.85 秒後劍突然反向〔劍尖變朝上〕，已剪到 6.85 秒，結尾由引擎淡出到黑）；②「巨劍崩解成六劍」`assets/boss4/form`；③「古靈降臨」`assets/boss4/p2`（人形白髮古靈由光柱凝成）。`Stages[4].introMovie／formMovie／p2Movie`。**引擎**：新增 `formMovie`＝三道封印盡斷進劍陣時（`formationStart` 結尾，850 ms 後 `formMovieStart`，期間關卡曲壓成無聲、播完恢復，劍陣冷卻 `cd` 至少 1.6 秒、無敵至少 1 秒）；`p2Movie` 仍在六劍盡落時（`partsToPhase2`）播；`80_flow.js` 預載 formMovie。無頭驗證：封印斷→劍陣→影片 0.85 秒後開始、期間戰鬥凍結、播完恢復；六劍盡落→p2 影片→三階段；smoke 第 4 關 ok。**待手機實測**：三支影片載入時間（各約 1.3～1.7 MB）、閃白與影片切入的銜接、影片時機、劍陣開始時六把劍是否從原巨劍位置出來、音量。登場影片未做完整流程無頭測試（沿用第 3 關已驗證的 `introMovie` 路徑）。

**v0.8.103 第 3 關二階段影片**：`assets/boss3/p2.mp4／webm`（6.5 秒、1280×720、有聲、loudnorm -16 LUFS，各約 2 MB）。`Stages[3].p2Movie`。**剪接做法（使用者拒絕過的方案，留作教訓）**：Gemini 原片（跪姿雙劍插地→起身→雙劍收腰→拔重劍）中段雙劍變形消失；第二支只有背影拔劍；剪法＝前片 0～2.12 秒（正面跪姿）→ 竹葉掃過換景（用使用者生的竹葉影片，底色 #F251A6 逐幀去背＋邊緣壓成深綠描邊，加速 2.2 倍，另疊 0.7 秒淡綠白薄霧蓋切點）→ 新片 3.0～5.75 秒（背影拔重劍）→ 長白光（亮起 0.4、全白約 0.3、退去 0.4）→ 前片 6.25～結尾（正面全身定格）。曾試過溶接、短白光、甩鏡模糊（使用者都不滿意）與圖生影片補接（畫風、場景、劍形全跑掉）。剪接腳本與素材不在倉庫。**引擎**：`onBossPhase2` 對「有 p2Movie 且有 stanceByPhase」的關卡不播 `stance_switch`，只設 `Boss._p2MoviePending`；`bossPhase2Movie` 一開始呼叫 `applyP2Stance`（影片開始時才換姿態，招式進行中先收回待機；影片沒播成也會換）；待機 AI 的補播拔劍加了 `!_p2MoviePending`；`illusionReset` 清旗標。無頭驗證：影片前 0.85 秒仍雙劍、影片開始換 B、無拔劍招式、播完出重劍招式；smoke 第 3 關 ok。待手機實測：影片載入時間、白光與竹葉節奏、影片音量、二階段曲在影片結束時才換。

**v0.8.102 第 4 關核心突進圖接入**：`thrust_peril`（【危】劍魂突進）的 `fxAct` 改成陣列：原箭形拖尾（boss4fx3）＋光球彗星（`boss4fx2` 列 3 第 3、4 格，`follow:true` 跟著劍魂衝刺，`ox:-100` 讓球頭落在身上、尾巴拖在後）。`spawnMoveFx` 新增 `follow` 欄位（偏移鎖定出招時面向）。判定、時間未改。驗證：check／smoke 第 4 關 ok；無頭測試確認 active 時特效生成並跟隨、收招後清除。待手機實測：光球大小（w 420）與亮度會不會蓋住劍魂與預警。

**v0.8.101 第 3 關登場影片**：竹林拔劍（池畔石階、背影鏡頭繞到側面拔雙劍、拉遠劍交叉震出水環）＝`assets/boss3/intro.mp4／webm`（6.9 秒）。`Stages[3].introMovie`；舊剪影＋飛劍聚合登場（`introBg／introCine／introVideo／introDash／introAppear／introA／introFlash／introAppearCfg／introSfx`）已移除。**教訓（影片提示詞）**：第一版分鏡切了 5 次，銜接不順；修正版改成連續運鏡（最多 2 處轉場）、鎖定單一地點與色調、明寫白靴。Gemini 實際仍把「繞到側面」做了兩次，用 ffmpeg 剪掉重複的 3.5～4.5 秒並 0.25 秒溶接。**待辦**：第 3 關二階段影片（連續運鏡版提示詞已給，未生成）；接上時要處理 `transformMove`／`phaseSwitchMove`（拔重劍招式）與影片的先後，影片開始時就該換成重劍姿態。

**v0.8.100 第 2 關影片過場**：同第 1 關做法（日式賽璐璐、純文字生影片、8 秒有聲、loudnorm）。登場「千鏡一影」（鏡片映出微笑臉→穿過鏡環→真身睜眼翠光→收扇鏡片炸碎＋分身一圈收攏→低角度定格淡黑）＝`assets/boss2/intro.mp4／webm`；二階段「真假難辨」（扇裂、陣紋熄滅→重燃→罡風、分身數十個→衝擊格→夜空數百飛劍→睜眼指鏡頭）＝`p2.mp4／webm`。`Stages[2].introMovie／p2Movie`；舊的剪影＋鏡片聚合登場（`introCine／introVideo／introDash／introAppear／introA／introFlash／introSfx`、`introBg`）已移除，`assets/boss2/intro` 舊檔被新片覆蓋，`S2.sfx.introSwirl／introLand` 暫留未用。二階段影片播完後，`onBossPhase2` 設的 `_splitPending` 會讓他立刻放一次分身（呼應影片）；`b2_p2` 二階段曲改在影片結束時才換。無頭驗證：登場與二階段播放、淡入淡出、結束皆正常。

**v0.8.99 第 1 關影片過場（日式賽璐璐風）＋影片淡入淡出**：使用者決定影片改日式賽璐璐動畫風（只限影片，圖仍依風格聖經）、不必對應首格、重點是魂系的震撼感；純文字生影片（提示詞見對話：登場＝空橋→靴與戟拖火花→仰拍臉睜眼泛紅→戟插地衝擊波→低角度英雄定格淡黑；二階段＝單膝跪地→紅色血脈爬過石橋→怒吼、紅柱衝天、衝擊格→戟指鏡頭定格）。`assets/boss1/intro.mp4／webm`（8.1 秒、1280×720、有聲、loudnorm -16 LUFS，約 1.5 MB）取代舊的崖頂剪影影片；`p2.mp4／webm` 為二階段。`Stages[1].introMovie／p2Movie`（舊 `introCine／introVideo／introBg` 已移除，`assets/bg/intro1.webp` 與 `assets/boss1/20_jump` 等躍下演出素材暫留未用，Beta 期清除）。**引擎**（`61_cine.js`）：`playMovie` 新增 `fadeIn`（預設 0.6 秒）／`fadeOut`（0.8 秒）→ 影片畫面與音量由 `movieAlpha` 控制（開頭由黑淡入、結尾淡出到黑），影片結束 `screenFlash` 黑場 0.8 秒淡回戰場；靜音設定（`Sound.muted`）會讓影片靜音。**一般關卡二階段影片**（新，`82_dialogue.js`）：`bossPhaseCinematic` 結尾若 `stage.p2Movie` 且非部位 Boss（`!stage.parts`）→ 850ms 後 `bossPhase2Movie`（讓閃白與慢動作先演完）；影片期間 `Music.duck(0, 長度+0.5)` 把關卡曲壓成無聲、結束時 `duckUntil=0` 立即恢復並換 `STAGE_BGM_P2`（`50_boss_ai.js onBossPhase2` 對有二階段影片的關卡不再立刻換曲）；播完給 0.7 秒喘息（`introT`）。可用「跳過」。第 2、3、5 關要二階段影片只要設 `Stages[n].p2Movie`（第 3、5 關有蛻變／拔劍招式，接上時要確認和 `transformMove`／`phaseSwitchMove` 的先後）。無頭驗證：登場播放→淡入淡出→結束；二階段 0.85 秒後切入、音量淡入淡出、播完恢復。待使用者手機實測：影片載入時間（兩支各 1.5～1.9 MB）、淡入淡出速度、音量、二階段切入時機是否順。\n\n**v0.8.98 主角補 12 格關鍵格**：`assets/mc/29～40`（`tools/sheet12.py` 切圖：4×3 洋紅底，逐列 band 去格線並濾掉殘留細線，基準高度 434＝新格縮放 0.775，腳底 y=525）。接入（`65_draw_player.js`，每組都檢查圖載到才用，否則退回舊格）：招架 29 預備（前 90ms 涵蓋完美窗口）→ 30 架開（彈開後 220ms 內一律用 30）、架勢結束後 170ms 用 31 收勢；瞬步 33／34／35 依 `stateTimer` 的 0.22 秒分 25%／50%／25%（空中只用 34）；受擊 36（前 0.12 秒）→ 37（後段，破勢 staggered 也用 37）；蓄力重斬 `MC_ATK[4]` = 38／39／40（總長 0.32 秒），蓄力按住 150ms 後用 38 高舉；起跳 32（離地前 40px）。舊的單格 13_parry／14_dash／16_hurt 當退回格保留。注意：新格比舊格縮放是目測（腰帶與頭大小）定的，待使用者手機實測大小是否一致。

**v0.8.97 主角待機改影片抽幀**：`assets/mc/idle_01～24.webp`（Gemini 圖生影片，綠幕 4 秒 24fps，每 4 格取 1 格共 24 格，縮放與 01_idle1 同高 476、腳底 y=525；同一組縮放位移套全部格，保留身體微晃）。`64_draw_boss.js` 載入 `MCI_IMGS`，`65_draw_player.js` 待機分支依時間 4 秒循環播放，相鄰兩格淡入淡出（`idleNext`／`idleMix`）；沒載齊時退回舊的兩格待機。**生影片的教訓**：提示詞不可要求頭髮擺動（模型會把馬尾拉長）；要選 16:9 橫式，直式會裁掉頭頂；髮型要具體描述（短馬尾、尾巴到頸部）。

**v0.8.96 主角角色殘影**：瞬步、出刀衝步、下劈時每 0.035 秒留一張半透明角色剪影（`51_physics.js` 取樣、`60_render.js` 以 `silImg` 繪製；顏色：地面瞬步淡藍、出刀淺藍、空中淡綠，最多 14 張），取代舊的藍色方塊（有角色圖時方塊不再畫）。待手機實測濃度與長度。**主角進階製作計畫（使用者 2026-11-07 同意 1、2、3 都做）**：①補單格動作的中間格（招架、瞬步、跳躍、受擊、蓄力重斬，普攻三拍已有）；②待機改影片抽幀（呼吸、衣擺髮絲）；③殘影（本版完成）。①②要使用者用 Gemini 生圖／影片，提示詞待給。

**v0.8.95 蓮花劍（fs2）、蝠翼劍（fs4）斷格重生**：`fs24`、`fs44` 換成真的斷成兩截的圖（沿用完整劍的縮放與劍首對齊，最下方碎片因畫布高度被裁掉）；v0.8.93 記的「斷格沒斷」已解決。

**v0.8.94 第 4 關攻擊特效與預警改生圖**（使用者提醒：能不用程式畫就不要）：`assets/fx/boss4fx3.webp`（黑底 4×4，列 0 驚鴻斬弧；列 1 前 2 格環劍旋斬、後 2 格劍魂突進拖尾；列 2 前 2 格掃地劍氣、後 2 格橫穿／合圍拖尾；列 3 前 2 格插地漣漪、後 2 格擊落碎裂）與 `boss4warn.webp`（列 0 劍落紅線、列 1 地面危險橢圓、列 2 橫掃預警條、列 3 合圍箭頭；每列 4 格由淡到強，依前搖進度選格）。引擎：`spawnFx`／`spawnMoveFx` 新增 `c0`（起始格）、`nf`（播幾格）；`S4.arcArt = "boss4fx3"` 關掉程式刀弧；`53_parts.js` 新增 `warnDraw`／`warnArt`（地面預警與劍雨圈改畫生圖，圖沒載到才回退舊程式畫法）、`plantFx`。古靈四招已掛 fxAct／fxHit。劍陣預警原本沒有畫（只畫 P.act／side／rain），現在 P.facts 也畫。未改：封印環與插地劍光暈（仍用 boss4fx 生圖）、核心突進圖（boss4fx2 列 3 第 2、3 格）未接。

**v0.8.93 六劍陣接 4 種劍圖**：`assets/boss4/fs{1～4}{1,2,4}.webp`（Gemini 4×3 洋紅底，列＝平時／蓄氣（刻字發光）／斷；fs1 大刀、fs2 蓮花劍、fs3 青銅環首短劍、fs4 蝠翼劍；300×411、劍首在上中、各列依自身高度縮放，fs3 斷劍借 fs1 斷列比例；切圖腳本 `/home/claude/cut/fs.py` 不在倉庫）。`form.designs` = fs1/fs3/fs2/fs4/fs1/fs3。注意：fs2、fs4 的「斷」格其實沒斷（只是少了穗子），落地後看起來仍完整，若要改需重生這兩格。

**v0.8.92 第 4 關改三階段**（使用者提案、照 Claude 建議定案）
- 一階：只有主劍（`parts.pool` 天劍斬落 44／橫掃 34／劍雨 22），插地時蓄力斬斬封印，3 道斷 → `formationStart()`：主劍炸開分成六劍。
- 二階：六劍陣（`parts.form`：`slots` 站位、`lift` 高低、`designs` 劍圖前綴（暫用 ls／rs 交替，之後補 4 種）、`pool`、`cd`、`fastK`）。每把劍出招後插地 1.4～1.5 秒（`h.planted`）＝唯一可打時機，蓄力斬一次打落（`swordDown`，落地的劍留在場上斷劍圖），普攻只鏗一聲。招式：劍落（閃）、劍氣三連（招架，發完插地）、【危】劍陣橫穿（瞬步）、【危】雙劍合圍（剩 2 把才出，兩把從左右貼地夾擊，跳）。同時出手數 `formConc`：6～5 把 1、4～3 把 2、2～1 把全上；cd 0.9／0.75／0.55；剩 2 把起前搖 ×0.85。折射飛劍、招架架勢在劍陣不作用。6 把全落 → `partsToPhase2`（過場影片、換曲）。
- 三階：人形古靈（同 v0.8.90，處決 2 次）。HUD：一階封印 ●、二階劍 ◆。
- 驗證：t4b.js（三封印 → 劍陣 → 逐一擊落 → 轉場 → 三階）、剩 2 劍時四招輪替、合圍跳過不受傷。

**v0.8.91 古靈補充 4 格**（`assets/boss4s/22_sweep_wind`／`23_fly_launch`／`24_rain_wind`／`25_spin_rec`，`sup.py` 依元件分人、以第 2 格身高對齊 idle 479px）：掃地起手改 22（與驚鴻斬的 07 舉劍分開，解法不同起手不同）、劍指飛劍出招 23、萬劍歸宗起手 24（劍尖略超出 900×600 畫布上緣被裁）、環劍旋斬收招 25。

**v0.8.90 第 4 關改「劍陣」＋二階段人形劍魂**（使用者試玩：巨手形狀與動作怪、右手幾乎不動、場景太亮、橫掃看起來跳不過、招架飛劍背對、核心太亮、一次處決就贏太簡單）
- 一階段兩隻巨手 → 左右兩把浮空副劍（`assets/boss4/ls1～4`、`rs1～4`：1 平時、2 蓄氣、3 裂（未用）、4 斷；劍尖朝下直立、劍首在上中）。引擎沿用 hands 結構：`(h.x,h.y)`＝劍尖、`h.ang`（0＝劍尖朝下，`-d·π/2`＝指向 d）、`SWORD_L`=300。招式改名：副劍落（palm，懸在頭上→插地，插地時可砍）、劍氣三連（finger，橫指主角發三道劍氣）、【危】劍陣橫穿（grab，橫向貼地穿過，瞬步閃）。受擊框只在劍壓低時存在（最低點 > G−125）、崩斷的不算；`partsAimX` 封印優先 220px。左右副劍 75% 輪流出手（`P.lastHand`）。舊巨手圖 h01～h12 留在 assets 未用。
- 二階段：核心球不畫，改人形古靈（`S4.sprite = "boss4s"`，動作表 16 格：03/04 飄移（05/06 複製）、20 旋斬起手、21 旋斬；倒地 17～19 自切），各招用 `frames` 指定格。新增【危】劍魂掃地（sweep_peril，跳）。`S4.execKill = 2`：二階段處決 2 次才擊敗（第 1 次血量砍到剩一半），`Boss._ekN` 計次。兩側副劍偶爾落劍改 9～13 秒一次。
- 場景調暗：bgDim 0.12→0.42、地面帶 dim 0.32、前景 0.5。橫掃劍氣特效 600×360→560×230、壓低到 G−85。
- 招架轉向：部位 Boss 時 `doParry` 面向 `partsThreatX()`（最近來襲飛劍 → 出招部位 → 巨劍）。
- 驗證：t4.js 全流程（封印 3 道 → 轉場 → 二階段招式輪替 → 處決 1 次剩 1200 → 第 2 次擊敗 → 結語對白）、smoke 九關。

**v0.8.89 影片過場引擎（魂系登場／換階段）**：`Stages[n].introMovie`／`p2Movie`（不含副檔名，mp4 或 webm）。`playMovie(base,{audio,onEnd})` 沿用 `Game.cine`（`movie:true`）：戰鬥全停、畫面只畫影片（等比置中黑邊）、專用「跳過」鍵＋確認、影片沒載好回 false 走備案。登場：從營地走進戰場時播（敗北重打不播），影片有聲、播完才開始一階段配樂並出名牌；沒影片則直接出名牌。換階段（第 4 關）：`partsToPhase2` 封印全斷時播 `p2Movie`（靜音），開播即切 `STAGE_BGM_P2`，播完跳到轉場尾段（核心已降下）。第 4 關已掛 `assets/boss4/intro`、`p2`，等使用者生影片。

**v0.8.88 第 4 關配樂**：使用者生成兩首（spirit_of_the_bound_blade 3:04、the_bronze_blade_s_last_stand 3:02，約 -12 LUFS 不需加減），尾端 0.8 秒淡出、opus 80k → `assets/music/b4_p1.webm`（一階段）、`b4_p2.webm`（二階段，`STAGE_BGM_P2[4]`，在 `partsTransStep` 巨劍崩碎那一刻換曲）。
- 使用者想法（討論中）：開場動畫改成像一念飛仙那樣的 Gemini 角色動畫影片（魂系 Boss 登場，不再用「背景＋剪影首幀」生成）；進二階段也播一段過場動畫並在那時切第二首歌。

**v0.8.87 第 4 關美術第 2、3 批（部分）**：`assets/bg/arena4.webp`（古靈背景，已含半透明古靈身體，程式灰盒身體以 `art.bgBody` 關掉）、`arena4_ground／arena4_fg.webp`（地面帶、前景，`S4.layers` 參數同第 5 關）、`assets/boss4/name.webp`（名牌，非 introCine 關卡現在也會走 `bossNameCard`：`S4.introName`）、`assets/fx/boss4fx2.webp`（4×4：列 0 天劍落地衝擊（0～3）、列 1 橫掃劍氣、列 2 指劍劍氣 0～1／劍雨落地 2～3、列 3 巨劍崩裂 0／崩碎 1／核心突進 2～3）。已接：天劍落地、橫掃、巨掌壓落、劍雨落地、巨劍裂與碎。**未接**：核心突進（列 3 第 2、3 格）、指劍飛劍仍用 boss4fx 小劍（可改列 2 第 0、1 格箭形）、開場影片、專屬音效與兩階段配樂。待看：古靈身體在鏡頭內是否夠看得見。

**v0.8.86 巨手重做（手背朝前、拇指朝上）**：Gemini 生不出一致的 12 格，改用兩張圖拼：待機／壓落／抬起／結印／崩勢取自第一張（紅點格，原樣），舉掌／貼地／指劍蓄勢與刺出／擒拿蓄勢與橫抓／握拳取自補生表（拇指在下的格上下翻轉）。玉墜全部去掉（只留紅繩，翻轉後才不違反重力），切圖腳本 `/home/claude/art4/cut_h2.py`（不在倉庫）。已收到、待接入：第 2 批特效（4×4 黑底）、古靈背景、劍塚地面帶與前景、名牌「萬劍古靈」。

**v0.8.85 第 4 關美術第 1 批接入（巨手、巨劍、核心／封印／小飛劍）＋畫布底色**
- `assets/boss4/h01～h12.webp`（Gemini 4×3 右手、洋紅去背＋手腕霧去紫邊，0.5 倍，下緣中點錨點；圖手指朝右，遊戲依招式鏡像）：01 待機、02 舉掌、03 壓落、04 貼地、05 指劍蓄勢、06 指劍刺出、07 擒拿蓄勢、08 擒拿橫抓、09 握拳、10 崩勢（金裂紋）、11 抬起、12 二階段結印待機。對應在 `handPose`。
- `sw1／sw2／sw3.webp`（0.6 倍，畫時 ×`swK` 0.667；sw1 平時、sw2 插地發光（粉紅光暈已改金）、sw3 碎裂前 0.35 秒）。插地劍尖改 G+256，劍柄三個環在劍尖上方 416／442／470（`S4.parts.art.ringY`），封印環用 `boss4fx` 列 2 疊加（插地時亮、平時淡）；斬斷播列 2 第 2→3 格。
- `assets/fx/boss4fx.webp`（黑底 4×4，同列同縮放置中、壓黑位、邊緣漸隱）：列 0 核心呼吸、列 1 核心蓄光（出招依進度）、列 2 封印環、列 3 小飛劍（`S4.flySwordArt` 指劍劍氣與核心飛劍；核心繞身飛劍、劍雨落劍也用它）。
- 舉掌前搖高度改 G−320→G−270（直立手格上緣留在畫面內）；巨手受擊寬度 hw 100→120。
- **畫布底色**（`render` 開頭）：先畫與 `#game-container` 相同的徑向漸層，畫布變不透明。原本程式繪製背景的關卡（4、6～9）有半透明處，黑底發光圖用 lighter 疊加時會出現黑方塊（mark 預警圈、boss4fx）。外觀不變。
- 驗證：check 0 錯誤；smoke 九關 ok；第 4 關逐招截圖與無頭測試結果同 v0.8.83。
- 第 4 關美術剩：第 2 批專屬特效（天劍落地衝擊、橫掃劍氣、巨掌震波、劍雨落地、巨劍崩碎、核心突進）、第 3 批場景與演出（古靈背景身體、劍塚地面帶與前景、名牌、開場影片）、Boss 專屬音效與兩階段配樂。

### 第 4 關 萬劍古靈 設計卡（2026-11-06 使用者定案，M3 單關七步之①）
- **教什麼**：從彈刀對拼換成「看位置、抓時機、用蓄力斬」。蓄力斬（按住攻擊 0.45 秒，`Progress.unlockedStages >= 4` 解鎖，耗 25 劍勢）是這關的破關工具。劇情（之後寫）：古靈要「一次給予夠大的攻擊」才斬得斷封印。
- **畫面**：古靈大身體半透明隱在霧裡放背景層（不可打、不擋路）；前景只有兩隻巨手＋一把巨劍，各有受擊範圍與破綻。鏡頭拉遠約 0.85。場地劍塚：地上插滿殘劍只做景深裝飾，不當障礙。
- **一階段：斬斷三道劍柄封印**（無血條，顯示「封印 ●●●」）
  | 招式 | 出招 | 玩家應對 |
  |---|---|---|
  | 天劍斬落 | 巨劍高舉、地面紅線預警、垂直砸下 | 閃開；巨劍插地約 2 秒露出一道封印，**只有蓄力斬能斬斷**（普攻無效或只有火花提示） |
  | 【危】橫掃千軍 | 巨劍貼地橫掃 | 跳過 |
  | 巨掌壓落 | 地上手影逐漸變大 | 走出手影；落地後停約 1 秒可砍手打架勢 |
  | 指劍三連 | 手指點出三道劍氣、間隔 0.4 秒 | 逐一招架 |
  | 萬劍歸宗 | 劍雨三波、落點先標記 | 走位 |
  | 【危】巨手擒拿 | 巨手抓來 | 側閃 |
- **轉場**：第三道封印斷 → 巨劍碎裂 → 古靈長嘯 → 劍魂核心降到地面。
- **二階段：劍魂核心**（使用者選打核心）：核心浮在人高、有血條與架勢條，回到彈刀戰；繞身飛劍：環劍旋斬（招架）、核心突進（看破）、劍雨（更快）；巨手退到兩側偶爾壓掌。架勢滿 → 處決結束。
- **部位 Boss 引擎（第 7 關沿用）**：`Boss.parts[]`（位置、受擊範圍、血量、可否被打、蓄力斬倍率）；主角攻擊先判部位；AI 依部位狀態選招（巨劍插地時不出橫掃）；介面依階段切換封印計數／核心血條；鏡頭依階段縮放。
- **順序**：②方塊版灰盒（全部招式＋兩階段）→ 使用者手機打「好玩嗎？」→ ③生圖（古靈背景身體、巨手關鍵格、巨劍、封印、核心、專屬特效、劍塚場景，最後開場影片與名牌）。難度介於第 3 與第 5 關之間。

**目前進度與待辦（2026-11-07，v0.8.92）**
- 使用者實測回報：第 1 關難度還行（不調）；第 2 關分身「有點難，但多打幾次可以突破」＝符合「初見約 3～6 次過關」目標，暫不調（若之後要降：`ILLU.life` 14→10、`counterDmg` 90→70、幻影近戰同步改隔一招一次）。
- 第 2 關待確認：開場影片在手機是否順、影片音效時間點、名牌在亮背景是否夠清楚。
- 第 3 關（莫寒川）：關鍵格、專屬特效、地面帶、前景、名牌、開場影片都已接（v0.8.59～v0.8.64），待使用者手機實測（開場影片、特效亮度、難度）。
- M2 剩：第 3、5 關數值實測（使用者手機實測回報）。
- 待觀察：v0.8.66 第 2 關 smoke 一次「招式只出現 1 種」（Boss 最低血量 1498），之後 5 次＋二階段 6×40 秒專測都無法重現。
- 第 2、3 關專屬音效（v0.8.67、v0.8.68）、兩階段配樂與營地配樂（v0.8.69～70）、第 2 關飛劍圖（v0.8.66）已接，待手機實測（音量平衡、循環接縫、飛劍高度與判定）。
- 第 5 關（v0.8.79～v0.8.82 大小狼全招式關鍵格、倒地、地面帶與前景、第二張特效圖、小狼放大 0.72）、第 1／2 關補關鍵格（v0.8.81）、起手下限（v0.8.80）：待使用者手機實測（小狼出招是否看得清、白骨刺陣預警、落地光罩亮度、統領遲刃停頓、新格與站姿大小是否跳）。
- 使用者實測第 4 關灰盒（2026-11-06）：「玩起來很讚」→ 灰盒過關，數值暫不調。
- **下一步（第 4 關，v0.8.95）**：劍陣 4 種劍圖（v0.8.93、斷格 v0.8.95）與攻擊特效／預警生圖（v0.8.94）都已接入，待使用者手機實測：一階節奏、劍陣插地擊落時機、雙劍合圍、三階處決 2 次、場景暗度、新特效大小位置與亮度、斷劍斷口是否夠明顯（不夠就請 Gemini 把兩截拉開）。之後：核心突進圖（boss4fx2 列 3 第 2、3 格）未接；重定影片風格後給登場與二階→三階過場影片提示詞（引擎已就緒：`S4.introMovie`／`p2Movie`）；專屬音效（給英文搜尋關鍵字或 ElevenLabs 提示詞，每句寫秒數）。舊巨手圖 h01～h12、未用的 boss4fx 核心列可在 Beta 期清除。
