      /* =========================================================================
       * v0.8.160 招牌大招（演出型）引擎：Stages[n].moves.X.ult = "種類"
       *   triggerBossMove 遇到 ult 招 → ultStart；updateBossAI 開頭 ultUpdate 接管（回傳 true 就不跑一般 AI）；
       *   繪製：drawUltWorld（壓暗聚焦＋火牆，畫在 Boss 之前）、drawUltTop（主角腳下的招架光圈，畫在最上層）；
       *   鏡頭：Game.ultCam（拉近量）＋ Game.ultFocus（焦點偏向 Boss），由 updateCamera 讀。
       * 第 1 關「血煞焚岳戟」（ult:"b1fire"，使用者 2026-11-10 定案設計卡，見 HANDOFF 第〇節）：
       *   舉戟蓄勢 0.9 秒（拉近、壓暗、戟焰閃爍）→ 插地（拉回）→ 地火三波（左右矮火牆，招架／跳／瞬步都可躲）
       *   → 抱胸蓄力 1.0 秒（再拉近、紅光聚集）→ 仰天長嘯放高火牆（只有瞬步能穿過）→ 跪地喘息 3 秒（破綻、傷害減半）→ 拔戟回戰鬥。
       * Boss 圖：assets/boss1/61_u_raise～68_u_pull；特效：assets/fx/boss1ult（0 戟焰／1 插地爆裂／2 矮火牆／3 高火牆）、
       *   boss1ult2（0 紅光聚集／1 長嘯衝擊環／2 火牆竄起／3 喘息熱氣）。
       * ========================================================================= */
      const ULT_CFG = {
        b1fire: {
          t: { pause: 0.45, stab: 0.9, w1: 1.05, gap: 0.9, cross: 3.3, roar: 4.3, rest: 5.0, restDur: 3.0, pull: 0.35 }, /* gap 0.9：跳一次滯空約 0.72 秒，落地後要來得及應付下一波（設計卡原 0.6，實測連跳必中） */
          low: { dmg: 120, speed: 820, h: 60, depth: 150, draw: 280, post: 12 },   /* dmg 為基礎值，會乘 BOSS_DMG_K（1.25）＝150 */
          big: { dmg: 304, speed: 950, depth: 170, draw: 430 },                      /* 304×1.25＝380 */
          stabDx: 170,                                                              /* 戟刃插地點：圖上腳底右方 170px（乘 bossK） */
          img: { raise: "61_u_raise", pause: "62_u_pause", stab: "63_u_stab", cross: "65_u_cross", roar: "66_u_roar", rest: "67_u_rest", pull: "68_u_pull" }
        }
      };
      const Ult = { waves: [] };
      function ultViewTop() { const z = Game.camera.zoom || 1; return Config.baseHeight * 0.5 - Config.baseHeight * 0.5 / z + (Game.camera.y || 0); } /* 畫面最上緣的世界 y（高火牆要頂到這裡） */
      function ultK() { return bossVis(Stages[Boss.stageId]).k; }
      function ultPt(px, py) { const k = ultK(); return { x: Boss.x + Boss.facing * (px - 450) * k, y: Boss.y + GROUND_SINK + (py - 560) * k }; } /* 圖上座標（900×600、圖朝右）→ 世界座標 */
      function ultStart(m, key) {
        const c = ULT_CFG[m.ult]; if (!c) return false;
        Boss.facing = Player.x >= Boss.x ? 1 : -1;
        Boss.moveType = key; Boss.state = "ult"; Boss.vx = 0; Boss.isPerilous = false; Boss.perilType = null;
        Boss.nextImpactIn = 999; Boss.consecutiveBlocks = 0;
        Boss._ult = { kind: m.ult, c, m, t: 0, ev: {}, wN: 0 }; Boss._ultRest = false; Boss._ultFrame = c.img.raise;
        Ult.waves.length = 0;
        showBanner(String(m.name).replace(/\s*[（(].*[）)]\s*/, ""), "大　招", 1300, "#fca5a5");
        Sound.play("peril", 1.0, 0.7); hapticBuzz([30, 40, 60]);
        return true;
      }
      function ultEnd(cancel) {
        const U = Boss._ult; Boss._ult = null; Boss._ultRest = false; Boss._ultFrame = null; Boss._ucd = 0; Boss._ultCue = null;
        Game.ultCam = 0; Game.ultFocus = false;
        if (cancel) { Ult.waves.length = 0; return; }
        Boss.state = "idle"; Boss.stateTimer = 0; Boss.moveType = null; Boss.aiCooldown = 0.5;
        if (U && U.m) Boss.ultCd = 18;
      }
      /* 每幀：updateBossAI 開頭呼叫；回傳 true＝本幀 Boss 由大招接管 */
      function ultUpdate(dt) {
        ultWavesTick(dt);
        const U = Boss._ult; if (!U) return false;
        if (Boss.state === "staggered" || Boss.hp <= 0 || Game.bossDeath || Game.mode !== "battle") { ultEnd(true); return false; } /* 被打破防（招架火牆累積架勢）＝大招中斷 */
        const c = U.c, T = c.t, once = (k) => (U.ev[k] ? false : (U.ev[k] = true));
        U.t += dt; const t = U.t; Boss.vx = 0; Boss.nextImpactIn = 999;
        const k = ultK(), fc = Boss.facing, G = Config.groundY;
        /* ① 舉戟蓄勢：拉近、壓暗聚焦、戟身火焰閃爍 */
        if (t < T.stab) {
          Boss.state = "ult"; Boss._ultFrame = t < T.pause ? c.img.raise : c.img.pause;
          Game.ultCam = 0.2; Game.ultFocus = true; Boss._ucd = Math.min(1, (Boss._ucd || 0) + dt * 3); Boss._ucdPos = ultPt(450, 230);
          if (once("flame")) { const p = ultPt(450, 120); if (fxReady("boss1ult")) spawnFx("boss1ult", 0, p.x, p.y, { w: 220, h: 220, dur: T.stab, loop: true, fps: 10, alpha: 0.95, follow: () => ultPt(450, 120) }); Sound.play("b3_charge", 0.8, 0.85); }
          return true;
        }
        /* ② 插地：爆裂、震屏、震動、鏡頭拉回（放波時看得到主角與火牆） */
        if (once("stab")) {
          Boss._ultFrame = c.img.stab; Game.ultCam = -0.04; Game.ultFocus = false;
          const sx = Boss.x + fc * c.stabDx * k;
          if (fxReady("boss1ult")) spawnFx("boss1ult", 1, sx, groundFxY("boss1ult", 1, 420), { anchor: "b", w: 420, h: 420, dur: 0.5 });
          Sound.play("b3_plunge", 1.0, 0.85); triggerShake(0, 0.5, 30, 0.4); hapticBuzz([40, 20, 60]); triggerHitstopMs(60);
        }
        if (t < T.cross) {
          Boss._ultFrame = c.img.stab; Boss._ucd = Math.max(0, (Boss._ucd || 0) - dt * 4);
          /* ③ 地火三波：每波左右各一道矮火牆 */
          if (U.wN < 3 && t >= T.w1 + U.wN * T.gap - 0.25 && once("pre" + U.wN) && fxReady("boss1ult")) spawnFx("boss1ult", 1, Boss.x + fc * c.stabDx * k, groundFxY("boss1ult", 1, 200), { anchor: "b", w: 200, h: 200, dur: 0.25, c0: 0, nf: 1 }); /* 放波前 0.25 秒插地點先閃 */
          if (t >= 1.6 && once("hint")) hintOnce("ult1", "大招：地上的矮火牆可以招架、跳過或瞬步；最後的高火牆只能【瞬步】穿過！"); /* 等大招名橫幅（1.3 秒）消失再出提示，避免疊字 */
          while (U.wN < 3 && t >= T.w1 + U.wN * T.gap) {
            U.wN++; const sx = Boss.x + fc * c.stabDx * k;
            Ult.waves.push({ big: false, x: sx, dir: 1, done: false }, { big: false, x: sx, dir: -1, done: false });
            Sound.play("b3_low", 0.9, 0.9 + U.wN * 0.04); triggerShake(0, 0.25, 10, 0.18); hapticBuzz(18);
          }
          return true;
        }
        /* ④ 抱胸蓄力：插地爆焰蓋過換格（戟從刃朝下變刃朝上），再拉近、紅光向胸口聚集 */
        if (t < T.roar) {
          if (once("cross")) {
            if (fxReady("boss1ult")) { const sx = Boss.x + fc * c.stabDx * k; spawnFx("boss1ult", 1, sx, groundFxY("boss1ult", 1, 300), { anchor: "b", w: 300, h: 300, dur: 0.4, c0: 1, nf: 3 }); }
            Boss.flashFrames = 3; Sound.play("b3_seal", 0.7, 0.8);
            const p = ultPt(450, 260); if (fxReady("boss1ult2")) spawnFx("boss1ult2", 0, p.x, p.y, { w: 520, h: 520, dur: T.roar - T.cross, alpha: 0.95, follow: () => ultPt(450, 260) });
          }
          Boss._ultFrame = c.img.cross; Game.ultCam = 0.24; Game.ultFocus = true;
          Boss._ucd = Math.min(1, (Boss._ucd || 0) + dt * 2.5); Boss._ucdPos = ultPt(450, 260);
          return true;
        }
        /* ⑤ 仰天長嘯：衝擊環＋左右高火牆（只能瞬步） */
        if (once("roar")) {
          Boss._ultCue = null; Boss._ultFrame = c.img.roar; Game.ultCam = -0.06; Game.ultFocus = false; Boss._ucd = 0.6;
          const hp = ultPt(445, 170);
          if (fxReady("boss1ult2")) { spawnFx("boss1ult2", 1, hp.x, hp.y, { w: 640, h: 640, dur: 0.55 }); spawnFx("boss1ult2", 2, Boss.x, groundFxY("boss1ult2", 2, 0), { anchor: "b", w: 900, h: (G + 6) - ultViewTop() + 260, dur: 0.6 }); } /* 竄起火牆直接頂到畫面上緣 */
          Sound.play("m_roar", 1.0, 0.8); Sound.play("b3_heavy", 0.9, 0.7);
          triggerShake(0, 0.7, 40, 0.6); hapticBuzz([60, 30, 90]); triggerHitstopMs(80);
          Ult.waves.push({ big: true, x: Boss.x, dir: 1, done: false }, { big: true, x: Boss.x, dir: -1, done: false });
        }
        if (t < T.rest) { Boss._ultFrame = c.img.roar; Boss._ucd = Math.max(0, (Boss._ucd || 0) - dt * 2); return true; }
        /* ⑥ 跪地喘息：破綻窗口（state=recover），窗口內傷害減半（51_physics 讀 Boss._ultRest） */
        if (t < T.rest + T.restDur) {
          if (once("rest")) { const p = ultPt(510, 200); if (fxReady("boss1ult2")) spawnFx("boss1ult2", 3, p.x, p.y, { w: 200, h: 200, dur: T.restDur, loop: true, fps: 5, alpha: 0.8, facing: fc, follow: () => ultPt(510, 200) }); hintOnce("ult1rest", "神衛力竭喘息：趁機反擊！（大招後的破綻傷害減半）"); }
          Boss.state = "recover"; Boss._ultRest = true; Boss._ultFrame = c.img.rest; Boss.stateTimer = T.rest + T.restDur - t; Boss.stateDur = T.restDur;
          return true;
        }
        /* ⑦ 拔戟回到戰鬥 */
        if (t < T.rest + T.restDur + T.pull) { Boss.state = "recover"; Boss._ultRest = false; Boss._ultFrame = c.img.pull; return true; }
        ultEnd(false);
        return true;
      }
      /* 火牆移動與判定（大招結束後已放出的火牆仍會飛完） */
      function ultWavesTick(dt) {
        const W = Ult.waves; if (!W.length) return;
        const G = Config.groundY, U = Boss._ult, c = (U && U.c) || ULT_CFG.b1fire;
        if (W.some(w => w.big && Math.abs(w.x - Player.x) < 1400)) { /* v0.8.161 高火牆移動中：畫面持續震、手機低強度震動 */
          Ult._rum = (Ult._rum || 0) - dt; if (Ult._rum <= 0) { Ult._rum = 0.12; triggerShake(0, 0.3, 9, 0.14); }
          Ult._hap = (Ult._hap || 0) - dt; if (Ult._hap <= 0) { Ult._hap = 0.22; hapticBuzz(26); }
        }
        for (let i = W.length - 1; i >= 0; i--) {
          const w = W[i], cfg = w.big ? c.big : c.low;
          w.x += w.dir * cfg.speed * dt;
          if (Math.abs(w.x - Boss.x) > 2600 || w.x < -400 || w.x > Config.worldWidth + 400) { W.splice(i, 1); continue; }
          if (w.done) continue;
          /* 火牆前緣 w.x，往後 depth 都是火；主角在火裡（且矮火牆時腳在火焰高度內）就結算一次 */
          const rel = (Player.x - w.x) * w.dir; /* >0 主角在前方未到；<0 已在火裡或身後 */
          if (rel > 10 || rel < -cfg.depth) continue; /* 判定比圖寬容：前緣碰到主角中心才算；矮火牆離地 60px 以上就算跳過（圖約 90px 高） */
          if (Player.state === "execution") { w.done = true; continue; }
          if (!w.big && Player.y < G - cfg.h) continue; /* 跳過矮火牆 */
          w.done = true;
          ultWaveHit(w, cfg);
        }
      }
      function ultWaveHit(w, cfg) {
        const dir = w.dir;
        if (w.big) {
          if (Player.invulnTimer > 0) { perfectDodgeFx("【瞬步穿火】", 10); spawnFloatingText(Player.x, Player.y - 120, "穿過高火牆！", "#7dd3fc", 1.15); return; }
          takeDamage(bossDmg(cfg.dmg), dir, "【焚岳火牆】");
          return;
        }
        /* 矮火牆：走一般格擋判定（瞬步無敵、完美招架、普通格擋、受擊），Boss 暫時當成在火牆位置 */
        const sx = Boss.x, sp = Boss.isPerilous, st = Boss.perilType, svx = Boss.vx;
        Boss.x = w.x - dir * 60; Boss.isPerilous = false; Boss.perilType = null;
        const hp0 = Player.hp;
        resolveBossStrike({ damage: cfg.dmg, parryPostureDmg: cfg.post });
        Boss.x = sx; Boss.isPerilous = sp; Boss.perilType = st; Boss.vx = svx;
        if (Player.hp === hp0 && Player.state === "parry") { w.cut = true; if (fxReady("boss1ult")) spawnFx("boss1ult", 1, Player.x + dir * 30, groundFxY("boss1ult", 1, 160), { anchor: "b", w: 160, h: 160, dur: 0.3, c0: 2, nf: 2 }); } /* 招架斬斷火牆 */
      }
      /* 繪製：壓暗聚焦（世界座標，畫在 Boss 之前）＋火牆 */
      function drawUltWorld() {
        if ((Boss._ucd || 0) > 0.01 && Boss._ucdPos) {
          const op = Boss._ucdPos, g = ctx.createRadialGradient(op.x, op.y, 110, op.x, op.y, 460);
          g.addColorStop(0, "rgba(24,0,6,0)"); g.addColorStop(1, `rgba(16,0,4,${0.78 * Boss._ucd})`);
          ctx.save(); ctx.fillStyle = g; ctx.fillRect(Game.camera.x - 1600, -1600, Config.baseWidth + 3200, 4200); ctx.restore();
        }
        const W = Ult.waves; if (!W.length || !fxReady("boss1ult")) return;
        const img = fxSheet("boss1ult").img, G = Config.groundY, c = ULT_CFG.b1fire, now = performance.now();
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const w of W) {
          if (w.cut) continue;
          const cfg = w.big ? c.big : c.low, row = w.big ? 3 : 2, S = cfg.draw, col = Math.floor(now / 70 + (w.dir > 0 ? 0 : 2)) % 4;
          const Hb = w.big ? (G + GROUND_SINK) - ultViewTop() + 260 : S; /* v0.8.162 高火牆再往上延伸（頂出畫面）；腳底對齊扣掉圖裡留白 */
          ctx.save(); ctx.translate(w.x, groundFxY("boss1ult", row, Hb)); ctx.scale(w.dir, 1);
          if (w.big) { /* v0.8.161 高火牆＝滿屏；v0.8.162 加寬加厚（寬 620→1000、四層火焰），判定不變 */
            const Hh = Hb, Wd = 1000;
            ctx.globalCompositeOperation = "source-over"; /* 先墊深紅實色火牆身體（亮背景上疊加發光會變淡粉霧，壓不住） */
            const gb = ctx.createLinearGradient(-Wd * 1.7, 0, 30, 0);
            gb.addColorStop(0, "rgba(90,0,18,0)"); gb.addColorStop(0.25, "rgba(110,4,24,0.62)"); gb.addColorStop(0.8, "rgba(175,14,34,0.85)"); gb.addColorStop(1, "rgba(210,40,50,0)");
            ctx.fillStyle = gb; ctx.fillRect(-Wd * 1.7, -Hh, Wd * 1.7 + 30, Hh);
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.75; ctx.drawImage(img, ((col + 2) % 4) * 256, row * 256, 256, 256, -Wd * 1.25, -Hh, Wd, Hh);
            ctx.globalAlpha = 1; ctx.drawImage(img, col * 256, row * 256, 256, 256, -Wd * 0.92, -Hh, Wd, Hh);
            ctx.globalAlpha = 0.6; ctx.drawImage(img, ((col + 1) % 4) * 256, row * 256, 256, 256, -Wd * 0.8, -Hh, Wd * 0.85, Hh); /* 再疊一層讓火焰飽和 */
            ctx.globalAlpha = 0.55; ctx.drawImage(img, ((col + 3) % 4) * 256, row * 256, 256, 256, -Wd * 1.6, -Hh, Wd * 0.9, Hh); /* 尾段再一層：火牆更厚 */
            const gl = ctx.createLinearGradient(-90, 0, 120, 0); gl.addColorStop(0, "rgba(255,120,140,0)"); gl.addColorStop(0.6, "rgba(255,170,150,0.55)"); gl.addColorStop(1, "rgba(255,80,110,0)");
            ctx.fillStyle = gl; ctx.fillRect(-90, -Hh, 210, Hh);
          } else {
            ctx.globalAlpha = 0.95;
            ctx.drawImage(img, col * 256, row * 256, 256, 256, -S * 0.92, -S, S, S); /* 圖中火牆前緣約在格寬 92% 處 → 對到 w.x */
          }
          ctx.restore();
        }
        ctx.restore();
      }
      /* 招架光圈：矮火牆／高火牆到主角前 0.35 秒在主角身上收縮（同 cue.webp：黃＝可擋、紅＝只能瞬步）；長嘯前在 Boss 身上 */
      function drawUltTop() {
        { /* v0.8.161 高火牆逼近：全畫面泛紅（越近越紅），壓迫感 */
          let near = 0;
          for (const w of Ult.waves) if (w.big) { const d = (Player.x - w.x) * w.dir; near = Math.max(near, d > 0 ? Math.max(0, 1 - d / 900) : Math.max(0, 1 + d / 500)); }
          if (near > 0.01) { const z = Game.camera.zoom || 1, top = ultViewTop() - 50, hh = Config.baseHeight / z + 100; ctx.save(); ctx.fillStyle = `rgba(150,10,30,${0.32 * near})`; ctx.fillRect(Game.camera.x - 1200, top, Config.baseWidth / z + 2400, hh); ctx.restore(); }
        }
        if (!fxReady("cue") || Config.parryCueLevel <= 0) return;
        const img = fxSheet("cue").img, c = ULT_CFG.b1fire;
        const ring = (x, y, tLeft, big) => {
          if (tLeft <= 0 || tLeft > 0.35) return;
          const pr = 1 - tLeft / 0.35, dia = 240 - 180 * pr, col = tLeft <= 0.05 ? 3 : (pr < 0.35 ? 0 : pr < 0.7 ? 1 : 2), fr = [0.9, 0.7, 0.35, 0.9][col], cs = col === 3 ? 260 : dia / fr;
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 + 0.5 * pr;
          ctx.drawImage(img, col * 256, (big ? 1 : 0) * 256, 256, 256, x - cs / 2, y - cs / 2, cs, cs); ctx.restore();
        };
        let best = null;
        const U = Boss._ult;
        if (U && U.c === c) { /* 還沒放出的火牆：倒數＝距放出時間＋飛到主角的時間（站在插地點旁也一定有 0.35 秒預警） */
          const T = c.t, k = ultK(), sx = Boss.x + Boss.facing * c.stabDx * k;
          if (U.wN < 3) best = { tl: T.w1 + U.wN * T.gap - U.t + Math.abs(Player.x - sx) / c.low.speed, big: false };
          else if (!U.ev.roar) best = { tl: T.roar - U.t + Math.abs(Player.x - Boss.x) / c.big.speed, big: true };
        }
        for (const w of Ult.waves) {
          if (w.done) continue;
          const cfg = w.big ? c.big : c.low, d = (Player.x - w.x) * w.dir; if (d < 0) continue;
          const tl = d / cfg.speed; if (!best || tl < best.tl) best = { tl, big: w.big };
        }
        if (best) ring(Player.x, Player.y - 70, best.tl, best.big);
      }
