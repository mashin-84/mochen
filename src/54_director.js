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
      if (Stages[1]) Stages[1].fxSheets = (Stages[1].fxSheets || []).concat(["land", "ult", "boss2", "dir1"]); /* 階段轉換用的衝擊波環、光柱、氣焰 */
      DIR_CFG[1].p2Aura = { sheet: "dir1", row: 0, w: 330, fps: 9, dy: 6, alpha: 0.85 }; /* 二階段全程紅焰（跟著 Boss，隨放大倍率） */
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
        Boss._cineImg = dirPoseAt(c, 0);
        Game.introT = 0; Boss.isPerilous = false;
        Music.duck(0.12, (c.burstAt || c.zoomAt) + 0.3);
        if (kind === "phase") { screenFlash("rgba(255,255,255,0.7)", 0.6, 0.4); triggerHitstopMs(90); addTrauma(0.35); hapticBuzz([40, 30, 80]); }
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
        if (c.ring && fxReady(c.ring.sheet)) spawnFx(c.ring.sheet, c.ring.row, Boss.x, G - 8, { anchor: "b", w: c.ring.w, h: c.ring.w * 0.4, dur: c.ring.dur || 0.7 });
        if (c.pillar && fxReady(c.pillar.sheet)) spawnFx(c.pillar.sheet, c.pillar.row, Boss.x, G, { anchor: "b", w: c.pillar.w, h: c.pillar.w * 1.6, dur: c.pillar.dur || 0.8 });
        screenFlash("rgba(255,255,255,0.8)", D.kind === "phase" ? 0.5 : 0.35, 0.5);
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
        if (c.kind === "drop") { dropStep(D, dt); if (!D.freeze) updateHitParticles(dt); if (D.t >= c.dur) dirEnd(D); return; }
        Boss._cineImg = dirPoseAt(c, D.t);
        if (!D.aura && c.aura && D.t >= (c.aura.at || 0) && fxReady(c.aura.sheet)) {
          D.aura = true; const A = c.aura, dy = A.dy || 0;
          spawnFx(A.sheet, A.row, Boss.x, Boss.y + dy, { anchor: A.anchor || "b", w: A.w, dur: Math.max(0.5, c.dur - D.t + 0.2), loop: true, fps: A.fps || 10, follow: () => ({ x: Boss.x, y: Boss.y + dy }) });
        }
        if (!D.gather && c.gather && D.t >= (c.gather.at || 0) && fxReady(c.gather.sheet)) { /* 蓄勢：光點向 Boss 匯聚（整段蓄勢時間播完 4 格） */
          D.gather = true; const g = c.gather, gy = g.dy || -100;
          spawnFx(g.sheet, g.row, Boss.x, Boss.y + gy, { anchor: "c", w: g.w, dur: Math.max(0.4, c.burstAt - D.t), follow: () => ({ x: Boss.x, y: Boss.y + gy }) });
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
      function dirEnd(D) {
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
