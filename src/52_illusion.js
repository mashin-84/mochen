      /* ===== v0.8.55 千幻分身（第 2 關二階段）=====
         Boss 施放 move.isSplit 招：一真兩假站成三處（真身隨機），三個長得一模一樣、動作同步；
         只有真身有影子（辨真假的唯一線索）。幻影會跟著真身出招（近戰同步揮、遠程同步放飛劍，傷害減半；【危】招只做樣子不判定）。
         打到幻影：鏡碎，0.3 秒後鏡片反噬（範圍內可招架）。打到真身或真身破勢：幻影全散（看破）。最多存在 ILLU.life 秒。 */
      const ILLU = { life: 14, dmgK: 0.5, counterDmg: 90, counterR: 240, counterDelay: 0.3, minGap: 150 };
      function illusionsAlive() { return Game.illusions && Game.illusions.some(il => !il.dead); }
      function illusionReset() { Game.illusions = []; Game.illuCounters = []; Boss._splitPending = false; }
      function illusionSplit() {
        const W = Config.worldWidth, px = Player.x;
        const side = px < W / 2 ? 1 : -1; /* 往空間大的一側多放一個 */
        let slots = [px - 300, px + 300, px + side * 600].map(x => Math.max(130, Math.min(W - 130, x)));
        for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
        const old = Boss.x;
        Boss.x = slots[0]; Boss.vx = 0; Boss.facing = Player.x >= Boss.x ? 1 : -1;
        Game.illusions = slots.slice(1).map(x => ({ x, facing: Player.x >= x ? 1 : -1, t: 0, alpha: 0, dead: false }));
        Game.illuBossHp = Boss.hp;
        spawnSparks(old, Boss.y - 70, "mikiri", 1);
        slots.forEach((x) => {
          if (fxReady("boss2fx")) spawnFx("boss2fx", 3, x, Config.groundY - 120, { w: 360, dur: 0.5 }); /* 鏡子碎開、分身現形 */
          else if (fxReady("spark")) spawnFx("spark", 2, x, Config.groundY - 80, { w: 300, dur: 0.45 });
          emitDust(x, Config.groundY, 1, 2, 0.9); emitDust(x, Config.groundY, -1, 2, 0.9);
        });
        Game.flashWhiteOverlay = Math.max(Game.flashWhiteOverlay || 0, 0.35);
        if (!bsfx("split")) { Sound.play("mikiri", 0.8, 1.3); Sound.play("assist", 0.7, 0.8); }
        addTrauma(0.25);
        hintOnce("illusion", "【千幻分身】三個裡只有真身有影子；打到幻影會被鏡片反噬");
      }
      function illusionShatter(il, counter) {
        if (il.dead) return;
        il.dead = true;
        spawnSparks(il.x, Boss.y - 80, "parry", Player.x >= il.x ? -1 : 1);
        if (fxReady("boss2fx")) spawnFx("boss2fx", 3, il.x, Boss.y - 110, { w: 360, dur: 0.45 });
        else if (fxReady("spark")) spawnFx("spark", 0, il.x, Boss.y - 85, { w: 320, dur: 0.4 });
        if (!bsfx("ilBreak")) { Sound.play("parry", 0.7, 1.7); Sound.play("block", 0.5, 1.5); }
        if (counter) {
          Game.illuCounters.push({ x: il.x, t: ILLU.counterDelay });
          spawnFloatingText(il.x, Boss.y - 150, "〔幻影・鏡碎〕", "#a5f3fc", 1.0);
        }
      }
      function illusionDispelAll(text) {
        let any = false;
        (Game.illusions || []).forEach(il => { if (!il.dead) { any = true; illusionShatter(il, false); } });
        if (any && text) spawnFloatingText(Boss.x, Boss.y - 160, text, "#fde047", 1.2);
      }
      /* 主角出刀前：面向最近的目標（真身或幻影），不洩漏誰是真的 */
      function aimX() {
        if (partsBusy()) { const px = partsAimX(); return px == null ? Player.x + Player.facing : px; } /* v0.8.83 部位 Boss：面向最近的可打部位 */
        let best = Boss.x, bd = Math.abs(Boss.x - Player.x);
        if (Game.illusions) for (const il of Game.illusions) { if (il.dead) continue; const d = Math.abs(il.x - Player.x); if (d < bd) { bd = d; best = il.x; } }
        return best;
      }
      /* 主角攻擊判定：最近且在範圍內的幻影比真身近 → 打到幻影（回傳 true，真身不受傷） */
      function illusionTryHit(air) {
        if (!illusionsAlive()) return false;
        const reach = (air ? (Player.isDive ? 100 : 135) : (Player.isChargedAttack ? 175 : Player.comboStep === 3 ? 165 : 140)) * CHAR_K + bossHurt();
        const dB = Math.abs(Boss.x - Player.x);
        let hit = null, hd = 1e9;
        for (const il of Game.illusions) {
          if (il.dead || il.alpha < 0.5) continue;
          const dx = il.x - Player.x, d = Math.abs(dx);
          const ok = (air && Player.isDive) ? d <= reach : (dx * Player.facing >= -30 && d <= reach);
          if (ok && d < hd) { hd = d; hit = il; }
        }
        if (!hit || hd >= dB) return false;
        illusionShatter(hit, true);
        triggerHitstopMs(40); addTrauma(0.2);
        return true;
      }
      /* 幻影同步出招：真身近戰判定的同一瞬間，各幻影也各自判定一次（傷害減半；危招不判定） */
      function illusionStrike(move, perHit) {
        if (!illusionsAlive() || Boss.isPerilous || !move || Player.state === "execution") return;
        const dmg = Math.round((perHit || move.damage || 120) * ILLU.dmgK);
        const pd = Math.round((move.parryPostureDmg || 18) * 0.5);
        for (const il of Game.illusions) {
          if (il.dead) continue;
          const dx = Player.x - il.x;
          if (dx * il.facing < -25 || Math.abs(dx) > (move.range || 170)) continue;
          if (Player.y < Config.groundY - 120) continue;
          const sx = Boss.x, sf = Boss.facing, sv = Boss.vx;
          Boss.x = il.x; Boss.facing = il.facing;
          resolveBossStrike({ damage: dmg, parryPostureDmg: pd });
          Boss.x = sx; Boss.facing = sf; Boss.vx = sv;
        }
      }
      /* 幻影同步放飛劍（直線彈道；垂落飛劍是全場招不重複） */
      function illusionShoot(move) {
        if (!illusionsAlive() || !move || move.bulletTrajectory === "vertical") return;
        const n = Math.max(1, Math.min(2, (move.bulletCount || 3) - 1));
        for (const il of Game.illusions) {
          if (il.dead) continue;
          for (let i = 0; i < n; i++) {
            setTimeout(() => {
              if (il.dead || Boss.hp <= 0) return;
              const dir = Player.x >= il.x ? 1 : -1;
              Game.flyingSwords.push({ x: il.x + dir * 30, y: move.bulletY ? Boss.y + move.bulletY[(i * 2) % move.bulletY.length] : Boss.y - 55 + (i - 0.5) * 22, vx: dir * ((move.bulletSpeed || 750) * 0.9), vy: 0, dir, damage: Math.round((move.damage || 90) * ILLU.dmgK), reflected: false, life: 2.5, color: "#a5f3fc", trajectory: "linear", kind: null });
            }, 120 + i * Math.max(220, (move.bulletGap || 0) * 1100));
          }
        }
      }
      function updateIllusions(dt) {
        if (!Game.illusions) Game.illusions = [];
        if (!Game.illuCounters) Game.illuCounters = [];
        /* 鏡片反噬 */
        for (let i = Game.illuCounters.length - 1; i >= 0; i--) {
          const c = Game.illuCounters[i]; c.t -= dt;
          if (c.t > 0) continue;
          Game.illuCounters.splice(i, 1);
          if (fxReady("boss2fx")) spawnFx("boss2fx", 2, c.x, Config.groundY - 30, { w: 480, h: 480, dur: 0.45 });
          else if (fxReady("spark")) spawnFx("spark", 2, c.x, Config.groundY - 70, { w: 420, dur: 0.4 });
          for (let k = 0; k < 3; k++) spawnSparks(c.x + (k - 1) * 50, Config.groundY - 60 - k * 20, "mikiri", k - 1 || 1);
          if (!bsfx("ilShard")) Sound.play("mikiri", 0.6, 1.6);
          if (Math.abs(Player.x - c.x) <= ILLU.counterR && Player.y >= Config.groundY - 140 && Player.state !== "execution" && Boss.hp > 0) {
            const sx = Boss.x, sf = Boss.facing, sv = Boss.vx, sp = Boss.isPerilous;
            Boss.x = c.x; Boss.facing = Player.x >= c.x ? 1 : -1; Boss.isPerilous = false;
            resolveBossStrike({ damage: ILLU.counterDmg, parryPostureDmg: 8 });
            Boss.x = sx; Boss.facing = sf; Boss.vx = sv; Boss.isPerilous = sp;
          }
        }
        if (!Game.illusions.length) return;
        /* 看破：真身受傷、破勢、死亡 → 全散 */
        if (Boss.hp <= 0 || Game.bossDeath || Boss.state === "staggered" || Boss.hp < (Game.illuBossHp || 0) - 0.5) {
          illusionDispelAll(Boss.hp > 0 ? "〔看破真身・幻影盡散〕" : null);
        }
        const B = Boss.state, sp = Math.abs(Boss.vx);
        for (const il of Game.illusions) {
          il.t += dt;
          if (il.dead) { il.alpha = Math.max(0, il.alpha - dt * 6); continue; }
          if (il.t > ILLU.life) { il.dead = true; continue; }
          il.alpha = Math.min(1, il.alpha + dt * 5);
          const toP = Player.x >= il.x ? 1 : -1, d = Math.abs(Player.x - il.x);
          if (B === "idle" || B === "approach") { il.facing = toP; if (d > ILLU.minGap) il.x += toP * Math.min(sp, 320) * dt; }
          else if (B === "windup") { /* 前搖：不動，面向在出招瞬間鎖定 */ }
          else if (B === "active") { if (d > 60) il.x += il.facing * sp * dt; }
          else il.x += il.facing * sp * 0.3 * dt;
        }
        /* 幻影之間、幻影和真身不要重疊 */
        const all = Game.illusions.filter(il => !il.dead);
        for (const il of all) {
          if (Math.abs(il.x - Boss.x) < 110) il.x += (il.x >= Boss.x ? 1 : -1) * 260 * dt;
          for (const o of all) if (o !== il && Math.abs(il.x - o.x) < 110) il.x += (il.x >= o.x ? 1 : -1) * 260 * dt;
          il.x = Math.max(110, Math.min(Config.worldWidth - 110, il.x));
        }
        Game.illusions = Game.illusions.filter(il => !(il.dead && il.alpha <= 0));
      }
      function illusionMoveFx(f) {
        if (Array.isArray(f)) { f.forEach(illusionMoveFx); return; }
        if (!f || !illusionsAlive() || !fxReady(f.sheet)) return;
        for (const il of Game.illusions) if (!il.dead) spawnFx(f.sheet, f.row, il.x + il.facing * (f.ox || 0), Boss.y + (f.oy || 0), { w: f.w, h: f.h || f.w, dur: f.dur || 0.35, facing: il.facing, anchor: f.anchor || "c", alpha: f.alpha == null ? 1 : f.alpha });
      }
      function illusionFaceAll() { if (Game.illusions) for (const il of Game.illusions) if (!il.dead) il.facing = Player.x >= il.x ? 1 : -1; }
      /* 繪製：借用 drawBossEntity，暫時把 Boss 搬到幻影位置；Boss._ilDraw 時不畫影子、氣場、提示圈與危字 */
      function drawIllusions() {
        if (!Game.illusions || !Game.illusions.length || Game.mode !== "battle") return;
        const sx = Boss.x, sf = Boss.facing;
        for (const il of Game.illusions) {
          if (il.alpha <= 0) continue;
          Boss.x = il.x; Boss.facing = il.facing; Boss._ilDraw = true;
          ctx.save(); ctx.globalAlpha = il.alpha;
          try { drawBossEntity(); } finally { ctx.restore(); Boss._ilDraw = false; Boss.x = sx; Boss.facing = sf; }
        }
      }
