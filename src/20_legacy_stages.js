      /* =========================================================================
       * 2. 全九難關卡資料庫 (ALL 9 STAGES DATABASE)
       * ========================================================================= */
      const HUB_START_X = -790, HUB_NPC_X = -660, HUB_GATE_X = -150, ARENA_ENTER_X = 900; /* 營地座標（位於戰場左側的負座標區） */
      const GROUND_SINK = 5; /* v0.8.21 角色圖整體下移，腳底踩進影子，消除浮空感 */
      const CHAR_K = 1.25; /* 人物與判定的整體放大倍率（v0.4.14） */

      const LegacyStages = {
        // --- 卷一【問心出山】(1-5) ---
        1: {
          id: 1, volume: 1, name: "赤煞神衛統領",
          chapter: "卷一【問心出山】第一難・試劍問心",
          realmBadge: "元神初期・司徒衛統領", arenaName: "問心絕巔 2.5x 空間",
          bgType: "cliff", maxHp: 2200, maxPosture: 100, deathblows: 2,
          unlockText: "【機制解鎖：青雲回生酒 & 踏劍看破】墨塵習得迎刀破突刺之法，並攜青雲仙釀葫蘆護身。",
          loreSnippet: "〔命運閉環：神衛伏誅，青雲山道陣法禁制驟起。前方便是千幻長老顧天風鎮守之「八荒千幻迷蹤台」……〕",
          moves: {
            slash1: { name: "神衛重戟・破軍", armor: true, windup: 0.42, active: 0.13, recover: 0.28, range: 175, lunge: 360, damage: 140, parryPostureDmg: 18 },
            exclusive_combo: { name: "神衛斷雲連戟", isCombo: true, comboTotalHits: 2, comboInterval: 0.22, comboDamagePerHit: 120, windup: 0.44, active: 0.50, recover: 0.35, range: 185, lunge: 380, damage: 130 },
            slash2: { name: "神衛連戟・穿雲", windup: 0.32, active: 0.12, recover: 0.28, range: 180, lunge: 400, damage: 150, parryPostureDmg: 20 },
            thrust_peril: { name: "【危】貫日長槍刺 (前閃看破)", windup: 0.62, active: 0.20, recover: 0.64, range: 280, lunge: 900, damage: 290, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】八荒斷岳掃 (跳躍踩頭)", windup: 0.64, active: 0.22, recover: 0.62, range: 230, lunge: 290, damage: 260, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】血煞鎖魂陣 (極限側閃)", windup: 0.70, active: 0.16, recover: 0.65, range: 150, lunge: 0, damage: 320, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "神衛統領", text: "墨塵，你私自攜帶同門師弟妹欲闖後山，可知已觸犯司徒掌門禁令？", role: "boss" },
              { speaker: "墨塵", text: "掌門暗中引九幽魔氣入青雲主峰，生靈塗炭。今日我縱死，亦要仗劍出山！", role: "mochen" },
              { speaker: "師弟妹", text: "師兄，玄天珠感應到了危險……統領周身煞氣極重，若他長槍泛出赤色「危」光，切記前閃踏刃破之！", role: "shidi" }
            ],
            post: [
              { speaker: "神衛統領", text: "咳……青雲劍法……竟至如此化境……但司徒掌門已在天門絕巔恭候……你們……逃不掉的……", role: "boss" },
              { speaker: "墨塵", text: "（收劍入鞘，望向人間劫火）天門絕巔麼……縱萬劫不復，我也必斬出一條通天青雲。", role: "mochen" }
            ]
          }
        },
        2: {
          id: 2, volume: 1, name: "千幻長老・顧天風",
          chapter: "卷一【問心出山】第二難・迷蹤千幻",
          realmBadge: "結丹大圓滿・千幻陣長老", arenaName: "迷蹤陣台 2.5x 空間",
          bgType: "illusion", maxHp: 2500, maxPosture: 110, deathblows: 2,
          unlockText: "【機制解鎖：空中二段瞬身 & 飛劍折射】墨塵領悟踏風劍意，滯空時可發動二段瞬身，完美招架可反彈飛劍！",
          loreSnippet: "〔命運閉環：顧天風長老長嘆收扇，道出司徒掌門已被天門魔染之真相。墨塵收劍，奔赴第三關叛宗首徒莫無咎駐守之地……〕",
          moves: {
            slash1: { name: "千幻羽扇・罡風", windup: 0.38, active: 0.13, recover: 0.28, range: 165, lunge: 220, damage: 130, parryPostureDmg: 16 },
            exclusive_teleport: { name: "千幻鏡影瞬殺", isTeleport: true, teleportBehind: true, teleportDelay: 0.22, windup: 0.48, active: 0.16, recover: 0.32, range: 160, lunge: 200, damage: 160 },
            exclusive_zone: { name: "八荒罡風陣", isZone: true, zoneType: "wind", zoneWidth: 280, zoneDuration: 2.5, zoneDamagePerSec: 140, windup: 0.50, active: 0.20, recover: 0.35, range: 280, lunge: 0, damage: 120 },
            flyswords: { name: "青罡子母飛劍・三連 (可折射)", windup: 0.45, active: 0.15, recover: 0.45, range: 600, lunge: 0, damage: 120, parryPostureDmg: 20, isRanged: true },
            thrust_peril: { name: "【危】千影穿雲刺 (前閃看破)", windup: 0.60, active: 0.20, recover: 0.62, range: 300, lunge: 920, damage: 300, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】八卦風火輪 (起跳踩頭)", windup: 0.62, active: 0.22, recover: 0.60, range: 240, lunge: 240, damage: 270, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】千幻雷劫陣 (極限側閃)", windup: 0.68, active: 0.16, recover: 0.66, range: 160, lunge: 0, damage: 330, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "顧天風", text: "墨塵師姪，你的青雲劍法確實凌厲，但在老夫的八荒千幻迷蹤大陣中，虛實莫測，一柄凡劍能斬幾道幻影？", role: "boss" },
              { speaker: "墨塵", text: "長老，青雲立宗之誓為守護蒼生，你何苦為司徒衡佈設魔陣，助紂為虐？", role: "mochen" },
              { speaker: "師弟妹", text: "師兄小心！長老召喚青罡飛劍時，把握節奏連續完美招架，可將飛劍劍氣直接折射反噬其本體！", role: "shidi" }
            ],
            post: [
              { speaker: "顧天風", text: "咳……萬法皆幻，唯劍意通真……墨塵……司徒掌門已被天門魔染，老夫已竭力留手……速往洗劍池去吧！", role: "boss" }
            ]
          }
        },
        3: {
          id: 3, volume: 1, name: "叛宗首徒・莫無咎",
          chapter: "卷一【問心出山】第三難・同門操戈",
          realmBadge: "通玄後期・青雲雙劍修", arenaName: "洗劍池竹林 2.5x 空間",
          bgType: "bamboo", maxHp: 2700, maxPosture: 115, deathblows: 2,
          unlockText: "【機制解鎖：替身殘影反切】受擊硬直瞬間按瞬步可留下殘影移形換位，免除後續連擊！",
          loreSnippet: "〔命運閉環：莫無咎雙劍落地，神色慘然。戒律堂巨闕重劍的破空轟鳴已自青雲山道盡頭逼近……〕",
          moves: {
            slash1: { name: "疾風雙劍・瞬影連斬", windup: 0.28, active: 0.12, recover: 0.24, range: 170, lunge: 420, damage: 135, parryPostureDmg: 20 },
            exclusive_combo: { name: "青雲雙劍・狂瀾四疊", isCombo: true, comboTotalHits: 4, comboInterval: 0.18, comboDamagePerHit: 80, windup: 0.42, active: 0.75, recover: 0.38, range: 170, lunge: 360, damage: 150 },
            exclusive_feint: { name: "殘影惑心斬", isFeint: true, feintPauseAt: 0.45, feintPauseDur: 0.25, windup: 0.55, active: 0.15, recover: 0.30, range: 175, lunge: 340, damage: 170 },
            slash2: { name: "無咎回旋・旋風刃", windup: 0.32, active: 0.14, recover: 0.26, range: 185, lunge: 360, damage: 145, parryPostureDmg: 22 },
            thrust_peril: { name: "【危】無咎絕命刺 (前閃看破)", windup: 0.58, active: 0.18, recover: 0.60, range: 290, lunge: 940, damage: 310, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】雙刃地堂掃 (起跳踩頭)", windup: 0.60, active: 0.20, recover: 0.58, range: 230, lunge: 320, damage: 280, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】影縛索命訣 (極限側閃)", windup: 0.66, active: 0.16, recover: 0.64, range: 160, lunge: 0, damage: 340, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "莫無咎", text: "墨塵師弟……昔日我們在洗劍池並肩論道，今日你卻成了叛宗逆徒。出劍吧！", role: "boss" },
              { speaker: "墨塵", text: "師兄，你投身司徒衡魔道，究竟是為了長生，還是被心魔吞噬？", role: "mochen" }
            ],
            post: [
              { speaker: "莫無咎", text: "原來……你的劍意已經超越了掌門……師弟，前方戒律堂首座長老……不會放你出山的……", role: "boss" }
            ]
          }
        },
        4: {
          id: 4, volume: 1, name: "戒律首座・玄鐵真君",
          chapter: "卷一【問心出山】第四難・戒律千鈞",
          realmBadge: "元神中期・戒律堂首座", arenaName: "戒律玄金殿 2.5x 空間",
          bgType: "iron", maxHp: 3000, maxPosture: 130, deathblows: 2,
          unlockText: "【機制解鎖：識破突進・霸體破防】按普攻蓄力可破除敵方霸體架勢，重擊直接削韌！",
          loreSnippet: "〔命運閉環：巨闕重劍碎裂，玄鐵真君巍峨身軀倒下。青雲劍塚歷代祖師劍鳴嗡嗡作響，劍靈已甦醒……〕",
          moves: {
            slash1: { name: "巨闕破天劈", armor: true, windup: 0.52, active: 0.16, recover: 0.35, range: 195, lunge: 320, damage: 180, parryPostureDmg: 28 },
            exclusive_feint: { name: "戒律玄金重煞", armor: true, isFeint: true, feintPauseAt: 0.40, feintPauseDur: 0.22, windup: 0.60, active: 0.18, recover: 0.40, range: 200, lunge: 300, damage: 210, parryPostureDmg: 30 },
            exclusive_zone: { name: "地煞崩裂波", isZone: true, zoneType: "fire", zoneWidth: 350, zoneDuration: 2.6, zoneDamagePerSec: 160, windup: 0.55, active: 0.20, recover: 0.38, range: 350, lunge: 0, damage: 140 },
            slash2: { name: "戒律震地波", windup: 0.44, active: 0.15, recover: 0.38, range: 210, lunge: 280, damage: 190, parryPostureDmg: 26 },
            thrust_peril: { name: "【危】鐵脊撼嶽撞 (前閃看破)", windup: 0.65, active: 0.22, recover: 0.68, range: 270, lunge: 860, damage: 330, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】千鈞橫江斬 (起跳踩頭)", windup: 0.66, active: 0.24, recover: 0.65, range: 250, lunge: 260, damage: 300, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】鎮魂金剛鎖 (極限側閃)", windup: 0.72, active: 0.18, recover: 0.70, range: 170, lunge: 0, damage: 360, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "玄鐵真君", text: "青雲戒律第一條：叛宗者死！墨塵，放下長劍，隨老夫入鎮魔塔受刑！", role: "boss" },
              { speaker: "墨塵", text: "長老執著於死板戒律，卻對掌門引魔塗炭視若無睹。今日青雲之律，由我此劍來斷！", role: "mochen" }
            ],
            post: [
              { speaker: "玄鐵真君", text: "好一個……由我此劍來斷！去吧，若能戰勝祖師劍塚萬劍古靈，老夫便認你之道！", role: "boss" }
            ]
          }
        },
        5: {
          id: 5, volume: 1, name: "青雲劍塚・萬劍古靈",
          chapter: "卷一【問心出山】第五難・劍塚問心",
          realmBadge: "太古劍靈・歷代青雲劍宗殘魄", arenaName: "萬劍古塚 2.5x 空間",
          bgType: "sword_graveyard", maxHp: 3300, maxPosture: 135, deathblows: 2,
          unlockText: "【奧義昇華：一劍青雲・極】破勢處決威力大幅提升，演出轉為三段全屏裂空墨痕！",
          loreSnippet: "〔卷一完結：萬劍歸宗，歷代祖師劍魂認可墨塵！墨塵長劍出鞘，破開青雲山門天塹，正式步入人間劫難……〕",
          moves: {
            slash1: { name: "青雲祖師劍・驚鴻", windup: 0.36, active: 0.13, recover: 0.26, range: 180, lunge: 400, damage: 160, parryPostureDmg: 24 },
            exclusive_bullet: { name: "萬劍齊發・覆地流星", isRanged: true, bulletCount: 5, bulletSpeed: 780, bulletTrajectory: "linear", bulletColor: "#38bdf8", windup: 0.52, active: 0.22, recover: 0.42, range: 600, lunge: 0, damage: 110 },
            flyswords: { name: "萬劍歸宗・風暴 (三連折射)", windup: 0.48, active: 0.16, recover: 0.46, range: 600, lunge: 0, damage: 130, parryPostureDmg: 22, isRanged: true },
            thrust_peril: { name: "【危】太初無極刺 (前閃看破)", windup: 0.60, active: 0.20, recover: 0.62, range: 300, lunge: 940, damage: 320, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】青天斷空掃 (起跳踩頭)", windup: 0.62, active: 0.22, recover: 0.60, range: 245, lunge: 300, damage: 290, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】萬劍牢籠陣 (極限側閃)", windup: 0.68, active: 0.16, recover: 0.66, range: 175, lunge: 0, damage: 350, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "萬劍古靈", text: "後生晚輩，欲出青雲，當受萬代祖師劍意叩問心神！出劍！", role: "boss" },
              { speaker: "墨塵", text: "弟子墨塵，不求長生，不求成仙，唯願以此劍，護天地人間！", role: "mochen" }
            ],
            post: [
              { speaker: "萬劍古靈", text: "心誠劍明！青雲真傳已授，年輕的劍主，去拯救這破滅的人間吧！", role: "boss" }
            ]
          }
        },

        // --- 卷二【人間劫難】(6-10，心印系統解鎖) ---
        6: {
          id: 6, volume: 2, name: "九幽魔狼王",
          chapter: "卷二【人間劫難】第六難・荒原狼嚎",
          realmBadge: "妖王初期・九幽魔煞兇獸", arenaName: "荒原殘陽 2.5x 空間",
          bgType: "wasteland", maxHp: 3500, maxPosture: 140, deathblows: 2,
          unlockText: "【心印解鎖：心印槽位 1 & 問心印】招架窗口縮至 90ms，但完美招架削韌提升 100%！",
          loreSnippet: "〔命運閉環：魔狼斃命，狼血染紅荒野。遠處白骨深淵中鬼火幽幽，九幽骨魔正在肆虐人間村落……〕",
          moves: {
            slash1: { name: "血煞撕咬", armor: true, windup: 0.34, active: 0.12, recover: 0.26, range: 170, lunge: 450, damage: 165, parryPostureDmg: 22 },
            exclusive_combo: { name: "暗影疾撲・血爪三連", isCombo: true, comboTotalHits: 3, comboInterval: 0.20, comboDamagePerHit: 100, windup: 0.42, active: 0.62, recover: 0.32, range: 175, lunge: 420, damage: 150 },
            slash2: { name: "狂暴狼爪二連擊", windup: 0.32, active: 0.14, recover: 0.28, range: 180, lunge: 420, damage: 170, parryPostureDmg: 24 },
            thrust_peril: { name: "【危】嗜血狂暴撲 (前閃看破)", windup: 0.58, active: 0.20, recover: 0.62, range: 310, lunge: 980, damage: 340, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】魔尾裂風掃 (起跳踩頭)", windup: 0.60, active: 0.22, recover: 0.58, range: 240, lunge: 310, damage: 300, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】血海噬魂吼 (極限側閃)", windup: 0.66, active: 0.16, recover: 0.64, range: 160, lunge: 0, damage: 360, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "墨塵", text: "人間村落已被妖潮血洗……這頭魔狼王正是先鋒！師妹，退後！", role: "mochen" },
              { speaker: "師弟妹", text: "師兄，魔狼動作兇殘迅捷，小心牠的狂暴撲殺！", role: "shidi" }
            ],
            post: [
              { speaker: "墨塵", text: "妖潮蔓延之快匪夷所思……必須儘快斬殺白骨裂隙的陣眼！", role: "mochen" }
            ]
          }
        },
        7: {
          id: 7, volume: 2, name: "幽冥白骨煞",
          chapter: "卷二【人間劫難】第七難・幽冥白骨",
          realmBadge: "魔煞大成・萬骨聚靈體", arenaName: "白骨深淵 2.5x 空間",
          bgType: "bone_abyss", maxHp: 3800, maxPosture: 145, deathblows: 2,
          unlockText: "【心印解鎖：踏風印】瞬步與空中瞬身無敵時隙提升 50%，但普通格擋損耗 2 倍劍勢！",
          loreSnippet: "〔命運閉環：萬骨崩解成齏粉。遠方魅月幻沼傳來陣陣詭異靡靡之音，惑亂修士心魄……〕",
          moves: {
            slash1: { name: "白骨魔刃重劈", armor: true, windup: 0.40, active: 0.14, recover: 0.30, range: 185, lunge: 360, damage: 175, parryPostureDmg: 24 },
            exclusive_zone: { name: "白骨地刺陣", isZone: true, zoneType: "bone", zoneWidth: 260, zoneDuration: 2.2, zoneDamagePerSec: 150, zoneTargetPlayer: true, windup: 0.52, active: 0.20, recover: 0.36, range: 260, lunge: 0, damage: 130 },
            flyswords: { name: "噬魂骨矛・三連 (可折射)", windup: 0.46, active: 0.15, recover: 0.45, range: 600, lunge: 0, damage: 135, parryPostureDmg: 22, isRanged: true },
            thrust_peril: { name: "【危】死骸穿心刺 (前閃看破)", windup: 0.62, active: 0.20, recover: 0.64, range: 290, lunge: 920, damage: 330, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】骨刺修羅掃 (起跳踩頭)", windup: 0.64, active: 0.22, recover: 0.60, range: 250, lunge: 270, damage: 310, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】白骨囚籠陣 (極限側閃)", windup: 0.70, active: 0.16, recover: 0.68, range: 170, lunge: 0, damage: 370, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "白骨煞", text: "凡人修士的生魂……是獻給九幽魔尊最甜美的祭品！", role: "boss" },
              { speaker: "墨塵", text: "枯骨死物，安敢妄奪人間生靈！", role: "mochen" }
            ],
            post: [
              { speaker: "墨塵", text: "這具白骨煞體內有合歡宗的魔道法印……看來人間魔門早已與司徒衡暗中勾結！", role: "mochen" }
            ]
          }
        },
        8: {
          id: 8, volume: 2, name: "魅月仙子",
          chapter: "卷二【人間劫難】第八難・魅影迷心",
          realmBadge: "元神初期・合歡宗魔女", arenaName: "魅月幻沼 2.5x 空間",
          bgType: "moon_swamp", maxHp: 4000, maxPosture: 145, deathblows: 2,
          unlockText: "【心印解鎖：凝神印】回生酒飲用硬直縮短 50%，恢復量提升至 600 氣血！",
          loreSnippet: "〔命運閉環：魅月仙子身死道消，幻境煙消雲散。萬毒血池方向傳來沖天血腥濁氣……〕",
          moves: {
            slash1: { name: "情絲軟劍・流波", windup: 0.32, active: 0.13, recover: 0.26, range: 175, lunge: 380, damage: 160, parryPostureDmg: 22 },
            exclusive_teleport: { name: "魅影幻渡・背後索魂", isTeleport: true, teleportBehind: true, teleportDelay: 0.20, windup: 0.45, active: 0.15, recover: 0.30, range: 165, lunge: 180, damage: 170 },
            slash2: { name: "紅綃飛花三連斬", windup: 0.30, active: 0.12, recover: 0.28, range: 180, lunge: 400, damage: 165, parryPostureDmg: 24 },
            thrust_peril: { name: "【危】斷情索命刺 (前閃看破)", windup: 0.58, active: 0.18, recover: 0.60, range: 295, lunge: 940, damage: 325, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】迷音漫天掃 (起跳踩頭)", windup: 0.60, active: 0.20, recover: 0.58, range: 245, lunge: 290, damage: 295, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】攝魂奪魄吻 (極限側閃)", windup: 0.66, active: 0.16, recover: 0.64, range: 165, lunge: 0, damage: 360, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "魅月仙子", text: "青雲小道長生得如此俊俏，何苦跟著天下陪葬？不如入我懷中，同登極樂？", role: "boss" },
              { speaker: "墨塵", text: "妖女休得惑言！青雲劍下，唯斬邪魔！", role: "mochen" }
            ],
            post: [
              { speaker: "魅月仙子", text: "好狠的心……化血老祖已用百萬生靈祭煉化血魔陣，你們……阻止不了大劫的……", role: "boss" }
            ]
          }
        },
        9: {
          id: 9, volume: 2, name: "化血老祖",
          chapter: "卷二【人間劫難】第九難・化血魔淵",
          realmBadge: "元神後期・萬毒魔宗宗主", arenaName: "萬毒血池 2.5x 空間",
          bgType: "blood_pond", maxHp: 4300, maxPosture: 150, deathblows: 2,
          unlockText: "【心印解鎖：心印槽位 2 & 絕脈印】氣血低於 35% 時，墨塵青雲斬威力與破勢削韌提升 80%！",
          loreSnippet: "〔命運閉環：化血血池被青雲劍氣徹底蒸乾！九幽裂隙深處，九幽魔將冥骨夜叉率領魔軍主力現身……〕",
          moves: {
            slash1: { name: "化血魔爪・血痕", windup: 0.38, active: 0.14, recover: 0.28, range: 185, lunge: 360, damage: 180, parryPostureDmg: 26 },
            exclusive_bullet: { name: "化血魔血狂潮", isRanged: true, bulletCount: 3, bulletSpeed: 620, bulletTrajectory: "parabola", bulletColor: "#ef4444", windup: 0.50, active: 0.20, recover: 0.38, range: 550, lunge: 0, damage: 120 },
            flyswords: { name: "腐骨毒血錐・三連 (可折射)", windup: 0.44, active: 0.15, recover: 0.44, range: 600, lunge: 0, damage: 140, parryPostureDmg: 24, isRanged: true },
            thrust_peril: { name: "【危】魔煞血河刺 (前閃看破)", windup: 0.62, active: 0.20, recover: 0.64, range: 300, lunge: 930, damage: 340, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】萬毒化骨掃 (起跳踩頭)", windup: 0.64, active: 0.22, recover: 0.62, range: 250, lunge: 280, damage: 320, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】血海翻天陣 (極限側閃)", windup: 0.70, active: 0.16, recover: 0.68, range: 175, lunge: 0, damage: 380, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "化血老祖", text: "青雲小輩！敢壞老祖血祭大計，老祖要抽乾你的元神，煉成血神子！", role: "boss" },
              { speaker: "墨塵", text: "百萬生靈血海深仇，今日便在此徹底了結！", role: "mochen" }
            ],
            post: [
              { speaker: "化血老祖", text: "冥骨夜叉大人……救我……啊啊啊！", role: "boss" }
            ]
          }
        },
        10: {
          id: 10, volume: 2, name: "冥骨夜叉",
          chapter: "卷二【人間劫難】第十難・夜叉魔將",
          realmBadge: "九幽魔帥・四大魔將之一", arenaName: "九幽冥淵 2.5x 空間",
          bgType: "demon_rift", maxHp: 4600, maxPosture: 155, deathblows: 2,
          unlockText: "【心印解鎖：不滅印】太初玄天珠支援技能冷卻大幅縮短，【太初替身】無敵時隙延長至 3.5 秒！",
          loreSnippet: "〔卷二完結：九幽四大魔將伏誅，人間妖潮暫止！墨塵與師弟妹踏碎幽冥之門，御劍直登天梯，踏入天門斬道終卷！〕",
          moves: {
            slash1: { name: "幽冥鬼戟・裂魄", armor: true, windup: 0.42, active: 0.14, recover: 0.30, range: 195, lunge: 380, damage: 195, parryPostureDmg: 28 },
            exclusive_combo: { name: "冥炎鬼戟・狂暴連斬", isCombo: true, comboTotalHits: 3, comboInterval: 0.24, comboDamagePerHit: 115, windup: 0.48, active: 0.74, recover: 0.36, range: 190, lunge: 360, damage: 180 },
            slash2: { name: "夜叉冥炎重砸", windup: 0.46, active: 0.16, recover: 0.34, range: 205, lunge: 350, damage: 210, parryPostureDmg: 30 },
            thrust_peril: { name: "【危】九幽滅魂刺 (前閃看破)", windup: 0.62, active: 0.20, recover: 0.64, range: 310, lunge: 960, damage: 360, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】地獄業火掃 (起跳踩頭)", windup: 0.64, active: 0.22, recover: 0.62, range: 260, lunge: 290, damage: 330, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】萬鬼噬心陣 (極限側閃)", windup: 0.70, active: 0.16, recover: 0.68, range: 180, lunge: 0, damage: 390, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "冥骨夜叉", text: "凡人劍士，你能殺盡人間妖邪，卻不知天門之上司徒衡早已獻祭青雲宗，天道魔染已不可逆轉！", role: "boss" },
              { speaker: "墨塵", text: "斬完你這頭魔將，我便登天門，親手斬了司徒衡！", role: "mochen" }
            ],
            post: [
              { speaker: "冥骨夜叉", text: "司徒衡在天青魔殿等著你……天門絕巔……將是你們的葬身之地！", role: "boss" }
            ]
          }
        },

        // --- 卷三【登天斬道】(11-15，終局命運閉環) ---
        11: {
          id: 11, volume: 3, name: "金甲天將・巨靈神",
          chapter: "卷三【登天斬道】第十一難・金甲天梯",
          realmBadge: "天門鎮守・上界金甲正神", arenaName: "通天天梯 2.5x 空間",
          bgType: "gold_stairs", maxHp: 4800, maxPosture: 160, deathblows: 2,
          unlockText: "【通關回響】墨塵劍意已融匯天梯神雷，出劍附帶天青劍芒裂空！",
          loreSnippet: "〔命運閉環：巨靈神金甲碎落天梯。天門四方玄武神陣已現，巍峨神龜巨蛇橫亙天界門檻……〕",
          moves: {
            slash1: { name: "天罰金鐧・破妄", armor: true, windup: 0.44, active: 0.15, recover: 0.32, range: 190, lunge: 360, damage: 190, parryPostureDmg: 28 },
            exclusive_feint: { name: "降魔金鐧・巨力變速砸", isFeint: true, feintPauseAt: 0.42, feintPauseDur: 0.28, windup: 0.62, active: 0.18, recover: 0.40, range: 210, lunge: 320, damage: 220 },
            slash2: { name: "降魔雙鐧連擊", windup: 0.38, active: 0.14, recover: 0.30, range: 200, lunge: 390, damage: 200, parryPostureDmg: 30 },
            thrust_peril: { name: "【危】天崩地裂刺 (前閃看破)", windup: 0.64, active: 0.20, recover: 0.65, range: 300, lunge: 940, damage: 350, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】雷霆萬鈞掃 (起跳踩頭)", windup: 0.66, active: 0.22, recover: 0.62, range: 255, lunge: 280, damage: 325, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】九霄神雷引 (極限側閃)", windup: 0.72, active: 0.16, recover: 0.68, range: 180, lunge: 0, damage: 390, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "巨靈神", text: "凡界修士，休得踏足天門！天道無情，違逆者灰飛煙滅！", role: "boss" },
              { speaker: "墨塵", text: "若天道坐視人間淪為魔域，這天門，我便一劍斬碎！", role: "mochen" }
            ],
            post: [
              { speaker: "巨靈神", text: "好一個敢逆天者……上界神官已皆入魔陣……莫入四方玄武大陣！", role: "boss" }
            ]
          }
        },
        12: {
          id: 12, volume: 3, name: "四方玄武神相",
          chapter: "卷三【登天斬道】第十二難・玄武鎖天",
          realmBadge: "天門陣靈・四方天柱化身", arenaName: "天門陣台 2.5x 空間",
          bgType: "celestial_gate", maxHp: 5200, maxPosture: 175, deathblows: 2,
          unlockText: "【通關回響】破開四方玄武天罡，墨塵劍勢堅不可摧，自身劍勢恢復速度提升 30%！",
          loreSnippet: "〔命運閉環：玄武神陣告破，天門大開。九幽魔尊投影「無相天魔」正自虛空黑蓮中凝聚……〕",
          moves: {
            slash1: { name: "玄天真武撞", armor: true, windup: 0.50, active: 0.16, recover: 0.36, range: 200, lunge: 330, damage: 200, parryPostureDmg: 32 },
            exclusive_zone: { name: "玄冥滔天陣", isZone: true, zoneType: "ice", zoneWidth: 400, zoneDuration: 3.0, zoneDamagePerSec: 160, windup: 0.58, active: 0.22, recover: 0.42, range: 400, lunge: 0, damage: 150 },
            flyswords: { name: "北方壬癸水柱・三連 (可折射)", windup: 0.48, active: 0.16, recover: 0.48, range: 600, lunge: 0, damage: 150, parryPostureDmg: 26, isRanged: true },
            thrust_peril: { name: "【危】神龜裂海錐 (前閃看破)", windup: 0.65, active: 0.22, recover: 0.68, range: 290, lunge: 900, damage: 360, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】靈蛇擺尾掃 (起跳踩頭)", windup: 0.66, active: 0.24, recover: 0.65, range: 260, lunge: 270, damage: 330, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】水極冰封陣 (極限側閃)", windup: 0.74, active: 0.18, recover: 0.72, range: 185, lunge: 0, damage: 400, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "玄武神相", text: "玄武鎮天門，萬載無人破。凡人之劍，安能撼動天之磐石！", role: "boss" },
              { speaker: "墨塵", text: "磐石亦有隙，天柱亦有崩。青雲出鞘，無物不斬！", role: "mochen" }
            ],
            post: [
              { speaker: "玄武神相", text: "天罡已碎……天魔已至……天門危矣……", role: "boss" }
            ]
          }
        },
        13: {
          id: 13, volume: 3, name: "無相天魔",
          chapter: "卷三【登天斬道】第十三難・無相魔劫",
          realmBadge: "九幽主宰投影・虛空無相體", arenaName: "無相幻界 2.5x 空間",
          bgType: "void_rift", maxHp: 5500, maxPosture: 170, deathblows: 2,
          unlockText: "【通關回響】斬破虛無心魔，墨塵心境空明無瑕，完美招架窗口適度放寬！",
          loreSnippet: "〔命運閉環：天魔幻影破滅，司徒衡端坐天青魔殿。青雲宗叛道宿敵終局對決近在咫尺……〕",
          moves: {
            slash1: { name: "虛空裂隙斬", windup: 0.32, active: 0.12, recover: 0.26, range: 180, lunge: 450, damage: 190, parryPostureDmg: 26 },
            exclusive_teleport: { name: "無相虛空遁殺", isTeleport: true, teleportBehind: true, teleportDelay: 0.25, windup: 0.48, active: 0.16, recover: 0.32, range: 180, lunge: 220, damage: 200 },
            slash2: { name: "黑蓮噬魂二重擊", windup: 0.34, active: 0.14, recover: 0.28, range: 190, lunge: 420, damage: 200, parryPostureDmg: 28 },
            thrust_peril: { name: "【危】虛空滅絕刺 (前閃看破)", windup: 0.58, active: 0.18, recover: 0.60, range: 310, lunge: 990, damage: 370, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】無相黑蓮掃 (起跳踩頭)", windup: 0.60, active: 0.20, recover: 0.58, range: 255, lunge: 310, damage: 340, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】永劫墮魔陣 (極限側閃)", windup: 0.68, active: 0.16, recover: 0.66, range: 180, lunge: 0, damage: 420, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "無相天魔", text: "墨塵，你的長劍能斬實體，能斬斷人心中的貪嗔癡與天道絕望嗎？", role: "boss" },
              { speaker: "墨塵", text: "心有青雲，何懼虛妄！給我滅！", role: "mochen" }
            ],
            post: [
              { speaker: "無相天魔", text: "司徒衡就在前面……他已吞下天魔之種，你贏不了的……", role: "boss" }
            ]
          }
        },
        14: {
          id: 14, volume: 3, name: "司徒衡",
          chapter: "卷三【登天斬道】第十四難・宿敵對決",
          realmBadge: "青雲叛道掌門・魔染地仙境", arenaName: "掌門魔殿 2.5x 空間",
          bgType: "demonic_palace", maxHp: 6000, maxPosture: 180, deathblows: 2,
          unlockText: "【通關回響】青雲正道傳承確立！墨塵獲得魔劍「戮仙」之煞氣磨礪，戰意攀至巔峰！",
          loreSnippet: "〔命運閉環：司徒衡身死，魔劍斷裂！然而司徒衡以殘命開啟了天門絕巔天道劫眼，滅世劫雷降臨！〕",
          moves: {
            slash1: { name: "青雲戮仙劍・絕命", armor: true, windup: 0.36, active: 0.13, recover: 0.26, range: 190, lunge: 440, damage: 210, parryPostureDmg: 30 },
            exclusive_combo: { name: "青雲九幽・三絕魔劍", isCombo: true, comboTotalHits: 3, comboInterval: 0.22, comboDamagePerHit: 125, windup: 0.46, active: 0.68, recover: 0.35, range: 195, lunge: 380, damage: 210 },
            flyswords: { name: "九幽魔劍氣・三連 (可折射)", windup: 0.44, active: 0.15, recover: 0.44, range: 600, lunge: 0, damage: 160, parryPostureDmg: 28, isRanged: true },
            thrust_peril: { name: "【危】天地同壽刺 (前閃看破)", windup: 0.60, active: 0.20, recover: 0.62, range: 320, lunge: 1020, damage: 390, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】戮仙斷空掃 (起跳踩頭)", windup: 0.62, active: 0.22, recover: 0.60, range: 270, lunge: 330, damage: 360, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】天魔滅世陣 (極限側閃)", windup: 0.68, active: 0.16, recover: 0.66, range: 190, lunge: 0, damage: 440, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "司徒衡", text: "墨塵……你是我青雲千年來最優秀的弟子。但你不知，天道早已腐朽，不引九幽魔氣，整個人間都要化為劫灰！", role: "boss" },
              { speaker: "墨塵", text: "掌門，以魔衛道，無異於飲鴆止渴！青雲之名，不容魔血玷污，出劍吧！", role: "mochen" },
              { speaker: "師弟妹", text: "師兄！掌門的戮仙劍法兼具青雲劍意與九幽魔罡，千萬小心他的連續魔劍氣！", role: "shidi" }
            ],
            post: [
              { speaker: "司徒衡", text: "咳……你贏了……但我已經喚醒了天門之巔的【天道劫眼】……那是真正的天道滅世神罰……你們……逃不掉的……", role: "boss" }
            ]
          }
        },
        15: {
          id: 15, volume: 3, name: "天道劫眼・化身",
          chapter: "卷三【登天斬道】第九難・命運閉環",
          realmBadge: "天道秩序・滅世雷劫法相", arenaName: "天門絕巔 2.5x 空間",
          bgType: "heaven_peak", maxHp: 6600, maxPosture: 190, deathblows: 2,
          unlockText: "【通關全九難・天道閉環】墨塵燃盡元神斬出絕命「一劍青雲」，護送師弟妹殘魂入珠，太初玄天珠化為質樸灰珠遁入人間輪迴！",
          loreSnippet: "〔終局命運：墨塵長笑力竭隕落，灰珠穿越萬載輪迴直墜人間山村破廟……完美閉環銜接《一念飛仙》第一章妖潮之夜！〕",
          moves: {
            slash1: { name: "天道劫光・湮滅", windup: 0.38, active: 0.14, recover: 0.28, range: 200, lunge: 420, damage: 220, parryPostureDmg: 32 },
            exclusive_bullet: { name: "混沌天劫引・九霄雷矛", isRanged: true, bulletCount: 3, bulletSpeed: 820, bulletTrajectory: "vertical", bulletColor: "#c084fc", windup: 0.55, active: 0.25, recover: 0.45, range: 600, lunge: 0, damage: 160 },
            exclusive_feint: { name: "天道輪迴湮滅劫", isFeint: true, feintPauseAt: 0.45, feintPauseDur: 0.35, windup: 0.68, active: 0.20, recover: 0.45, range: 240, lunge: 260, damage: 240 },
            flyswords: { name: "紫霄神雷劍・三連 (可折射)", windup: 0.44, active: 0.15, recover: 0.44, range: 600, lunge: 0, damage: 170, parryPostureDmg: 30, isRanged: true },
            thrust_peril: { name: "【危】神罰貫天刺 (前閃看破)", windup: 0.60, active: 0.20, recover: 0.62, range: 330, lunge: 1050, damage: 410, isPerilous: true, perilType: "thrust" },
            sweep_peril: { name: "【危】六道輪迴掃 (起跳踩頭)", windup: 0.62, active: 0.22, recover: 0.60, range: 280, lunge: 340, damage: 380, isPerilous: true, perilType: "sweep" },
            grab_peril: { name: "【危】天道滅世劫 (極限側閃)", windup: 0.68, active: 0.16, recover: 0.66, range: 200, lunge: 0, damage: 460, isPerilous: true, perilType: "grab" }
          },
          dialogue: {
            pre: [
              { speaker: "天道劫眼", text: "凡人墨塵……逆天登梯，屠盡魔仙，罪當萬劫不復，魂飛魄散！", role: "boss" },
              { speaker: "墨塵", text: "天道無道，視眾生如草芥！今日我墨塵，便燃盡元神，為天下斬開一線青雲生機！", role: "mochen" },
              { speaker: "師弟妹", text: "（玄天珠爆發湛藍光芒）師兄！玄天珠在共鳴……我與你同生共死！", role: "shidi" }
            ],
            post: [
              { speaker: "天道劫眼", text: "劫眼碎裂……凡人之軀……竟真能逆斬天道……", role: "boss" },
              { speaker: "墨塵", text: "（元神燃燒，回頭望向師弟妹，神色溫柔安詳）師妹……天道已破，但我元神已盡。這最後一劍青雲……護你殘魂入珠！", role: "mochen" },
              { speaker: "師弟妹", text: "師兄！不要——！師兄！！！", role: "shidi" },
              { speaker: "命運閉環・天道回響", text: "〔終局命運：湛藍的太初玄天珠吸納師妹殘魂，靈光為抵禦大劫盡數散去，化為一枚質樸無華的灰珠，自天門絕巔直墜人間山村破廟……多年後的大竹村妖潮之夜，少年自破廟驚醒，胸口灰珠微熱——《一念飛仙》正傳傳奇，由此開場！〕", role: "narrator" }
            ]
          }
        }
      };

      [1, 2, 3, 4, 5, 11, 14].forEach(id => LegacyStages[id].bodyType = "human");
      LegacyStages[6].bodyType = "beast";
      [7, 8, 9, 10, 12, 13].forEach(id => LegacyStages[id].bodyType = "spirit");
      LegacyStages[15].bodyType = "eye";

      LegacyStages[6].moves.slash1.anim = "bite";
      LegacyStages[6].moves.exclusive_combo.anim = "claw";
      LegacyStages[6].moves.thrust_peril.anim = "pounce";

      // 階段 F：第 7~10 關專屬動作 (anim)
      ["slash1", "flyswords", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[7].moves[k]) LegacyStages[7].moves[k].anim = "claw"; });
      LegacyStages[7].moves.exclusive_zone.anim = "slam";

      ["slash2", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[8].moves[k]) LegacyStages[8].moves[k].anim = "fan"; });
      LegacyStages[8].moves.slash1.anim = "ribbon";
      LegacyStages[8].moves.exclusive_teleport.anim = "vanish";

      ["slash1", "flyswords", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[9].moves[k]) LegacyStages[9].moves[k].anim = "claw"; });
      LegacyStages[9].moves.exclusive_bullet.anim = "cast";

      ["slash1", "slash2", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[10].moves[k]) LegacyStages[10].moves[k].anim = "overhead"; });
      LegacyStages[10].moves.exclusive_combo.anim = "spin";

      // 階段 F：第 11~15 關專屬動作 (anim)
      ["slash1", "slash2", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[11].moves[k]) LegacyStages[11].moves[k].anim = "slam"; });
      LegacyStages[11].moves.exclusive_feint.anim = "overhead";
      ["slash1", "flyswords", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[12].moves[k]) LegacyStages[12].moves[k].anim = "cast"; });
      LegacyStages[12].moves.exclusive_zone.anim = "slam";
      ["slash1", "slash2", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[13].moves[k]) LegacyStages[13].moves[k].anim = "cast"; });
      LegacyStages[13].moves.exclusive_teleport.anim = "vanish";
      ["slash1", "exclusive_combo", "flyswords", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[14].moves[k]) LegacyStages[14].moves[k].anim = "slash"; });
      ["slash1", "flyswords", "thrust_peril", "sweep_peril", "grab_peril"].forEach(k => { if(LegacyStages[15].moves[k]) LegacyStages[15].moves[k].anim = "slash"; });
      LegacyStages[15].moves.exclusive_bullet.anim = "cast";
      LegacyStages[15].moves.exclusive_feint.anim = "fan";

      // 階段 F：第 1~5 關專屬動作 (anim)
      LegacyStages[1].moves.slash1.anim = "slash";
      LegacyStages[1].moves.exclusive_combo.anim = "thrust";
      LegacyStages[1].moves.thrust_peril.anim = "thrust";
      LegacyStages[2].moves.slash1.anim = "fan";
      LegacyStages[2].moves.exclusive_teleport.anim = "vanish";
      LegacyStages[2].moves.exclusive_zone.anim = "cast";
      LegacyStages[3].moves.slash1.anim = "dual";
      LegacyStages[3].moves.exclusive_combo.anim = "dual";
      LegacyStages[3].moves.exclusive_feint.anim = "dual";
      LegacyStages[3].moves.slash2.anim = "dual";
      LegacyStages[4].moves.exclusive_feint.anim = "overhead";
      LegacyStages[4].moves.exclusive_zone.anim = "slam";
      LegacyStages[5].moves.exclusive_bullet.anim = "cast";

      LegacyStages[8].moves.exclusive_aerial = { name: "魅影升天・天女散花", isAerial: true, lunge: 0, range: 0, aerialBreakHits: 3, aerialShotInterval: 1.1, aerialMaxDuration: 9, anim: "sky", windup: 1.0, active: 9.0, recover: 1.0, damage: 130 };
      LegacyStages[13].moves.exclusive_aerial = { name: "無相升天・虛空劫光", isAerial: true, lunge: 0, range: 0, aerialBreakHits: 3, aerialShotInterval: 1.1, aerialMaxDuration: 9, anim: "sky", windup: 1.0, active: 9.0, recover: 1.0, damage: 150 };
      LegacyStages[15].moves.exclusive_aerial = { name: "天道升天・神罰降世", isAerial: true, lunge: 0, range: 0, aerialBreakHits: 4, aerialShotInterval: 1.1, aerialMaxDuration: 9, anim: "sky", windup: 1.0, active: 9.0, recover: 1.0, damage: 180 };

      /* 營地劇情（打完上一關、回到營地時播放；暫代文字，之後可整段替換）。其他關卡可用同樣格式加在 Stages[n].dialogue.camp */
      LegacyStages[1].dialogue.post.forEach(l => { if (l.role === "boss" || l.role === "mochen") l.expr = "alt"; });
      LegacyStages[2].dialogue.camp = [
        { speaker: "師妹", role: "shidi", text: "師兄，你受傷了。先在營火邊歇一會兒吧。" },
        { speaker: "墨塵", role: "mochen", expr: "alt", text: "不礙事。統領臨死前說，掌門已在天門絕巔恭候……司徒掌門，是要把我們一路逼上去。" },
        { speaker: "師妹", role: "shidi", text: "前面是千幻長老的八荒千幻迷陣。他以前……最疼我們的。" },
        { speaker: "墨塵", role: "mochen", expr: "alt", text: "疼不疼，劍下見分曉。休息夠了，我們走。" }
      ];

      /* v0.4.15 大招：每個 Boss 的 grab_peril（陣法類招式）視為大招 */
      Object.values(LegacyStages).forEach(st => { if (st.moves && st.moves.grab_peril) st.moves.grab_peril.ultimate = true; });
