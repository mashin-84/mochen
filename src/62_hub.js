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

      const HUB_GATE_S = 0.42, HUB_GATE_L = -613; /* v0.8.50 山門放大（橫樑高於主角頭頂）；前柱中心約 x=-230，HUB_GATE_X=-150 越過即進場 */
      /* v0.8.50 營地光源＝營火：影子方向背向火、越近越深越長，跟火光一起晃 */
      const HUB_FIRE_X = -900;
      function hubFlick() { const t = performance.now() / 1000; return 1 + 0.09 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23 + 1.3) + 0.03 * Math.sin(t * 41); }
      function hubLight(x) {
        const d = x - HUB_FIRE_X, ad = Math.abs(d), f = hubFlick();
        const near = Math.max(0, 1 - ad / 1100);
        return { skew: Math.max(-1.8, Math.min(1.8, d / 260)) * f, len: (0.05 + 0.05 * near) * f, /* 火與人在同一深度：影子沿地面往遠離火的一側平躺 */ a: (0.28 + 0.34 * near) * (0.9 + 0.1 * f) };
      }
      function hubShadow(img, wx, ax, ay, S, gyOff) { /* img 的 (ax, ay) 點站在地面 wx（地面高度可用 gyOff 往上調）；S 為負＝左右鏡像 */
        const c = shadowImg(img); if (!c) return;
        const L = hubLight(wx);
        ctx.save(); ctx.globalAlpha = L.a;
        ctx.transform(S, 0, -Math.abs(S) * L.skew, -Math.abs(S) * L.len, wx, Config.groundY + 2 - (gyOff || 0)); /* 圖往上＝影子往遠離火的方向 */
        ctx.drawImage(c, -ax, -ay, img.naturalWidth, img.naturalHeight);
        ctx.restore();
      }
      function drawHubFront() { /* 山門前柱：畫在主角前面，讓主角像是從牌坊底下穿過 */
        if (Game.mode === "battle") return;
        const F = getBgArt("hub_gate_front"); if (!F.ok) return;
        const gy = Config.groundY;
        ctx.save(); ctx.beginPath(); ctx.rect(-1280, -400, 1280, 1400); ctx.clip();
        ctx.drawImage(F.img, HUB_GATE_L, gy - 1259 * HUB_GATE_S, 1476 * HUB_GATE_S, 1315 * HUB_GATE_S);
        ctx.restore();
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

        // 營火（v0.8.49 生圖：石圈木柴底座＋發光火焰序列 assets/fx/campfire.webp，列 0～1 火焰 8 格、列 2 火星、列 3 煙）
        const fx = HUB_FIRE_X;
        const fl = 0.3 + 0.06 * Math.sin(t * 9) + 0.03 * Math.sin(t * 23);
        const fg = ctx.createRadialGradient(fx, gy - 40, 10, fx, gy - 40, 320);
        fg.addColorStop(0, `rgba(255,150,60,${fl})`);
        fg.addColorStop(1, "rgba(255,150,60,0)");
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = fg;
        ctx.fillRect(fx - 320, gy - 360, 640, 400);
        ctx.restore();
        const FB = getBgArt("hub_fire_base"), FS = fxSheet("campfire");
        { const f2 = hubFlick(); ctx.save(); ctx.fillStyle = `rgba(10,6,4,${0.35 * (2 - f2)})`; ctx.beginPath(); ctx.ellipse(fx, gy + 6, 86 * (0.97 + 0.03 * f2), 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } /* 營火接地陰影 */
        if (FB.ok) ctx.drawImage(FB.img, fx - 78, gy - 58, 156, 76);
        if (FS.ok) {
          const cell = FS.img.naturalWidth / 4, f = Math.floor(t * 12) % 8;
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.5; ctx.drawImage(FS.img, (Math.floor(t * 3) % 4) * cell, 3 * cell, cell, cell, fx - 70, gy - 300, 140, 140); /* 煙 */
          ctx.globalAlpha = 1; ctx.drawImage(FS.img, (f % 4) * cell, (f < 4 ? 0 : 1) * cell, cell, cell, fx - 62, gy - 128, 124, 124); /* 火焰（格內火底約在 81% 高） */
          ctx.globalAlpha = 0.9; ctx.drawImage(FS.img, (Math.floor(t * 6) % 4) * cell, 2 * cell, cell, cell, fx - 60, gy - 200, 120, 120); /* 火星 */
          ctx.restore();
        }

        // 師妹（v0.8.49 生圖全身：1／2 站立呼吸循環、3 說話、4 招牌動作；圖面向右，營地裡面向左＝鏡像）
        {
          const nx = HUB_NPC_X;
          const talking = DLG.active && Game.mode === "hub";
          const cyc = t % 8;
          const pose = talking ? 3 : cyc > 6.4 ? 4 : (Math.floor(t / 0.9) % 2) + 1;
          const SI = getBgArt("hub_shimei_" + pose);
          if (SI.ok) {
            const k = 0.346, w = 400 * k, h = 700 * k;
            hubShadow(SI.img, nx, 200, 695, -k); /* 師妹影子（隨營火） */
            ctx.save(); ctx.translate(nx, gy - 695 * k + h / 2 + 2); ctx.scale(-1, 1); ctx.drawImage(SI.img, -w / 2, -h / 2, w, h); ctx.restore();
          }
          const oy = gy - 205 + Math.sin(t * 2) * 6;
          const og = ctx.createRadialGradient(nx + 46, oy, 2, nx + 46, oy, 18);
          og.addColorStop(0, "rgba(219,234,254,1)");
          og.addColorStop(1, "rgba(96,165,250,0)");
          ctx.fillStyle = og;
          ctx.beginPath();
          ctx.arc(nx + 46, oy, 18, 0, Math.PI * 2);
          ctx.fill();
          if (Game.hubNpcNear && !talking) {
            ctx.font = "700 15px 'Noto Serif TC', serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(226,232,255,0.9)";
            ctx.fillText("師妹", nx, gy - 252);
          }
        }

        // 山門（v0.8.49 生圖：斜側面牌坊，前柱另畫在角色前面＝drawHubFront；門洞有結界光幕，走近才散開）
        {
          const G = getBgArt("hub_gate");
          if (G.ok) { /* 山門影子：四根柱子各自從自己的柱腳底往遠離營火的一側沿地面平躺（柱腳前後深度不同，各用各的地面高度） */
            const S = HUB_GATE_S, oy = gy - 1259 * S;
            for (const [cx, by, bw, h] of [[296 - 111, 1218 - 41, 117, 1060], [519 - 111, 1255 - 41, 140, 1070], [1368 - 111, 1292 - 41, 160, 900], [1021 - 111, 1345 - 41, 172, 1080]]) {
              const x0 = HUB_GATE_L + cx * S, y0 = oy + by * S, L = hubLight(x0), H = h * S;
              const tx = x0 - (-L.skew) * H, ty = y0 + L.len * H; /* 與 hubShadow 同一投影：圖往上 → 影子往遠離火 */
              const w0 = bw * S * 0.5, t0 = bw * S * 0.2, t1 = t0 * 0.5; /* 影帶厚度＝柱腳在地面上的深度 */
              const sx0 = x0 + Math.sign(tx - x0) * w0 * 0.6;
              const g2 = ctx.createLinearGradient(sx0, y0, tx, ty);
              g2.addColorStop(0, `rgba(5,3,8,${L.a * 0.9})`); g2.addColorStop(0.55, `rgba(5,3,8,${L.a * 0.4})`); g2.addColorStop(1, "rgba(5,3,8,0)");
              ctx.save(); ctx.fillStyle = g2; ctx.beginPath();
              ctx.moveTo(sx0, y0 - t0); ctx.lineTo(tx, ty - t1); ctx.lineTo(tx, ty + t1); ctx.lineTo(sx0, y0 + t0 * 0.6); ctx.closePath(); ctx.fill(); ctx.restore();
            }
          }
          if (G.ok) ctx.drawImage(G.img, HUB_GATE_L, gy - 1259 * HUB_GATE_S, 1476 * HUB_GATE_S, 1315 * HUB_GATE_S);
          const cx0 = HUB_GATE_L + 409 * HUB_GATE_S, cx1 = HUB_GATE_L + 911 * HUB_GATE_S;
          const dist = cx0 - Player.x;
          const open = Math.max(0, Math.min(1, 1 - (dist - 40) / 260));
          if (open > 0.85 && !Game._gateChimed) { Game._gateChimed = true; Sound.play("assist", 0.6, 1.25); }
          if (open < 0.3) Game._gateChimed = false;
          const a = (1 - open) * (0.5 + 0.08 * Math.sin(t * 2.2));
          if (a > 0.01) {
            ctx.save(); ctx.globalCompositeOperation = "lighter";
            const top = gy - (1259 - 625) * HUB_GATE_S, wd = cx1 - cx0;
            const cg = ctx.createLinearGradient(cx0, 0, cx1, 0);
            cg.addColorStop(0, "rgba(160,230,220,0)"); cg.addColorStop(0.5, `rgba(170,235,225,${a * 0.55})`); cg.addColorStop(1, "rgba(160,230,220,0)");
            ctx.fillStyle = cg; ctx.fillRect(cx0, top, wd, gy - top);
            for (let i = 0; i < 7; i++) { /* 光幕上緩慢流動的細光絲 */
              const xx = cx0 + wd * ((i * 0.137 + t * 0.05) % 1), ph = (t * 0.6 + i * 0.31) % 1;
              ctx.fillStyle = `rgba(220,255,245,${a * 0.6 * Math.sin(ph * Math.PI)})`;
              ctx.fillRect(xx, top + (gy - top) * (1 - ph) * 0.8, 2, 40);
            }
            ctx.restore();
          }
          /* 地上「向右進入」提示拿掉（上方教學橫幅已有，畫面減法） */
        }
        ctx.restore();
      }
