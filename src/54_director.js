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
          intro: { dur: 2.5, burstAt: 1.2, poses: [[0, "17_kneel"], [1.2, "14_cast"], [1.9, "07_windup"]], tint: "120,20,20", tintA: 0.35,
            aura: { sheet: "boss2", row: 3, w: 380, at: 0.3, fps: 10, dy: 12 }, ring: { sheet: "land", row: 0, w: 900, dur: 0.7 }, name: true,
            sfx: [["execution", 0.8, 0.8]] },
          phase: { dur: 2.6, burstAt: 1.15, poses: [[0, "17_kneel"], [1.15, "14_cast"], [1.95, "07_windup"]], tint: "150,20,20", tintA: 0.5,
            aura: { sheet: "boss2", row: 3, w: 440, at: 0.2, fps: 11, dy: 12 }, ring: { sheet: "land", row: 0, w: 1100, dur: 0.8 },
            pillar: { sheet: "ult", row: 3, w: 420, dur: 0.9 }, title: ["煞氣暴走", "二　階　段", "#f87171"],
            sfx: [["peril", 1.0, 0.6], ["execution", 0.9, 0.7]] }
        },
        2: { /* 千幻長老・顧天風：蹲伏、八卦風起 → 舉扇，陣紋大亮 */
          intro: { dur: 2.5, burstAt: 1.2, poses: [[0, "17_kneel"], [1.2, "14_cast"], [1.9, "07_windup"]], tint: "70,50,140", tintA: 0.3,
            aura: { sheet: "boss2fx", row: 2, w: 520, at: 0.3, fps: 8, dy: -80, anchor: "c" }, ring: { sheet: "exec2", row: 3, w: 800, dur: 0.8 }, name: true,
            sfx: [["execution", 0.7, 1.1]] },
          phase: { dur: 2.6, burstAt: 1.15, poses: [[0, "17_kneel"], [1.15, "14_cast"], [1.95, "07_windup"]], tint: "76,50,150", tintA: 0.42,
            aura: { sheet: "boss2fx", row: 2, w: 640, at: 0.2, fps: 9, dy: -80, anchor: "c" }, ring: { sheet: "exec2", row: 3, w: 1100, dur: 0.9 },
            title: ["真假難辨", "二　階　段", "#c4b5fd"], sfx: [["peril", 0.9, 0.9], ["execution", 0.8, 1.1]] }
        },
        3: { /* 莫寒川：跪地、劍氣聚攏 → 拔出玄鐵重劍（影片時代改回戰場上拔劍） */
          intro: { dur: 2.5, burstAt: 1.2, poses: [[0, "17_kneel"], [1.2, "14_cast"], [1.9, "07_windup"]], tint: "30,41,70", tintA: 0.3,
            aura: { sheet: "boss3fx", row: 1, w: 460, at: 0.3, fps: 8, dy: 4 }, ring: { sheet: "boss3bfx", row: 1, w: 760, dur: 0.7 }, name: true,
            sfx: [["execution", 0.7, 0.9]] },
          phase: { dur: 2.7, burstAt: 1.2, stance: true, poses: [[0, "17_kneel"], [1.2, "14_cast"], [2.0, "07_windup"]], tint: "20,30,60", tintA: 0.45,
            aura: { sheet: "boss3bfx", row: 2, w: 640, at: 0.25, fps: 8, dy: 4 }, pillar: { sheet: "boss3bfx", row: 3, w: 400, dur: 0.7 }, title: ["拔劍・玄鐵", "二　階　段", "#a5b4fc"],
            sfx: [["peril", 0.9, 0.8], ["execution", 0.9, 0.7]] }
        }
      };
      if (Stages[1]) Stages[1].fxSheets = (Stages[1].fxSheets || []).concat(["land", "ult", "boss2"]); /* 階段轉換用的衝擊波環、光柱、氣焰 */
      Object.keys(DIR_CFG).forEach(k => { const st = Stages[k]; if (st) { st.dir = DIR_CFG[k]; st.dirMode = true; } });

      function dirPoseAt(c, t) { let k = c.poses[0][1]; for (const p of c.poses) if (t >= p[0]) k = p[1]; return k; }
      function dirReset() { Game.dir = null; Boss._cineImg = null; }
      function dirStart(kind, st) {
        const c = st && st.dir && st.dir[kind];
        if (!c) return false;
        if (Game.mode !== "battle" || Boss.hp <= 0 || Player.hp <= 0) {
          if (kind === "phase") { if (Boss._p2MoviePending) applyP2Stance(st); if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]); }
          return false;
        }
        Game.dir = { kind, st, c, t: 0, burst: false, a: 0, push: 0, aura: false };
        Boss.facing = Player.x >= Boss.x ? 1 : -1; Boss.vx = 0; Boss.vy = 0; Boss.y = Config.groundY;
        Boss._cineImg = dirPoseAt(c, 0);
        Game.introT = 0; Boss.isPerilous = false;
        Music.duck(0.12, c.burstAt + 0.3);
        if (kind === "phase") { screenFlash("rgba(255,255,255,0.7)", 0.6, 0.4); triggerHitstopMs(90); addTrauma(0.35); hapticBuzz([40, 30, 80]); }
        return true;
      }
      function dirBurst(D) {
        const c = D.c, st = D.st, G = Config.groundY;
        D.burst = true; D.push = 0.35;
        Music.duckUntil = 0; Music.duckLvl = 1;
        if (D.kind === "phase") {
          if (Boss._p2MoviePending) applyP2Stance(st); /* 第 3 關：爆發這一刻換成重劍姿態 */
          if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]);
        } else if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]);
        (c.sfx || []).forEach(s => Sound.play(s[0], s[1], s[2]));
        if (c.ring && fxReady(c.ring.sheet)) spawnFx(c.ring.sheet, c.ring.row, Boss.x, G - 8, { anchor: "b", w: c.ring.w, h: c.ring.w * 0.4, dur: c.ring.dur || 0.7 });
        if (c.pillar && fxReady(c.pillar.sheet)) spawnFx(c.pillar.sheet, c.pillar.row, Boss.x, G, { anchor: "b", w: c.pillar.w, h: c.pillar.w * 1.6, dur: c.pillar.dur || 0.8 });
        screenFlash("rgba(255,255,255,0.8)", D.kind === "phase" ? 0.5 : 0.35, 0.5);
        addTrauma(D.kind === "phase" ? 0.8 : 0.45); triggerHitstopMs(D.kind === "phase" ? 100 : 60);
        hapticBuzz(D.kind === "phase" ? [60, 40, 120] : [30, 20, 60]);
        if (c.title) showBanner(c.title[0], c.title[1], 1500, c.title[2]);
        if (c.name) bossNameCard(st);
      }
      function dirUpdate(dt) {
        const D = Game.dir; if (!D) return;
        const c = D.c; D.t += dt;
        Boss._cineImg = dirPoseAt(c, D.t);
        if (!D.aura && c.aura && D.t >= (c.aura.at || 0) && fxReady(c.aura.sheet)) {
          D.aura = true; const A = c.aura, dy = A.dy || 0;
          spawnFx(A.sheet, A.row, Boss.x, Boss.y + dy, { anchor: A.anchor || "b", w: A.w, dur: Math.max(0.5, c.dur - D.t + 0.2), loop: true, fps: A.fps || 10, follow: () => ({ x: Boss.x, y: Boss.y + dy }) });
        }
        if (!D.burst && D.t >= c.burstAt) dirBurst(D);
        if (D.push > 0) { /* 衝擊波把靠太近的玩家推開 */
          D.push -= dt; const dx = Player.x - Boss.x;
          if (Math.abs(dx) < 330) Player.x = Math.max(60, Math.min(Config.worldWidth - 60, Player.x + (dx >= 0 ? 1 : -1) * 700 * dt));
        }
        const up = Math.min(1, D.t / c.burstAt), down = D.burst ? Math.max(0, 1 - (D.t - c.burstAt) / Math.max(0.2, c.dur - c.burstAt)) : 1;
        D.a = (c.tintA || 0.4) * up * down;
        updateHitParticles(dt); /* 內含 updateFx */
        if (D.t >= c.dur) dirEnd(D);
      }
      function dirEnd(D) {
        Game.dir = null; Boss._cineImg = null;
        Music.duckUntil = 0; Music.duckLvl = 1;
        if (["staggered", "frozen", "hurt", "recover", "grounded"].includes(Boss.state)) { Boss.state = "idle"; Boss.stateTimer = 0; Boss.frozenTimer = 0; }
        Boss.aiCooldown = Math.max(Boss.aiCooldown || 0, 0.7);
        Game.introT = D.kind === "intro" ? 0.35 : 0.3; /* 登場：結束後才跳開場對話 */
        Player.invulnTimer = Math.max(Player.invulnTimer, 1.2);
        Progress.battleStartTime = performance.now();
      }
      function drawDirOverlay(w, h) {
        const D = Game.dir; if (!D || D.a < 0.01) return;
        const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.95);
        g.addColorStop(0, `rgba(${D.c.tint},0)`); g.addColorStop(1, `rgba(${D.c.tint},${D.a})`);
        ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
      }
