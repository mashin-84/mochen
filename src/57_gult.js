      /* ===== v0.8.180 灰盒招牌大招引擎（第 4～9 關）＋關卡機制（金光盾、玄武硬殼、三階段） =====
         招式資料 moves.X.ult = "g_xxx"（ULT_CFG 也要有同名條目，ultStart 才會接手）；ultUpdate 轉給 gultStep。
         大招＝時間軸事件（build 回傳 {ev:[[秒, fn]…], rest:[開始, 長度], dim:[[起,迄]…], tick}），事件用兩種「危險物」組成：
           guStrike：定點打擊（地上預警圈 → delay 秒後結算）。kind：parry 黃＝可招架／red 紅＝不能招架（走開或瞬步）／jump 紅低帶＝跳過
           guWave：  會移動的波（low＝矮，可跳；否則頂天）。kind：parry 可招架／red 只能瞬步穿過
         光圈倒數畫在主角身上（黃＝可招架、紅＝不能招架），時間與判定同源。
         ⚠ 全部是程式畫的佔位，之後每招換專屬生圖特效與關鍵格。 */
      const GU = { hz: [], msg: 0 };
      function guStrike(o) { const h = Object.assign({ type: "strike", t: 0, w: 160, delay: 0.8, kind: "red", dmg: 200, post: 18, lock: 0.3, label: "大招命中！" }, o); GU.hz.push(h); return h; }
      function guWave(o) { GU.hz.push(Object.assign({ type: "wave", t: 0, speed: 850, depth: 150, low: false, kind: "red", dmg: 220, post: 16, h: 60, label: "大招命中！" }, o)); }
      function guHit(srcX, h) {
        if (Player.state === "execution" || Boss.hp <= 0 || Game.bossDeath) return;
        const dir = Player.x >= srcX ? 1 : -1;
        if (h.kind === "parry") {
          const sx = Boss.x, sp = Boss.isPerilous, st = Boss.perilType, svx = Boss.vx;
          Boss.x = srcX === Player.x ? Player.x - Player.facing * 40 : srcX; Boss.isPerilous = false; Boss.perilType = null;
          const pc = Progress.parryCount;
          if (h.needFace && Player.facing !== (srcX >= Player.x ? 1 : -1) && !(Player.invulnTimer > 0)) { /* v0.8.209 背後來的刀：沒轉身面向就擋不到 */
            Boss.x = sx; Boss.isPerilous = sp; Boss.perilType = st; Boss.vx = svx;
            takeDamage(bossDmg(h.dmg), dir, "【背後中劍】要先轉身！"); return;
          }
          const hp0 = Player.hp, wasParry = Player.state === "parry";
          if (h.dodgePlain && Player.invulnTimer > 0) { Boss.x = sx; Boss.isPerilous = sp; Boss.perilType = st; Boss.vx = svx; spawnFloatingText(Player.x, Player.y - 95, "閃過", "#94a3b8", 0.8); return; } /* v0.8.235 瞬步可閃但沒獎勵 */
          if (h.lethal && !wasParry) { /* v0.8.235 千鈞一擊沒擋：只剩 1 血＋擊飛 */
            Boss.x = sx; Boss.isPerilous = sp; Boss.perilType = st; Boss.vx = svx;
            if (Player.hp > 1) takeDamage(Player.hp - 1, dir, "【千鈞壓頂】"); Player.vx = dir * 1000; triggerHitstopMs(120); addTrauma(0.8); return;
          }
          resolveBossStrike({ damage: h.dmg, parryPostureDmg: h.post });
          Boss.x = sx; Boss.isPerilous = sp; Boss.perilType = st; Boss.vx = svx;
          if (h.onParry && Progress.parryCount > pc) h.onParry(h);
          else if (h.blockDmg && wasParry && Player.hp === hp0 && !(Player.invulnTimer > 0)) { /* v0.8.231 千鈞一擊：普通格擋擋不住，被震飛扣血 */
            takeDamage(bossDmg(h.blockDmg), dir, "【千鈞壓頂】普通格擋擋不住！"); Player.vx = dir * 820;
          }
          return;
        }
        if (Player.invulnTimer > 0) { perfectDodgeFx("【瞬步閃過】", 8); return; }
        if (ultHardBlock(h.dmg, dir, h.label)) return; /* v0.8.184 次佳解 */
        takeDamage(bossDmg(h.dmg), dir, h.label);
      }
      function gultTick(dt) {
        const H = GU.hz; if (!H.length) return;
        const G = Config.groundY;
        for (let i = H.length - 1; i >= 0; i--) {
          const h = H[i]; h.t += dt;
          if (h.type === "strike") {
            if (!h.done) {
              if (h.track && h.delay - h.t > h.lock) h.x += (Player.x - h.x) * Math.min(1, dt * 9);
              if (h.t >= h.delay) {
                h.done = true; h.ft = 0;
                const inside = Math.abs(Player.x - h.x) <= h.w * 0.5;
                if (inside && !(h.kind === "jump" && Player.y < G - 38)) guHit(h.srcBoss ? Boss.x : h.srcOff ? h.x + h.side * h.srcOff : h.src != null ? h.src : h.x, h);
                else if (inside && h.kind === "jump") spawnFloatingText(Player.x, Player.y - 95, "躍過！", "#34d399", 1.0);
                if (!h.quiet) { triggerShake(0, 0.3, h.w > 300 ? 22 : 10, 0.2); Sound.play(h.kind === "parry" ? "slash" : "hit", 0.6, 0.8); }
                if (h.onFire) h.onFire(h);
              }
            } else { h.ft += dt; if (h.ft > 0.3) H.splice(i, 1); }
          } else {
            h.x += h.dir * h.speed * dt;
            if (h.x < -500 || h.x > Config.worldWidth + 500 || h.t > (h.life || 6)) { H.splice(i, 1); continue; }
            if (h.done) continue;
            const rel = (Player.x - h.x) * h.dir;
            if (rel > 10 || rel < -h.depth) continue;
            if (Player.state === "execution") { h.done = true; continue; }
            if (h.low && Player.y < G - h.h) continue;
            h.done = true;
            const hp0 = Player.hp; guHit(h.x - h.dir * 60, h);
            if (h.kind === "parry" && Player.hp === hp0 && Player.state === "parry") h.cut = true;
          }
        }
      }
      function guCue() { /* 最近一次會打到主角的倒數（秒）與顏色列：0 黃、1 紅 */
        let best = null;
        for (const h of GU.hz) {
          if (h.done) continue; let tl;
          if (h.type === "strike") { if (Math.abs(Player.x - h.x) > h.w * 0.5 + (h.track ? 400 : 0)) continue; tl = h.delay - h.t; }
          else { const d = (Player.x - h.x) * h.dir; if (d < 0) continue; tl = d / h.speed; }
          if (!best || tl < best.tl) best = { tl, row: h.kind === "parry" ? 0 : 1 };
        }
        return best;
      }
      function gultCleanup(cancel) { /* ultEnd 呼叫 */
        Boss._introHide = false; Boss._gImm = false; Game.ultNoFace = false; Game.gDimOn = false; Game.ultDimRGB = null;
        if (cancel) GU.hz.length = 0;
        const p = Game.partner; if (p && p.state === "ultchant") { p.state = "idle"; p.cd = 3; p.kind = null; }
      }
      function gultStep(U, dt) {
        if (!U.g) { U.g = GULT[U.kind](U); U.g.ev.sort((a, b) => a[0] - b[0]); U.g.i = 0; }
        const g = U.g; U.t += dt; const t = U.t; Boss.vx = 0; Boss.nextImpactIn = 999;
        while (g.i < g.ev.length && g.ev[g.i][0] <= t) g.ev[g.i++][1]();
        if (g.tick) g.tick(dt);
        if (!Boss._ult) return true; /* tick 裡已結束 */
        const r = g.rest;
        if (t >= r[0] + r[1]) { ultEnd(false); return true; }
        if (t >= r[0]) {
          if (!g.rested) { g.rested = true; Boss._introHide = false; Boss._ultAir = false; Boss.y = Config.groundY; Game.ultCam = 0; Game.ultFocus = false; if (g.restText) spawnFloatingText(Boss.x, Boss.y - 170, g.restText, "#fde047", 1.2); }
          Boss.state = "recover"; Boss._ultRest = true; Boss.stateTimer = r[0] + r[1] - t; Boss.stateDur = r[1]; Boss._ucd = Math.max(0, (Boss._ucd || 0) - dt * 3);
          return true;
        }
        Boss.state = "ult";
        const dimOn = (g.dim || []).some(d => t >= d[0] && t < d[1]);
        Boss._ucd = Math.max(0, Math.min(0.8, (Boss._ucd || 0) + (dimOn ? dt * 2.5 : -dt * 3))); Boss._ucdPos = { x: Boss.x, y: Boss.y - 110 };
        Game.ultCam = dimOn ? (g.camZ || 0.12) : -0.05; Game.ultFocus = dimOn ? (g.camF || true) : 0.5;
        return true;
      }
      /* ---------- 各關大招時間軸 ---------- */
      const gSide = () => (Player.x >= Boss.x ? 1 : -1);
      const gClampX = (x) => Math.max(140, Math.min(Config.worldWidth - 140, x));
      function gVanish(on) { Boss._introHide = on; Boss._ultAir = on; if (fxReady("spark")) spawnFx("spark", 2, Boss.x, Boss.y - 100, { w: 300, dur: 0.35 }); Sound.play("mikiri", 0.5, on ? 1.7 : 1.3); }
      function gChain(ev, t0, gaps, mk) { let t = t0; gaps.forEach((gp, i) => { t += gp; const at = t, idx = i; ev.push([at, () => mk(idx)]); }); return t; }
      const GULT = {
        /* ===== v0.8.209 第 3 關新大招灰盒（取代寒川十字／玄鐵龍捲；關鍵格先借現有圖，圈與波是程式畫的佔位） ===== */
        /* 一階段雙劍「寒川影殺」：貼身快速四連斬 → 化影消失、從背後背刺（要先轉身面向才擋得到）→ 現身空中斜落刺 → 十字收尾。
           七刀全部可完美招架（post 4／5／10，完美招架實際加倍＝每刀架勢 +8～10、收尾 +20，七刀共 62）；瞬步只是躲開；七刀全完美＝莫寒川踉蹌 2.6 秒 */
        g_s3a: (U) => {
          const ev = [], G = Config.groundY, D = 0.45; U.pp = 0;
          const fr = (k) => { Boss._ultFrame = k; }, ok = () => { U.pp++; }, kS = bossVis(Stages[Boss.stageId]).k;
          const shd = (row, x, y, w, o) => { if (fxReady("boss3shadow")) spawnFx("boss3shadow", row, x, y, Object.assign({ w, h: w, dur: 0.45 }, o || {})); }; /* v0.8.216 生圖 boss3shadow：0 化影、1 現身、2 落刺光痕、3 落地爆光 */
          ev.push([0, () => fr("61_ua_guard")]);
          ev.push([1.2, () => hintOnce("gu3a", "寒川影殺｜每刀都能完美招架　他消失＝從背後來，先轉身")]);
          ev.push([0.55, () => { U.follow = 125; fr("23_x_wind"); Sound.play("c_dash_light", 0.85, 1.0); }]);
          let t = gChain(ev, 0.65 - 0.40, [0.40, 0.40, 0.36, 0.36], (i) => guStrike({ x: Player.x, track: true, lock: 0.15, w: 200, delay: D, kind: "parry", dmg: 72, post: 4, srcBoss: true, label: "【影殺連斬】", quiet: true, onParry: ok,
            onFire: () => { fr(["us1_strike1", "us2_strike2", "us3_strike3", "us4_strike4"][i]); Boss._kickMs = performance.now(); Sound.play("c_slash_light", 0.8, 1 + i * 0.06); if (fxReady("boss3fx")) spawnFx("boss3fx", 0, Boss.x + Boss.facing * 110, Boss.y - 120, { w: 300, dur: 0.18, facing: Boss.facing }); } }));
          { const T0 = 0.65 - 0.40, gp = [0.40, 0.40, 0.36, 0.36], AN = [null, "ua2_wind2", null, "us5_crouch"]; let c = T0; /* v0.8.245 起手格：第 2 刀前低身沉劍、第 4 刀前蹲身收劍（出手前 0.15 秒換上，前一刀出手格先停 0.2 秒以上） */
            gp.forEach((g2, i) => { c += g2; if (AN[i]) { const k = AN[i]; ev.push([c + D - 0.15, () => fr(k)]); } }); }
          t += D; /* 第 4 刀命中時刻 */
          ev.push([t + 0.18, () => fr("us5_crouch")]); /* v0.8.245 原本 0.04 秒就換掉，第 4 刀雙刺幾乎看不到 */
          ev.push([t + 0.22, () => { /* 化影：背後出現影子 0.65 秒後背刺 */
            U.follow = 0; shd(0, Boss.x, Boss.y - 20, 560 * kS * 0.95, { anchor: "b" }); gVanish(true); const side = -Player.facing;
            spawnFloatingText(Player.x, Player.y - 150, "背後！", "#fde047", 0.9); Sound.play("c_vanish", 0.85, 1.0);
            guStrike({ x: Player.x, track: true, lock: 0.2, w: 200, delay: 0.65, kind: "parry", needFace: true, ghost: true, side, srcOff: 120, shape: "cross", dmg: 88, post: 5, label: "【背刺】", onParry: ok,
              onFire: (h) => { Boss.x = gClampX(h.x + h.side * 120); gVanish(false); Boss.facing = -h.side; fr("us6_back"); shd(1, Boss.x, Boss.y - 20, 560 * kS * 0.95, { anchor: "b", dur: 0.35 }); Sound.play("c_appear_stab", 0.95, 1.0); } });
          }]);
          t += 0.22 + 0.65;
          ev.push([t + 0.2, () => { shd(0, Boss.x, Boss.y - 20, 560 * kS * 0.95, { anchor: "b" }); gVanish(true); }]);
          ev.push([t + 0.35, () => { /* 現身空中 → 斜落刺 */
            Boss._introHide = false; Boss._ultAir = true; fr("us7_dive"); Boss.x = gClampX(Player.x - Player.facing * 60); Boss.y = G - 330; Boss.facing = gSide(); shd(1, Boss.x, Boss.y - 150, 420, { dur: 0.3 }); shd(2, Boss.x + Boss.facing * 110, G - 190, 440, { dur: 0.7, facing: Boss.facing }); Sound.play("c_vanish", 0.6, 1.25);
            U.air = guStrike({ x: Player.x, track: true, lock: 0.25, w: 210, delay: 0.7, kind: "parry", shape: "pillar", dmg: 88, post: 5, label: "【落影刺】", onParry: ok,
              onFire: (h) => { U.air = null; Boss.x = gClampX(h.x - Boss.facing * 70); Boss.y = G; Boss._ultAir = false; fr("us8_land"); shd(3, Boss.x + Boss.facing * 60, groundFxY("boss3shadow", 3, 520), 520, { anchor: "b", dur: 0.5 }); triggerShake(0, 0.35, 16, 0.2); Sound.play("c_stab_ground", 0.95, 1.0); } });
          }]);
          t += 0.35 + 0.7;
          ev.push([t + 0.2, () => { /* 十字收尾：舉劍停一拍（遲刃）再合擊 */
            U.follow = 150; fr("74_ua_r1"); Sound.play("b3_draw", 0.8, 1.0);
            guStrike({ x: Player.x, track: true, lock: 0.2, w: 300, delay: 0.8, kind: "parry", dmg: 120, post: 10, srcBoss: true, label: "【寒川十字】", onParry: ok,
              onFire: () => { U.follow = 0; fr("77_ua_x"); Sound.play("s3_cross", 1.0, 1.0); if (fxReady("boss3ult")) { spawnFx("boss3ult", 0, Boss.x + Boss.facing * 150, Boss.y - 140, { w: 480, h: 480, dur: 0.24, nf: 3, facing: Boss.facing }); spawnFx("boss3ult", 1, Boss.x + Boss.facing * 150, Boss.y - 190, { w: 300, h: 560, dur: 0.24, nf: 3, facing: Boss.facing }); } } });
          }]);
          ev.push([t + 0.45, () => fr("75_ua_r2")]);
          t += 0.2 + 0.8;
          const g = { ev, dim: [[0, 0.6]], rest: [t + 0.3, 1.2], restText: "〔收劍喘息〕" };
          ev.push([t + 0.25, () => {
            if (U.pp >= 7) { g.rest = [t + 0.3, 2.6]; g.restText = "〔七劍盡破・莫寒川踉蹌！〕"; fr("67_ua_recoil"); damageBossPosture(15, null); triggerHitstopMs(100); addTrauma(0.45); Sound.play("mikiri", 1.0, 0.8); Boss.x = gClampX(Boss.x - Boss.facing * 90); }
            else fr("66_ua_pant");
          }]);
          g.tick = (dt) => {
            Game.ultNoFace = GU.hz.some(h => h.needFace && !h.done); /* 背刺期間：招架不自動轉身 */
            if (U.follow) { const s = gSide(); Boss.facing = s; Boss.x += (gClampX(Player.x - s * U.follow) - Boss.x) * Math.min(1, dt * 11); }
            if (U.air) { const p = Math.min(1, U.air.t / U.air.delay); Boss.x += (U.air.x - Boss.facing * 70 - Boss.x) * Math.min(1, dt * 8); Boss.y = G - 330 * (1 - p * p * p); }
          };
          return g;
        },
        /* 二階段重劍「千鈞鎖脈」（v0.8.235 使用者定案，拿掉光壁與蓄力斬破陣）：
           ① 不論距離，空洞騎士式衝刺到主角背後斬 ×2（0.55／0.50 秒，要轉身招架）；
           ② 舉重劍過頭 0.4 秒＋集氣 1.2 秒，期間腰間兩把輕劍輪流飛向主角（腰高、招架或瞬步；離他 >450px 飛更快更密＝不能跑遠）；
           ③ 頂點劍閃 0.25 秒 → 下揮（人在遠處先衝刺貼上）：完美招架＝踉蹌 3 秒＋架勢 +20；瞬步＝閃過無獎勵；普通格擋＝扣 150 擊飛；沒擋＝只剩 1 血＋擊飛。
           大招期間架勢最多 95%（capPost）。飛劍是程式畫的佔位（待生圖）。 */
        g_s3b: (U) => {
          const ev = [], G = Config.groundY;
          const fr = (k) => { Boss._ultFrame = k; };
          const D1 = Tune.v("s3b_d1"), D2 = Tune.v("s3b_d2"), CH = Tune.v("s3b_charge"), FL = Tune.v("s3b_flash"), SG = Tune.v("s3b_swGap"); /* v0.8.237 時間可在調參面板改 */
          const T1 = 0.25, T2 = T1 + D1 + 0.25, T3 = T2 + D2 + 0.3; /* 第一刀衝刺、第二刀衝刺、舉劍集氣 */
          const g = { ev, dim: [[0, 0.5], [T3, T3 + CH + 0.3]], rest: [99, 1.5], restText: "〔收劍喘息〕" };
          U.ph = "open"; U.follow = 0; U.capPost = true; /* 大招進行中架勢最多 95%：要靠最後一刀完美招架才破 */
          /* 力量感：命中頓幀、震屏、鏡頭推近；lunge＝往主角踏步（最近停在主角前 150px） */
          const impact = (lunge, stopMs, shk, zoom) => {
            const s = gSide(); Boss.facing = s; Boss.x = gClampX(Player.x - s * Math.max(150, Math.abs(Player.x - Boss.x) - lunge)); U.hold = 0.22;
            triggerHitstopMs(stopMs); triggerShake(s, 0.3, shk, 0.18); addTrauma(shk / 80);
            Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + zoom);
          };
          /* 空洞騎士式衝刺：dur 秒內真的移動到 x，沿路留單色剪影殘影（同主角瞬步的 Game.afterimages） */
          const dashTo = (x, dur, next) => { /* v0.8.240 衝刺用生圖 qj1_dash，煞停 qj2_stop 0.12 秒再接 next；起點衝刺光痕（boss3fly 列 3）＋墨煙（ink2 列 2） */
            const fc = x >= Boss.x ? 1 : -1; U.dash = { x0: Boss.x, x1: gClampX(x), t: 0, dur, gt: 0, next: next || null }; Boss.facing = fc; U.hold = dur + 0.15; Sound.play("c_dash_heavy", 0.95, 1.0);
            if (next) fr("qj1_dash");
            if (fxReady("boss3fly")) spawnFx("boss3fly", 3, Boss.x + fc * 140, Boss.y - 150, { w: 420, dur: 0.25, facing: fc });
            if (fxReady("ink2")) spawnFx("ink2", 2, Boss.x + fc * 60, Boss.y - 130, { w: 380, dur: 0.45, add: false, alpha: 0.55, back: true, facing: fc });
            else if (fxReady("spark")) spawnFx("spark", 1, Boss.x, G - 10, { w: 160, dur: 0.25 }); };
          /* 繞背：不論多遠，都衝到主角面向的反方向 170px（背後貼場邊就改正面） */
          const blink = () => {
            const back = -Player.facing; let x = Player.x + back * 170; if (x < 140 || x > Config.worldWidth - 140) x = Player.x - back * 170;
            const far = Math.abs(x - Boss.x); dashTo(x, Math.min(0.24, 0.12 + far / 9000), Boss._ultFrame); U.follow = 170;
            if ((x - Player.x) * Player.facing < 0) spawnFloatingText(Player.x, Player.y - 150, "背後！", "#fde047", 0.7);
          };
          const strike = (delay, dmg, post, hit, fire, extra) => guStrike(Object.assign({ x: Player.x, track: true, lock: Math.min(0.2, delay * 0.45), w: 260, delay, kind: "parry", dmg, post, srcBoss: true, quiet: true, label: "【千鈞鎖脈】",
            onFire: () => { fr(hit); Boss._kickMs = performance.now(); fire(); } }, extra || {}));
          ev.push([0, () => { fr("uc8_command"); Boss.facing = gSide(); Sound.play("b3_draw", 0.9, 1.0);
            hintOnce("gu3b3", "千鈞鎖脈｜背後先轉身　飛劍擋或閃　劍閃完美招架"); }]);
          /* 第一、二刀：繞背斬（要轉身招架） */
          ev.push([T1, () => { U.ph = "chain"; fr("hs1_wind"); blink();
            strike(D1, 85, 8, "hs3_hit", () => { impact(40, 60, 14, 0.03); Sound.play("c_swing_heavy", 0.9, 1.05); Sound.play("hit", 0.5, 0.8); }, { needFace: true, label: "【背後斬】" }); }]);
          ev.push([T2, () => { fr("26_charge_wind"); blink();
            strike(D2, 95, 10, "27_charge_hit", () => { impact(50, 70, 18, 0.04); Sound.play("c_swing_heavy", 1.0, 0.95); Sound.play("hit", 0.6, 0.7); }, { needFace: true, label: "【背後斬】" }); }]);
          /* 第三刀 千鈞一擊：舉劍 0.4 → 集氣 1.2（雙劍輪流飛向主角）→ 頂點劍閃停 0.25 → 用力下揮 */
          /* v0.8.239 千鈞一擊演出（使用者：要像第 5 關噴火一樣有力）：全畫面暗場＋冷白光暈聚在劍上、鏡頭拉近對準他、
             劍尖聚光（光點往劍收）→ 劍閃光圈 → 砸下：縱向光柱＋地面衝擊波＋亮暗閃＋暗場瞬間放開。
             專屬特效圖 boss3charge（0 聚光、1 劍閃光圈、2 縱劈光柱、3 地裂衝擊）還沒生，先借第 5 關 boss5charge（0、1、2）＋boss3shadow 列 3。 */
          const CF = (Stages[3].fxSheets || []).includes("boss3charge") ? "boss3charge" : "boss5charge";
          const tip = () => ({ x: Boss.x + Boss.facing * 40, y: Boss.y - 340 });
          g.camZ = 0.12;
          ev.push([T3, () => { U.ph = "charge"; U.follow = 0; fr("qj3_raise"); Boss.facing = gSide(); Sound.play("c_gather", 1.0, 1.0); spawnFloatingText(Boss.x, Boss.y - 280, "千鈞一擊！", "#fca5a5", 1.0);
            g.camZ = 0.22; g.camF = 0.72; Game.gDimOn = true; Game.ultDimRGB = "175, 215, 255"; Game.ultDimY = Boss.y - 330;
            if (Tune.v("gifFx") && fxReady("gathergif")) { const p0 = tip(); spawnFx("gathergif", 0, p0.x, p0.y, { w: 600, dur: CH - FL, loop: true, fps: 12, seq: true, alpha: 0.9, follow: tip }); } /* v0.8.243 GIF 轉的 16 格無縫循環集氣 */
            else if (fxReady(CF)) { const p0 = tip(); spawnFx(CF, 0, p0.x, p0.y, { w: 560, dur: CH - FL, loop: true, fps: 9, c0: 0, nf: 3, alpha: 0.9, follow: tip }); }
            strike(CH, 1, 40, "qj5_cleave", () => { U.capPost = false; impact(60, 120, 30, 0.1); hapticBuzz([60, 20, 90]);
              Sound.play("c_slam_huge", 1.0, 1.0);
              Game.gDimOn = false; Game.ultDim *= 0.25; g.camZ = 0.12; screenFlash("rgba(235,245,255,0.75)", 0.7, 0.35); addTrauma(0.35); /* 暗場瞬間放開＋亮暗閃 */
              const ix = Boss.x + Boss.facing * 150; inkBurst(ix, G - 140, 300, 0.45, 1);
              if (fxReady("ink2")) spawnFx("ink2", 3, ix, groundFxY("ink2", 3, 620), { anchor: "b", w: 620, dur: 0.6, add: false, alpha: 0.75, back: true, facing: Boss.facing });
              if (CF === "boss3charge" && fxReady(CF)) spawnFx(CF, 3, ix, groundFxY(CF, 3, 640), { anchor: "b", w: 640, dur: 0.5, facing: Boss.facing });
              if (fxReady("heavyhit")) spawnFx("heavyhit", 3, ix, groundFxY("heavyhit", 3, 520), { anchor: "b", w: 520, dur: 0.55, facing: Boss.facing }); /* v0.8.242 重劍砸地光塵 */
              if (CF === "boss3charge" && fxReady(CF)) spawnFx(CF, 2, ix, G - 330, { w: 760, dur: 0.45, facing: Boss.facing, alpha: 1 }); /* 縱劈光柱（生圖到了才有） */
              else if (fxReady("spark")) spawnFx("spark", 3, ix, G - 200, { w: 620, dur: 0.45, alpha: 0.9 });
              if (fxReady("boss3shadow")) spawnFx("boss3shadow", 3, Boss.x + Boss.facing * 120, groundFxY("boss3shadow", 3, 560), { anchor: "b", w: 560, dur: 0.5, facing: Boss.facing }); },
              { w: 300, lock: 0.25, blockDmg: 150, lethal: true, dodgePlain: true, label: "【千鈞一擊】",
              onParry: () => { U.won = true; U.capPost = false; Game.gDimOn = false; fr("22_slam_rec"); damageBossPosture(20, "【以小博大】架勢 +"); triggerHitstopMs(120); addTrauma(0.6); Game.slowT = 0.45; Game.slowScale = 0.3; Sound.play("c_clang_big", 1.0, 1.0);
                spawnFloatingText(Boss.x, Boss.y - 260, "〔千鈞被頂回〕", "#fde047", 1.2); Boss.x = gClampX(Boss.x - gSide() * 120); g.rest = [U.t + 0.05, 3.0]; g.restText = "〔千鈞被頂回・莫寒川踉蹌〕"; fr("16_stagger"); } });
          }]);
          ev.push([T3 + 0.3, () => { fr("qj4_peak"); swordOut(0); }]); /* v0.8.236 飛劍提早：第二把離最後一刀 ≥0.6 秒，避開「0.5 秒內連按招架窗口縮小」（預設值下） */
          /* 雙劍：腰間兩把輕劍輪流飛向主角（腰高，不能跳過：招架或瞬步）；離他超過 450px 飛得更快、間隔更短＝不能跑遠 */
          const swordOut = (i) => {
            const s = gSide(), far = Math.abs(Player.x - Boss.x) > 450;
            guWave({ x: Boss.x + s * 60, dir: s, speed: far ? 1350 : 900, kind: "parry", dmg: 70, post: 8, depth: 120, life: 3, tw: true, sword: true, label: "【飛劍】",
              onParry: (h) => { if (fxReady("boss3fly")) spawnFx("boss3fly", 2, Player.x - h.dir * 30, G - 130, { w: 320, dur: 0.35 }); } });
            if (fxReady("boss3fly")) spawnFx("boss3fly", 1, Boss.x + s * 80, G - 130, { w: 260, dur: 0.22, facing: s });
            Sound.play("c_sword_throw", 0.85, 1.0 + i * 0.08);
            if (i < 1) { ev.push([U.t + (far ? SG * 0.78 : SG), () => swordOut(i + 1)]); ev.sort((p, q) => p[0] - q[0]); }
          };
          ev.push([T3 + CH - FL, () => { /* 停頓劍閃：這一閃之後 FL 秒落刀 */ Sound.play("c_shing", 0.9, 1.0); if (fxReady("spark")) spawnFx("spark", 2, Boss.x + Boss.facing * 40, Boss.y - 330, { w: 300, dur: 0.25 });
            if (fxReady(CF)) { const p0 = tip(); spawnFx(CF, 1, p0.x, p0.y, { w: 440, dur: Math.max(0.2, FL), alpha: 0.95, follow: tip }); } g.camZ = 0.28; hapticBuzz(30); }]);
          ev.push([T3 + CH - Math.min(FL, 0.15), () => { /* 落刀前：人在遠處就衝刺貼上（逃不掉，只能招架或瞬步） */ const s = gSide(); if (Math.abs(Player.x - Boss.x) > 260) dashTo(Player.x - s * 180, 0.12); }]);
          ev.push([T3 + CH + 0.15, () => { if (U.won) return; fr("qj6_after"); g.rest = [U.t + 0.3, 1.5]; }]);
          g.tick = (dt) => {
            Game.ultNoFace = GU.hz.some(h => h.needFace && !h.done); /* 背後斬期間：招架不自動轉身 */
            if (U.dash) { const D = U.dash; D.t += dt; const p = Math.min(1, D.t / D.dur), e = 1 - (1 - p) * (1 - p);
              Boss.x = D.x0 + (D.x1 - D.x0) * e; D.gt -= dt;
              if (D.gt <= 0 && Boss._curImg && Game.afterimages.length < 24) { D.gt = 0.016; Game.afterimages.push({ x: Boss.x, y: Boss.y, w: Boss.w, h: Boss.h, alpha: 0.6, spr: Boss._curImg, s: bossVis(Stages[Boss.stageId]).k, f: Boss.facing, color: "#64748b", by: 40 }); }
              if (p >= 1) { const nx = D.next; U.dash = null; Boss.facing = gSide(); if (nx) { fr("qj2_stop"); ev.push([U.t + 0.12, () => { if (Boss._ultFrame === "qj2_stop") fr(nx); }]); ev.sort((p2, q) => p2[0] - q[0]); } if (fxReady("spark")) spawnFx("spark", 1, Boss.x, G - 10, { w: 200, dur: 0.3, facing: Boss.facing }); triggerShake(0, 0.2, 6, 0.1); } }
            if (U.hold > 0) U.hold -= dt;
            if (U.follow && !(U.hold > 0)) { const s = gSide(); Boss.facing = s; Boss.x += (gClampX(Player.x - s * U.follow) - Boss.x) * Math.min(1, dt * 8); }
            if (U.ph === "charge" && !U.won && U.t < T3 + CH - FL) { /* 集氣：劍身聚光、地面微震 */
              U.cg = (U.cg || 0) - dt; if (U.cg <= 0) { U.cg = 0.14; if (fxReady("spark")) spawnFx("spark", 1, Boss.x + Boss.facing * (20 + Math.random() * 60), Boss.y - 300 - Math.random() * 60, { w: 70 + Math.random() * 50, dur: 0.3 }); }
              Game.camera.trauma = Math.max(Game.camera.trauma || 0, 0.12);
            }
          };
          g.draw = () => { /* 佔位：飛劍（淡藍劍身＋拖光），待生圖 */
            const now = performance.now();
            for (const h of GU.hz) {
              if (!h.tw || h.done) continue;
              if (fxReady("boss3fly")) { /* v0.8.240 生圖飛劍（列 0，圖朝右、劍尖約在格寬 0.91） */
                const I = fxSheet("boss3fly").img, w = 330, f = Math.floor(now / 70) % 4; if (h._wb == null) h._wb = Math.floor(Math.random() * 6); const wb = wobble(h._wb);
                ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(h.x - h.dir * w * 0.41 + wb.x, G - 130 + wb.y); ctx.rotate(wb.r); ctx.scale(h.dir, 1);
                ctx.drawImage(I, f * 256, 0, 256, 256, -w / 2, -w / 2, w, w); ctx.restore(); continue;
              }
              const y = G - 130, L = 150; if (h._wb == null) h._wb = Math.floor(Math.random() * 6); const wb = wobble(h._wb);
              ctx.save(); ctx.translate(h.x + wb.x, y + wb.y); ctx.rotate(wb.r); ctx.scale(h.dir * 1.5, 1.5);
              const gr = ctx.createLinearGradient(-L - 160, 0, 0, 0); gr.addColorStop(0, "rgba(186, 230, 253, 0)"); gr.addColorStop(1, "rgba(186, 230, 253, 0.7)");
              ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = gr; ctx.fillRect(-L - 160, -6, L + 160, 12);
              ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#e2e8f0"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-22, -5); ctx.lineTo(-L, -4); ctx.lineTo(-L, 4); ctx.lineTo(-22, 5); ctx.closePath(); ctx.fill();
              ctx.strokeStyle = "#475569"; ctx.lineWidth = 1.5; ctx.stroke();
              ctx.fillStyle = "#94a3b8"; ctx.fillRect(-L - 6, -12, 6, 24); ctx.fillStyle = "#7c2d12"; ctx.fillRect(-L - 40, -3.5, 34, 7);
              ctx.restore();
            }
          };
          return g;
        },
        /* 第 4 關 人形劍魂「六劍朝宗」：六把劍左右交錯橫穿（逐把招架，第 5 把慢半拍）→ 六劍合一從天直落（紅圈追蹤，走開或瞬步）→ 劍插地喘息 */
        g_s4: (U) => {
          const ev = [], D = 0.85;
          ev.push([1.4, () => hintOnce("gu4", "六劍朝宗｜逐把招架　天劍紅圈：走開或瞬步")]);
          let t = gChain(ev, 0.9 - D, [D, 0.5, 0.5, 0.5, 0.5, 0.85], (i) => guStrike({ x: Player.x, track: true, lock: 0.2, w: 190, delay: D, kind: "parry", dmg: 95, post: 9, src: Player.x + (i % 2 ? 1 : -1) * 300, side: i % 2 ? 1 : -1, shape: "cross", label: "【劍陣橫穿】" }));
          t += D;
          ev.push([t + 0.3, () => guStrike({ x: Player.x, track: true, lock: 0.45, w: 260, delay: 1.1, kind: "red", dmg: 260, shape: "pillar", label: "【天劍直落】" })]);
          return { ev, dim: [[0, 0.9]], rest: [t + 1.6, 2.2], restText: "〔劍魂力竭〕" };
        },
        /* 第 5 關 小狼「幽影噬月」：小狼化影消失 → 連續三次從天撲落（紅圈追蹤主角，持續移動或瞬步）→ 第三撲落地震出左右矮震波（跳）→ 伏地喘息 */
        g_s5a: (U) => {
          const ev = [];
          ev.push([1.4, () => hintOnce("gu5a", "幽影噬月｜紅圈追你：移動或瞬步 ×3　落地矮波：跳")]);
          ev.push([0.6, () => gVanish(true)]);
          [1.0, 1.85, 2.7].forEach((at, i) => ev.push([at, () => guStrike({ x: Player.x, track: true, lock: 0.32, w: i === 2 ? 240 : 180, delay: 0.8, kind: "red", dmg: i === 2 ? 220 : 160, shape: "pillar", label: "【幽影撲殺】",
            onFire: (h) => { Boss.x = gClampX(h.x); if (i === 2) { gVanish(false); Boss.facing = gSide(); guWave({ x: h.x, dir: 1, low: true, kind: "parry", speed: 760, dmg: 110, label: "【落地震波】" }); guWave({ x: h.x, dir: -1, low: true, kind: "parry", speed: 760, dmg: 110, label: "【落地震波】" }); } } })]));
          return { ev, dim: [[0, 0.6]], rest: [3.9, 1.8], restText: "〔小狼力竭喘息〕" };
        },
        /* 第 6 關 化血老祖「血神大法」：老祖蓄血神子（6.5 秒，月華護體＝無敵），魅月在主角另一側全力護法；
           主角要先砍魅月 3 刀打到失神 → 護體碎 → 砍老祖一刀＝打斷（老祖重創、長破綻）。期間腳下不斷冒血柱（紅圈）。沒打斷＝全場血爆（只能瞬步無敵幀躲）。 */
        g_s6: (U) => {
          const ev = [], CH = 6.5, p = Game.partner, g = { ev, dim: [[0, 0.8]], rest: [CH + 0.5, 1.2] };
          U.broken = !ptLive(); U.hp0 = Boss.hp;
          ev.push([0.1, () => {
            Boss._ultAir = !U.broken; Boss._gImm = !U.broken; hintOnce("gu6", "血神大法｜先砍魅月 3 刀破護體，再砍老祖打斷");
            if (ptLive()) { const s = Boss.x >= Player.x ? -1 : 1; let x = Player.x + s * 430; if (x < 170 || x > Config.worldWidth - 170) x = Player.x - s * 430; p.x = gClampX(x); p.state = "ultchant"; p.kind = "shield"; p.t = 0; p.dur = CH; p.posture = 0; p.alpha = 1; spawnFloatingText(p.x, Config.groundY - 210, "魅月：奴家替老祖護法！", "#f9a8d4", 1.2); }
          }]);
          for (let t = 1.0; t < CH - 0.6; t += 1.3) ev.push([t, () => { if (!U.stop) guStrike({ x: Player.x, track: true, lock: 0.35, w: 150, delay: 0.75, kind: "red", dmg: 100, shape: "pillar", label: "【血柱】", quiet: true }); }]);
          ev.push([CH, () => {
            if (U.stop) return;
            Game.flashWhiteOverlay = 0.9; triggerShake(0, 0.8, 44, 0.6); hapticBuzz([60, 30, 90]); Sound.play("execution", 0.9, 0.6); U.blastT = 0.5;
            if (Player.state !== "execution") { if (Player.invulnTimer > 0) perfectDodgeFx("【瞬步避過血爆】", 10); else if (!ultHardBlock(240, gSide(), "【硬接血爆】")) takeDamage(bossDmg(240), gSide(), "【血神爆】"); }
          }]);
          g.tick = (dt) => {
            if (U.blastT) U.blastT -= dt;
            if (!U.broken && ptLive() && Game.partner.state === "stun") { U.broken = true; Boss._ultAir = false; Boss._gImm = false; spawnFloatingText(Boss.x, Boss.y - 190, "〔護體已碎！快砍老祖！〕", "#fde047", 1.4); Sound.play("parry", 0.9, 0.7); }
            if (U.broken && !U.stop && U.t < CH && Boss.hp < U.hp0 - 0.5) {
              U.stop = true; g.rest = [U.t, 3.2]; g.restText = "〔血神子潰散・老祖重創〕"; GU.hz.length = 0;
              damageBossPosture(45, null); triggerHitstopMs(110); addTrauma(0.5); Sound.play("mikiri", 1.0, 0.8);
            }
            U.hp0 = Boss.hp;
          };
          return g;
        },
        /* 第 7 關 金甲天將「天罡雷陣」：三道天雷依序追打主角（紅圈）→ 舉盾衝鋒橫穿全場兩趟（頂天金牆：完美招架＝撞停破盾；普通格擋會被推著扣劍勢；瞬步可穿）→ 喘息 */
        g_s7a: (U) => {
          const ev = [];
          ev.push([1.4, () => hintOnce("gu7a", "天罡雷陣｜天雷紅圈：走開　盾衝黃圈：完美招架破盾")]);
          [0.9, 1.6, 2.3].forEach((at) => ev.push([at, () => guStrike({ x: Player.x, track: true, lock: 0.35, w: 170, delay: 0.8, kind: "red", dmg: 130, shape: "pillar", label: "【天雷】" })]));
          const charge = (at) => ev.push([at, () => {
            if (U.stopped) return;
            const dir = gSide(); Boss.facing = dir; U.chg = { dir, t: 0 };
            guWave({ x: Boss.x, dir, speed: 1000, depth: 130, kind: "parry", dmg: 180, post: 30, label: "【金盾衝鋒】", ride: true,
              onParry: () => { U.stopped = true; U.chg = null; if (Boss._gd) { Boss._gd.n = 0; Boss._gd.down = Stages[Boss.stageId].guard.down; } U.g.rest = [U.t, 3.0]; U.g.restText = "〔撞停！金光盾碎〕"; GU.hz.length = 0; triggerHitstopMs(110); addTrauma(0.5); } });
          }]);
          charge(3.9); charge(5.6);
          const g = { ev, dim: [[0, 0.8], [3.2, 3.9]], rest: [7.0, 2.0], restText: "〔天將收勢喘息〕" };
          g.tick = (dt) => { /* 天將跟著金牆衝 */
            const w = GU.hz.find(h => h.ride && h.t < 1.4);
            if (w && !U.stopped) Boss.x = gClampX(w.x - w.dir * 60);
          };
          return g;
        },
        /* 第 7 關 玄武「玄冥噴泉」（v0.8.182 巨型版）：水柱一格一格從場地一端掃到另一端，只留一格安全（沒有紅圈的那格），來回兩趟
           → 四隻腳連環踩踏追打主角（紅圈，間隔 0.7）→ 四足齊落不動 3 秒：全部可砍（大破綻） */
        g_s7b: (U) => {
          const ev = [], W = Config.worldWidth, cell = 230, n = Math.floor((W - 300) / cell);
          ev.push([1.4, () => hintOnce("gu7b", "玄冥噴泉｜站到沒紅圈的格子　四腳踩完＝一次砍四隻腳")]);
          const sweep = (t0, rev) => ev.push([t0, () => {
            const pi = Math.max(1, Math.min(n - 2, Math.round((Player.x - 150) / cell) + (Math.random() < 0.5 ? -2 : 2)));
            for (let i = 0; i < n; i++) { if (i === pi) continue; const k = rev ? n - 1 - i : i; guStrike({ x: 150 + cell * (i + 0.5), w: cell - 14, delay: 1.0 + k * 0.07, kind: "red", dmg: 150, shape: "pillar", label: "【玄冥水柱】", quiet: k % 3 !== 0 }); }
          }]);
          sweep(0.9, false); sweep(3.1, true);
          [5.4, 6.1, 6.8, 7.5].forEach((at, i) => ev.push([at, () => { if (!xwOn() || Game.xw.stun > 0) return; xwStompStrike(i, { dmg: 150, delay: 0.8, lock: 0.3, lo: 150, hi: W - 150, onFire: (h) => xwPlant(i, h.x, 11.9 - at) }); }]));
          return { ev, dim: [[0, 0.8]], rest: [8.7, 3.0], restText: "〔四足齊落・全部可砍！〕" };
        },
        /* 第 8 關一階段（人・劍修）「青雲劍訣・天河」：五把飛劍逐把射出（可折射，間隔 0.45）→ 瞬身突刺收尾（接一般危招「突刺」＝看破）*/
        g_s8a: (U) => {
          const ev = [];
          ev.push([1.4, () => hintOnce("gu8a", "天河劍訣｜飛劍逐把招架折回　最後【危】突刺：瞬步看破")]);
          for (let i = 0; i < 5; i++) ev.push([0.9 + i * 0.45, () => { const dir = gSide(); Boss.facing = dir; Game.flyingSwords.push({ x: Boss.x + dir * 50, y: Config.groundY - 170 + (i % 3) * 35, vx: dir * 780, vy: 0, dir, damage: 105, reflected: false, life: 2.6, color: "#7dd3fc", trajectory: "linear", kind: null }); Sound.play("flysword", 0.7, 1 + i * 0.06); Boss._kickMs = performance.now(); }]);
          const g = { ev, dim: [[0, 0.8]], rest: [3.5, 0.01] };
          g.tick = () => { if (U.t >= 3.45 && !U.fin) { U.fin = true; const st = Stages[Boss.stageId]; ultEnd(false); Boss.aiCooldown = 0; triggerBossMove(st.moves.a_thrust ? "a_thrust" : "thrust_peril"); } };
          return g;
        },
        /* 第 8 關二階段（魔染）「無相魔影殺」：四道魔影站在主角左右，依序撲殺（逐下招架，越來越快，第 4 下慢半拍）→ 真身從背後擒拿（紅圈，瞬步）→ 喘息 */
        g_s8b: (U) => {
          const ev = [], D = 0.8;
          ev.push([1.4, () => hintOnce("gu8b", "無相魔影殺｜魔影逐下招架　真身擒拿紅圈：瞬步")]);
          ev.push([0.6, () => gVanish(true)]);
          let t = gChain(ev, 0.9 - D, [D, 0.55, 0.45, 0.4, 0.8], (i) => guStrike({ x: Player.x, track: true, lock: 0.2, w: 190, delay: D, kind: "parry", dmg: 100, post: 10, src: Player.x + (i % 2 ? 1 : -1) * 260, side: i % 2 ? 1 : -1, shape: "cross", label: "【魔影撲殺】" }));
          t += D;
          ev.push([t + 0.25, () => guStrike({ x: Player.x, track: true, lock: 0.3, w: 200, delay: 0.85, kind: "red", dmg: 300, shape: "pillar", label: "【無相擒拿】", onFire: (h) => { Boss.x = gClampX(h.x - Player.facing * 90); gVanish(false); Boss.facing = gSide(); } })]);
          return { ev, dim: [[0, t + 1.1]], rest: [t + 1.3, 2.2], restText: "〔魔氣反噬・破綻〕" };
        },
        /* 第 8 關三階段（天道附體）「天劫・萬象歸墟」期末考：劫雷找空格 ×2 → 矮劫波（跳）→ 頂天劫牆（瞬步穿）→ 天罰五連（逐下招架，最後一下慢）→ 長喘息 */
        g_s8c: (U) => {
          const ev = [], W = Config.worldWidth, cell = 210, D = 0.8;
          ev.push([1.4, () => hintOnce("gu8c", "萬象歸墟｜空格躲雷 → 矮波跳 → 高牆瞬步 → 五連招架")]);
          const field = (t0) => ev.push([t0, () => {
            const base = Player.x, safe = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2));
            for (let i = -5; i <= 5; i++) { if (i === safe) continue; const x = base + i * cell; if (x < 100 || x > W - 100) continue; guStrike({ x, w: cell - 14, delay: 1.15, kind: "red", dmg: 150, shape: "pillar", label: "【劫雷】", quiet: i !== 0 }); }
          }]);
          field(0.9); field(2.5);
          ev.push([4.2, () => { const d = gSide(); guWave({ x: Boss.x, dir: d, low: true, kind: "parry", speed: 820, dmg: 110, label: "【劫波】" }); guWave({ x: Boss.x, dir: -d, low: true, kind: "parry", speed: 820, dmg: 110 }); }]);
          ev.push([5.3, () => { const d = gSide(); guWave({ x: Boss.x, dir: d, kind: "red", speed: 900, depth: 170, dmg: 240, label: "【劫牆】" }); guWave({ x: Boss.x, dir: -d, kind: "red", speed: 900, depth: 170, dmg: 240 }); }]);
          let t = gChain(ev, 7.0 - D, [D, 0.6, 0.5, 0.4, 0.4, 0.8], (i) => guStrike({ x: Player.x, track: true, lock: 0.2, w: 190, delay: D, kind: "parry", dmg: 85, post: 10, src: Player.x + (i % 2 ? 1 : -1) * 260, side: i % 2 ? 1 : -1, shape: "cross", label: "【天罰】" }));
          return { ev, dim: [[0, 0.8], [6.3, 7.0]], rest: [t + D + 0.4, 3.0], restText: "〔劫眼閉合・天道力竭〕" };
        },
        /* 第 9 關 心魔「三念歸一」：心魔隱去，連出五式，每式隨機是 斬（黃圈＝招架）／掃（紅色低帶＝跳）／絕（紅圈追蹤＝瞬步或走開），考讀顏色與三種動詞 → 現身喘息 */
        g_s9: (U) => {
          const ev = [], D = 0.9;
          ev.push([1.4, () => hintOnce("gu9", "三念歸一｜黃圈招架　貼地紅帶跳　紅圈走開或瞬步")]);
          ev.push([0.6, () => gVanish(true)]);
          let last = -1;
          let t = gChain(ev, 1.0 - D, [D, 1.0, 1.0, 0.9, 0.9], () => {
            let k = Math.floor(Math.random() * 3); if (k === last) k = (k + 1) % 3; last = k;
            const s = Math.random() < 0.5 ? -1 : 1;
            if (k === 0) guStrike({ x: Player.x, track: true, lock: 0.2, w: 190, delay: D, kind: "parry", dmg: 100, post: 12, src: Player.x + s * 260, side: s, shape: "cross", label: "【心魔・斬】" });
            else if (k === 1) guStrike({ x: Player.x, track: true, lock: 0.25, w: 620, delay: D, kind: "jump", dmg: 170, shape: "low", label: "【心魔・掃】" });
            else guStrike({ x: Player.x, track: true, lock: 0.3, w: 200, delay: D, kind: "red", dmg: 200, shape: "pillar", label: "【心魔・絕】" });
          });
          ev.push([t + D + 0.1, () => { Boss.x = gClampX(Player.x + (Math.random() < 0.5 ? -1 : 1) * 200); gVanish(false); Boss.facing = gSide(); }]);
          return { ev, dim: [[0, t + D]], rest: [t + D + 0.3, 2.4], restText: "〔心魔現形・破綻〕" };
        }
      };
      Object.keys(GULT).forEach(k => { ULT_CFG[k] = { img: {}, t: {} }; });
      /* ---------- 繪製（佔位） ---------- */
      function drawGultWorld() {
        if (Game.mode !== "battle") return;
        const G = Config.groundY, top = ultViewTop() - 40, now = performance.now();
        for (const h of GU.hz) {
          const col = h.kind === "parry" ? "253, 224, 71" : "248, 113, 113";
          ctx.save();
          if (h.type === "strike") {
            const pr = Math.min(1, h.t / h.delay), hw = h.w * 0.5;
            if (!h.done) {
              if (h.shape === "low") { ctx.fillStyle = `rgba(${col}, ${0.12 + 0.25 * pr})`; ctx.fillRect(h.x - hw, G - 34, h.w, 34); ctx.strokeStyle = `rgba(${col}, 0.9)`; ctx.lineWidth = 2.5; ctx.strokeRect(h.x - hw, G - 34, h.w, 34); }
              else {
                ctx.strokeStyle = `rgba(${col}, 0.9)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(h.x, G + 2, hw, 16, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = `rgba(${col}, ${0.15 + 0.3 * pr})`; ctx.beginPath(); ctx.ellipse(h.x, G + 2, hw * pr, 16 * pr, 0, 0, Math.PI * 2); ctx.fill();
                if (h.shape === "pillar") { ctx.fillStyle = `rgba(${col}, ${0.05 + 0.09 * pr})`; ctx.fillRect(h.x - hw * 0.8, top, h.w * 0.8, G - top); }
                if (h.shape === "cross" && h.side && h.ghost) { /* v0.8.217 背刺預警：他化影前蹲的剪影（淡紫）＋生圖現身煙霧，取代程式畫的梯形影子 */
                  const SPg = getBossSprite("boss3"), ig = SPg && SPg.imgs["us5_crouch"], sil = ig && ig.complete && ig.naturalWidth ? silImg(ig, "#6d28d9") : null, gx = h.x + h.side * (h.srcOff || 260), kg = bossVis(Stages[Boss.stageId]).k;
                  if (sil) { ctx.save(); ctx.globalAlpha = 0.2 + 0.55 * pr; ctx.translate(gx, G + GROUND_SINK); ctx.scale(-h.side * kg, kg); ctx.drawImage(sil, -450, -560); ctx.restore(); }
                  if (fxReady("boss3shadow")) { const z = 360; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.85; ctx.drawImage(fxSheet("boss3shadow").img, Math.min(3, Math.floor(pr * 4)) * 256, 256, 256, 256, gx - z / 2, G - z * 0.85, z, z); ctx.restore(); }
                } else if (h.shape === "cross" && h.side) { /* 來襲方向的影子＋箭頭 */
                  const sx = h.x + h.side * 260; ctx.globalAlpha = 0.35 + 0.5 * pr; ctx.fillStyle = "#312e81"; ctx.strokeStyle = `rgba(${col}, 0.9)`;
                  ctx.beginPath(); ctx.moveTo(sx - 26, G); ctx.lineTo(sx + 26, G); ctx.lineTo(sx + 12, G - 150); ctx.lineTo(sx - 12, G - 150); ctx.closePath(); ctx.fill(); ctx.stroke();
                  ctx.beginPath(); ctx.moveTo(sx - h.side * 40, G - 90); ctx.lineTo(sx - h.side * (40 + 150 * pr), G - 90); ctx.stroke();
                }
              }
            } else {
              const a = Math.max(0, 1 - h.ft / 0.3); ctx.globalCompositeOperation = "lighter";
              if (h.shape === "low") { ctx.fillStyle = `rgba(${col}, ${0.85 * a})`; ctx.fillRect(h.x - hw, G - 46, h.w, 46); }
              else if (h.shape === "cross") { ctx.strokeStyle = `rgba(255, 255, 255, ${a})`; ctx.lineWidth = 10 * a + 2; ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(h.x + (h.side || 1) * 280, G - 150); ctx.lineTo(h.x - (h.side || 1) * 200, G - 60); ctx.stroke(); }
              else { const g = ctx.createLinearGradient(h.x - hw, 0, h.x + hw, 0); g.addColorStop(0, `rgba(${col}, 0)`); g.addColorStop(0.5, `rgba(255, 255, 255, ${0.9 * a})`); g.addColorStop(1, `rgba(${col}, 0)`); ctx.fillStyle = g; ctx.fillRect(h.x - hw, top, h.w, G - top + 6); }
            }
          } else if (!h.cut && h.art && fxReady(h.art[0])) { /* v0.8.216 生圖劍氣波（圖面向右；往左跑就鏡像） */
            const I = fxSheet(h.art[0]).img, z = h.low ? 420 : 640, col = Math.floor(now / 70) % 4;
            ctx.globalCompositeOperation = "lighter"; ctx.translate(h.x - h.dir * z * (h.low ? 0.3 : 0.15), h.low ? G - z * 0.42 : G - z * 0.45); ctx.scale(h.dir, 1);
            ctx.drawImage(I, col * 256, h.art[1] * 256, 256, 256, -z / 2, -z / 2, z, z);
          } else if (!h.cut && !h.sword && !h.leaf) { /* sword／leaf 波由該大招的 g.draw 畫生圖 */
            const x0 = h.dir > 0 ? h.x - h.depth : h.x, y0 = h.low ? G - 78 : top, fl = 0.75 + 0.25 * Math.sin(now / 60 + h.x * 0.01);
            const g = ctx.createLinearGradient(h.x - h.dir * h.depth, 0, h.x, 0); g.addColorStop(0, `rgba(${col}, 0)`); g.addColorStop(1, `rgba(${col}, ${0.85 * fl})`);
            ctx.fillStyle = g; ctx.fillRect(x0, y0, h.depth, G - y0 + 4);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * fl})`; ctx.fillRect(h.x - (h.dir > 0 ? 8 : 0), y0, 8, G - y0 + 4);
          }
          ctx.restore();
        }
        const U = Boss._ult;
        if (U && U.g && U.g.draw) U.g.draw(); /* v0.8.211 各大招自訂佔位繪製 */
        if (U && U.kind === "g_s6" && U.blastT > 0) { ctx.save(); ctx.fillStyle = `rgba(185, 28, 28, ${Math.min(0.7, U.blastT * 1.6)})`; ctx.fillRect(Game.camera.x - 1500, top - 200, 4400, 1400); ctx.restore(); }
      }
      function drawGultTop() {
        if (Game.mode !== "battle") return;
        const U = Boss._ult;
        if (U && U.kind === "g_s6" && Boss.state === "ult") { /* 血神子蓄力條＋護體 */
          const pr = Math.min(1, U.t / 6.5), y = Boss.y - 250;
          ctx.save(); ctx.fillStyle = "rgba(15,23,42,0.85)"; ctx.fillRect(Boss.x - 90, y, 180, 12); ctx.fillStyle = pr > 0.75 ? "#ef4444" : "#f97316"; ctx.fillRect(Boss.x - 90, y, 180 * pr, 12);
          ctx.font = "800 16px 'Noto Serif TC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fecaca"; ctx.fillText(U.broken ? "護體已碎：砍他！" : "血神大法蓄力中（護體無敵）", Boss.x, y - 8);
          ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(239, 68, 68, ${0.25 + 0.3 * pr})`; ctx.beginPath(); ctx.arc(Boss.x, Boss.y - 300 - 30 * pr, 24 + 46 * pr, 0, Math.PI * 2); ctx.fill();
          if (!U.broken) { ctx.strokeStyle = "rgba(165, 243, 252, 0.85)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(Boss.x, Boss.y - 105, 115, 150, 0, 0, Math.PI * 2); ctx.stroke(); }
          ctx.restore();
        }
        drawMech();
        const c = guCue(); if (!c || c.tl <= 0 || c.tl > 0.35 || Config.parryCueLevel <= 0) return;
        const pr = 1 - c.tl / 0.35, x = Player.x, y = Player.y - 70;
        if (fxReady("cue")) {
          const img = fxSheet("cue").img, dia = 240 - 180 * pr, col = c.tl <= 0.05 ? 3 : (pr < 0.35 ? 0 : pr < 0.7 ? 1 : 2), fr = [0.9, 0.7, 0.35, 0.9][col], cs = col === 3 ? 260 : dia / fr;
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 + 0.5 * pr; ctx.drawImage(img, col * 256, c.row * 256, 256, 256, x - cs / 2, y - cs / 2, cs, cs); ctx.restore();
        } else { ctx.save(); ctx.strokeStyle = c.row ? "#f87171" : "#fde047"; ctx.lineWidth = 4; ctx.globalAlpha = 0.5 + 0.5 * pr; ctx.beginPath(); ctx.arc(x, y, 120 - 90 * pr, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      }
      /* ---------- 關卡機制 ---------- */
      function mechInit(stage) {
        Boss._gd = stage.guard ? { n: stage.guard.hits, down: 0, pc: 0 } : null;
        Boss._form = 1; Boss._mHp = null; Boss._shellT = 0; Boss._bodyStance = null; Boss._shellOpen = false; Game.plats = []; Player._floor = null; xwInit(); Boss._plOn = false; Boss._rideT = 0; Boss._shake = 0;
      }
      function mechRefund(k) { /* 把這一幀 Boss 掉的血退還 k（0～1）；回傳是否有掉血 */
        let hit = false;
        if (Boss._mHp != null && Boss.hp < Boss._mHp && Boss.hp > 0 && Boss.state !== "staggered" && Player.state !== "execution") { hit = true; if (k > 0 && Boss.hp > 1) Boss.hp = Math.min(Boss._mHp, Boss.hp + (Boss._mHp - Boss.hp) * k); }
        return hit;
      }
      function mechTick(dt) {
        if (Game.mode !== "battle") return;
        const stage = Stages[Boss.stageId]; if (!stage) return;
        xwTick(dt); /* v0.8.182 玄武巨型部位戰 */
        if (stage.gbox && Boss._bodyStance !== Boss.stance) { Boss._bodyStance = Boss.stance; applyBossBody(stage); } /* 換姿態時同步身體大小（玄武） */
        const live = Boss.hp > 0 && !Game.bossDeath && !Game.dir && Game.introT <= 0;
        /* 第 7 關一階段 金光盾：盾在時氣血傷害只剩 guard.k；完美招架一次裂一道，裂滿＝破盾 guard.down 秒（全額傷害＋架勢 +25） */
        const gd = Boss._gd;
        if (gd && stage.guard && live && Config.bossPhase === 1) {
          const C = stage.guard;
          if (gd.down > 0) { gd.down -= dt; if (gd.down <= 0) { gd.n = C.hits; spawnFloatingText(Boss.x, Boss.y - 180, "〔金光盾・重聚〕", "#fde68a", 1.1); } }
          else {
            if (Progress.parryCount > gd.pc && gd.pc >= 0) {
              gd.n -= Progress.parryCount - gd.pc;
              if (gd.n <= 0) { gd.n = 0; gd.down = C.down; damageBossPosture(25, null); spawnFloatingText(Boss.x, Boss.y - 180, "〔金光盾・碎！〕全力進攻", "#fde047", 1.4); Sound.play("mikiri", 0.9, 1.0); addTrauma(0.3); if (fxReady("spark")) spawnFx("spark", 3, Boss.x, Boss.y - 110, { w: 380, dur: 0.5 }); }
              else spawnFloatingText(Boss.x, Boss.y - 180, `金光盾裂 ${C.hits - gd.n}/${C.hits}`, "#fde68a", 1.1);
            }
            if (gd.n > 0 && mechRefund(1 - C.k)) { gd.blk = 0.18; if ((gd.msg = (gd.msg || 0) - 1) <= 0) { gd.msg = 3; spawnFloatingText(Boss.x, Boss.y - 150, "金光盾擋下（完美招架才能破盾）", "#fde68a", 0.95); } hintOnce("m_guard", "天將有【金光盾】，直接砍幾乎無效：完美招架他 3 次，盾就會碎"); }
          }
          gd.blk = Math.max(0, (gd.blk || 0) - dt);
        }
        if (gd) gd.pc = Progress.parryCount;
        /* 第 7 關二階段 玄武（v0.8.181 平台版）：龜背＋浮石是平台。站在地面砍＝硬殼只剩 shell.k；
           站在高處（浮石、龜背、空中）砍到頭尾＝全額；破綻（收招、破防、喘息）時地面也全額。
           在龜背上站太久會被「甩殼」震落（起跳可躲）。 */
        if (stage.shell && Config.bossPhase === 2 && Game.mode === "battle") {
          const G = Config.groundY, C = stage.shell;
          if (!Boss._plOn) { Boss._plOn = true; Game.plats = [{ x: Boss.x, w: C.backW, y: G - Boss.h, shell: true }].concat(C.stones.map(x => ({ x, w: C.stoneW, y: G - C.stoneH }))); hintOnce("m_plat", "玄武的殼很硬：跳上【浮石】或【龜背】，從高處砍才有全額傷害（二段跳上得去）"); }
          const sp = Game.plats[0];
          if (sp && sp.shell) {
            const riding = !sp.off && Player._floor === sp.y && Player.y >= sp.y - 2;
            sp.y = G - Boss.h;
            if (riding) { Player.x += Boss.x - sp.x; Player.y = sp.y; Player._floor = sp.y; }
            sp.x = Boss.x; sp.off = Boss.y < G - 4 || !!Boss._introHide || Boss.hp <= 0 || !!Game.bossDeath;
            /* 甩殼：騎在背上累計 shakeAfter 秒 → 預警 shakeWarn 秒 → 還站在背上就被震落 */
            if (live && riding && !Boss._ult && Boss.state !== "staggered" && Player.state !== "execution") Boss._rideT += dt; else if (!riding) Boss._rideT = Math.max(0, Boss._rideT - dt * 0.5);
            if (Boss._shake > 0) {
              Boss._shake -= dt;
              if (Boss._shake <= 0) {
                Boss._rideT = 0; triggerShake(0, 0.6, 26, 0.3); Sound.play("hit", 0.9, 0.6);
                if (riding && Player.state !== "execution") { const d = Player.x >= Boss.x ? 1 : -1; if (Player.invulnTimer <= 0) takeDamage(bossDmg(C.shakeDmg), d, "【甩殼震落】"); Player.vy = -520; Player.vx = d * 520; Player.y -= 6; Player.x = Boss.x + d * (C.backW * 0.5 + 50); }
                else spawnFloatingText(Player.x, Player.y - 95, "躲過甩殼！", "#34d399", 1.0);
              }
            } else if (Boss._rideT >= C.shakeAfter && live) { Boss._shake = C.shakeWarn; spawnFloatingText(Boss.x, G - Boss.h - 60, "〔龜背震動——跳！〕", "#fca5a5", 1.25); Sound.play("peril", 0.8, 0.9); }
          }
          const stOpen = Boss.state === "recover" || Boss.state === "staggered" || Boss.state === "frozen" || Boss.state === "grounded";
          const high = Player.y < G - 90;
          Boss._shellOpen = stOpen || high;
          if (live && !Boss._shellOpen && mechRefund(1 - C.k)) { Boss._shellT = 0.2; if ((Boss._shMsg = (Boss._shMsg || 0) - 1) <= 0) { Boss._shMsg = 3; spawnFloatingText(Boss.x, G - Boss.h - 40, "硬殼！跳到高處再砍", "#93c5fd", 1.0); } }
          Boss._shellT = Math.max(0, Boss._shellT - dt);
        } else if (Boss._plOn) { Boss._plOn = false; Game.plats = []; }
        Boss._mHp = Boss.hp;
      }
      /* 三階段（第 8 關）：二階段血見底後的處決被「天道」彈開 → 進三階段（血條換成 hp3 補滿、換姿態 C） */
      function mechPhase3Intercept() {
        const stage = Stages[Boss.stageId];
        if (!stage || !stage.hp3 || Boss._form >= 3 || Config.bossPhase !== 2 || Boss.hp > 1) return false;
        Boss._form = 3; Boss.maxHp = stage.hp3; Boss.hp = Boss.maxHp; Boss.lastHp = Boss.hp; Boss._mHp = Boss.hp; Boss._fillT = performance.now(); Boss._hpOut = false;
        Boss.posture = 0; Boss.state = "recover"; Boss.stateTimer = 1.8; Boss.stateDur = 1.8; Boss.isPerilous = false; Boss._sigNext = 0;
        if (stage.stances && stage.stances.C) { Boss.stance = "C"; Boss.stanceCount = 0; applyBossBody(stage); }
        Player.invulnTimer = Math.max(Player.invulnTimer, 1.2); blastPlayer(Player.x >= Boss.x ? 1 : -1);
        Game.flashWhiteOverlay = 1.0; triggerHitstopMs(120); triggerShake(0, 0.8, 44, 0.7); hapticBuzz([60, 40, 120]); Sound.play("execution", 1.0, 0.6);
        showBanner(stage.form3Name || "三階段", "天　道　附　體", 1800, "#fde68a");
        spawnFloatingText(Boss.x, Boss.y - 190, "〔處決被天道彈開！〕", "#fde047", 1.4);
        const rb = document.getElementById("boss-realm-badge"); if (rb) rb.textContent = "三階段・天道附體";
        return true;
      }
      function drawMech() {
        const stage = Stages[Boss.stageId]; if (!stage || Boss.hp <= 0 || Boss._introHide) return;
        const gd = Boss._gd;
        if (gd && stage.guard && Config.bossPhase === 1 && gd.n > 0) { /* 金光盾：面前一道弧，裂幾道少幾段 */
          const f = Boss.facing, cx = Boss.x + f * 20, cy = Boss.y - 100;
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = gd.blk > 0 ? 12 : 7; ctx.strokeStyle = gd.blk > 0 ? "rgba(255,255,255,0.95)" : "rgba(253, 224, 71, 0.8)"; ctx.shadowColor = "#fde047"; ctx.shadowBlur = 16;
          const seg = 1.9 / stage.guard.hits;
          for (let i = 0; i < gd.n; i++) { const a0 = -0.95 + i * seg + 0.05, a1 = a0 + seg - 0.1; ctx.beginPath(); if (f > 0) ctx.arc(cx, cy, 120, a0, a1); else ctx.arc(cx, cy, 120, Math.PI - a1, Math.PI - a0); ctx.stroke(); }
          ctx.restore();
        }
        if (stage.shell && Config.bossPhase === 2 && Game.mode === "battle") { /* 玄武：頭尾弱點標記（高處才打得到全額） */
          const open = Boss._shellOpen, y = Boss.y - Boss.h + 26, f = Boss.facing;
          [[f * (Boss.w * 0.5 + 34), "頭"], [-f * (Boss.w * 0.5 + 34), "尾"]].forEach(([ox, ch]) => {
            ctx.save(); ctx.font = "800 20px 'Noto Serif TC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(15,23,42,0.85)"; ctx.beginPath(); ctx.arc(Boss.x + ox, y, 24, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = open ? "#fde047" : (Boss._shellT > 0 ? "#ffffff" : "#93c5fd"); ctx.lineWidth = open ? 4 : 2.5; ctx.stroke(); ctx.fillStyle = open ? "#fde047" : "#93c5fd"; ctx.fillText(ch, Boss.x + ox, y + 7); ctx.restore();
          });
        }
      }
      function hpTrigTry(stage) { /* 鏡像 AI（第 9 關）也要能放血量門檻大招 */
        if (!stage.hpTriggers || Boss.aiCooldown > 0 || (Boss.state !== "idle" && Boss.state !== "approach")) return false;
        Boss._hpt = Boss._hpt || {};
        for (const ht of stage.hpTriggers) {
          if (!Boss._hpt[ht.move] && stage.moves[ht.move] && Config.bossPhase >= (ht.phase || 1) && Boss.hp / Boss.maxHp <= ht.at) { Boss._hpt[ht.move] = true; triggerBossMove(ht.move); return true; }
        }
        return false;
      }
      /* ---------- v0.8.181 平台（主角可站的單向平台；目前只有第 7 關玄武用） ----------
         Game.plats=[{x 中心, w 寬, y 頂面, off 停用}]；platResolve 每幀算腳下地面 Player._floor；PG() 取代主角相關的 Config.groundY。
         單向：從下面跳上去會穿過，往下掉時才會站住；走出邊緣就掉下去。 */
      Game.plats = [];
      function PG() { return Player._floor != null ? Player._floor : Config.groundY; }
      function platResolve(prevY) {
        let f = Config.groundY;
        if (Game.plats.length && Game.mode === "battle") for (const p of Game.plats) { if (!p.off && Math.abs(Player.x - p.x) <= p.w * 0.5 && prevY <= p.y + 2 && p.y < f) f = p.y; }
        Player._floor = f;
        if (Player.y < f - 6 && (Player.state === "idle" || Player.state === "move")) Player.state = "jump"; /* 走出平台邊緣＝落下 */
      }
      function platHighHit() { const st = Stages[Boss.stageId]; return !!(st && st.shell && Config.bossPhase === 2 && Player.y > Boss.y - Boss.h - 200); } /* 巨型 Boss：站在高處也砍得到 */
      function drawPlats() {
        if (Game.mode !== "battle" || !Game.plats.length) return;
        for (const p of Game.plats) {
          if (p.off) continue;
          ctx.save();
          if (p.shell) { const sh = Boss._shake > 0; ctx.strokeStyle = sh ? "#f87171" : "#fde68a"; ctx.lineWidth = sh ? 8 : 5; ctx.setLineDash(sh ? [] : [18, 8]); ctx.beginPath(); ctx.moveTo(p.x - p.w * 0.5, p.y + (sh ? Math.sin(performance.now() / 22) * 5 : 0)); ctx.lineTo(p.x + p.w * 0.5, p.y + (sh ? Math.cos(performance.now() / 22) * 5 : 0)); ctx.stroke(); }
          else { ctx.fillStyle = "#475569"; ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p.x - p.w * 0.5, p.y); ctx.lineTo(p.x + p.w * 0.5, p.y); ctx.lineTo(p.x + p.w * 0.36, p.y + 34); ctx.lineTo(p.x - p.w * 0.36, p.y + 34); ctx.closePath(); ctx.fill(); ctx.stroke(); }
          ctx.restore();
        }
      }
      /* v0.8.184 大招次佳解（使用者）：原本「只能瞬步／只能跳」的大招段，完美招架＝硬接：只受 25% 傷害、不硬直、被震退，沒有任何獎勵。
         正解（瞬步穿過、跳過、劈碎…）仍然是唯一能換到破綻或架勢的解法。回傳 true＝已硬接。 */
      function ultHardBlock(dmg, dir, label) {
        if (Player.state !== "parry" || performance.now() - Player.parryStartMs > getParryWindowMs(false) || Player.state === "execution") return false;
        zoneDamage(bossDmg(dmg) * 0.25, label || "【硬接】");
        Player.vx = (dir || -Player.facing) * 460; Player.stamina = Math.max(0, Player.stamina - 25); Player.staminaRecoverDelay = 0.6;
        Sound.play("block", 1.0, 0.75); Sound.play("parry", 0.6, 0.7); triggerHitstopMs(60); triggerShake(dir || 0, 0.3, 18, 0.25); hapticBuzz(30);
        spawnSparks(Player.x + (dir || 1) * -20, Player.y - 80, "block", dir || 1);
        spawnFloatingText(Player.x, Player.y - 125, "【硬接】只受輕傷", "#cbd5e1", 1.05);
        hintOnce("ult_hard", "完美招架能硬接大招、只受輕傷；但要換到破綻，還是得用正解（瞬步、跳、蓄力斬…）");
        return true;
      }
