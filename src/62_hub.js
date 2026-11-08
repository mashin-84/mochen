      /* ====================== 營地（Hub）與進場 ====================== */
      function hubTick(dt) {
        if (Game.mode === "hub") {
          Game.hubNpcNear = Math.abs(Player.x - HUB_NPC_X) < 130 && Player.y >= Config.groundY - 4;
          if (Game._hubNearShown !== Game.hubNpcNear) { Game._hubNearShown = Game.hubNpcNear; document.body.classList.toggle("hub-near", Game.hubNpcNear); } /* v0.8.48 走近師妹才出現「交談」鍵 */
          if (Player.x >= HUB_GATE_X) {
            Game.mode = "enter"; document.body.classList.remove("hub-mode", "hub-near"); /* v0.8.48 出山門就恢復戰鬥按鈕 */
            document.body.classList.remove("hub-mode");
            hapticBuzz(25);
            Sound.play("slash", 0.1, 0.7); /* v0.8.110 過門音量再減半 */
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
        const stage0 = Stages[Boss.stageId];
        if (STAGE_BGM[Boss.stageId] && !(stMovie(stage0, "introMovie") && getCineVideo(stage0.introMovie).readyState >= 3) && !(stage0.dirMode && stage0.dir && stage0.dir.intro)) Music.play(STAGE_BGM[Boss.stageId]); /* v0.8.14 修正：走進戰場才開始放配樂 */
        const stage = Stages[Boss.stageId];
        Game.introT = 1.9;
        Game.pendingPre = !!(stage.dialogue && stage.dialogue.pre && stage.dialogue.pre.length);
        Progress.battleStartTime = performance.now();
        Boss._introHide = false; /* 登場開始（或沒有導演登場）就不再隱藏；從天而降的導演自己把 Boss 放在畫面上方 */
        if (stage.dirMode && stage.dir && stage.dir.intro && dirStart("intro", stage)) { /* v0.8.105 戰場上登場：爆發那一刻才開配樂與名牌 */
        } else if (!startBossCine()) { /* v0.8.18 有登場動畫的關卡，名字卡改在 Boss 落地時顯示 */
          if (stage.introName) bossNameCard(stage); else showBanner(stage.name, stage.realmBadge, 1500, "#fde68a");
          Sound.play("execution", 0.11, 0.7);
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
        lines.push({ speaker: "師妹", role: "shidi", text: "師兄，今夜要我催動玄天珠的哪一種力量？" });
        dlgStart(lines, () => showAssistPicker());
      }
      /* v0.8.117 營地選擇玄天珠之力（跟師妹說話後詢問；選擇存在 localStorage qingyun_assist） */
      const ASSIST_OPTS = [
        { key: "lingguang", name: "太初靈光", tag: "打斷", desc: "珠子命中時強制打斷敵人出招，並削 22 點架勢。" },
        { key: "fuzhen", name: "符陣定身", tag: "控制", desc: "珠子命中後定身敵人 2 秒，並削 30% 架勢。" },
        { key: "tishen", name: "太初替身", tag: "護身", desc: "珠子融入身體：2.2 秒無敵、回復氣血，並抵擋一次致命傷。" }
      ];
      function loadAssistChoice() {
        try { const v = localStorage.getItem("qingyun_assist"); if (v && ASSIST_OPTS.some(o => o.key === v)) Player.selectedAssist = v; } catch (e) { }
        document.querySelectorAll(".assist-seal-btn").forEach(b => b.classList.toggle("selected", b.getAttribute("data-assist") === Player.selectedAssist));
      }
      function showAssistPicker() {
        let el = document.getElementById("assist-picker");
        if (!el) {
          el = document.createElement("div"); el.id = "assist-picker";
          el.style.cssText = "position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.62);font-family:'Noto Serif TC','Songti TC','PMingLiU',serif;";
          document.body.appendChild(el);
        }
        const close = () => { el.style.display = "none"; Game.cutsceneActive = false; };
        const cur = Player.selectedAssist;
        el.innerHTML = '<div style="width:min(560px,92vw);padding:16px 18px;border-radius:16px;background:rgba(10,15,26,.96);border:1px solid #b8952f;box-shadow:0 0 30px rgba(96,165,250,.25);color:#e2e8f0;">'
          + '<div style="font-size:17px;color:#fde68a;letter-spacing:.2em;margin-bottom:4px;">玄天珠之力</div><div style="font-size:12px;opacity:.7;margin-bottom:10px;">選擇之後，戰鬥中按「玄天珠」鈕即施展（每場一次）。</div>'
          + ASSIST_OPTS.map(o => '<button type="button" data-k="' + o.key + '" style="display:block;width:100%;text-align:left;margin:7px 0;padding:10px 12px;border-radius:10px;cursor:pointer;color:#e2e8f0;font:inherit;background:' + (o.key === cur ? 'rgba(59,130,246,.28)' : 'rgba(30,41,59,.85)') + ';border:1px solid ' + (o.key === cur ? '#60a5fa' : '#475569') + ';"><div style="font-size:15px;color:#bfdbfe;">' + o.name + '　<span style="font-size:12px;color:#93c5fd;">［' + o.tag + '］</span>' + (o.key === cur ? '　✔' : '') + '</div><div style="font-size:12.5px;opacity:.8;margin-top:3px;">' + o.desc + '</div></button>').join("")
          + '<button type="button" data-k="" style="display:block;width:100%;margin-top:8px;padding:8px;border-radius:10px;cursor:pointer;color:#94a3b8;font:inherit;background:transparent;border:1px solid #334155;">保持不變</button></div>';
        el.querySelectorAll("button").forEach(b => b.addEventListener("click", (e) => {
          e.stopPropagation(); const k = b.getAttribute("data-k");
          if (k) { Player.selectedAssist = k; try { localStorage.setItem("qingyun_assist", k); } catch (er) { } loadAssistChoice(); const o = ASSIST_OPTS.find(x => x.key === k); showHintToast("玄天珠之力：" + o.name + "（" + o.tag + "）"); Sound.play("assist", 0.35, 1.5); }
          close();
        }));
        Game.cutsceneActive = true; el.style.display = "flex";
      }

      const HUB_GATE_S = 0.42, HUB_GATE_L = -613; /* v0.8.50 山門放大（橫樑高於主角頭頂）；前柱中心約 x=-230，HUB_GATE_X=-150 越過即進場 */
      /* v0.8.50 營地光源＝營火：影子方向背向火、越近越深越長，跟火光一起晃 */
      const HUB_FIRE_X = -900;
      function hubFlick() { const t = performance.now() / 1000; return 1 + 0.007 * Math.sin(t * 1.2) + 0.003 * Math.sin(t * 2.9 + 1.3); } /* v0.8.52 影子起伏 ±1%、更慢（v0.8.51 為 ±4.5%） */
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
      const GATE_SH = { hf: 0.35, vf: 0.30, a: 1.6 }; /* 山門影子：水平拉長（乘營火方向 skew）／垂直壓扁，數字越大影子越長 */
      function buildGateShadow(img, gy) {
        const k = HUB_GATE_S * 2, W = img.naturalWidth, H = img.naturalHeight;
        const feet = [[63, 122, 588], [167, 240, 609], [411, 498, 655], [584, 673, 624]]; /* 四柱 x 範圍與柱腳底列（圖檔座標） */
        const footY = (px) => {
          if (px <= feet[0][1]) return feet[0][2];
          for (let i = 0; i < feet.length; i++) {
            if (px >= feet[i][0] && px <= feet[i][1]) return feet[i][2];
            const n = feet[i + 1];
            if (n && px > feet[i][1] && px < n[0]) return feet[i][2] + (n[2] - feet[i][2]) * (px - feet[i][1]) / (n[0] - feet[i][1]);
          }
          return feet[feet.length - 1][2];
        };
        const sil = document.createElement("canvas"); sil.width = W; sil.height = H;
        const sg = sil.getContext("2d"); sg.drawImage(img, 0, 0); sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#050308"; sg.fillRect(0, 0, W, H);
        const ox = HUB_GATE_L - 40, oy = gy - 420, cw = Math.ceil(W * k + 1.8 * GATE_SH.hf * H * k + 80), ch = 460;
        const c = document.createElement("canvas"); c.width = cw; c.height = ch;
        const g = c.getContext("2d");
        const raw = document.createElement("canvas"); raw.width = cw; raw.height = ch;
        const rg = raw.getContext("2d");
        const step = 2;
        for (let px = 0; px < W; px += step) {
          const yb = footY(px + step / 2), wx = HUB_GATE_L + px * k, wy = gy - (1259 / 2 - yb) * k;
          const L = hubLight(wx), sk = L.skew / hubFlick();
          rg.save();
          rg.setTransform(k, 0, -k * sk * GATE_SH.hf, k * GATE_SH.vf, wx - ox, wy - oy);
          rg.drawImage(sil, px, 0, step + 0.6, yb + 1, 0, -yb, step + 0.6, yb + 1);
          rg.restore();
        }
        /* 深淺：靠近營火的一側較深（同 hubLight 的 a），遠端淡出 */
        rg.globalCompositeOperation = "destination-in";
        const aL = Math.min(0.85, hubLight(HUB_GATE_L).a * GATE_SH.a), aR = Math.min(0.85, hubLight(HUB_GATE_L + W * k).a * GATE_SH.a);
        const gr = rg.createLinearGradient(0, 0, cw, 0);
        gr.addColorStop(0, `rgba(0,0,0,${aL})`); gr.addColorStop(W * k / cw, `rgba(0,0,0,${aR})`); gr.addColorStop(1, `rgba(0,0,0,${aR * 0.55})`);
        rg.fillStyle = gr; rg.fillRect(0, 0, cw, ch);
        g.filter = "blur(1.5px)"; g.drawImage(raw, 0, 0);
        return { c, ox, oy, x0f: HUB_GATE_L + W * k * 0.5 };
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
          const cell = FS.img.naturalWidth / 4, f = Math.floor(t * 8) % 8;
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.5; ctx.drawImage(FS.img, (Math.floor(t * 2) % 4) * cell, 3 * cell, cell, cell, fx - 70, gy - 300, 140, 140); /* 煙 */
          ctx.globalAlpha = 1; ctx.drawImage(FS.img, (f % 4) * cell, (f < 4 ? 0 : 1) * cell, cell, cell, fx - 62, gy - 128, 124, 124); /* 火焰（格內火底約在 81% 高） */
          ctx.globalAlpha = 0.9; ctx.drawImage(FS.img, (Math.floor(t * 4) % 4) * cell, 2 * cell, cell, cell, fx - 60, gy - 200, 120, 120); /* 火星 */
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
          if (fxReady("xtz")) { /* v0.8.116 師妹旁的玄天珠改用生圖（列 0 脈動） */
            const A = fxSheet("xtz"), col = Math.floor(performance.now() / 120) % 4, sz = 70;
            ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(A.img, col * 256, 0, 256, 256, nx + 46 - sz / 2, oy - sz / 2, sz, sz); ctx.restore();
          } else {
          const og = ctx.createRadialGradient(nx + 46, oy, 2, nx + 46, oy, 18);
          og.addColorStop(0, "rgba(219,234,254,1)");
          og.addColorStop(1, "rgba(96,165,250,0)");
          ctx.fillStyle = og;
          ctx.beginPath();
          ctx.arc(nx + 46, oy, 18, 0, Math.PI * 2);
          ctx.fill();
          }
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
          if (G.ok) { /* v0.8.53 山門影子：整座牌坊（柱＋橫樑＋屋頂）剪影，逐欄以「該欄的柱腳」為軸往遠離營火的一側平躺；柱間的欄位柱腳線性內插 → 影子連續且貼著柱腳。算一次存快取（含柔邊），每幀只做 ±1% 起伏 */
            if (!Game._gateSh) Game._gateSh = buildGateShadow(G.img, gy);
            const C = Game._gateSh, f = hubFlick();
            ctx.save();
            ctx.translate(C.x0f, gy); ctx.scale(f, f); ctx.translate(-C.x0f, -gy);
            ctx.drawImage(C.c, C.ox, C.oy);
            ctx.restore();
          }
          if (G.ok) ctx.drawImage(G.img, HUB_GATE_L, gy - 1259 * HUB_GATE_S, 1476 * HUB_GATE_S, 1315 * HUB_GATE_S);
          const cx0 = HUB_GATE_L + 409 * HUB_GATE_S, cx1 = HUB_GATE_L + 911 * HUB_GATE_S;
          const dist = cx0 - Player.x;
          const open = Math.max(0, Math.min(1, 1 - (dist - 40) / 260));
          if (open > 0.85 && !Game._gateChimed) { Game._gateChimed = true; Sound.play("assist", 0.15, 1.25); }
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
