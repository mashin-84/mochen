      /* ===== v0.7.1 九難：由舊 15 關資料組出新的 9 關（舊資料留在 LegacyStages 當招式素材庫）=====
         artId = 繪製用的舊關卡編號（Boss 造型、特殊演出都以 artId 判斷），之後每位 Boss 有自己的圖再改成資料驅動 */
      const NINE_MAP = [
        /* [新編號, 舊編號, 卷, 名稱, HP] */
        [1, 1, 1, null, 2200], [2, 2, 1, null, 2600], [3, 3, 1, "莫寒川＋玄鐵真君", 3200],
        [4, 5, 2, null, 3600], [5, 6, 2, "九幽魔將", 4600], [6, 8, 2, "魅月仙子＋化血老祖", 5000],
        [7, 11, 3, "金甲天將＋玄武神相", 5400], [8, 14, 3, null, 7000], [9, 14, 3, "心魔・墨塵", 5200]
      ];
      const NUM_ZH = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
      const VOL_TAG = { 1: "卷一【問心出山】", 2: "卷二【九幽劫難】", 3: "卷三【登天斬道】" };
      const Stages = {};
      NINE_MAP.forEach(([nid, lid, vol, nm, hp]) => {
        const L = LegacyStages[lid];
        const st = Object.assign({}, L, { id: nid, artId: lid, volume: vol, maxHp: hp });
        if (nm) st.name = nm;
        const sub = (L.chapter.split("難・")[1] || L.name);
        st.chapter = `${VOL_TAG[vol]}第${NUM_ZH[nid]}難・${sub}`;
        if (nid === 9) {
          const F = LegacyStages[15];
          st.dialogue = F.dialogue; st.loreSnippet = F.loreSnippet;
          st.unlockText = F.unlockText.replace("十五難", "九難");
          st.chapter = `${VOL_TAG[3]}第九難・心魔・命運閉環`;
        }
        Stages[nid] = st;
      });
      Stages[2].dialogue.camp = LegacyStages[2].dialogue.camp;
      Stages[1].bg = "arena1"; Stages[1].bgDim = 0.28; Stages[1].bgSky = "arena1_sky"; /* v0.8.113 從天而降登場往上看的天空延伸圖（Gemini 星空＋鏡像連續，已含調暗） */
      /* M2 分層場景：崖頂地面帶（取代共用地面帶，表面中線對齊 groundY）＋前景松石剪影 */
      Stages[1].layers = [
        { img: "arena1_ground", ground: true, par: 1, y: 475, h: 330, dim: 0.12 },
        { img: "arena1_fg", fg: true, par: 1.35, y: 560, h: 250, alpha: 0.95, dim: 0.15 }
      ]; /* v0.8.20 戰場調亮一點，銜接明亮的崖頂影片 */
      Stages[2].bg = "arena2"; Stages[2].bgDim = 0.25;
      Stages[2].sprite = "boss2";
      /* 招式可用 frames 指定各階段使用的姿勢（windup/active/recover → 動作表檔名） */
      ["exclusive_zone", "flyswords"].forEach(k => { const m = Stages[2].moves[k]; if (m) m.frames = { windup: "14_cast", active: "14_cast", recover: "14_cast" }; });
      Stages[2].dialogue.post.forEach(l => { if (l.role === "boss") l.expr = "alt"; });
      /* v0.7.2 第 2 關招式審查：一階段權重池（特色招式也要出現）、遠距招、二階段新增 2 招 */
      Stages[2].moves.slash1.damage = 150;
      Stages[2].moves.exclusive_teleport.parryPostureDmg = 16;
      Stages[2].moves.exclusive_zone.zoneTargetP2 = true; /* 二階段罡風陣鎖定玩家位置 */
      Stages[2].moves.teleport_combo = { name: "千幻鏡影・雙襲", isTeleport: true, teleportBehind: true, teleportDelay: 0.22, isCombo: true, comboTotalHits: 2, comboInterval: 0.22, comboDamagePerHit: 95, windup: 0.52, active: 0.50, recover: 0.40, range: 170, lunge: 260, damage: 190, parryPostureDmg: 18 };
      Stages[2].moves.sky_swords = { name: "羅天飛劍・垂落", isRanged: true, bulletCount: 5, bulletSpeed: 700, bulletTrajectory: "vertical", bulletColor: "#38bdf8", frames: { windup: "14_cast", active: "14_cast", recover: "14_cast" }, windup: 0.60, active: 0.20, recover: 0.60, range: 600, lunge: 0, damage: 100, parryPostureDmg: 18 };
      Stages[2].reflectDmg = [70, 10]; /* v0.8.78 三把都彈得到後一輪送 330 血＋42% 架勢太多（使用者：第 2 關比第 1 關簡單）→ 一輪 210＋30% */
      Stages[2].p1Pool = [["slash1", 30], ["flyswords", 20], ["exclusive_zone", 15], ["thrust_peril", 20], ["sweep_peril", 15]];
      /* ===== v0.8.55 第 2 關補強：千幻分身（二階段）＋動態感（變形、殘影、招式特效） ===== */
      {
        const S2 = Stages[2], M = S2.moves;
        M.mirror_split = { name: "千幻・鏡影分身", isSplit: true, armor: true, frames: { windup: "14_cast", active: "14_cast", recover: "14_cast" }, windup: 0.85, active: 0.30, recover: 0.45, range: 0, lunge: 0, damage: 0 };
        S2.splitMove = "mirror_split"; S2.splitFallback = "slash1";
        S2.pool = [["slash1", 30], ["flyswords", 20, "ranged"], ["exclusive_zone", 15], ["thrust_peril", 20], ["sweep_peril", 15]]; /* 一階段（與 p1Pool 相同；有 pool 才會走 pickFromPool／poolP2） */
        S2.poolP2 = [["slash1", 22], ["flyswords", 12, "ranged"], ["exclusive_zone", 9], ["thrust_peril", 13], ["sweep_peril", 11], ["grab_peril", 7], ["exclusive_teleport", 11, "chase"], ["teleport_combo", 11, "chase"], ["sky_swords", 8, "ranged"], ["mirror_split", 9]];
        S2.dfmK = 0.5; /* 變形強度（第 5 關 0.35，顧天風動作較飄逸稍大） */
        M.slash1.dfm = { w: { sx: 0.96, sy: 1.03, rot: -0.07, ox: -16 }, a: { sx: 1.06, sy: 0.97, rot: 0.06, ox: 24, ghost: 2, gap: 34 }, r: {} };
        M.slash1.fxAct = { sheet: "boss2fx", row: 0, ox: 120, oy: -125, w: 360, dur: 0.3 };
        M.thrust_peril.dfm = { w: { sx: 0.93, sy: 1.05, rot: -0.09, ox: -26 }, a: { sx: 1.12, sy: 0.93, rot: 0.06, ox: 32, ghost: 4, gap: 55 }, r: {} };
        M.thrust_peril.fxAct = { sheet: "boss2fx", row: 1, ox: 200, oy: -150, w: 520, dur: 0.32 };
        M.sweep_peril.dfm = { w: { sx: 1.04, sy: 0.95, rot: -0.05, oy: 6 }, a: { sx: 1.05, sy: 0.96, rot: 0.04, ox: 14, ghost: 2, gap: 30 }, r: {} };
        M.sweep_peril.fxAct = { sheet: "boss2fx", row: 2, ox: 50, oy: -40, w: 620, dur: 0.4 };
        M.flyswords.dfm = { w: { sx: 0.97, sy: 1.03, rot: -0.06, ox: -10 }, a: { sx: 1.03, sy: 0.98, rot: 0.03, ox: 8 }, kick: { ox: 7, rot: 0.025, sx: 1.015, sy: 0.99 }, r: {} }; /* v0.8.73 依規則改回輕微幅度（大動作改用生圖關鍵格）；kick＝每發一把輕頓 */
        Object.assign(M.flyswords, { windup: 0.6, active: 0.96, bulletGap: 0.38 }); /* v0.8.72 三把間隔 0.2→0.38 秒（一次格擋 0.36 秒，逐把按）；出手姿勢撐滿整串（原 active 0.15） */
        [M.exclusive_teleport, M.teleport_combo].forEach(m => { if (m) { m.tpFx = true; m.dfm = { w: { sx: 0.95, sy: 1.04, rot: -0.05 }, a: { sx: 1.06, sy: 0.96, rot: 0.05, ox: 20, ghost: 3, gap: 40 }, r: {} }; } });
        if (M.teleport_combo) M.teleport_combo.dfm.pulse = true;
        M.mirror_split.dfm = { w: { sx: 0.97, sy: 1.04 }, a: { sx: 1.04, sy: 0.97 }, r: {}, shake: 3 };
        S2.fxSheets = ["boss2fx", "spark", "boss2sw"]; S2.arcArt = "boss2fx"; /* v0.8.57 專屬特效圖（4×4 黑底：0 扇刃、1 指劍突刺、2 八卦旋風、3 鏡碎）；有圖就不畫程式橘色刀弧 */
        S2.flySwordArt = { sheet: "boss2sw", row: 0, frames: [0, 1, 2, 3], fps: 10, w: 140, tipX: 238, tipY: 108, rot: 0.16, summonRow: 1, breakRow: 2, groundRow: 3 }; /* v0.8.66 專屬飛劍圖 boss2sw（4×4 黑底：0 飛行循環（劍身微斜，rot 補正）、1 召喚成形、2 命中碎裂、3 插地碎散） */
        M.flyswords.bulletY = [-200, -165, -130]; M.flyswords.bulletX = 150; /* v0.8.65 三把飛劍拉高到肩～腰（主角圖約高 240；原 -77／-55／-33＝膝到大腿） */
        S2.introName = "assets/boss2/name.webp";
        /* v0.8.100 第 2 關改影片過場（日式賽璐璐風）：登場「千鏡一影」、二階段「真假難辨」；舊的剪影＋鏡片聚合演出停用 */
        S2.introMovie = "assets/boss2/intro"; S2.p2Movie = "assets/boss2/p2";
        /* v0.8.67 Boss 專屬音效（ElevenLabs）：招式 sfx {w 前搖, a 出招}；其他事件見 bsfx */
        S2.sfx = { tpOut: ["b2_vanish", 0.85], tpIn: ["b2_appear", 0.9], split: ["b2_split", 0.9], ilBreak: ["b2_shatter", 0.8], ilShard: ["b2_shard_hit", 0.85], swordFly: ["b2_sword_fly", 0.55], swordRain: ["b2_sword_rain", 0.85], introSwirl: ["b2_vortex", 0.8], introLand: ["b2_shatter", 0.85] };
        [["slash1", { a: "b2_fan" }], ["thrust_peril", { a: "b2_thrust" }], ["sweep_peril", { a: "b2_vortex" }], ["flyswords", { w: "b2_sword_cast" }], ["sky_swords", { w: "b2_sword_cast" }]].forEach(([k, s]) => { if (M[k]) M[k].sfx = s; });
        /* v0.8.56 五招三拍關鍵格（生圖 3×5，縮放 1.06、腳底 y=560、x=450）＋分層場景（迷蹤陣台地面帶＋前景石欄松枝） */
        M.slash1.frames = { windup: "20_fan_wind", active: "21_fan_hit", recover: "22_fan_rec" };
        M.thrust_peril.frames = { windup: "23_thr_wind", active: "24_thr_hit", recover: "25_thr_rec" };
        M.sweep_peril.frames = { windup: "26_swp_wind", active: "27_swp_hit", recover: "28_swp_rec" };
        [M.flyswords, M.sky_swords].forEach(m => { if (m) m.frames = { windup: "29_cast_wind", active: "30_cast_hit", recover: "31_cast_rec" }; });
        /* v0.8.74 飛劍關鍵格（生圖 6 格，縮放 0.677）：蓄勢扇舉過頭 → 三把各一式（劍指、扇掃、轉身反手指；active 依進度三等分，對準 0.38 秒間隔）→ 收扇；垂落飛劍雙手舉天 */
        if (M.flyswords) M.flyswords.frames = { windup: "35_fs_wind", active: ["36_fs_1", "37_fs_2", "38_fs_3"], recover: "39_fs_rec" };
        if (M.sky_swords) M.sky_swords.frames = { windup: "40_sky_cast", active: "40_sky_cast", recover: "39_fs_rec" };
        [M.exclusive_teleport, M.teleport_combo].forEach(m => { if (m) m.frames = { windup: "32_tp_wind", active: "33_tp_hit", recover: "34_tp_rec" }; });
        /* v0.8.81 三招法陣＋雙襲第二擊關鍵格（生圖 3×4 兩版各取所長，縮放 0.90／0.872 對齊站姿高 490） */
        M.exclusive_zone.frames = { windup: "41_zone_wind", active: "42_zone_hit", recover: "43_zone_rec" };
        M.grab_peril.frames = { windup: "44_grab_tell", active: "45_grab_hit", recover: "46_grab_rec" };
        M.mirror_split.frames = { windup: "47_mir_wind", active: "48_mir_spin", recover: "49_mir_rec" };
        if (M.teleport_combo) M.teleport_combo.frames = { windup: "32_tp_wind", active: ["33_tp_hit", "50_tc_back", "51_tc_low"], recover: "52_tc_rec" };
        S2.spriteExtras = ["41_zone_wind", "42_zone_hit", "43_zone_rec", "44_grab_tell", "45_grab_hit", "46_grab_rec", "47_mir_wind", "48_mir_spin", "49_mir_rec", "50_tc_back", "51_tc_low", "52_tc_rec", "20_fan_wind", "21_fan_hit", "22_fan_rec", "23_thr_wind", "24_thr_hit", "25_thr_rec", "26_swp_wind", "27_swp_hit", "28_swp_rec", "29_cast_wind", "30_cast_hit", "31_cast_rec", "32_tp_wind", "33_tp_hit", "34_tp_rec", "35_fs_wind", "36_fs_1", "37_fs_2", "38_fs_3", "39_fs_rec", "40_sky_cast"];
        S2.layers = [
          { img: "arena2_ground", ground: true, par: 1, y: 455, h: 330, dim: 0.08 },
          { img: "arena2_fg", fg: true, par: 1.35, y: 560, h: 250, alpha: 0.95, dim: 0.15 }
        ];
      }
      Stages[2].farMoves = ["flyswords"];
      Stages[2].farMovesP2 = ["exclusive_teleport", "teleport_combo", "exclusive_zone", "sky_swords"];

      /* ===== v0.7.4/0.7.5 第 3 關 莫寒川（雙姿態）：一階段 A＝青雲雙劍（快）、進二階段換 B＝玄鐵重劍（慢）===== */
      Stages[3].sprite = "boss3";
      Stages[3].bg = "arena3"; Stages[3].bgDim = 0.2;
      Stages[3].dialogue.post.forEach(l => { if (l.role === "boss") l.expr = "alt"; });
      (function () {
        const M = Stages[3].moves;
        M.slash1.name = "疾風雙劍・瞬影連斬";
        M.exclusive_combo = { name: "雙劍十字斬 (每下招架)", isCombo: true, comboTotalHits: 3, comboInterval: 0.20, comboDamagePerHit: 90, windup: 0.42, active: 0.62, recover: 0.38, range: 170, lunge: 360, damage: 150, parryPostureDmg: 16 };
        M.exclusive_feint.name = "假動作連斬 (等實際揮下)"; M.exclusive_feint.feintPauseAt = 0.45; M.exclusive_feint.feintPauseDur = 0.30;
        M.slash2.name = "寒川回旋・旋風刃";
        M.dash_rush = { name: "疾步突進 (瞬步穿過)", isCharge: true, chargeSpeed: 900, pose: "thrust", windup: 0.50, active: 0.45, recover: 0.70, range: 130, lunge: 900, damage: 200, parryPostureDmg: 18 };
        M.grab_peril.name = "【危】叛宗劍陣 (極限側閃)";
        /* 重劍姿態專屬 */
        M.heavy_slam = { name: "玄鐵壓頂 (霸體・蓄力重斬打斷)", armor: true, windup: 0.72, active: 0.18, recover: 0.58, range: 205, lunge: 260, damage: 230, parryPostureDmg: 30 };
        M.heavy_slash = { name: "玄鐵劈砍", windup: 0.48, active: 0.16, recover: 0.42, range: 215, lunge: 280, damage: 190, parryPostureDmg: 26 };
        M.heavy_zone = { name: "戒律鎮壓 (跳起)", isZone: true, zoneType: "fire", zoneWidth: 380, zoneDuration: 2.6, zoneDamagePerSec: 160, zoneTargetP2: true, frames: { windup: "14_cast", active: "14_cast", recover: "14_cast" }, windup: 0.60, active: 0.20, recover: 0.45, range: 330, lunge: 0, damage: 140 };
        M.heavy_thrust = { name: "【危】玄鐵撼嶽撞 (前閃看破)", pose: "thrust", windup: 0.65, active: 0.22, recover: 0.68, range: 270, lunge: 860, damage: 330, isPerilous: true, perilType: "thrust" };
        M.heavy_sweep = { name: "【危】千鈞橫江斬 (起跳踩頭)", pose: "sweep", windup: 0.66, active: 0.24, recover: 0.65, range: 250, lunge: 260, damage: 300, isPerilous: true, perilType: "sweep" };
        /* 二階段（重劍）：連斬接落地震波 */
        M.sword_cleave = { name: "玄鐵重劈 (連斬接震波)", isCombo: true, comboTotalHits: 2, comboInterval: 0.26, comboDamagePerHit: 120, isZone: true, zoneType: "fire", zoneWidth: 340, zoneDuration: 2.4, zoneDamagePerSec: 150, windup: 0.70, active: 0.62, recover: 0.60, range: 210, lunge: 280, damage: 240, parryPostureDmg: 26 };
        /* 換姿：0.6 秒拔劍前搖（無傷害，可趁機攻擊） */
        M.stance_switch = { name: "拔劍換姿", isSwitch: true, frames: { windup: "14_cast", active: "14_cast", recover: "14_cast" }, windup: 0.60, active: 0.05, recover: 0.15, range: 0, lunge: 0, damage: 0 };
        Stages[3].stanceByPhase = { 1: "A", 2: "B" }; /* 一階段雙劍、二階段玄鐵重劍（進二階段時拔重劍） */
        /* 叛宗劍陣：不再用拔劍姿勢，改成舉劍→劍雨落下插地 */
        M.grab_peril.swordRain = 9; M.grab_peril.frames = { windup: "07_windup", active: "09_slash", recover: "10_slash_rec" };
        Stages[3].stances = {
          A: { sprite: "boss3", stride: 250, walkSeq: ["03_walk1", "04_walk2", "05_walk3", "06_walk4"], remap: { "12_thrust_rec": "10_slash_rec" }, /* 雙劍表第 12 格只畫了手、沒有劍，突刺收招改用第 10 格 */
            pool: [["slash1", 26], ["exclusive_combo", 22], ["exclusive_feint", 20], ["slash2", 10], ["dash_rush", 8], ["thrust_peril", 7], ["sweep_peril", 7]],
            far: ["dash_rush"], farP2: [] },
          B: { sprite: "boss3b", stride: 200, walkSeq: ["03_walk1", "01_idle1", "03_walk1", "02_idle2"], alias: { thrust_peril: "heavy_thrust", sweep_peril: "heavy_sweep" }, /* v0.8.60 低掃在重劍姿態也換成千鈞橫江斬（否則會找雙劍圖） */
            pool: [["heavy_slam", 30], ["heavy_slash", 22], ["heavy_zone", 18], ["heavy_thrust", 15], ["heavy_sweep", 15]],
            poolP2: [["heavy_slam", 22], ["heavy_slash", 16], ["heavy_zone", 18], ["heavy_thrust", 14], ["heavy_sweep", 14], ["sword_cleave", 16]],
            far: [], farP2: ["heavy_zone"] }
        };
        /* v0.8.59 三拍關鍵格（A 雙劍表 3×5 → assets/boss3/20～34；B 重劍表 3×5 → assets/boss3b/20～31、35～37 拔劍）＋專屬特效
           boss3fx（A，淡紫銀光）：0 雙月牙刀弧、1 旋風環、2 突刺光、3 劍雨飛劍；boss3bfx（B，硃紅金）：0 重劍弧、1 落地震波、2 戒律陣紋（循環）、3 拔劍爆氣 */
        const F = (w, a, r) => ({ windup: w, active: a, recover: r });
        const S3 = Stages[3];
        M.slash1.frames = F("20_hs_wind", "21_hs_hit", "22_hs_rec");
        M.exclusive_combo.frames = F("23_x_wind", ["25_x_hit", "21_hs_hit", "25_x_hit"], "22_hs_rec");
        M.exclusive_feint.frames = F("24_x_hold", "25_x_hit", "22_hs_rec");
        M.slash2.frames = F("26_spin_wind", "27_spin_hit", "28_spin_rec");
        M.slash1.windup = 0.36; M.slash2.windup = 0.36; M.thrust_peril.windup = 0.6; /* v0.8.80 依戰鬥規範：開場招 ≥0.35、危招 ≥0.6（原 0.28／0.32／0.58） */
        M.dash_rush.frames = F("29_dash_wind", "30_dash_hit", "31_dash_rec");
        M.thrust_peril.frames = F("29_dash_wind", "30_dash_hit", "31_dash_rec");
        M.sweep_peril.frames = F("32_low_wind", "33_low_hit", "34_low_rec");
        M.grab_peril.frames = F("24_x_hold", "25_x_hit", "22_hs_rec");
        M.heavy_slam.frames = F("20_slam_wind", "21_slam_hit", "22_slam_rec");
        M.heavy_slash.frames = F("20_slam_wind", "21_slam_hit", "22_slam_rec");
        M.sword_cleave.frames = F("20_slam_wind", ["21_slam_hit", "30_sweep_hit"], "31_sweep_rec");
        M.heavy_zone.frames = F("23_plunge_jump", "24_plunge_hit", "25_plunge_rec");
        M.heavy_thrust.frames = F("26_charge_wind", "27_charge_hit", "28_charge_rec");
        M.heavy_sweep.frames = F("29_sweep_wind", "30_sweep_hit", "31_sweep_rec");
        M.stance_switch.frames = F("35_draw_a", "36_draw_b", "37_draw_c"); /* 前搖仍是 A 姿態（35 兩邊資料夾都有），active 起點換成 B */
        M.stance_switch.windup = 0.75; M.stance_switch.burst = { sheet: "boss3bfx", row: 3, ox: 0, oy: 10, w: 560, dur: 0.6, anchor: "b" };
        S3.phaseSwitchMove = "stance_switch"; /* 進二階段真的播一次拔重劍（被打斷時直接換姿） */
        S3.stances.A.extras = ["20_hs_wind", "21_hs_hit", "22_hs_rec", "23_x_wind", "24_x_hold", "25_x_hit", "26_spin_wind", "27_spin_hit", "28_spin_rec", "29_dash_wind", "30_dash_hit", "31_dash_rec", "32_low_wind", "33_low_hit", "34_low_rec", "35_draw_a"];
        S3.stances.B.extras = ["20_slam_wind", "21_slam_hit", "22_slam_rec", "23_plunge_jump", "24_plunge_hit", "25_plunge_rec", "26_charge_wind", "27_charge_hit", "28_charge_rec", "29_sweep_wind", "30_sweep_hit", "31_sweep_rec", "35_draw_a", "36_draw_b", "37_draw_c"];
        S3.fxSheets = ["boss3fx", "boss3bfx"]; S3.arcArt = "boss3fx";
        S3.swordRainArt = "boss3fx"; /* 劍雨用 boss3fx 列 3（無圖時退回程式畫） */
        S3.zoneArt = { fire: ["boss3bfx", 2] }; /* 戒律鎮壓地面區域用陣紋循環 */
        S3.layers = [
          { img: "arena3_ground", ground: true, par: 1, y: 455, h: 330, dim: 0.06 }, /* v0.8.61 竹林石台地面帶 */
          { img: "arena3_fg", fg: true, par: 1.35, y: 560, h: 250, alpha: 0.95, dim: 0.18 } /* v0.8.63 前景竹叢剪影 */
        ];
        S3.introName = "assets/boss3/name.webp"; /* v0.8.63 書法名牌「莫寒川」 */
        /* v0.8.101 第 3 關改影片過場（日式賽璐璐風）：登場「竹林拔劍」；舊的剪影＋飛劍聚合登場停用（二階段影片待接） */
        S3.introMovie = "assets/boss3/intro"; S3.p2Movie = "assets/boss3/p2"; /* v0.8.103 二階段影片（跪姿→竹葉→背影拔重劍→白光→全身定格） */
        /* v0.8.68 Boss 專屬音效（ElevenLabs b3_*）：招式 sfx {w 前搖, a 出招, h 連擊每下}；zone＝戒律陣紋生成時的低鳴 */
        S3.sfx = { zone: ["b3_seal", 0.75], introSwirl: ["b3_spin", 0.8], introLand: ["b3_cross", 0.85] };
        [["slash1", { a: "b3_twin" }], ["exclusive_combo", { h: "b3_cross" }], ["exclusive_feint", { a: "b3_cross" }], ["slash2", { a: "b3_spin" }], ["dash_rush", { a: "b3_dash" }], ["thrust_peril", { a: "b3_dash" }], ["sweep_peril", { a: "b3_low" }], ["grab_peril", { a: "b3_rain" }],
         ["heavy_slam", { a: "b3_heavy" }], ["heavy_slash", { a: "b3_heavy" }], ["sword_cleave", { h: "b3_heavy" }], ["heavy_zone", { a: "b3_plunge" }], ["heavy_thrust", { a: "b3_charge" }], ["heavy_sweep", { a: "b3_sweep" }], ["stance_switch", { a: "b3_draw" }]].forEach(([k, s]) => { if (M[k]) M[k].sfx = s; });
        const A0 = { sheet: "boss3fx", row: 0, ox: 140, oy: -150, w: 380, dur: 0.3 };
        M.slash1.fxAct = A0;
        M.exclusive_feint.fxAct = A0;
        M.exclusive_combo.fxHit = { sheet: "boss3fx", row: 0, ox: 130, oy: -140, w: 360, dur: 0.24, rot: 0.55 };
        M.slash2.fxAct = { sheet: "boss3fx", row: 1, ox: 0, oy: -120, w: 560, h: 330, dur: 0.4 };
        M.dash_rush.fxAct = { sheet: "boss3fx", row: 2, ox: 160, oy: -150, w: 620, h: 260, dur: 0.34 };
        M.thrust_peril.fxAct = { sheet: "boss3fx", row: 2, ox: 220, oy: -150, w: 640, h: 260, dur: 0.32 };
        M.sweep_peril.fxAct = { sheet: "boss3fx", row: 0, ox: 120, oy: -45, w: 600, h: 260, dur: 0.48 };
        const B0 = { sheet: "boss3bfx", row: 0, ox: 150, oy: -170, w: 440, dur: 0.32, alpha: 0.85 }, B1 = { sheet: "boss3bfx", row: 1, ox: 230, oy: 18, w: 400, dur: 0.5, anchor: "b", alpha: 0.85 };
        M.heavy_slam.fxAct = [B0, B1];
        M.heavy_slash.fxAct = [B0, Object.assign({}, B1, { w: 360, alpha: 0.8 })];
        M.sword_cleave.fxHit = [B0, B1];
        M.heavy_zone.fxAct = [{ sheet: "boss3bfx", row: 1, ox: 60, oy: 18, w: 520, dur: 0.55, anchor: "b" }];
        M.heavy_thrust.fxAct = [{ sheet: "boss3bfx", row: 1, ox: 90, oy: 18, w: 380, dur: 0.45, anchor: "b", alpha: 0.85 }];
        M.heavy_sweep.fxAct = { sheet: "boss3bfx", row: 0, ox: 130, oy: -70, w: 720, h: 330, dur: 0.5 };
      })();
      /* ===== v0.8.23 第 5 關 九幽魔狼：一階段小狼（A）→ 仰天長嘯蛻變 → 二階段大狼（B）。美術到位前用程式畫的野獸頂替 =====
         動作格沿用人形 16 格命名：07 伏身、08 蓄力撲、09 揮爪、10 收招、11 空中撲咬、12 落地、13 甩尾旋掃、14 長嘯、15 hurt、16 stagger */
      (function () {
        const S5 = Stages[5];
        S5.name = "九幽魔狼"; S5.bg = "arena5"; S5.arenaName = "荒原殘陽";
        S5.realmBadge = "妖王初期・九幽魔煞兇獸";
        const M = {};
        const FR = (w, a, r) => ({ windup: w, active: a, recover: r });
        /* --- 小狼（快、低、打了就跑） --- */
        M.s_bite = { fxAct: { sheet: "wolf", row: 1, ox: 120, oy: -85, w: 280, dur: 0.26 }, kick: 0.12, name: "幽影撕咬", frames: { windup: ["40_sb_wind"], active: ["41_sb_open", "42_sb_snap"], recover: ["43_sb_rec"] }, windup: 0.40, active: 0.12, recover: 0.22, range: 150, lunge: 520, damage: 120, parryPostureDmg: 16 };
        M.s_bite2 = { fxHit: { sheet: "wolf", row: 1, ox: 110, oy: -85, w: 240, dur: 0.22 }, kickHit: 0.08, name: "連環撕咬", isCombo: true, comboTotalHits: 2, comboInterval: 0.16, comboDamagePerHit: 85, frames: { windup: ["40_sb_wind"], active: ["41_sb_open", "42_sb_snap", "41_sb_open", "42_sb_snap"], recover: ["43_sb_rec"] }, windup: 0.38, active: 0.45, recover: 0.30, range: 155, lunge: 420, damage: 100, parryPostureDmg: 14 };
        M.s_claw3 = { kickHit: 0.08, fxHit: { sheet: "wolf", row: 0, ox: 110, oy: -90, w: 300, dur: 0.25 }, name: "血爪三連", isCombo: true, comboTotalHits: 3, comboInterval: 0.18, comboDamagePerHit: 80, frames: { windup: ["44_sc_rear"], active: ["45_sc_a", "46_sc_b", "45_sc_a"], recover: ["47_sc_rec"] }, windup: 0.42, active: 0.62, recover: 0.34, range: 160, lunge: 420, damage: 110, parryPostureDmg: 14 };
        M.s_pounce = { fxLand: 0.45, kick: 0.1, name: "疾撲 (閃開，或起跳踩頭)", isLeap: true, leapH: 130, leapMax: 460, frames: { windup: ["48_sp_coil"], active: ["49_sp_rise", "50_sp_dive"], recover: ["51_sp_land"] }, windup: 0.42, active: 0.36, recover: 0.42, range: 150, lunge: 0, damage: 150, parryPostureDmg: 16 };
        M.s_rush = { fxAct: { sheet: "wolf", row: 0, ox: 150, oy: -90, w: 440, dur: 0.3 }, kick: 0.22, name: "【危】狂暴衝撲 (前閃看破)", isPerilous: true, perilType: "thrust", frames: { windup: ["52_sr_tell"], active: ["53_sr_dart"], recover: ["51_sp_land", "43_sb_rec"] }, windup: 0.60, active: 0.20, recover: 0.55, range: 300, lunge: 980, damage: 300 };
        M.s_tail = { fxAct: { sheet: "wolf2", row: 0, ox: 20, oy: -40, w: 620, h: 280, dur: 0.45, alpha: 0.85 }, kick: 0.15, name: "【危】甩尾旋斬 (起跳踩頭)", isPerilous: true, perilType: "sweep", frames: { windup: ["56_st_wind"], active: ["57_st_spin"], recover: ["58_st_rec"] }, windup: 0.60, active: 0.22, recover: 0.50, range: 230, lunge: 240, damage: 260 };
        M.s_shadow = { name: "幽影閃 (繞背)", isTeleport: true, teleportBehind: true, teleportDelay: 0.30, teleportText: "【幽影閃】", teleportColor: "#c084fc", frames: { windup: ["40_sb_wind"], active: ["55_ss_hit"], recover: ["47_sc_rec"] }, windup: 0.50, active: 0.12, recover: 0.34, range: 150, lunge: 300, damage: 130, parryPostureDmg: 14 };
        M.backstep = { name: "後撤", isMobility: true, frames: { windup: "04_walk2", active: "04_walk2", recover: "01_idle1" }, windup: 0.08, active: 0.24, recover: 0.08, range: 0, lunge: -1000, damage: 0 };
        M.dash_in = { name: "衝步", isMobility: true, frames: { windup: "03_walk1", active: "03_walk1", recover: "01_idle1" }, windup: 0.10, active: 0.20, recover: 0.05, range: 0, lunge: 1250, damage: 0 };
        M.s_rage = { kickHit: 0.1, name: "嗜血狂亂 (霸體)", isRage: true, armor: true, isCombo: true, comboTotalHits: 4, comboInterval: 0.16, comboDamagePerHit: 80, frames: { windup: ["59_s_howl"], active: ["45_sc_a", "41_sb_open", "46_sc_b", "42_sb_snap"], recover: ["43_sb_rec"] }, windup: 0.50, active: 0.78, recover: 0.55, range: 165, lunge: 460, damage: 120, parryPostureDmg: 18 };
        /* --- 蛻變（不是攻擊：長嘯 1.4 秒脹大，active 起點換成大狼，震退） --- */
        M.transform = { name: "九幽狼王・覺醒", isSwitch: true, isTransform: true, armor: true, switchText: { B: "〔九幽狼王・覺醒〕" }, frames: { windup: ["59_s_howl"], active: ["56_b_howl"], recover: ["56_b_howl"] }, windup: 1.4, active: 0.4, recover: 0.7, range: 0, lunge: 0, damage: 0 };
        /* --- 大狼（慢、重、大範圍；range 含半個身長） --- */
        M.b_swipe = { kick: 0.35, fxAct: { sheet: "wolf", row: 0, ox: 200, oy: -210, w: 640, dur: 0.34 }, name: "巨爪橫掃", frames: { windup: ["40_bw_wind"], active: ["41_bw_mid", "42_bw_follow"], recover: ["43_bw_rec"] }, windup: 0.62, active: 0.18, recover: 0.55, range: 330, lunge: 220, damage: 210, parryPostureDmg: 28 };
        M.b_stomp = { kickHit: 0.3, name: "地面連錘", isCombo: true, comboTotalHits: 3, comboInterval: 0.30, comboDamagePerHit: 110, fxHit: { sheet: "wolf2", row: 1, ox: 260, oy: 60, w: 600, dur: 0.5, anchor: "b", alpha: 0.9 }, frames: { windup: ["44_bs_up"], active: ["45_bs_down", "46_bs_up2", "45_bs_down"], recover: ["47_bs_rec"] }, windup: 0.60, active: 1.0, recover: 0.55, range: 320, lunge: 300, damage: 160, parryPostureDmg: 20 };
        M.b_leap = { kick: 0.3, name: "【危】巨狼躍壓 (閃開，或起跳踩頭)", isLeap: true, fxLand: true, isPerilous: true, perilType: "leap", leapH: 230, leapMax: 640, frames: { windup: ["48_bl_crouch"], active: ["49_bl_fly", "50_bl_dive"], recover: ["51_bl_land"] }, windup: 0.75, active: 0.60, recover: 0.80, range: 300, lunge: 0, damage: 300, parryPostureDmg: 22 };
        M.b_howl = { kick: 0.25, fxAct: { sheet: "wolf", row: 3, ox: 260, oy: -250, w: 900, dur: 0.7 }, name: "咆哮震波 (霸體・震退)", armor: true, pushback: 900, frames: { windup: ["07_windup"], active: ["56_b_howl"], recover: ["43_bw_rec"] }, windup: 0.65, active: 0.15, recover: 0.50, range: 420, lunge: 0, damage: 90, parryPostureDmg: 20 };
        M.b_bone = { name: "白骨刺陣", isZone: true, zoneType: "bone", zoneWidth: 320, zoneDuration: 2.4, zoneDamagePerSec: 150, zoneTargetPlayer: true, frames: { windup: ["14_cast"], active: ["57_b_summon"], recover: ["47_bs_rec"] }, windup: 0.55, active: 0.20, recover: 0.50, range: 300, lunge: 0, damage: 120 };
        M.b_bite = { kick: 0.4, name: "【危】噬魂吞咬 (極限側閃)", isPerilous: true, perilType: "grab", fxAct: { sheet: "wolf", row: 1, ox: 300, oy: -190, w: 560, dur: 0.36 }, frames: { windup: ["52_bb_tell"], active: ["53_bb_snap"], recover: ["47_bs_rec"] }, windup: 0.70, active: 0.16, recover: 0.75, range: 260, lunge: 0, damage: 350 };
        M.b_tail = { kick: 0.25, fxAct: { sheet: "wolf2", row: 0, ox: 40, oy: -70, w: 1150, h: 520, dur: 0.5, alpha: 0.9 }, name: "【危】魔尾裂風掃 (起跳踩頭)", isPerilous: true, perilType: "sweep", frames: { windup: ["58_bt_wind"], active: ["59_bt_spin"], recover: ["43_bw_rec"] }, windup: 0.60, active: 0.24, recover: 0.62, range: 360, lunge: 260, damage: 300 };
        M.b_rush = { kick: 0.25, name: "巨狼衝撞 (跳躍越過)", isCharge: true, armor: true, chargeSpeed: 720, frames: { windup: ["54_bc_wind"], active: ["55_bc_run"], recover: ["47_bs_rec"] }, windup: 0.70, active: 0.70, recover: 0.90, range: 260, lunge: 720, damage: 260, parryPostureDmg: 24 };
        M.b_rage = { kickHit: 0.15, fxHit: { sheet: "wolf", row: 0, ox: 220, oy: -200, w: 700, dur: 0.3 }, name: "血海狼嚎・亂爪 (霸體)", isRage: true, armor: true, isCombo: true, comboTotalHits: 3, comboInterval: 0.26, comboDamagePerHit: 130, frames: { windup: ["56_b_howl"], active: ["41_bw_mid", "45_bs_down", "42_bw_follow"], recover: ["43_bw_rec"] }, windup: 0.70, active: 0.95, recover: 0.70, range: 340, lunge: 320, damage: 220, parryPostureDmg: 26 };
        Object.values(M).forEach(m => { if (m.range) m.range = Math.round(m.range * CHAR_K); });
        S5.moves = M;
        const SFX = { s_bite: { w: "w_snarl", a: "w_snap" }, s_bite2: { w: "w_snarl", h: "w_snap" }, s_claw3: { w: "w_snarl", h: "w_claw" }, s_pounce: { w: "w_snarl", a: "w_bark" }, s_rush: { w: "w_snarl", a: "w_bark" }, s_tail: { w: "w_snarl", a: "w_claw" }, s_shadow: { a: "w_claw" }, s_rage: { w: "w_howl", a: "w_bark" }, backstep: { a: "w_claw" }, dash_in: { a: "w_claw" },
          b_swipe: { w: "m_growl", a: "m_swipe" }, b_stomp: { w: "m_growl", h: "m_stomp" }, b_howl: { a: "m_roar" }, b_bone: { w: "m_growl" }, b_leap: { w: "m_growl", a: "m_roar" }, b_bite: { w: "m_growl", a: "m_bite" }, b_tail: { w: "m_growl", a: "m_swipe" }, b_rush: { w: "m_growl", a: "m_roar" }, b_rage: { w: "m_howl", h: "m_swipe" }, transform: { w: "w_howl" } };
        Object.keys(SFX).forEach((k) => { if (M[k]) M[k].sfx = SFX[k]; }); /* v0.8.34 狼的招式音效：w＝前搖、a＝出招、h＝連擊每一下 */
        S5.dfmK = 0.35; /* 變形強度：使用者要求輕微（原 1.0 太誇張）*/ S5.fxSheets = ["wolf", "wolf2", "land", "flame"]; S5.zoneArt = { bone: ["wolf2", 2, "up"] }; S5.landArt = ["wolf2", 3]; /* v0.8.82 第二張專屬特效圖：0 甩尾魂焰弧、1 錘地震波、2 白骨刺（1～3 循環）、3 落地衝擊 */ S5.stanceByPhase = { 1: "A", 2: "B" }; S5.transformMove = "transform"; S5.transformGrow = 2.67; /* v0.8.82 小狼放大 0.64→0.72，脹大倍數 3.0×0.64/0.72 讓蛻變終點大小不變 */ /* 蛻變時小狼脹大的倍數（接近大狼／小狼體型比） */
        /* v0.8.79 第 5 關分層場景：荒原殘陽地面帶＋前景剪影（參數同第 2 關） */
        S5.layers = [
          { img: "arena5_ground", ground: true, par: 1, y: 455, h: 330, dim: 0.08 },
          { img: "arena5_fg", fg: true, par: 1.35, y: 560, h: 250, alpha: 0.95, dim: 0.15 }
        ];
        S5.stances = {
          A: { sprite: "boss5", extras: ["20_bite_crouch", "21_bite_lunge", "22_pounce_coil", "23_pounce_fly", "24_pounce_dive", "25_pounce_land", "26_rush", "27_tail_wind", "28_tail_spin", "29_claw", "40_sb_wind", "41_sb_open", "42_sb_snap", "43_sb_rec", "44_sc_rear", "45_sc_a", "46_sc_b", "47_sc_rec", "48_sp_coil", "49_sp_rise", "50_sp_dive", "51_sp_land", "52_sr_tell", "53_sr_dart", "54_sr_skid", "55_ss_hit", "56_st_wind", "57_st_spin", "58_st_rec", "59_s_howl"], stride: 170, speed: 430, walkSeq: ["03_walk1", "04_walk2", "05_walk3", "06_walk4"], spriteScale: 0.72, hurtHalf: 45, bodyW: 165, bodyH: 70, rageMove: "s_rage",
            pool: [["s_bite", 14], ["s_bite2", 12], ["s_claw3", 11], ["s_bite+backstep", 10, "mobility"], ["s_pounce+backstep", 9, "mobility"], ["dash_in+s_bite", 10, "chase"], ["s_rush", 8], ["s_tail", 8], ["s_shadow+s_bite", 8, "chase"]],
            far: ["dash_in+s_bite", "s_pounce"], farP2: [] },
          B: { sprite: "boss5b", stride: 330, speed: 250, /* 大狼：站立與走路只用外觀一致（無骨腿）的格子，避免 AI 生圖各格骨腿有無不同而閃爍 */
            extras: ["22_swipe_rear", "23_swipe_mid", "24_slam_up", "25_slam_mid", "26_leap_crouch", "27_leap_fly", "28_leap_dive", "29_bite_wind", "30_bite_snap", "31_rush", "32_tail_wind", "33_tail_spin", "40_bw_wind", "41_bw_mid", "42_bw_follow", "43_bw_rec", "44_bs_up", "45_bs_down", "46_bs_up2", "47_bs_rec", "48_bl_crouch", "49_bl_fly", "50_bl_dive", "51_bl_land", "52_bb_tell", "53_bb_snap", "54_bc_wind", "55_bc_run", "56_b_howl", "57_b_summon", "58_bt_wind", "59_bt_spin"], walkSeq: ["03_walk1", "04_walk2", "05_walk3", "06_walk4"], spriteScale: 1.05, hurtHalf: 230, bodyW: 520, bodyH: 300, rageMove: "b_rage",
            pool: [["b_swipe", 16], ["b_stomp", 12], ["b_howl", 9, "push"], ["b_bone", 10], ["b_bite", 9], ["b_tail", 9], ["b_leap", 12, "mobility"], ["b_rush", 8, "chase"]],
            far: ["b_rush", "b_leap"], farP2: [] }
        };
      })();
      /* v0.8.99 第 1 關改影片過場（日式賽璐璐風，使用者用 Gemini 生；舊的崖頂剪影躍下演出停用） */
      Stages[1].introMovie = "assets/boss1/intro"; Stages[1].p2Movie = "assets/boss1/p2"; Stages[1].introName = "assets/boss1/name.webp"; Stages[1].spriteExtras = ["20_jump", "36_tq_wind", "37_tq_hit", "38_tq_rec", "39_cb_wind", "40_cb_h1", "41_cb_h2", "42_cb_rec", "43_dl_hold", "44_dl_hit", "45_tw_wind", "46_tw_rel", "47_tw_catch", "48_sp_wind", "49_sp_hit", "50_sp_rec", "51_ch_wind", "52_ch_run", "53_ch_stop", "54_sh_vanish", "55_sh_strike", "21_fall", "22_land", "23_rise", "24_chop_wind", "25_chop_hit", "26_chop_rec", "27_thr_wind", "28_thr_hit", "29_thr_rec", "30_swp_wind", "31_swp_hit", "32_swp_rec", "33_leap_crouch", "34_leap_air", "35_leap_land"];
      /* v0.8.33 第 5 關登場：影片（剪影小狼＋巨狼影子）→ 揚塵淡出 → 小狼衝進場煞停、名字卡（introDash 模式，需影片） */
Stages[5].introCine = true; Stages[5].introDash = true; Stages[5].introVideo = "assets/boss5/intro"; Stages[5].introBg = "intro5"; Stages[5].introName = "assets/boss5/name.webp";
Stages[5].introA = 5.6; Stages[5].introFlash = "214,196,170"; Stages[5].introSfx = [[1.9, "w_snarl", 0.45, 1.1], [2.9, "m_howl", 0.95, 1], [4.0, "w_bark", 0.85, 1.1], [4.4, "w_claw", 0.7, 1]]; Stages[5].introLandSfx = "w_snarl"; Stages[5].spriteExtras = ["26_rush", "25_pounce_land", "20_bite_crouch"];
Stages[1].sprite = "boss1"; /* 有 sprite 的關卡使用 assets/<sprite>/ 圖片 */
      /* 第 1 關二階段新招（只出現在二階段隨機池）：戈擲（長柄投射物）、衝鋒（直線突進，可跳躍越過） */
      Stages[1].moves.halberd_throw = { name: "神衛擲戈 (可折射)", isRanged: true, bulletCount: 1, bulletSpeed: 1050, bulletTrajectory: "linear", bulletKind: "halberd", bulletColor: "#f59e0b", windup: 0.55, active: 0.20, recover: 0.55, range: 700, lunge: 0, damage: 170, parryPostureDmg: 22 };
      Stages[1].moves.charge_rush = { name: "神衛衝鋒 (跳躍越過)", isCharge: true, armor: true, chargeSpeed: 760, windup: 0.70, active: 0.60, recover: 0.85, range: 150, lunge: 760, damage: 230, parryPostureDmg: 24 };
      /* ===== v0.8.0 第 1 關改為完整版的王：跳躍、後撤、衝步、繞背、延遲補刀、震退、怒氣，並依玩家打法調整招式 ===== */
      (function () {
        const M = Stages[1].moves;
        M.charge_rush.chainOnHit = true; /* 衝鋒命中才接追擊 */
        /* M2 統領四招三拍關鍵格（v0.8.46 生圖）：起手要一眼認出是哪一招 */
        M.slash1.frames = { windup: "24_chop_wind", active: "25_chop_hit", recover: "26_chop_rec" };
        M.slash2.windup = 0.36; /* v0.8.80 依戰鬥規範：開場招 ≥0.35（原 0.32） */
        M.thrust_peril.frames = { windup: "27_thr_wind", active: "28_thr_hit", recover: "29_thr_rec" };
        M.sweep_peril.frames = { windup: "30_swp_wind", active: "31_swp_hit", recover: "32_swp_rec" };
        M.leap_slam = { name: "【危】神衛躍斬 (閃開，或起跳踩頭)", isLeap: true, isPerilous: true, perilType: "leap", leapH: 250, frames: { windup: "33_leap_crouch", active: "34_leap_air", recover: "35_leap_land" }, windup: 0.72, active: 0.55, recover: 0.78, range: 190, lunge: 0, damage: 280, parryPostureDmg: 22 };
        M.backstep = { name: "神衛後撤", isMobility: true, frames: { windup: "04_walk2", active: "04_walk2", recover: "01_idle1" }, windup: 0.10, active: 0.28, recover: 0.10, range: 0, lunge: -900, damage: 0 };
        M.dash_in = { name: "神衛衝步", isMobility: true, frames: { windup: "03_walk1", active: "03_walk1", recover: "01_idle1" }, windup: 0.12, active: 0.22, recover: 0.06, range: 0, lunge: 1100, damage: 0 };
        M.combo_delay = { name: "神衛斷雲連戟・遲刃 (最後一刀慢半拍)", isCombo: true, pose: "thrust", comboTotalHits: 3, comboInterval: 0.22, comboLastDelay: 0.36, comboDamagePerHit: 110, windup: 0.44, active: 1.15, recover: 0.45, range: 185, lunge: 380, damage: 130, parryPostureDmg: 16 };
        M.shock_push = { name: "神衛震戟 (霸體・震退)", armor: true, pushback: 780, windup: 0.52, active: 0.14, recover: 0.55, range: 215, lunge: 120, damage: 90, parryPostureDmg: 18 };
        M.shadow_strike = { name: "神衛影遁斬 (繞背)", isTeleport: true, teleportBehind: true, teleportDelay: 0.4, teleportText: "【神衛影遁】", teleportColor: "#f87171", windup: 0.62, active: 0.13, recover: 0.38, range: 175, lunge: 260, damage: 170, parryPostureDmg: 20 };
        M.rage_chain = { name: "神衛怒煞連戟 (霸體)", isRage: true, armor: true, isCombo: true, pose: "thrust", comboTotalHits: 3, comboInterval: 0.18, comboDamagePerHit: 105, windup: 0.60, active: 0.75, recover: 0.65, range: 195, lunge: 420, damage: 200, parryPostureDmg: 24 };
        /* v0.8.81 其餘七招三拍關鍵格（生圖 4×5，縮放 1.13 對齊 v0.8.46 關鍵格）；陣列＝active 期間依進度平均切換 */
        const F1 = (w, a, r) => ({ windup: w, active: a, recover: r });
        M.slash2.frames = F1("36_tq_wind", "37_tq_hit", "38_tq_rec");
        if (M.exclusive_combo) M.exclusive_combo.frames = F1("39_cb_wind", ["40_cb_h1", "41_cb_h2"], "42_cb_rec");
        M.combo_delay.frames = F1("39_cb_wind", ["40_cb_h1", "41_cb_h2", "43_dl_hold", "44_dl_hit", "44_dl_hit"], "42_cb_rec"); /* 第三刀前定在高舉停頓格 */
        M.rage_chain.frames = F1("39_cb_wind", ["40_cb_h1", "41_cb_h2", "44_dl_hit"], "42_cb_rec");
        M.halberd_throw.frames = F1("45_tw_wind", "46_tw_rel", "47_tw_catch");
        M.shock_push.frames = F1("48_sp_wind", "49_sp_hit", "50_sp_rec");
        M.charge_rush.frames = F1("51_ch_wind", "52_ch_run", "53_ch_stop");
        M.shadow_strike.frames = F1("54_sh_vanish", "55_sh_strike", "42_cb_rec");
        /* v0.8.122 第 1 關位移／瞬移招掛生圖（暫用同關 land 特效圖：列 0 紅環、列 1 煙塵；之後可換 Gemini 專屬圖，只改這裡的 sheet／row） */
        M.dash_in.fxAct = { sheet: "land", row: 1, ox: -30, oy: 8, w: 300, dur: 0.5, anchor: "b" };
        M.backstep.fxAct = { sheet: "land", row: 1, ox: 0, oy: 8, w: 300, dur: 0.5, anchor: "b" };
        M.shadow_strike.fxVanish = { sheet: "land", row: 1, ox: 0, oy: 8, w: 340, dur: 0.55, anchor: "b" };
        M.shadow_strike.fxAppear = { sheet: "land", row: 0, ox: 0, oy: 10, w: 420, h: 170, dur: 0.5, anchor: "b" };
        Stages[1].pool = [
          ["slash1", 14, "break"], ["slash2", 9], ["exclusive_combo", 11], ["combo_delay", 11], ["thrust_peril", 9], ["sweep_peril", 8],
          ["leap_slam", 16, "mobility"], ["dash_in+slash2", 8, "chase"], ["dash_in+combo_delay", 5, "chase"],
          ["backstep+halberd_throw", 9, "ranged"], ["shock_push", 8, "push"]
        ];
        Stages[1].poolP2 = Stages[1].pool.concat([
          ["charge_rush+thrust_peril", 10, "chase"], ["leap_slam+slash2", 8, "mobility"], ["shadow_strike+exclusive_combo", 8, "chase"]
        ]);
        Stages[1].farMoves = ["halberd_throw", "dash_in+slash2", "leap_slam"];
        Stages[1].farMovesP2 = ["charge_rush+thrust_peril", "shadow_strike"];
        Stages[1].rageMove = "rage_chain"; Stages[1].rageEvery = 0.2; /* 每損失 20% 氣血累積滿怒氣 */
      })();

      /* ===== 第 9 關 心魔・墨塵（原型）：鏡像墨塵、依玩家習慣調整 ===== */
      Stages[9].mirror = true;
      Stages[9].artId = 9;
      Stages[9].moves = {
        slash_combo: { name: "青雲斬・三連", isCombo: true, comboTotalHits: 3, comboInterval: 0.20, comboDamagePerHit: 95, windup: 0.42, active: 0.62, recover: 0.50, range: 185, lunge: 300, damage: 285, parryPostureDmg: 20 },
        counter_stance: { name: "反制架式", isCounter: true, windup: 0.18, active: 1.5, recover: 0.45, range: 0, lunge: -160, damage: 0 },
        counter_slash: { name: "彈刀反擊", windup: 0.22, active: 0.14, recover: 0.55, range: 200, lunge: 420, damage: 150, parryPostureDmg: 22 },
        dash_strike: { name: "瞬步突襲", windup: 0.40, active: 0.16, recover: 0.50, range: 230, lunge: 1000, damage: 170, parryPostureDmg: 20 },
        heavy: { name: "蓄力重斬", armor: true, windup: 0.75, active: 0.18, recover: 0.70, range: 210, lunge: 300, damage: 260, parryPostureDmg: 26 },
        heal: { name: "回生酒", isHeal: true, windup: 0.20, active: 1.2, recover: 0.40, range: 0, lunge: 0, damage: 0 },
        sword_wave: { name: "劍氣", isRanged: true, bulletCount: 1, bulletSpeed: 900, bulletTrajectory: "linear", bulletColor: "#f87171", windup: 0.38, active: 0.20, recover: 0.50, range: 700, lunge: 0, damage: 120, parryPostureDmg: 18 },
        predict: { name: "預判落點", isTeleport: true, teleportBehind: true, teleportDelay: 0.18, windup: 0.42, active: 0.15, recover: 0.50, range: 180, lunge: 200, damage: 160, parryPostureDmg: 20 },
        grab_peril: { name: "【危】一劍青雲 (極限側閃)", ultimate: true, isPerilous: true, perilType: "grab", windup: 0.80, active: 0.18, recover: 0.70, range: 170, lunge: 0, damage: 330 }
      };
      Object.values(Stages[9].moves).forEach(m => { if (m.range) m.range = Math.round(m.range * CHAR_K); });
      Stages[9].dialogue = {
        pre: [
          { speaker: "墨塵", text: "……營火的倒影，怎麼自己站起來了。", role: "mochen" },
          { speaker: "心魔・墨塵", text: "你一路斬了那麼多人，還沒問過自己，為什麼揮劍。", role: "boss" },
          { speaker: "墨塵", text: "（握緊劍柄）不必答你。劍下見分曉。", role: "mochen" }
        ],
        post: [
          { speaker: "心魔・墨塵", text: "……原來你早就知道答案。", role: "boss" },
          { speaker: "墨塵", text: "（光點盡數沒入劍身）是。所以我不再怕你。", role: "mochen" }
        ]
      };

      /* ===== v0.8.83 M3 第 4 關 萬劍古靈（灰盒）：部位 Boss（引擎在 53_parts.js；設計卡見 HANDOFF「第 4 關 萬劍古靈 設計卡」） =====
         一階段：古靈本體在背景不可打，只有兩隻巨手＋巨劍；巨劍插地露出劍柄封印，只有蓄力斬斬得斷，斬斷三道進二階段。
         二階段：劍魂核心（一般 Boss AI、彈刀戰），架勢滿處決即結束（execKill）；巨手退到兩側偶爾壓掌。 */
      {
        const S4 = Stages[4];
        S4.name = "萬劍古靈"; S4.maxHp = 2400; S4.maxPosture = 120; S4.deathblows = 2;
        S4.execKill = 2; /* v0.8.90 二階段人形劍魂：處決 2 次才擊敗 */
        S4.sprite = "boss4s"; S4.spriteExtras = ["20_spin_wind", "21_spin_hit", "22_sweep_wind", "23_fly_launch", "24_rain_wind", "25_spin_rec"]; /* v0.8.90 二階段人形古靈（動作表 16 格：03/04 飄移、20/21 旋斬） */
        S4.camZoomP = { 1: 0.85, 2: 0.92 }; /* 鏡頭依階段縮放 */
        S4.parts = {
          seals: 3, handPosture: 100,
          moves: { /* 一階段部位招式（時間單位秒；不受卷二加速影響，數字即實際值） */
            sky:    { name: "天劍斬落", windup: 1.0, track: 0.7, active: 0.14, stuck: 2.0, pull: 0.45, w: 150, damage: 260, unblockable: true },
            sweep:  { name: "【危】橫掃千軍", windup: 0.8, active: 0.5, span: 1500, damage: 280, isPerilous: true, perilType: "sweep" },
            palm:   { name: "劍落", windup: 1.0, track: 0.65, active: 0.12, rest: 1.5, lift: 0.45, r: 150, damage: 220, unblockable: true },
            finger: { name: "劍氣三連", windup: 0.6, count: 3, gap: 0.4, speed: 820, rest: 1.4, recover: 0.45, damage: 110 },
            rain:   { name: "萬劍歸宗", windup: 0.6, waves: 3, per: 5, gap: 0.75, warn: 0.8, r: 62, recover: 0.5, damage: 140, unblockable: true },
            grab:   { name: "【危】劍陣橫穿", windup: 0.85, active: 0.38, span: 1300, rest: 1.4, lift: 0.4, damage: 300, isPerilous: true, perilType: "grab" },
            pincer: { name: "【危】雙劍合圍", windup: 0.9, active: 0.42, span: 1280, rest: 1.4, lift: 0.4, damage: 260, isPerilous: true, perilType: "sweep" },
            plant:  { name: "古靈失衡", windup: 0.5, active: 0.12, stuck: 3.0, pull: 0.45, w: 150, damage: 0 }
          },
          pool: [["sky", 44], ["sweep", 34], ["rain", 22]], /* v0.8.92 一階：只有主劍 */
          form: { /* v0.8.92 二階：六劍陣（slots＝相對古靈的站位、lift＝懸空高低差；designs＝劍圖前綴，之後補 4 種劍） */
            slots: [-640, -390, -140, 140, 390, 640], lift: [0, 40, 15, 15, 40, 0], designs: ["fs1", "fs3", "fs2", "fs4", "fs1", "fs3"],
            pool: [["palm", 32], ["finger", 30], ["grab", 22], ["pincer", 30]], cd: [0.9, 0.75, 0.55], fastK: 0.85 },
          skyPity: 3, /* 連續 3 招沒出天劍斬落，下一招必出（封印要有機會露出） */
          cd: 0.7, /* 招與招之間的空檔 */
          handHit: { normal: 12, heavy: 18, charged: 30, reflect: 15 }, /* 砍手／折射打手的架勢（滿 100 巨手崩勢 → 古靈失衡、巨劍插地 3 秒） */
          p2: { palmEvery: [9, 13], palmDmg: 180 } /* 二階段兩側巨手偶爾壓掌 */,
          /* v0.8.85 生圖：assets/boss4/h01～h12（巨手，0.5 倍、下緣中點錨點）、sw1／sw2／sw3（巨劍 0.6 倍，畫時 ×swK）；boss4fx 列 0 核心、1 核心蓄光、2 封印環、3 小飛劍 */
          art: { dir: "boss4", fx: "boss4fx", bgBody: true, swK: 0.667, swTip: [[94.5, 803], [103, 811]], ringY: [416, 442, 470] }
        };
        S4.moves = {
          slash1: { name: "劍魂・驚鴻", frames: { windup: "07_windup", active: "09_slash", recover: "10_slash_rec" }, windup: 0.45, active: 0.14, recover: 0.42, range: 185, lunge: 380, damage: 150, parryPostureDmg: 22 },
          ring_slash: { name: "環劍旋斬", frames: { windup: "20_spin_wind", active: "21_spin_hit", recover: "25_spin_rec" }, isCombo: true, comboTotalHits: 3, comboInterval: 0.3, comboDamagePerHit: 90, windup: 0.5, active: 0.75, recover: 0.55, range: 190, lunge: 260, damage: 270, parryPostureDmg: 22 },
          thrust_peril: { name: "【危】劍魂突進 (前閃看破)", frames: { windup: "08_windup_thrust", active: "11_thrust", recover: "12_thrust_rec" }, windup: 0.75, active: 0.2, recover: 0.7, range: 280, lunge: 920, damage: 300, isPerilous: true, perilType: "thrust" },
          flyswords: { name: "劍指飛劍", frames: { windup: "14_cast", active: "23_fly_launch", recover: "23_fly_launch" }, isRanged: true, bulletCount: 3, bulletGap: 0.4, bulletSpeed: 760, bulletTrajectory: "linear", bulletColor: "#7dd3fc", bulletY: [-175, -145, -115], bulletX: 60, windup: 0.6, active: 0.9, recover: 0.5, range: 600, lunge: 0, damage: 110, parryPostureDmg: 18 },
          rain2: { name: "萬劍歸宗・疾", frames: { windup: "24_rain_wind", active: "24_rain_wind", recover: "14_cast" }, isMobility: true, partsCall: "rain2", windup: 0.6, active: 0.3, recover: 1.6, range: 0, lunge: 0, damage: 0 }
        };
        S4.moves.sweep_peril = { name: "【危】劍魂掃地 (跳躍)", frames: { windup: "22_sweep_wind", active: "13_sweep", recover: "10_slash_rec" }, windup: 0.7, active: 0.2, recover: 0.65, range: 230, lunge: 300, damage: 260, isPerilous: true, perilType: "sweep" };
        Object.values(S4.moves).forEach(m => { if (m.range) m.range = Math.round(m.range * CHAR_K); });
        S4.parts.moves.rain2 = Object.assign({}, S4.parts.moves.rain, { name: "萬劍歸宗・疾", gap: 0.55, warn: 0.65, per: 4 });
        S4.pool = [["slash1", 26], ["ring_slash", 22], ["thrust_peril", 15], ["sweep_peril", 13], ["flyswords", 14, "ranged"], ["rain2", 10, "ranged"]];
        /* v0.8.94 古靈四招專屬特效（boss4fx3：列 0 驚鴻斬弧、列 1 前 2 格環劍旋斬／後 2 格突進拖尾、列 2 前 2 格掃地劍氣／後 2 格合圍拖尾、列 3 前 2 格插地漣漪／後 2 格擊落碎裂） */
        S4.fxSheets = ["boss4fx3", "boss4warn"]; S4.arcArt = "boss4fx3";
        S4.moves.slash1.fxAct = { sheet: "boss4fx3", row: 0, ox: 150, oy: -140, w: 440, dur: 0.38 };
        S4.moves.ring_slash.fxHit = { sheet: "boss4fx3", row: 1, c0: 0, nf: 2, ox: 0, oy: -120, w: 520, dur: 0.3 };
        S4.moves.thrust_peril.fxAct = [{ sheet: "boss4fx3", row: 1, c0: 2, nf: 2, ox: 280, oy: -140, w: 680, dur: 0.3 },
          { sheet: "boss4fx2", row: 3, c0: 2, nf: 2, ox: -100, oy: -150, w: 420, dur: 0.34, follow: true }]; /* v0.8.102 核心突進：光球彗星跟著劍魂衝（boss4fx2 列 3 第 3、4 格） */
        S4.moves.sweep_peril.fxAct = { sheet: "boss4fx3", row: 2, c0: 0, nf: 2, ox: 120, oy: -50, w: 560, dur: 0.4 };
        S4.poolP2 = S4.pool;
        S4.farMoves = ["flyswords"];
        S4.bg = "arena4"; S4.bgDim = 0.42; /* v0.8.90 劍塚調暗 */ S4.arenaName = "劍塚"; S4.introName = "assets/boss4/name.webp"; S4.introMovie = "assets/boss4/intro"; S4.p2Movie = "assets/boss4/p2"; S4.formMovie = "assets/boss4/form"; /* v0.8.104 三段影片：登場 intro／三封印斷→六劍 form／六劍盡落→人形古靈 p2 */ /* v0.8.89 影片過場（檔案未到前自動走備案） */ /* v0.8.87 古靈背景、書法名牌 */
        S4.layers = [
          { img: "arena4_ground", ground: true, par: 1, y: 455, h: 330, dim: 0.32 },
          { img: "arena4_fg", fg: true, par: 1.35, y: 560, h: 250, alpha: 0.9, dim: 0.5 }
        ];
        S4.flySwordArt = { sheet: "boss4fx", row: 3, frames: [2, 3], fps: 10, w: 150, tipX: 222, tipY: 128 }; /* 指劍劍氣與核心飛劍 */
      }
