      /* ===== v0.8.3 美術特效（assets/fx/*.webp，每張 4×4 格、每格 256px）：發光類用「疊加發光」播放（黑底自動透明） ===== */
      const FXS = {};
      function fxSheet(k) {
        if (FXS[k]) return FXS[k];
        const o = { img: new Image(), ok: false };
        o.img.onload = () => { o.ok = true; };
        o.img.src = "assets/fx/" + k + ".webp";
        FXS[k] = o;
        return o;
      }
      function fxReady(k) { return fxSheet(k).ok; }
      /* v0.8.10 處決大字（生圖書法）：畫面正中央，「處決」砸出、「一劍青雲」隨後淡入，最後 0.4 秒整體淡出；圖未載入回傳 false 改畫舊橫幅 */
      function drawExecTitle(w, h) {
        const T1 = fxSheet("exec_t1"), T2 = fxSheet("exec_t2");
        if (!T1.ok || !T2.ok) return false;
        const dur = Game.executionBannerDur || 2.0, rem = Game.executionBannerTimer, t = dur - rem;
        const fo = Math.min(1, rem / 0.4);
        const kill = !!Game.executionBannerKill; /* 一般處決＝「一劍青雲」；終結處決（打贏）＝「處決」 */
        const IM = kill ? T1.img : T2.img;
        const w1 = kill ? Math.min(w * 0.36, h * 0.7) : Math.min(w * 0.5, h * 0.9), h1 = w1 * IM.height / IM.width;
        const cx = w * 0.5, cy = h * (kill ? 0.36 : 0.38);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const a1 = Math.min(1, t / 0.1) * fo;
        const sc = 1 + 0.45 * Math.max(0, 1 - t / 0.16) + 0.04 * (t / dur);
        ctx.globalAlpha = a1;
        ctx.drawImage(IM, cx - w1 * sc / 2, cy - h1 * sc / 2, w1 * sc, h1 * sc);
        ctx.restore();
        return true;
      }
      /* v0.8.11 「一劍青雲」只在擊敗敵人（終結處決）時出現：處決字退場後淡入，約 2.4 秒 */
      function showWinTitle(delayMs) { Game.winTitle = { t0: performance.now() + delayMs, dur: 2400 }; }
      function drawWinTitle(w, h) {
        const W = Game.winTitle; if (!W) return;
        const T2 = fxSheet("exec_t2"); if (!T2.ok) return;
        const t = (performance.now() - W.t0) / 1000, dur = W.dur / 1000;
        if (t < 0) return;
        if (t > dur) { Game.winTitle = null; return; }
        const a = Math.min(1, t / 0.3) * Math.min(1, (dur - t) / 0.5);
        const sc = 1 + 0.12 * Math.max(0, 1 - t / 0.4);
        const ww = Math.min(w * 0.5, h * 0.9) * sc, hh = ww * T2.img.height / T2.img.width;
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
        ctx.drawImage(T2.img, w * 0.5 - ww / 2, h * 0.38 - hh / 2, ww, hh);
        ctx.restore();
      }
      function spawnFx(sheet, row, x, y, o) {
        o = o || {};
        fxSheet(sheet);
        Game.fxList.push({
          sheet, row, x, y, w: o.w || 240, h: o.h || o.w || 240, dur: o.dur || 0.3, age: 0,
          facing: o.facing || 1, anchor: o.anchor || "c", rot: o.rot || 0, alpha: o.alpha == null ? 1 : o.alpha,
          loop: !!o.loop, fps: o.fps || 12, follow: o.follow || null, add: o.add !== false,
          vx: o.vx || 0, vy: o.vy || 0, grav: o.grav || 0, grow: o.grow || 0,
          col: o.col == null ? -1 : o.col, spin: o.spin || 0, back: !!o.back, c0: o.c0 || 0, nf: o.nf || 4 /* v0.8.94 只播該列的第 c0 起 nf 格（2 格一組的特效） */
        });
        if (Game.fxList.length > 60) Game.fxList.shift();
      }
      function updateFx(dt) {
        const L = Game.fxList;
        for (let i = L.length - 1; i >= 0; i--) {
          const f = L[i];
          f.age += dt;
          if (f.follow) { const q = f.follow(); if (q) { f.x = q.x; f.y = q.y; } }
          if (f.grav) {
            f.vy += f.grav * dt;
            if (f.y > Config.groundY - 6 && f.vy > 0) { f.y = Config.groundY - 6; f.vy = 0; f.vx *= 0.15; f.spin = 0; }
          }
          f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.spin * dt;
          if (f.age >= f.dur) L.splice(i, 1);
        }
        for (const lf of Game.leaves) {
          lf.t += dt;
          lf.x += (lf.vx + Math.sin(lf.t * 1.6 + lf.ph) * 26) * dt;
          lf.y += lf.vy * dt;
          lf.rot += lf.spin * dt;
          const cx = Game.camera.x;
          if (lf.y > Config.groundY + 6 || lf.x < cx - 120 || lf.x > cx + Config.baseWidth + 120) {
            lf.x = cx + Math.random() * (Config.baseWidth + 200) - 60; lf.y = -30 - Math.random() * 200;
          }
        }
        for (const m of Game.mist) {
          m.x += m.vx * dt;
          const cx = Game.camera.x;
          if (m.x > cx + Config.baseWidth + 420) m.x = cx - 420;
          if (m.x < cx - 520) m.x = cx + Config.baseWidth + 300;
        }
      }
      function drawFx(back) {
        for (const f of Game.fxList) {
          if (!!f.back !== !!back) continue;
          const sh = fxSheet(f.sheet);
          if (!sh.ok) continue;
          const t = f.age / f.dur;
          const col = f.col >= 0 ? f.col : f.c0 + (f.loop ? Math.floor(f.age * f.fps) % f.nf : Math.min(f.nf - 1, Math.floor(t * f.nf)));
          const a = f.alpha * (t > 0.78 ? (1 - t) / 0.22 : 1);
          ctx.save();
          ctx.globalCompositeOperation = f.add ? "lighter" : "source-over";
          ctx.globalAlpha = Math.max(0, Math.min(1, a));
          ctx.translate(f.x, f.y);
          if (f.rot) ctx.rotate(f.rot);
          ctx.scale(f.facing, 1);
          const k = 1 + f.grow * t, w = f.w * k, h = f.h * k;
          let dx = -w / 2, dy = -h / 2;
          if (f.anchor === "l") dx = 0;
          if (f.anchor === "b") dy = -h;
          ctx.drawImage(sh.img, col * 256, f.row * 256, 256, 256, dx, dy, w, h);
          ctx.restore();
        }
      }
      function initAmbient() {
        ["slash", "air", "spark", "boss1", "boss2", "ult", "mark", "scene", "exec", "exec2", "ink", "exec_t1", "exec_t2"].forEach(fxSheet); /* 預載，避免第一次出招沒有特效 */
        Game.leaves = []; Game.mist = [];
        if (Boss.stageId !== 1) return;
        const cx = Game.camera ? Game.camera.x : 0;
        for (let i = 0; i < 9; i++) {
          Game.leaves.push({ x: cx + Math.random() * Config.baseWidth, y: Math.random() * Config.groundY, vx: -30 - Math.random() * 40, vy: 28 + Math.random() * 34,
            rot: Math.random() * 6, spin: (Math.random() - 0.5) * 3, ph: Math.random() * 6, t: 0, col: i % 4, size: 24 + Math.random() * 14 });
        }
        for (let i = 0; i < 3; i++) Game.mist.push({ x: cx + i * 520 - 200, vx: 10 + i * 5, col: i, a: 0.12 + i * 0.02 });
      }
      function drawMist() {
        const sh = fxSheet("scene");
        if (!sh.ok) return;
        for (const m of Game.mist) {
          ctx.save();
          ctx.globalAlpha = m.a;
          ctx.drawImage(sh.img, m.col * 256, 256, 256, 256, m.x - 320, Config.groundY - 190, 640, 320);
          ctx.restore();
        }
      }
      function drawLeaves() {
        const sh = fxSheet("scene");
        if (!sh.ok) return;
        for (const lf of Game.leaves) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.translate(lf.x, lf.y); ctx.rotate(lf.rot);
          ctx.drawImage(sh.img, lf.col * 256, 0, 256, 256, -lf.size, -lf.size, lf.size * 2, lf.size * 2);
          ctx.restore();
        }
      }
      /* 落地塵浪＋碎石（第 1 關：躍擊落地、下劈落地） */
      function landingFx(x, power, rocks) {
        if (!fxReady("scene")) return;
        spawnFx("scene", 3, x, Config.groundY + 6, { anchor: "b", back: true, w: 230 * power, h: 125 * power, col: Math.floor(Math.random() * 4), dur: 0.7, grow: 0.3, add: false, alpha: 0.8 });
        for (let i = 0; i < rocks; i++) {
          spawnFx("scene", 2, x + (Math.random() - 0.5) * 40, Config.groundY - 14, { w: 46 + Math.random() * 34, col: Math.floor(Math.random() * 4), dur: 1.0, add: false,
            vx: (Math.random() - 0.5) * 560, vy: -(300 + Math.random() * 260), grav: 1600, spin: (Math.random() - 0.5) * 9 });
        }
      }
      /* v0.8.4 處決特效：普通版一斬＋地面光環；極版三段斬（斜／反斜／橫貫）＋裂空＋碎光＋光環；擊殺再加光點與魂光上升 */
      function executionFx(ji) {
        ["exec", "exec2", "ink", "exec_t1", "exec_t2"].forEach(fxSheet);
        const f = Player.facing, cy = () => Boss.y - 150;
        const strike = (row, w, h, dur) => spawnFx("exec", row, Boss.x, cy(), { w, h, dur, facing: f });
        const ring = (w) => spawnFx("exec2", 3, Boss.x, Config.groundY + w * 0.06, { w, dur: 0.6 });
        if (!ji) { strike(0, 560, 560, 0.3); ring(520); return; }
        strike(0, 620, 620, 0.32);
        setTimeout(() => strike(1, 620, 620, 0.32), 140);
        setTimeout(() => {
          strike(2, 1100, 620, 0.42);
          spawnFx("exec2", 0, Boss.x, Boss.y - 170, { w: 560, h: 640, dur: 0.65 });
          spawnFx("exec2", 1, Boss.x, cy(), { w: 560, dur: 0.65 });
          ring(760);
        }, 280);
      }
      function executionKillFx() {
        spawnFx("exec", 3, Boss.x, Boss.y - 150, { w: 560, dur: 1.5 });
        setTimeout(() => spawnFx("exec2", 2, Boss.x, Config.groundY - 10, { anchor: "b", w: 460, dur: 2.8, loop: true, fps: 5, follow: () => ({ x: Boss.x, y: Config.groundY - 10 }) }), 500);
      }
      function swordImpactFx(sw) {
        if (sw && sw.kind === "halberd") spawnFx("boss2", 1, sw.x, sw.y, { w: 260, dur: 0.36 });
        const fsa = sw && !sw.kind && Stages[Boss.stageId] && Stages[Boss.stageId].flySwordArt; /* v0.8.66 飛劍命中／落地的碎裂圖 */
        if (!fsa || !fxReady(fsa.sheet)) return;
        const w = fsa.w || 150, k = w / 256;
        if (sw.trajectory === "vertical" && sw.y >= Config.groundY - 40 && fsa.groundRow != null) {
          spawnFx(fsa.sheet, fsa.groundRow, sw.x, Config.groundY - 92 * k, { w: w * 1.1, dur: 0.6 }); /* 插地格劍尖約在格內 y=220 */
        } else if (fsa.breakRow != null) {
          const ang = Math.atan2(sw.vy, sw.vx), d = (fsa.tipX || 238) - 128;
          spawnFx(fsa.sheet, fsa.breakRow, sw.x - Math.cos(ang) * d * k, sw.y - Math.sin(ang) * d * k, { w, dur: 0.45, rot: ang });
        }
      }
      function drawUltArt(m, p) {
        const sh = fxSheet("ult");
        const r = m.range * 0.75, W = r * 2.7, gx = Boss.grabZoneX, gy = Config.groundY;
        const now = performance.now() / 1000, windup = Boss.state === "windup";
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const f0 = windup ? Math.min(3, Math.floor(p * 4)) : Math.floor(now * 8) % 4;
        ctx.drawImage(sh.img, f0 * 256, windup ? 0 : 256, 256, 256, gx - W / 2, gy - W / 2, W, W);
        if (!windup || p > 0.45) {
          ctx.globalAlpha = windup ? Math.min(1, (p - 0.45) * 2.2) : 1;
          ctx.drawImage(sh.img, (Math.floor(now * 9) % 4) * 256, 512, 256, 256, gx - W / 2, gy - W * 0.78, W, W);
        }
        if (!windup) {
          const q = 1 - Boss.stateTimer / (Boss.stateDur || 1);
          const S2 = W * 1.15;
          ctx.globalAlpha = 1;
          ctx.drawImage(sh.img, Math.min(3, Math.floor(q * 4)) * 256, 768, 256, 256, gx - S2 / 2, gy - S2 + 6, S2, S2);
        }
        ctx.restore();
      }
      /* 主角普攻刀光 */
      function playerSlashFx(isRiposte) {
        const f = Player.facing, st = Player.comboStep;
        if (isRiposte) {
          if (fxReady("air")) spawnFx("air", 3, Player.x + f * 80, Player.y - 105, { w: 380, dur: 0.3, facing: f });
          return;
        }
        if (!fxReady("slash")) return;
        const size = st === 3 ? 390 : 320;
        spawnFx("slash", st === 2 ? 1 : 0, Player.x + f * size * 0.16, Player.y - 105, { w: size, dur: st === 3 ? 0.26 : 0.2, facing: f });
      }

      function drawArcs() {
        for (const arc of Game.slashArcs) {
          if (arc.art) continue;
          const t = arc.life / arc.maxLife;
          ctx.save();
          ctx.translate(arc.x, arc.y);
          if (arc.facing < 0) ctx.scale(-1, 1);
          ctx.strokeStyle = arc.color;
          ctx.globalAlpha = t;
          ctx.shadowColor = arc.color;
          ctx.shadowBlur = 18;
          ctx.lineCap = "round";

          if (arc.arcType === "claw") {
            ctx.lineWidth = 6 * t;
            for (let i = -1; i <= 1; i++) {
              ctx.beginPath();
              ctx.arc(0, i * 20, arc.radius, arc.startAngle, arc.endAngle, arc.startAngle > arc.endAngle);
              ctx.stroke();
            }
          } else if (arc.arcType === "beam") {
            ctx.lineWidth = 25 * t;
            ctx.beginPath();
            const beamLen = arc.radius * 1.5;
            const angle = (arc.startAngle + arc.endAngle) / 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * beamLen, Math.sin(angle) * beamLen);
            ctx.stroke();
          } else if (arc.arcType === "thrust") {
            ctx.lineWidth = 14 * t;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(arc.radius * 1.4, 0);
            ctx.stroke();
          } else if (arc.arcType === "dual") {
            ctx.lineWidth = 12 * t;
            ctx.beginPath();
            ctx.arc(0, 10, arc.radius, arc.startAngle, arc.endAngle, arc.startAngle > arc.endAngle);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, -10, arc.radius, arc.startAngle, arc.endAngle, arc.startAngle > arc.endAngle);
            ctx.stroke();
          } else if (arc.arcType === "fan") {
            ctx.lineWidth = 26 * t;
            ctx.beginPath();
            ctx.arc(0, 0, arc.radius, arc.startAngle, arc.endAngle, arc.startAngle > arc.endAngle);
            ctx.stroke();
          } else if (arc.arcType === "overhead" || arc.arcType === "slam") {
            ctx.lineWidth = 20 * t;
            ctx.beginPath();
            ctx.arc(0, 0, arc.radius, arc.startAngle, arc.endAngle, arc.startAngle > arc.endAngle);
            ctx.stroke();
          } else if (arc.arcType === "spin") {
            ctx.lineWidth = 18 * t;
            ctx.beginPath();
            ctx.arc(0, 0, arc.radius, 0, Math.PI * 2);
            ctx.stroke();
          } else if (arc.arcType === "ribbon") {
            ctx.lineWidth = 8 * t;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(arc.radius * 0.5, arc.radius * 0.5, arc.radius, 0);
            ctx.stroke();
          } else {
            ctx.lineWidth = 16 * t;
            ctx.beginPath();
            ctx.arc(0, 0, arc.radius, arc.startAngle, arc.endAngle, arc.startAngle > arc.endAngle);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      function drawHitFx() {
        for (const fx of Game.hitFx) {
          const a = Math.max(0, fx.life / fx.maxLife);
          ctx.save();
          if (fx.type === "slash") {
            const cx = Math.cos(fx.ang) * fx.dir, cy = Math.sin(fx.ang);
            const half = fx.len * 0.5 * (1.15 - 0.3 * a);
            const x0 = fx.x - cx * half, y0 = fx.y - cy * half, x1 = fx.x + cx * half, y1 = fx.y + cy * half;
            ctx.globalAlpha = a;
            ctx.strokeStyle = fx.color;
            ctx.shadowColor = fx.color;
            ctx.shadowBlur = 14;
            ctx.lineCap = "round";
            ctx.lineWidth = fx.w * (0.4 + 0.6 * a);
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo(fx.x - cy * fx.dir * 10, fx.y + cx * 10, x1, y1);
            ctx.stroke();
            ctx.lineWidth = Math.max(1, fx.w * 0.3 * a);
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
          } else if (fx.type === "dust") {
            ctx.globalAlpha = a * 0.38;
            ctx.fillStyle = "#d6cdbd";
            ctx.beginPath();
            ctx.arc(fx.x, fx.y, fx.size * (1 + (1 - a) * 1.3), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalAlpha = a;
            ctx.fillStyle = fx.color;
            ctx.shadowColor = fx.color;
            ctx.shadowBlur = 6;
            ctx.translate(fx.x, fx.y);
            ctx.rotate(Math.atan2(fx.vy, fx.vx));
            ctx.fillRect(-fx.size * 2, -fx.size * 0.4, fx.size * 4, fx.size * 0.8);
          }
          ctx.restore();
        }
      }

      function drawSparks() {
        for (const sw of Game.shockwaves) {
          ctx.save();
          ctx.strokeStyle = sw.color;
          ctx.globalAlpha = Math.max(0, sw.alpha);
          ctx.lineWidth = sw.lineWidth;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        for (const p of Game.particles) {
          const a = Math.max(0, p.life / p.maxLife);
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = a;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.translate(p.x, p.y);
          const ang = Math.atan2(p.vy, p.vx);
          ctx.rotate(ang);
          ctx.fillRect(-p.size * 1.8, -p.size * 0.45, p.size * 3.6, p.size * 0.9);
          ctx.restore();
        }
      }
