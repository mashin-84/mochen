      /* =========================================================================
       * 4. 墨塵招式派生與按鍵邏輯
       * ========================================================================= */
      const Keys = { left: false, right: false, last: 0 };
      /* v0.8.186 主角移動手感（集中調整）：speed 全速；accel／decel 地面加減速（px/s²）；turnK 轉身時加速倍率；air* 空中；jumpBufMs 落地前預按跳；coyoteMs 離開平台邊緣後仍可起跳 */
      const MOVE = { speed: 580, accel: 8500, decel: 7500, turnK: 2.6, airAccel: 5200, airDecel: 2600, jumpBufMs: 130, coyoteMs: 90 };

      function bufferAction(actionName) {
        Player.inputBuffer = { action: actionName, time: performance.now() };
      }

      function executeBuffered() {
        if (!Player.inputBuffer) return;
        if (performance.now() - Player.inputBuffer.time > 180) {
          Player.inputBuffer = null;
          return;
        }

        const act = Player.inputBuffer.action;
        Player.inputBuffer = null;
        if (act === "attack") doAttack();
        else if (act === "parry") doParry();
        else if (act === "dash") doDash();
        else if (act === "jump") doJump();
        else if (act === "gourd") doDrinkGourd();
      }

      /* v0.8.65 戰鬥中的過場（對白、擊敗後演出、結算、敗北）物理已暫停，按鍵不再改主角狀態（原本會卡在跳躍／攻擊姿勢浮在空中） */
      function inputLocked() { return Game.mode === "battle" && (Game.cutsceneActive || Game.ultLock); } /* v0.8.166 Game.ultLock：大招角力中鎖操作 */

      function startAttackCharge() {
        if (Game.ultBind) return; /* v0.8.168 大招劍陣鎖身：只能招架 */
        Sound.resume();
        if (Game.mode === "hub") {
          if (Game.hubNpcNear) hubTalk();
          return;
        }
        if (Game.mode === "enter" || inputLocked()) return;
        if (Player.state === "execution" || Player.state === "hitstun") {
          bufferAction("attack");
          return;
        }
        const dist = Math.abs(Player.x - Boss.x);
        if (Boss.state === "staggered" && dist <= 195 + bossHurt()) {
          performExecution();
          return;
        }
        // 按下立即出招 (零延遲)；第 4 關起，按住滿 0.45 秒追加蓄力重斬
        Player._atkBuffered = false;
        doNormalAttack();
        if (Progress.unlockedStages >= 3 && !Player._atkBuffered) { /* v0.8.186 這一下只是記進緩衝（上一刀還在收招）就不開始蓄力，連按時不會誤放蓄力斬 */ /* v0.8.171 蓄力斬改在進第 3 關時解鎖（原 >=4：第 3 關的玄鐵壓頂與寒川十字都要蓄力斬，第一次打卻放不出來） */
          Player.isChargingAttack = true;
          Player.attackChargeStartTime = performance.now();
        }
      }

      function releaseAttackCharge() {
        Player.isChargingAttack = false;
      }

      function doChargedAttack() {
        Sound.resume();
        Mirror.noteCharge();
        if (Player.state === "execution" || Player.state === "hitstun") return;

        // 蓄力重擊：消耗 25 體力；體力 < 25 時阻斷並提示
        if (Player.stamina < 25) {
          spawnFloatingText(Player.x, Player.y - 110, "劍勢不足蓄力！", "#94a3b8", 1.0);
          setTelemetry("〔劍勢不繼：蓄力重擊需消耗 25 點劍勢體力，請暫退調息！〕");
          return;
        }

        Player.stamina = Math.max(0, Player.stamina - 25);
        Player.staminaRecoverDelay = 0.35;
        if (Player.state === "drink") Player.state = "idle";

        Player.state = "attack";
        Player.isChargedAttack = true;
        Player.isAirAtk = false; Player.isDive = false; Player.riposteAtk = false;
        Player.stateTimer = 0.32;
        Player.atkCd = 0.32;
        Player.facing = aimX() >= Player.x ? 1 : -1;
        Player.attackHitRegistered = false;
        Player.comboStep = 4; // 蓄力重斬標記

        Player.vx = Player.facing * 360;
        Sound.play("slash", 1.0, 0.85);

        const hasEcho11 = Progress.echoes && Progress.echoes.includes(11);
        const arcRadius = Math.round(145 * CHAR_K * (hasEcho11 ? 1.08 : 1.0));
        const arcColor = hasEcho11 ? "#0284c7" : "#f59e0b"; // 卷三回響11：斬擊弧光改天青色，範圍+8%

        Game.slashArcs.push({
          x: Player.x + Player.facing * 24,
          y: Player.y - 48,
          facing: Player.facing,
          radius: arcRadius,
          startAngle: -1.05,
          endAngle: 1.15,
          life: 0.22, maxLife: 0.22,
          color: arcColor,
          art: fxReady("slash")
        });
        if (fxReady("slash")) spawnFx("slash", 3, Player.x + Player.facing * 90, Player.y - 105, { w: 470, dur: 0.32, facing: Player.facing });

        spawnFloatingText(Player.x, Player.y - 120, "【青雲蓄力重斬】破勢貫注！", "#fde047", 1.3);
        setTelemetry("✦ 釋放【青雲蓄力重斬】！命中霸體前搖可強制破防中斷！");
      }

      function doNormalAttack() {
        if (Game.ultBind) return; /* v0.8.168 大招劍陣鎖身：只能招架 */
        Sound.resume();
        Mirror.noteAttack(); Reader.note("atk");
        if (Player.state === "execution" || Player.state === "hitstun") {
          bufferAction("attack");
          return;
        }

        const dist = Math.abs(Player.x - Boss.x);
        if (Boss.state === "staggered" && dist <= 195 + bossHurt()) {
          performExecution();
          return;
        }

        /* v0.8.183 普攻不再消耗劍勢（限制連按交給 Boss 格擋第三刀的完美彈刀）；劍勢只給瞬步、蓄力斬、普通格擋用 */
        if (Player.state === "drink") Player.state = "idle";
        if (Player.atkCd > 0.08) {
          bufferAction("attack"); Player._atkBuffered = true;
          return;
        }
        if (Player.y < PG() - 24) { doAirAttack(); return; }

        Player.facing = aimX() >= Player.x ? 1 : -1;
        const isRiposte = Player.riposteTimer > 0;
        Player.isAirAtk = false; Player.isDive = false; Player.riposteAtk = isRiposte;
        if (isRiposte) {
          Player.riposteTimer = 0;
          Player.comboStep = 3;
        } else if (Player.comboWindow > 0) {
          Player.comboStep = (Player.comboStep % 3) + 1;
        } else {
          Player.comboStep = 1;
        }

        Player.state = "attack";
        Player.isChargedAttack = false;
        Player.stateTimer = Player.comboStep === 3 ? 0.75 : 0.55;
        Player.atkCd = Player.stateTimer;
        Player.comboWindow = 0.85;
        Player.attackHitRegistered = false;
        Player.vx = Player.facing * (isRiposte ? 440 : Player.comboStep === 3 ? 340 : 220);
        if (Player.y >= PG() - 2) emitDust(Player.x - Player.facing * 12, PG(), -Player.facing, 3, 0.9);

        Sound.play("slash", 0.85, 0.95 + Player.comboStep * 0.08);

        const hasEcho11 = Progress.echoes && Progress.echoes.includes(11);
        const baseRadius = (isRiposte ? 130 : Player.comboStep === 3 ? 118 : 96) * CHAR_K;
        const arcRadius = Math.round(baseRadius * (hasEcho11 ? 1.08 : 1.0));
        const arcColor = isRiposte ? "#fde047" : (hasEcho11 ? "#0284c7" : "#38bdf8"); // 回響11天青色

        Game.slashArcs.push({
          x: Player.x + Player.facing * 18,
          y: Player.y - 48,
          facing: Player.facing,
          radius: arcRadius,
          startAngle: Player.comboStep === 2 ? 0.95 : -0.95,
          endAngle: Player.comboStep === 2 ? -0.95 : 1.05,
          life: 0.17, maxLife: 0.17,
          color: arcColor,
          isRiposte,
          art: fxReady(isRiposte ? "air" : "slash")
        });
        playerSlashFx(isRiposte);
      }

      /* v0.8.1 空中攻擊：凌空斬（空中一次）／下劈（下落中在 Boss 上方）。落地前不會被 atkCd 卡住 */
      function doAirAttack() {
        if (Player.airAtkUsed) { bufferAction("attack"); return; }
        Player.airAtkUsed = true;
        Player.facing = aimX() >= Player.x ? 1 : -1; /* v0.8.183 空中攻擊也不扣劍勢 */
        const dxA = Math.abs(aimX() - Player.x);
        const dive = Player.vy > -120 && dxA <= 130 * CHAR_K + bossHurt() && Player.y < Boss.y - 50;
        const isRiposte = Player.riposteTimer > 0;
        Player.riposteTimer = 0;
        Player.riposteAtk = isRiposte;
        Player.state = "attack";
        Player.isChargedAttack = false;
        Player.isAirAtk = true;
        Player.isDive = dive;
        Player.comboStep = dive ? 2 : 1;
        Player.comboWindow = 0;
        Player.attackHitRegistered = false;
        Player.stateTimer = dive ? 0.9 : 0.4;
        Player.atkCd = dive ? 0.5 : 0.4;
        Sound.play("slash", 0.85, dive ? 0.8 : 1.15);
        if (dive) {
          Player.vx = Player.facing * 60;
          Player.vy = 980;
          Game.afterimages.push({ x: Player.x, y: Player.y, w: Player.w, h: Player.h, alpha: 0.5, color: "#fde047" });
          spawnFloatingText(Player.x, Player.y - 120, "【凌空下劈】", "#fde047", 1.1);
          if (fxReady("air")) spawnFx("air", 1, Player.x, Config.groundY + 8, { anchor: "b", w: 400, dur: 0.5 });
          hintOnce("dive", "下落時在敵人頭頂按攻擊＝下劈，架勢傷害更高（每次騰空限一次）");
        } else {
          Player.vx = Player.facing * 200;
          Player.vy = Math.min(Player.vy, 0) * 0.3 - 60;
          Game.slashArcs.push({
            x: Player.x + Player.facing * 18, y: Player.y - 48, facing: Player.facing,
            radius: Math.round(110 * CHAR_K), startAngle: -1.1, endAngle: 0.9,
            life: 0.17, maxLife: 0.17, color: isRiposte ? "#fde047" : "#7dd3fc", isRiposte, art: fxReady("air")
          });
          if (fxReady("air")) spawnFx("air", isRiposte ? 3 : 0, Player.x + Player.facing * 60, Player.y - 100, { w: 340, dur: 0.24, facing: Player.facing });
          hintOnce("airslash", "空中按攻擊＝凌空斬（每次騰空限一次）");
        }
      }

      function airAttackHit() {
        if (partsBusy()) { if (partsMode() && partsTryHit(true)) Player.attackHitRegistered = true; return; } /* v0.8.83 部位 Boss */
        if (xwTryHit(true) || partnerTryHit(true) || illusionTryHit(true)) { Player.attackHitRegistered = true; return; } /* v0.8.55 打到幻影 */
        const dx = Boss.x - Player.x;
        const dive = Player.isDive;
        const reach = (dive ? 100 : 135) * CHAR_K;
        const hurtH = bossHurt();
        const hitX = dive ? Math.abs(dx) <= reach + hurtH : (dx * Player.facing >= -30 && Math.abs(dx) <= reach + hurtH);
        const hitY = dive ? (Player.y >= Boss.y - Boss.h * 0.95 && Player.y <= Boss.y + 30) : Math.abs(Player.y - Boss.y) < 170;
        if (!hitX || !hitY) return;
        Player.attackHitRegistered = true;
        if (mirrorTryCounter()) return;
        const isPunish = (Boss.state === "staggered" || Boss.state === "frozen" || Boss.state === "recover" || Boss.state === "grounded");
        let dmg = dive ? 85 : 55;
        let post = dive ? 18 : 7;
        if (isPunish) { dmg = Math.round(dmg * 1.6); post = Math.round(post * 1.3); }
        if (Player.riposteAtk) { post *= 2; Player.riposteAtk = false; }
        if (Progress.echoes && Progress.echoes.includes(14)) dmg = Math.round(dmg * 1.10);
        if (Progress.equippedSeals.includes("juemai") && Player.hp / Player.maxHp <= 0.35) dmg = Math.round(dmg * 1.8);
        Boss.consecutiveBlocks = 0;
        Boss.hp = Math.max(1, Boss.hp - dmg);
        Boss.flashFrames = 2;
        Boss.vx = Player.facing * 70;
        Sound.play("hit", 0.9, dive ? 0.8 : 1.05);
        Sound.play("s_hit", 0.6, dive ? 0.9 : 1.0);
        triggerHitstopMs(hitstopByDmg(dmg) + (dive ? 15 : 0));
        triggerShake(Player.facing, dive ? 0.6 : -0.15, dive ? 20 : 11, dive ? 0.24 : 0.16);
        spawnSparks((Player.x + Boss.x) * 0.5, Boss.y - (dive ? Boss.h * 0.85 : 62), "hit", Player.facing);
        bossHitFx(dive ? "heavy" : "hit");
        damageBossPosture(post, null, Boss.maxPosture * (dive ? 0.8 : 0.6), false, true);
        spawnFloatingText(Boss.x + (Math.random() - 0.5) * 24, Boss.y - 105, `-${dmg}${dive ? " 下劈" : " 凌空"}`, "#7dd3fc", dive ? 1.2 : 1.0);
        setTelemetry(`${dive ? "凌空下劈" : "凌空斬"}命中 (-${dmg} 氣血 / 架勢 +${post}%)`);
        if (dive) {
          Player.vy = -420; Player.vx = -Player.facing * 160; Player.stateTimer = 0.12;
          hapticBuzz(20);
        }
      }

      function doAttack() {
        doNormalAttack();
      }

      function getStageParryBonus() { return 20; } /* v0.8.183 全關統一 130+20＝150ms（原第 1～3 關 170、4～6 關 150、7～9 關 130，玩家看不到；手機觸控有延遲，150 體感約等於主機 120） */
      const PARRY_SPAM_K = [1, 0.47, 0.23]; /* v0.8.183 隻狼式連按懲罰：0.5 秒內重按招架，完美窗口 150→70→35ms */

      function getParryWindowMs(isPerilThrust) {
        let base = Config.parryWindowMs + getStageParryBonus();
        if (Progress.echoes && Progress.echoes.includes(13)) base += 20;
        /* v0.8.183 問心印（預設裝備）原本把窗口 ×0.7，等於大家實際只有 105ms；改為不縮窗口（保留架勢 ×2），全關實際 150ms。心印系統是否封存待使用者決定 */
        if (isPerilThrust) base = Math.round(base * 0.8);
        base = Math.round(base * PARRY_SPAM_K[Math.min(2, Player._parrySpam || 0)]);
        return base;
      }

      function doParry() {
        Sound.resume();
        if (Game.ultLock && ultClashPress()) return; /* v0.8.167 大招角力：連按招架推角力條 */
        if (inputLocked()) return;
        Mirror.noteParry(); Reader.note("parry");
        if (Player.state === "execution") return;
        if (Player.state === "hitstun") {
          if (Player.stateTimer > 0.16) {
            Player.state = "idle";
          } else {
            bufferAction("parry");
            return;
          }
        }

        const now = performance.now();
        /* v0.8.186 連按判定 500ms → 招架姿勢長度（360ms）：姿勢還沒結束就重按才算連按；普通格擋後隔 0.4 秒認真再按下一刀不受罰 */ /* v0.8.183 取消 0.55 秒招架冷卻（原本普通格擋後有 0.19 秒按不出來的死區）：永遠舉得起劍，但 0.5 秒內連按會縮小完美窗口；完美招架後重置 */
        Player._parrySpam = (Player._lastParryPress && now - Player._lastParryPress < Config.guardStanceMs) ? Math.min(2, (Player._parrySpam || 0) + 1) : 0;
        Player._lastParryPress = now;

        Player.state = "parry";
        { const tx = partsBusy() ? partsThreatX() : null; Player.facing = (tx == null ? Boss.x : tx) >= Player.x ? 1 : -1; } /* v0.8.90 部位 Boss：面向來襲的飛劍／出招部位 */
        Player.stateTimer = Config.guardStanceMs / 1000;
        Player.parryStartMs = now;
        Player.vx *= 0.1;
        Player.parryCooldown = 0;

        Sound.play("slash", 0.35, 1.55);
      }

      function doDash() {
        if (Game.ultBind) return; /* v0.8.168 大招劍陣鎖身：只能招架 */
        Sound.resume();
        if (inputLocked()) return;
        Mirror.noteDash(); Reader.note("dash");
        if (Player.state === "execution") return;

        // 【替身殘影反切】(Stage 3+ Unlocked mechanic):
        // If in hitstun and pressing Dash, instantly trigger talisman decoy and counter behind!
        // 規則要求：【替身殘影反切】（受擊中按瞬步）維持不耗體力
        if (Player.state === "hitstun" && Progress.unlockedStages >= 3 && Math.abs(Boss.x - Player.x) <= 420 && !Boss._ultAir && Boss.y >= Config.groundY - 40) { /* v0.8.170 限制距離：Boss 420px 內且在地面才反切（原本不限距離，被遠處劍雨／投射物打中時會瞬移一大段、甚至瞬移到浮空 Boss 底下） */
          Player.state = "idle";
          Player.invulnTimer = 1.2;
          Player.x = Math.max(120, Math.min(Config.worldWidth - 120, Boss.x - Boss.facing * 140));
          Player.facing = Boss.facing;
          Player.riposteTimer = 1.2;
          Sound.play("assist", 0.5, 1.4); /* 替身反切 */
          triggerHitstop(5);
          triggerShake(0, 1, 16, 0.2);
          spawnSparks(Player.x, Player.y - 50, "mikiri", 1);
          spawnFloatingText(Player.x, Player.y - 120, "【替身殘影反切】移形換位！", "#fde047", 1.35);
          setTelemetry("★ 觸發【替身殘影反切】！移形換位至敵將身後，下一次斬擊威力暴漲！");
          return;
        } else if (Player.state === "hitstun") {
          bufferAction("dash");
          return;
        }

        // 空中二段瞬身判定：解鎖條件 Progress.unlockedStages >= 2，每次騰空限用 1 次
        const isAirborne = Player.y < PG() - 10;
        if (isAirborne) {
          if (Progress.unlockedStages < 2) {
            spawnFloatingText(Player.x, Player.y - 95, "空中瞬身未解鎖 (需通關第2難)", "#94a3b8", 1.0);
            return;
          }
          if (!Player.canAirDash) return;
        }

        // 瞬步體力檢查與消耗：消耗 20 體力；體力 < 20 時阻斷並顯示「劍勢不繼」浮字
        if (Player.stamina < 20) {
          spawnFloatingText(Player.x, Player.y - 110, "劍勢不繼！", "#94a3b8", 1.0);
          setTelemetry("〔劍勢不繼：瞬步需消耗 20 點劍勢體力，請暫退調息！〕");
          return;
        }

        Player.stamina = Math.max(0, Player.stamina - 20);
        if (isAirborne) Player.canAirDash = false;
        // 瞬步期間與結束後 0.35 秒內不回復體力
        Player.staminaRecoverDelay = 0.35;

        let dir = 0;
        if (Keys.left && !Keys.right) dir = -1;
        else if (Keys.right && !Keys.left) dir = 1;
        else dir = Boss.x >= Player.x ? 1 : -1;

        Player.facing = dir;
        Player.state = "dash";
        if (!isAirborne) emitDust(Player.x, PG(), -dir, 6, 1.3);

        if (isAirborne) {
          // 空中二段瞬身：v0.7.10 速度、距離與地面瞬步相同（780 × 0.22 秒）；無敵 0.15 秒、落地重置、不造成無限滯空
          Player.stateTimer = 0.22;
          let invulnDuration = 0.15;
          if (Progress.equippedSeals.includes("tafeng")) invulnDuration *= 1.5;
          Player.invulnTimer = invulnDuration;
          Player.vx = dir * 780;
          Player.vy = Math.min(Player.vy, 80); // 重力自然接續，絕不無限浮空
        } else {
          // 地面常規瞬步
          Player.stateTimer = 0.22;
          let invulnDuration = 0.20;
          if (Progress.equippedSeals.includes("tafeng")) invulnDuration *= 1.5;
          Player.invulnTimer = invulnDuration;
          Player.vx = dir * 780;
        }

        for (let i = 0; i < (Progress.equippedSeals.includes("tafeng") ? 5 : 3); i++) {
          Game.afterimages.push({
            x: Player.x - dir * i * 22, y: Player.y, w: Player.w, h: Player.h,
            alpha: 0.65 - i * 0.12, color: isAirborne ? "#34d399" : "#38bdf8"
          });
        }
        if (isAirborne) {
          spawnSparks(Player.x, Player.y - 20, "mikiri", dir);
          spawnFloatingText(Player.x, Player.y - 95, "【空中踏風瞬身】", "#34d399", 1.15);
        }
        Sound.play("slash", 0.22, 1.12); /* v0.8.71 瞬步聲改輕（原 0.55／音高 1.4 太刺耳），有就好 */

        const dist = Math.abs(Player.x - Boss.x);
        const movingTowards = (Boss.x - Player.x) * dir > 0;
        if (
          Boss.isPerilous &&
          Boss.perilType === "thrust" &&
          (Boss.state === "active" || (Boss.state === "windup" && Boss.stateTimer < 0.24)) &&
          movingTowards && dist < 340
        ) {
          triggerMikiriCounter();
        }
      }

      function doJump() {
        if (Game.ultBind) return; /* v0.8.168 大招劍陣鎖身：只能招架 */
        Sound.resume();
        if (inputLocked()) return;
        if (Player.state === "execution" || Player.state === "hitstun") {
          bufferAction("jump");
          return;
        }

        const coyote = Player.y < PG() - 4 && Player.vy >= 0 && !Player._coyoteUsed && Player.canDoubleJump && performance.now() - (Player._groundMs || 0) < MOVE.coyoteMs && Game.plats.length > 0; /* v0.8.186 離地寬限：走出平台邊緣 0.09 秒內按跳仍算第一段跳（只在有平台的關卡有意義） */
        if (Player.y >= PG() - 4 || coyote) {
          if (!coyote) Player.y = PG();
          Player._coyoteUsed = coyote;
          Player.vy = -860; Reader.note("jump");
          Player.state = "jump";
          Player.canDoubleJump = true;
          Player.canAirDash = true;
          Sound.play("slash", 0.45, 1.25);
          return;
        }

        const horizDist = Math.abs(Player.x - Boss.x);
        if (horizDist < 140 && Player.y < PG() - 25 && !Player.hasVaulted && !partsBusy() && !Game.plats.length) {
          triggerVaultStomp();
          return;
        }

        if (!Player.canDoubleJump && Player.vy > 0) Player._jumpBuf = performance.now(); /* v0.8.186 兩段跳都用完、正在下落時按跳：記住，落地瞬間起跳 */
        if (Player.canDoubleJump) {
          Player.canDoubleJump = false;
          Player.vy = -740;
          Game.afterimages.push({
            x: Player.x, y: Player.y, w: Player.w, h: Player.h, alpha: 0.5, color: "#38bdf8"
          });
          Sound.play("slash", 0.45, 1.45);
        }
      }

      function doDrinkGourd() {
        if (Game.ultBind) return; /* v0.8.168 大招劍陣鎖身：只能招架 */
        Sound.resume();
        if (inputLocked()) return;
        if (Player.state === "execution" || Player.state === "hitstun") return;
        if (Player.gourds <= 0) {
          spawnFloatingText(Player.x, Player.y - 110, "青雲仙釀已空！", "#94a3b8", 1.0);
          return;
        }
        if (Player.hp >= Player.maxHp) {
          spawnFloatingText(Player.x, Player.y - 110, "真元氣血已充盈", "#94a3b8", 0.95);
          return;
        }

        Player.gourds--;
        Player.state = "drink";
        let drinkDuration = 1.2; /* v0.8.159 喝藥 0.85 → 1.2 秒 */
        let healAmount = 350; /* v0.8.159 葫蘆回血 450 → 350 */
        if (Progress.equippedSeals.includes("ningshen")) {
          drinkDuration *= 0.5;
          healAmount = 500; /* v0.8.159 寧神印記 600 → 500（同步 -100）*/
        }
        Player.stateTimer = drinkDuration;
        Player.vx = 0;
        Sound.play("gourd", 0.95, 1.0);

        Player.hp = Math.min(Player.maxHp, Player.hp + healAmount);
        spawnFloatingText(Player.x, Player.y - 120, `飲【青雲仙釀】+${healAmount} 氣血`, "#34d399", 1.2);
        if (fxReady("heal_fx")) { /* v0.8.125 回血特效改生圖 heal_fx：酒氣升騰→綠色光環＋光粒上升→光粒歸入身體（取代程式粒子） */
          const px = Player.x, py = Player.y;
          spawnFx("heal_fx", 1, px, py - 105, { w: 170, dur: 0.55 });
          spawnFx("heal_fx", 2, px, py - 125, { w: 310, dur: drinkDuration * 0.9, follow: () => ({ x: Player.x, y: Player.y - 125 }) });
          spawnFx("heal_fx", 0, px, py + 6, { anchor: "b", w: 230, dur: drinkDuration + 0.25, loop: true, fps: 8, follow: () => ({ x: Player.x, y: Player.y + 6 }) });
          setTimeout(() => spawnFx("heal_fx", 3, Player.x, Player.y - 90, { w: 280, dur: 0.5, follow: () => ({ x: Player.x, y: Player.y - 90 }) }), Math.max(150, drinkDuration * 650));
        } else {
        for (let i = 0; i < 20; i++) {
          Game.particles.push({
            x: Player.x + (Math.random() - 0.5) * 40,
            y: Player.y - 60 + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 60,
            vy: -80 - Math.random() * 120,
            size: 3, life: 0.5, maxLife: 0.5, color: "#34d399", gravity: -100
          });
        }
        }
        updateGourdUI();
        setTelemetry("〔提示：飲用回生酒恢復氣血，謹防 Boss 突襲〕");
      }

      function triggerMikiriCounter() {
        Boss.hitRegistered = true;
        Boss.state = "recover";
        Boss.stateTimer = 0.68;
        Boss.isPerilous = false;
        Boss.vx = 0;

        Player.x = Boss.x + Boss.facing * 70;
        Player.y = Config.groundY;
        Player.vx = 0;
        Player.vy = 0;
        Player.invulnTimer = 0.45;
        Player.riposteTimer = 1.2;
        Player.flashFrames = 2;
        Boss.flashFrames = 3;
        // 成功【踏劍看破】退還 10 點劍勢體力
        Player.stamina = Math.min(Player.maxStamina, Player.stamina + 10);
        Progress.mikiriCount++;

        Sound.play("mikiri", 0.47, 1.0); /* v0.8.109 閃過敵人的看破音量減半 */
        triggerHitstopMs(100);
        triggerShake(Boss.facing, 0.35, 24, 0.32);
        spawnSparks((Player.x + Boss.x) * 0.5, Config.groundY - 45, "mikiri", -Boss.facing);

        damageBossPosture(34, "【踏劍看破】架勢 +34%");
        spawnFloatingText(Player.x, Player.y - 118, "【踏劍看破】踩刃截擊！", "#38bdf8", 1.3);
        setTelemetry("✦ 踏劍看破成功！踩踏刃尖反制其後背｜架勢 +34%");
      }

      function triggerVaultStomp() {
        Player.hasVaulted = true; // Strict lock: Only 1 vault kick per jump!
        Player.vy = -780;
        Player.vx = -Player.facing * 160;
        Player.invulnTimer = 0.35;
        Boss.flashFrames = 2;

        const isSweep = Boss.isPerilous && (Boss.perilType === "sweep" || (Boss.perilType === "leap" && Boss.state === "active"));
        if (isSweep) {
          Boss.hitRegistered = true;
          Boss.isPerilous = false;
          Boss.state = "recover";
          Boss.stateTimer = 0.62;
          Boss.vx = 0;
          Progress.mikiriCount++;
          Sound.play("mikiri", 0.47, 1.15);
          triggerHitstopMs(90);
          triggerShake(0, 1, 22, 0.28);
          spawnSparks(Boss.x, Boss.y - Boss.h, "mikiri", 0);
          damageBossPosture(34, "凌空踩頭破危！架勢 +34%");
          spawnFloatingText(Boss.x, Boss.y - Boss.h - 30, "【凌空踩頭】破除橫掃危！", "#34d399", 1.25);
          setTelemetry("✦ 凌空踩頭成功破解【橫掃・危】！Boss 架勢大損 +34%");
        } else {
          Sound.play("block", 0.6, 1.3);
          spawnSparks(Boss.x, Boss.y - Boss.h, "block", 0);
          damageBossPosture(2, null);
          spawnFloatingText(Boss.x, Boss.y - Boss.h - 20, "借力騰空 (非橫掃危)", "#94a3b8", 0.95);
          setTelemetry("〔借力騰空：唯有敵方施展【橫掃・危】時踩頭方可破勢〕");
        }
      }

      function bossRefillP2() { /* v0.8.151 進二階段：換成二階段血條並補滿（血條有填滿動畫 Boss._fillT） */
        if (!Boss.maxHp2) return;
        Boss.maxHp = Boss.maxHp2; Boss.maxHp2 = 0; Boss.hp = Boss.maxHp; Boss.lastHp = Boss.maxHp; Boss._fillT = performance.now(); Boss._hpOut = false;
      }
      function getExecutionDmgRatio(stageId) {
        if (stageId <= 1) return 0.20;
        if (stageId <= 3) return 0.30;
        if (stageId <= 6) return 0.30;
        return 0.20;
      }

      function performExecution() {
        if (mechPhase3Intercept()) return; /* v0.8.180 第 8 關：二階段血見底的處決被彈開 → 三階段 */
        hapticBuzz([40, 30, 40, 30, 90]);
        Music.duck(0.4, 1.3); /* v0.8.74 處決時音樂壓低（目前只在第 1 關生效） */
        Player.state = "execution";
        Player.invulnTimer = 1.4;
        Player.facing = Boss.x >= Player.x ? 1 : -1;

        const isJiVersion = Progress.unlockedStages >= 5;
        executionFx(isJiVersion);
        let baseRatio = getExecutionDmgRatio(Boss.stageId);
        let execRatio = isJiVersion ? baseRatio * 1.15 : baseRatio;
        let execDmg = Math.round(Boss.maxHp * execRatio);
        { const S2b = Stages[Boss.stageId]; if (Boss._split) { /* v0.8.151 每階段一條血：一階段處決＝直接進二階段（不扣、不會擊敗，二階段補滿）；二階段處決扣二階段血條 30%，不夠扣就擊敗 */
          execDmg = Config.bossPhase === 2 ? Math.round(Boss.maxHp * 0.3) : (Boss.hp > 1 ? Math.min(Math.round(Boss.maxHp * 0.3), Boss.hp - 1) : 0); } } /* v0.8.158 一階段中途處決也只扣 30% 血條（不再直通二階段）；血見底（hp≤1）後的處決才進二階段 */
        const stay1 = !!(Boss._split && Config.bossPhase !== 2 && Boss.hp > 1); /* v0.8.158 一階段、血條還沒見底的處決：留在一階段 */
        const ek = Stages[Boss.stageId].execKill;
        if (ek && Config.bossPhase === 2) { /* v0.8.83 第 4 關：二階段處決計次；v0.8.90 execKill＝數字時要處決該次數才擊敗（前幾次血量砍到剩一半以下） */
          Boss._ekN = (Boss._ekN || 0) + 1;
          execDmg = Boss._ekN >= (ek === true ? 1 : ek) ? Boss.hp : Math.max(1, Math.min(Boss.hp - 1, Boss.hp - Math.round(Boss.maxHp * 0.5)));
        }

        if (isJiVersion) {
          // 第 5 關解鎖【一劍青雲・極】：三段全屏裂空墨痕演出，每段各自觸發定格與震屏，提高處決架勢與血量結算！
          Player.stateTimer = 1.15;
          const startX = Player.x;
          const targetX = Math.max(120, Math.min(Config.worldWidth - 120, Boss.x + Player.facing * 160));
          for (let i = 1; i <= 8; i++) {
            const t = i / 8;
            Game.afterimages.push({
              x: startX + (targetX - startX) * t, y: Config.groundY, w: Player.w, h: Player.h,
              alpha: 0.85 * t, color: "#fde047"
            });
          }
          Player.x = targetX;
          Player.vx = 0;

          Boss.flashFrames = 6;
          Player.flashFrames = 4;
          Game.flashWhiteOverlay = 1.0;
          Game.darkVignetteAlpha = 0.95;
          Game.executionBannerTimer = 2.0; Game.executionBannerDur = 2.0; Game.executionBannerKill = false;
          Game.camera.targetZoom = 1.35;

          // 三段全屏裂空墨痕斬線
          Game.executionLines = [
            { x1: startX - Player.facing * 160, y1: Config.groundY - 160, x2: targetX + Player.facing * 180, y2: Config.groundY + 10, alpha: 1.0, color: "#38bdf8", width: 8 },
            { x1: startX - Player.facing * 140, y1: Config.groundY + 20, x2: targetX + Player.facing * 190, y2: Config.groundY - 170, alpha: 1.0, color: "#fde047", width: 9 },
            { x1: startX - Player.facing * 240, y1: Config.groundY - 70, x2: targetX + Player.facing * 260, y2: Config.groundY - 70, alpha: 1.0, color: "#ffffff", width: 12 }
          ];
          if (fxReady("exec")) Game.executionLines = [];

          // 第一段定格與震屏
          Sound.play("execution", 0.95, 1.15);
          Sound.play("s_ult", 0.6, 1.0);
          triggerHitstop(6);
          triggerShake(Player.facing, -0.3, 30, 0.25);
          spawnSparks(Boss.x, Boss.y - 65, "execution", Player.facing);

          // 第二段定格與震屏 (延遲 140ms)
          setTimeout(() => {
            Sound.play("execution", 1.0, 1.35);
            triggerHitstop(7);
            triggerShake(-Player.facing, 0.35, 34, 0.28);
            spawnSparks(Boss.x, Boss.y - 75, "execution", -Player.facing);
          }, 140);

          // 第三段終極裂空定格與大震屏 (延遲 280ms)
          setTimeout(() => {
            Sound.play("execution", 1.0, 0.88);
            triggerHitstop(12);
            triggerShake(Player.facing, 0, 42, 0.55);
            spawnSparks(Boss.x, Boss.y - 60, "execution", Player.facing);
          }, 280);

          Boss.posture = 0;
          if (Boss.hp - execDmg > 0) {
            const wasPhase2 = Config.bossPhase === 2 || stay1;
            Boss.hp -= execDmg;
            Boss.deathblows = Math.max(1, Boss.deathblows - 1);
            Boss.state = "recover";
            Boss.stateTimer = 1.3;
            if (!stay1) Config.bossPhase = 2;
            if (!wasPhase2) bossRefillP2(); /* v0.8.151 二階段血條補滿 */

            Player.x = Math.max(120, Math.min(Config.worldWidth - 120, Boss.x - Boss.facing * 250));
            Player.vx = -Boss.facing * 400;
            spawnFloatingText(Boss.x, Boss.y - 150, `一劍青雲 -${execDmg}`, "#ef4444", 1.5);
            if (!wasPhase2) {
              bossPhaseCinematic();
              onBossPhase2();
              spawnFloatingText(Boss.x, Boss.y - 180, "【一劍青雲・極】三絕斬魄！二階段破入！", "#fde047", 1.3);
              setTelemetry(`★【一劍青雲・極】重創敵將氣血 -${execDmg} 破入二階段！`);
              document.getElementById("boss-realm-badge").textContent = "二階段・狂暴質變";
              document.getElementById("boss-state-txt").textContent = "PHASE 2 (狂暴)";
            }
          } else {
            Boss.hp = 0;
            Boss.deathblows = 0;
            bossKillCinematic();
            executionKillFx();
            Game.executionBannerKill = true; Game.executionBannerTimer = 2.0; Game.executionBannerDur = 2.0; /* v0.8.12 終結處決改跳「處決」 */
            Boss.state = "recover";
            Boss.stateTimer = 2.2;
            spawnFloatingText(Boss.x, Boss.y - 155, `一劍青雲 -${execDmg}`, "#ef4444", 1.5);
            spawnFloatingText(Boss.x, Boss.y - 185, "【一劍青雲・極】天誅伏魔！", "#fde047", 1.6);
            setTelemetry("★【一劍青雲・極】終局三絕裂空！大敵伏誅，戰績結算繪卷展開！");
            setTimeout(() => {
              handleStageClear(Boss.stageId);
            }, 2500);
          }
        } else {
          // 未解鎖時（Progress.unlockedStages < 5）：維持原版單段處決演出與結算
          Player.stateTimer = 0.75;
          const startX = Player.x;
          const targetX = Math.max(120, Math.min(Config.worldWidth - 120, Boss.x + Player.facing * 150));
          for (let i = 1; i <= 6; i++) {
            const t = i / 6;
            Game.afterimages.push({
              x: startX + (targetX - startX) * t, y: Config.groundY, w: Player.w, h: Player.h,
              alpha: 0.75 * t, color: "#38bdf8"
            });
          }
          Player.x = targetX;
          Player.vx = 0;

          Boss.flashFrames = 5;
          Player.flashFrames = 3;
          Game.flashWhiteOverlay = 0.95;
          Game.darkVignetteAlpha = 0.85;
          Game.executionBannerTimer = 1.5; Game.executionBannerDur = 1.5; Game.executionBannerKill = false;
          Game.camera.targetZoom = 1.26;
          Game.executionLines = [{
            x1: startX - Player.facing * 90, y1: Config.groundY - 58,
            x2: targetX + Player.facing * 100, y2: Config.groundY - 72,
            alpha: 1.0, color: "#38bdf8", width: 7
          }];
          if (fxReady("exec")) Game.executionLines = [];

          Sound.play("execution", 1.0, 1.0);
          triggerHitstop(9);
          triggerShake(Player.facing, -0.25, 34, 0.45);
          spawnSparks(Boss.x, Boss.y - 65, "execution", Player.facing);

          Boss.posture = 0;
          if (Boss.hp - execDmg > 0) {
            const wasPhase2 = Config.bossPhase === 2 || stay1;
            Boss.hp -= execDmg;
            Boss.deathblows = Math.max(1, Boss.deathblows - 1);
            Boss.state = "recover";
            Boss.stateTimer = 1.1;
            if (!stay1) Config.bossPhase = 2;
            if (!wasPhase2) bossRefillP2(); /* v0.8.151 二階段血條補滿 */

            Player.x = Math.max(120, Math.min(Config.worldWidth - 120, Boss.x - Boss.facing * 240));
            Player.vx = -Boss.facing * 380;
            triggerShake(Boss.facing, 0, 26, 0.35);
            Sound.play("peril", 1.0, 1.2);
            spawnSparks(Boss.x, Boss.y - 60, "execution", -Boss.facing);

            spawnFloatingText(Boss.x, Boss.y - 145, `一劍青雲 -${execDmg}`, "#ef4444", 1.4);
            if (!wasPhase2) {
              bossPhaseCinematic();
              onBossPhase2();
              spawnFloatingText(Boss.x, Boss.y - 175, "【二階段暴怒突破】解鎖全新連環殺招！", "#ef4444", 1.2);
              setTelemetry(`★ 破勢忍殺 -${execDmg}！Boss 煞氣魔化爆發，解鎖【二階段專屬殺招】！`);
              document.getElementById("boss-realm-badge").textContent = "二階段・狂暴質變";
              document.getElementById("boss-state-txt").textContent = "PHASE 2 (狂暴)";
            }
          } else {
            Boss.hp = 0;
            Boss.deathblows = 0;
            bossKillCinematic();
            executionKillFx();
            Game.executionBannerKill = true; Game.executionBannerTimer = 2.0; Game.executionBannerDur = 2.0; /* v0.8.12 終結處決改跳「處決」 */
            Boss.state = "recover";
            Boss.stateTimer = 2.0;
            spawnFloatingText(Boss.x, Boss.y - 145, `一劍青雲 -${execDmg}`, "#ef4444", 1.4);
            spawnFloatingText(Boss.x, Boss.y - 175, "【一劍青雲】守關大敵伏誅！", "#fde047", 1.45);
            setTelemetry("★ 終局忍殺！本關大捷，戰績結算繪卷展開！");
            setTimeout(() => {
              handleStageClear(Boss.stageId);
            }, 2400);
          }
        }
      }

      function activateAssist() {
        if (Game.ultBind) return; /* v0.8.168 大招劍陣鎖身：只能招架 */
        Sound.resume();
        if (inputLocked() || Game.dir) return;
        if (!Player.assistAvailable) {
          spawnFloatingText(Player.x, Player.y - 105, "太初玄天珠靈氣枯竭", "#94a3b8", 0.95);
          return;
        }

        Player.assistAvailable = false;
        Sound.play("assist", 0.95, 1.0);
        syncAssistUI();
        if (assistStart(Player.selectedAssist)) return; /* v0.8.115 玄天珠演出：拉近、變暗、十字星、衝向敵人，命中那一刻才呼叫 applyAssistEffect */
        applyAssistEffect(Player.selectedAssist);
      }
      function applyAssistEffect(sel) {
        Game.flashWhiteOverlay = 0.5;

        if (sel !== "tishen") { /* 太初靈光（符陣定身已併入，舊存檔的 fuzhen 視為靈光） */
          Boss.isPerilous = false;
          Boss.state = "hurt";
          Boss.stateTimer = 0.3; /* v0.8.121 只打斷招式，不給白打時間（原 0.95 秒僵直） */
          Boss.vx = -Boss.facing * 120;
          Boss.flashFrames = 3;
          triggerHitstop(5);
          triggerShake(Player.facing, 0, 18, 0.25);
          spawnSparks(Boss.x, Boss.y - 68, "mikiri", Player.facing);
          damageBossPosture(22, "太初靈光強制破招！");
          spawnFloatingText(Boss.x, Boss.y - 135, "【太初靈光】打斷殺招！", "#60a5fa", 1.25);
          setTelemetry("✦ 師弟妹催動玄天珠【太初靈光】：強制中斷大招！");
        } else if (sel === "tishen") {
          Player.tishenActive = true; Player._shieldT0 = performance.now();
          let tishenDuration = 1.2; /* v0.8.121 無敵 2.2→1.2 秒 */
          if (Progress.equippedSeals.includes("bumie")) tishenDuration = 2.0;
          Player.invulnTimer = tishenDuration;
          Player.hp = Math.min(Player.maxHp, Player.hp + 200);
          spawnSparks(Player.x, Player.y - 50, "parry", Player.facing);
          spawnFloatingText(Player.x, Player.y - 125, `【太初替身】${tishenDuration}秒無敵＋護魂待命！`, "#60a5fa", 1.22);
          setTelemetry("✦ 師弟妹賦予【太初替身】：護佑墨塵元神，無敵時隙！");
        }
        syncAssistUI();
      }

      function damageBossPosture(amount, label, cap, noSeal, fromAtk) {
        if (fromAtk && Boss._hpOut) { /* v0.8.153 血見底後只有彈刀／招架類能補滿架勢；v0.8.183 例外：Boss 收招／大招喘息／被擊落的破綻中砍，可以慢慢推最後 20%（避免一直出不能招架的招時卡死） */
          const big = Boss._ultRest || Boss.state === "grounded" || Boss.state === "frozen";
          if (!(Boss.state === "recover" || big)) { Boss._capFlash = performance.now(); return; }
          amount *= 0.5; fromAtk = false; cap = big ? null : Boss.maxPosture * 0.95; /* v0.8.186 一般收招只能推到 95%（原本一輪普攻就補滿，等於不用防守）；最後一下仍要彈刀／看破／踩頭，或等大招喘息、擊落、定身的大破綻 */
        }
        if (fromAtk) { const c60 = Boss.maxPosture * 0.6; cap = cap ? Math.min(cap, c60) : c60; } /* v0.8.157 攻擊類（普攻、重斬、蓄力、凌空斬／下劈）一律最多把架勢加到 60%；最後 40% 只能靠完美招架、踏劍看破、凌空踩頭、折射 */
        if (partsBusy()) { if (partsMode()) partsPosture(amount, label); return; } /* v0.8.83 部位 Boss 一階段：架勢加在巨手 */
        if (Boss.state === "staggered") return;
        
        let postureGain = amount;
        if (!noSeal) { /* v0.8.120 協助技（符陣定身）不吃封印倍率 */
        postureGain *= 2.0; /* v0.8.184 原預設問心印的架勢 ×2，封存心印後保留為基準（數值手感不變） */
        if (Progress.equippedSeals.includes("juemai") && Player.hp / Player.maxHp <= 0.35) postureGain *= 1.8;
        }

        if (cap && Boss.posture >= cap - 0.01) Boss._capFlash = performance.now(); /* v0.8.183 架勢卡在 60%：架勢條刻度閃一下 */
        if (cap) Boss.posture = Math.max(Boss.posture, Math.min(cap, Boss.posture + postureGain));
        else Boss.posture = Math.min(Boss.maxPosture, Boss.posture + postureGain);
        Boss.postureDecayDelay = 3.0;

        if (Boss.posture >= Boss.maxPosture) {
          Boss.posture = Boss.maxPosture;
          Boss.state = "staggered";
          Boss.staggerTimer = 3.0; /* v0.8.159 破防硬直 3.8 → 3.0 */
          Boss.isPerilous = false;
          Boss.vx = -Boss.facing * 160;
          Sound.play("mikiri", 1.0, 0.85);
          if (Boss.stageId === 5) Sound.play(Boss.stance === "B" ? "m_growl" : "w_yelp", 0.9, Boss.stance === "B" ? 0.9 : 1);
          if (fxReady("spark")) spawnFx("spark", 3, Boss.x, Boss.y - 120, { w: 440, dur: 0.55 });
          triggerHitstop(7);
          triggerShake(Player.facing, 0.2, 24, 0.35);
          spawnFloatingText(Boss.x, Boss.y - 145, "【架勢打空破防】貼身按 [青雲斬 J] 處決！", "#ef4444", 1.35);
          setTelemetry("🔥 敵將架勢打滿崩潰！貼身發動【一劍青雲】破勢忍殺！");
        } else if (label) {
          spawnFloatingText(Boss.x, Boss.y - 105, label, "#fde047", 1.0);
        }
      }

      /* v0.8.0 完美閃避：瞬步無敵期間剛好吃掉一次攻擊 → 短暫慢動作＋回體力（冷卻 8 秒，避免變成無腦閃） */
      let lastPerfectDodgeMs = -99999;
      function perfectDodgeFx(label, stamina) {
        const now = performance.now();
        Player.stamina = Math.min(Player.maxStamina, Player.stamina + stamina);
        if (now - lastPerfectDodgeMs < 8000) return;
        lastPerfectDodgeMs = now;
        Progress.perfectDodgeCount = (Progress.perfectDodgeCount || 0) + 1;
        Game.slowT = 0.5; Game.slowScale = 0.28;
        spawnFloatingText(Player.x, Player.y - 125, label, "#7dd3fc", 1.2);
        hapticBuzz([15, 20, 15]);
      }
      function resolveBossStrike(move) {
        const cx = (Player.x + Boss.x) * 0.5;
        const cy = Player.y - 50;
        const dir = Player.x >= Boss.x ? 1 : -1;
        { const mvL = Stages[Boss.stageId].moves[Boss.moveType]; if (mvL && mvL.lowOnly && Player.y < Config.groundY - 100) { spawnFloatingText(Player.x, Player.y - 95, "高處避開！", "#34d399", 1.0); return; } } /* v0.8.181 貼地招打不到站在平台上的主角 */

        if (Boss.isPerilous) {
          if (Boss.perilType === "sweep" && Player.y < Config.groundY - 38) {
            spawnFloatingText(Player.x, Player.y - 95, "躍過【橫掃・危】！(按跳躍踩頭)", "#34d399", 1.05);
            return;
          }
          if (Boss.perilType === "thrust" && Player.state === "dash") {
            triggerMikiriCounter();
            return;
          }
          if (Player.invulnTimer > 0) {
            Sound.play("slash", 0.7, 1.6);
            triggerHitstopMs(60);
            Player.riposteTimer = 1.2;
            // 成功【極限側閃】退還 10 點劍勢體力
            Player.stamina = Math.min(Player.maxStamina, Player.stamina + 10);
            spawnFloatingText(Player.x, Player.y - 105, "【極限側閃】殘影反制！(劍勢+10)", "#38bdf8", 1.2);
            perfectDodgeFx("【完美閃避】", 0);
            setTelemetry("✦ 極限側閃成功！避開【危】字殺招並獲追斬強化！(返還 10 點劍勢)");
            return;
          }

          if (Boss.perilType === "thrust" && Player.state === "parry") {
            const el = performance.now() - Player.parryStartMs;
            const windowLimit = getParryWindowMs(true);
            if (el <= windowLimit) {
              doPerfectDeflect(cx, cy, dir, el, 26);
              return;
            }
          }

          takeDamage(bossDmg(move.damage), dir, "【危】殺招命中！");
          return;
        }

        if (Player.invulnTimer > 0) { if (Player.state === "dash") perfectDodgeFx("【完美閃避】", 8); return; }

        if (Player.state === "parry") {
          let el = Math.max(1, Math.round(performance.now() - Player.parryStartMs));
          const currentWindow = getParryWindowMs(false);
          /* v0.8.7 連段招架：剛完美招架後 270ms 內的下一刀，只要還舉著劍就算完美（連段不必每刀重按；最後一刀「遲刃」超過 270ms 仍要重新按） */
          if (Player.lastDeflectMs && performance.now() - Player.lastDeflectMs <= 300) el = Math.min(el, currentWindow);

          if (el <= currentWindow) {
            doPerfectDeflect(cx, cy, dir, el, move.parryPostureDmg || 22);
            return;
          } else {
            let staminaCost = 28;
            if (Progress.equippedSeals.includes("tafeng")) staminaCost *= 2;
            Player.stamina = Math.max(0, Player.stamina - staminaCost);
            Player.vx = dir * 290;
            Player.flashFrames = 1;
            Sound.play("block", 0.85, 1.0);
            triggerHitstopMs(50);
            triggerShake(dir, 0.15, 12, 0.2);
            Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + 0.03);
            hapticBuzz(22);
            spawnSparks(cx, cy, "block", dir);
            damageBossPosture(2, null); /* v0.8.159 普通格擋給 Boss 架勢 +6 → +2 */
            spawnFloatingText(Player.x, Player.y - 95, `普通格擋 (+${el}ms 偏慢)`, "#cbd5e1", 0.95);
            setTelemetry(`普通招架 (+${el}ms > 窗口 ${currentWindow}ms)｜損耗自身劍勢`);
            if (Player.stamina <= 0) {
              takeDamage(Math.round(bossDmg(move.damage) * 0.5), dir, "劍勢崩潰受創！");
              Player.stamina = 0;
            }
            return;
          }
        }

        takeDamage(bossDmg(move.damage), dir, "受創！");
      }

      function doPerfectDeflect(cx, cy, dir, el, postureGain) {
        Player.parryCooldown = 0; Player._parrySpam = 0; Player._lastParryPress = 0; /* v0.8.183 彈成功：連按懲罰歸零（連段招架照常） */
        feel("parry", dir); /* 定格、震屏、震動、雙方閃白 → 回饋表 FEEL */
        // 完美招架不耗體力，且即刻恢復 20 劍勢體力！
        Player.stamina = Math.min(Player.maxStamina, Player.stamina + 20);
        Player.vx = dir * 140;
        const nowD = performance.now();
        const chained = Player.lastDeflectMs && nowD - Player.lastDeflectMs <= 300 && Player.state === "parry";
        Player.lastDeflectMs = nowD;
        Player.chainCount = chained ? (Player.chainCount || 1) + 1 : 1;
        if (Player.state === "parry") Player.stateTimer = Math.max(Player.stateTimer, 0.28); /* 完美招架後舉劍多撐一會兒，接得住連段的下一刀 */
        if (chained) Player.stamina = Math.max(0, Player.stamina - 14); /* 連段招架：體力只回 +6（基本 +20 先扣 14） */
        Player.riposteTimer = 1.2;
        hintOnce("riposte", "完美招架後 1.2 秒內出刀＝【破勢反擊】，架勢傷害加倍（劍身泛金光）");
        Boss.vx = -dir * 110;
        Progress.parryCount++;

        Sound.play("parry", 0.95, 0.96 + Math.random() * 0.08);
        Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + 0.10);
        spawnSparks(cx, cy, "parry", dir);
        spawnSparks(cx, cy, "mikiri", dir);
        if (fxReady("air")) spawnFx("air", 2, cx, cy, { w: 320, dur: 0.42 });

        damageBossPosture(postureGain, `完美招架！架勢 +${postureGain}%`);
        spawnFloatingText(Player.x, Player.y - 112, chained ? `【連段招架 ×${Player.chainCount}】` : `【青雲完美彈反】${el}ms!`, "#fde047", 1.25);
        setTelemetry(`★ 完美招架 (${el}ms)｜Hitstop ${Config.parryHitstopFrames}f｜Boss架勢大削`);
      }

      function zoneDamage(dmg, tag) {
        dmg = Math.max(1, Math.round(dmg));
        if (Player.hp - dmg <= 0) { takeDamage(dmg, 0, tag); return; } /* 致命時走原本流程（替身、問心重整） */
        Progress.damageTaken += dmg; Player.hp -= dmg; Player.flashFrames = 1;
        Sound.play("hit", 0.35, 0.7); hurtFlash(0.3); hapticBuzz(25);
        spawnFloatingText(Player.x, Player.y - 100, `${tag} -${dmg}`, "#f87171", 0.8);
      }
      function takeDamage(dmg, dir, tag) {
        if (Player.hurtInv > 0 && !Game.defeated) return; /* v0.8.8 受擊無敵 0.7 秒 */
        Boss.landedHit = true;
        Progress.hitCount = (Progress.hitCount || 0) + 1;
        Progress.damageTaken += dmg;
        if (Player.hp - dmg <= 0 && (Player.tishenActive || (Player.selectedAssist === "tishen" && Player.assistAvailable))) {
          Player.assistAvailable = false;
          Player.tishenActive = false; if (fxReady("xtz_shield")) spawnFx("xtz_shield", 3, Player.x, Player.y - 125, { w: 310, dur: 0.6 }); else if (fxReady("xtz")) spawnFx("xtz", 3, Player.x, Player.y - 75, { w: 340, dur: 0.45 }); /* 護魂消耗：護罩破碎 */
          Player.hp = 100; /* v0.8.121 護魂擋致命傷：只剩 100 血、不再給長無敵（原回 45% 並無敵 2 秒） */
          Player.invulnTimer = 0.4; Player.hurtInv = 0.7;
          Player.x = Math.max(120, Math.min(Config.worldWidth - 120, Player.x + dir * 230));
          Sound.play("assist", 1.0, 1.1);
          triggerHitstopMs(80);
          spawnSparks(Player.x, Player.y - 50, "parry", dir);
          spawnFloatingText(Player.x, Player.y - 130, "【太初替身】致命傷免死觸發！", "#60a5fa", 1.3);
          setTelemetry("✦ 【太初替身】於致命瞬間自動救主！墨塵遁入流光無敵時隙！");
          syncAssistUI();
          return;
        }

        Player.hp = Math.max(0, Player.hp - dmg);
        Player.hurtInv = 0.7;
        Player.state = "hitstun";
        Player.stateTimer = 0.28;
        Player.vx = dir * 370;
        Player.flashFrames = 2;

        const heavyHit = dmg >= 250;
        Sound.play("hit", 0.9, 0.85);
        Sound.play("hit", 0.7, 0.55);
        Sound.play("s_hurt", heavyHit ? 0.9 : 0.7, heavyHit ? 0.9 : 1.0);
        hapticBuzz(heavyHit ? [60, 30, 90] : 70);
        triggerHitstopMs(heavyHit ? 100 : 70);
        triggerShake(dir, 0.3, heavyHit ? 34 : 24, heavyHit ? 0.36 : 0.28);
        Game.camera.zoom = Math.max(Game.camera.zoom, Game.camera.targetZoom + (heavyHit ? 0.06 : 0.035));
        hurtFlash(heavyHit ? 0.8 : 0.5);
        Game.comboCount = 0;
        spawnSparks(Player.x, Player.y - 48, "hit", dir);
        spawnFloatingText(Player.x, Player.y - 100, `${tag} -${dmg}`, "#f87171", 1.1);
        setTelemetry(`〔警訊：墨塵受擊 -${dmg} 氣血，把握紅芒閃爍瞬間招架〕`);

        if (Player.hp <= 0 && !Game.defeated) {
          /* v0.8.2 真的會輸：問心失敗 → 約 2 秒後重打本關（Boss 回滿、不重播對話） */
          Game.defeated = true;
          Progress.deathCount = (Progress.deathCount || 0) + 1;
          Game.cutsceneActive = true;
          Game.slowT = 1.2; Game.slowScale = 0.25;
          Sound.play("hit", 1.0, 0.5);
          hapticBuzz([80, 40, 120]);
          showBanner("問心失敗", "元神潰散・重整再戰", 1700, "#f87171");
          const sid = Boss.stageId;
          setTimeout(() => { if (Game.defeated) loadStage(sid, { skipPre: true }); }, 1900);
        }
      }

      function spawnProjectiles(m) {
        const count = (m && m.bulletCount) || 3;
        const damage = (m && m.damage) || 90;
        const speed = (m && m.bulletSpeed) || 750;
        const traj = (m && m.bulletTrajectory) || "linear";
        const bColor = (m && m.bulletColor) || "#38bdf8";

        const rainSfx = traj === "vertical" && bsfx("swordRain"); /* v0.8.67 垂落飛劍整串一個音；直線飛劍每把各一個 */
        if (!rainSfx && !(traj !== "vertical" && Stages[Boss.stageId].sfx && Stages[Boss.stageId].sfx.swordFly)) Sound.play("flysword", 0.8, 1.1);
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (Boss.hp <= 0) return;
            Boss._kickMs = performance.now(); /* v0.8.72 每射一把，Boss 身體往前一頓（dfm.kick） */
            const dir = Boss.facing;
            let sx = Boss.x + dir * (m && m.bulletX ? Math.min(m.bulletX, Math.max(30, Math.abs(Player.x - Boss.x) - 50)) : 30); /* v0.8.66 bulletX：劍尖從手前方出發（主角太近時退回 30） */
            let sy = (m && m.bulletY) ? Boss.y + m.bulletY[i % m.bulletY.length] : Boss.y - 55 + (i - 1) * 22; /* v0.8.65 bulletY：每把飛劍相對腳底的高度 */
            let svx = dir * speed;
            let svy = 0;

            if (traj === "vertical") {
              sx = Player.x + (i - (count - 1) / 2) * 130;
              sy = 20;
              svx = 0;
              svy = speed * 1.1;
            } else if (traj === "parabola") {
              sx = Boss.x + dir * 40;
              sy = Boss.y - 65;
              svx = dir * (speed * 0.65);
              svy = -420 + i * 80;
            }

            Game.flyingSwords.push({
              x: sx,
              y: sy,
              vx: svx,
              vy: svy,
              dir: dir,
              damage: damage,
              reflected: false,
              life: 2.5,
              color: bColor,
              trajectory: traj,
              kind: (m && m.bulletKind) || null
            });
            if (!rainSfx && !(traj !== "vertical" && bsfx("swordFly"))) Sound.play("flysword", 0.7, 0.95 + i * 0.1);
          }, i * ((m && m.bulletGap) || 0.2) * 1000); /* v0.8.72 bulletGap：每把飛劍間隔秒數 */
        }
      }
