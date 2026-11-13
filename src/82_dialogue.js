      /* ====================== 場景對話框（半身像＋底部文字框） ====================== */
      const DLG = { active: false, lines: [], idx: 0, typing: false, timer: null, onEnd: null, full: "", openedAt: 0, leftKey: "mochen", rightKey: null };
      const portraitState = {};
      function getPortrait(key) {
        if (!portraitState[key]) {
          const st = { ok: false, img: new Image() };
          st.img.onload = () => { st.ok = true; };
          st.img.src = "assets/portrait/" + key + ".webp";
          portraitState[key] = st;
        }
        return portraitState[key];
      }
      const PORTRAIT_GLYPH = { mochen: "墨", shidi: "妹" };
      ["mochen", "mochen_alt", "shidi", "shidi_alt", "boss1", "boss1_alt"].forEach(k => getPortrait(k));
      const elDlg = document.createElement("div");
      elDlg.style.cssText = "position:fixed;inset:0;z-index:40;display:none;user-select:none;-webkit-user-select:none;touch-action:manipulation;";
      elDlg.innerHTML = '<style>@keyframes dlgBlink{0%,100%{opacity:1}50%{opacity:.2}}</style>' +
        '<div style="position:absolute;left:0;right:0;bottom:0;height:52%;background:linear-gradient(0deg,rgba(2,4,12,.9),rgba(2,4,12,0));"></div>' +
        '<div id="dlg-pl" style="position:absolute;left:2%;bottom:20%;width:min(42vw,560px);height:min(62vh,540px);display:flex;align-items:flex-end;justify-content:center;transition:filter .25s,opacity .25s;"></div>' +
        '<div id="dlg-pr" style="position:absolute;right:2%;bottom:20%;width:min(42vw,560px);height:min(62vh,540px);display:flex;align-items:flex-end;justify-content:center;transition:filter .25s,opacity .25s;"></div>' +
        '<div id="dlg-box" style="position:absolute;left:6%;right:6%;bottom:3.5%;min-height:21%;padding:3vh 3vw 2vh 3vw;border:1.5px solid rgba(250,204,21,.55);border-radius:12px;background:rgba(8,12,24,.92);box-shadow:0 8px 30px rgba(0,0,0,.7);font-family:\'Noto Serif TC\',serif;">' +
        '<div id="dlg-name" style="position:absolute;left:20px;top:-16px;padding:2px 18px;border-radius:999px;background:linear-gradient(180deg,#b45309,#78350f);border:1.5px solid #fde68a;color:#fef3c7;font-weight:900;font-size:clamp(13px,2.8vh,19px);letter-spacing:.2em;"></div>' +
        '<div id="dlg-text" style="color:#f1f5f9;font-size:clamp(15px,3.6vh,24px);line-height:1.7;min-height:3.4em;"></div>' +
        '<div style="position:absolute;right:22px;bottom:8px;color:#fde68a;font-size:16px;animation:dlgBlink 1s infinite;">▼</div></div>' +
        '<button id="dlg-skip" type="button" style="position:absolute;right:14px;top:15%;padding:6px 16px;border-radius:999px;border:1px solid rgba(250,204,21,.5);background:rgba(8,12,24,.8);color:#fde68a;font-family:\'Noto Serif TC\',serif;font-size:14px;font-weight:700;cursor:pointer;">跳過 ⏭</button>';
      document.body.appendChild(elDlg);
      const elDlgL = elDlg.querySelector("#dlg-pl");
      const elDlgR = elDlg.querySelector("#dlg-pr");
      const elDlgName = elDlg.querySelector("#dlg-name");
      const elDlgText = elDlg.querySelector("#dlg-text");

      function dlgPortraitKey(role) {
        if (role === "mochen") return "mochen";
        if (role === "shidi") return "shidi";
        if (role === "narrator") return null;
        return "boss" + Boss.stageId;
      }
      function dlgFillPane(pane, key, role) {
        pane.innerHTML = "";
        if (!key) return;
        let ps = getPortrait(key);
        if (!ps.ok && /_alt$/.test(key)) {
          const bps = getPortrait(key.replace(/_alt$/, ""));
          if (bps.ok) ps = bps;
        }
        if (ps.ok) {
          const im = document.createElement("img");
          im.src = ps.img.src;
          im.style.cssText = "height:100%;max-width:100%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 6px 14px rgba(0,0,0,.7));" + (pane === elDlgR ? "transform:scaleX(-1);" : ""); /* 右側角色一律面朝左（半身像圖檔是面右，程式鏡像） */
          pane.appendChild(im);
        } else {
          const g = PORTRAIT_GLYPH[key.replace(/_alt$/, "")] || (Stages[Boss.stageId].name || "將").charAt(0);
          const d = document.createElement("div");
          d.textContent = g;
          d.style.cssText = "width:min(14vw,150px);height:min(14vw,150px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:min(8vw,80px);font-weight:900;color:#fef3c7;font-family:'Noto Serif TC',serif;background:radial-gradient(circle at 35% 30%," + (/^mochen/.test(key) ? "#38bdf8,#0c4a6e" : /^shidi/.test(key) ? "#a5b4fc,#3730a3" : "#f87171,#7f1d1d") + ");border:3px solid rgba(253,230,138,.8);box-shadow:0 8px 24px rgba(0,0,0,.7);margin-bottom:4vh;";
          pane.appendChild(d);
        }
      }
      function dlgStart(lines, onEnd) {
        if (!lines || !lines.length) { if (onEnd) onEnd(); return; }
        DLG.active = true;
        DLG.lines = lines;
        DLG.idx = 0;
        DLG.onEnd = onEnd || null;
        DLG.openedAt = performance.now();
        DLG.leftKey = "mochen";
        /* 劇情站位：主角面朝右（在左），其他角色面朝左（在右） */
        Player.facing = 1;
        Boss.facing = -1;
        if (Game.mode === "hub") {
          if (Player.x > HUB_NPC_X - 60) Player.x = HUB_NPC_X - 110;
        } else if (Player.x > Boss.x - 120) {
          Player.x = Math.max(120, Boss.x - 220);
        }
        const hasM = lines.some(l => l.role === "mochen");
        const firstOther = lines.find(l => l.role !== "mochen" && l.role !== "narrator");
        DLG.rightKey = firstOther ? dlgPortraitKey(firstOther.role) : null;
        dlgFillPane(elDlgL, hasM ? "mochen" : null);
        dlgFillPane(elDlgR, DLG.rightKey);
        Game.cutsceneActive = true;
        elDlg.style.display = "block";
        dlgShow(0);
      }
      function dlgShow(i) {
        if (i >= DLG.lines.length) { dlgFinish(); return; }
        DLG.idx = i;
        const line = DLG.lines[i];
        elDlgName.textContent = line.speaker || "";
        elDlgName.style.display = line.role === "narrator" ? "none" : "block";
        const exSuf = line.expr === "alt" ? "_alt" : "";
        if (line.role === "mochen") {
          const kL = "mochen" + exSuf;
          if (kL !== DLG.leftKey) { DLG.leftKey = kL; dlgFillPane(elDlgL, kL); }
        } else if (line.role !== "narrator") {
          const baseK = dlgPortraitKey(line.role);
          const k = baseK ? baseK + exSuf : null;
          if (k && k !== DLG.rightKey) { DLG.rightKey = k; dlgFillPane(elDlgR, k); }
        }
        const nar = line.role === "narrator";
        elDlgL.style.filter = nar || line.role === "mochen" ? (nar ? "brightness(.45)" : "none") : "brightness(.45)";
        elDlgR.style.filter = nar || line.role === "mochen" ? "brightness(.45)" : "none";
        elDlgL.style.opacity = nar ? "0" : "1";
        elDlgR.style.opacity = nar ? "0" : "1";
        if (DLG.timer) clearInterval(DLG.timer);
        DLG.full = line.text;
        DLG.typing = true;
        elDlgText.textContent = "";
        elDlgText.style.color = nar ? "#cbd5e1" : "#f1f5f9";
        elDlgText.style.fontStyle = nar ? "italic" : "normal";
        let n = 0;
        DLG.timer = setInterval(() => {
          n++;
          elDlgText.textContent = DLG.full.substring(0, n);
          if (n >= DLG.full.length) { clearInterval(DLG.timer); DLG.typing = false; }
        }, 28);
      }
      function dlgNext() {
        if (!DLG.active) return;
        if (performance.now() - DLG.openedAt < 350) return;
        if (DLG.typing) {
          clearInterval(DLG.timer);
          DLG.typing = false;
          elDlgText.textContent = DLG.full;
        } else {
          dlgShow(DLG.idx + 1);
        }
      }
      function dlgFinish() {
        if (DLG.timer) clearInterval(DLG.timer);
        DLG.active = false;
        DLG.typing = false;
        elDlg.style.display = "none";
        Game.cutsceneActive = false;
        const cb = DLG.onEnd;
        DLG.onEnd = null;
        if (cb) cb();
      }
      elDlg.addEventListener("pointerdown", (e) => {
        if (e.target && e.target.id === "dlg-skip") return;
        e.preventDefault();
        dlgNext();
      });
      elDlg.querySelector("#dlg-skip").addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (performance.now() - DLG.openedAt < 350) return;
        dlgFinish();
      });
      window.addEventListener("keydown", (e) => {
        if (!DLG.active) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        if (e.repeat) return;
        if (e.code === "Space" || e.code === "Enter" || e.code === "KeyJ") dlgNext();
        else if (e.code === "Escape") dlgFinish();
      }, true);

      function bossPhaseCinematic() {
        { const stD = Stages[Boss.stageId]; if (stD && stD.dirMode && stD.dir && stD.dir.phase && !stD.parts && dirStart("phase", stD)) return; } /* v0.8.105 戰場上演階段轉換（取代二階段影片） */
        showBanner("煞氣暴走", "二　階　段", 1500, "#f87171");
        screenFlash("rgba(255,255,255,0.9)", 0.75, 0.55);
        triggerShake(0, 1, 40, 0.6);
        Game.slowT = 0.8;
        Game.slowScale = 0.3;
        Sound.play("peril", 1.0, 0.6);
        hapticBuzz([60, 40, 120]);
        const stP = Stages[Boss.stageId];
        if (stP && stMovie(stP, "p2Movie") && !stP.parts) setTimeout(() => bossPhase2Movie(stP), 850); /* v0.8.99 一般關卡二階段影片：等閃白與慢動作演完再切黑場播影片 */
      }
      function bossPhase2Movie(st) {
        if (Boss._p2MoviePending) applyP2Stance(st); /* v0.8.103 影片一開始就換姿態（影片沒播成也要換，否則會卡在雙劍） */
        if (Game.mode !== "battle" || Game.cine || Game.defeated || Boss.hp <= 0 || Player.hp <= 0 || Config.bossPhase !== 2) { if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]); return; }
        const v = getCineVideo(st.p2Movie), dur = (v.duration && isFinite(v.duration)) ? v.duration : 8;
        const ok = playMovie(st.p2Movie, { audio: true, onEnd: () => {
          Music.duckUntil = 0; Music.duckLvl = 1; /* 解除影片期間的靜音（提早跳過時也要立刻恢復） */
          if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]);
          Game.introT = Math.max(Game.introT, 0.7); /* 影片後給 0.7 秒喘息 */
        } });
        if (ok) Music.duck(0.0, dur + 0.5); else if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]);
      }

      function bossKillCinematic() {
        Boss.isPerilous = false;
        Game.bossDeath = { start: performance.now() + 700, out: false, t0: 0 };
        setTimeout(() => {
          Game.slowT = 0.9;
          Game.slowScale = 0.25;
          screenFlash("rgba(255,255,255,0.95)", 0.7, 1.1);
          hapticBuzz([40, 30, 100]);
        }, 700);
      }
      const elBossHpTxt = document.getElementById("boss-hp-txt");
      const elBossPostureBar = document.getElementById("boss-posture-bar");
      const elBossPostureTxt = document.getElementById("boss-posture-txt");
      const elBossState = document.getElementById("boss-state-txt");
      const elGem1 = document.getElementById("gem-1");
      const elGem2 = document.getElementById("gem-2");
      const elMinimapLens = document.getElementById("minimap-lens");
      const elMinimapP = document.getElementById("minimap-pip-p");
      const elMinimapB = document.getElementById("minimap-pip-b");
      const elTouchAttack = document.getElementById("touch-attack");
      const elAttackBtnTitle = document.getElementById("attack-btn-title");
      const elTouchAssist = document.getElementById("touch-assist");
      const elGourdPouch = document.getElementById("gourd-pouch");

      function updateGourdUI() {
        const units = elGourdPouch.querySelectorAll(".gourd-unit");
        units.forEach((u, idx) => {
          u.classList.toggle("spent", idx >= Player.gourds);
        });
      }

      function syncAssistUI() {
        elTouchAssist.classList.toggle("used", !Player.assistAvailable);
      }

      function syncHUD() {
        elHpBar.style.width = `${(Player.hp / Player.maxHp) * 100}%`;
        elHpTxt.textContent = Math.round(Player.hp);
        elStaminaBar.style.width = `${(Player.stamina / Player.maxStamina) * 100}%`;
        elPlayerState.textContent = Player.state.toUpperCase();

        {
          const cc = Game.comboCount | 0;
          if (cc >= 2 && Game.comboTimer > 0) {
            if (comboShown !== cc) {
              comboShown = cc;
              elCombo.firstChild.textContent = cc;
              elCombo.style.display = "block";
              elCombo.style.color = cc >= 8 ? "#fb923c" : cc >= 5 ? "#fde047" : cc >= 3 ? "#67e8f9" : "#e0f2fe";
              elCombo.style.transition = "none";
              elCombo.style.transform = "scale(1.5)";
              void elCombo.offsetWidth;
              elCombo.style.transition = "transform 0.18s ease-out";
              elCombo.style.transform = "scale(1)";
            }
            elCombo.style.opacity = Game.comboTimer < 0.5 ? String(Game.comboTimer / 0.5) : "1";
          } else if (comboShown !== 0) {
            comboShown = 0;
            elCombo.style.display = "none";
          }
        }
        let bossHpPct = (Boss.hp / Boss.maxHp) * 100;
        if (Boss._fillT) { const kF = Math.min(1, (performance.now() - Boss._fillT) / 1300); bossHpPct = Math.min(bossHpPct, 100 * kF * kF * (3 - 2 * kF)); if (kF >= 1) Boss._fillT = 0; } /* v0.8.151 二階段血條由空填滿 */
        elBossHpBar.style.width = `${bossHpPct}%`;
        {
          const nowT = performance.now();
          const dtG = Math.min(100, nowT - (bossGhostT || nowT));
          bossGhostT = nowT;
          if (bossHpPct < bossGhostLast - 0.01) bossGhostHold = nowT + 380;
          bossGhostLast = bossHpPct;
          if (bossHpPct >= bossGhostPct) bossGhostPct = bossHpPct;
          else if (nowT > bossGhostHold) bossGhostPct = Math.max(bossHpPct, bossGhostPct - dtG * 0.035);
          elBossHpGhost.style.width = `${bossGhostPct}%`;
        }
        elBossHpTxt.textContent = Math.round(Boss.hp);
        const pPct = Math.min(100, Math.round((Boss.posture / Boss.maxPosture) * 100));
        elBossPostureBar.style.width = `${pPct}%`;
        elBossPostureBar.classList.toggle("critical", pPct >= 80 || Boss.state === "staggered");
        elBossPostureBar.classList.toggle("hpout", !!Boss._hpOut && Boss.state !== "staggered"); /* v0.8.183 */
        elBossPostureBar.parentElement.classList.toggle("capped", performance.now() - (Boss._capFlash || 0) < 220);
        elBossPostureTxt.textContent = `${pPct}%`;

        elBossState.textContent =
          Boss.state === "staggered"
            ? "破防 (可處決)"
            : Boss.isPerilous
            ? `危:${Boss.perilType.toUpperCase()}`
            : Config.bossPhase === 2
            ? "PHASE 2 (狂暴)"
            : "PHASE 1";

        elGem1.classList.toggle("lit", Boss.deathblows >= 1);
        elGem2.classList.toggle("lit", Boss.deathblows >= 2);

        // HUD 戰意標記 (回響 14)
        const elBattleWill = document.getElementById("echo-14-badge");
        if (elBattleWill) {
          elBattleWill.style.display = (Progress.echoes && Progress.echoes.includes(14)) ? "inline-block" : "none";
        }

        const canExec = Boss.state === "staggered" && Math.abs(Player.x - Boss.x) <= 195;
        elTouchAttack.classList.toggle("execution-ready", canExec);
        elAttackBtnTitle.textContent = Game.mode === "hub" ? "交談" : canExec ? "一劍青雲" : "青雲斬";

        const vLeft = (Game.camera.x / Config.worldWidth) * 100;
        const vWidth = (Config.baseWidth / Config.worldWidth) * 100;
        elMinimapLens.style.left = `${vLeft}%`;
        elMinimapLens.style.width = `${vWidth}%`;
        elMinimapP.style.left = `${(Player.x / Config.worldWidth) * 100}%`;
        elMinimapB.style.left = `${(Boss.x / Config.worldWidth) * 100}%`;
        partsHUD(); /* v0.8.83 部位 Boss 一階段：血條改顯示封印 */
      }
