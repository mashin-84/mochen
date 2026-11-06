      /* =========================================================================
       * v0.8.83 M3 部位 Boss 引擎（第 4 關萬劍古靈灰盒；第 7 關金甲天將＋玄武沿用）
       * Stages[n].parts 有設定的關卡：loadStage → partsInit 建立 Boss._pp。
       * 一階段（_pp.phase 1）：Boss 本體不可打；updateBossAI 交給 partsAI；主角攻擊只判部位（partsTryHit）；
       *   折射飛劍打回部位（partsReflectHit）；架勢（招架、師弟妹）改加在部位（partsPosture）；
       *   Boss.state／moveType／isPerilous 每幀照部位招式同步（HUD、smoke 用）。
       * 轉場（phase "t"）→ 二階段（phase 2）：回到一般 Boss AI（核心），部位只剩演出與偶爾壓掌（partsSideAI）。
       * 判定規則照 mochen-action-combat：傷害一律經 resolveBossStrike（可招架／危招）或 takeDamage（不可招架、有預警）。
       * 灰盒：全部用方塊與線條畫，之後生圖換掉 drawParts*。
       * ========================================================================= */
      function partsDef() { const s = Stages[Boss.stageId]; return s && s.parts; }
      function partsMode() { return !!(Boss._pp && Boss._pp.phase === 1 && Game.mode === "battle"); }
      function partsBusy() { return !!(Boss._pp && Boss._pp.phase !== 2 && Game.mode === "battle"); } /* 一階段或轉場：Boss 本體不可打 */

      function partsInit(stage) {
        Boss._pp = null;
        if (!stage || !stage.parts) return;
        const G = Config.groundY, sx = 1700;
        const hand = (side) => ({ side, x: sx + side * 420, y: G - 330, tx: sx + side * 420, ty: G - 330, posture: 0, pdelay: 0, flash: 0, brokenT: 0, busy: false });
        Boss._pp = {
          phase: 1, seals: stage.parts.seals || 3, act: null, side: null, cd: 1.4, hist: [], skyMiss: 0, spiritX: sx,
          sword: { x: sx + 280, tip: G - 120, ang: 0, tx: sx + 280, ttip: G - 120, mode: "hover", flash: 0, glow: 0 },
          hands: [hand(-1), hand(1)], marks: [], shards: [], tt: 0, coreX: sx, p2t: 8, pauseT: 0
        };
        Boss.x = sx;
      }

      /* ---------- 命中主角 ---------- */
      /* 可招架／危招：借 resolveBossStrike（危招三解、招架窗口、無敵幀、替身照原規則），把 Boss 位置暫時換成部位位置 */
      function partStrike(srcX, move) {
        if (Player.state === "execution") return;
        const sx = Boss.x, sp = Boss.isPerilous, st = Boss.perilType, sv = Boss.vx;
        Boss.x = srcX; Boss.isPerilous = !!move.isPerilous; Boss.perilType = move.perilType || null;
        resolveBossStrike(move);
        Boss.x = sx; Boss.isPerilous = sp; Boss.perilType = st; Boss.vx = sv;
      }
      /* 不可招架（有地面預警的壓落、斬落、劍雨）：閃避無敵可躲，否則 takeDamage */
      function partHitPlayer(srcX, move, tag) {
        if (Player.state === "execution") return;
        if (!move.unblockable) { partStrike(srcX, move); return; }
        if (Player.invulnTimer > 0) { if (Player.state === "dash") perfectDodgeFx("【完美閃避】", 8); return; }
        takeDamage(move.damage, Player.x >= srcX ? 1 : -1, tag || "受創！");
      }

      /* ---------- 主角打部位 ---------- */
      function partsList() {
        const P = Boss._pp, G = Config.groundY, L = [];
        if (!P) return L;
        for (const h of P.hands) if (h.y > G - 175) L.push({ id: "hand", ref: h, x: h.x, top: h.y - 150, bot: h.y, hw: 100 });
        if (P.sword.mode === "stuck") L.push({ id: "seal", ref: P.sword, x: P.sword.x, top: G - 275, bot: G - 100, hw: 46 });
        return L;
      }
      function partsAimX() {
        let best = null, bd = 1e9;
        for (const p of partsList()) { const d = Math.abs(p.x - Player.x); if (d < bd && d < 520) { bd = d; best = p.x; } }
        return best;
      }
      /* 借 bossHitFx 的刀痕火花與 FEEL 回饋，暫時把 Boss 搬到部位上 */
      function partFx(x, y, kind) {
        const sx = Boss.x, sy = Boss.y, sv = Boss.vx, sf = Boss.flashFrames;
        Boss.x = x + Player.facing * 22; Boss.y = y + (Stages[Boss.stageId].sprite ? 150 : 88);
        bossHitFx(kind);
        Boss.x = sx; Boss.y = sy; Boss.vx = sv; Boss.flashFrames = sf;
      }
      function partsTryHit(air) {
        const dive = air && Player.isDive;
        const reach = (air ? (dive ? 100 : 135) : (Player.isChargedAttack ? 175 : Player.comboStep === 3 ? 165 : 140)) * CHAR_K;
        let best = null, bd = 1e9;
        for (const p of partsList()) {
          const dx = p.x - Player.x, edge = Math.max(0, Math.abs(dx) - p.hw);
          const front = dive || dx * Player.facing >= -30 || Math.abs(dx) <= p.hw;
          const vert = dive ? (Player.y >= p.top - 40 && Player.y <= p.bot + 10) : (p.top <= Player.y + 10 && p.bot >= Player.y - 230);
          /* 蓄力斬優先斬封印；普攻優先打手（封印普攻只會鏗一聲） */
          const pri = edge - ((p.id === "seal") === !!(!air && Player.isChargedAttack) ? 400 : 0);
          if (front && vert && edge <= reach && pri < bd) { bd = pri; best = p; }
        }
        if (!best) return false;
        partsOnHit(best, { charged: !air && Player.isChargedAttack, dive, heavy: !air && Player.comboStep === 3, riposte: Player.riposteAtk });
        if (dive) { Player.vy = -420; Player.vx = -Player.facing * 160; Player.stateTimer = 0.12; }
        return true;
      }
      function partsOnHit(p, k) {
        const D = partsDef(), P = Boss._pp, hy = (p.top + p.bot) * 0.5;
        if (p.id === "seal") {
          if (k.charged) { sealBreak(); return; }
          /* 普攻斬不斷：鏗一聲＋火花，提示蓄力 */
          p.ref.flash = 2;
          Sound.play("block", 0.9, 1.25);
          triggerHitstopMs(30);
          spawnSparks(p.x, hy, "block", Player.facing);
          partFx(p.x, hy, "block");
          spawnFloatingText(p.x, p.top - 20, "鏗！斬不斷", "#cbd5e1", 0.95);
          hintOnce("seal_charge", "封印要用【蓄力斬】才斬得斷：按住攻擊 0.45 秒（耗 25 劍勢）");
          setTelemetry("〔封印堅不可摧：按住攻擊鍵蓄力，以【蓄力重斬】斬斷劍柄封印！〕");
          return;
        }
        if (p.id === "hand") {
          const h = p.ref, HH = D.handHit;
          let amt = k.charged ? HH.charged : (k.heavy || k.dive) ? HH.heavy : HH.normal;
          if (k.riposte) { amt *= 2; Player.riposteAtk = false; }
          h.flash = 3;
          Sound.play("hit", 0.85, 0.9);
          Sound.play("s_hit", 0.6, 0.95);
          partFx(p.x, hy, k.charged || k.heavy || k.dive ? "heavy" : "hit");
          spawnSparks(p.x, hy, "hit", Player.facing);
          handPosture(h, amt);
          setTelemetry(`斬中巨手！巨手架勢 ${Math.round(h.posture)}%（打滿令古靈失衡、巨劍插地）`);
        }
      }
      /* 折射回去的飛劍：打中發射它的巨手（加架勢） */
      function partsReflectHit(sw) {
        const P = Boss._pp;
        for (const h of P.hands) {
          if (Math.abs(sw.x - h.x) < 110 && sw.y > h.y - 175 && sw.y < h.y + 15) {
            h.flash = 3;
            Sound.play("hit", 1.0, 1.1);
            triggerHitstopMs(60);
            spawnSparks(sw.x, sw.y, "hit", -sw.dir);
            handPosture(h, partsDef().handHit.reflect, "折射命中巨手！");
            swordImpactFx(sw);
            return true;
          }
        }
        return false;
      }
      /* 招架、師弟妹等原本加在 Boss 的架勢：一階段改加在離主角最近的巨手 */
      function partsPosture(amount, label) {
        const P = Boss._pp;
        let h = null, bd = 1e9;
        for (const c of P.hands) { if (c.brokenT > 0) continue; const d = Math.abs(c.x - Player.x); if (d < bd) { bd = d; h = c; } }
        if (h) handPosture(h, amount, label);
      }
      function handPosture(h, amt, label) {
        if (h.brokenT > 0) return;
        if (Progress.equippedSeals.includes("wenxin")) amt *= 2.0;
        h.posture = Math.min(partsDef().handPosture, h.posture + amt);
        h.pdelay = 3.0;
        if (label) spawnFloatingText(h.x, h.y - 190, label, "#fde047", 1.0);
        if (h.posture >= partsDef().handPosture) handBreak(h);
      }
      function handBreak(h) {
        const P = Boss._pp, G = Config.groundY;
        h.brokenT = 3.6; h.posture = 0; h.busy = false; h.ty = G; h.flash = 5;
        if (P.act && P.act.hand === h) actCancel(P.act), P.act = null;
        Sound.play("mikiri", 1.0, 0.85);
        triggerHitstopMs(90); addTrauma(0.45); hapticBuzz([30, 20, 50]);
        if (fxReady("spark")) spawnFx("spark", 3, h.x, h.y - 100, { w: 440, dur: 0.55 });
        spawnFloatingText(h.x, h.y - 210, "【巨手崩勢】古靈失衡！", "#ef4444", 1.3);
        setTelemetry("🔥 巨手架勢崩潰！古靈失衡，巨劍將插地露出封印 3 秒！");
        if (P.sword.mode === "stuck" && P.act && P.act.st === "stuck") { P.act.stuckT = Math.max(P.act.stuckT, P.act.t + 3.0); return; }
        if (P.act) actCancel(P.act);
        P.act = actStart("plant", h);
      }
      function sealBreak() {
        const P = Boss._pp, sw = P.sword, G = Config.groundY;
        P.seals--;
        sw.flash = 6;
        Sound.play("execution", 0.9, 1.25);
        Sound.play("parry", 1.0, 0.8);
        triggerHitstopMs(115); addTrauma(0.55); hapticBuzz([40, 30, 70]);
        Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + 0.08);
        spawnSparks(sw.x, G - 190, "execution", Player.facing);
        if (fxReady("spark")) spawnFx("spark", 3, sw.x, G - 190, { w: 520, dur: 0.6 });
        const dots = "●".repeat(P.seals) + "○".repeat((partsDef().seals || 3) - P.seals);
        spawnFloatingText(sw.x, G - 330, `封印斷！ ${dots}`, "#fde047", 1.4);
        setTelemetry(`★ 蓄力斬斬斷劍柄封印！剩餘封印 ${P.seals}`);
        Game.comboCount++; Game.comboTimer = 2.0;
        if (P.seals <= 0) { partsToPhase2(); return; }
        if (P.act && (P.act.key === "sky" || P.act.key === "plant")) { P.act.st = "pull"; P.act.t = 0; } /* 巨劍立刻拔起 */
        P.cd = Math.max(P.cd, 1.0);
      }

      /* ---------- 一階段招式（act 狀態機） ---------- */
      function nearHand(pref) {
        const P = Boss._pp;
        const ok = P.hands.filter(h => h.brokenT <= 0);
        if (!ok.length) return null;
        ok.sort((a, b) => Math.abs(a.x - Player.x) - Math.abs(b.x - Player.x));
        return ok[0];
      }
      function clampX(x) { return Math.max(140, Math.min(Config.worldWidth - 140, x)); }
      function actStart(key, hand) {
        const D = partsDef(), m = D.moves[key], P = Boss._pp, G = Config.groundY;
        const a = { key, m, st: "windup", t: 0, hand: hand || null, x: Player.x, s: 1, hit: false, shots: 0, waves: 0, stuckT: m.stuck || 0 };
        const needHand = key === "palm" || key === "finger" || key === "grab";
        if (needHand && !a.hand) a.hand = nearHand();
        if (needHand && !a.hand) return null;
        if (a.hand) a.hand.busy = true;
        if (key === "sweep") {
          a.s = (Player.x - P.spiritX >= 0) ? 1 : -1; /* 從主角外側（靠場邊那頭）掃回來 */
          if (Player.x + a.s * m.span * 0.5 > Config.worldWidth - 100 || Player.x + a.s * m.span * 0.5 < 100) a.s = -a.s;
          a.x0 = Player.x + a.s * m.span * 0.5; a.x1 = Player.x - a.s * m.span * 0.5;
        }
        if (key === "finger") { a.s = a.hand.x >= Player.x ? 1 : -1; a.x = clampX(Player.x + a.s * 520); }
        if (key === "grab") { a.s = a.hand.x >= Player.x ? 1 : -1; a.x0 = clampX(Player.x + a.s * 640); a.x1 = a.x0 - a.s * m.span; }
        if (key === "plant") { a.s = a.hand && a.hand.x >= Player.x ? 1 : -1; a.x = clampX(Player.x + a.s * 190); }
        if (key === "rain" || key === "rain2") a.x = P.spiritX;
        /* 預警：危招紅＋出招聲＋提示；其餘也有起手聲 */
        if (m.isPerilous) {
          Sound.play("peril", 0.9, 1.0);
          const hint = m.perilType === "sweep" ? "【危・橫掃】巨劍貼地掃來：按 [跳躍] 跳過！" : "【危・擒拿】巨手抓來：按 [瞬步] 側閃！";
          setTelemetry(hint); hintOnce("p4_" + m.perilType, hint);
        } else if (key === "sky") { Sound.play("slash", 0.6, 0.6); setTelemetry("〔天劍斬落：看地上紅線，閃開！巨劍插地後蓄力斬封印〕"); hintOnce("p4_sky", "巨劍高舉：看地上紅線閃開；插地後按住攻擊放【蓄力斬】斬封印"); }
        else if (key === "palm") { Sound.play("block", 0.5, 0.5); hintOnce("p4_palm", "地上手影變大＝巨掌壓落：走出手影；落地後可砍手打架勢"); }
        else if (key === "finger") { Sound.play("flysword", 0.5, 0.8); hintOnce("p4_finger", "巨手指劍：三道劍氣，逐一招架（折射回去打手）"); }
        else if (key === "rain" || key === "rain2") { Sound.play("peril", 0.6, 1.4); hintOnce("p4_rain", "萬劍歸宗：地上紅圈是落點，走位避開"); }
        else if (key === "plant") { Sound.play("block", 0.8, 0.6); }
        return a;
      }
      function actCancel(a) {
        if (!a) return;
        if (a.hand) { a.hand.busy = false; }
        const sw = Boss._pp.sword;
        if (sw.mode !== "hover" && sw.mode !== "gone") sw.mode = "hover";
      }
      /* 每幀推進一個招式；回傳 false＝結束 */
      function stepAct(a, dt) {
        const P = Boss._pp, G = Config.groundY, m = a.m, sw = P.sword, h = a.hand;
        a.t += dt;
        const k = a.key;
        if (k === "sky" || k === "plant") {
          if (a.st === "windup") {
            if (k === "sky" && a.t < m.windup * m.track) a.x += (Player.x - a.x) * Math.min(1, dt * 5);
            sw.mode = "rise"; sw.ang = 0; sw.tx = a.x; sw.ttip = G - 360;
            if (a.t >= m.windup) { a.st = "active"; a.t = 0; a.tip0 = sw.tip; sw.x = a.x; }
          } else if (a.st === "active") {
            sw.mode = "fall"; sw.x = a.x;
            sw.tip = a.tip0 + (G + 230 - a.tip0) * Math.min(1, a.t / m.active);
            if (a.t >= m.active) {
              sw.tip = G + 230; sw.mode = "stuck";
              addTrauma(k === "sky" ? 0.5 : 0.35); hapticBuzz(30);
              Sound.play("hit", 1.0, 0.45); Sound.play("block", 0.8, 0.5);
              emitDust(a.x, G, 1, 6, 1.5); emitDust(a.x, G, -1, 6, 1.5);
              Game.shockwaves.push({ x: a.x, y: G - 10, r: 10, maxR: 170, alpha: 0.9, color: "#bae6fd" });
              if (k === "sky" && Math.abs(Player.x - a.x) <= m.w * 0.5 + 26 && Player.y > G - 260) partHitPlayer(a.x, m, "天劍斬落！");
              hintOnce("p4_seal", "巨劍插地露出封印！按住攻擊 0.45 秒放【蓄力斬】斬斷它");
              a.st = "stuck"; a.t = 0;
            }
          } else if (a.st === "stuck") {
            sw.mode = "stuck"; sw.glow = 0.5 + 0.5 * Math.sin(a.t * 9);
            if (a.t >= a.stuckT) { a.st = "pull"; a.t = 0; }
          } else if (a.st === "pull") {
            sw.mode = "pull"; sw.tx = P.spiritX + 280; sw.ttip = G - 120;
            if (a.t >= m.pull) { sw.mode = "hover"; return false; }
          }
          return true;
        }
        if (k === "sweep") {
          if (a.st === "windup") {
            sw.mode = "sweepw"; sw.ang = Math.PI / 2 * a.s; sw.tx = a.x0 + a.s * 60 * Math.min(1, a.t / m.windup); sw.ttip = G - 30;
            if (a.t >= m.windup) { a.st = "active"; a.t = 0; Sound.play("slash", 1.0, 0.55); addTrauma(0.2); }
          } else if (a.st === "active") {
            sw.mode = "sweep"; sw.ttip = G - 30;
            const p = Math.min(1, a.t / m.active);
            sw.x = sw.tx = a.x0 + (a.x1 - a.x0) * p; sw.tip = G - 30;
            if (Math.random() < dt * 40) emitDust(sw.x, G, -a.s, 2, 1.0);
            if (!a.hit && Math.abs(Player.x - (sw.x + a.s * 240)) <= 250) { a.hit = true; partStrike(sw.x + a.s * 240, m); }
            if (a.t >= m.active) { a.st = "recover"; a.t = 0; }
          } else {
            sw.mode = "pull"; sw.ang = 0; sw.tx = P.spiritX + 280; sw.ttip = G - 120;
            if (a.t >= 0.55) { sw.mode = "hover"; return false; }
          }
          return true;
        }
        if (k === "palm") {
          if (a.st === "windup") {
            if (a.t < m.windup * m.track) a.x += (Player.x - a.x) * Math.min(1, dt * 6);
            h.tx = a.x; h.ty = G - 470 + 90 * (a.t / m.windup); /* 手要留在畫面內（鏡頭 0.85 時上緣約 y -60） */
            if (a.t >= m.windup) { a.st = "active"; a.t = 0; a.y0 = h.y; h.x = a.x; }
          } else if (a.st === "active") {
            h.x = h.tx = a.x; h.y = h.ty = a.y0 + (G - a.y0) * Math.min(1, a.t / m.active);
            if (a.t >= m.active) {
              h.y = h.ty = G;
              addTrauma(0.42); hapticBuzz(25);
              Sound.play("hit", 1.0, 0.5);
              emitDust(a.x, G, 1, 6, 1.4); emitDust(a.x, G, -1, 6, 1.4);
              if (Math.abs(Player.x - a.x) <= m.r && Player.y > G - 170) partHitPlayer(a.x, m, "巨掌壓落！");
              a.st = "rest"; a.t = 0;
            }
          } else if (a.st === "rest") {
            h.ty = G;
            if (a.t >= m.rest) { a.st = "recover"; a.t = 0; }
          } else {
            h.ty = G - 330;
            if (a.t >= m.lift) { h.busy = false; return false; }
          }
          return true;
        }
        if (k === "finger") {
          const y = G - 70;
          h.tx = a.x; h.ty = y;
          if (a.st === "windup") {
            if (a.t >= m.windup) { a.st = "active"; a.t = 0; }
          } else if (a.st === "active") {
            while (a.shots < m.count && a.t >= a.shots * m.gap) {
              const dir = Player.x >= h.x ? 1 : -1;
              Game.flyingSwords.push({ x: h.x + dir * 90, y: G - 140, vx: dir * m.speed, vy: 0, dir, damage: m.damage, reflected: false, life: 2.4, color: "#7dd3fc", trajectory: "linear", kind: null });
              Sound.play("flysword", 0.75, 1.0 + a.shots * 0.08);
              h.flash = 1; a.shots++;
            }
            if (a.t >= (m.count - 1) * m.gap + 0.12) { a.st = "recover"; a.t = 0; }
          } else {
            if (a.t >= m.recover) { h.ty = G - 330; h.busy = false; return false; }
          }
          return true;
        }
        if (k === "grab") {
          if (a.st === "windup") {
            const pull = Math.min(1, a.t / m.windup);
            h.tx = a.x0 + a.s * 70 * pull; h.ty = G;
            if (a.t >= m.windup) { a.st = "active"; a.t = 0; Sound.play("slash", 0.9, 0.7); }
          } else if (a.st === "active") {
            const p = Math.min(1, a.t / m.active);
            h.x = h.tx = a.x0 + (a.x1 - a.x0) * p; h.y = h.ty = G;
            if (!a.hit && Math.abs(Player.x - h.x) <= 110 && Player.y >= G - 230) { a.hit = true; partStrike(h.x + a.s * 80, m); }
            if (a.t >= m.active) { a.st = "rest"; a.t = 0; }
          } else if (a.st === "rest") {
            h.ty = G;
            if (a.t >= m.rest) { a.st = "recover"; a.t = 0; }
          } else {
            h.ty = G - 330;
            if (a.t >= m.lift) { h.busy = false; return false; }
          }
          return true;
        }
        if (k === "rain" || k === "rain2") {
          const swOn = sw.mode !== "gone"; /* 二階段巨劍已碎：只落劍雨 */
          if (a.st === "windup") {
            if (!swOn) { if (a.t >= m.windup) { a.st = "active"; a.t = 0; } return true; }
            sw.mode = "rise"; sw.ang = 0; sw.tx = a.x; sw.ttip = G - 430; sw.glow = a.t / m.windup;
            if (a.t >= m.windup) { a.st = "active"; a.t = 0; }
          } else if (a.st === "active") {
            while (a.waves < m.waves && a.t >= a.waves * m.gap) {
              const xs = [Player.x];
              for (let i = 0, tries = 0; xs.length < m.per && tries < 40; tries++) {
                const x = clampX(Player.x + (Math.random() * 2 - 1) * 560);
                if (xs.every(q => Math.abs(q - x) > m.r * 2 + 30)) xs.push(x);
              }
              xs.forEach(x => P.marks.push({ x, r: m.r, warn: m.warn, w0: m.warn, m }));
              Sound.play("flysword", 0.6, 1.3 + a.waves * 0.1);
              a.waves++;
            }
            if (a.t >= (m.waves - 1) * m.gap + m.warn + 0.05) { a.st = "recover"; a.t = 0; }
          } else {
            if (!swOn) return a.t < m.recover;
            sw.mode = "pull"; sw.tx = P.spiritX + 280; sw.ttip = G - 120; sw.glow = 0;
            if (a.t >= m.recover) { sw.mode = "hover"; return false; }
          }
          return true;
        }
        return false;
      }
      function updateMarks(dt) {
        const P = Boss._pp, G = Config.groundY;
        for (let i = P.marks.length - 1; i >= 0; i--) {
          const k = P.marks[i];
          k.warn -= dt;
          if (k.warn <= 0) {
            P.marks.splice(i, 1);
            Sound.play("hit", 0.55, 1.3);
            emitDust(k.x, G, 1, 3, 1.0); emitDust(k.x, G, -1, 3, 1.0);
            P.shards.push({ x: k.x, t: 0.5 });
            if (Math.abs(Player.x - k.x) <= k.r + 22 && Player.y > G - 230) partHitPlayer(k.x, k.m, "萬劍落下！");
          }
        }
        for (let i = P.shards.length - 1; i >= 0; i--) { P.shards[i].t -= dt; if (P.shards[i].t <= 0) P.shards.splice(i, 1); }
      }
      function pickPartsMove() {
        const D = partsDef(), P = Boss._pp;
        if (P.skyMiss >= (D.skyPity || 3)) return "sky";
        const last2 = P.hist.slice(-2);
        const anyHand = P.hands.some(h => h.brokenT <= 0);
        const pp = D.pool.filter(e => !(last2.length === 2 && last2[0] === e[0] && last2[1] === e[0]) && (anyHand || !["palm", "finger", "grab"].includes(e[0])));
        return weightedPick(pp, D.moves);
      }
      /* 部位位置平滑跟隨目標 */
      function partsEase(dt) {
        const P = Boss._pp, G = Config.groundY;
        const sw = P.sword;
        if (sw.mode === "hover") { sw.tx = P.spiritX + 280; sw.ttip = G - 120 + Math.sin(performance.now() / 700) * 10; sw.ang += (0 - sw.ang) * Math.min(1, dt * 6); }
        if (sw.mode === "rise" || sw.mode === "pull" || sw.mode === "hover" || sw.mode === "sweepw") {
          const kk = Math.min(1, dt * (sw.mode === "sweepw" ? 9 : 7));
          sw.x += (sw.tx - sw.x) * kk; sw.tip += (sw.ttip - sw.tip) * kk;
          if (sw.mode !== "sweepw") sw.ang += (0 - sw.ang) * kk;
        }
        if (sw.flash > 0) sw.flash = Math.max(0, sw.flash - dt * 60);
        for (const h of P.hands) {
          if (h.brokenT > 0) { h.brokenT -= dt; h.ty = G; if (h.brokenT <= 0) { h.ty = G - 330; } }
          if (!h.busy && h.brokenT <= 0) {
            const hx = P.phase === 2 ? Boss.x + h.side * 560 : P.spiritX + h.side * 420;
            h.tx = clampX(hx); h.ty = (P.phase === 2 ? G - 400 : G - 330) + Math.sin(performance.now() / 800 + h.side) * 12;
          }
          const kk = Math.min(1, dt * (h.busy ? 8 : 3.5));
          h.x += (h.tx - h.x) * kk; h.y += (h.ty - h.y) * kk;
          if (h.flash > 0) h.flash = Math.max(0, h.flash - dt * 60);
          if (h.pdelay > 0) h.pdelay -= dt; else if (h.posture > 0) h.posture = Math.max(0, h.posture - 8 * dt);
        }
      }

      /* ---------- 每幀：一階段 AI／轉場／二階段兩側巨手 ---------- */
      /* 回傳 true＝本幀已接管（一階段、轉場），一般 Boss AI 不跑 */
      function partsUpdate(dt) {
        const P = Boss._pp;
        if (!P) return false;
        P.spiritX += (Math.max(800, Math.min(2400, Player.x + 120)) - P.spiritX) * Math.min(1, dt * 0.35);
        if (P.phase === 2) { partsEase(dt); updateMarks(dt); partsSideAI(dt); partsP2Tick(dt); return false; }
        if (P.phase === "t") { partsEase(dt); partsTransStep(dt); return true; }
        /* 師弟妹：靈光（hurt）／符陣（frozen）打斷並暫停 */
        if (Boss.state === "hurt" || Boss.state === "frozen") {
          if (P.act && P.act.st === "windup") { actCancel(P.act); P.act = null; }
          P.pauseT = Boss.state === "frozen" ? (Boss.frozenTimer || 2) : (Boss.stateTimer || 0.9);
          Boss.state = "idle"; Boss.frozenTimer = 0;
        }
        if (P.pauseT > 0) { P.pauseT -= dt; partsEase(dt); updateMarks(dt); partsSync(); return true; }
        if (P.act) {
          if (!stepAct(P.act, dt)) { P.act = null; P.cd = partsDef().cd; }
        } else {
          P.cd -= dt;
          if (P.cd <= 0 && Player.state !== "execution") {
            const key = pickPartsMove();
            const a = actStart(key);
            if (a) { P.act = a; P.hist.push(key); if (P.hist.length > 6) P.hist.shift(); P.skyMiss = key === "sky" ? 0 : P.skyMiss + 1; }
            else P.cd = 0.2;
          }
        }
        partsEase(dt);
        updateMarks(dt);
        partsSync();
        return true;
      }
      /* Boss 欄位同步（HUD 危字、smoke 輪替檢查、鏡頭） */
      function partsSync() {
        const P = Boss._pp, a = P.act;
        Boss.x = P.spiritX; Boss.vx = 0; Boss.y = Config.groundY;
        Boss.facing = Player.x >= Boss.x ? 1 : -1;
        Boss.hp = Boss.maxHp; Boss.posture = 0;
        if (!a) { Boss.state = "idle"; Boss.isPerilous = false; Boss.perilType = null; return; }
        Boss.moveType = "p_" + a.key;
        Boss.state = a.st === "windup" ? "windup" : a.st === "active" ? "active" : "recover";
        Boss.isPerilous = !!a.m.isPerilous && (a.st === "windup" || a.st === "active");
        Boss.perilType = Boss.isPerilous ? a.m.perilType : null;
      }
      function partsToPhase2() {
        const P = Boss._pp, G = Config.groundY;
        if (P.act) actCancel(P.act);
        P.act = null; P.marks = []; P.phase = "t"; P.tt = 0;
        Game.flyingSwords = [];
        const sw = P.sword;
        /* 巨劍碎裂 */
        for (let i = 0; i < 26; i++) P.shards.push({ x: sw.x + (Math.random() - 0.5) * 60, y: G - 120 - Math.random() * 260, vx: (Math.random() - 0.5) * 900, vy: -300 - Math.random() * 500, t: 1.2 + Math.random() * 0.5, fly: true });
        sw.mode = "gone";
        Player.invulnTimer = 3.2;
        P.coreX = Math.abs(P.spiritX - Player.x) < 320 ? clampX(Player.x + (Player.x < 1600 ? 480 : -480)) : P.spiritX;
        Sound.play("execution", 1.0, 0.8);
        triggerHitstopMs(120); addTrauma(0.85); hapticBuzz([60, 40, 120]);
        Game.slowT = 0.8; Game.slowScale = 0.3;
        screenFlash("rgba(224,242,254,0.9)", 0.7, 0.6);
        showBanner("巨劍崩碎", "劍　魂　現　世", 1600, "#7dd3fc");
        setTelemetry("★ 三道封印盡斷！巨劍崩碎，劍魂核心降臨——回到彈刀對決！");
        Boss.state = "recover"; Boss.isPerilous = false;
      }
      function partsTransStep(dt) {
        const P = Boss._pp, G = Config.groundY;
        P.tt += dt;
        for (const s of P.shards) if (s.fly) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 1400 * dt; if (s.y > G) { s.y = G; s.vy *= -0.3; s.vx *= 0.5; } }
        if (P.tt > 0.6 && !P._roar) { P._roar = true; Sound.play("peril", 1.0, 0.5); addTrauma(0.4); }
        Boss.x = P.coreX; Boss.vx = 0; Boss.state = "recover"; Boss.stateTimer = 9; Boss.hp = Boss.maxHp;
        updateMarks(dt);
        if (P.tt >= 2.8) {
          P.phase = 2; P.p2t = 6;
          Config.bossPhase = 2;
          Boss.x = P.coreX; Boss.hp = Boss.maxHp; Boss.lastHp = Boss.maxHp; Boss.posture = 0; Boss.h = 200;
          Boss.state = "idle"; Boss.aiCooldown = 1.0; Boss.moveType = "slash1"; Boss.flashFrames = 6;
          Sound.play("assist", 1.0, 0.7);
          spawnSparks(Boss.x, G - 150, "parry", 0);
          onBossPhase2();
          const rb = document.getElementById("boss-realm-badge"); if (rb) rb.textContent = "二階段・劍魂核心";
          hintOnce("p4_core", "劍魂核心：回到彈刀！架勢打滿即可處決");
        }
      }
      /* 二階段：核心不在出招時，兩側巨手偶爾壓掌 */
      function partsSideAI(dt) {
        const P = Boss._pp, D = partsDef();
        if (P.side) { if (!stepAct(P.side, dt)) { P.side = null; const e = D.p2.palmEvery; P.p2t = e[0] + Math.random() * (e[1] - e[0]); } return; }
        if (Game.bossDeath || Boss.hp <= 0 || Boss.state === "staggered") return;
        P.p2t -= dt;
        if (P.p2t <= 0 && (Boss.state === "idle" || Boss.state === "approach" || Boss.state === "recover") && Player.state !== "execution") {
          const a = actStart("palm");
          if (a) { a.m = Object.assign({}, a.m, { damage: D.p2.palmDmg }); P.side = a; } else P.p2t = 2;
        }
      }
      function partsCall(k) {
        const P = Boss._pp;
        if (!P) return;
        if (k === "rain2") { const a = actStart("rain2"); if (a) { a.st = "active"; a.t = 0; a.x = Boss.x; P.rainAct = a; } }
      }
      function partsP2Tick(dt) { const P = Boss._pp; if (P && P.rainAct && !stepAct(P.rainAct, dt)) P.rainAct = null; }

      /* ---------- HUD ---------- */
      function partsHUD() {
        const P = Boss._pp;
        if (!P || P.phase === 2) return;
        const n = partsDef().seals || 3, left = Math.max(0, P.seals);
        const bar = document.getElementById("boss-hp-bar"), gh = document.getElementById("boss-hp-ghost"), tx = document.getElementById("boss-hp-txt");
        if (bar) bar.style.width = `${(left / n) * 100}%`;
        if (gh) gh.style.width = `${(left / n) * 100}%`;
        if (tx) tx.textContent = "●".repeat(left) + "○".repeat(n - left);
        let hp = 0; for (const h of P.hands) hp = Math.max(hp, h.posture);
        const pb = document.getElementById("boss-posture-bar"), pt = document.getElementById("boss-posture-txt");
        if (pb) pb.style.width = `${hp}%`;
        if (pt) pt.textContent = `${Math.round(hp)}%`;
        const st = document.getElementById("boss-state-txt"); if (st) st.textContent = P.phase === "t" ? "劍魂降臨" : Boss.isPerilous ? `危:${String(Boss.perilType).toUpperCase()}` : "封印";
      }

      /* ---------- 繪製（灰盒） ---------- */
      function pMark(x, y, p, kind) { /* 預警圈：黃＝可招架、紅＝危（同 drawThreatMarker） */
        const key = kind === "red" ? 1 : kind === "blue" ? 2 : 0;
        if (fxReady("mark")) {
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          ctx.drawImage(fxSheet("mark").img, Math.min(3, Math.floor(p * 4)) * 256, key * 256, 256, 256, x - 100, y - 100, 200, 200);
          ctx.restore(); return;
        }
        const col = kind === "red" ? "#ef4444" : kind === "blue" ? "#60a5fa" : "#facc15";
        ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35 + 0.5 * p; ctx.beginPath(); ctx.arc(x, y, 11 + 26 * (1 - p), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      function pKanji(x, y, ch, col) {
        ctx.save(); ctx.font = "900 46px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.fillText(ch, x, y); ctx.restore();
      }
      /* 地面層：古靈背景身體、地面預警（畫在角色之後的地上） */
      function drawPartsBack() {
        const P = Boss._pp;
        if (!P || Game.mode !== "battle") return;
        const G = Config.groundY, now = performance.now() / 1000;
        /* 古靈本體（半透明、霧中、不可打）：二階段淡去 */
        const fade = P.phase === 2 ? 0.35 : P.phase === "t" ? Math.max(0.35, 1 - P.tt / 2.8 * 0.65) : 1;
        const sx = P.spiritX, bob = Math.sin(now * 0.8) * 8;
        ctx.save();
        ctx.globalAlpha = 0.16 * fade;
        ctx.fillStyle = "#bae6fd"; ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx - 230, G - 560 + bob); ctx.lineTo(sx + 230, G - 560 + bob); ctx.lineTo(sx + 150, G - 90); ctx.lineTo(sx - 150, G - 90); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, G - 640 + bob, 72, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 0.12 * fade; ctx.lineWidth = 26; ctx.lineCap = "round";
        for (const h of P.hands) { ctx.beginPath(); ctx.moveTo(sx + h.side * 210, G - 540 + bob); ctx.quadraticCurveTo(sx + h.side * 360, G - 420, h.x, h.y - 90); ctx.stroke(); }
        if (P.phase !== 2) { /* 胸口的劍魂（轉場時降下） */
          const cy = P.phase === "t" ? G - 480 + Math.min(1, Math.max(0, (P.tt - 0.8) / 1.6)) * 330 : G - 480;
          const cx = P.phase === "t" ? sx + (P.coreX - sx) * Math.min(1, Math.max(0, (P.tt - 0.8) / 1.6)) : sx;
          ctx.globalAlpha = P.phase === "t" ? 0.9 : 0.35; ctx.fillStyle = "#7dd3fc"; ctx.shadowColor = "#7dd3fc"; ctx.shadowBlur = 24;
          ctx.beginPath(); ctx.arc(cx, cy, P.phase === "t" ? 40 : 26, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        /* 地面預警 */
        const acts = [P.act, P.side, P.rainAct].filter(Boolean);
        for (const a of acts) {
          const m = a.m, p = a.st === "windup" ? Math.min(1, a.t / m.windup) : 1;
          ctx.save();
          if ((a.key === "sky") && a.st === "windup") {
            ctx.fillStyle = `rgba(239,68,68,${0.12 + 0.3 * p})`; ctx.fillRect(a.x - m.w / 2, G - 14, m.w, 20);
            ctx.strokeStyle = `rgba(248,113,113,${0.5 + 0.5 * p})`; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(a.x, G + 6); ctx.lineTo(a.x, G - 60 - 300 * p); ctx.stroke();
          } else if (a.key === "plant" && a.st === "windup") {
            ctx.fillStyle = `rgba(147,197,253,${0.15 + 0.25 * p})`; ctx.fillRect(a.x - m.w / 2, G - 10, m.w, 14);
          } else if (a.key === "palm" && (a.st === "windup" || a.st === "active")) {
            const r = 40 + (m.r - 40) * p;
            ctx.fillStyle = `rgba(15,23,42,${0.25 + 0.4 * p})`; ctx.beginPath(); ctx.ellipse(a.hand.x, G + 2, r, 18, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(248,113,113,${0.3 + 0.6 * p})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(a.hand.x, G + 2, m.r, 18, 0, 0, Math.PI * 2); ctx.stroke();
          } else if (a.key === "sweep" && a.st === "windup") {
            const x0 = Math.min(a.x0, a.x1), x1 = Math.max(a.x0, a.x1);
            ctx.fillStyle = `rgba(239,68,68,${0.1 + 0.25 * p})`; ctx.fillRect(x0, G - 40, x1 - x0, 40);
            ctx.strokeStyle = `rgba(248,113,113,${0.4 + 0.5 * p})`; ctx.lineWidth = 2; ctx.strokeRect(x0, G - 40, x1 - x0, 40);
          } else if (a.key === "grab" && a.st === "windup") {
            const x0 = Math.min(a.x0, a.x1), x1 = Math.max(a.x0, a.x1);
            ctx.fillStyle = `rgba(239,68,68,${0.08 + 0.2 * p})`; ctx.fillRect(x0, G - 230, x1 - x0, 230);
          }
          ctx.restore();
        }
        for (const k of P.marks) {
          const p = 1 - k.warn / k.w0;
          ctx.save();
          ctx.fillStyle = `rgba(239,68,68,${0.15 + 0.35 * p})`; ctx.beginPath(); ctx.ellipse(k.x, G + 2, k.r, 14, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#f87171"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(k.x, G + 2, k.r * (1 - p * 0.6), 14 * (1 - p * 0.6), 0, 0, Math.PI * 2); ctx.stroke();
          if (k.warn < 0.18) { /* 落下中的劍 */
            const fy = G - 40 - (k.warn / 0.18) * 520;
            ctx.fillStyle = "#e0f2fe"; ctx.fillRect(k.x - 5, fy - 110, 10, 110); ctx.fillRect(k.x - 16, fy - 120, 32, 8);
          }
          ctx.restore();
        }
        for (const s of P.shards) {
          ctx.save(); ctx.globalAlpha = Math.min(1, s.t * 2); ctx.fillStyle = "#cbd5e1";
          if (s.fly) ctx.fillRect(s.x - 6, s.y - 14, 12, 28);
          else { ctx.fillRect(s.x - 5, G - 70, 10, 70); ctx.fillRect(s.x - 15, G - 78, 30, 8); }
          ctx.restore();
        }
      }
      /* 前景：巨劍、巨手、封印、核心（drawBossEntity 改畫這個） */
      function drawPartsFront() {
        const P = Boss._pp, G = Config.groundY, now = performance.now() / 1000;
        const sw = P.sword;
        /* 巨劍：tip＝劍尖，ang 0＝劍尖朝下直立；長 480（劍身 370＋劍柄 110） */
        if (sw.mode !== "gone") {
          ctx.save();
          if (sw.tip > G - 30) { ctx.beginPath(); ctx.rect(sw.x - 700, -2000, 1400, G + 4 + 2000); ctx.clip(); } /* 插進地裡的部分不畫 */
          ctx.translate(sw.x, sw.tip); ctx.rotate(sw.ang);
          const fl = sw.flash > 0;
          ctx.fillStyle = fl ? "#ffffff" : "#cbd5e1"; ctx.strokeStyle = "#475569"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-24, -40); ctx.lineTo(-24, -370); ctx.lineTo(24, -370); ctx.lineTo(24, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = fl ? "#ffffff" : "#64748b"; ctx.fillRect(-70, -386, 140, 18); ctx.strokeRect(-70, -386, 140, 18);
          ctx.fillStyle = fl ? "#ffffff" : "#334155"; ctx.fillRect(-14, -480, 28, 94);
          /* 劍柄三道封印（插地時發光可斬） */
          const n = partsDef().seals || 3;
          for (let i = 0; i < n; i++) {
            const on = i < P.seals, cy = -400 - i * 26;
            ctx.fillStyle = !on ? "#1e293b" : sw.mode === "stuck" ? `rgba(253,224,71,${0.6 + 0.4 * sw.glow})` : "#a16207";
            if (on && sw.mode === "stuck") { ctx.shadowColor = "#fde047"; ctx.shadowBlur = 16; }
            ctx.beginPath(); ctx.arc(0, cy, 11, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
          }
          ctx.restore();
          if (sw.mode === "stuck") { /* 插地：地面裂痕 */
            ctx.save(); ctx.strokeStyle = "rgba(30,41,59,0.8)"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(sw.x - 70, G + 4); ctx.lineTo(sw.x + 70, G + 4); ctx.stroke(); ctx.restore();
          }
        }
        /* 巨手 */
        for (const h of P.hands) {
          ctx.save();
          const fl = h.flash > 0, broken = h.brokenT > 0;
          ctx.translate(h.x, h.y);
          if (broken) ctx.rotate(h.side * 0.25);
          ctx.fillStyle = fl ? "#ffffff" : broken ? "#94a3b8" : "#a5b4fc"; ctx.strokeStyle = broken ? "#fde047" : "#312e81"; ctx.lineWidth = broken ? 4 : 3;
          ctx.globalAlpha = 0.92;
          ctx.fillRect(-100, -120, 200, 120); ctx.strokeRect(-100, -120, 200, 120);
          for (let i = 0; i < 4; i++) { ctx.fillRect(-92 + i * 48, -150, 36, 34); ctx.strokeRect(-92 + i * 48, -150, 36, 34); }
          ctx.globalAlpha = 1;
          if (h.posture > 0 && !broken) { /* 巨手架勢條 */
            ctx.fillStyle = "rgba(15,23,42,0.7)"; ctx.fillRect(-60, -172, 120, 7);
            ctx.fillStyle = h.posture >= 80 ? "#f97316" : "#fde047"; ctx.fillRect(-60, -172, 120 * h.posture / 100, 7);
          }
          if (broken) { ctx.font = "900 34px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fde047"; ctx.fillText("崩", 0, -60); }
          ctx.restore();
        }
        /* 招式預警圈／危字 */
        const acts = [P.act, P.side].filter(Boolean);
        for (const a of acts) {
          if (a.st !== "windup") continue;
          const m = a.m, p = Math.min(1, a.t / m.windup);
          let x = sw.x, y = Math.max(70, sw.tip - 60);
          if (a.hand) { x = a.hand.x; y = a.hand.y - 80; }
          if (a.key === "sweep") { x = sw.x; y = G - 30; }
          if (a.key === "plant") continue;
          pMark(x, y, p, a.m.isPerilous || a.m.unblockable ? "red" : "yellow");
          if (a.m.isPerilous) pKanji(x, y - 120, "危", "#ef4444");
        }
        /* 劍魂核心（二階段） */
        if (P.phase === 2) {
          const bd = Game.bossDeath, dead = bd && performance.now() >= bd.start;
          let a = 1;
          if (dead) a = bd.out ? Math.max(0, 1 - (performance.now() - bd.t0) / 600) : 0.5 + 0.5 * Math.sin(now * 20);
          const cx = Boss.x, cy = Boss.y - 150 + Math.sin(now * 2.2) * 8;
          const st = Boss.state, fl = Boss.flashFrames > 0;
          const col = fl ? "#ffffff" : st === "staggered" ? "#fde047" : Config.bossPhase === 2 && Boss.isPerilous && st === "windup" ? "#fca5a5" : "#7dd3fc";
          ctx.save(); ctx.globalAlpha = a;
          ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(cx, G + 3, 50, 8, 0, 0, Math.PI * 2); ctx.fill();
          /* 繞身飛劍 */
          const spin = now * (st === "windup" || st === "active" ? 5 : 1.6);
          for (let i = 0; i < 6; i++) {
            const an = spin + i * Math.PI / 3, rx = cx + Math.cos(an) * 92, ry = cy + Math.sin(an) * 36;
            ctx.save(); ctx.translate(rx, ry); ctx.rotate(an + Math.PI / 2); ctx.fillStyle = "#e0f2fe"; ctx.fillRect(-4, -26, 8, 52); ctx.restore();
          }
          ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 30;
          ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0; ctx.strokeStyle = "#0c4a6e"; ctx.lineWidth = 3; ctx.stroke();
          ctx.restore();
          if (!dead) {
            if (Boss.isPerilous && (st === "windup" || st === "active")) pKanji(cx, cy - 110, "危", "#ef4444");
            if (st === "staggered") pKanji(cx, cy, "決", "#7f1d1d");
          }
        }
      }
