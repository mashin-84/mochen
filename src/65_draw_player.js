      const MC_SMEAR_ON = { "21_s1b": "20_s1a", "24_s2b": "23_s2a", "27_t_b": "26_t_a", "39_hv_b": "38_hv_a", "34_dash_b": "33_dash_a" }; /* 換到這些「出手格」時，用前一格留殘影 */
      const MC_XF = { img: null, prev: null, t: 0, f: 1 };
      /* v0.8.214 蓄力斬視覺（使用者：「根本不知道我在蓄力」）。v0.8.215 已換生圖 assets/fx/mc_charge.webp（提示詞 prompts/mc/1_mc_charge_fx.txt）；圖沒載到時退回下面的程式畫備案：
       * 蓄力中＝身周淡藍光暈、光點從四周往劍身聚集、劍身由淡藍漸亮；蓄滿＝轉金色、劍上星芒脈動（放開就出招）。劍身位置取自 38_hv_a 格（雙手高舉、劍尖朝後）。 */
      const CHG = { motes: [], last: 0 };
      function chargeInfo() {
        if (!Player.isChargingAttack) return null;
        const el = performance.now() - Player.attackChargeStartTime, cp = Math.min(1, el / 450), f = Player.facing, k = MC_SCALE, by = Player.y + GROUND_SINK;
        const hx = Player.x + f * (480 - 450) * k, hy = by + (90 - 529) * k, tx = Player.x + f * (265 - 450) * k, ty = by + (105 - 529) * k;
        return { el, cp, ready: cp >= 1, hx, hy, tx, ty, bx: (hx + tx) / 2, by: (hy + ty) / 2, blade: Player._mcFrame === "38_hv_a" };
      }
      function chargeCell(row, col, x, y, ang, w, h, a) { const I = fxSheet("mc_charge").img; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(ang); ctx.drawImage(I, col * 256, row * 256, 256, 256, -w / 2, -h / 2, w, h); ctx.restore(); }
      function drawChargeBack() {
        const c = chargeInfo(); if (!c) return;
        const now = performance.now(), cy = Player.y - Player.h * 0.55;
        if (fxReady("mc_charge")) { /* v0.8.215 生圖：蓄滿＝金色光焰（第 4 列循環） */
          if (!c.ready) return;
          ctx.save(); ctx.globalCompositeOperation = "lighter"; chargeCell(3, Math.floor(now / 110) % 4, Player.x, Player.y + GROUND_SINK - 125, 0, 330, 330, 0.9); ctx.restore();
          return;
        }
        const pu = 0.75 + 0.25 * Math.sin(now / (c.ready ? 70 : 120)), R = 70 + 50 * c.cp;
        const g = ctx.createRadialGradient(Player.x, cy, 8, Player.x, cy, R);
        g.addColorStop(0, c.ready ? `rgba(253, 230, 138, ${0.75 * pu})` : `rgba(186, 230, 253, ${0.55 * c.cp * pu})`); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(Player.x, cy, R * 0.75, R * 1.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      function drawChargeFront() {
        const now = performance.now(), dt = Math.min(0.05, (now - (CHG.last || now)) / 1000); CHG.last = now;
        const c = chargeInfo();
        if (c && c.blade && fxReady("mc_charge")) { /* v0.8.215 生圖：聚光（第 1 列，依蓄力進度由散到聚）＋劍身光（第 2 列循環），沿劍身角度旋轉；蓄滿劍尖小星芒（第 3 列第 1 格）脈動 */
          CHG.motes.length = 0;
          const ang = Math.atan2(c.ty - c.hy, c.tx - c.hx), L = Math.hypot(c.tx - c.hx, c.ty - c.hy), W = L / 0.82;
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          if (!c.ready) chargeCell(0, Math.min(3, Math.floor(c.cp * 4)), c.bx, c.by, ang, W * 1.7, W * 1.7, 0.8 + 0.2 * c.cp); chargeCell(0, Math.min(3, Math.floor(c.cp * 4)), c.bx, c.by, ang, W * 1.7, W * 1.7, 0.5 * c.cp); /* 疊兩次：亮背景上看得清楚 */
          chargeCell(1, Math.floor(now / 90) % 4, c.bx, c.by, ang, W, W, c.ready ? 1 : 0.35 + 0.65 * c.cp);
          if (c.ready) { const z = 90 + 25 * Math.sin(now / 80); chargeCell(2, 0, c.tx, c.ty, 0, z, z, 0.95); }
          ctx.restore();
          return;
        }
        if (c && c.blade) { /* 生成光點：從四周往劍身某點聚集 */
          const n = c.ready ? 1 : 3;
          for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 110 + Math.random() * 110, u = Math.random();
            CHG.motes.push({ x: c.bx + Math.cos(a) * r, y: c.by + Math.sin(a) * r * 0.8, u, t: 0, life: 0.35 + Math.random() * 0.2, s: 2.5 + Math.random() * 2.5 }); }
        }
        if (!c) { if (CHG.motes.length) CHG.motes.length = 0; return; }
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const col = c.ready ? "253, 224, 120" : "191, 230, 255";
        for (let i = CHG.motes.length - 1; i >= 0; i--) { const m = CHG.motes[i]; m.t += dt; if (m.t >= m.life || !c.blade) { CHG.motes.splice(i, 1); continue; }
          const gx = c.hx + (c.tx - c.hx) * m.u, gy = c.hy + (c.ty - c.hy) * m.u, k = Math.min(1, dt * 9); m.x += (gx - m.x) * k; m.y += (gy - m.y) * k;
          ctx.fillStyle = `rgba(${col}, ${Math.min(1, m.t * 6) * (1 - m.t / m.life) * 0.95})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.s, 0, Math.PI * 2); ctx.fill(); }
        if (c.blade) { /* 劍身發光 */
          const pu = 0.7 + 0.3 * Math.sin(now / (c.ready ? 60 : 110));
          ctx.lineCap = "round"; ctx.strokeStyle = `rgba(${col}, ${(0.25 + 0.5 * c.cp) * pu})`; ctx.lineWidth = 6 + 10 * c.cp; ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 12 + 22 * c.cp;
          ctx.beginPath(); ctx.moveTo(c.hx, c.hy); ctx.lineTo(c.tx, c.ty); ctx.stroke();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * c.cp * pu})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.hx, c.hy); ctx.lineTo(c.tx, c.ty); ctx.stroke();
          if (c.ready) { /* 蓄滿：劍尖星芒脈動 */
            const z = 70 + 30 * Math.sin(now / 80);
            if (fxReady("xtz_star")) { ctx.shadowBlur = 0; ctx.globalAlpha = 0.85; ctx.drawImage(fxSheet("xtz_star").img, c.tx - z / 2, c.ty - z / 2, z, z); }
          }
        }
        ctx.restore();
      }
      function drawPlayer() {
        ctx.save();
        if (Player.hurtInv > 0 && !Player.blast && Math.floor(performance.now() / 50) % 2 === 0) ctx.globalAlpha = 0.4; /* 受擊無敵閃爍 10Hz */
        const px = Player.x - Player.w * 0.5;
        const py = Player.y - Player.h;

        const playerEllipse = () => {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.beginPath();
          ctx.ellipse(Player.x, PG() + 3, Player.w * 0.55, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        };
        if (MC_READY !== 16) playerEllipse();

        /* 破勢反擊窗口：腳下金環隨剩餘時間收縮，提示「現在出刀架勢加倍」 */
        if (Player.riposteTimer > 0 && Player.state !== "hitstun") {
          const k = Math.min(1, Player.riposteTimer / 1.2);
          ctx.save();
          ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(performance.now() / 90));
          ctx.strokeStyle = "#fde047"; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(Player.x, Config.groundY + 3, 26 + 46 * k, 6 + 8 * k, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (MC_READY === 16) {
          let dx = MC_LASTX === null ? 0 : Math.abs(Player.x - MC_LASTX);
          if (dx > 60) dx = 0;
          MC_LASTX = Player.x;

          if (Player.state === "move" && Player.y >= PG() - 2) {
            MC_PHASE += dx / MC_STRIDE;
            MC_PHASE %= 1;
          }

          let frame = "01_idle1";
          let playerImg = null;
          let idleNext = null, idleMix = 0;
          const has = (n) => { const im = MC_IMGS[n]; return !!(im && im.complete && im.naturalWidth); };
          /* v0.8.98 補格是選用美術，沒載到就退回舊格 */
          const isAirborne = Player.y < PG() - 2;

          if (Player.state === "execution" || (Player.riposteAtk && !Player.isAirAtk && Player.state === "attack")) {
            frame = "11_thrust";
            { const im = MC_IMGS["27_t_b"]; if (im && im.complete && im.naturalWidth) frame = "27_t_b"; } /* M2 新突刺格 */
          } else if (Player.blast) {
            const xf = (n, fb) => { const im = MC_IMGS[n]; return im && im.complete && im.naturalWidth ? n : fb; };
            const ph = Player.blast.phase;
            frame = ph === "plant" ? xf("18_plant", "13_parry") : ph === "rise" ? xf("19_rise", "01_idle1") : (!isAirborne ? xf("17_slide", "16_hurt") : "16_hurt");
          } else if (Player.state === "hitstun" || Player.state === "staggered" || Player.state === "frozen") {
            frame = "16_hurt";
            if (has("36_hurt_a") && has("37_hurt_b")) { /* v0.8.98 受擊：瞬間仰身 → 踉蹌 */
              if (Player.state === "hitstun") frame = Player.stateTimer > 0.16 ? "36_hurt_a" : "37_hurt_b";
              else if (Player.state === "staggered") frame = "37_hurt_b";
            }
          } else if (Player.state === "drink") {
            frame = "15_drink";
          } else if (Player.state === "dash") {
            frame = "14_dash";
            if (has("33_dash_a") && has("34_dash_b") && has("35_dash_c")) { /* v0.8.98 瞬步三拍：蹬出 → 衝刺 → 煞停（空中只用衝刺格） */
              const pr = 1 - Player.stateTimer / 0.22;
              frame = isAirborne ? "34_dash_b" : pr < 0.25 ? "33_dash_a" : pr < 0.75 ? "34_dash_b" : "35_dash_c";
            }
          } else if (Player.state === "parry") {
            frame = "13_parry";
            if (has("29_parry_a") && has("30_parry_b")) { /* v0.8.98 招架：預備（前 90ms，涵蓋完美窗口）→ 架開（剛彈開時一律用架開格） */
              const nowT = performance.now();
              frame = (Player.lastDeflectMs && nowT - Player.lastDeflectMs < 220) || nowT - Player.parryStartMs >= 90 ? "30_parry_b" : "29_parry_a";
            }
          } else if (Player.state === "attack" && Player.isDive) {
            frame = "08_fall";
          } else if (Player.state === "attack") {
            frame = Player.comboStep % 2 !== 0 ? "09_slash1" : "10_slash2";
            /* M2 三拍關鍵格：判定在出手瞬間，所以預備只閃 0.05 秒當起手，出刀格撐到 45%，之後收招；空中用出刀格 */
            const seq = MC_ATK[Player.comboStep] || MC_ATK[1];
            const ok = (n) => { const im = MC_IMGS[n]; return im && im.complete && im.naturalWidth; };
            if (seq.every(ok)) {
              const dur = Player.comboStep === 4 ? 0.32 : Player.comboStep === 3 ? 0.75 : 0.55, el = dur - Player.stateTimer;
              frame = isAirborne ? seq[1] : el < 0.05 ? seq[0] : el < dur * 0.45 ? seq[1] : seq[2];
            }
          } else if (Player.isChargingAttack) {
            frame = "12_charge";
            if (has("38_hv_a") && performance.now() - Player.attackChargeStartTime >= 150) frame = "38_hv_a"; /* v0.8.98 蓄力後段：高舉過頭（v0.8.208 蓄滿後維持此格直到放開） */
          } else if (isAirborne) {
            frame = Player.vy < 0 ? "07_jump" : "08_fall";
            if (Player.vy < 0 && PG() - Player.y < 40 && has("32_jump_a")) frame = "32_jump_a"; /* v0.8.98 起跳蹲蓄（離地前 40px） */
          } else if (Player.state === "move") {
            if (MCR_READY === 10) {
              playerImg = MCR_IMGS[Math.floor(MC_PHASE * 10) % 10];
            } else {
              const runIdx = Math.floor(performance.now() / 110) % 4;
              frame = ["03_run1", "04_run2", "05_run3", "06_run4"][runIdx];
            }
          } else {
            frame = Math.floor(performance.now() / 600) % 2 === 0 ? "01_idle1" : "02_idle2";
            const pSince = performance.now() - Player.parryStartMs;
            if (has("31_parry_c") && pSince >= Config.guardStanceMs && pSince < Config.guardStanceMs + 170) frame = "31_parry_c"; /* v0.8.98 招架收勢（架勢結束後 170ms） */
            else if (MCI_READY === MCI_N) { /* v0.8.97 待機影片格：相鄰兩格淡入淡出 */
              const ph = ((performance.now() / 1000) % MCI_PERIOD) / MCI_PERIOD * MCI_N, i0 = Math.floor(ph) % MCI_N;
              playerImg = MCI_IMGS[i0]; idleNext = MCI_IMGS[(i0 + 1) % MCI_N]; idleMix = ph - Math.floor(ph);
            }
          }

          if (Player._pose && has(Player._pose)) { frame = Player._pose; playerImg = null; idleNext = null; } /* v0.8.115 玄天珠前指姿勢（導演設定） */
          if (!playerImg) {
            playerImg = MC_IMGS[frame];
          }
          { /* v0.8.196／199 加順：smear 風格時全部動作換格都淡化，出手格加剪影殘影；video 風格只在沒有影片格的第一刀用 */
            const act = ["attack", "parry", "dash", "hitstun", "staggered"].includes(Player.state) || Player.isChargingAttack;
            const on = act;
            if (on && MC_XF.img && MC_XF.img !== playerImg) {
              MC_XF.prev = MC_XF.img; MC_XF.t = performance.now();
              if (MC_SMEAR_ON[frame]) { /* 起手→出手：剪影殘影（沿用 v0.8.96 殘影系統，淡藍、自動衰減） */
                const n = 3;
                for (let i = 1; i <= n; i++) Game.afterimages.push({ x: Player.x - Player.facing * 16 * i, y: Player.y, w: Player.w, h: Player.h, alpha: 0.42 / i, spr: MC_XF.prev, s: MC_SCALE * (MC_FRAME_SCALE[MC_SMEAR_ON[frame]] || 1), f: Player.facing, color: "#bae6fd" });
              }
            }
            if (!on) MC_XF.prev = null;
            MC_XF.img = on ? playerImg : null;
          }

          drawChargeBack();
          if (!drawSpriteShadow(playerImg, Player.x, 529, MC_SCALE * (MC_FRAME_SCALE[frame] || 1), Player.facing, PG() - Player.y)) playerEllipse();
          ctx.save();
          if (Player.flashFrames > 0) ctx.filter = "brightness(2.5)";
          ctx.translate(Player.x, Player.y + GROUND_SINK);
          const S = MC_SCALE * (MC_FRAME_SCALE[frame] || 1);
          let sqY = 1, sqX = 1;
          if (Game._squashT > 0 && !isAirborne) { /* 以腳底為軸：先壓扁、再緩回（0.15 秒） */
            const k = Game._squashT / 0.15, a = (Game._squashAmt || 0) * k * k;
            sqY = 1 - a; sqX = 1 + a * 0.6;
          }
          ctx.scale((Player.facing > 0 ? S : -S) * sqX, S * sqY);
          ctx.drawImage(playerImg, -playerImg.naturalWidth / 2, 31 - playerImg.naturalHeight); /* v0.8.198 影片格畫布較大（1300×800），以圖寬一半、腳底距下緣 31px 對齊 */
          if (MC_XF.prev && MC_XF.prev !== playerImg && performance.now() - MC_XF.t < 70) { /* 交叉淡化：前一格疊在上面淡出 */
            const ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.55 * (1 - (performance.now() - MC_XF.t) / 70); ctx.drawImage(MC_XF.prev, -MC_XF.prev.naturalWidth / 2, 31 - MC_XF.prev.naturalHeight); ctx.globalAlpha = ga;
          }
          if (idleNext && idleMix > 0.02) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * idleMix; ctx.drawImage(idleNext, -450, -529); ctx.globalAlpha = ga; }
          Player._mcSpr = playerImg; Player._mcS = S; Player._mcFrame = frame; /* 殘影取樣（v0.8.96）；_mcFrame 供測試 */
          if (Player.flashFrames > 0) ctx.filter = "none";
          ctx.restore();
          drawChargeFront(); /* v0.8.214 蓄力特效（劍身光、聚光點、蓄滿星芒） */
        } else {
          if (Player.scarfNodes.length > 1) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(Player.scarfNodes[0].x, Player.scarfNodes[0].y);
          for (let i = 1; i < Player.scarfNodes.length; i++) {
            ctx.lineTo(Player.scarfNodes[i].x, Player.scarfNodes[i].y);
          }
          ctx.stroke();
        }

        const isFlashing = Player.flashFrames > 0;
        ctx.fillStyle = isFlashing ? "#ffffff" : "#0c4a6e";
        ctx.strokeStyle = isFlashing ? "#ffffff" : "#38bdf8";
        ctx.shadowColor = "rgba(56, 189, 248, 0.5)";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.2;
        ctx.fillRect(px, py, Player.w, Player.h);
        ctx.strokeRect(px, py, Player.w, Player.h);

        if (!isFlashing) {
          ctx.fillStyle = "#082f49";
          ctx.fillRect(px + 5, py + 10, Player.w - 10, 16);
          ctx.fillStyle = "#fef08a";
          const eyeX = Player.facing > 0 ? Player.x + 6 : Player.x - 18;
          ctx.fillRect(eyeX, py + 14, 12, 5);
        }

        if (Player.state === "drink") {
          ctx.fillStyle = "#34d399";
          ctx.fillRect(Player.x - 8, py + 18, 16, 20);
        }

        ctx.save();
        ctx.translate(Player.x + Player.facing * 14, Player.y - 46);
        let sAngle = Player.facing > 0 ? -0.35 : Math.PI + 0.35;
        if (Player.state === "parry") sAngle = Player.facing > 0 ? -1.35 : Math.PI + 1.35;
        else if (Player.state === "attack") sAngle = Player.facing > 0 ? 0.25 : Math.PI - 0.25;
        ctx.rotate(sAngle);

        // 蓄力劍身漸亮視覺反饋 (D 項要求)
        let swordColor = isFlashing ? "#ffffff" : Player.riposteTimer > 0 ? "#fde047" : "#bae6fd";
        if (Player.isChargingAttack) {
          const cp = Math.min(1.0, (performance.now() - Player.attackChargeStartTime) / 450);
          swordColor = cp >= 1.0 ? "#fef08a" : `rgba(${Math.round(186 + 70 * cp)}, ${Math.round(230 + 25 * cp)}, 253, 1)`;
          ctx.shadowColor = cp >= 1.0 ? "#fde047" : "#38bdf8";
          ctx.shadowBlur = 10 + Math.round(26 * cp);
          ctx.fillStyle = swordColor;
          ctx.fillRect(0, -3.5 - 2 * cp, 76 + 14 * cp, 7 + 4 * cp);
        } else {
          ctx.fillStyle = swordColor;
          ctx.fillRect(0, -3.5, 76, 7);
        }
        ctx.restore();
        }

        // 蓄力圓形進度環視覺提示 (D 項要求)
        if (Player.isChargingAttack) {
          const cp = Math.min(1.0, (performance.now() - Player.attackChargeStartTime) / 450);
          ctx.save();
          ctx.lineWidth = 3.5;
          const noSt = Player.stamina < 25; /* v0.8.208 劍勢不足：環變灰（放開也出不了蓄力斬） */
          ctx.strokeStyle = noSt ? "rgba(148, 163, 184, 0.8)" : cp >= 1.0 ? "#fde047" : "rgba(56, 189, 248, 0.85)";
          ctx.shadowColor = cp >= 1.0 ? "#fde047" : "#38bdf8";
          ctx.shadowBlur = cp >= 1.0 ? 14 : 6;
          ctx.beginPath();
          ctx.arc(Player.x, Player.y - Player.h * 0.5, 38, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * cp);
          ctx.stroke();
          ctx.restore();
        }

        if (Player.state === "parry") {
          const el = performance.now() - Player.parryStartMs;
          const isPerf = el <= Config.parryWindowMs;
          ctx.save();
          ctx.strokeStyle = isPerf ? "#fde047" : "rgba(180, 83, 9, 0.65)";
          ctx.lineWidth = isPerf ? 4.5 : 2.5;
          ctx.shadowColor = isPerf ? "#fde047" : "transparent";
          ctx.shadowBlur = isPerf ? 16 : 0;
          ctx.beginPath();
          const startA = Player.facing > 0 ? -0.85 : Math.PI - 0.85;
          const endA = Player.facing > 0 ? 0.85 : Math.PI + 0.85;
          ctx.arc(Player.x, Player.y - 46, 54, startA, endA);
          ctx.stroke();
          ctx.restore();
        }

        /* v0.8.115 玄天珠改由 drawXtzOrb 畫（繞身勻速橢圓） */

        ctx.restore();
      }
