      /* ====================== v0.8.105 戰場上的登場與階段轉換「導演」 ======================
       * Stages[n].dirMode = true：登場影片、二階段影片不播，改在戰場上演出（不切走畫面）：
       *   Boss 擺姿勢（Boss._cineImg）＋鏡頭推近到 Boss（updateCamera 的 introOn）＋暗角變色＋氣場／衝擊波特效＋換曲。
       * 影片檔與 introMovie／p2Movie 設定都保留；把 dirMode 拿掉就切回影片。
       * cfg：{ dur, burstAt, poses:[[秒,"格名"]…], tint:"r,g,b", tintA, aura:{sheet,row,w,at,fps,dy}, ring:{sheet,row,w,dur},
       *        pillar:{sheet,row,w,dur}, title:[大字,副字,色], sfx:[[音名,音量,音高]…] }
       * 演出期間戰鬥完全暫停（同登場凍結），結束後 Boss 回待機、玩家給 1.2 秒無敵。 */
      function stMovie(st, key) { return st && !st.dirMode ? st[key] : null; } /* dirMode 的關卡不播影片 */

      const DIR_CFG = {
        1: { /* 赤煞神衛統領：單膝跪地、血煞紅氣湧起 → 起身怒吼，衝擊波 */
          intro: { kind: "drop", dur: 6.0, burstAt: 2.9, fall: 1.3, height: 760, shake: 1.6, shakeRate: 0.45, plate: { tin: 0.22, hold: 2.05, tout: 0.3 }, sub: "第一難", poses: [[0, "21_fall"], [1.3, "22_land"], [5.47, "23_rise"]],
            ring: { sheet: "land", row: 0, w: 1000, dur: 0.7 }, dust: { sheet: "land", row: 1, w: 560, dur: 0.8 }, sfx: [["execution", 1.0, 0.55]] },
          phase: { dur: 2.6, burstAt: 1.15, poses: [[0, "17_kneel"], [1.15, "14_cast"], [1.95, "07_windup"]], tint: "150,20,20", tintA: 0.5,
            aura: { sheet: "dir1", row: 0, w: 460, at: 0.15, fps: 10, dy: 8 }, gather: { sheet: "dir1", row: 3, w: 560, at: 0.1, dy: -110 }, ring: { sheet: "dir1", row: 1, w: 1100, dur: 0.8 },
            pillar: { sheet: "dir1", row: 2, w: 430, dur: 0.9 }, title: ["煞氣暴走", "二　階　段", "#f87171"], blast: true, grow: 1.18,
            sfx: [["peril", 1.0, 0.6], ["execution", 0.9, 0.7]] }
        },
        2: { /* 千幻長老・顧天風：登場「鏡花水月」（鏡片環繞→鏡面映影→炸碎現身＋分身一圈閃現→八卦陣紋→名牌滑入）；二階段「真假難辨」（跪姿→扇裂→靈霧升騰→光柱鏡片風暴→震飛主角，不放大，靈霧常駐） */
          intro: { kind: "mirror", dur: 5.5, ringAt: 0.15, mirrorAt: 1.45, burstAt: 3.0, plate: { tin: 0.22, hold: 1.7, tout: 0.3 }, sub: "第二難", tint: "96,70,170", tintA: 0.34,
            sfxT: [[0.15, "b2_vanish", 0.85, 0.9], [1.45, "b2_appear", 0.8, 0.85], [2.95, "b2_shatter", 1.0, 1], [3.05, "b2_split", 0.8, 1]] },
          phase: { dur: 2.8, burstAt: 1.3, poses: [[0, "17_kneel"], [1.3, "14_cast"], [2.0, "07_windup"]], tint: "76,50,150", tintA: 0.4, blast: true,
            aura: { sheet: "dir2", row: 0, w: 400, at: 0.15, fps: 9, dy: 8, alpha: 0.4 }, gather: { sheet: "dir2", row: 3, w: 460, at: 0.1, dy: -120, alpha: 0.4 }, ring: { sheet: "dir2", row: 1, w: 1100, dur: 0.9, alpha: 0.55 },
            pillar: { sheet: "dir2", row: 2, w: 440, dur: 1.0, alpha: 0.32 }, flashK: 0.4, /* v0.8.128 二階段光太亮 → 各元素與閃白調透明 */ title: ["真假難辨", "二　階　段", "#c4b5fd"], sfx: [["peril", 0.9, 0.9], ["b2_shatter", 1.0, 1], ["b2_split", 0.8, 1]] }
        },
        3: { /* 莫寒川：登場「疾風入場」（暗下→劍光橫貫畫面、竹葉切開→疾衝滑入煞停、雙劍交叉震水環→名牌）；二階段「拔劍・玄鐵」（跪姿→拔劍→重劍插地陣紋＋震飛，不放大，暗紅橙重劍氣常駐） */
          intro: { kind: "dash", dur: 5.0, slashAt: 0.6, dashAt: 1.05, landAt: 1.75, plate: { tin: 0.22, hold: 1.7, tout: 0.3 }, sub: "第三難", tint: "14,22,44", tintA: 0.5, dashFrom: 1500,
            sfxT: [[0.55, "b3_dash", 0.9, 1.15], [1.0, "b3_dash", 0.8, 0.95], [1.75, "b3_cross", 1.0, 1], [1.8, "b3_seal", 0.6, 1]] },
          phase: { dur: 3.0, burstAt: 1.3, stance: true, poses: [[0, "17_kneel"], [1.3, "14_cast"], [2.0, "07_windup"]], tint: "20,20,34", tintA: 0.42, blast: true, flashK: 0.6,
            aura: { sheet: "dir3", row: 0, w: 460, at: 0.15, fps: 7, dy: 4, alpha: 0.7 }, gather: { sheet: "dir3", row: 3, w: 520, at: 0.1, dy: -110, alpha: 0.75 }, ring: { sheet: "dir3", row: 1, w: 1050, dur: 0.9, alpha: 0.85 },
            pillar: { sheet: "dir3", row: 2, w: 430, dur: 0.9, alpha: 0.6 }, title: ["拔劍・玄鐵", "二　階　段", "#fca5a5"],
            sfx: [["peril", 0.9, 0.8], ["b3_draw", 1.0, 1], ["b3_plunge", 1.0, 0.9]] }
        }
      };
      if (Stages[1]) Stages[1].fxSheets = (Stages[1].fxSheets || []).concat(["land", "ult", "boss2", "dir1"]); /* 階段轉換用的衝擊波環、光柱、氣焰 */
      DIR_CFG[3].p2Aura = { sheet: "dir3", row: 0, w: 380, fps: 7, dy: 4, alpha: 0.5 }; /* 二階段全程暗紅橙重劍氣（不放大） */
      if (Stages[3]) Stages[3].fxSheets = (Stages[3].fxSheets || []).concat(["boss3intro", "dir3"]);
      DIR_CFG[2].p2Aura = { sheet: "dir2", row: 0, w: 340, fps: 9, dy: 6, alpha: 0.32 }; /* 二階段全程翠綠靈霧（詭譎，不放大） */
      if (Stages[2]) Stages[2].fxSheets = (Stages[2].fxSheets || []).concat(["boss2intro", "dir2"]);
      DIR_CFG[1].p2Aura = { sheet: "dir1", row: 0, w: 330, fps: 9, dy: 6, alpha: 0.85 }; /* 二階段全程紅焰（跟著 Boss，隨放大倍率） */
      /* v0.8.133 第 4 關（部位 Boss）：登場「劍塚甦醒」`kind:"graveyard"`；一→二階段 `Stages[4].dir.form`（巨劍崩解成六劍）；二→三階段 `Stages[4].dir.phase3`（古靈降臨） */
      DIR_CFG[4] = {
        intro: { kind: "graveyard", dur: 6.2, crackAt: 0.7, riseAt: 1.5, ringsAt: 2.6, handAt: 3.2, pullAt: 3.9, plate: { tin: 0.35, hold: 1.6, tout: 0.35 }, sub: "第四難", tint: "40,60,80", tintA: 0.4,
          sfxT: [[0.1, "b3_seal", 0.7, 0.6], [0.7, "b3_plunge", 0.9, 0.7], [1.5, "b3_heavy", 0.7, 0.6], [2.6, "b3_seal", 0.8, 1.2], [3.9, "b3_draw", 1.0, 0.8], [4.0, "b3_plunge", 1.0, 0.7]] },
        form: { kind: "formtrans", dur: 2.2, tint: "40,60,90", tintA: 0.35, sfxT: [[0.05, "b2_shatter", 1.0, 0.8], [0.6, "b2_shatter", 0.9, 1.1], [1.1, "b2_sword_fly", 0.9, 1], [1.8, "b3_plunge", 0.9, 1]] },
        phase3: { kind: "descend", dur: 3.6, tint: "40,60,100", tintA: 0.35, sfxT: [[0.2, "b2_appear", 0.8, 0.8], [1.4, "b2_appear", 0.9, 1.1], [2.4, "b2_shatter", 1.0, 0.7]] }
      };
      if (Stages[4]) Stages[4].fxSheets = (Stages[4].fxSheets || []).concat(["boss4intro", "dir4"]);
      /* v0.8.141 第 5 關：登場「荒原狼嚎」`kind:"wolf"`（暮色轉紅→遠處狼眼亮起→爪痕劃過全螢幕→小狼疾衝滑入煞停→蹲伏低吼→名牌）；
       * 二階段「血肉剝離化為魔焰」`kind:"morph"`（長嚎→全身裂紋→血肉剝落成火星→只剩骨架、魔焰竄出→爆焰重生為大狼、震飛主角） */
      DIR_CFG[5] = {
        intro: { kind: "wolf", dur: 6.6, eyesAt: [0.9, 1.35, 1.8], slashAt: 2.55, dashAt: 2.8, landAt: 3.55, plate: { tin: 0.22, hold: 1.7, tout: 0.3 }, sub: "第五難", tint: "70,8,14", tintA: 0.55, dashFrom: 1500,
          sfxT: [[0.35, "m_howl", 0.9, 1.0], [2.5, "w_claw", 0.9, 0.8], [2.8, "w_bark", 0.8, 1.1], [3.55, "w_snarl", 1.0, 1.0], [3.6, "execution", 0.6, 0.6]] },
        phase: { kind: "morph", dur: 7.2, crackAt: 1.3, shardAt: 2.4, boneAt: 4.6, burstAt: 5.3, stance: true, tint: "60,8,60", tintA: 0.5, blast: true, flashK: 0.9, title: ["九幽狼王", "二　階　段", "#f87171"],
          ring: { sheet: "land", row: 0, w: 1100, dur: 0.8 },
          sfxT: [[0.1, "w_howl", 1.0, 0.8], [0.9, "peril", 0.8, 0.5], [2.4, "b3_plunge", 0.8, 0.6], [3.0, "b2_shatter", 0.7, 0.8], [4.4, "peril", 1.0, 0.7]], sfx: [["execution", 0.9, 0.55], ["m_roar", 1.0, 1]] }
      };
      if (Stages[5]) Stages[5].fxSheets = (Stages[5].fxSheets || []).concat(["boss5intro", "boss5morph", "boss5flame", "boss5beam", "boss5charge", "cue"]);
      function wolfBackFlame() { /* 大狼背上的魔焰（flame.webp 第 3 列大火、第 4 列飄散火星）：疊加發光、循環搖擺，跟著 Boss */
        if (!fxReady("flame")) return;
        [[-140, 6.5, 2, 190, 0.5], [-10, 8, 2, 220, 0.5], [115, 7, 2, 190, 0.5], [0, 5, 3, 300, 0.7]].forEach(([o, fps, row, sz, al]) => spawnFx("flame", row, Boss.x, Boss.y - 185, { anchor: "b", w: sz, h: sz, alpha: al, dur: 9999, loop: true, fps, follow: () => (Boss.hp > 0 ? { x: Boss.x + Boss.facing * o, y: Boss.y - 185 } : { x: -9999, y: -9999 }) }));
      }
      Object.keys(DIR_CFG).forEach(k => { const st = Stages[k]; if (st) { st.dir = DIR_CFG[k]; st.dirMode = true; } });

      function dirPoseAt(c, t) { let k = c.poses[0][1]; for (const p of c.poses) if (t >= p[0]) k = p[1]; return k; }
      function dirReset() { Game.dir = null; Boss._cineImg = null; Game.camera.shakeRate = 1; }
      function dirStart(kind, st) {
        const c = st && st.dir && st.dir[kind];
        if (!c) return false;
        if (Game.mode !== "battle" || Boss.hp <= 0 || Player.hp <= 0) {
          if (kind === "phase") { if (Boss._p2MoviePending) applyP2Stance(st); if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]); }
          return false;
        }
        Game.dir = { kind, st, c, t: 0, burst: false, a: 0, push: 0, aura: false };
        Boss.facing = Player.x >= Boss.x ? 1 : -1; Boss.vx = 0; Boss.vy = 0; Boss.y = Config.groundY;
        Boss._cineImg = c.poses ? dirPoseAt(c, 0) : "01_idle1";
        if (c.kind === "mirror" || c.kind === "dash" || c.kind === "wolf") Boss._introHide = true;
        if (c.kind === "graveyard" && Boss._pp) { Boss._pp._hide = true; Boss._pp.sword.mode = "gone"; } /* 巨劍與巨手登場前不在場 */
        if (c.kind === "graveyard" || c.kind === "formtrans" || c.kind === "descend") { const Dg = Game.dir; Dg.camNow = { zoom: Game.camera.targetZoom + (c.kind === "graveyard" ? 0.1 : 0.05), y: 0, rate: 6 }; Dg.focusX = Boss._pp ? Boss._pp.spiritX : Boss.x; } /* 鏡花水月：鏡子炸碎前 Boss 不在場 */
        Game.introT = 0; Boss.isPerilous = false;
        if (kind === "intro") Music.fadeOut(); else Music.duck(0.12, (c.burstAt || c.zoomAt || 0.3) + 0.3); /* v0.8.139 登場一開始營地音樂就淡出（原本只壓 0.3 秒就恢復，一路播到名牌）；階段轉換才用壓低 */
        if (c.kind === "wolf" || c.kind === "morph") { const Dm = Game.dir; Dm.camNow = { zoom: Game.camera.targetZoom + (c.kind === "wolf" ? 0.15 : 0.12), y: 0, rate: 6 }; Dm.focusX = Boss.x; }
        if (c.kind === "dash") { const Dm = Game.dir; Dm.camNow = { zoom: Game.camera.targetZoom + 0.2, y: 0, rate: 8 }; Dm.focusX = Boss.x; }
        if (c.kind === "mirror") { const Dm = Game.dir; Dm.camNow = { zoom: Game.camera.targetZoom + 0.2, y: 0, rate: 8 }; Dm.focusX = Boss.x; }
        if (kind === "phase") { screenFlash("rgba(255,255,255,0.7)", 0.6 * (c.flashK == null ? 1 : c.flashK), 0.4); triggerHitstopMs(90); addTrauma(0.35); hapticBuzz([40, 30, 80]); }
        return true;
      }
      function dirBurst(D) {
        const c = D.c, st = D.st, G = Config.groundY;
        D.burst = true; D.push = c.blast ? 0 : 0.35;
        if (c.blast) blastPlayer(Player.x >= Boss.x ? 1 : -1); /* v0.8.108 沿用第 5 關的震飛：主角被轟飛、劍駐地、起身（無敵） */
        Music.duckUntil = 0; Music.duckLvl = 1;
        if (D.kind === "phase") {
          if (Boss._p2MoviePending) applyP2Stance(st); /* 第 3 關：爆發這一刻換成重劍姿態 */
          if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]);
        } else if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]);
        (c.sfx || []).forEach(s => Sound.play(s[0], s[1], s[2]));
        if (c.ring && fxReady(c.ring.sheet)) spawnFx(c.ring.sheet, c.ring.row, Boss.x, G - 8, { anchor: "b", w: c.ring.w, h: c.ring.w * 0.4, dur: c.ring.dur || 0.7, alpha: c.ring.alpha == null ? 1 : c.ring.alpha });
        if (c.pillar && fxReady(c.pillar.sheet)) spawnFx(c.pillar.sheet, c.pillar.row, Boss.x, G, { anchor: "b", w: c.pillar.w, h: c.pillar.w * 1.6, dur: c.pillar.dur || 0.8, alpha: c.pillar.alpha == null ? 1 : c.pillar.alpha });
        screenFlash("rgba(255,255,255,0.8)", (D.kind === "phase" ? 0.5 : 0.35) * (c.flashK == null ? 1 : c.flashK), 0.5); /* flashK：該關閃白強度倍率（亮背景的關卡調低） */
        addTrauma(D.kind === "phase" ? 0.8 : 0.45); triggerHitstopMs(D.kind === "phase" ? 100 : 60);
        hapticBuzz(D.kind === "phase" ? [60, 40, 120] : [30, 20, 60]);
        if (c.title) showBanner(c.title[0], c.title[1], 1500, c.title[2]);
        if (c.name) bossNameCard(st);
      }
      /* v0.8.111 「從天而降」登場：鏡頭跟著 Boss 下落（背景頂端色往上延伸）→ 落地後晃 1 秒（持續高 trauma）→ 名牌從左快速滑進＋瞬間拉近
       * （此刻震動停、特效／環境暫停）→ 名牌往右飛走、同時鏡頭縮回戰鬥大小 → Boss 起身。名牌不畫黑底。 */
      function dropStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, st = D.st, cam = Game.camera, z0 = cam.targetZoom + 0.2, P = c.plate;
        const t0 = c.fall + c.shake, tHold = t0 + P.tin + P.hold, tEnd = tHold + P.tout;
        Boss._cineImg = dirPoseAt(c, t);
        Boss.y = t < c.fall ? G - c.height * (1 - (t / c.fall) * (t / c.fall)) : G;
        D.freeze = t >= t0 && t < tHold; /* 名牌滑入與停留：震動與世界暫停 */
        if (t < c.fall) D.camNow = { zoom: z0, y: Math.max(-700, (Boss.y - G) * 0.85), rate: 10 }; /* 鏡頭跟著 Boss 往下走 */
        if (!D.hit && t >= c.fall) {
          D.hit = true;
          if (c.ring && fxReady(c.ring.sheet)) spawnFx(c.ring.sheet, c.ring.row, Boss.x, G - 8, { anchor: "b", w: c.ring.w, h: c.ring.w * 0.4, dur: c.ring.dur || 0.7 });
          if (c.dust && fxReady(c.dust.sheet)) { spawnFx(c.dust.sheet, c.dust.row, Boss.x - 60, G, { anchor: "b", w: c.dust.w, dur: c.dust.dur || 0.8, facing: -1 }); spawnFx(c.dust.sheet, c.dust.row, Boss.x + 60, G, { anchor: "b", w: c.dust.w, dur: c.dust.dur || 0.8, facing: 1 }); }
          (c.sfx || []).forEach(sf => Sound.play(sf[0], sf[1], sf[2]));
          triggerHitstopMs(110); screenFlash("rgba(255,244,230,0.45)", 0.4, 0.3);
          hapticBuzz([90, 40, 80, 40, 70, 40, 60, 40, 50, 40, 40]);
          D.camNow = { zoom: z0, y: 0, rate: 14 };
        }
        if (t >= c.fall && t < t0) { const pr = (t - c.fall) / c.shake; cam.shakeRate = c.shakeRate || 1; cam.trauma = Math.max(cam.trauma || 0, 1.0 - 0.4 * pr); } /* 落地後持續劇烈晃動（頻率放慢＝更沉重） */
        if (!D.zoomed && t >= t0) { /* 名牌滑入的同時瞬間拉近，停震 */
          D.zoomed = true; D.zoomT0 = t; cam.trauma = 0; cam.shakeRate = 1;
          D.camNow = { zoom: z0 + 0.75, y: -30, rate: 60 };
          screenFlash("rgba(255,255,255,0.7)", 0.5, 0.25); hapticBuzz([30, 20, 50]);
          Music.duckUntil = 0; Music.duckLvl = 1; if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]);
          Sound.play("execution", 0.7, 1.3);
          bossNameCard(st, { slide: true, sub: c.sub, tin: P.tin, hold: P.hold, tout: P.tout });
        }
        if (D.freeze) cam.trauma = 0;
        if (D.zoomed && !D.out && t >= tHold) { D.out = true; D.camNow = { zoom: cam.targetZoom, y: 0, rate: 7 }; hapticBuzz(20); } /* 名牌飛走，鏡頭縮回戰鬥大小 */
        D.a += ((D.zoomed && !D.out ? 0.5 : 0) - D.a) * Math.min(1, dt * 12);
      }
      function dirUpdate(dt) {
        const D = Game.dir; if (!D) return;
        const c = D.c; D.t += dt;
        if (c.kind === "assist") { assistStep(D, dt); return; } /* v0.8.115 玄天珠演出：世界暫停（不更新特效／粒子） */
        if (c.kind === "graveyard") { graveStep(D, dt); updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; }
        D._dtLast = dt;
        if (c.kind === "formtrans") { formTransStep(D, dt); updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; }
        if (c.kind === "descend") { descendStep(D, dt); updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; }
        if (c.kind === "wolf") { wolfStep(D, dt); updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; } /* v0.8.141 荒原狼嚎 */
        if (c.kind === "morph") { morphStep(D, dt); updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; } /* v0.8.141 血肉剝離化為魔焰 */
        if (c.kind === "dash") { dashStep(D, dt); updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; } /* v0.8.130 疾風入場 */
        if (c.kind === "mirror") { mirrorStep(D, dt); updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; } /* v0.8.127 鏡花水月 */
        if (c.kind === "drop") { dropStep(D, dt); if (!D.freeze) updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; }
        Boss._cineImg = dirPoseAt(c, D.t);
        if (!D.aura && c.aura && D.t >= (c.aura.at || 0) && fxReady(c.aura.sheet)) {
          D.aura = true; const A = c.aura, dy = A.dy || 0;
          spawnFx(A.sheet, A.row, Boss.x, Boss.y + dy, { anchor: A.anchor || "b", w: A.w, dur: Math.max(0.5, c.dur - D.t + 0.2), loop: true, fps: A.fps || 10, alpha: A.alpha == null ? 1 : A.alpha, follow: () => ({ x: Boss.x, y: Boss.y + dy }) });
        }
        if (!D.gather && c.gather && D.t >= (c.gather.at || 0) && fxReady(c.gather.sheet)) { /* 蓄勢：光點向 Boss 匯聚（整段蓄勢時間播完 4 格） */
          D.gather = true; const g = c.gather, gy = g.dy || -100;
          spawnFx(g.sheet, g.row, Boss.x, Boss.y + gy, { anchor: "c", alpha: g.alpha == null ? 1 : g.alpha, w: g.w, dur: Math.max(0.4, c.burstAt - D.t), follow: () => ({ x: Boss.x, y: Boss.y + gy }) });
        }
        if (!D.burst && D.t >= c.burstAt) dirBurst(D);
        if (c.grow && D.burst) { const k = Math.min(1, (D.t - c.burstAt) / 0.5); Boss._scaleMul = 1 + (c.grow - 1) * (1 - (1 - k) * (1 - k)); } /* 二階段放大 */
        if (Player.blast) dirPlayerStep(dt); /* 凍結期間只讓被震飛的主角繼續飛 */
        if (D.push > 0) { /* 衝擊波把靠太近的玩家推開 */
          D.push -= dt; const dx = Player.x - Boss.x;
          if (Math.abs(dx) < 330) Player.x = Math.max(60, Math.min(Config.worldWidth - 60, Player.x + (dx >= 0 ? 1 : -1) * 700 * dt));
        }
        const up = Math.min(1, D.t / c.burstAt), down = D.burst ? Math.max(0, 1 - (D.t - c.burstAt) / Math.max(0.2, c.dur - c.burstAt)) : 1;
        D.a = (c.tintA || 0.4) * up * down;
        updateHitParticles(dt); /* 內含 updateFx */
        if (D.t >= c.dur) dirEnd(D);
      }
      function dirPlayerStep(dt) {
        updateBlast(dt);
        if (!Player.blast) return;
        Player.x += Player.vx * dt; Player.vy += Config.gravity * dt; Player.y += Player.vy * dt;
        if (Player.y >= Config.groundY) { Player.y = Config.groundY; Player.vy = 0; }
        Player.x = Math.max(70, Math.min(Config.worldWidth - 70, Player.x));
      }
      /* v0.8.108 二階段全程紅焰：dir.p2Aura，跟著 Boss、隨放大倍率；Boss 倒下即停 */
      function dirAuraTick() {
        const st = Stages[Boss.stageId], a = st && st.dir && st.dir.p2Aura;
        if (!a || Config.bossPhase !== 2 || Game.mode !== "battle" || Game.dir) return;
        if (Boss.hp <= 0) { if (Game._p2AuraFx) { const i = Game.fxList.indexOf(Game._p2AuraFx); if (i >= 0) Game.fxList.splice(i, 1); Game._p2AuraFx = null; } return; }
        if (Game._p2AuraFx && Game.fxList.indexOf(Game._p2AuraFx) >= 0) return;
        if (!fxReady(a.sheet)) return;
        const m = Boss._scaleMul || 1, dy = a.dy || 0;
        spawnFx(a.sheet, a.row, Boss.x, Boss.y + dy, { anchor: "b", w: a.w * m, dur: 36000, loop: true, fps: a.fps || 9, alpha: a.alpha == null ? 1 : a.alpha, follow: () => ({ x: Boss.x, y: Boss.y + dy }) });
        Game._p2AuraFx = Game.fxList[Game.fxList.length - 1];
      }
      /* v0.8.139 二→三階段「古靈降臨」（v0.8.140 改用 51～54_desc 四格）：核心珠緩降（boss4fx 列 1 蓄光）→ 光柱中人形以現有三格成形（17_kneel 蜷伏→14_cast 起身舉手→01_idle1 站立，淡入＋亮度漸退＋微上浮），不再彈出 */
      function drawDescendWorld(D, G, now) {
        const P = Boss._pp, cx = D.cx != null ? D.cx : (P ? P.coreX : Boss.x), t = D.t, F = fxReady("boss4fx") ? fxSheet("boss4fx") : null;
        if (F && t >= 0.1 && t < 1.4) { /* 核心珠由上方降到胸口 */
          const u = Math.min(1, (t - 0.1) / 1.1), y = G - 520 + u * 360, a = t < 1.2 ? 1 : Math.max(0, 1 - (t - 1.2) / 0.2), col = Math.floor(now * 6) % 4;
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.95; ctx.drawImage(F.img, col * 256, 256, 256, 256, cx - 60, y - 60, 120, 120); ctx.restore();
        }
        const u = (t - 1.25) / 1.9; if (u <= 0) return;
        const st = Stages[Boss.stageId], SP = st.sprite ? getBossSprite(st.sprite) : null; if (!SP) return;
        const kk = ["51_desc_a", "52_desc_b", "53_desc_c", "54_desc_d"], ki = u < 0.26 ? 0 : u < 0.5 ? 1 : u < 0.76 ? 2 : 3; /* v0.8.140 降臨四張專屬關鍵格（Gemini）：蜷伏→半起→睜眼劍指→站定；沒載到時退回舊三格 */
        let key = kk[ki], img = SP.imgs[key]; if (!(img && img.complete && img.naturalWidth)) { key = u < 0.3 ? "17_kneel" : u < 0.62 ? "14_cast" : "01_idle1"; img = SP.imgs[key] || (key === "17_kneel" && SP.death.kneel.ok ? SP.death.kneel.img : null); }
        if (!img || !img.complete || !img.naturalWidth) return;
        const k = bossVis(st).k, a = Math.min(1, u * 1.6), br = 1 + Math.max(0, 1 - u) * 2.2, face = Player.x >= cx ? 1 : -1, sc = 0.95 + 0.05 * Math.min(1, u * 1.3), rise = (1 - Math.min(1, u * 1.2)) * 26;
        ctx.save(); ctx.globalAlpha = a; ctx.filter = `brightness(${br.toFixed(2)})`; ctx.translate(cx, G + GROUND_SINK + rise); ctx.scale(face * k * sc, k * sc); ctx.drawImage(img, -450, -560); ctx.restore();
      }
      function dirEnd(D) {
        if (D.c.kind === "descend" && Boss._pp && Boss._pp.phase === "t") { const Q = Boss._pp; Q._shattered = true; Q._roar = true; Q.sword.mode = "gone"; Q.tt = Math.max(Q.tt, 2.8); Game.slowT = 0; Game.dir = null; partsTransStep(0.001); } /* 現身已演完（同一幀接上三階段，不留空檔），直接完成轉場（原本會再播一次 2.8 秒藍球降下） */
        if (Boss._pp) { Boss._pp._hide = false; if (D.c.kind === "graveyard") { const sw = Boss._pp.sword; sw.mode = "hover"; sw.x = D.sx + 280; sw.tip = Config.groundY - 120; sw.tx = sw.x; sw.ttip = sw.tip; Boss._pp.cd = 1.4; } if (D.c.kind === "formtrans" && Boss._pp.form) Boss._pp.cd = Math.max(Boss._pp.cd || 0, 1.6); }
        if (D.c.grow) { Boss._scaleMul = D.c.grow; applyBossBody(D.st); Boss.w *= D.c.grow; Boss.h *= D.c.grow; } /* 放大後受擊範圍同步 */
        Game.dir = null; Boss._cineImg = null; Game.hitstopT = 0; Game.camera.shakeRate = 1;
        Music.duckUntil = 0; Music.duckLvl = 1; Boss.y = Config.groundY;
        if (["staggered", "frozen", "hurt", "recover", "grounded"].includes(Boss.state)) { Boss.state = "idle"; Boss.stateTimer = 0; Boss.frozenTimer = 0; }
        Boss.aiCooldown = Math.max(Boss.aiCooldown || 0, 0.7);
        Game.introT = D.kind === "intro" ? 0.35 : 0.3; /* 登場：結束後才跳開場對話 */
        Player.invulnTimer = Math.max(Player.invulnTimer, 1.2);
        Progress.battleStartTime = performance.now();
      }
      function drawDirOverlay(w, h) {
        const D = Game.dir; if (!D) return;
        if (D.c.kind === "drop" && D.zoomed && D.t - D.zoomT0 < 0.55) { /* 放射速度線（程式備案；之後可換生圖） */
          const k = 1 - (D.t - D.zoomT0) / 0.55; ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.75 * k})`; ctx.lineCap = "round";
          const cx = w / 2, cy = h * 0.5, n = 46;
          for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + Math.random() * 0.12, r0 = h * (0.3 + Math.random() * 0.15), r1 = h * (0.75 + Math.random() * 0.3); ctx.lineWidth = 1.5 + Math.random() * 4.5; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); ctx.stroke(); }
          ctx.restore();
        }
        if (D.a < 0.01) return;
        const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.95);
        const tn = D.c.tint || "0,0,0"; g.addColorStop(0, `rgba(${tn},0)`); g.addColorStop(1, `rgba(${tn},${D.a})`);
        ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
      }

      /* ====================== v0.8.115 玄天珠：繞身圈與技能演出 ======================
       * 平時：珠子繞主角勻速畫橢圓（繞到前面／背面有遮擋層次；用盡後變灰、轉慢）。
       * 技能（約 1 秒）：世界暫停＋鏡頭拉近主角＋聚光暗角 → 主角前指 → 十字星由大到小越轉越快、縮進珠心 → 極短暫定格
       *   → 珠子衝向敵人（太初替身＝飛回主角胸口）→ 命中那一刻才 applyAssistEffect 並恢復戰鬥。
       * 美術掛鉤（有圖用圖，沒圖退回程式畫）：assets/fx/xtz.webp（4×4：列 0 珠子脈動、列 1 灰珠、列 2 拖尾、列 3 命中爆光）、
       *   assets/fx/xtz_star.webp（單張十字星）、主角前指關鍵格 mc/41_point_a／42_point_b／43_point_c（沒有時用 11_thrust 頂替）。 */
      const ASSIST_CFG = { tIn: 0.35, tStar: 0.8, tFreeze: 0.12, tLaunch: 0.12, dashSpd: 1500, chestY: 138, handY: 148, poseNames: ["41_point_a", "42_point_b", "43_point_c"], poseFallback: "11_thrust" };
      function assistStart(type) {
        if (Game.mode !== "battle" || Game.cine || Game.dir || Boss.hp <= 0 || Player.hp <= 0) return false;
        const o0 = orbCurrent();
        Game.dir = { c: { kind: "assist", dur: 99 }, kind: "assist", st: Stages[Boss.stageId], type, t: 0, dark: 0, a: 0, orb: { x: o0.x, y: o0.y, R: 9 }, from: { x: o0.x, y: o0.y }, star: null, trail: [], phase: "in", tp: 0, focusX: Player.x,
          camNow: { zoom: Game.camera.targetZoom + 0.6, y: Player.y - ASSIST_CFG.chestY + 20 - Config.baseHeight * 0.5, rate: 14 } };
        Player.facing = Boss.x >= Player.x ? 1 : -1; Player.vx = 0; Player.isChargingAttack = false;
        return true;
      }
      function assistPoseAt(t) {
        const C = ASSIST_CFG, has = n => { const im = MC_IMGS[n]; return !!(im && im.complete && im.naturalWidth); };
        if (t < 0.06) return null;
        const cand = t < C.tIn ? C.poseNames[0] : t < C.tIn + C.tStar ? C.poseNames[1] : C.poseNames[2];
        return has(cand) ? cand : (has(C.poseNames[1]) ? C.poseNames[1] : C.poseFallback);
      }
      function assistStep(D, dt) {
        const C = ASSIST_CFG, f = Player.facing, hand = { x: Player.x + f * 78, y: Player.y - C.handY };
        D.t += 0; D.tp += dt; Player._pose = assistPoseAt(D.t);
        if (D.phase === "in") { /* 拉近＋變暗＋珠子飛到指尖 */
          const u = Math.min(1, D.tp / C.tIn), e = 1 - Math.pow(1 - u, 3);
          D.dark = e; D.orb.x = D.from.x + (hand.x - D.from.x) * e; D.orb.y = D.from.y + (hand.y - D.from.y) * e;
          D.star = null;
          if (u >= 1) { D.phase = "star"; D.tp = 0; D.sa = 0; }
        } else if (D.phase === "star") { /* 十字星：大於珠子，越轉越快、越縮越小 */
          const u = Math.min(1, D.tp / C.tStar), w = 4 + 46 * u * u;
          D.sa += w * dt; D.star = { a: D.sa, s: 3.6 - 3.0 * u * u, alpha: 0.5 + 0.5 * u };
          D.orb.x = hand.x + (Math.random() - 0.5) * 2 * u; D.orb.y = hand.y + (Math.random() - 0.5) * 2 * u;
          if (u >= 1) { D.phase = "freeze"; D.tp = 0; screenFlash("rgba(220,240,255,0.55)", 0.45, 0.2); Sound.play("parry", 0.5, 1.9); }
        } else if (D.phase === "freeze") { /* 縮到珠心的瞬間，一切停住極短暫的時間 */
          D.star = { a: D.sa, s: 0.35, alpha: 1 };
          if (D.tp >= C.tFreeze) {
            D.tp = 0; D.star = null; D.hs = { x: D.orb.x, y: D.orb.y };
            if (D.type === "tishen") D.phase = "absorb";
            else { D.phase = "launch"; const dx = Boss.x - D.orb.x, dy = Boss.y - 110 - D.orb.y, d = Math.hypot(dx, dy) || 1; D.ux = dx / d; D.uy = dy / d; }
          }
        } else if (D.phase === "launch") { /* v0.8.117 發射前「頓挫」：珠子先向後拉一下蓄力，再炸出去（發射瞬間震動＋推近） */
          const u = Math.min(1, D.tp / C.tLaunch), r = 30 * (1 - (1 - u) * (1 - u));
          D.orb.x = D.hs.x - D.ux * r; D.orb.y = D.hs.y - D.uy * r;
          if (u >= 1) {
            D.phase = "dash"; D.tp = 0;
            addTrauma(0.8); screenFlash("rgba(235,245,255,0.5)", 0.45, 0.2); hapticBuzz([40, 20, 60]);
            Game.camera.zoom += 0.12; /* 推近一下 */
            Sound.play("flysword", 0.9, 1.3); Sound.play("hit", 0.35, 1.6);
            D.camNow = { zoom: Game.camera.targetZoom + 0.1, y: 0, rate: 9 }; D.focusX = (Player.x + Boss.x) * 0.5;
          }
        } else if (D.phase === "dash") { /* 珠子衝向敵人，拖尾 */
          const tx = Boss.x, ty = Boss.y - 110, dx = tx - D.orb.x, dy = ty - D.orb.y, d = Math.hypot(dx, dy), step = C.dashSpd * dt;
          D.trail.push({ x: D.orb.x, y: D.orb.y, t: 0 }); if (D.trail.length > 14) D.trail.shift();
          if (d <= step + 24) { D.orb.x = tx; D.orb.y = ty; assistHit(D); }
          else { D.orb.x += dx / d * step; D.orb.y += dy / d * step; }
          D.dark += (0.65 - D.dark) * Math.min(1, dt * 8);
        } else if (D.phase === "absorb") { /* 太初替身：珠子飛回主角胸口 */
          const u = Math.min(1, D.tp / 0.16), tx = Player.x, ty = Player.y - ASSIST_CFG.chestY;
          D.orb.x = D.hs.x + (tx - D.hs.x) * u; D.orb.y = D.hs.y + (ty - D.hs.y) * u;
          if (u >= 1) assistHit(D);
        } else if (D.phase === "out") { /* 命中後：暗角與鏡頭快速退場，戰鬥已恢復運作 */ }
        D.trail.forEach(p => p.t += dt);
      }
      function assistHit(D) {
        D.phase = "done";
        if (fxReady("xtz")) spawnFx("xtz", 3, D.orb.x, D.orb.y, { w: 300, dur: 0.4 });
        screenFlash("rgba(200,230,255,0.7)", 0.6, 0.25); addTrauma(0.35);
        const type = D.type; assistEnd(D);
        applyAssistEffect(type); /* 命中觸發效果，同一刻恢復戰鬥 */
      }
      function assistEnd(D) {
        Game.dir = null; Player._pose = null; Game.hitstopT = 0;
        Game.camera.shakeRate = 1;
      }
      /* 珠子目前位置：繞主角勻速橢圓（z>0 在前、<0 在後） */
      function orbCurrent() {
        const D = Game.dir && Game.dir.kind === "assist" ? Game.dir : null;
        if (D && D.orb) return { x: D.orb.x, y: D.orb.y, z: 1, R: D.orb.R };
        const th = (performance.now() / 1000) * (Player.assistAvailable ? 2.6 : 1.3);
        return { x: Player.x + Math.cos(th) * 46, y: Player.y - ASSIST_CFG.chestY + Math.sin(th) * 14, z: Math.sin(th), R: 7.5 }; /* 高度＝主角胸口 */
      }
      function drawXtzOrb(front) {
        const o = orbCurrent(), D = Game.dir && Game.dir.kind === "assist" ? Game.dir : null;
        if (front !== (o.z >= 0)) return;
        const on = Player.assistAvailable || !!D, now = performance.now();
        ctx.save();
        const comet = !!(D && D.phase === "dash" && fxReady("xtz"));
        if (D && D.trail.length && !comet) { /* 衝刺拖尾（程式備案；有圖時用彗星格） */
          ctx.globalCompositeOperation = "lighter";
          D.trail.forEach((p, i) => { const a = Math.max(0, 1 - p.t * 6) * (i / D.trail.length); ctx.globalAlpha = a * 0.7; ctx.fillStyle = "#93c5fd"; ctx.beginPath(); ctx.arc(p.x, p.y, 4 + 6 * (i / D.trail.length), 0, Math.PI * 2); ctx.fill(); });
        }
        ctx.globalCompositeOperation = "lighter";
        const size = (D ? 96 : 64) * (o.z < 0 ? 0.85 : 1);
        if (comet) { /* 衝刺：列 2 彗星（珠頭在右、尾巴向左），依飛行方向旋轉；珠頭落在格內約 78% 處 */
          const A = fxSheet("xtz"), col = Math.floor(D.tp * 18) % 3, ang = Math.atan2(Boss.y - 110 - o.y, Boss.x - o.x), cz = 170;
          ctx.translate(o.x, o.y); ctx.rotate(ang); ctx.globalAlpha = 1;
          ctx.drawImage(A.img, col * 256, 2 * 256, 256, 256, -cz * 0.78, -cz / 2, cz, cz);
        } else if (fxReady("xtz")) { /* 美術：列 0 珠子脈動、列 1 灰珠 */
          const A = fxSheet("xtz"), col = Math.floor(now / 120) % 4;
          ctx.globalAlpha = o.z < 0 ? 0.7 : 1; ctx.drawImage(A.img, col * 256, (on ? 0 : 1) * 256, 256, 256, o.x - size / 2, o.y - size / 2, size, size);
        } else { /* 備案：程式畫的圓珠 */
          const R = o.R * (D ? 1.5 : 1) * (o.z < 0 ? 0.85 : 1), g = ctx.createRadialGradient(o.x, o.y, 1, o.x, o.y, R * 2.6);
          g.addColorStop(0, on ? "rgba(235,245,255,1)" : "rgba(148,163,184,0.9)"); g.addColorStop(0.35, on ? "rgba(96,165,250,0.85)" : "rgba(71,85,105,0.7)"); g.addColorStop(1, "rgba(96,165,250,0)");
          ctx.globalAlpha = o.z < 0 ? 0.65 : 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, R * 2.6, 0, Math.PI * 2); ctx.fill();
        }
        if (D && D.star) { /* 十字星（旋轉、由大縮小） */
          const S = D.star, L = 30 * S.s, W = Math.max(1.5, 5 * S.s);
          ctx.globalAlpha = S.alpha;
          if (fxReady("xtz_star")) { const I = fxSheet("xtz_star").img, z = 2 * L; ctx.translate(o.x, o.y); ctx.rotate(S.a); ctx.drawImage(I, -z / 2, -z / 2, z, z); }
          else {
            for (let k = 0; k < 2; k++) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(S.a + k * Math.PI / 2); const g = ctx.createLinearGradient(-L, 0, L, 0); g.addColorStop(0, "rgba(180,220,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(180,220,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -W, L, 0); ctx.quadraticCurveTo(0, W, -L, 0); ctx.fill(); ctx.restore(); }
          }
        }
        ctx.restore();
      }
      /* 聚光暗角：主角外的畫面變暗（畫在敵人／場景之後、主角與珠子之前，世界座標） */
      function drawAssistDark() {
        const D = Game.dir; if (!D || D.kind !== "assist" || !(D.dark > 0.01)) return;
        const cx = Player.x, cy = Player.y - 120, k = D.dark, g = ctx.createRadialGradient(cx, cy, 70, cx, cy, 360);
        g.addColorStop(0, "rgba(2,6,23,0)"); g.addColorStop(0.5, `rgba(2,6,23,${0.5 * k})`); g.addColorStop(1, `rgba(2,6,23,${0.88 * k})`);
        ctx.save(); ctx.fillStyle = g; ctx.fillRect(cx - 3200, -1600, 6400, 4200); ctx.restore();
      }

      /* v0.8.118 太初替身護體光暈：tishenActive（免死護魂尚未用掉）期間，主角身上有淡藍光暈＋繞身光點；無敵時間內更亮，護魂被消耗時爆開消失 */
      function drawTishenAura(front) {
        const on = Player.tishenActive && Game.mode === "battle"; if (!on || Game.dir && Game.dir.kind === "assist") return;
        const now = performance.now() / 1000, inv = Player.invulnTimer > 0.05, k = inv ? 1.5 : 0.95, pulse = 0.85 + 0.15 * Math.sin(now * 4);
        const cx = Player.x, cy = Player.y - 70;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const SH = fxReady("xtz_shield") ? fxSheet("xtz_shield") : null;
        if (SH) { /* v0.8.119 生圖護罩：展開（列 2，0.5 秒）→ 待命循環（列 0）／無敵期強化（列 1）；星塵留在主角前 */
          if (!front) {
            const age = (performance.now() - (Player._shieldT0 || 0)) / 1000, sz = 310;
            let row, col; if (age < 0.5) { row = 2; col = Math.min(3, Math.floor(age / 0.125)); } else { row = inv ? 1 : 0; col = Math.floor(now * 8) % 4; }
            ctx.globalAlpha = inv ? 1 : 0.85; ctx.drawImage(SH.img, col * 256, row * 256, 256, 256, cx - sz / 2, Player.y - 125 - sz / 2, sz, sz);
          } else {
            for (let i = 0; i < 6; i++) { const ph = (now * 0.5 + i / 6) % 1, an = now * 1.6 + i * 1.05; ctx.globalAlpha = (1 - ph) * k; ctx.fillStyle = "#dbeafe"; ctx.beginPath(); ctx.arc(cx + Math.cos(an) * 40, Player.y - 8 - ph * 150, 2.4 * (1 - ph * 0.5), 0, Math.PI * 2); ctx.fill(); }
          }
          ctx.restore(); return;
        }
        if (!front) {
          const R = 115 * pulse, g = ctx.createRadialGradient(cx, cy, 12, cx, cy, R);
          g.addColorStop(0, `rgba(147,197,253,${0.34 * k})`); g.addColorStop(0.6, `rgba(96,165,250,${0.22 * k})`); g.addColorStop(1, "rgba(96,165,250,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.8, R * 1.15, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = `rgba(191,219,254,${0.5 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 46 * pulse, 84 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
        } else {
          for (let i = 0; i < 6; i++) { /* 繞身光點（上升的星塵） */
            const ph = (now * 0.5 + i / 6) % 1, an = now * 1.6 + i * 1.05, x = cx + Math.cos(an) * 40, y = Player.y - 8 - ph * 150;
            ctx.globalAlpha = (1 - ph) * k; ctx.fillStyle = "#dbeafe"; ctx.beginPath(); ctx.arc(x, y, 2.4 * (1 - ph * 0.5), 0, Math.PI * 2); ctx.fill();
          }
          if (fxReady("xtz")) { const A = fxSheet("xtz"), col = Math.floor(now * 8) % 4, sz = 46; ctx.globalAlpha = 0.9 * k; ctx.drawImage(A.img, col * 256, 0, 256, 256, cx - sz / 2, cy - 8 - sz / 2, sz, sz); } /* 胸口的珠光 */
        }
        ctx.restore();
      }

      /* ====================== v0.8.125 Boss 光暈（peril_aura 生圖，取代危招紅色濾鏡） ======================
       * 列 0 危招紅焰（isPerilous，循環）、列 1 霸體藍殼（armor 招的前搖～出手，循環）、列 2 啟動閃現（一次）、列 3 架勢崩潰碎裂（一次）。
       * 光暈是直立橢圓（寬 60%、高 92%），中心對準 Boss 身體；高度以 Boss 精靈高度估計（bossVis.k × 480）。畫在 Boss 後面。 */
      function drawBossAura() {
        if (Game.mode !== "battle" || Boss.hp <= 0 || !fxReady("peril_aura")) return;
        if (Boss._pp && Boss._pp.phase !== 2) return; /* 部位 Boss 一階段沒有本體 */
        const stage = Stages[Boss.stageId], m = stage && stage.moves ? stage.moves[Boss.moveType] : null;
        const act = Boss.state === "windup" || Boss.state === "active";
        const peril = !!Boss.isPerilous && act, armor = !!(m && m.armor) && act && !peril;
        const H = Math.max(180, bossVis(stage).k * 480), cell = H / 0.92, cx = Boss.x, cy = Boss.y - H * 0.5 - 6, now = performance.now() / 1000;
        const kind = peril ? 0 : armor ? 1 : -1;
        if (kind === 0 && Boss._auraKind !== 0) { /* 危招剛啟動：閃現一次 */
          Boss._auraKind = 0; spawnFx("peril_aura", 2, cx, cy, { w: cell * 1.25, dur: 0.4, follow: () => ({ x: Boss.x, y: Boss.y - H * 0.5 - 6 }) });
        } else if (kind !== 0) Boss._auraKind = kind;
        if (Boss.state === "staggered" && !Boss._auraBroke) { Boss._auraBroke = true; spawnFx("peril_aura", 3, cx, cy, { w: cell * 1.1, dur: 0.6 }); }
        if (Boss.state !== "staggered") Boss._auraBroke = false;
        if (kind < 0) return;
        const A = fxSheet("peril_aura"), col = Math.floor(now * 9) % 4, p = Boss.stateDur ? 1 - Boss.stateTimer / Boss.stateDur : 1;
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Boss.state === "windup" ? 0.45 + 0.55 * Math.min(1, p * 1.6) : 1;
        ctx.drawImage(A.img, col * 256, kind * 256, 256, 256, cx - cell / 2, cy - cell / 2, cell, cell);
        ctx.restore();
      }

      /* ====================== v0.8.127 第 2 關登場「鏡花水月」（boss2intro 生圖：列 0 鏡片環、1 鏡面映影、2 炸碎、3 八卦陣紋） ======================
       * 0.15 鏡片環繞（越轉越小）→ 1.45 鏡面浮現映出剪影 → 3.0 炸碎：顧天風現身、8 個分身殘影一圈閃現後收攏消散、地面八卦陣紋脈動
       * → 3.25 名牌滑入＋鏡頭瞬間拉近＋開始配樂 → 名牌飛走、鏡頭縮回 → 結束。 */
      function mirrorStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, cam = Game.camera, P = c.plate, cx = Boss.x, cy = G - 170, z0 = cam.targetZoom + 0.2;
        const tPlate = c.burstAt + 0.25, tHold = tPlate + P.tin + P.hold, tEnd = tHold + P.tout;
        (c.sfxT || []).forEach((s, i) => { if (!D["s" + i] && t >= s[0]) { D["s" + i] = true; Sound.play(s[1], s[2], s[3]); } });
        if (!D.ring && t >= c.ringAt && fxReady("boss2intro")) { D.ring = true; spawnFx("boss2intro", 0, cx, cy, { w: 560, dur: c.mirrorAt + 0.8 - c.ringAt, loop: true, fps: 8, grow: -0.5, alpha: 0.9 }); }
        if (!D.mir && t >= c.mirrorAt && fxReady("boss2intro")) { D.mir = true; spawnFx("boss2intro", 1, cx, cy, { w: 420, dur: c.burstAt - c.mirrorAt }); }
        if (!D.burst && t >= c.burstAt) {
          D.burst = true; Boss._introHide = false; D.ghostT0 = t;
          if (fxReady("boss2intro")) { spawnFx("boss2intro", 2, cx, cy, { w: 560, dur: 0.6 }); spawnFx("boss2intro", 3, cx, G - 4, { anchor: "b", w: 820, h: 330, dur: 1.6 }); }
          screenFlash("rgba(230,255,245,0.8)", 0.65, 0.4); addTrauma(0.7); triggerHitstopMs(100); hapticBuzz([50, 30, 90]);
        }
        if (!D.zoomed && t >= tPlate) {
          D.zoomed = true; D.zoomT0 = t; D.camNow = { zoom: z0 + 0.6, y: -30, rate: 40 };
          Music.duckUntil = 0; Music.duckLvl = 1; if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]);
          bossNameCard(D.st, { slide: true, sub: c.sub, tin: P.tin, hold: P.hold, tout: P.tout });
        }
        if (D.zoomed && !D.out && t >= tHold) { D.out = true; D.camNow = { zoom: cam.targetZoom, y: 0, rate: 7 }; }
        const up = Math.min(1, t / 1.2), down = t > tHold ? Math.max(0, 1 - (t - tHold) / 0.5) : 1;
        D.a = (c.tintA || 0.34) * up * down;
        D.dim = 0.62 * Math.min(1, t / 0.7) * (t < c.burstAt ? 1 : Math.max(0, 1 - (t - c.burstAt) / 1.4)); /* 背景暗化（鏡片是加亮疊色，亮背景上會變純白） */
        if (t >= c.burstAt - 0.001 && t < tEnd) Boss._cineImg = "01_idle1";
        c.dur = Math.max(c.dur, tEnd + 0.05);
      }
      /* 分身殘影：8 個半透明顧天風在地面排成一圈，0.9 秒內向本體收攏並淡出（用 01_idle1 立繪，畫在本體後面） */
      function drawIntroGhosts() {
        const D = Game.dir; if (!D || !D.c || D.c.kind !== "mirror") return;
        if (D.dim > 0.01) { ctx.save(); ctx.fillStyle = `rgba(12,8,38,${D.dim})`; ctx.fillRect(Game.camera.x - 1600, -1600, Config.baseWidth + 3200, 4200); ctx.restore(); } /* 世界座標的暗層：只暗背景，鏡片與 Boss 畫在它之後 */
        if (D.ghostT0 == null) return;
        const u = (D.t - D.ghostT0) / 1.0; if (u < 0 || u > 1) return;
        const SP = Stages[Boss.stageId].sprite ? getBossSprite(Stages[Boss.stageId].sprite) : null, img = SP && SP.imgs["01_idle1"];
        if (!img || !img.complete || !img.naturalWidth) return;
        const k = bossVis(Stages[Boss.stageId]).k, offs = [-430, -310, -200, -105, 105, 200, 310, 430], e = u * u * (3 - 2 * u);
        offs.forEach((o, i) => {
          ctx.save(); ctx.globalAlpha = 0.62 * (1 - u) * (u < 0.12 ? u / 0.12 : 1);
          ctx.translate(Boss.x + o * (1 - 0.85 * e), Boss.y + GROUND_SINK); ctx.scale((i % 2 ? 1 : -1) * k, k); ctx.drawImage(img, -450, -560); ctx.restore();
        });
      }

      /* ====================== v0.8.130 第 3 關登場「疾風入場」（boss3intro 生圖：列 0 橫貫斬線、1 竹葉切開、2 水環、3 雙劍交叉） ======================
       * 0.6 暗下＋劍光橫貫畫面（Boss 還沒出現）、竹葉被切開 → 1.05 起 Boss 從畫面外疾衝滑入（殘影、`01_idle1`），1.75 煞停：雙劍交叉閃光＋水環
       * → 2.0 名牌滑入（斬線閃光起手）＋鏡頭瞬間拉近＋開始關卡曲 → 名牌飛走鏡頭拉回 → 結束。 */
      function dashStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, cam = Game.camera, P = c.plate, z0 = cam.targetZoom + 0.2;
        if (D.tx == null) { D.tx = Boss.x; D.dir = Player.x >= Boss.x ? -1 : 1; }
        const tPlate = c.landAt + 0.25, tHold = tPlate + P.tin + P.hold, tEnd = tHold + P.tout;
        (c.sfxT || []).forEach((s, i) => { if (!D["s" + i] && t >= s[0]) { D["s" + i] = true; Sound.play(s[1], s[2], s[3]); } });
        const camX = cam.x + Config.baseWidth * 0.5; /* 畫面中心（世界座標） */
        if (!D.slash && t >= c.slashAt && fxReady("boss3intro")) {
          D.slash = true; D.slashX = camX;
          spawnFx("boss3intro", 0, camX, G - 190, { w: 1500, h: 300, dur: 0.55, alpha: 0.7 }); /* 橫貫畫面的斬線（一格 256 寬拉成 1500） */
          spawnFx("boss3intro", 1, camX - 80, G - 170, { w: 380, dur: 0.7, alpha: 0.75 }); spawnFx("boss3intro", 1, camX + 140, G - 150, { w: 320, dur: 0.7, facing: -1, alpha: 0.75 });
          screenFlash("rgba(235,245,255,0.5)", 0.25, 0.3); addTrauma(0.35); hapticBuzz([25, 15, 40]);
        }
        const tD = c.landAt - c.dashAt;
        if (t >= c.dashAt && t < c.landAt + 0.01) { /* 疾衝滑入：由畫面外沿地面衝到站位，ease-out */
          const u = Math.min(1, (t - c.dashAt) / tD), e = 1 - Math.pow(1 - u, 3);
          Boss._introHide = false; Boss.facing = -D.dir; Boss.x = D.tx + D.dir * (c.dashFrom || 1500) * (1 - e); Boss.y = G;
          Boss._cineImg = u < 0.8 ? "03_walk1" : "01_idle1";
          if (!D.trailOk) D.trailOk = 0;
          D.trailOk += dt; if (D.trailOk > 0.05) { D.trailOk = 0; emitDust(Boss.x - D.dir * -60, G, -D.dir, 2, 1.2); }
        }
        if (!D.landed && t >= c.landAt) {
          D.landed = true; Boss.x = D.tx; Boss._cineImg = "01_idle1";
          if (fxReady("boss3intro")) { spawnFx("boss3intro", 3, Boss.x, G - 150, { w: 520, dur: 0.55 }); spawnFx("boss3intro", 2, Boss.x, G - 6, { anchor: "b", w: 900, h: 340, dur: 1.2 }); }
          emitDust(Boss.x, G, 1, 6, 1.6); emitDust(Boss.x, G, -1, 6, 1.6);
          screenFlash("rgba(235,245,255,0.6)", 0.5, 0.3); addTrauma(0.75); triggerHitstopMs(90); hapticBuzz([50, 30, 80]);
        }
        if (!D.zoomed && t >= tPlate) {
          D.zoomed = true; D.zoomT0 = t; D.camNow = { zoom: z0 + 0.6, y: -30, rate: 40 };
          Music.duckUntil = 0; Music.duckLvl = 1; if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]);
          bossNameCard(D.st, { slide: true, sub: c.sub, tin: P.tin, hold: P.hold, tout: P.tout });
        }
        if (D.zoomed && !D.out && t >= tHold) { D.out = true; D.camNow = { zoom: cam.targetZoom, y: 0, rate: 7 }; }
        D.focusX = D.landed ? Boss.x : camX;
        const up = Math.min(1, t / 0.5), down = t > tHold ? Math.max(0, 1 - (t - tHold) / 0.5) : 1;
        D.a = (c.tintA || 0.4) * up * down; D.dim = 0;
        c.dur = Math.max(c.dur, tEnd + 0.05);
      }


      /* ====================== v0.8.141 第 5 關演出 ====================== */
      function wolfStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, cam = Game.camera, P = c.plate, z0 = cam.targetZoom + 0.15;
        if (D.tx == null) { D.tx = Boss.x; D.dir = Player.x >= Boss.x ? -1 : 1; }
        const tPlate = c.landAt + 0.6, tHold = tPlate + P.tin + P.hold, tEnd = tHold + P.tout;
        (c.sfxT || []).forEach((s, i) => { if (!D["s" + i] && t >= s[0]) { D["s" + i] = true; Sound.play(s[1], s[2], s[3]); } });
        const camX = cam.x + Config.baseWidth * 0.5;
        const EY = [[-330, -250, 300], [300, -300, 240], [-40, -330, 380]]; /* 暗處的三對狼眼（相對畫面中心 x、相對地面 y、寬） */
        c.eyesAt.forEach((ea, i) => { if (!D["e" + i] && t >= ea && fxReady("boss5intro")) { D["e" + i] = true; const e = EY[i]; spawnFx("boss5intro", 0, camX + e[0], G + e[1], { w: e[2], dur: 1.15, alpha: 0.95 }); addTrauma(0.15); hapticBuzz(15); } });
        if (!D.slash && t >= c.slashAt && fxReady("boss5intro")) {
          D.slash = true; spawnFx("boss5intro", 1, camX, G - 220, { w: 1300, dur: 0.6, alpha: 0.95 });
          screenFlash("rgba(255,60,60,0.5)", 0.3, 0.3); addTrauma(0.5); hapticBuzz([25, 15, 50]);
        }
        const tD = c.landAt - c.dashAt;
        if (t >= c.dashAt && t < c.landAt + 0.01) { /* 小狼由畫面外疾衝，ease-out 煞停；沿途留殘影與揚塵 */
          const u = Math.min(1, (t - c.dashAt) / tD), e = 1 - Math.pow(1 - u, 3);
          Boss._introHide = false; Boss.facing = -D.dir; Boss.x = D.tx + D.dir * (c.dashFrom || 1500) * (1 - e); Boss.y = G;
          Boss._cineImg = u < 0.85 ? "53_sr_dart" : "54_sr_skid";
          D.tr = (D.tr || 0) + dt; if (D.tr > 0.06) { D.tr = 0; emitDust(Boss.x + D.dir * 50, G, -Boss.facing, 2, 1.2); if (fxReady("boss5flame")) spawnFx("boss5flame", 3, Boss.x, Boss.y - 85, { w: 420, dur: 0.25, alpha: 0.55, facing: Boss.facing, c0: 2, nf: 1 }); }
        }
        if (!D.landed && t >= c.landAt) {
          D.landed = true; Boss.x = D.tx; Boss._introHide = false; Boss._cineImg = "20_bite_crouch";
          if (fxReady("boss5intro")) spawnFx("boss5intro", 3, Boss.x, Boss.y - 80, { w: 460, dur: 0.6, facing: Boss.facing }); /* 現身剪影也要朝向主角（圖朝右，不鏡像會一瞬間反向） */
          if (fxReady("land")) { spawnFx("land", 0, Boss.x, G - 8, { anchor: "b", w: 800, h: 320, dur: 0.7, alpha: 0.9 }); spawnFx("land", 1, Boss.x - D.dir * -60, G, { anchor: "b", w: 520, dur: 0.8, facing: -Boss.facing }); }
          emitDust(Boss.x, G, 1, 6, 1.6); emitDust(Boss.x, G, -1, 6, 1.6);
          screenFlash("rgba(255,120,120,0.5)", 0.45, 0.3); addTrauma(0.75); triggerHitstopMs(90); hapticBuzz([50, 30, 80]);
        }
        if (D.landed && t >= c.landAt + 0.35) Boss._cineImg = "01_idle1";
        if (!D.zoomed && t >= tPlate) {
          D.zoomed = true; D.zoomT0 = t; D.camNow = { zoom: z0 + 0.5, y: -30, rate: 40 };
          Music.duckUntil = 0; Music.duckLvl = 1; if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]);
          bossNameCard(D.st, { slide: true, sub: c.sub, tin: P.tin, hold: P.hold, tout: P.tout });
        }
        if (D.zoomed && !D.out && t >= tHold) { D.out = true; D.camNow = { zoom: cam.targetZoom, y: 0, rate: 7 }; }
        D.focusX = D.landed ? Boss.x : camX;
        const up = Math.min(1, t / 1.0), down = t > tHold ? Math.max(0, 1 - (t - tHold) / 0.5) : 1;
        D.a = (c.tintA || 0.4) * up * down; D.dim = 0.5 * up * (t > c.landAt ? Math.max(0, 1 - (t - c.landAt) / 0.9) : 1) * down; /* 暮色轉暗：整個戰場壓暗，狼眼才顯眼 */
        c.dur = Math.max(c.dur, tEnd + 0.05);
      }
      /* 二階段：低頭→0.9 抬頭（一直抬著）並慢慢變大 → crackAt 裂紋蔓延 → shardAt~boneAt 血肉一片片剝落燃燒（由尾到頭溶解，邊緣泛火）→ 魔焰柱竄起 → burstAt 爆焰重生（換大狼） */
      function morphStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, st = D.st;
        (c.sfxT || []).forEach((s, i) => { if (!D["s" + i] && t >= s[0]) { D["s" + i] = true; Sound.play(s[1], s[2], s[3]); } });
        if (t < c.burstAt) {
          Boss._cineImg = t < 0.9 ? "07_windup" : "59_s_howl";
          const g = Math.max(0, Math.min(1, (t - 0.9) / (c.boneAt - 0.9 - 0.4)));
          Boss._scaleMul = 1 + 0.5 * g * g * (3 - 2 * g); /* 慢慢變大 */
          if (t >= c.shardAt) Boss._introHide = true; /* 開始剝落：改畫會溶解的那一份 */
          addTrauma(dt * (0.3 + 0.9 * Math.min(1, t / c.burstAt)));
          if (t >= c.crackAt && Math.random() < dt * 12) emitDust(Boss.x + (Math.random() - 0.5) * 160, G, Math.random() < 0.5 ? -1 : 1, 2, 0.9);
          if (t >= c.shardAt && !D.sh1) { D.sh1 = true; screenFlash("rgba(255,70,50,0.4)", 0.3, 0.3); hapticBuzz([30, 20, 50]); }
          if (t >= c.shardAt && t < c.boneAt && fxReady("boss5morph")) { /* 一片片血肉剝起、燃燒、飄散（列 1：血肉片→旋起→火焰→火星） */
            D.fa = (D.fa || 0) - dt; D.fb = (D.fb || 0) - dt;
            const m = (t - c.shardAt) / (c.boneAt - c.shardAt), bx = Boss.x - Boss.facing * (m - 0.5) * 220 * -1, k = Boss._scaleMul || 1;
            if (D.fa <= 0) { D.fa = 0.2; spawnFx("boss5morph", 1, bx + (Math.random() - 0.5) * 120, Boss.y - 70 * k - Math.random() * 60, { w: 190 + Math.random() * 90, dur: 0.9, vy: -70, vx: (Math.random() - 0.5) * 80, c0: 0, nf: 2, alpha: 0.95, facing: Math.random() < 0.5 ? 1 : -1 }); }
            if (D.fb <= 0) { D.fb = 0.07; spawnFx("boss5morph", 1, bx + (Math.random() - 0.5) * 160, Boss.y - 40 * k - Math.random() * 110, { w: 70 + Math.random() * 90, dur: 0.75, vy: -110, vx: (Math.random() - 0.5) * 50, c0: 2, nf: 2, alpha: 0.9 }); }
          }
          if (t >= c.boneAt && !D.bone) { D.bone = true; screenFlash("rgba(160,100,255,0.4)", 0.3, 0.35); addTrauma(0.6); hapticBuzz([40, 30, 70]); }
        } else {
          Boss._introHide = false;
        }
        if (!D.burst && t >= c.burstAt) {
          Boss._scaleMul = 1; Boss.stance = (st.stanceByPhase && st.stanceByPhase[2]) || "B"; Boss.stanceCount = 0; Boss.flashFrames = 5; applyBossBody(st); Boss._cineImg = "01_idle1";
          dirBurst(D); wolfBackFlame();
          if (fxReady("boss5morph")) spawnFx("boss5morph", 3, Boss.x, G + 14, { anchor: "b", w: 1050, dur: 1.4, alpha: 0.95 });
        }
        if (Player.blast) dirPlayerStep(dt);
        const up = Math.min(1, t / 1.2), down = D.burst ? Math.max(0, 1 - (t - c.burstAt) / Math.max(0.3, c.dur - c.burstAt)) : 1;
        D.a = (c.tintA || 0.4) * up * down; D.dim = 0.45 * up * down;
      }
      function drawWolfDirWorld(D) {
        if (D.dim > 0.01) { ctx.save(); ctx.fillStyle = `rgba(${D.c.kind === "wolf" ? "34,4,10" : "24,6,36"},${D.dim})`; ctx.fillRect(Game.camera.x - 1600, -1600, Config.baseWidth + 3200, 4200); ctx.restore(); }
        if (D.c.kind !== "morph") return; const c = D.c, t = D.t, G = Config.groundY, F = fxReady("boss5morph") ? fxSheet("boss5morph") : null; if (!F || t >= c.burstAt) return;
        const cx = Boss.x, W = 330 * (Boss._scaleMul || 1), m = Math.max(0, Math.min(1, (t - c.shardAt) / (c.boneAt - c.shardAt)));
        /* 溶解中的狼身：自己畫（Boss 已隱藏），逐格由尾到頭消失，邊緣泛橘 */
        if (t >= c.shardAt) {
          const stp = D.st, SP = stp.sprite ? getBossSprite(stp.sprite) : null, img = SP && SP.imgs[t < 0.9 ? "07_windup" : "59_s_howl"];
          if (img && img.complete && img.naturalWidth) {
            const iw = img.naturalWidth, ih = img.naturalHeight, CS = 20, cols = Math.ceil(iw / CS), rows = Math.ceil(ih / CS);
            if (!D.oc) { D.oc = document.createElement("canvas"); D.oc.width = iw; D.oc.height = ih; D.thr = new Float32Array(cols * rows); for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) D.thr[r * cols + q] = 0.5 * Math.random() + 0.5 * (D.fl ? 1 - q / cols : q / cols); }
            const og = D.oc.getContext("2d"), mm = m * 1.12 - 0.06; /* 讓 0～1 都掃得過 */
            og.globalCompositeOperation = "source-over"; og.clearRect(0, 0, iw, ih); og.drawImage(img, 0, 0);
            for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const th = D.thr[r * cols + q]; if (th < mm) { og.globalCompositeOperation = "destination-out"; og.fillStyle = "#000"; og.fillRect(q * CS, r * CS, CS, CS); } else if (th < mm + 0.07) { og.globalCompositeOperation = "source-atop"; og.fillStyle = "rgba(255,120,40,0.85)"; og.fillRect(q * CS, r * CS, CS, CS); } }
            og.globalCompositeOperation = "source-over";
            const k = bossVis(stp).k, face = Boss.facing;
            ctx.save(); ctx.translate(cx, Boss.y + GROUND_SINK); ctx.scale(face * k, k); ctx.drawImage(D.oc, -450, -560); ctx.restore();
          }
        }
        if (t >= c.crackAt && t < c.boneAt) { /* 裂紋四格依序變亮，鎖在狼身上並跟著變大，剝落時漸隱 */
          const col = Math.min(3, Math.floor((t - c.crackAt) / ((c.shardAt - c.crackAt) / 4))), fade = 0.75 * Math.max(0, 1 - m * 1.7);
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.95 * fade; ctx.translate(cx, G); ctx.scale(Boss.facing, 1); ctx.drawImage(F.img, col * 256, 0, 256, 256, -W / 2, -W * 0.9, W, W); ctx.restore();
        }
        if (t >= c.boneAt - 1.2) { /* 魔焰柱由殘軀竄起（重生爆焰第 2 格：狼首火柱），越來越大 */
          const u = Math.min(1, (t - (c.boneAt - 1.2)) / (c.burstAt - c.boneAt + 1.2)), ws = 360 + 380 * u;
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.9 * u; ctx.drawImage(F.img, 256, 768, 256, 256, cx - ws / 2, G + 20 - ws * 0.95, ws, ws); ctx.restore();
        }
      }

      /* ====================== v0.8.133 第 4 關三段演出（部位 Boss：巨劍＝`Boss._pp.sword`、巨手＝`_pp.hands`） ====================== */
      function dirShards(dt) { const P = Boss._pp, G = Config.groundY; if (!P) return; for (let i = P.shards.length - 1; i >= 0; i--) { const s = P.shards[i]; if (s.fly) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 1400 * dt; if (s.y > G) { s.y = G; s.vy *= -0.3; s.vx *= 0.5; } } s.t -= dt; if (s.t <= 0) P.shards.splice(i, 1); } } /* 導演期間碎片照常飛（世界暫停時不會有人更新它們） */
      function dirSfxT(D) { dirShards(D._dtLast || 0.016); (D.c.sfxT || []).forEach((s, i) => { if (!D["s" + i] && D.t >= s[0]) { D["s" + i] = true; Sound.play(s[1], s[2], s[3]); } }); }
      function drawJadeSword(x, tipY, alpha, glow) { /* 畫巨劍（劍尖在 tipY、直立朝下），沿用部位引擎的 sw1 圖與 swK／swTip */
        const A = partsDef().art, img = A && partImg("sw1"); if (!img) return;
        const K = A.swK, tp = A.swTip[0];
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, tipY);
        if (glow) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = alpha * glow; ctx.filter = "brightness(1.7)"; }
        ctx.drawImage(img, -tp[0] * K, -tp[1] * K, img.naturalWidth * K, img.naturalHeight * K); ctx.restore();
      }
      /* 登場：霧中殘劍輕顫 → 0.7 地裂 → 1.5 巨劍升起 → 2.6 三道金環逐一亮起 → 3.2 巨手落下握柄 → 3.9 拔劍高舉＋震環＋名牌「壓下」→ 拉回 */
      function graveStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, P = Boss._pp, cam = Game.camera, sx = P.spiritX, Pl = c.plate;
        dirSfxT(D); const tPlate = c.pullAt + 0.55, tHold = tPlate + Pl.tin + Pl.hold, tEnd = tHold + Pl.tout;
        D.sx = D.sx == null ? sx : D.sx; const x = D.sx + 280;
        if (!D.crack && t >= c.crackAt && fxReady("boss4intro")) { D.crack = true; spawnFx("boss4intro", 0, x, G + 10, { anchor: "b", w: 520, h: 520, dur: 1.2, col: -1, nf: 4 }); addTrauma(0.6); hapticBuzz([40, 25, 60]); }
        const ru = t < c.riseAt ? 0 : Math.min(1, (t - c.riseAt) / 1.1), e = 1 - Math.pow(1 - ru, 3);
        D.tip = (G + 256) + (-376) * e;                                  // 升到 G-120（hover 位）
        if (ru > 0) drawJadeSwordDeferred(D, x, ru);
        D.ringsOn = t >= c.ringsAt;
        if (t >= c.riseAt + 0.6 && t < tPlate && !D.lookUp) { D.lookUp = true; D.camNow = { zoom: cam.targetZoom + 0.0, y: -330, rate: 4 }; } /* 巨劍升起後鏡頭抬起，看劍柄的三道金環與巨手 */
        const lift = t < c.pullAt ? 0 : Math.min(1, (t - c.pullAt) / 0.5); D.tip -= lift * 150; // 拔劍高舉
        if (!D.hand && t >= c.handAt && fxReady("boss4intro")) { D.hand = true; D.handT0 = t; }
        if (!D.pulled && t >= c.pullAt) {
          D.pulled = true; addTrauma(0.9); triggerHitstopMs(110); screenFlash("rgba(230,255,245,0.55)", 0.4, 0.4); hapticBuzz([70, 40, 110]);
          if (fxReady("boss4intro")) spawnFx("boss4intro", 3, x, G - 6, { anchor: "b", w: 1100, h: 440, dur: 1.1, alpha: 0.85 });
        }
        if (!D.zoomed && t >= tPlate) {
          D.zoomed = true; D.zoomT0 = t; D.camNow = { zoom: cam.targetZoom + 0.3, y: -240, rate: 20 };
          Music.duckUntil = 0; Music.duckLvl = 1; if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]);
          bossNameCard(D.st, { slam: true, sub: c.sub, dur: (Pl.tin + Pl.hold + Pl.tout) * 1000 }); /* 蓋章壓下（巨劍從天而來，名牌也從上壓下） */
        }
        if (D.zoomed && !D.out && t >= tHold) { D.out = true; D.camNow = { zoom: cam.targetZoom, y: 0, rate: 6 }; }
        const up = Math.min(1, t / 1.0), down = t > tHold ? Math.max(0, 1 - (t - tHold) / 0.6) : 1;
        D.a = (c.tintA || 0.4) * up * down; D.dim = 0.4 * Math.min(1, t / 0.8) * down;
        c.dur = Math.max(c.dur, tEnd + 0.05);
        D.focusX = x;
      }
      function drawJadeSwordDeferred(D, x, ru) { D.draw = { x, tip: D.tip, ru }; }
      /* 登場／轉場時畫在世界座標：劍、金環、巨手（由 drawDirWorld 在 Boss 後面呼叫） */
      function drawDirWorld() {
        const D = Game.dir; if (!D) return; const k = D.c.kind; if (k === "wolf" || k === "morph") { drawWolfDirWorld(D); return; }
        if (k !== "graveyard" && k !== "formtrans" && k !== "descend") return;
        const G = Config.groundY, now = performance.now() / 1000, P = Boss._pp;
        if (D.dim > 0.01) { ctx.save(); ctx.fillStyle = `rgba(10,18,30,${D.dim})`; ctx.fillRect(Game.camera.x - 1600, -1600, Config.baseWidth + 3200, 4200); ctx.restore(); }
        if (k === "descend") drawDescendWorld(D, G, now);
        if (k === "graveyard" && D.draw) {
          const d = D.draw; drawJadeSword(d.x, d.tip, Math.min(1, d.ru * 1.6), D.pulled ? 0.35 : 0);
          if (D.ringsOn && fxReady("boss4intro")) { /* 三道金環：沿劍柄（劍尖上方 416／442／470，部位引擎 ringY）逐一亮起 → 取列 1 的 4 格（1 環→2 環→3 環→脈動） */
            const A = fxSheet("boss4intro"), col = Math.min(3, Math.floor((D.t - D.c.ringsAt) / 0.28) + (D.t - D.c.ringsAt > 1.0 ? Math.floor(now * 6) % 2 : 0));
            ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(A.img, Math.min(3, col) * 256, 256, 256, 256, d.x - 105, d.tip - 548, 210, 210); ctx.restore();
          }
          if (D.hand && fxReady("boss4intro")) { /* 巨手：從上落下握住劍柄（列 2 循環）；手腕在上、手指向下，握處對準劍柄 */
            const A = fxSheet("boss4intro"), col = Math.floor(now * 6) % 4, hu = Math.min(1, (D.t - D.handT0) / 0.7), hy = d.tip - 640 - (1 - hu) * 420;
            ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, hu * 1.5) * 0.9; ctx.drawImage(A.img, col * 256, 512, 256, 256, d.x - 190, hy - 60, 380, 380); ctx.restore();
          }
        }
      }
      /* 一→二階段：巨劍整把發光、封印環全亮 → 炸成光 → 光點重組六劍飛散 → 繞圈後劍尖朝下鎖陣 → 結束時呼叫 formationStart 的內容（劍陣的劍已在 formationStart 建好，只是被藏） */
      function formTransStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, P = Boss._pp, cam = Game.camera; dirSfxT(D);
        const x = P.sword.x;
        if (!D.glow) { D.glow = true; D.tip0 = P.sword.tip; }
        if (!D.burst && t >= 0.02) { D.burst = true; screenFlash("rgba(230,250,255,0.7)", 0.45, 0.4); addTrauma(0.8); triggerHitstopMs(100); hapticBuzz([60, 30, 100]); if (fxReady("boss4fx2")) { spawnFx("boss4fx2", 3, x, G - 260, { w: 760, dur: 0.7, col: 1 }); } if (fxReady("spark")) spawnFx("spark", 3, x, G - 220, { w: 640, dur: 0.6, alpha: 0.8 }); }
        const up = Math.min(1, t / 0.8), down = t > c.dur - 0.6 ? Math.max(0, (c.dur - t) / 0.6) : 1;
        D.a = (c.tintA || 0.35) * up * down; D.dim = 0.3 * up * down; D.focusX = x;
      }
      function drawFormGlow(D, x) {
        const u = D.t / 1.0, P = Boss._pp; if (!P) return;
        D.draw = null; /* 巨劍本體仍由部位引擎畫（sw.mode）；這裡只疊光與裂紋 */
        ctx.save(); ctx.globalCompositeOperation = "lighter"; const tip = P.sword.tip;
        const g = ctx.createLinearGradient(x, tip - 520, x, tip); g.addColorStop(0, `rgba(200,255,235,${0.5 * u})`); g.addColorStop(1, `rgba(120,200,255,${0.25 * u})`);
        ctx.fillStyle = g; ctx.fillRect(x - 70, tip - 520, 140, 520); ctx.restore();
      }
      /* 二→三階段：六劍落地後光塵向中央聚攏 → 光柱 → 背景古靈身影收縮進光柱 → 人形現身 */
      function descendStep(D, dt) {
        const c = D.c, t = D.t, G = Config.groundY, P = Boss._pp, cam = Game.camera; dirSfxT(D);
        const cx = P ? P.coreX || Boss.x : Boss.x;
        if (!D.gather && t >= 0.1 && fxReady("dir4")) { D.gather = true; spawnFx("dir4", 3, cx, G - 150, { w: 620, dur: 1.5, alpha: 0.8 }); }
        if (!D.pillar && t >= 1.4 && fxReady("dir4")) { D.pillar = true; spawnFx("dir4", 2, cx, G, { anchor: "b", w: 460, h: 740, dur: 1.5, alpha: 0.7 }); spawnFx("dir4", 1, cx, G - 8, { anchor: "b", w: 1000, h: 400, dur: 1.4, alpha: 0.7 }); screenFlash("rgba(225,240,255,0.5)", 0.3, 0.4); addTrauma(0.6); }
        const up = Math.min(1, t / 0.8), down = t > c.dur - 0.6 ? Math.max(0, (c.dur - t) / 0.6) : 1;
        D.a = (c.tintA || 0.35) * up * down; D.dim = 0.35 * up * down; D.focusX = cx;
      }

      /* v0.8.154 招架時機光圈（生圖 cue.webp，由 Boss.nextImpactIn 驅動）全關卡套用：第 5 關起的做法推廣到九關；沒載到圖時 drawBossEntity 會退回程式光圈 */
      Object.keys(Stages).forEach(k => { const st = Stages[k]; if (!st || !st.moves) return; st.cueArt = true; if (!(st.fxSheets || []).includes("cue")) st.fxSheets = (st.fxSheets || []).concat(["cue"]); });
