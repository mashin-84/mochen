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
        },
        /* v0.8.165 第 2 關「羅天萬劍」：長老整段浮空（離地 lift）；劍雨三輪 → 聚劍成巨劍 → 巨劍從空中斜下刺主角：
         *   完美招架（窗口 win）＝折射：巨劍沿原路倒飛回去 → 長老被擊中摔落、破防；瞬步＝安全；沒擋／普通格擋＝重傷。 */
        b2sword: {
          t: { summon: 0.6, rain1: 1.2, gap: 1.0, warn: 0.6, fall: 0.25, gather: 4.2, launch: 5.4, fly: 0.8, clash: 2.0, back: 0.35, drop: 0.35, descend: 0.6, restDur: 2.5, rec: 0.35 }, /* v0.8.166 fly 0.35→0.8（三次方加速）、完美招架後角力 clash 2 秒 */
          lift: 260,
          rain: { dmg: 120, r: 60 },                                   /* 每把 120×1.25＝150；判定半徑 60（紅圈畫得比判定大） */
          giant: { dmg: 320, block: 160, win: 220, r: 210, S: 2000 },  /* 400／普通格擋 200；完美窗口放寬 220ms；巨劍畫 2000px（v0.8.166 由 1400 加大） */
          img: { rise: "61_u_rise", summon: "62_u_summon", rain: "63_u_rain", gather: "64_u_gather", launch: "65_u_launch", struck: "66_u_struck", rest: "67_u_rest", rec: "68_u_recover" }
        }
      };
      const Ult = { waves: [], rain: [] };
      function ultViewTop() { const z = Game.camera.zoom || 1; return Config.baseHeight * 0.5 - Config.baseHeight * 0.5 / z + (Game.camera.y || 0); } /* 畫面最上緣的世界 y（高火牆要頂到這裡） */
      function ultK() { return bossVis(Stages[Boss.stageId]).k; }
      function ultPt(px, py) { const k = ultK(); return { x: Boss.x + Boss.facing * (px - 450) * k, y: Boss.y + GROUND_SINK + (py - 560) * k }; } /* 圖上座標（900×600、圖朝右）→ 世界座標 */
      function ultStart(m, key) {
        const c = ULT_CFG[m.ult]; if (!c) return false;
        Boss.facing = Player.x >= Boss.x ? 1 : -1;
        Boss.moveType = key; Boss.state = "ult"; Boss.vx = 0; Boss.isPerilous = false; Boss.perilType = null;
        Boss.nextImpactIn = 999; Boss.consecutiveBlocks = 0;
        Boss._ult = { kind: m.ult, c, m, t: 0, ev: {}, wN: 0 }; Boss._ultRest = false; Boss._ultFrame = c.img.raise || c.img.rise;
        Ult.waves.length = 0;
        showBanner(String(m.name).replace(/\s*[（(].*[）)]\s*/, ""), "大　招", 1300, "#fca5a5");
        Sound.play("peril", 1.0, 0.7); hapticBuzz([30, 40, 60]);
        return true;
      }
      function ultEnd(cancel) {
        const U = Boss._ult; Boss._ult = null; Boss._ultRest = false; Boss._ultFrame = null; Boss._ucd = 0; Boss._ultCue = null;
        Game.ultCam = 0; Game.ultFocus = false; Game.ultCamY = 0; Game.ultLock = false;
        if (Boss._ultAir || (U && U.lift)) { Boss.y = Config.groundY; } Boss._ultAir = false; Ult.rain.length = 0; /* 浮空中斷＝直接回地面 */
        if (cancel) { Ult.waves.length = 0; return; }
        Boss.state = "idle"; Boss.stateTimer = 0; Boss.moveType = null; Boss.aiCooldown = 0.5;
        if (U && U.m) Boss.ultCd = 18;
      }
      /* 每幀：updateBossAI 開頭呼叫；回傳 true＝本幀 Boss 由大招接管 */
      function ultUpdate(dt) {
        ultWavesTick(dt);
        if (ultTestTick(dt)) return true; /* v0.8.163 大招測試倒數 */
        const U = Boss._ult; if (!U) return false;
        if (Boss.state === "staggered" || Boss.hp <= 0 || Game.bossDeath || Game.mode !== "battle") { ultEnd(true); return false; } /* 被打破防（招架火牆累積架勢）＝大招中斷 */
        if (U.kind === "b2sword") return ultB2(U, dt);
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
      /* ---------- 第 2 關「羅天萬劍」 ---------- */
      function ultB2(U, dt) {
        const c = U.c, T = c.t, G = Config.groundY, fc = Boss.facing, once = (k) => (U.ev[k] ? false : (U.ev[k] = true));
        U.t += dt; const t = U.t; Boss.vx = 0; Boss.nextImpactIn = 999;
        const setLift = (v) => { U.lift = v; Boss.y = G - v; Boss._ultAir = v > 40; };
        const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
        ultB2Rain(U, t);
        Game.ultCamY = (U.lift || 0) > 40 ? -150 : 0; if (!Game.ultFocus || Game.ultFocus === true && t < U.c.t.gather) Game.ultFocus = 0.5; /* 浮空：鏡頭往上抬、焦點放兩人中間 */
        if (!U.res) {
          if (once("dispel") && illusionsAlive()) illusionDispelAll("〔分身歸元〕"); /* 分身散去：畫面上只留放大招的真身 */
          if (t < T.summon) { Boss.state = "ult"; Boss._ultFrame = c.img.rise; setLift(c.lift * ease(t / T.summon)); Game.ultCam = -0.1; if (once("rise")) Sound.play("b2_appear", 0.9, 0.9); return true; }
          setLift(c.lift + Math.sin(t * 2.4) * 8); /* 浮空微微上下 */
          if (once("halo")) { if (fxReady("boss2ult")) spawnFx("boss2ult", 0, 0, 0, { w: 720, h: 720, dur: T.launch - T.summon + 0.1, loop: true, fps: 6, alpha: 0.9, back: true, follow: () => ultPt(450, 210) }); Sound.play("b2_sword_cast", 0.9, 0.85); }
          if (t < T.gather) {
            Game.ultCam = -0.1; Boss._ucd = Math.min(0.35, (Boss._ucd || 0) + dt); Boss._ucdPos = ultPt(450, 260);
            Boss._ultFrame = t < T.rain1 ? c.img.summon : ((t - T.rain1) % T.gap < 0.45 ? c.img.rain : c.img.summon);
            for (let i = 0; i < 3; i++) if (t >= T.rain1 + i * T.gap && once("r" + i)) ultB2Round(U, i);
            return true;
          }
          if (t < T.launch) { /* 聚劍成巨劍：拉近、壓暗、巨劍瞄準主角 */
            Boss._ultFrame = c.img.gather; Game.ultCam = 0.15; Game.ultFocus = true;
            Boss._ucd = Math.min(0.85, (Boss._ucd || 0) + dt * 1.5); Boss._ucdPos = ultPt(560, 300);
            if (once("gather")) { const p = ultPt(640, 300); if (fxReady("boss2ult2")) spawnFx("boss2ult2", 0, p.x, p.y, { w: 640, h: 640, dur: T.launch - T.gather, alpha: 0.95, follow: () => ultPt(640, 300) }); Sound.play("b2_vortex", 0.9, 0.8); }
            U.org = ultPt(600, 300); U.tgt = { x: Player.x, y: Player.y - 70 }; U.ga = Math.min(1, (t - T.gather) / (T.launch - T.gather - 0.2));
            return true;
          }
          /* 發劍：瞬間鎖定，0.35 秒刺到 */
          if (once("launch")) { U.org = ultPt(600, 300); U.tgt = { x: Player.x, y: Player.y - 70 }; Sound.play("b2_thrust", 1.0, 0.75); Game.ultCam = 0; Game.ultFocus = 0.5; hapticBuzz(30); }
          Boss._ultFrame = c.img.launch; Boss._ucd = Math.max(0, (Boss._ucd || 0) - dt * 2);
          U.gp = Math.min(1, (t - T.launch) / T.fly);
          if (U.gp >= 1) ultB2Resolve(U);
          return true;
        }
        const rt = t - U.rt;
        if (U.res === "ref") { /* 折射：角力 2 秒 → 巨劍碎裂、劍光倒飛 → 擊中長老 → 摔落破防 */
          if (rt < T.clash) { /* v0.8.166 角力：主角舉劍頂住，劍尖一推一拉越來越激烈，火花、摩擦聲、震動持續 */
            const k = rt / T.clash, fcP = Boss.x >= Player.x ? 1 : -1;
            Boss._ultFrame = c.img.launch; Game.ultLock = true;
            Player.state = "parry"; Player.stateTimer = 0.25; Player.vx = 0; Player.facing = fcP; Player.invulnTimer = Math.max(Player.invulnTimer, 0.3);
            Player.x -= fcP * dt * 22; /* 被巨劍一點一點往後推 */
            Game.ultCam = 0.24; Game.ultFocus = 0.22; Game.ultCamY = -30; Boss._ucd = Math.min(0.7, (Boss._ucd || 0) + dt * 2); Boss._ucdPos = { x: U.tgt.x, y: U.tgt.y };
            U.jit = Math.sin(rt * (26 + 34 * k)) * (8 + 20 * k); U.ck = k;
            U.spT = (U.spT || 0) - dt; if (U.spT <= 0) { U.spT = 0.11 - 0.05 * k; if (fxReady("boss2ult2")) spawnFx("boss2ult2", 2, U.tgt.x + (Math.random() - 0.5) * 60, U.tgt.y + (Math.random() - 0.5) * 60, { w: 180 + 160 * k, h: 180 + 160 * k, dur: 0.22, c0: 1, nf: 2 }); }
            U.snT = (U.snT || 0) - dt; if (U.snT <= 0) { U.snT = 0.24 - 0.1 * k; Sound.play("block", 0.4 + 0.35 * k, 0.75 + Math.random() * 0.3); }
            U.hpT = (U.hpT || 0) - dt; if (U.hpT <= 0) { U.hpT = 0.14; hapticBuzz(Math.round(16 + 24 * k)); triggerShake(0, 0.12 + 0.25 * k, 5 + 10 * k, 0.12); }
            return true;
          }
          if (once("break")) { /* 角力結束：巨劍碎裂爆開，碎劍化成劍光倒飛回去 */
            Game.ultLock = false; Player.state = "idle"; Player.stateTimer = 0; Player.invulnTimer = Math.max(Player.invulnTimer, 0.5);
            if (fxReady("boss2ult2")) { spawnFx("boss2ult2", 3, U.tgt.x - Math.cos(U.ang) * 260, U.tgt.y - Math.sin(U.ang) * 260, { w: 1400, h: 1400, dur: 0.6, rot: U.ang }); spawnFx("boss2ult2", 2, U.tgt.x, U.tgt.y, { w: 900, h: 900, dur: 0.5 }); }
            Sound.play("b2_shatter", 1.0, 0.8); Sound.play("parry", 1.0, 0.7);
            triggerHitstopMs(130); Game.slowT = 0.35; Game.slowScale = 0.35; triggerShake(Boss.facing, 0.8, 40, 0.5); hapticBuzz([60, 20, 100]);
            Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + 0.12); Game.ultCam = 0; Game.ultFocus = 0.5;
            spawnFloatingText(Player.x, Player.y - 140, "【破劍折射】", "#fde047", 1.4);
          }
          const bt = rt - T.clash;
          if (bt < T.back) { U.bp = bt / T.back; Boss._ucd = Math.max(0, (Boss._ucd || 0) - dt * 3); return true; }
          if (once("hitBoss")) {
            const p = ultPt(450, 300);
            if (fxReady("boss2ult2")) { spawnFx("boss2ult2", 3, p.x, p.y, { w: 820, h: 820, dur: 0.6, rot: U.ang + Math.PI }); spawnFx("boss2ult2", 2, p.x, p.y, { w: 560, h: 560, dur: 0.45 }); }
            Sound.play("b2_shatter", 1.0, 0.85); triggerShake(fc, 0.6, 34, 0.45); hapticBuzz([50, 30, 80]); triggerHitstopMs(90); Boss.flashFrames = 5;
            spawnFloatingText(Boss.x, Boss.y - 200, "【折射】巨劍反噬！", "#a7f3d0", 1.3);
          }
          Boss._ultFrame = c.img.struck;
          const dp = (rt - T.clash - T.back) / T.drop;
          if (dp < 1) { setLift(U.liftAtRef * (1 - dp * dp)); return true; }
          setLift(0); Boss.y = G; Boss._ultAir = false;
          if (fxReady("land")) spawnFx("land", 1, Boss.x, groundFxY("land", 1, 420), { anchor: "b", w: 420, dur: 0.7 });
          triggerShake(0, 0.5, 22, 0.3);
          damageBossPosture(9999, null); /* 架勢打滿＝破防（下一幀 ultUpdate 看到 staggered 會收尾） */
          return true;
        }
        /* 沒有折射：巨劍插地 → 碎裂；長老緩緩落地喘息 */
        if (rt > 0.45 && once("shatterG")) { const m = ultB2Mid(U, 1); if (fxReady("boss2ult2")) spawnFx("boss2ult2", 3, m.x, m.y, { w: 900, h: 900, dur: 0.6, rot: U.ang }); Sound.play("b2_shatter", 0.8, 1.0); U.gone = true; }
        if (rt < 0.3) { Boss._ultFrame = c.img.launch; return true; }
        if (rt < 0.3 + T.descend) { Boss._ultFrame = c.img.rise; setLift(U.liftAtRef * (1 - ease((rt - 0.3) / T.descend))); return true; }
        if (once("land")) { setLift(0); Boss.y = G; Boss._ultAir = false; hintOnce("ult2rest", "長老力竭落地：趁機反擊！（大招後的破綻傷害減半）"); }
        if (rt < 0.3 + T.descend + T.restDur) { Boss.state = "recover"; Boss._ultRest = true; Boss._ultFrame = c.img.rest; Boss.stateTimer = 0.3 + T.descend + T.restDur - rt; Boss.stateDur = T.restDur; return true; }
        if (rt < 0.3 + T.descend + T.restDur + T.rec) { Boss.state = "recover"; Boss._ultRest = false; Boss._ultFrame = c.img.rec; return true; }
        ultEnd(false);
        return true;
      }
      /* 劍雨：第 i 輪的落點（0 隨機、1 圍著主角、2 一整列留一個缺口＝要找缺口或瞬步穿過） */
      function ultB2Round(U, i) {
        const T = U.c.t, px = Player.x, xs = [];
        if (i === 0) { for (let k = 0; k < 5; k++) { let x, tries = 0; do { x = px + (Math.random() * 2 - 1) * 520; tries++; } while (tries < 20 && xs.some(v => Math.abs(v - x) < 160)); xs.push(x); } }
        else if (i === 1) xs.push(px - 480, px - 240, px, px + 240, px + 480);
        else { const gap = 1 + Math.floor(Math.random() * 6); for (let k = 0; k < 8; k++) if (k !== gap) xs.push(px - 455 + k * 130); }
        const t0 = T.rain1 + i * T.gap, G = Config.groundY;
        xs.forEach((x, k) => {
          x = Math.max(80, Math.min(Config.worldWidth - 80, x));
          const tf = t0 + T.warn + (i === 2 ? k * 0.05 : 0);
          Ult.rain.push({ x, tf, done: false });
          if (fxReady("boss2ult")) spawnFx("boss2ult", 3, x, groundFxY("boss2ult", 3, 280), { anchor: "b", w: 280, h: 280, dur: tf - (U.t), loop: true, fps: 8, alpha: 0.95 });
        });
        Boss._ultFrame = U.c.img.rain; Sound.play("b2_sword_cast", 0.7, 1.0 + i * 0.06);
      }
      function ultB2Rain(U, t) {
        const R = Ult.rain, c = U.c; if (!R.length) return;
        for (let i = R.length - 1; i >= 0; i--) {
          const s = R[i];
          if (!s.done && t >= s.tf) {
            s.done = true;
            if (fxReady("boss2ult")) spawnFx("boss2ult", 2, s.x, groundFxY("boss2ult", 2, 300), { anchor: "b", w: 300, h: 300, dur: 0.5 });
            Sound.play("b2_shard_hit", 0.6, 0.9 + Math.random() * 0.2); triggerShake(0, 0.15, 6, 0.1);
            if (Math.abs(Player.x - s.x) < c.rain.r && Player.state !== "execution") {
              if (Player.invulnTimer > 0) perfectDodgeFx("【完美閃避】", 4); else takeDamage(bossDmg(c.rain.dmg), Player.x >= s.x ? 1 : -1, "【萬劍落】");
            }
          }
          if (s.done && t > s.tf + 0.05) R.splice(i, 1);
        }
      }
      function ultB2Tip(U) { /* 巨劍劍尖目前位置 */
        const dx = U.tgt.x - U.org.x, dy = U.tgt.y - U.org.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
        const st = { x: U.org.x + ux * 260, y: U.org.y + uy * 260 }, p = U.gp == null ? 0 : U.gp * U.gp * U.gp; /* v0.8.166 三次方：剛離手慢、一路加速 */
        return { x: st.x + (U.tgt.x - st.x) * p, y: st.y + (U.tgt.y - st.y) * p };
      }
      function ultB2Mid(U, f) { const tip = U.res ? U.tgt : ultB2Tip(U), S = U.c.giant.S; return { x: tip.x - Math.cos(U.ang) * S * 0.465 * f, y: tip.y - Math.sin(U.ang) * S * 0.465 * f }; }
      function ultB2Resolve(U) {
        const c = U.c, g = c.giant, G = Config.groundY;
        U.rt = U.t; U.liftAtRef = U.lift || c.lift;
        const near = Math.abs(Player.x - U.tgt.x) < g.r && Player.state !== "execution";
        const el = performance.now() - (Player.parryStartMs || 0);
        if (near && Player.state === "parry" && el <= g.win) { /* 完美招架＝折射 */
          U.res = "ref";
          if (fxReady("boss2ult2")) spawnFx("boss2ult2", 2, U.tgt.x, U.tgt.y, { w: 620, h: 620, dur: 0.5 });
          Sound.play("parry", 1.0, 0.8); Sound.play("b2_shard_hit", 1.0, 0.7);
          triggerHitstopMs(120); triggerShake(-Player.facing, 0.4, 26, 0.3); hapticBuzz([40, 20, 70]);
          Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + 0.1);
          Player.stamina = Math.min(Player.maxStamina, Player.stamina + 30); Progress.parryCount = (Progress.parryCount || 0) + 1;
          spawnFloatingText(Player.x, Player.y - 130, "【角力】", "#fde047", 1.35);
          return;
        }
        U.res = "miss";
        if (fxReady("boss2ult")) spawnFx("boss2ult", 2, U.tgt.x, groundFxY("boss2ult", 2, 560), { anchor: "b", w: 560, h: 560, dur: 0.6 });
        Sound.play("b2_sword_rain", 1.0, 0.8); triggerShake(0, 0.6, 30, 0.4); hapticBuzz([40, 20, 60]);
        if (!near) return;
        const dir = Player.x >= U.tgt.x ? 1 : -1;
        if (Player.invulnTimer > 0) { perfectDodgeFx("【完美閃避】", 10); return; }
        if (Player.state === "parry") { takeDamage(bossDmg(g.block), dir, "【巨劍】格擋震傷"); Player.stamina = Math.max(0, Player.stamina - 60); return; }
        takeDamage(bossDmg(g.dmg), dir, "【巨劍】貫體！");
      }
      function drawUltB2() {
        const U = Boss._ult; if (!U || U.kind !== "b2sword") return;
        const c = U.c, T = c.t, now = performance.now(), G = Config.groundY;
        if (fxReady("boss2ult")) { /* 下落中的飛劍 */
          const img = fxSheet("boss2ult").img, Sf = 380, top = ultViewTop() - 120;
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          for (const s of Ult.rain) {
            const p = 1 - (s.tf - U.t) / T.fall; if (s.done || p < 0) continue;
            const yTip = top + (G + 6 - top) * Math.min(1, p * p), col = Math.floor(now / 70) % 4;
            ctx.drawImage(img, col * 256, 256, 256, 256, s.x - Sf / 2, yTip - Sf * 0.87, Sf, Sf);
          }
          ctx.restore();
        }
        if (!U.org || U.gone || !fxReady("boss2ult2")) return;
        const g = c.giant, img = fxSheet("boss2ult2").img, col = Math.floor(now / 80) % 4; let S = g.S;
        let tip, ang, a = 1, white = 0;
        U.ang = Math.atan2(U.tgt.y - U.org.y, U.tgt.x - U.org.x);
        if (!U.res) { tip = ultB2Tip(U); ang = U.ang; a = U.gp == null ? (U.ga || 0) : 1; }
        else if (U.res === "ref") {
          const rt = U.t - U.rt;
          if (rt > T.clash + T.back) return;
          if (rt < T.clash) { /* 角力：劍尖頂在主角身前一推一拉，越來越亮 */
            ang = U.ang; const j = 14 + (U.jit || 0); tip = { x: U.tgt.x - Math.cos(ang) * j, y: U.tgt.y - Math.sin(ang) * j }; white = 0.25 + 0.6 * (U.ck || 0);
          } else { /* 碎劍化成劍光（巨劍 0.6 倍、疊亮）沿原路倒飛，越飛越快 */
            white = 1; ang = U.ang + Math.PI; S = g.S * 0.6;
            const bp = Math.min(1, U.bp || 0), back = { x: Boss.x, y: Boss.y - 150 }, st = U.tgt;
            tip = { x: st.x + (back.x - st.x) * bp * bp, y: st.y + (back.y - st.y) * bp * bp };
          }
        } else { tip = U.tgt; ang = U.ang; a = Math.max(0, 1 - Math.max(0, U.t - U.rt - 0.3) / 0.2); }
        if (a <= 0.01) return;
        ctx.save(); ctx.translate(tip.x, tip.y); ctx.rotate(ang); ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a; ctx.drawImage(img, col * 256, 256, 256, 256, -S * 0.965, -S / 2, S, S);
        if (white) { ctx.globalAlpha = 0.8 * Math.min(1, white); ctx.drawImage(img, col * 256, 256, 256, 256, -S * 0.965, -S / 2, S, S); } /* 折射：同圖再疊一次＝更亮（不用程式畫光） */
        ctx.restore();
      }
      /* 繪製：壓暗聚焦（世界座標，畫在 Boss 之前）＋火牆 */
      function drawUltWorld() {
        if ((Boss._ucd || 0) > 0.01 && Boss._ucdPos) {
          const op = Boss._ucdPos, g = ctx.createRadialGradient(op.x, op.y, 110, op.x, op.y, 460);
          g.addColorStop(0, "rgba(24,0,6,0)"); g.addColorStop(1, `rgba(16,0,4,${0.78 * Boss._ucd})`);
          ctx.save(); ctx.fillStyle = g; ctx.fillRect(Game.camera.x - 1600, -1600, Config.baseWidth + 3200, 4200); ctx.restore();
        }
        drawUltB2(); /* v0.8.165 第 2 關劍雨與巨劍 */
        const W = Ult.waves; if (!W.length || !fxReady("boss1ult")) return;
        const img = fxSheet("boss1ult").img, G = Config.groundY, c = ULT_CFG.b1fire, now = performance.now();
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const w of W) {
          if (w.cut) continue;
          const cfg = w.big ? c.big : c.low, row = w.big ? 3 : 2, S = cfg.draw, col = Math.floor(now / 70 + (w.dir > 0 ? 0 : 2)) % 4;
          const Hb = w.big ? (G + GROUND_SINK) - ultViewTop() + 260 : S; /* v0.8.162 高火牆再往上延伸（頂出畫面）；腳底對齊扣掉圖裡留白 */
          ctx.save(); ctx.translate(w.x, groundFxY("boss1ult", row, Hb)); ctx.scale(w.dir, 1);
          if (w.big) { /* v0.8.161 高火牆＝滿屏；v0.8.162 加寬加厚（寬 1000）；v0.8.164 使用者要求火焰只留一層，判定不變 */
            const Hh = Hb, Wd = 1000;
            ctx.globalCompositeOperation = "source-over"; /* 先墊深紅實色火牆身體（亮背景上疊加發光會變淡粉霧，壓不住） */
            const gb = ctx.createLinearGradient(-Wd * 1.0, 0, 30, 0);
            gb.addColorStop(0, "rgba(90,0,18,0)"); gb.addColorStop(0.25, "rgba(110,4,24,0.62)"); gb.addColorStop(0.8, "rgba(175,14,34,0.85)"); gb.addColorStop(1, "rgba(210,40,50,0)");
            ctx.fillStyle = gb; ctx.fillRect(-Wd * 1.0, -Hh, Wd * 1.0 + 30, Hh); /* 身體寬度對齊單層火焰 */
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 1; ctx.drawImage(img, col * 256, row * 256, 256, 256, -Wd * 0.92, -Hh, Wd, Hh);
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
        if (U && U.kind === "b2sword" && !U.res && U.t >= U.c.t.launch - 0.35) best = { tl: U.c.t.launch + U.c.t.fly - U.t, big: false }; /* 巨劍：黃色光圈＝可招架（折射） */
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
      /* =========================================================================
       * v0.8.163 大招測試（齒輪選單「大招測試」）：直接進該關二階段、主角滿血，1.2 秒後放招牌大招。
       * 各關在 Stages[n].sigMove 登記招牌大招（之後每做好一關就加一行）；不寫進度、不影響存檔。
       * ========================================================================= */
      function ultTestList() { const L = []; for (let n = 1; n <= 9; n++) { const s = Stages[n]; if (s && s.sigMove && s.moves && s.moves[s.sigMove]) L.push({ n, boss: s.name, move: String(s.moves[s.sigMove].name).replace(/\s*[（(].*[）)]\s*/, "") }); } return L; }
      function ultTest(n) {
        const st = Stages[n]; if (!st || !st.sigMove) return;
        document.querySelectorAll(".cult-modal-backdrop.open").forEach(e => e.classList.remove("open"));
        if (DLG.active) { DLG.onEnd = null; dlgFinish(); } /* 關掉進行中的對話，不觸發它的後續 */
        loadStage(n);
        Game.mode = "battle"; Game.introT = 0; Game.pendingPre = false; Game.dir = null; Game.cine = null; Game.cutsceneActive = false; Game.defeated = false;
        Boss._introHide = false; Boss._p2MoviePending = false;
        Config.bossPhase = 2; if (Boss.maxHp2) bossRefillP2();
        if (st.stanceByPhase && st.stanceByPhase[2]) { Boss._scaleMul = 1; Boss.stance = st.stanceByPhase[2]; Boss.stanceCount = 0; applyBossBody(st); }
        if (STAGE_BGM_P2[n]) Music.play(STAGE_BGM_P2[n]);
        Player.hp = Player.maxHp; Player.stamina = Player.maxStamina; Player.x = Math.max(200, Boss.x - 560); Player.facing = 1; Boss.facing = -1;
        Boss.state = "idle"; Boss.aiCooldown = 99; Boss.posture = 0;
        Game.ultTest = { n, t: 1.2 };
        showBanner("大招測試", "第 " + n + " 關・二階段", 1100, "#fde68a");
      }
      function ultTestTick(dt) { /* ultUpdate 開頭呼叫：倒數期間 Boss 待機，時間到放該關招牌大招 */
        const T = Game.ultTest; if (!T) return false;
        if (Game.mode !== "battle" || Boss.stageId !== T.n) { Game.ultTest = null; return false; }
        T.t -= dt; Boss.state = "idle"; Boss.vx = 0; Boss.aiCooldown = 99;
        if (T.t <= 0) { Game.ultTest = null; Boss.aiCooldown = 0; Boss.facing = Player.x >= Boss.x ? 1 : -1; triggerBossMove(Stages[T.n].sigMove); }
        return true;
      }
      function openUltTestMenu() {
        let m = document.getElementById("ult-test-modal");
        if (!m) {
          m = document.createElement("div"); m.id = "ult-test-modal"; m.className = "cult-modal-backdrop";
          m.innerHTML = '<div class="cult-scroll-box" style="width:460px;max-width:90vw;padding:16px 20px;"><div class="modal-banner-row"><span class="modal-chapter-tag">【大招測試】直接進二階段放招牌大招</span><button type="button" class="cult-header-btn" id="btn-close-ult-test">關閉 ✕</button></div><div id="ult-test-list" style="display:flex;flex-direction:column;gap:8px;margin-top:10px;"></div></div>';
          document.body.appendChild(m);
          m.querySelector("#btn-close-ult-test").addEventListener("click", () => m.classList.remove("open"));
        }
        const box = m.querySelector("#ult-test-list"); box.innerHTML = "";
        const L = ultTestList();
        if (!L.length) box.innerHTML = '<div style="color:#cbd5e1;font-size:13px;">還沒有做好的招牌大招。</div>';
        L.forEach(it => {
          const b = document.createElement("button"); b.type = "button"; b.className = "menu-tile-btn";
          b.style.cssText = "width:100%;justify-content:flex-start;text-align:left;";
          b.innerHTML = "<span>🔥</span><span>第 " + it.n + " 關・" + it.boss + "：" + it.move + "</span>";
          b.addEventListener("click", () => ultTest(it.n));
          box.appendChild(b);
        });
        m.classList.add("open");
      }
