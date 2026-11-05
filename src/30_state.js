      /* =========================================================================
       * 3. 戰鬥系統與相機
       * ========================================================================= */
      const canvas = document.getElementById("battle-canvas");
      const ctx = canvas.getContext("2d");

      const Config = {
        worldWidth: 3200,
        baseWidth: 1280,
        baseHeight: 720,
        groundY: 570,
        gravity: 2400,

        parryWindowMs: 130,
        guardStanceMs: 360,
        parryHitstopFrames: 6,
        slashHitstopFrames: 4,
        shakeMultiplier: 1.0,

        bossPhase: 1,
        parryCueLevel: 2,
        hapticLevel: 2
      };
      try {
        const savedCue = localStorage.getItem("qingyun_parry_cue");
        if (savedCue !== null) Config.parryCueLevel = parseInt(savedCue, 10);
        const savedHap = localStorage.getItem("qingyun_haptic");
        if (savedHap !== null) Config.hapticLevel = parseInt(savedHap, 10);
      } catch (e) {}

      const Game = {
        hitstopT: 0,
        flashWhiteOverlay: 0,
        darkVignetteAlpha: 0,
        executionBannerTimer: 0,
        executionLine: null,
        cutsceneActive: false,

        camera: {
          x: 0,
          y: 0,
          zoom: 1.0,
          targetZoom: 1.0,
          shakeX: 0,
          shakeY: 0,
          shakeTime: 0,
          shakeDuration: 0,
          shakeAmp: 0,
          shakeFreq: 46,
          trauma: 0,
          shakeClock: 0
        },

        particles: [],
        shockwaves: [],
        slashArcs: [],
        fxList: [],
        leaves: [],
        mist: [],
        hitFx: [],
        comboCount: 0,
        comboTimer: 0,
        introT: 0,
        mode: "battle",
        bossDeath: null,
        hubStage: 1,
        hubNpcNear: false,
        gateClosed: true,
        pendingPre: false,
        dlgFocus: false,
        ultDim: 0,
        slowT: 0,
        slowScale: 1,
        _wasAir: false,
        _dustAcc: 0,
        _prevPState: "idle",
        _vyBefore: 0,
        afterimages: [],
        floatingTexts: [],
        flyingSwords: [],
        inkBambooLeaves: [],
        hazardZones: [],
        executionLines: [],
        clones: []
      };

      const Player = {
        x: 960,
        y: Config.groundY,
        vx: 0,
        vy: 0,
        w: 62,
        h: 112,
        facing: 1,

        hp: 1000,
        maxHp: 1000,
        stamina: 100,
        maxStamina: 100,
        staminaRecoverDelay: 0,
        gourds: 3,

        state: "idle",
        stateTimer: 0,
        comboStep: 0,
        comboWindow: 0,
        attackHitRegistered: false,

        parryStartMs: 0,
        riposteTimer: 0,
        invulnTimer: 0,
        hurtInv: 0,
        flashFrames: 0,
        atkCd: 0,
        canDoubleJump: true,
        canAirDash: true,
        airAtkUsed: false,
        lastDeflectMs: 0,
        chainCount: 0,
        isAirAtk: false,
        isDive: false,
        riposteAtk: false,

        inputBuffer: null,

        selectedAssist: "lingguang",
        assistAvailable: true,
        tishenActive: false,
        scarfNodes: [],
        parryCooldown: 0
      };

      const Boss = {
        artId: 1,
        stageId: 1,
        x: 1680,
        y: Config.groundY,
        vx: 0,
        vy: 0,
        w: 100,
        h: 162,
        facing: -1,

        hp: 2200,
        maxHp: 2200,
        posture: 0,
        maxPosture: 100,
        postureDecayDelay: 0,
        deathblows: 2,

        state: "idle",
        moveType: "slash1",
        isPerilous: false,
        perilType: null,
        stateTimer: 0,
        stateDur: 0,
        hitRegistered: false,
        comboChain: [],
        feintTriggered: false,
        feintPauseTimer: 0,
        teleportExecuted: false,
        comboHitsLeft: 0,
        comboHitTimer: 0,
        aiCooldown: 0.6,
        flashFrames: 0,
        ultCd: 12,
        hitReactT: 0,
        hitReactDur: 0.14,
        hitReactKind: "hit",
        staggerTimer: 0,
        frozenTimer: 0,
        grabZoneX: 0,
        auraParticles: [],
        hasSummonedClone: false,
        aerialBreak: 0,
        aerialTimer: 0,
        aerialShotTimer: 0,
        groundedTimer: 0,
        stance: "A",
        stanceCount: 0,
        rage: 0,
        lastHp: 0,
        landedHit: false,
        leapStartX: 0,
        leapLandX: 0
      };

      function initScenery() {
        Game.inkBambooLeaves = [];
        for (let i = 0; i < 55; i++) {
          Game.inkBambooLeaves.push({
            x: Math.random() * Config.worldWidth,
            y: Math.random() * Config.groundY,
            vx: -35 - Math.random() * 45,
            vy: 20 + Math.random() * 30,
            angle: Math.random() * Math.PI,
            vAngle: -0.8 + Math.random() * 1.6,
            len: 12 + Math.random() * 10
          });
        }
      }

      function initScarf() {
        Player.scarfNodes = [];
        for (let i = 0; i < 7; i++) {
          Player.scarfNodes.push({ x: Player.x - i * 8, y: Player.y - 70 });
        }
      }

      function hapticBuzz(p) {
        if (!Config.hapticLevel) return;
        try {
          if (!navigator.vibrate) return;
          const k = Config.hapticLevel === 1 ? 0.6 : 1;
          navigator.vibrate(Array.isArray(p) ? p.map(x => Math.max(1, Math.round(x * k))) : Math.max(1, Math.round(p * k)));
        } catch (e) { }
      }

      /* v0.8.8 定格改毫秒制：只凍結 Boss 與主角，粒子、鏡頭、輸入緩衝照跑；上限 120ms */
      function triggerHitstopMs(ms) {
        Game.hitstopT = Math.max(Game.hitstopT || 0, Math.min(120, ms) / 1000);
      }
      function triggerHitstop(frames) { triggerHitstopMs(frames * 1000 / 60); }
      function hitstopByDmg(dmg) { return Math.max(50, Math.min(100, 40 + dmg * 0.5)); }

      /* v0.8.8 Trauma 震屏：offset = 最大偏移 × trauma² × 平滑噪聲；每次受擊加 0.3～0.6，每秒衰減 1 */
      function _nh(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
      function noise1(x) {
        const i = Math.floor(x), f = x - i;
        const u = f * f * f * (f * (f * 6 - 15) + 10);
        const a = (_nh(i) * 2 - 1) * f, b = (_nh(i + 1) * 2 - 1) * (f - 1);
        return (a + (b - a) * u) * 2;
      }
      function addTrauma(v) { const c = Game.camera; c.trauma = Math.min(1, (c.trauma || 0) + v); }
      function triggerShake(dx, dy, amp, dur) {
        addTrauma(Math.max(0.25, Math.min(0.65, 0.3 + (amp - 11) * 0.013)));
      }

      function emitDust(x, y, dir, n, power) {
        for (let i = 0; i < n; i++) {
          Game.hitFx.push({
            type: "dust", x: x + (Math.random() - 0.5) * 14, y: y - 2,
            vx: dir * (30 + Math.random() * 90) * power + (Math.random() - 0.5) * 40,
            vy: -(10 + Math.random() * 55) * power,
            life: 0.35 + Math.random() * 0.25, maxLife: 0.6,
            size: 5 + Math.random() * 6 * power
          });
        }
      }

      /* v0.4.11 普攻打擊感：kind = "hit"(受擊) | "heavy"(重擊/第三段) | "block"(敵將格擋) */
      function bossHitFx(kind) {
        const dir = Player.facing;
        const step = Player.comboStep || 1;
        const heavy = kind === "heavy";
        const guard = kind === "block";
        Boss.hitReactKind = kind;
        Boss.hitReactDur = heavy ? 0.2 : guard ? 0.1 : 0.14;
        Boss.hitReactT = Boss.hitReactDur;
        Boss.flashFrames = Math.max(Boss.flashFrames, heavy ? 5 : guard ? 2 : 4);

        const hx = Boss.x - dir * 22;
        const hy = Boss.y - (Stages[Boss.stageId].sprite ? 150 : 88);
        if (!guard) {
          Game.comboCount++;
          Game.comboTimer = 2.0;
        }
        const cc = Game.comboCount;
        const baseAng = step === 2 ? -0.6 : 0.6;
        const slashLen = (heavy ? 190 : guard ? 90 : 135) * CHAR_K;
        const tierColor = cc >= 8 ? "#fb923c" : cc >= 5 ? "#fde047" : cc >= 3 ? "#67e8f9" : "#e0f2fe";
        const color = guard ? "#cbd5e1" : heavy ? (cc >= 8 ? "#fb923c" : "#fde047") : tierColor;
        Game.hitFx.push({ type: "slash", x: hx, y: hy, dir, ang: baseAng, len: slashLen, life: heavy ? 0.16 : 0.11, maxLife: heavy ? 0.16 : 0.11, w: heavy ? 7 : 4.5, color });
        if (heavy) Game.hitFx.push({ type: "slash", x: hx, y: hy, dir, ang: -baseAng, len: slashLen * 0.85, life: 0.16, maxLife: 0.16, w: 5.5, color });

        if (fxReady("spark")) spawnFx("spark", guard ? 1 : 0, hx, hy, { w: heavy ? 250 : guard ? 160 : 180, dur: heavy ? 0.28 : 0.22, facing: dir, alpha: 0.85 });
        const n = heavy ? 12 : guard ? 6 : 8;
        for (let i = 0; i < n; i++) {
          const sp = (heavy ? 520 : 400) * (0.5 + Math.random() * 0.7);
          const a = (Math.random() - 0.5) * 1.5;
          Game.hitFx.push({
            type: "spark", x: hx, y: hy,
            vx: Math.cos(a) * sp * dir, vy: Math.sin(a) * sp - 120,
            life: 0.22 + Math.random() * 0.12, maxLife: 0.34,
            color: guard ? "#fdba74" : "#fef3c7", size: 2.4 + Math.random() * 1.8
          });
        }

        if (heavy) {
          triggerHitstop(8);
          triggerShake(dir, -0.15, 18, 0.22);
          Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + 0.03);
          Boss.vx = dir * 130;
          Sound.play("slash", 0.55, 0.6);
        }
        hapticBuzz(heavy ? [30, 20, 35] : guard ? 10 : 18);
        if (!guard) Sound.play("block", 0.3, 0.55 + 0.08 * step);
        Sound.play("hit", guard ? 0.3 : 0.55, 0.78 + 0.1 * step + (guard ? 0 : Math.min(0.45, Game.comboCount * 0.035)));
      }

      function spawnSparks(x, y, type, dirX = 1) {
        const isBig = type === "parry" || type === "mikiri" || type === "execution";
        Game.shockwaves.push({
          x, y, r: 6,
          maxR: type === "execution" ? 280 : isBig ? 160 : 75,
          alpha: 1.0,
          color: type === "parry" ? "#fde047" : type === "mikiri" ? "#38bdf8" : "#f87171",
          lineWidth: isBig ? 5 : 2.5,
          starburst: isBig
        });

        const num = type === "execution" ? 50 : isBig ? 30 : 16;
        for (let i = 0; i < num; i++) {
          const angle = (dirX >= 0 ? -Math.PI * 0.35 : -Math.PI * 0.65) + (Math.random() - 0.5) * (isBig ? 2.5 : 1.2);
          const spd = (isBig ? 260 : 160) + Math.random() * 520;
          const colors =
            type === "parry"
              ? ["#fef08a", "#fde047", "#38bdf8", "#ffffff"]
              : type === "mikiri"
              ? ["#38bdf8", "#34d399", "#fef08a", "#ffffff"]
              : ["#fb923c", "#fde047", "#f87171", "#ffffff"];

          Game.particles.push({
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 60,
            size: 2.2 + Math.random() * 3.5,
            life: 0.25 + Math.random() * 0.3,
            maxLife: 0.55,
            color: colors[i % colors.length],
            gravity: 1200
          });
        }
      }

      /* M2 浮字規則（空洞騎士式減法）：傷害數字預設關閉（localStorage qingyun_dmgnum="1" 才顯示）；
         處決時畫面中央已有書法大字，「一劍青雲」系列浮字一律不再疊；同一位置 0.25 秒內不重複堆字 */
      const FT_RULE = { dmg: (() => { try { return localStorage.getItem("qingyun_dmgnum") === "1"; } catch (e) { return false; } })() };
      function spawnFloatingText(x, y, text, color = "#fef08a", scale = 1.0) {
        text = String(text);
        if (/一劍青雲/.test(text)) return;
        if (!FT_RULE.dmg) { text = text.replace(/\s*[-+]\s*\d+(\.\d+)?%?/g, "").replace(/^\s*\d+\s*$/, "").trim(); if (!text) return; }
        const nowT = performance.now();
        if (Game.floatingTexts.some((f) => f.text === text && Math.abs(f.x - x) < 60 && nowT - (f.t0 || 0) < 250)) return;
        Game.floatingTexts.push({ t0: nowT,
          x, y, vy: -65, text, color, scale, life: 0.95, maxLife: 0.95
        });
      }

      const BATTLE_LOG = [];
      function setTelemetry(txt) {
        const el = document.getElementById("telemetry-ribbon");
        if (el) el.textContent = txt;
        BATTLE_LOG.push(txt);
        if (BATTLE_LOG.length > 60) BATTLE_LOG.shift();
      }
      function hintOnce(key, text) {
        let seen = {};
        try { seen = JSON.parse(localStorage.getItem("qingyun_hints") || "{}") || {}; } catch (e) { }
        if (seen[key]) return;
        seen[key] = 1;
        try { localStorage.setItem("qingyun_hints", JSON.stringify(seen)); } catch (e) { }
        showHintToast(text);
      }
