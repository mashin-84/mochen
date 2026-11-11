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
          resolveBossStrike({ damage: h.dmg, parryPostureDmg: h.post });
          Boss.x = sx; Boss.isPerilous = sp; Boss.perilType = st; Boss.vx = svx;
          if (h.onParry && Progress.parryCount > pc) h.onParry(h);
          return;
        }
        if (Player.invulnTimer > 0) { perfectDodgeFx("【瞬步閃過】", 8); return; }
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
                if (inside && !(h.kind === "jump" && Player.y < G - 38)) guHit(h.src != null ? h.src : h.x, h);
                else if (inside && h.kind === "jump") spawnFloatingText(Player.x, Player.y - 95, "躍過！", "#34d399", 1.0);
                if (!h.quiet) { triggerShake(0, 0.3, h.w > 300 ? 22 : 10, 0.2); Sound.play(h.kind === "parry" ? "slash" : "hit", 0.6, 0.8); }
                if (h.onFire) h.onFire(h);
              }
            } else { h.ft += dt; if (h.ft > 0.3) H.splice(i, 1); }
          } else {
            h.x += h.dir * h.speed * dt;
            if (h.x < -500 || h.x > Config.worldWidth + 500 || h.t > 6) { H.splice(i, 1); continue; }
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
        Boss._introHide = false; Boss._gImm = false;
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
        Game.ultCam = dimOn ? 0.12 : -0.05; Game.ultFocus = dimOn ? true : 0.5;
        return true;
      }
      /* ---------- 各關大招時間軸 ---------- */
      const gSide = () => (Player.x >= Boss.x ? 1 : -1);
      const gClampX = (x) => Math.max(140, Math.min(Config.worldWidth - 140, x));
      function gVanish(on) { Boss._introHide = on; Boss._ultAir = on; if (fxReady("spark")) spawnFx("spark", 2, Boss.x, Boss.y - 100, { w: 300, dur: 0.35 }); Sound.play("mikiri", 0.5, on ? 1.7 : 1.3); }
      function gChain(ev, t0, gaps, mk) { let t = t0; gaps.forEach((gp, i) => { t += gp; const at = t, idx = i; ev.push([at, () => mk(idx)]); }); return t; }
      const GULT = {
        /* 第 4 關 人形劍魂「六劍朝宗」：六把劍左右交錯橫穿（逐把招架，第 5 把慢半拍）→ 六劍合一從天直落（紅圈追蹤，走開或瞬步）→ 劍插地喘息 */
        g_s4: (U) => {
          const ev = [], D = 0.85;
          ev.push([1.4, () => hintOnce("gu4", "大招【六劍朝宗】：六把劍輪流橫穿，逐把招架（黃圈）；最後天劍直落是紅圈，走開或瞬步！")]);
          let t = gChain(ev, 0.9 - D, [D, 0.5, 0.5, 0.5, 0.5, 0.85], (i) => guStrike({ x: Player.x, track: true, lock: 0.2, w: 190, delay: D, kind: "parry", dmg: 95, post: 9, src: Player.x + (i % 2 ? 1 : -1) * 300, side: i % 2 ? 1 : -1, shape: "cross", label: "【劍陣橫穿】" }));
          t += D;
          ev.push([t + 0.3, () => guStrike({ x: Player.x, track: true, lock: 0.45, w: 260, delay: 1.1, kind: "red", dmg: 260, shape: "pillar", label: "【天劍直落】" })]);
          return { ev, dim: [[0, 0.9]], rest: [t + 1.6, 2.2], restText: "〔劍魂力竭〕" };
        },
        /* 第 5 關 小狼「幽影噬月」：小狼化影消失 → 連續三次從天撲落（紅圈追蹤主角，持續移動或瞬步）→ 第三撲落地震出左右矮震波（跳）→ 伏地喘息 */
        g_s5a: (U) => {
          const ev = [];
          ev.push([1.4, () => hintOnce("gu5a", "大招【幽影噬月】：紅圈會追著你，連續移動或瞬步躲三次；最後一撲落地會震出矮波，要跳！")]);
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
            Boss._ultAir = !U.broken; Boss._gImm = !U.broken; hintOnce("gu6", "大招【血神大法】：老祖有魅月護體打不動！先去砍魅月（3 刀）破護體，再砍老祖一刀打斷蓄力");
            if (ptLive()) { const s = Boss.x >= Player.x ? -1 : 1; let x = Player.x + s * 430; if (x < 170 || x > Config.worldWidth - 170) x = Player.x - s * 430; p.x = gClampX(x); p.state = "ultchant"; p.kind = "shield"; p.t = 0; p.dur = CH; p.posture = 0; p.alpha = 1; spawnFloatingText(p.x, Config.groundY - 210, "魅月：奴家替老祖護法！", "#f9a8d4", 1.2); }
          }]);
          for (let t = 1.0; t < CH - 0.6; t += 1.3) ev.push([t, () => { if (!U.stop) guStrike({ x: Player.x, track: true, lock: 0.35, w: 150, delay: 0.75, kind: "red", dmg: 100, shape: "pillar", label: "【血柱】", quiet: true }); }]);
          ev.push([CH, () => {
            if (U.stop) return;
            Game.flashWhiteOverlay = 0.9; triggerShake(0, 0.8, 44, 0.6); hapticBuzz([60, 30, 90]); Sound.play("execution", 0.9, 0.6); U.blastT = 0.5;
            if (Player.state !== "execution") { if (Player.invulnTimer > 0) perfectDodgeFx("【瞬步避過血爆】", 10); else takeDamage(bossDmg(240), gSide(), "【血神爆】"); }
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
          ev.push([1.4, () => hintOnce("gu7a", "大招【天罡雷陣】：天雷是紅圈要走開；之後舉盾衝鋒是黃圈——完美招架能把他撞停、直接破盾！")]);
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
          ev.push([1.4, () => hintOnce("gu7b", "大招【玄冥噴泉】：水柱會一路掃過來，站到「沒有紅圈」的那一格；之後四隻腳連環踩下，躲完四下就能一次砍四隻腳！")]);
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
          ev.push([1.4, () => hintOnce("gu8a", "大招【天河劍訣】：五把飛劍逐把招架可折射回去；最後他會接【危】突刺——瞬步迎上去看破！")]);
          for (let i = 0; i < 5; i++) ev.push([0.9 + i * 0.45, () => { const dir = gSide(); Boss.facing = dir; Game.flyingSwords.push({ x: Boss.x + dir * 50, y: Config.groundY - 170 + (i % 3) * 35, vx: dir * 780, vy: 0, dir, damage: 105, reflected: false, life: 2.6, color: "#7dd3fc", trajectory: "linear", kind: null }); Sound.play("flysword", 0.7, 1 + i * 0.06); Boss._kickMs = performance.now(); }]);
          const g = { ev, dim: [[0, 0.8]], rest: [3.5, 0.01] };
          g.tick = () => { if (U.t >= 3.45 && !U.fin) { U.fin = true; const st = Stages[Boss.stageId]; ultEnd(false); Boss.aiCooldown = 0; triggerBossMove(st.moves.a_thrust ? "a_thrust" : "thrust_peril"); } };
          return g;
        },
        /* 第 8 關二階段（魔染）「無相魔影殺」：四道魔影站在主角左右，依序撲殺（逐下招架，越來越快，第 4 下慢半拍）→ 真身從背後擒拿（紅圈，瞬步）→ 喘息 */
        g_s8b: (U) => {
          const ev = [], D = 0.8;
          ev.push([1.4, () => hintOnce("gu8b", "大招【無相魔影殺】：四道魔影輪流撲來，逐下招架（黃圈）；最後真身的擒拿是紅圈，瞬步閃開！")]);
          ev.push([0.6, () => gVanish(true)]);
          let t = gChain(ev, 0.9 - D, [D, 0.55, 0.45, 0.4, 0.8], (i) => guStrike({ x: Player.x, track: true, lock: 0.2, w: 190, delay: D, kind: "parry", dmg: 100, post: 10, src: Player.x + (i % 2 ? 1 : -1) * 260, side: i % 2 ? 1 : -1, shape: "cross", label: "【魔影撲殺】" }));
          t += D;
          ev.push([t + 0.25, () => guStrike({ x: Player.x, track: true, lock: 0.3, w: 200, delay: 0.85, kind: "red", dmg: 300, shape: "pillar", label: "【無相擒拿】", onFire: (h) => { Boss.x = gClampX(h.x - Player.facing * 90); gVanish(false); Boss.facing = gSide(); } })]);
          return { ev, dim: [[0, t + 1.1]], rest: [t + 1.3, 2.2], restText: "〔魔氣反噬・破綻〕" };
        },
        /* 第 8 關三階段（天道附體）「天劫・萬象歸墟」期末考：劫雷找空格 ×2 → 矮劫波（跳）→ 頂天劫牆（瞬步穿）→ 天罰五連（逐下招架，最後一下慢）→ 長喘息 */
        g_s8c: (U) => {
          const ev = [], W = Config.worldWidth, cell = 210, D = 0.8;
          ev.push([1.4, () => hintOnce("gu8c", "大招【萬象歸墟】：劫雷找沒有紅圈的空格 → 矮波用跳 → 高牆用瞬步 → 最後五連逐下招架。把學過的全用上！")]);
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
          ev.push([1.4, () => hintOnce("gu9", "大招【三念歸一】：看預警顏色——黃圈招架、貼地紅帶要跳、紅圈走開或瞬步")]);
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
                if (h.shape === "cross" && h.side) { /* 來襲方向的影子＋箭頭 */
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
          } else if (!h.cut) {
            const x0 = h.dir > 0 ? h.x - h.depth : h.x, y0 = h.low ? G - 78 : top, fl = 0.75 + 0.25 * Math.sin(now / 60 + h.x * 0.01);
            const g = ctx.createLinearGradient(h.x - h.dir * h.depth, 0, h.x, 0); g.addColorStop(0, `rgba(${col}, 0)`); g.addColorStop(1, `rgba(${col}, ${0.85 * fl})`);
            ctx.fillStyle = g; ctx.fillRect(x0, y0, h.depth, G - y0 + 4);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * fl})`; ctx.fillRect(h.x - (h.dir > 0 ? 8 : 0), y0, 8, G - y0 + 4);
          }
          ctx.restore();
        }
        const U = Boss._ult;
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
