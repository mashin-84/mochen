# 單關製作標準流程（第 1 關定案版，v0.8.125）

> 第 2～9 關照這份做。目標：**全部生圖／真實音檔，不用程式畫**；每關用 `tools/audit_fx.js` 驗收到 0 個盲點。
> 風格聖經（每份生圖提示詞開頭都要貼）在 `CLAUDE.md`「生圖提示詞規則」。下面的提示詞模板用 `[STYLE BIBLE]` 代替，使用時整段貼上。

## 一、總流程（誰做什麼）

| 步驟 | 產出 | 誰 | 驗收 |
|---|---|---|---|
| 0 設計卡 | 招式表（每招要玩家用哪個動詞回應）、二階段新招、登場／二階段演出構想 | Claude 提案、使用者同意 | 先載入 `mochen-action-combat` skill |
| 1 角色圖 | 動作表 16 格＋補格、倒地 3 格、半身像、名牌（書法） | Gemini 生、Claude 切圖（`tools/sheet.py`／`sheet12.py`）| 載入無缺格（smoke 抓缺檔） |
| 2 場景圖 | 背景、地面帶、前景（洋紅底去背）、**天空延伸圖**（只有「從天而降」登場才要） | Gemini／Claude | 截圖看接縫 |
| 3 專屬特效圖 | 見第三節 T2～T4（每關 2～3 張 4×4 黑底） | Gemini 生、Claude 處理 | `audit_fx` 清零 |
| 4 招式資料與接入 | `Stages[n].moves`、`pool`、`fxAct`／`fxHit`／`bulletArts`／`fxVanish`／`fxAppear`、`sfxClass` | Claude | check／smoke |
| 5 登場與二階段 | `DIR_CFG[n]`（戰場上演出，**不再用影片**）＋該關專屬氣場圖（T4） | Claude | 無頭測試＋使用者手機 |
| 6 音效 | 先用武器類別音效庫（`sfxClass`）；真正特殊的招式才生專屬音（ElevenLabs，每條寫秒數） | Claude 配、使用者補生 | `audit_fx` 的音效欄位 |
| 7 配樂 | 一階段、二階段各一首（`STAGE_BGM`／`STAGE_BGM_P2`），loudnorm＋尾端淡出 | 使用者生、Claude 接 | 手機聽 |
| 8 實測與調數字 | 使用者手機實測，Claude 調數值（只動窗口與前搖，先不動傷害） | 使用者＋Claude | 回報表（第五節） |

## 二、全關共用資產（已做好，**不用重生**）

| 檔案 | 內容 |
|---|---|
| `fx/spark` | 命中（列 0）、格擋金環（1）、霸體藍環（2）、破勢紅爆（3） |
| `fx/air` | 凌空斬、下劈、招架星芒（列 2）、破勢反擊 |
| `fx/scene` | 落葉、薄霧、碎石（列 2）、煙團（列 3，也是灰塵） |
| `fx/mark` | 預警符（黃／紅／藍／墨底） |
| `fx/land` | 落地衝擊（列 0 紅環、列 1 煙塵） |
| `fx/exec`／`exec2`／`ink` | 處決特效與書法底板 |
| `fx/peril_aura` | Boss 光暈：列 0 危招紅焰、列 1 霸體藍殼、列 2 啟動閃現、列 3 架勢崩潰（`drawBossAura` 自動依狀態畫，**所有關通用**） |
| `fx/heal_fx` | 回血（酒氣、光環、光粒上升、歸入身體） |
| `fx/xtz`／`xtz_star`／`xtz_shield` | 玄天珠、十字星、替身護罩 |
| `fx/slash` | 主角斬痕 |
| `assets/sfx/b2_*`／`b3_*`／`m_*`／`w_*`／`g_*` | 武器類別音效庫的素材（`SFX_CLASS`） |

## 三、每關要生的圖（提示詞模板）

> 規則：發光特效用純黑 #000000（程式疊加發光）；不發光的用洋紅 #FF00FF；圖裡一律面向右；「EXACTLY 16」格；人物不畫（光環裡面留空）。
> Gemini 常把格數出成 15 或 20，或整張重畫：**生完先數格數、看裡面有沒有人**再貼回。

### T2 刀弧模板（`bossN.webp`）
列：0 主要弧斬、1 突刺光束、2 地面橫掃、3 落地衝擊。用法：`arcArt`／`fxAct`／`fxHit`／`fxLand` 指到列。
```
[STYLE BIBLE]

Create ONE square image: a visual-effects sprite sheet of EXACTLY 16 cells in a 4 columns x 4 rows grid, each cell the same size, with generous empty margin inside each cell so no effect touches the cell edge. Background: pure solid black #000000 everywhere, no gradient, no grid lines, no borders, no text, no characters. Glowing weapon-attack effects (added onto the game with additive blending), clean anime cel style. Theme for this enemy: [COLOR THEME, e.g. "violet-purple moon energy with silver sparks"], weapon: [WEAPON]. All effects face RIGHT.

Row 1 (4 cells, one animation): the main slash arc: a wide crescent slash trail: frame 1 the arc just starting, frame 2 the full bright crescent, frame 3 the crescent widening and thinning, frame 4 faded to a few sparks.
Row 2 (4 cells, one animation): a thrust: a long horizontal piercing beam pointing RIGHT from the left edge of the cell to the right edge: frame 1 a short bright head, frame 2 a long beam with a spiral, frame 3 the beam thinning, frame 4 a faint trail.
Row 3 (4 cells, one animation): a ground sweep: a wide low horizontal crescent close to the bottom of the cell, with dust and sparks: frame 1 starting, frame 2 full, frame 3 wide and thin, frame 4 faded.
Row 4 (4 cells, one animation): a landing impact centered at the bottom of the cell: frame 1 a bright burst at the ground, frame 2 a ring of shock with radiating lines and rocks flying, frame 3 the ring larger with dust, frame 4 faint dust and sparks.
```

### T3 投射物＋影遁（`bossNfx2.webp`）
列：0 投射物飛行（尖端朝右，約佔格寬 85%）、1 投射物命中、2 瞬移消失（無臉剪影化霧）、3 瞬移現身（紅環＋閃光）。用法：`Stages[n].bulletArts[bulletKind]`（`tipX`／`tipY` 以格內像素量、`hitRow`／`hitW`）、`move.fxVanish`／`move.fxAppear`。
```
[STYLE BIBLE]

Create ONE square image: a visual-effects sprite sheet of EXACTLY 16 cells in a 4 columns x 4 rows grid, each cell the same size, with generous empty margin inside each cell. Background: pure solid black #000000 everywhere, no gradient, no grid lines, no borders, no text, no characters, no people. Glowing effects (additive blending). Color theme: [COLOR THEME, e.g. "blood-red and dark crimson with ember-gold sparks"].

Row 1 (4 cells, a smooth looping animation): a thrown [PROJECTILE, e.g. "Chinese halberd (ji) with a red tassel and a crescent side-blade"] flying to the RIGHT, side view, centered, the pointed tip on the right, taking about 85% of the cell width, with a faint energy aura and a short ember trail behind it that differs slightly in each frame.
Row 2 (4 cells, one animation): the impact of the projectile on its target, centered: frame 1 a bright flash with a few spokes, frame 2 an expanding ring with thin radiating lines and sparks, frame 3 the ring larger and fading with light shards, frame 4 faint smoke and embers.
Row 3 (4 cells, one animation): a shadow-vanish: frame 1 a faint upright human-shaped silhouette made of mist (no face, no details), frame 2 breaking into streaks of mist curling upward, frame 3 scattering into wisps with embers, frame 4 almost gone. Centered, about 80% of the cell height.
Row 4 (4 cells, one animation): a shadow-appear: frame 1 a ring of embers on the ground and mist gathering, frame 2 the mist condensing into an upright human-shaped silhouette (no face) with a flat ring on the ground, frame 3 the silhouette brightest with a sharp flash and the ring expanding, frame 4 the flash fading. Centered, about 80% of the cell height.
```

### T4 階段轉換專屬圖（`dirN.webp`）
列：0 氣焰循環（底部中央往上，約佔格高 85%）、1 地面正圓環（由上往下看，會被壓扁成橢圓）、2 光柱（由下往上）、3 聚氣（光點向中心匯聚）。用法：`DIR_CFG[n].phase`／`intro` 的 `aura`／`ring`／`pillar`／`gather`，及 `p2Aura`（二階段全程氣焰）。
```
[STYLE BIBLE]

Create ONE square image: a visual-effects sprite sheet of EXACTLY 16 cells in a 4 columns x 4 rows grid, each cell the same size, with generous empty margin inside each cell. Background: pure solid black #000000 everywhere, no gradient, no grid lines, no borders, no text, no characters. Glowing energy effects (additive blending), clean anime cel style with soft glow, color theme: [COLOR THEME].

Row 1 (4 cells, a smooth looping animation): a tall rising column of [ENERGY TYPE] starting at the bottom-center of the cell and rising to about 85% of the cell height, shape slightly different in each frame.
Row 2 (4 cells, one expanding animation): a perfectly circular flat ring seen from directly above, centered, concentric double ring with small abstract rune marks; frame 1 small and bright, frame 2 larger, frame 3 largest and thinner, frame 4 faint and almost gone.
Row 3 (4 cells, one animation): a vertical pillar of light bursting upward from the bottom-center: frame 1 a thin bright beam, frame 2 thick and brightest with cracks of light, frame 3 widening and fading with embers, frame 4 faint sparks rising.
Row 4 (4 cells, one animation): many small light particles and thin wisps converging toward the exact center of the cell from all around: frame 1 widely scattered, frame 2 closer, frame 3 tight, frame 4 a small bright core.
```

### T5 天空延伸圖（只有「從天而降」登場才要）
Gemini 會把整張背景重畫（月亮位置跑掉），**不能整張用**：取最上方純天空（避開兩側懸崖），以二次曲線只修大範圍色偏對齊原背景頂端，左右用原圖頂端擠出，「正—鏡像—正」連疊，烘進 `bgDim`，底端 40 列 alpha 淡出 → `arena{n}_sky.webp`，設 `Stages[n].bgSky`（做法見 HANDOFF v0.8.113）。

## 四、程式設定速查（`src/21_stages.js`、`src/54_director.js`）

- 招式特效：`move.fxAct`（出招起點，可 `follow:true`）、`fxHit`（連擊每下）、`fxLand`（躍斬落地）、`fxVanish`／`fxAppear`（瞬移）；刀弧圖 `Stages[n].arcArt`；投射物 `Stages[n].bulletArts[kind]`／`flySwordArt`；預載 `Stages[n].fxSheets`。
- 音效：`Stages[n].sfxClass = "heavy"｜"light"`、`sfxPitch`；特殊招式 `move.sfx = {w 前搖, a 出招, h 連擊每下, land 落地, p 音高, v 音量}`；事件音 `Stages[n].sfx`（`tpOut`／`tpIn`／`zone`…）。
- 登場：`Stages[n].dirMode = true` 由 `DIR_CFG[n]` 演出（`kind:"drop"` 從天而降＋名牌滑入；否則「跪姿→爆發」）；二階段 `DIR_CFG[n].phase`（`blast` 震飛主角、`grow` 放大、`p2Aura` 常駐氣焰）；第 3 關另有 `stanceByPhase`（換姿態在爆發那一刻，`applyP2Stance`）。
- 部位 Boss（第 4、7 關）：`Stages[n].parts`（見 HANDOFF v0.8.83～v0.8.92），登場／轉場仍用影片。
- 營地：`ASSET_VER` 每次改圖遞增；`tools/missing_ok.txt` 登記「還沒生」的檔，生好就刪那行。

## 五、驗收清單（每關做完逐項勾）

1. `python3 tools/build.py && python3 tools/build.py --check && node tools/check.js index.html`
2. `NODE_PATH=$(npm root -g) node tools/audit_fx.js index.html N` → **0 個盲點**（刀弧、投射物、瞬移、位移、音效）
3. `node tools/smoke.js index.html 20 N`（亂數對打 20 秒，抓缺檔與錯誤）
4. 無頭逐招測試（`tools/audit_fx.js` 已含觸發）＋登場／二階段截圖
5. 使用者手機實測回報表：登場時長與名牌、每招看得懂嗎（前搖與預警顏色）、危招解法與姿勢一致、特效亮度與大小、音量平衡、難度（初見約 3～6 次過關）
6. HANDOFF 寫一段版本紀錄（做了什麼、數值、待實測項目）

## 六、第 1 關學到的教訓

- **影片過場容易突兀**：切走畫面、畫風落差、玩家失控。改成戰場上演出（鏡頭＋姿勢＋特效＋換曲）。影片只留給部位 Boss 這種需要大型演出的關。
- **圖生影片會漂移**（畫風、場景、劍形）；影片提示詞一律單一連續運鏡、鎖定單一地點與色調，先給分鏡構想、同意後才給提示詞。
- **圖是「用到才載」會閃備案**：啟動時用載入畫面等主要圖載完；失敗自動重試。
- **協助技（玄天珠）別重疊**：每個技能只做一件事（靈光＝打斷、替身＝擋一次致命傷），封印倍率會把數字放大，注意實得值。
- **共用就共用**：音效靠武器類別、光暈靠 `peril_aura`、火花靠 `spark`；每關只生真正專屬的圖。
- 驗收要「看」：無頭截圖逐格看過再推送；聲音、手感、手機震動只能請使用者測。
