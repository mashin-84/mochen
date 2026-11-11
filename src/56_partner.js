      /* ===== v0.8.179 第 6 關 雙 Boss 同場（灰盒）：同伴引擎 =====
         Stages[n].partner＝同伴設定（魅月仙子）；Stages[n].pools＝固定血池（依階段）。
         主 Boss（化血老祖）走一般 Boss AI；同伴是輕量單位：站遠處詠唱「護體／回春」、放飛花騷擾。
         玩家要選：追過去打斷魅月（背後有老祖），或頂著護盾硬打老祖。
         - 詠唱中被任何一刀打到＝打斷；心神（posture）打滿＝失神 stun 秒，護盾立刻碎。
         - 飛花可招架折射，折射打回魅月＝打斷＋心神。
         - 護盾：老祖受到的氣血與架勢只剩 shieldK（每幀比對差額退還，不動其他傷害程式）。
         灰盒美術全部是程式畫的佔位（待換生圖）。 */
      function ptDef() { const s = Stages[Boss.stageId]; return s && s.partner; }
      function ptLive() { const p = Game.partner; return !!(p && Game.mode === "battle" && p.state !== "gone"); }
      function ptHittable() { const p = Game.partner; return ptLive() && p.alpha > 0.6 && p.state !== "blink"; }
      function partnerInit(stage) {
        Game.partner = null; Game.pools = []; Boss._ptShield = 0; Boss._ptHp = null;
        const d = stage.partner; if (!d) return;
        Game.partner = { x: Math.min(Config.worldWidth - 200, Boss.x + 520), facing: -1, state: "idle", t: 0, cd: d.firstCd || 3.5, kind: null, posture: 0, alpha: 0, blinkCd: 0, shots: 0, seq: 0, healCd: 0, hitT: 0, bob: Math.random() * 6 };
        poolsSet(stage, 1);
      }
      function poolsSet(stage, phase) {
        const L = (stage.pools && stage.pools[phase]) || [];
        Game.pools = L.map(p => ({ x: p[0], w: p[1], t: 0, tick: 0 }));
        Game._poolPhase = phase;
      }
      function ptFarX() { /* 魅月想站的位置：隔著老祖、離主角 keep 以上；靠牆就換另一邊 */
        const d = ptDef(), W = Config.worldWidth;
        let s = Boss.x >= Player.x ? 1 : -1;
        let x = Player.x + s * d.keep;
        if (x > W - 170 || x < 170) { s = -s; x = Player.x + s * d.keep; }
        return Math.max(170, Math.min(W - 170, x));
      }
      function ptInterrupt(text) {
        const p = Game.partner;
        if (p.state === "chant" || p.state === "petal") {
          p.state = "flinch"; p.t = 0.8; p.cd = ptDef().cdAfterBreak || 3.0; p.kind = null;
          spawnFloatingText(p.x, Config.groundY - 190, text || "〔打斷詠唱〕", "#fde047", 1.25);
          Sound.play("parry", 0.8, 1.5);
          return true;
        }
        return false;
      }
      function ptAddPosture(n) {
        const p = Game.partner, d = ptDef();
        if (p.state === "stun") return;
        p.posture = Math.min(d.maxPosture, p.posture + n); p.hitT = 0.14;
        if (p.posture >= d.maxPosture) {
          p.state = "stun"; p.t = Config.bossPhase === 2 ? d.stunP2 : d.stun; p.kind = null;
          if (Boss._ptShield > 0) { Boss._ptShield = 0; spawnFloatingText(Boss.x, Boss.y - 170, "〔月華護體・碎〕", "#a5f3fc", 1.2); }
          spawnFloatingText(p.x, Config.groundY - 200, "〔魅月・心神失守〕", "#f9a8d4", 1.35);
          Sound.play("mikiri", 0.9, 1.2); triggerHitstopMs(80); addTrauma(0.3);
          if (fxReady("spark")) spawnFx("spark", 3, p.x, Config.groundY - 110, { w: 340, dur: 0.5 });
        }
      }
      /* 主角攻擊判定：魅月比老祖近且在範圍內 → 打到魅月（回傳 true，老祖不受傷） */
      function partnerTryHit(air) {
        if (!ptHittable()) return false;
        const p = Game.partner;
        const reach = (air ? (Player.isDive ? 100 : 135) : (Player.isChargedAttack ? 175 : Player.comboStep === 3 ? 165 : 140)) * CHAR_K + 30;
        const dx = p.x - Player.x, d = Math.abs(dx);
        const ok = (air && Player.isDive) ? d <= reach : (dx * Player.facing >= -30 && d <= reach);
        if (!ok || d >= Math.abs(Boss.x - Player.x)) return false;
        const D = ptDef().hit, k = air ? D.air : Player.isChargedAttack ? D.charged : Player.comboStep === 3 ? D.third : D.normal;
        ptInterrupt();
        ptAddPosture(k);
        spawnSparks(p.x, Config.groundY - 90, "hit", Player.facing);
        if (fxReady("spark")) spawnFx("spark", 0, p.x, Config.groundY - 95, { w: 260, dur: 0.3 });
        Sound.play("hit", 0.9, 1.25); triggerHitstopMs(45); addTrauma(0.14);
        return true;
      }
      function partnerAimX(best) { /* aimX 用：魅月比目前目標近就面向她 */
        if (!ptHittable()) return best;
        const p = Game.partner;
        return Math.abs(p.x - Player.x) < Math.abs(best - Player.x) ? p.x : best;
      }
      function partnerReflectHit(sw) { /* 折射的飛花／血錐打回魅月 */
        if (!ptHittable()) return false;
        const p = Game.partner;
        if (Math.abs(sw.x - p.x) > 46 || sw.y < Config.groundY - 260 || sw.y > Config.groundY + 6) return false;
        ptInterrupt("〔折射打斷〕"); ptAddPosture(ptDef().hit.reflect);
        spawnSparks(sw.x, sw.y, "hit", -sw.dir); Sound.play("hit", 1.0, 1.2); triggerHitstopMs(50);
        return true;
      }
      function ptPickCast() {
        const p = Game.partner, d = ptDef();
        const hpR = Boss.hp / Boss.maxHp;
        const order = d.order; /* 固定輪替，玩家可預期：飛花 → 護體 → 飛花 → 回春… */
        for (let i = 0; i < order.length; i++) {
          const k = order[(p.seq + i) % order.length];
          if (k === "shield" && Boss._ptShield > 0) continue;
          if (k === "heal" && (hpR > d.heal.below || Boss.hp <= Boss.maxHp * 0.03 || p.healCd > 0)) continue;
          p.seq = (p.seq + i + 1) % order.length;
          return k;
        }
        return "petal";
      }
      function ptStartCast(k) {
        const p = Game.partner, d = ptDef();
        p.kind = k; p.facing = Player.x >= p.x ? 1 : -1;
        if (k === "petal") { p.state = "petal"; p.t = 0; p.shots = 0; Sound.play("peril", 0.45, 1.6); }
        else {
          p.state = "chant"; p.t = 0; p.dur = d[k].chant * (Config.bossPhase === 2 ? d.fastP2 : 1);
          spawnFloatingText(p.x, Config.groundY - 210, k === "shield" ? "魅月：月華護體…" : "魅月：回春月露…", k === "shield" ? "#a5f3fc" : "#86efac", 1.15);
          Sound.play("assist", 0.6, k === "shield" ? 1.3 : 1.0);
          hintOnce("pt_chant", "魅月仙子在詠唱！衝過去砍她一刀就能打斷；放著不管，老祖會得到護盾或回血");
        }
      }
      function ptFinishCast() {
        const p = Game.partner, d = ptDef();
        if (p.kind === "shield") {
          Boss._ptShield = d.shield.dur; Boss._ptHp = Boss.hp; Boss._ptPos = Boss.posture;
          spawnFloatingText(Boss.x, Boss.y - 170, "〔月華護體〕傷害大減", "#a5f3fc", 1.3);
          if (fxReady("spark")) spawnFx("spark", 2, Boss.x, Boss.y - 110, { w: 420, dur: 0.5 });
          Sound.play("block", 0.9, 0.8);
          hintOnce("pt_shield", "老祖有【月華護體】：氣血與架勢傷害只剩三成。把魅月打到失神，護盾會立刻碎");
        } else if (p.kind === "heal") {
          const amt = Math.round(Boss.maxHp * d.heal.amt);
          Boss.hp = Math.min(Boss.maxHp, Boss.hp + amt); Boss.lastHp = Boss.hp; Boss._ptHp = Boss.hp; p.healCd = d.heal.cd;
          spawnFloatingText(Boss.x, Boss.y - 170, "〔回春月露〕老祖回血", "#86efac", 1.3);
          if (fxReady("heal_fx")) spawnFx("heal_fx", 1, Boss.x, Boss.y - 100, { w: 360, dur: 0.6 });
          Sound.play("gourd", 0.8, 1.2);
        }
        p.state = "idle"; p.kind = null;
        p.cd = (d.cd[0] + Math.random() * (d.cd[1] - d.cd[0])) * (Config.bossPhase === 2 ? d.fastP2 : 1);
      }
      function ptShoot() {
        const p = Game.partner, d = ptDef().petal;
        const dir = Player.x >= p.x ? 1 : -1; p.facing = dir;
        Game.flyingSwords.push({ x: p.x + dir * 40, y: Config.groundY - 150 + (p.shots % 2) * 40, vx: dir * d.speed, vy: 0, dir, damage: d.damage, reflected: false, life: 3.2, color: "#f9a8d4", trajectory: "linear", kind: null, fromPartner: true });
        Sound.play("flysword", 0.7, 1.35 + p.shots * 0.08);
      }
      function partnerUpdate(dt) {
        const p = Game.partner; if (!p || Game.mode !== "battle") return;
        const d = ptDef(), stage = Stages[Boss.stageId];
        /* 血池：站在裡面持續扣血（跳起、瞬步無敵時不算）；二階段換成兩池 */
        if (Config.bossPhase !== Game._poolPhase) { poolsSet(stage, Config.bossPhase); hintOnce("pt_pool2", "血池擴大了！踩進去會持續扣血，用跳或瞬步越過"); }
        const live = !Game.dir && Game.introT <= 0 && !DLG.active && !Game.cutsceneActive && Boss.hp > 0 && !Game.bossDeath && !Boss._introHide;
        for (const z of Game.pools) {
          z.t += dt;
          if (!live) continue;
          if (Math.abs(Player.x - z.x) <= z.w * 0.5 && Player.y >= Config.groundY - 20 && Player.invulnTimer <= 0 && Player.state !== "execution") {
            z.tick -= dt;
            if (z.tick <= 0) { z.tick = 0.3; zoneDamage(stage.poolDps * 0.3, "身陷血池！"); hintOnce("pt_pool", "腳下是血池：站在裡面會持續扣血，用跳或瞬步越過"); }
          } else z.tick = Math.min(z.tick, 0.12);
        }
        /* 護盾：把這一幀老祖掉的氣血／漲的架勢退還 (1 - shieldK) */
        if (Boss._ptShield > 0) {
          Boss._ptShield -= dt;
          const k = 1 - d.shield.k;
          if (Boss._ptHp != null && Boss.hp < Boss._ptHp && Boss.hp > 0 && Boss.state !== "staggered" && Player.state !== "execution") Boss.hp = Math.min(Boss._ptHp, Boss.hp + (Boss._ptHp - Boss.hp) * k);
          if (Boss._ptPos != null && Boss.posture > Boss._ptPos && Boss.state !== "staggered" && !Boss._hpOut) Boss.posture = Boss._ptPos + (Boss.posture - Boss._ptPos) * d.shield.k;
          Boss._ptHp = Boss.hp; Boss._ptPos = Boss.posture;
          if (Boss._ptShield <= 0) spawnFloatingText(Boss.x, Boss.y - 170, "〔月華護體・散〕", "#94a3b8", 1.0);
        }
        if (Boss.hp <= 0 || Game.bossDeath) { if (p.state !== "gone") { p.state = "gone"; Boss._ptShield = 0; spawnFloatingText(p.x, Config.groundY - 200, "魅月：老祖……！", "#f9a8d4", 1.1); } p.alpha = Math.max(0, p.alpha - dt * 1.2); return; }
        if (!live) { if (Boss._introHide || Game.introT > 0 || Game.dir) p.alpha = Math.max(0, p.alpha - dt * 4); return; }
        p.bob += dt; p.hitT = Math.max(0, p.hitT - dt); p.blinkCd = Math.max(0, p.blinkCd - dt); p.healCd = Math.max(0, p.healCd - dt);
        if (p.state !== "blink") p.alpha = Math.min(1, p.alpha + dt * 3);
        if (p.state !== "stun") p.posture = Math.max(0, p.posture - d.decay * dt);
        const distP = Math.abs(Player.x - p.x);
        if (p.state === "idle") {
          p.facing = Player.x >= p.x ? 1 : -1;
          const tx = ptFarX(), dx = tx - p.x;
          if (Math.abs(dx) > 30) p.x += Math.sign(dx) * Math.min(Math.abs(dx), d.speed * dt);
          if (distP < d.fleeAt && p.blinkCd <= 0) { p.state = "blink"; p.t = 0; p.blinkCd = d.blinkCd; Sound.play("mikiri", 0.5, 1.7); return; }
          if (Boss.state === "staggered" || Player.state === "execution") return; /* 老祖破防、處決演出時不出手 */
          p.cd -= dt;
          if (p.cd <= 0) ptStartCast(ptPickCast());
        } else if (p.state === "chant") {
          p.t += dt;
          if (p.t >= p.dur) ptFinishCast();
        } else if (p.state === "petal") {
          p.t += dt;
          const P = d.petal, n = Config.bossPhase === 2 ? P.countP2 : P.count;
          while (p.shots < n && p.t >= P.windup + p.shots * P.gap) { ptShoot(); p.shots++; }
          if (p.t >= P.windup + (n - 1) * P.gap + P.recover) { p.kind = "petal_done"; ptFinishCast(); }
        } else if (p.state === "flinch") {
          p.t -= dt; if (p.t <= 0) p.state = "idle";
        } else if (p.state === "stun") {
          p.t -= dt;
          if (p.t <= 0) { p.posture = 0; p.state = "blink"; p.t = 0; p.blinkCd = d.blinkCd; p.cd = 2.0; }
        } else if (p.state === "blink") { /* 幻渡：0.3 秒淡出 → 換位 → 0.3 秒淡入 */
          p.t += dt;
          if (p.t < 0.3) p.alpha = Math.max(0, 1 - p.t / 0.3);
          else { if (!p._moved) { p._moved = true; p.x = ptFarX(); } p.alpha = Math.min(1, (p.t - 0.3) / 0.3); }
          if (p.t >= 0.6) { p._moved = false; p.state = "idle"; p.cd = Math.max(p.cd, 0.8); }
        }
        p.x = Math.max(120, Math.min(Config.worldWidth - 120, p.x));
      }
      /* ---- 繪製（灰盒：程式畫佔位，待換生圖） ---- */
      function drawPools() {
        if (Game.mode !== "battle" || !Game.pools || !Game.pools.length) return;
        const G = Config.groundY;
        for (const z of Game.pools) {
          const a = Math.min(1, z.t * 1.5);
          ctx.save(); ctx.globalAlpha = a;
          const g = ctx.createRadialGradient(z.x, G + 6, 10, z.x, G + 6, z.w * 0.55);
          g.addColorStop(0, "rgba(127, 29, 29, 0.92)"); g.addColorStop(0.7, "rgba(153, 27, 27, 0.75)"); g.addColorStop(1, "rgba(153, 27, 27, 0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(z.x, G + 6, z.w * 0.55, 26, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(248, 113, 113, 0.9)"; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]);
          ctx.beginPath(); ctx.moveTo(z.x - z.w * 0.5, G + 2); ctx.lineTo(z.x + z.w * 0.5, G + 2); ctx.stroke(); ctx.setLineDash([]);
          for (let i = 0; i < 4; i++) { /* 冒泡 */
            const ph = (z.t * 0.7 + i * 0.27) % 1, bx = z.x + Math.sin(i * 12.9 + Math.floor(z.t * 0.7 + i * 0.27) * 7.1) * z.w * 0.38;
            ctx.globalAlpha = a * (1 - ph) * 0.8; ctx.fillStyle = "#fca5a5";
            ctx.beginPath(); ctx.arc(bx, G - ph * 46, 3 + 3 * (1 - ph), 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
      }
      function drawPartner() {
        const p = Game.partner; if (!p || Game.mode !== "battle" || p.alpha <= 0.01) return;
        const d = ptDef(), G = Config.groundY, now = performance.now();
        const fy = G - 14 - Math.sin(p.bob * 2.2) * 6 + (p.state === "stun" ? 14 : 0);
        ctx.save(); ctx.globalAlpha = p.alpha;
        /* 影子 */
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(p.x, G + 2, 46, 9, 0, 0, Math.PI * 2); ctx.fill();
        /* 詠唱：腳下光圈＋連到老祖的光線 */
        if (p.state === "chant") {
          const col = p.kind === "shield" ? "165, 243, 252" : "134, 239, 172", pr = p.t / p.dur;
          ctx.strokeStyle = `rgba(${col}, ${0.35 + 0.3 * Math.sin(now / 90)})`; ctx.lineWidth = 3 + pr * 5; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -now / 14;
          ctx.beginPath(); ctx.moveTo(p.x, fy - 120); ctx.quadraticCurveTo((p.x + Boss.x) / 2, fy - 330, Boss.x, Boss.y - 120); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = `rgba(${col}, 0.9)`; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(p.x, G + 2, 70 + pr * 30, 14 + pr * 6, 0, 0, Math.PI * 2); ctx.stroke();
        }
        /* 身體（佔位：長裙剪影） */
        const sway = p.state === "stun" ? 0 : Math.sin(p.bob * 2.2) * 4;
        ctx.fillStyle = p.hitT > 0 ? "#ffffff" : p.state === "stun" ? "#9d7fa8" : "#d8b4fe";
        ctx.strokeStyle = "#581c87"; ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (p.state === "stun") { ctx.moveTo(p.x - 52, fy); ctx.lineTo(p.x + 52, fy); ctx.lineTo(p.x + 20, fy - 95); ctx.lineTo(p.x - 20, fy - 95); }
        else { ctx.moveTo(p.x - 44 + sway, fy); ctx.lineTo(p.x + 44 + sway, fy); ctx.lineTo(p.x + 17, fy - 150); ctx.lineTo(p.x - 17, fy - 150); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        const hy = p.state === "stun" ? fy - 112 : fy - 172;
        ctx.fillStyle = p.hitT > 0 ? "#ffffff" : "#fde8ef"; ctx.beginPath(); ctx.arc(p.x + p.facing * 3, hy, 21, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#1e1b4b"; ctx.beginPath(); ctx.arc(p.x - p.facing * 5, hy - 5, 22, Math.PI * 0.9, Math.PI * 2.05); ctx.fill();
        /* 手上的光（飛花前搖：粉；詠唱：青／綠） */
        if (p.state === "petal" || p.state === "chant") {
          const c = p.state === "petal" ? "249, 168, 212" : p.kind === "shield" ? "165, 243, 252" : "134, 239, 172";
          const r = 14 + 8 * Math.sin(now / 70);
          const g = ctx.createRadialGradient(p.x + p.facing * 34, fy - 130, 2, p.x + p.facing * 34, fy - 130, r + 16);
          g.addColorStop(0, `rgba(${c}, 0.95)`); g.addColorStop(1, `rgba(${c}, 0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x + p.facing * 34, fy - 130, r + 16, 0, Math.PI * 2); ctx.fill();
        }
        if (p.state === "stun") { ctx.font = "800 22px 'Noto Serif TC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fde047"; ctx.fillText("失神 " + Math.ceil(p.t), p.x, hy - 40); }
        /* 頭上：名字、心神條、詠唱條 */
        const by = hy - 44 - (p.state === "stun" ? 26 : 0);
        ctx.font = "700 15px 'Noto Serif TC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#f5d0fe"; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 5;
        ctx.fillText(d.name, p.x, by - 16); ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(15,23,42,0.8)"; ctx.fillRect(p.x - 46, by - 8, 92, 7);
        ctx.fillStyle = "#f59e0b"; ctx.fillRect(p.x - 46, by - 8, 92 * (p.state === "stun" ? 1 : p.posture / d.maxPosture), 7);
        if (p.state === "chant") {
          ctx.fillStyle = "rgba(15,23,42,0.8)"; ctx.fillRect(p.x - 46, by + 3, 92, 7);
          ctx.fillStyle = p.kind === "shield" ? "#67e8f9" : "#4ade80"; ctx.fillRect(p.x - 46, by + 3, 92 * Math.min(1, p.t / p.dur), 7);
        }
        ctx.restore();
      }
      function drawPartnerTop() { /* 老祖護盾光殼＋魅月在畫面外時的邊緣提示 */
        const p = Game.partner; if (!p || Game.mode !== "battle") return;
        const now = performance.now();
        if (Boss._ptShield > 0 && Boss.hp > 0) {
          const d = ptDef(), a = Math.min(1, Boss._ptShield / 1.2) * (0.55 + 0.2 * Math.sin(now / 120));
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = `rgba(165, 243, 252, ${a})`; ctx.lineWidth = 5; ctx.shadowColor = "#67e8f9"; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.ellipse(Boss.x, Boss.y - 105, 105, 140, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(165, 243, 252, ${a * 0.12})`; ctx.fill();
          ctx.restore();
          ctx.save(); ctx.fillStyle = "rgba(15,23,42,0.75)"; ctx.fillRect(Boss.x - 60, Boss.y - 262, 120, 6);
          ctx.fillStyle = "#67e8f9"; ctx.fillRect(Boss.x - 60, Boss.y - 262, 120 * Math.max(0, Boss._ptShield / d.shield.dur), 6); ctx.restore();
        }
        if (p.state === "gone" || p.alpha < 0.3 || (p.state !== "chant" && p.state !== "petal")) return;
        const cam = Game.camera, half = Config.baseWidth * 0.5 / cam.zoom, cx = cam.x + Config.baseWidth * 0.5;
        const L = cx - half + 46, R = cx + half - 46;
        if (p.x >= L - 30 && p.x <= R + 30) return;
        const ex = p.x < L ? L : R, ey = Config.groundY - 250, dir = p.x < L ? -1 : 1;
        const col = p.state === "petal" ? "#f9a8d4" : p.kind === "shield" ? "#67e8f9" : "#4ade80";
        ctx.save(); ctx.globalAlpha = 0.75 + 0.25 * Math.sin(now / 100);
        ctx.fillStyle = "rgba(15,23,42,0.85)"; ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ex, ey, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (p.state === "chant") { ctx.beginPath(); ctx.arc(ex, ey, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.t / p.dur)); ctx.lineWidth = 7; ctx.stroke(); }
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ex + dir * 46, ey); ctx.lineTo(ex + dir * 32, ey - 11); ctx.lineTo(ex + dir * 32, ey + 11); ctx.closePath(); ctx.fill();
        ctx.font = "800 20px 'Noto Serif TC', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff";
        ctx.fillText(p.state === "petal" ? "花" : p.kind === "shield" ? "盾" : "癒", ex, ey + 7);
        ctx.restore();
      }
