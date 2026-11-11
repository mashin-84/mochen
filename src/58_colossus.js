      /* ===== v0.8.182 第 7 關二階段 玄武神相：超大型部位戰（灰盒；使用者 2026-11-11 定案設計卡，見 HANDOFF v0.8.182） =====
         Stages[n].colossus＝設定；Game.xw＝狀態。身體蓋住半個背景、不可打；Boss 物件＝「頭」（平常浮在空中俯視、打不到）。
         循環：等牠出手 → 腳踩下來停住（plant 秒）→ 砍腳（扣血＋少量架勢，砍 crackHits 下＝該腳裂）→ 四腳都裂＝暈眩 stun 秒：
           身體趴低、龜殼變平台 → 跳上去到尾巴旁砍（主要輸出，蓄力斬最痛）。
         架勢：招架彈回冰柱、完美招架噬咬為主（砍腳砍尾最多加到 60%）→ 架勢滿＝頭落地 → 處決。
         招式：踩踏（離主角最近、還沒裂的腳；紅圈＝走開或瞬步）、尾巴橫掃全場（貼地紅帶＝跳）、冰柱三連（可招架折射）、噬咬（黃圈＝招架）。
         ⚠ 全部程式畫的佔位，待換生圖（背景大身體、四腳、尾、頭）。 */
      function xwDef() { const s = Stages[Boss.stageId]; return s && s.colossus; }
      function xwOn() { const X = Game.xw; return !!(X && X.on && Game.mode === "battle"); }
      function xwInit() { Game.xw = null; }
      function xwStart() {
        const C = xwDef(), G = Config.groundY;
        Game.xw = { on: true, cx: C.cx, legs: C.legX.map(ox => ({ home: C.cx + ox, x: C.cx + ox, st: "up", t: 0, crack: 0, hitT: 0 })), act: null, cd: 1.6, stun: 0, last: "", n: 0, low: 0, headT: 0, bite: 0, ultDone: false };
        Boss.w = C.headW; Boss.h = C.headH; Boss.x = Math.min(Config.worldWidth - 200, Player.x + 300); Boss.y = G - C.hover;
        showBanner("玄武神相", "天　門　鎮　守", 1600, "#93c5fd");
        hintOnce("xw_intro", "玄武太大了，平常打不到：等牠的腳踩下來停住時砍腳；四隻腳都砍裂，牠就會倒下");
      }
      function xwLegsHit() { const X = Game.xw; return X.legs.filter(l => l.st === "plant"); }
      function xwTailX() { return Game.xw.cx + xwDef().tailX; }
      function xwPlant(i, x, dur) { /* 第 i 隻腳踩在 x，停 dur 秒 */
        const X = Game.xw, l = X.legs[i]; l.x = x; l.st = "plant"; l.t = dur; l.slam = 0.18;
        emitDust(x, Config.groundY, 1, 6, 1.6); emitDust(x, Config.groundY, -1, 6, 1.6);
        if (fxReady("land")) spawnFx("land", 1, x, Config.groundY + 10, { anchor: "b", w: 420, dur: 0.5 });
      }
      function xwStompStrike(i, o) { /* 預警圈跟著主角，鎖定後腳踩下 */
        const C = xwDef(), X = Game.xw, l = X.legs[i]; l.st = "aim";
        return guStrike(Object.assign({ x: Player.x, track: true, lock: 0.35, w: C.stompW, delay: C.stompWind, kind: "red", dmg: C.stompDmg, shape: "pillar", label: "【玄武踏地】", xwLeg: i, lo: l.home - C.legReach, hi: l.home + C.legReach,
          onFire: (h) => xwPlant(i, h.x, C.plant) }, o || {}));
      }
      function xwStun() {
        const X = Game.xw, C = xwDef(), G = Config.groundY;
        X.stun = C.stun; X.act = null; GU.hz = GU.hz.filter(h => h.xwLeg == null && !h.xw);
        X.legs.forEach(l => { l.st = "down"; l.t = 0; l.x = l.home; });
        Game.plats = [{ x: X.cx, w: C.shellW, y: G - C.shellLow }];
        Game.flashWhiteOverlay = 0.6; triggerHitstopMs(110); triggerShake(0, 0.9, 44, 0.7); hapticBuzz([60, 40, 120]); Sound.play("execution", 0.9, 0.6);
        spawnFloatingText(Player.x, Player.y - 150, "〔四足盡裂・玄武倒地！〕跳上龜殼砍尾巴", "#fde047", 1.4);
        hintOnce("xw_stun", "玄武倒下了！跳上龜殼（二段跳），跑到左邊的尾巴旁，用蓄力斬砍最痛");
      }
      function xwStunEnd() {
        const X = Game.xw; X.stun = 0; Game.plats = []; X.cd = 1.4;
        X.legs.forEach(l => { l.st = "up"; l.crack = 0; l.t = 0; });
        triggerShake(0, 0.6, 26, 0.4); Sound.play("peril", 0.8, 0.6);
        spawnFloatingText(Boss.x, Boss.y - 80, "〔玄武起身〕", "#93c5fd", 1.2);
      }
      /* 主角出刀：砍得到的部位＝停住的腳（地面）、暈眩時的尾巴（要站在龜殼上） */
      function xwTargets() {
        const X = Game.xw, G = Config.groundY, L = [];
        if (Boss.state === "staggered") return L;
        if (Player.y >= G - 150) xwLegsHit().forEach(l => L.push({ x: l.x, leg: l, half: 60 }));
        if (X.stun > 0 && Player.y < G - 120) L.push({ x: xwTailX(), tail: true, half: 70 });
        return L;
      }
      function xwTryHit(air) {
        if (!xwOn() || Boss.hp <= 0) return false;
        const X = Game.xw, C = xwDef();
        const reach = (air ? (Player.isDive ? 100 : 135) : (Player.isChargedAttack ? 175 : Player.comboStep === 3 ? 165 : 140)) * CHAR_K;
        let hit = null, hd = 1e9;
        for (const t of xwTargets()) { const dx = t.x - Player.x, d = Math.abs(dx); if ((dx * Player.facing >= -40 || d < t.half) && d <= reach + t.half && d < hd) { hd = d; hit = t; } }
        if (!hit) return false;
        const kind = Player.isChargedAttack ? "charged" : air ? "air" : Player.comboStep === 3 ? "third" : "normal";
        const D = hit.tail ? C.tailHit : C.legHit, d = D[kind];
        Boss.hp = Math.max(1, Boss.hp - d[0]); Boss.flashFrames = 2;
        damageBossPosture(d[1], null, null, false, true);
        const y = hit.tail ? Config.groundY - C.shellLow - 60 : Config.groundY - 90;
        spawnSparks(hit.x, y, "hit", Player.facing); if (fxReady("spark")) spawnFx("spark", 0, hit.x, y, { w: hit.tail ? 380 : 280, dur: 0.3 });
        spawnFloatingText(hit.x, y - 50, "-" + d[0], hit.tail ? "#fde047" : "#fecaca", hit.tail ? 1.3 : 1.0);
        Sound.play("hit", 0.95, hit.tail ? 0.8 : 1.0); triggerHitstopMs(kind === "charged" ? 100 : hit.tail ? 70 : 45); addTrauma(kind === "charged" ? 0.4 : 0.15);
        if (hit.tail) { X.tailT = 0.15; }
        else {
          const l = hit.leg; l.hitT = 0.14;
          if (l.crack < C.crackHits) {
            l.crack = Math.min(C.crackHits, l.crack + d[2]);
            if (l.crack >= C.crackHits) {
              const n = X.legs.filter(q => q.crack >= C.crackHits).length;
              spawnFloatingText(l.x, Config.groundY - 190, `〔足裂 ${n}/4〕`, "#fdba74", 1.25); Sound.play("mikiri", 0.7, 1.1);
              if (n >= 4) xwStun();
            }
          }
        }
        return true;
      }
      function xwAimX(best) {
        if (!xwOn() || Boss.state === "staggered") return best;
        let b = Player.x + Player.facing * 10, bd = 1e9;
        for (const t of xwTargets()) { const d = Math.abs(t.x - Player.x); if (d < bd && d < 420) { bd = d; b = t.x; } }
        return b;
      }
      /* 每幀（mechTick 呼叫）：腳的計時、暈眩、頭的姿態、冰柱折射導向 */
      function xwTick(dt) {
        const stage = Stages[Boss.stageId]; if (!stage || !stage.colossus || Game.mode !== "battle") return;
        if (Config.bossPhase !== 2) return;
        if (!Game.xw) { if (Game.dir || Boss.hp <= 0) return; xwStart(); }
        const X = Game.xw, C = xwDef(), G = Config.groundY;
        const dead = Boss.hp <= 0 || !!Game.bossDeath;
        X.low += ((X.stun > 0 || dead ? 1 : 0) - X.low) * Math.min(1, dt * 5); /* 身體趴低的比例 */
        X.tailT = Math.max(0, (X.tailT || 0) - dt);
        for (const l of X.legs) {
          l.hitT = Math.max(0, l.hitT - dt); l.slam = Math.max(0, (l.slam || 0) - dt);
          if (l.st === "aim") { const h = GU.hz.find(q => q.xwLeg === X.legs.indexOf(l) && !q.done); if (h) { h.x = Math.max(h.lo, Math.min(h.hi, h.x)); l.x += (h.x - l.x) * Math.min(1, dt * 10); } else if (l.st === "aim") l.st = "up"; }
          else if (l.st === "plant") { l.t -= dt; if (l.t <= 0) { l.st = "lift"; l.t = 0.5; } }
          else if (l.st === "lift") { l.t -= dt; if (l.t <= 0) l.st = "up"; }
          else if (l.st === "up") l.x += (l.home - l.x) * Math.min(1, dt * 3);
        }
        if (X.stun > 0 && !dead) { if (Player.state !== "execution") X.stun -= dt; if (X.stun <= 0) xwStunEnd(); }
        if (dead) { Game.plats = []; return; }
        /* 頭（Boss 物件）：破防＝落地可處決；處決後的硬直也留在地上；其餘時間浮在空中、打不到、不畫方塊 */
        const down = Boss.state === "staggered" || (Boss.state === "recover" && !Boss._ult && X.wasDown);
        if (down) {
          if (!X.wasDown) { X.wasDown = true; X.act = null; GU.hz = GU.hz.filter(h => h.xwLeg == null && !h.xw); X.legs.forEach(l => { if (l.st === "aim") l.st = "up"; });
            Boss.staggerTimer = Math.max(Boss.staggerTimer, C.headDown); Boss.x = Math.max(160, Math.min(Config.worldWidth - 160, Player.x + (Boss.x >= Player.x ? 1 : -1) * 230));
            triggerShake(0, 0.8, 36, 0.5); spawnFloatingText(Boss.x, G - 190, "〔玄武垂首！〕貼近處決", "#fde047", 1.4); }
          Boss.y = G; Boss._introHide = false; Boss._ultAir = false;
        } else {
          if (X.wasDown) { X.wasDown = false; X.cd = 1.2; }
          Boss._introHide = true; Boss._ultAir = true; Boss.vx = 0;
          const tx = Math.max(X.cx - 900, Math.min(X.cx + 1200, Player.x + 300)), ty = G - C.hover + Math.sin(performance.now() / 600) * 10;
          if (X.bite > 0) { X.bite -= dt; const p = Math.sin(Math.min(1, 1 - X.bite / 0.45) * Math.PI); Boss.x += (X.biteX - Boss.x) * Math.min(1, dt * 14); Boss.y = ty + (G - 150 - ty) * p; }
          else { Boss.x += (tx - Boss.x) * Math.min(1, dt * 2.2); Boss.y += (ty - Boss.y) * Math.min(1, dt * 6); }
          Boss.facing = Player.x >= Boss.x ? 1 : -1;
          if (Boss.state !== "ult" && Boss.state !== "recover") Boss.state = "idle";
        }
        /* 冰柱：落地消失；被折射＝轉向飛回頭部（之後走引擎原本的「折射命中 Boss」：氣血與架勢看 Stages[n].reflectDmg） */
        for (let i = Game.flyingSwords.length - 1; i >= 0; i--) {
          const sw = Game.flyingSwords[i]; if (!sw.xw) continue;
          if (sw.reflected) { const dx = Boss.x - sw.x, dy = (Boss.y - Boss.h * 0.5) - sw.y, d = Math.hypot(dx, dy) || 1; sw.vx = dx / d * 1000; sw.vy = dy / d * 1000; sw.life = Math.max(sw.life, 0.5); }
          else if (sw.y >= G - 4) { spawnSparks(sw.x, G - 6, "block", 1); Game.flyingSwords.splice(i, 1); }
        }
      }
      /* AI（updateBossAI 開頭呼叫）：回傳 true＝這一幀由玄武接管 */
      function xwAI(dt) {
        if (!xwOn()) return false;
        const X = Game.xw, C = xwDef(), G = Config.groundY;
        if (Boss.state === "staggered" || X.wasDown || Boss.hp <= 0 || Game.bossDeath) return false; /* 頭落地：交回一般流程（破防計時、處決） */
        Boss.nextImpactIn = 999; Boss.isPerilous = false;
        if (X.stun > 0 || Game.dir || Player.state === "execution") return true;
        if (X.act) {
          const a = X.act; a.t += dt;
          if (a.k === "stomp") { const l = X.legs[a.i]; if (a.t > C.stompWind + 0.1 && l.st !== "plant" && l.st !== "aim") X.act = null; }
          else if (a.k === "ice") { while (a.n < C.ice.count && a.t >= C.ice.wind + a.n * C.ice.gap) { a.n++; const sx = Boss.x, sy = Boss.y - 30, dx = Player.x - sx, dy = (Player.y - 80) - sy, d = Math.hypot(dx, dy) || 1; Game.flyingSwords.push({ x: sx, y: sy, vx: dx / d * C.ice.speed, vy: dy / d * C.ice.speed, dir: dx >= 0 ? 1 : -1, damage: C.ice.dmg, reflected: false, life: 4, color: "#bae6fd", trajectory: "linear", kind: null, xw: true }); Sound.play("flysword", 0.8, 0.8 + a.n * 0.06); X.headT = 0.15; } if (a.t >= C.ice.wind + C.ice.count * C.ice.gap + 0.5) X.act = null; }
          else if (a.t >= a.dur) X.act = null;
          if (!X.act) X.cd = C.cd;
          return true;
        }
        X.cd -= dt; if (X.cd > 0) return true;
        /* 半血必放一次招牌大招 */
        const st = Stages[Boss.stageId];
        if (!X.ultDone && Boss.hp / Boss.maxHp <= 0.5 && st.moves.u_fountain) { X.ultDone = true; X.legs.forEach(l => { if (l.st !== "plant") l.st = "up"; }); triggerBossMove("u_fountain"); return true; }
        /* 選招：踩踏為主；同一招不連出；每 4 招至少一次遠程（給玩家招架累積架勢的機會） */
        const cand = X.legs.map((l, i) => ({ l, i })).filter(o => o.l.crack < C.crackHits && o.l.st === "up" && Math.abs(Player.x - o.l.home) <= C.legReach + 60).sort((a, b) => Math.abs(Player.x - a.l.home) - Math.abs(Player.x - b.l.home));
        const W = [];
        if (cand.length) W.push(["stomp", X.last === "stomp" ? 5 : 7]);
        if (X.last !== "tail") W.push(["tail", 2]);
        if (X.last !== "ice") W.push(["ice", X.n - (X.lastIce || 0) >= 3 ? 9 : 3]);
        if (X.last !== "bite") W.push(["bite", 2.5]);
        let tot = 0; W.forEach(w => tot += w[1]); let r = Math.random() * tot, k = W[0][0]; for (const w of W) { r -= w[1]; if (r <= 0) { k = w[0]; break; } }
        X.last = k; X.n++;
        if (k === "stomp") { xwStompStrike(cand[0].i); X.act = { k, i: cand[0].i, t: 0 }; Sound.play("peril", 0.6, 0.7); }
        else if (k === "tail") { guStrike({ x: X.cx, w: 7000, delay: C.tail.wind, kind: "jump", dmg: C.tail.dmg, shape: "low", label: "【蛇尾橫掃】", xw: true, onFire: () => { X.sweepT = 0.35; } }); X.act = { k, t: 0, dur: C.tail.wind + 0.6 }; X.tailWarn = C.tail.wind; Sound.play("peril", 0.9, 0.9); hintOnce("xw_tail", "尾巴高高舉起＝全場橫掃，看到貼地紅帶就【跳】"); }
        else if (k === "ice") { X.lastIce = X.n; X.act = { k, t: 0, n: 0 }; X.headT = C.ice.wind; Sound.play("assist", 0.6, 0.7); hintOnce("xw_ice", "玄武吐冰柱：招架可以彈回去打牠的頭，累積架勢；架勢滿了頭會垂下來，就能處決"); }
        else { guStrike({ x: Player.x, track: true, lock: 0.25, w: 210, delay: C.bite.wind, kind: "parry", dmg: C.bite.dmg, post: C.bite.post, shape: "ring", label: "【玄蛇噬咬】", xw: true, onFire: (h) => { X.bite = 0.45; X.biteX = h.x; } }); X.bite = 0; X.act = { k, t: 0, dur: C.bite.wind + 0.7 }; X.headT = C.bite.wind; Sound.play("peril", 0.7, 1.2); }
        return true;
      }
      /* ---- 繪製（佔位） ---- */
      function drawXwBack() {
        if (!xwOn()) return;
        const X = Game.xw, C = xwDef(), G = Config.groundY, now = performance.now();
        const low = X.low * C.lowDrop, belly = G - C.belly + low, top = G - C.shellTop + low * 1.6, hw = C.shellW * 0.5 + 120;
        ctx.save();
        /* 尾巴（左端）：橫掃預警時高舉、掃過時甩到地面 */
        const tx = xwTailX() - 150, warn = X.act && X.act.k === "tail" ? Math.min(1, X.act.t / C.tail.wind) : 0;
        ctx.strokeStyle = X.tailT > 0 ? "#ffffff" : warn > 0 ? "#f87171" : "#0f3b3a"; ctx.lineWidth = 46; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(X.cx - hw + 120, belly - 60); ctx.quadraticCurveTo(tx - 160, belly - 100 - 260 * warn + low * 0.3, tx - 60 + 120 * warn, belly - 20 - 300 * warn + (X.stun > 0 ? 60 : 0)); ctx.stroke();
        /* 龜殼大身體 */
        const g = ctx.createLinearGradient(0, top, 0, belly); g.addColorStop(0, "#1f5f5b"); g.addColorStop(1, "#0b2f33");
        ctx.fillStyle = g; ctx.strokeStyle = "#5eead4"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(X.cx - hw, belly); ctx.quadraticCurveTo(X.cx - hw + 40, top - 60, X.cx, top - 90); ctx.quadraticCurveTo(X.cx + hw - 40, top - 60, X.cx + hw, belly); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "rgba(94, 234, 212, 0.35)"; ctx.lineWidth = 3;
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(X.cx + i * 230, belly - 10); ctx.lineTo(X.cx + i * 190, top - 40); ctx.stroke(); }
        /* 暈眩：龜殼頂面（平台）與尾巴弱點 */
        if (X.stun > 0) {
          const py = G - C.shellLow; ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 6; ctx.setLineDash([20, 10]); ctx.beginPath(); ctx.moveTo(X.cx - C.shellW * 0.5, py); ctx.lineTo(X.cx + C.shellW * 0.5, py); ctx.stroke(); ctx.setLineDash([]);
          const wx = xwTailX(), pu = 0.6 + 0.4 * Math.sin(now / 110);
          ctx.fillStyle = `rgba(253, 224, 71, ${0.25 * pu})`; ctx.strokeStyle = "#fde047"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(wx, py - 70, 62, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.font = "900 34px 'Noto Serif TC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fde047"; ctx.fillText("尾", wx, py - 58);
          ctx.font = "800 22px 'Noto Serif TC', serif"; ctx.fillText("倒地 " + Math.ceil(X.stun), X.cx, py - 30);
        }
        /* 四隻腳 */
        X.legs.forEach((l) => {
          const cracked = l.crack >= C.crackHits;
          let fy = G - C.legUp + Math.sin(now / 500 + l.home) * 8;
          if (l.st === "aim") fy = G - C.legUp - 40;
          else if (l.st === "plant") fy = G;
          else if (l.st === "lift") fy = G - C.legUp * (1 - l.t / 0.5);
          else if (l.st === "down") fy = G;
          const w = C.legW;
          ctx.fillStyle = l.hitT > 0 ? "#ffffff" : cracked ? "#7c4a1e" : "#134e4a"; ctx.strokeStyle = l.st === "plant" ? "#fde047" : cracked ? "#fdba74" : "#5eead4"; ctx.lineWidth = l.st === "plant" ? 5 : 3;
          ctx.beginPath(); ctx.moveTo(l.x - w * 0.36, belly - 30); ctx.lineTo(l.x + w * 0.36, belly - 30); ctx.lineTo(l.x + w * 0.5, fy); ctx.lineTo(l.x - w * 0.5, fy); ctx.closePath(); ctx.fill(); ctx.stroke();
          if (l.crack > 0) { ctx.strokeStyle = "#fdba74"; ctx.lineWidth = 3; const n = Math.ceil(l.crack); for (let i = 0; i < n; i++) { const y0 = fy - 30 - i * 44; ctx.beginPath(); ctx.moveTo(l.x - 30, y0); ctx.lineTo(l.x - 4, y0 - 20); ctx.lineTo(l.x + 12, y0 - 6); ctx.lineTo(l.x + 32, y0 - 30); ctx.stroke(); } }
          if (l.st === "plant" && X.stun <= 0) { ctx.fillStyle = "rgba(15,23,42,0.8)"; ctx.fillRect(l.x - 50, G - 250, 100, 7); ctx.fillStyle = "#fde047"; ctx.fillRect(l.x - 50, G - 250, 100 * Math.max(0, l.t / C.plant), 7); ctx.font = "800 18px 'Noto Serif TC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fde047"; ctx.fillText(cracked ? "已裂" : "砍！", l.x, G - 262); }
        });
        if (X.sweepT > 0) { X.sweepT -= 0.016; ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(248, 113, 113, ${Math.min(0.8, X.sweepT * 3)})`; ctx.fillRect(Game.camera.x - 1500, G - 70, 4400, 70); }
        ctx.restore();
      }
      function drawXwFront() { /* 頭與頸（畫在主角之上；頭落地時由一般 Boss 方塊代表，這裡只畫頸） */
        if (!xwOn() || Boss.hp <= 0) return;
        const X = Game.xw, C = xwDef(), G = Config.groundY, now = performance.now();
        const low = X.low * C.lowDrop, nx = X.cx + C.shellW * 0.5 + 60, ny = G - C.belly - 60 + low, hx = Boss.x, hy = Boss.y - Boss.h * 0.5;
        ctx.save(); ctx.strokeStyle = "#3f9c8f"; ctx.lineWidth = 54; ctx.lineCap = "round"; ctx.globalAlpha = 0.92;
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.quadraticCurveTo((nx + hx) / 2, Math.min(ny, hy) - 140, hx - Boss.facing * 40, hy); ctx.stroke(); ctx.globalAlpha = 1;
        if (Boss._introHide) {
          const glow = X.headT > 0; if (glow) X.headT -= 0.016;
          ctx.fillStyle = Boss.flashFrames > 0 ? "#ffffff" : "#7dd3c0"; ctx.strokeStyle = glow ? "#e0f2fe" : "#042f2e"; ctx.lineWidth = glow ? 8 : 5; if (glow) { ctx.shadowColor = "#bae6fd"; ctx.shadowBlur = 26; }
          ctx.beginPath(); ctx.ellipse(hx, hy, C.headW * 0.5, C.headH * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
          ctx.fillStyle = "#b91c1c"; ctx.beginPath(); ctx.arc(hx + Boss.facing * 40, hy - 12, 11, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#0b2f33"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx + Boss.facing * 20, hy + 22); ctx.lineTo(hx + Boss.facing * 78, hy + 16); ctx.stroke();
        }
        ctx.restore();
      }
