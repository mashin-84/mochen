# 《一念飛仙外傳-墨塵傳》給其他 AI 的交接文件（對應 v0.8.37）

> 給 Gemini 等其他 AI 模型：這份文件說明專案現況、程式結構、規則與待修項目，讓你能接手「整體性修正」。
> 更細的版本紀錄在倉庫的 `HANDOFF.md`（很長，需要查某個系統的來龍去脈時再看）；Claude 用的規則在 `CLAUDE.md`。

---

## 1. 專案一句話

橫版動作 RPG，Boss Rush（九關），戰鬥類似《隻狼》：彈刀（完美招架）、架勢條、危招閃避、處決。
- 網址：https://mashin-84.github.io/mochen/ （GitHub Pages，`main` 分支根目錄，推送後 1～2 分鐘更新）
- 倉庫：`mashin-84/mochen`（公開）
- 使用者在 **手機 Android Chrome 橫向** 遊玩測試，所有版面與手感以手機為準。
- 劇情來源：`mashin-84/Cultivation` 的 `source` 分支（正傳《一念飛仙》）。主要角色：墨塵（主角）、師妹、司徒衡、灰珠（太初玄天珠）。

## 2. 技術架構

- **單檔遊戲**：`index.html`（約 9800 行；Canvas 2D＋Web Audio，無任何外部函式庫）。
- **素材**：`assets/`，以相對路徑載入。
  - `assets/mc/` 主角動作格；`assets/boss{n}/`、`boss3b/`、`boss5b/` Boss 動作格（900×600 透明 webp，角色面向右、腳底在 y=560、水平中心 x=450）
  - `assets/bg/` 背景；`assets/portrait/` 半身像；`assets/fx/` 特效圖（4×4 格、每格 256px，黑底以 `lighter` 疊加發光）
  - `assets/music/` 背景音樂（webm opus）；`assets/sfx/` 音效（mp3）
- `tools/`：Python 切圖去背工具（`sheet.py`、`sheetpad.py`、`keyposes.py`、`fall3.py`、`proc.py`…）、`check.js`（語法＋Playwright 載入檢查）、`apply_fuzzy.py`（套用 FIND/REPLACE 修補）。
- **快取版本**：`index.html` 內 `const ASSET_VER = "x.y.z"`，所有素材網址自動加 `?v=`。**每次改版都要遞增**，否則手機讀舊快取。

## 3. 程式結構速查（用名稱搜尋，行號會變）

| 區塊 | 關鍵字 |
|---|---|
| 常數與狀態 | `CHAR_K`、`Config`、`Game`、`Player`、`Boss`、`Progress`、`ASSET_VER` |
| 關卡資料 | `Stages`（九關，由 `NINE_MAP` 從舊 15 關 `LegacyStages` 組出）、各關 `moves`、`pool/poolP2`、`farMoves`、`sprite`、`stances`、`bg`、`dialogue.pre/post/camp` |
| 流程 | `loadStage`、`returnToHub`、`hubTick`、`beginBattleIntro`、`startBossCine`、`handleStageClear`、`bossDeathOut`、`showSettlement` |
| 玩家戰鬥 | `updatePhysics`、`doNormalAttack`、`doAirAttack`、`doPerfectDeflect`、`performExecution`、`takeDamage` |
| Boss AI | `updateBossAI`、`triggerBossMove`、`resolveBossStrike`、`pickFromPool`、`Reader`（讀玩家習慣）、`onBossPhase2` |
| 繪製 | `render`、`drawBossEntity`、`getBossSprite`、`drawPlayer`、`drawArenaArt`、`drawHubScene` |
| 特效 | `spawnFx`／`updateFx`／`drawFx`、`spawnMoveFx`、`executionFx`、`drawThreatMarker`、`landingFx`、`addTrauma`（震屏）、`triggerHitstopMs`（定格） |
| 聲音 | `Sound`（`play(name, vol, pitch)`、`buffers`、`loadSamples`、`extSfx`）、`Music`（`play/fadeOut`）、`STAGE_BGM`、`STAGE_BGM_P2` |
| 對話與 UI | `DLG`、`dlgStart`、`hintOnce`、`showBanner`、`bossNameCard` |
| 存檔 | localStorage 鍵皆為 `qingyun_*`（`qingyun_cleared` 進度、`qingyun_testall` 測試全解鎖…） |

### 招式資料格式（`Stages[n].moves.KEY`）
必填：`name`、`windup`、`active`、`recover`（秒）、`range`、`lunge`、`damage`。
常用旗標：`isPerilous`＋`perilType`（`thrust` 前閃看破／`sweep` 跳躍／`grab` 側閃）、`isCombo`（`comboTotalHits`、`comboInterval`）、`isLeap`（躍擊）、`isCharge`（衝鋒）、`isRanged`、`isZone`（地面持續傷害）、`isMobility`（後撤／衝步）、`armor`（霸體）、`isRage`（怒氣招）、`ultimate`（大招）。
美術：`frames: {windup, active, recover}`（可為陣列，依進度切換）、`fxAct`／`fxHit`／`fxLand`（招式特效）、`kick`（震屏）。
音效：`sfx: {w 前搖, a 出招, h 連擊每下}`，填 `Sound.buffers` 的名字。

## 4. 九關現況

| 關 | Boss | 美術 | 招式／機制 | 劇情對白 |
|---|---|---|---|---|
| 1 | 赤煞神衛統領 | 完成（含登場影片、書法名牌、專屬配樂） | 完成，完整版的王 | 暫代 |
| 2 | 千幻長老・顧天風 | 完成 | 沿用舊資料＋二階段 2 招，待審 | 暫代 |
| 3 | 莫無咎／玄鐵真君（雙姿態，依階段切換） | 完成 | 完成，待實測 | 暫代 |
| 4 | 萬劍古靈（規劃為巨型部位 Boss） | **未做**（程式方塊暫代） | 舊資料 | 暫代 |
| 5 | 九幽魔狼（小狼 → 蛻變大狼） | 完成（登場影片、名牌、魔焰、兩首配樂、12 個狼聲） | 完成，待實測 | **暫代，待改寫** |
| 6 | 魅月仙子＋化血老祖（規劃雙 Boss） | **未做** | 舊資料 | 暫代 |
| 7 | 金甲天將＋玄武神相（規劃兩段式巨型） | **未做** | 舊資料 | 暫代 |
| 8 | 司徒衡（規劃三階段） | **未做** | 舊資料 | 暫代 |
| 9 | 心魔・墨塵（鏡像適應 AI） | 用主角圖調暗加紅光 | 原型完成 | 暫代 |

九關的差異化設計（每關要玩家換一種打法）詳見 `HANDOFF.md` 第二十一節表格。

## 5. 已知問題與待修清單（整體修正的候選）

**聲音**
- 第 1～4、6～9 關的通用音效（招架、格擋、揮劍、飛劍、命中、危招警示、看破、處決、喝藥、師妹協助、勝利）仍是**程式合成音，使用者覺得難聽**，要換成 AI 生成的音效檔（使用者已拿到 11 條提示詞）。`Sound.bake()` 裡的 `this.buffers.parry` 等就是這些合成音；換檔方式：檔案放 `assets/sfx/`，在 `loadSamples` 或 `extSfx` 註冊同名即可蓋掉。
- 第 2、3、4、6～9 關沒有背景音樂（`STAGE_BGM` 只有 1、5 關）。

**劇情**
- 全部關卡的戰前／戰後／營地對白都是暫代文字，需依正傳重寫，並和使用者一起審。
- 開場劇情、營地師妹互動是暫代；營地的師妹是程式畫的暫代造型。

**美術**
- 第 4、6、7、8 關沒有美術。
- 第 5 關大狼倒地 3 格（`assets/boss5b/17~19`）是舊的毛尾版，和新設計不一致。
- 處決書法「一劍青雲」把「劍」寫成簡體「剑」。
- 營地山門在手機上下半部會被觸控按鈕蓋住一部分。

**程式**
- 舊系統殘留：`StoryEngine`、`CinemaEngine`（只剩齒輪選單在用）、`LegacyStages`（舊 15 關素材庫），可評估清理。
- 玩家狀態沒有正式的狀態機（9 種狀態以旗標管理），實測遇卡死再重構。
- 文字裡若還有「十五難」要改「九難」。

## 6. 合作規則（使用者的偏好，務必遵守）

1. **繁體中文回覆**，短、先給結論，手機閱讀。
2. 討論型問題先評估、提方案；**使用者說「做」才動手**。
3. **不要整份輸出程式碼**。修改請用 FIND/REPLACE 片段（規則見第 7 節）。
4. 版面類改動要先給截圖確認。
5. **不要用程式合成動物或怪物的聲音**，使用者嫌難聽；要給英文提示詞或搜尋關鍵字，讓使用者去生成或下載真實音效。
6. 生圖提示詞規則：
   - 整段放在**一個程式碼框**內，框內不能再有三個反引號。
   - 開頭放完整風格聖經（見下）。
   - 寫「EXACTLY N」格；角色與特效一律**面向右**。
   - 不發光的用洋紅 `#FF00FF` 背景，發光特效用純黑 `#000000` 背景。
   - 附參考圖只附**單格單角色**。
   - 行走／跑步不要用生圖（AI 分不清左右腳），改用影片抽幀或動作表格子。
7. 風格聖經（每個生圖提示詞開頭都要放）：
   ```
   Style bible: quiet fantasy-journey anime aesthetic set in ancient China. Soft muted pastel palette (pale sky blue, sage green, cream white, lavender, warm beige) with small accents of cinnabar red and jade green, thin delicate line art with slightly stronger outer silhouette lines, soft cel shading with slightly feathered shadow edges, subtle highlights, slender natural proportions, restrained but distinct expressions, each character with a small signature gesture. Luminous light, soft haze, layered depth in any scenery; backgrounds look hand-painted with watercolor-like texture. Icons and items in the same soft pastel cel style with thin dark outlines and one soft highlight, readable at small size.
   ```

## 7. 程式修補格式（FIND/REPLACE）

每次修改請照這個結構回覆：**摘要／修補／自我檢查表／手動測試步驟／發現但未修改**。

- 只輸出 FIND/REPLACE 片段；FIND 要**逐字複製**、在全檔唯一、長度 3～40 行；REPLACE 不可省略內容。
- 不得改名既有識別字；變數先宣告再使用（`const` 有暫時死區）；引用既有屬性前先確認存在。
- 新增招式要填滿 `windup/active/recover/range/lunge/damage`。
- 新增邏輯不可放在會被 `return` 跳過的位置。
- 每次改版遞增 `ASSET_VER`。
- 你的自我檢查表只是參考，最後會由 Claude 或使用者實際測試驗證。

## 8. 測試方法（若你能執行程式）

- `node tools/check.js index.html`：語法檢查＋無頭瀏覽器載入，要顯示 `syntax ok` 與 `pageerrors 0`。
- 手動：開網址 → 齒輪選單打開「測試全解鎖」→ 營地走進山門選關。音效、手感、震動只能在手機實測。

## 9. 建議的整體修正順序（供討論，未經使用者定案）

1. 通用音效換成生成檔（影響所有關卡、成本低、效果明顯）。
2. 第 1～3、5 關實測手感與數值平衡（已有完整美術的關卡先打磨）。
3. 全部劇情對白重寫（一次統一世界觀與語氣）。
4. 補第 2、3 關配樂。
5. 第 4、6、7、8 關美術與機制（工程量最大，依 `HANDOFF.md` 第二十一節規劃）。
6. 程式清理（舊系統殘留）。
