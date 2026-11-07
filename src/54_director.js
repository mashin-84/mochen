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
        if (c.kind === "assist") { assistStep(D, dt); return; } /* v0.8.115 玄天珠演出：世界暫停（不更新特效／粒子） */
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
