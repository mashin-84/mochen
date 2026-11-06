      /* =========================================================================
       * 6. 關卡切換、心印裝配與結算推進系統 (PROGRESSION & STAGE SWITCHING)
       * ========================================================================= */
      function loadStage(stageId, opts) {
        const stage = Stages[stageId];
        if (!stage) return;
        if (opts && opts.hub) { if (HUB_BGM) Music.play(HUB_BGM); else Music.fadeOut(); }
        else if (STAGE_BGM[stageId]) Music.play(STAGE_BGM[stageId]);
        else Music.fadeOut();

        Game.executionBannerTimer = 0; Game.winTitle = null; Game.darkVignetteAlpha = 0; Game.flashWhiteOverlay = 0; if (Game.executionLines) Game.executionLines.length = 0; /* v0.8.54 換關／回營地時清掉處決大字與暗場（物理沒在跑時計時器不會倒數，字會一直留著） */
        Progress.currentStage = stageId;
        Boss.stageId = stageId;
        Boss.artId = stage.artId || stageId;
        if (stage.sprite) getBossSprite(stage.sprite, stage.spriteExtras);
        if (stage.introBg) getCineImg("bg", "assets/bg/" + stage.introBg + ".webp");
        if (stage.introName) getCineImg("name", stage.introName);
        if (stage.introCine) fxSheet("land");
        if (stage.introVideo) getCineVideo(stage.introVideo);
        if (stage.stances) Object.values(stage.stances).forEach(st => getBossSprite(st.sprite, st.extras));
        (stage.fxSheets || []).forEach(k => fxSheet(k));
        getPortrait("boss" + stageId); getPortrait("boss" + stageId + "_alt");
        if (stage.bg) getBgArt(stage.bg);
        Boss.maxHp = stage.maxHp;
        Boss.hp = stage.maxHp;
        Boss._leapPity = 0;
        Game.defeated = false;
        Boss.maxPosture = stage.maxPosture;
        Boss.posture = 0;
        Boss.deathblows = stage.deathblows;
        Boss.hasSummonedClone = false;
        Boss.state = "idle";
        Boss.isPerilous = false;
        Boss.aiCooldown = 0.65;
        Boss.auraParticles = [];
        Boss.aerialBreak = 0;
        Boss.aerialTimer = 0;
        Boss.aerialShotTimer = 0;
        Boss.groundedTimer = 0;
        Boss.stance = (stage.stanceByPhase && stage.stanceByPhase[1]) || "A"; Boss.stanceCount = 0; Boss._scaleMul = 1; applyBossBody(stage); Player.blast = null;
        Boss.rage = 0; Boss.lastHp = stage.maxHp; Boss.landedHit = false; Reader.reset();
        Config.bossPhase = 1;

        Player.x = 960;
        Player.y = Config.groundY;
        Player.vx = 0;
        Player.vy = 0;
        Player.facing = 1;
        Boss.x = 1680;
        Boss.y = Config.groundY;
        Boss.vx = 0;
        Boss.vy = 0;
        Boss.facing = -1;
        Player.hp = Player.maxHp;
        Player.stamina = Player.maxStamina;
        Player.staminaRecoverDelay = 0;
        Player.gourds = 3;
        Player.state = "idle";
        Player.assistAvailable = true;
        Player.tishenActive = false;
        Player.parryCooldown = 0;
        Player.atkCd = 0;

        Game.particles = [];
        Game.shockwaves = [];
        Game.slashArcs = [];
        Game.hitFx = [];
        Game.fxList = [];
        initAmbient();
        Game.comboCount = 0;
        Game.comboTimer = 0;
        Game.bossDeath = null;
        Game.ultDim = 0;
        Game.slowT = 0;
        Game.slowScale = 1;
        Boss.ultCd = 12;
        Mirror.reset();
        Boss.hitReactT = 0;
        Game.flyingSwords = [];
        Game.hazardZones = [];
        Game.afterimages = [];
        Game.floatingTexts = [];
        Game.executionLines = [];
        Game.clones = [];
        illusionReset();
        partsInit(stage); /* v0.8.83 部位 Boss */
        Boss._headY = null;
        Game.camera.targetZoom = 1.0 - Math.min(0.25, ((stage.size || 1) - 1) * 0.3);
        const focusX = Player.x * 0.64 + Boss.x * 0.36;
        Game.camera.x = Math.max(0, Math.min(Config.worldWidth - Config.baseWidth, focusX - Config.baseWidth * 0.5));
        Game.cutsceneActive = false; // Never freeze battle on startup!

        Progress.battleStartTime = performance.now();
        Progress.parryCount = 0;
        Progress.mikiriCount = 0;
        Progress.damageTaken = 0;
        Progress.hitCount = 0;
        Progress.perfectDodgeCount = 0;

        // UI Header Updates
        const realmBadge = document.getElementById("boss-realm-badge");
        realmBadge.textContent = stage.realmBadge;
        document.getElementById("boss-name").textContent = stage.name;
        document.getElementById("minimap-caption").textContent = stage.arenaName;

        populateMovesMatrix(stage);
        renderMindSealsUI();
        updateGourdUI();
        syncAssistUI();
        syncHUD();
        renderChapterList();

        setTelemetry(`〔啟程：進入${stage.chapter}！〕`);
        Game.mode = (opts && opts.hub) ? "hub" : "battle";
        Game.gateClosed = Game.mode === "battle";
        Game.dlgFocus = false;
        Game.hubNpcNear = false;
        document.body.classList.toggle("hub-mode", Game.mode === "hub");
        document.body.classList.remove("hub-near"); Game._hubNearShown = false;
        { const at = document.getElementById("attack-btn-title"); if (at) at.textContent = Game.mode === "hub" ? "交談" : "青雲斬"; }
        if (Game.mode === "hub") {
          Game.introT = 0;
          Game.pendingPre = false;
          Player.x = HUB_START_X;
          Player.facing = 1;
          Game.camera.x = -1280;
          Game.camera.zoom = 1;
        } else {
          Game.introT = 1.9;
          Game.pendingPre = !(opts && opts.skipPre) && !!(stage.dialogue && stage.dialogue.pre && stage.dialogue.pre.length);
          showBanner(stage.name, stage.realmBadge, 1500, "#fde68a");
          Sound.play("execution", 0.45, 0.7);
        }
        // Story is available via 📜 button without freezing startup
      }

      function populateMovesMatrix(stage) {
        const container = document.getElementById("cmd-matrix-container");
        document.getElementById("boss-moves-label").textContent = `${stage.name} 招式演練`;
        container.innerHTML = "";

        Object.keys(stage.moves).forEach((mKey) => {
          const m = stage.moves[mKey];
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = `cult-btn ${m.isPerilous ? 'peril' : ''}`;
          btn.textContent = m.name;
          btn.addEventListener("click", () => {
            triggerBossMove(mKey);
          });
          container.appendChild(btn);
        });

        // Add Instant Break & Phase Toggle
        const btnBreak = document.createElement("button");
        btnBreak.type = "button";
        btnBreak.className = "cult-btn";
        btnBreak.style.color = "var(--amber-light)";
        btnBreak.textContent = "⚡ 打滿架勢 (測一劍青雲)";
        btnBreak.addEventListener("click", () => {
          Boss.posture = Boss.maxPosture - 1;
          damageBossPosture(10, "手動觸發破勢！");
        });
        container.appendChild(btnBreak);

        const btnPhase = document.createElement("button");
        btnPhase.type = "button";
        btnPhase.className = "cult-btn";
        btnPhase.textContent = "⚔️ 切換階段 (一階/二階)";
        btnPhase.addEventListener("click", () => {
          Config.bossPhase = Config.bossPhase === 1 ? 2 : 1;
          document.getElementById("boss-state-txt").textContent = Config.bossPhase === 2 ? "PHASE 2" : "PHASE 1";
          spawnFloatingText(Boss.x, Boss.y - 120, `切換至 Phase ${Config.bossPhase}`, "#fca5a5", 1.15);
        });
        container.appendChild(btnPhase);
      }

      function renderMindSealsUI() {
        const container = document.getElementById("mind-seals-container");
        container.innerHTML = "";

        Object.keys(MindSeals).forEach((sKey) => {
          const s = MindSeals[sKey];
          const isEquipped = Progress.equippedSeals.includes(sKey);

          const card = document.createElement("div");
          card.className = `mind-seal-card ${isEquipped ? 'equipped' : ''}`;
          card.innerHTML = `
            <div>
              <div class="mind-seal-title">${s.name}</div>
              <div class="mind-seal-desc">${s.desc}</div>
            </div>
            <span class="realm-seal-badge ${isEquipped ? 'realm-player' : 'realm-boss'}">${isEquipped ? '已啟動' : '裝配'}</span>
          `;

          card.addEventListener("click", () => {
            if (isEquipped) {
              Progress.equippedSeals = Progress.equippedSeals.filter(k => k !== sKey);
            } else {
              if (Progress.equippedSeals.length >= 2) {
                Progress.equippedSeals.shift(); // Max 2 seals, shift oldest
              }
              Progress.equippedSeals.push(sKey);
            }
            renderMindSealsUI();
            spawnFloatingText(Player.x, Player.y - 110, isEquipped ? `卸下${s.name}` : `已參悟${s.name}！`, "#fde047", 1.1);
          });

          container.appendChild(card);
        });
      }

      const elSettlementModal = document.getElementById("settlement-modal");
      function handleStageClear(clearedStageId) {
        Game.cutsceneActive = true;
        Music.fadeOut();
        if (clearedStageId === 5) Sound.play("m_howl", 0.9, 0.85);
        const stC = Stages[clearedStageId];
        const post = stC && stC.dialogue && stC.dialogue.post;
        if (post && post.length) dlgStart(post, () => bossDeathOut(() => showSettlement(clearedStageId)));
        else bossDeathOut(() => showSettlement(clearedStageId));
      }

      function bossDeathOut(cb) {
        Game.cutsceneActive = true;
        if (Game.bossDeath) {
          Game.bossDeath.out = true;
          Game.bossDeath.t0 = performance.now();
          setTimeout(cb, 2100);
        } else {
          cb();
        }
      }

      function showSettlement(clearedStageId) {
        Game.cutsceneActive = true;
        Sound.play("victory", 1.0, 1.0);
        try { if (clearedStageId > getClearedMax()) localStorage.setItem("qingyun_cleared", String(clearedStageId)); } catch (e) { }
        refreshUnlocked();

        const stage = Stages[clearedStageId];
        document.getElementById("settle-stage-tag").textContent = `【${stage.chapter}】大捷`;
        document.getElementById("settle-headline").textContent = `${stage.name} 伏誅`;
        document.getElementById("settle-unlock-card").innerHTML = `
          <b style="color: var(--amber-light); font-family: var(--font-serif);">✦ 戰果收益與機制突破</b>
          <div style="color: #e0f2fe; margin-top: 2px;">${stage.unlockText}</div>
        `;
        document.getElementById("settle-lore-snippet").textContent = stage.loreSnippet;

        const elapsedSec = Math.max(1, Math.round((performance.now() - Progress.battleStartTime) / 1000));
        document.getElementById("settle-parry-count").textContent = `${Progress.parryCount} 次`;
        document.getElementById("settle-mikiri-count").textContent = `${Progress.mikiriCount} 次`;
        document.getElementById("settle-time-val").textContent = `${elapsedSec} 秒`;
        {
          const hits = Progress.hitCount || 0, dodges = Progress.perfectDodgeCount || 0;
          document.getElementById("settle-hit-dodge").textContent = `${hits} / ${dodges}`;
          /* 評級：被擊越少、完美招架／閃避越多越高；耗時過長微扣 */
          let score = 100 - hits * 9 + Math.min(20, Progress.parryCount * 2) + Math.min(10, dodges * 3) - (elapsedSec > 240 ? 10 : 0);
          const grade = score >= 105 ? "甲上・劍神" : score >= 85 ? "甲・劍豪" : score >= 65 ? "乙・劍客" : score >= 40 ? "丙・習劍" : "丁・險勝";
          document.getElementById("settle-grade").textContent = grade;
        }

        // 通關回響解鎖（第5~8關）
        if (clearedStageId >= 5 && clearedStageId <= 8) {
          const echoId = clearedStageId + 6; /* 第5~8關 → 回響 11~14（效果編號沿用） */
          if (!Progress.echoes) Progress.echoes = [];
          if (!Progress.echoes.includes(echoId)) {
            Progress.echoes.push(echoId);
            savePersistedEchoes();
          }
        }

        if (clearedStageId < 9) {
          document.getElementById("btn-next-stage").textContent = `返回營地・下一難：第 ${clearedStageId + 1} 難 ➔`;
        } else {
          // Final stage completed!
          document.getElementById("btn-next-stage").textContent = `通關天道閉環・返回營地 ↺`;
        }

        renderChapterList();
        elSettlementModal.classList.add("open");
      }

      document.getElementById("btn-replay-stage").addEventListener("click", () => {
        elSettlementModal.classList.remove("open");
        Game.cutsceneActive = false;
        loadStage(Boss.stageId, { skipPre: true });
      });

      document.getElementById("btn-next-stage").addEventListener("click", () => {
        elSettlementModal.classList.remove("open");
        Game.cutsceneActive = false;
        returnToHub(Boss.stageId < 9 ? Boss.stageId + 1 : 1, { camp: true });
      });

      const elChapterListModal = document.getElementById("chapter-list-modal");
      function renderChapterList() {
        const container = document.getElementById("chapters-list-container");
        container.innerHTML = "";

        Object.keys(Stages).forEach((sIdStr) => {
          const sId = Number(sIdStr);
          const st = Stages[sId];
          const isCurrent = Progress.currentStage === sId;
          const isUnlocked = sId <= Progress.unlockedStages;

          const div = document.createElement("div");
          div.className = `chapter-card-item ${isCurrent ? 'active-level' : ''} ${!isUnlocked ? 'locked' : ''}`;

          let volClass = "vol-1";
          let volLabel = "卷一・問心";
          if (st.volume === 2) { volClass = "vol-2"; volLabel = "卷二・劫難"; }
          else if (st.volume === 3) { volClass = "vol-3"; volLabel = "卷三・斬道"; }

          let badgeHtml = "";
          if (isCurrent) {
            badgeHtml = `<span class="realm-seal-badge realm-player">當前實戰中</span>`;
          } else if (isUnlocked) {
            badgeHtml = `<span class="cult-header-btn" style="padding: 2px 8px; color: var(--amber-light);">前往營地門口</span>`;
          } else {
            badgeHtml = `<span style="font-size: 11px; color: var(--text-muted);">未解鎖</span>`;
          }

          div.innerHTML = `
            <div>
              <span class="vol-badge ${volClass}">${volLabel}</span>
              <b style="font-family: var(--font-serif); color: ${isCurrent ? 'var(--qingyun-cyan)' : sId === 9 ? '#f87171' : '#f1f5f9'};">第 ${st.id} 難：${st.name}</b>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">${st.chapter}</div>
            </div>
            ${badgeHtml}
          `;

          if (isUnlocked && !isCurrent) {
            div.addEventListener("click", () => {
              elChapterListModal.classList.remove("open");
              returnToHub(sId);
            });
          }

          container.appendChild(div);
        });
      }

      // handled in menu
      document.getElementById("btn-close-chapter-list").addEventListener("click", () => {
        elChapterListModal.classList.remove("open");
      });
