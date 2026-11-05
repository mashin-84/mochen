      /* ====================== 營地（Hub）與進場 ====================== */
      function hubTick(dt) {
        if (Game.mode === "hub") {
          Game.hubNpcNear = Math.abs(Player.x - HUB_NPC_X) < 130 && Player.y >= Config.groundY - 4;
          if (Game._hubNearShown !== Game.hubNpcNear) { Game._hubNearShown = Game.hubNpcNear; document.body.classList.toggle("hub-near", Game.hubNpcNear); } /* v0.8.48 走近師妹才出現「交談」鍵 */
          if (Player.x >= HUB_GATE_X) {
            Game.mode = "enter"; document.body.classList.remove("hub-mode", "hub-near"); /* v0.8.48 出山門就恢復戰鬥按鈕 */
            document.body.classList.remove("hub-mode");
            hapticBuzz(25);
            Sound.play("slash", 0.4, 0.7);
          }
        } else if (Game.mode === "enter") {
          if (Player.x > 80) Game.gateClosed = true;
          if (Player.x >= ARENA_ENTER_X) {
            Player.vx = 0;
            Player.state = "idle";
            Player.facing = 1;
            beginBattleIntro();
          }
        }
      }

      function beginBattleIntro() {
        Game.mode = "battle";
        if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]); /* v0.8.14 修正：走進戰場才開始放配樂 */
        const stage = Stages[Boss.stageId];
        Game.introT = 1.9;
        Game.pendingPre = !!(stage.dialogue && stage.dialogue.pre && stage.dialogue.pre.length);
        Progress.battleStartTime = performance.now();
        if (!startBossCine()) { /* v0.8.18 有登場動畫的關卡，名字卡改在 Boss 落地時顯示 */
          showBanner(stage.name, stage.realmBadge, 1500, "#fde68a");
          Sound.play("execution", 0.45, 0.7);
        }
        setTelemetry(`〔啟程：進入${stage.chapter}！〕`);
      }

      function returnToHub(stageId, opts) {
        Game.hubStage = Math.max(1, Math.min(9, stageId || 1));
        try { localStorage.setItem("qingyun_hubstage", String(Game.hubStage)); } catch (e) { }
        loadStage(Game.hubStage, { hub: true });
        Game.cutsceneActive = false;
        if (opts && opts.camp) {
          const stH = Stages[Game.hubStage];
          const cl = stH && stH.dialogue && stH.dialogue.camp;
          let seen = false;
          try { seen = localStorage.getItem("qingyun_camp_" + Game.hubStage) === "1"; } catch (e) { }
          if (cl && cl.length && !seen) {
            setTimeout(() => dlgStart(cl, () => {
              try { localStorage.setItem("qingyun_camp_" + Game.hubStage, "1"); } catch (e) { }
              hintOnce("hub_go", "向右走進山門，挑戰下一關");
            }), 450);
          }
        }
      }

      const HUB_TIPS = [
        "戰鬥中看到紅色「危」字，就是殺招：突刺要用瞬步，橫掃要跳起來踩頭。",
        "招架要抓準時機，敵人出招的瞬間按下，才能彈開並削弱它的架勢。",
        "敵人的架勢滿格就會崩潰，這時貼身普攻就能發動處決。",
        "葫蘆裡的青雲仙釀可以回血，但每場只有三口，喝的時候別被打斷。"
      ];
      let hubTipIdx = 0;
      function hubTalk() {
        const st = Stages[Game.hubStage];
        const lines = [
          { speaker: "師妹", role: "shidi", text: `師兄，前面就是「${st.name}」了。` },
          { speaker: "師妹", role: "shidi", text: HUB_TIPS[hubTipIdx % HUB_TIPS.length] }
        ];
        hubTipIdx++;
        dlgStart(lines, null);
      }

      function drawHubScene() {
        const t = performance.now() / 1000;
        const gy = Config.groundY;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-1280, -400, 1280, 1400);
        ctx.clip();

        if (BG_ART.camp.ok) {
          ctx.drawImage(BG_ART.camp.img, -1280, 0, 1280, 720);
        } else {
        const sky = ctx.createLinearGradient(0, 0, 0, gy);
        sky.addColorStop(0, "#070b18");
        sky.addColorStop(0.55, "#16223d");
        sky.addColorStop(1, "#3a3a5e");
        ctx.fillStyle = sky;
        ctx.fillRect(-1280, -400, 1280, gy + 400);

        for (let i = 0; i < 46; i++) {
          const x = -1280 + ((i * 263) % 1280);
          const y = 18 + ((i * 97) % 300);
          ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * 1.4 + i)})`;
          ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1.4, i % 3 === 0 ? 2 : 1.4);
        }

        const mg = ctx.createRadialGradient(-360, 150, 10, -360, 150, 110);
        mg.addColorStop(0, "rgba(254,243,199,0.95)");
        mg.addColorStop(0.35, "rgba(254,243,199,0.35)");
        mg.addColorStop(1, "rgba(254,243,199,0)");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(-360, 150, 110, 0, Math.PI * 2);
        ctx.fill();

        const ridge = (col, base, amp, f, ph) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(-1280, gy);
          for (let x = -1280; x <= 0; x += 20) {
            ctx.lineTo(x, base - amp * (0.6 + 0.4 * Math.sin(x * f + ph)) - amp * 0.5 * Math.sin(x * f * 2.3 + ph * 2));
          }
          ctx.lineTo(0, gy);
          ctx.closePath();
          ctx.fill();
        };
        ridge("#15203a", gy - 190, 130, 0.006, 1.2);
        ridge("#0f182c", gy - 90, 90, 0.009, 4.1);

        ctx.fillStyle = "#141b27";
        ctx.fillRect(-1280, gy, 1280, 400);
        ctx.fillStyle = "rgba(120,160,200,0.35)";
        ctx.fillRect(-1280, gy, 1280, 2);

        const tent = (cx, sc) => {
          ctx.fillStyle = "#2a3347";
          ctx.beginPath();
          ctx.moveTo(cx - 120 * sc, gy);
          ctx.lineTo(cx, gy - 160 * sc);
          ctx.lineTo(cx + 120 * sc, gy);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(160,190,230,0.3)";
          ctx.lineWidth = 2;
          ctx.stroke();
          const dg = ctx.createLinearGradient(0, gy - 100 * sc, 0, gy);
          dg.addColorStop(0, "#0d1119");
          dg.addColorStop(1, "rgba(255,150,70,0.28)");
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.moveTo(cx - 34 * sc, gy);
          ctx.lineTo(cx, gy - 100 * sc);
          ctx.lineTo(cx + 34 * sc, gy);
          ctx.closePath();
          ctx.fill();
        };
        tent(-1130, 1.0);
        tent(-380, 0.8);
        }

        // 營火
        const fx = -900;
        const fl = 0.3 + 0.06 * Math.sin(t * 9) + 0.03 * Math.sin(t * 23);
        const fg = ctx.createRadialGradient(fx, gy - 30, 10, fx, gy - 30, 300);
        fg.addColorStop(0, `rgba(255,150,60,${fl})`);
        fg.addColorStop(1, "rgba(255,150,60,0)");
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = fg;
        ctx.fillRect(fx - 300, gy - 330, 600, 360);
        ctx.restore();
        ctx.fillStyle = "#3b2a1f";
        ctx.save();
        ctx.translate(fx, gy - 6);
        ctx.rotate(0.35);
        ctx.fillRect(-34, -5, 68, 10);
        ctx.rotate(-0.7);
        ctx.fillRect(-34, -5, 68, 10);
        ctx.restore();
        for (let k = -1; k <= 1; k++) {
          const bx = fx + k * 15;
          const h = 56 + 22 * Math.sin(t * 8 + k * 2) + (k === 0 ? 18 : 0);
          const sw = 5 * Math.sin(t * 6 + k);
          const fgr = ctx.createLinearGradient(0, gy - 10, 0, gy - 10 - h);
          fgr.addColorStop(0, "#f97316");
          fgr.addColorStop(0.6, "#fbbf24");
          fgr.addColorStop(1, "rgba(254,240,138,0.85)");
          ctx.fillStyle = fgr;
          ctx.beginPath();
          ctx.moveTo(bx - 13, gy - 10);
          ctx.quadraticCurveTo(bx - 11, gy - 10 - h * 0.6, bx + sw, gy - 10 - h);
          ctx.quadraticCurveTo(bx + 11, gy - 10 - h * 0.6, bx + 13, gy - 10);
          ctx.closePath();
          ctx.fill();
        }
        for (let i = 0; i < 10; i++) {
          const p = (t * 0.55 + i * 0.37) % 1;
          ctx.fillStyle = `rgba(255,200,110,${1 - p})`;
          ctx.beginPath();
          ctx.arc(fx + Math.sin(i * 7 + t) * 22 * p, gy - 30 - p * 150, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 師妹（暫代造型）
        {
          const nx = HUB_NPC_X;
          ctx.fillStyle = "#c7d2fe";
          ctx.beginPath();
          ctx.moveTo(nx - 22, gy);
          ctx.lineTo(nx - 13, gy - 76);
          ctx.lineTo(nx + 13, gy - 76);
          ctx.lineTo(nx + 22, gy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#6366f1";
          ctx.fillRect(nx - 14, gy - 52, 28, 6);
          ctx.fillStyle = "#f5d9c4";
          ctx.beginPath();
          ctx.arc(nx, gy - 90, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1f1b2e";
          ctx.beginPath();
          ctx.arc(nx, gy - 94, 14, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(nx - 14, gy - 94, 6, 26);
          const oy = gy - 108 + Math.sin(t * 2) * 5;
          const og = ctx.createRadialGradient(nx + 38, oy, 2, nx + 38, oy, 18);
          og.addColorStop(0, "rgba(219,234,254,1)");
          og.addColorStop(1, "rgba(96,165,250,0)");
          ctx.fillStyle = og;
          ctx.beginPath();
          ctx.arc(nx + 38, oy, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = "700 15px 'Noto Serif TC', serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#c7d2fe";
          ctx.fillText("師妹", nx, gy - 120);
          if (Game.hubNpcNear) {
            ctx.fillStyle = "rgba(10,15,26,0.88)";
            ctx.fillRect(nx - 52, gy - 160, 104, 24);
            ctx.strokeStyle = "rgba(250,204,21,0.7)";
            ctx.strokeRect(nx - 52, gy - 160, 104, 24);
            ctx.fillStyle = "#fde68a";
            ctx.font = "700 13px 'Noto Serif TC', serif";
            ctx.fillText("攻擊鍵・交談", nx, gy - 143);
          }
        }

        // 山門
        {
          const gx = HUB_GATE_X;
          const st = Stages[Game.hubStage];
          const pg = ctx.createLinearGradient(0, gy - 250, 0, gy);
          pg.addColorStop(0, "rgba(255,90,60,0)");
          pg.addColorStop(1, `rgba(255,90,60,${0.4 + 0.08 * Math.sin(t * 3)})`);
          if (Game.gateClosed) {
            ctx.fillStyle = "#1b0f0f";
            ctx.fillRect(gx - 76, gy - 250, 152, 250);
            ctx.fillStyle = "#d4a64a";
            for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) ctx.fillRect(gx - 60 + c * 36, gy - 220 + r * 52, 6, 6);
          } else {
            ctx.fillStyle = "#0a0608";
            ctx.fillRect(gx - 76, gy - 250, 152, 250);
            ctx.fillStyle = pg;
            ctx.fillRect(gx - 76, gy - 250, 152, 250);
          }
          for (const px of [gx - 98, gx + 76]) {
            ctx.fillStyle = "#7a1b1b";
            ctx.fillRect(px, gy - 262, 22, 262);
            ctx.fillStyle = "#b3382c";
            ctx.fillRect(px + 3, gy - 262, 5, 262);
            ctx.fillStyle = "#2a2f3a";
            ctx.fillRect(px - 6, gy - 14, 34, 14);
          }
          ctx.fillStyle = "#8b2323";
          ctx.fillRect(gx - 116, gy - 288, 232, 26);
          ctx.fillStyle = "#3a1414";
          ctx.beginPath();
          ctx.moveTo(gx - 140, gy - 288);
          ctx.lineTo(gx + 140, gy - 288);
          ctx.lineTo(gx + 112, gy - 322);
          ctx.lineTo(gx - 112, gy - 322);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#d4a64a";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#fde68a";
          ctx.font = "900 17px 'Noto Serif TC', serif";
          ctx.textAlign = "center";
          ctx.fillText(`第 ${st.id} 難`, gx, gy - 268);
          ctx.shadowColor = "rgba(253,230,138,0.8)";
          ctx.shadowBlur = 14;
          ctx.font = "900 24px 'Noto Serif TC', serif";
          ctx.fillText(st.name, gx, gy - 346);
          ctx.shadowBlur = 0;
          ctx.font = "700 12px 'Noto Serif TC', serif";
          ctx.fillStyle = "rgba(253,230,138,0.85)";
          ctx.fillText(st.realmBadge, gx, gy - 326 + 0);
          if (!Game.gateClosed && Player.x > gx - 560) {
            const ap = 0.55 + 0.45 * Math.sin(t * 5);
            ctx.fillStyle = `rgba(253,230,138,${ap})`;
            ctx.font = "900 20px 'Noto Serif TC', serif";
            ctx.fillText("向右進入 ▶", gx - 190, gy - 30);
          }
        }
        ctx.restore();
      }
