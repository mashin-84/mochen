      function drawPlayer() {
        ctx.save();
        if (Player.hurtInv > 0 && !Player.blast && Math.floor(performance.now() / 50) % 2 === 0) ctx.globalAlpha = 0.4; /* 受擊無敵閃爍 10Hz */
        const px = Player.x - Player.w * 0.5;
        const py = Player.y - Player.h;

        const playerEllipse = () => {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.beginPath();
          ctx.ellipse(Player.x, Config.groundY + 3, Player.w * 0.55, 7, 0, 0, Math.PI * 2);
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

          if (Player.state === "move" && Player.y >= Config.groundY - 2) {
            MC_PHASE += dx / MC_STRIDE;
            MC_PHASE %= 1;
          }

          let frame = "01_idle1";
          let playerImg = null;
          let idleNext = null, idleMix = 0;
          const has = (n) => { const im = MC_IMGS[n]; return !!(im && im.complete && im.naturalWidth); };
          /* v0.8.98 補格是選用美術，沒載到就退回舊格 */
          const isAirborne = Player.y < Config.groundY - 2;

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
            if (has("38_hv_a") && performance.now() - Player.attackChargeStartTime >= 150) frame = "38_hv_a"; /* v0.8.98 蓄力後段：高舉過頭（0.45 秒蓄滿會自動出重斬，所以提早換格） */
          } else if (isAirborne) {
            frame = Player.vy < 0 ? "07_jump" : "08_fall";
            if (Player.vy < 0 && Config.groundY - Player.y < 40 && has("32_jump_a")) frame = "32_jump_a"; /* v0.8.98 起跳蹲蓄（離地前 40px） */
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

          if (!drawSpriteShadow(playerImg, Player.x, 529, MC_SCALE * (MC_FRAME_SCALE[frame] || 1), Player.facing, Config.groundY - Player.y)) playerEllipse();
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
          ctx.drawImage(playerImg, -450, -529);
          if (idleNext && idleMix > 0.02) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * idleMix; ctx.drawImage(idleNext, -450, -529); ctx.globalAlpha = ga; }
          Player._mcSpr = playerImg; Player._mcS = S; /* 殘影取樣（v0.8.96） */
          if (Player.flashFrames > 0) ctx.filter = "none";
          ctx.restore();
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
          ctx.strokeStyle = cp >= 1.0 ? "#fde047" : "rgba(56, 189, 248, 0.85)";
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
