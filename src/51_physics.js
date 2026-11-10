      function updatePhysics(dt) {
        // Scarf and atmospheric leaves always animate（導演名牌滑入時一起暫停）
        const dirFrz = !!(Game.dir && Game.dir.freeze);
        if (Player.scarfNodes.length > 0 && !dirFrz) {
          Player.scarfNodes[0].x = Player.x - Player.facing * 10;
          Player.scarfNodes[0].y = Player.y - 68;
          for (let i = 1; i < Player.scarfNodes.length; i++) {
            const prev = Player.scarfNodes[i - 1];
            const p = Player.scarfNodes[i];
            const tx = prev.x - Player.facing * 11 - Player.vx * 0.015;
            const ty = prev.y + Math.sin(performance.now() * 0.01 + i) * 2.5 + 1.5;
            p.x += (tx - p.x) * Math.min(1, dt * 22);
            p.y += (ty - p.y) * Math.min(1, dt * 22);
          }
        }
        for (const leaf of (dirFrz ? [] : Game.inkBambooLeaves)) {
          leaf.x += leaf.vx * dt;
          leaf.y += leaf.vy * dt;
          leaf.angle += leaf.vAngle * dt;
          if (leaf.x < 0) leaf.x = Config.worldWidth;
          if (leaf.y > Config.groundY) {
            leaf.y = 100 + Math.random() * 200;
            leaf.x = Math.random() * Config.worldWidth;
          }
        }
        updateCamera(dt, false);

        // Pause active combat actions only during story cutscenes
        if (Game.cutsceneActive) return;
        if (Game.cine) { updateCine(dt); return; }
        if (Game.dir) { dirUpdate(dt); return; } /* v0.8.105 戰場上的登場／階段轉換：戰鬥暫停，鏡頭＋姿勢＋特效 */
        if (Game.introT > 0) {
          Game.introT -= dt;
          if (Game.introT <= 0 && Game.pendingPre) {
            Game.pendingPre = false;
            const stP = Stages[Boss.stageId];
            Game.dlgFocus = true;
            dlgStart(stP.dialogue.pre, () => { Game.dlgFocus = false; });
          }
          return;
        }

        executeBuffered();
        dirAuraTick();

        if (Game.hitstopT > 0) {
          Game.hitstopT = Math.max(0, Game.hitstopT - dt);
          updateCamera(dt, true);
          updateHitParticles(dt);
          return;
        }

        if (Player.flashFrames > 0) Player.flashFrames = Math.max(0, Player.flashFrames - dt * 60); /* M2 閃白改以秒計：120Hz 手機不再只閃一半 */
        if (Boss.flashFrames > 0) Boss.flashFrames = Math.max(0, Boss.flashFrames - dt * 60);
        if (Player.atkCd > 0) Player.atkCd = Math.max(0, Player.atkCd - dt);
        if (Boss.ultCd > 0) Boss.ultCd -= dt;
        {
          const stU = Stages[Boss.stageId];
          const mU = stU && stU.moves ? stU.moves[Boss.moveType] : null;
          const ultOn = !!(mU && mU.ultimate && (Boss.state === "windup" || Boss.state === "active"));
          Game.ultDim += ((ultOn ? 1 : 0) - Game.ultDim) * Math.min(1, dt * (ultOn ? 6 : 4));
          if (Game.ultDim < 0.01) Game.ultDim = 0;
        }
        if (Game.comboTimer > 0) {
          Game.comboTimer -= dt;
          if (Game.comboTimer <= 0) Game.comboCount = 0;
        }
        if (Boss.hitReactT > 0) Boss.hitReactT = Math.max(0, Boss.hitReactT - dt);
        updateHitParticles(dt);

        if (Player.invulnTimer > 0) Player.invulnTimer = Math.max(0, Player.invulnTimer - dt);
        if (Player.hurtInv > 0) Player.hurtInv = Math.max(0, Player.hurtInv - dt);
        if (Player.comboWindow > 0) Player.comboWindow = Math.max(0, Player.comboWindow - dt);
        if (Player.riposteTimer > 0) Player.riposteTimer = Math.max(0, Player.riposteTimer - dt);
        if (Player.parryCooldown > 0) Player.parryCooldown = Math.max(0, Player.parryCooldown - dt);

        // 瞬步期間與結束後 0.35 秒內不回復體力
        if (Player.state === "dash") {
          Player.staminaRecoverDelay = 0.35;
        }
        if (Player.staminaRecoverDelay > 0) {
          Player.staminaRecoverDelay = Math.max(0, Player.staminaRecoverDelay - dt);
        }
        if (Player.staminaRecoverDelay <= 0 && Player.state !== "parry" && Player.state !== "dash") {
          let regenRate = 22;
          if (Progress.echoes && Progress.echoes.includes(12)) regenRate = 28.6; // 卷三回響12：劍勢自然恢復 22 -> 28.6 (+30%)
          Player.stamina = Math.min(Player.maxStamina, Player.stamina + regenRate * dt);
        }

        // 蓄力計時：按住滿 0.45 秒觸發蓄力重斬；被打斷或換招則取消
        if (Player.isChargingAttack) {
          if (Progress.unlockedStages < 4 || ["hitstun", "execution", "parry", "dash", "drink"].includes(Player.state)) {
            Player.isChargingAttack = false;
          } else if (performance.now() - Player.attackChargeStartTime >= 450) {
            Player.isChargingAttack = false;
            doChargedAttack();
          }
        }

        // Attack hitbox vs Boss
        if (Player.state === "attack" || Player.state === "parry" || Player.state === "dash" || Player.state === "drink" || Player.state === "hitstun" || Player.state === "execution") {
          Player.stateTimer -= dt;

          if (Boss.hp <= 0) { /* v0.8.65 Boss 已倒下：出刀不再判定（原本會把血量夾回 1） */
          } else if (Player.state === "attack" && Player.isAirAtk && !Player.attackHitRegistered && Player.stateTimer > 0.02) {
            airAttackHit();
          } else if (Player.state === "attack" && !Player.isAirAtk && !Player.attackHitRegistered && Player.stateTimer > 0.04 && partsBusy()) {
            if (partsMode() && partsTryHit(false)) Player.attackHitRegistered = true; /* v0.8.83 部位 Boss 一階段：只判部位，本體不可打 */
          } else if (Player.state === "attack" && !Player.isAirAtk && !Player.attackHitRegistered && Player.stateTimer > 0.04 && illusionTryHit(false)) {
            Player.attackHitRegistered = true; /* v0.8.55 打到幻影 */
          } else if (Player.state === "attack" && !Player.isAirAtk && !Player.attackHitRegistered && Player.stateTimer > 0.04) {
            const dx = Boss.x - Player.x;
            const inFront = dx * Player.facing >= -30;
            const baseReach = (Player.isChargedAttack ? 175 : Player.comboStep === 3 ? 165 : 140) * CHAR_K;
            const hasEcho11 = Progress.echoes && Progress.echoes.includes(11);
            const reach = Math.round(baseReach * (hasEcho11 ? 1.08 : 1.0)); // 卷三回響11：攻擊範圍+8%
            if (inFront && Math.abs(dx) <= reach + bossHurt() && Math.abs(Player.y - Boss.y) < 120) {
              Player.attackHitRegistered = true;

              // 隻狼式「打鐵攻防轉換律動」：
              // 1. 若 Boss 處於大硬直（破防 staggered / 定身 frozen / 剛被看破或踩頭 recover / 擊落 grounded）: 實打實肉體受創！
              const isPunishWindow = Player.riposteAtk || (Boss.state === "staggered" || Boss.state === "frozen" || Boss.state === "recover" || Boss.state === "grounded" || (Boss.state === "active" && !!(bossMoveData() && bossMoveData().isHeal)));

              // 蓄力重擊命中判定 (D 項要求)
              if (mirrorTryCounter()) {
                /* 心魔反制架式：已彈開 */
              } else if (Player.isChargedAttack) {
                const stage = Stages[Boss.stageId];
                const currentMove = stage && stage.moves ? stage.moves[Boss.moveType] : null;
                const isBossWindupWithArmor = (Boss.state === "windup" && currentMove && currentMove.armor);

                if (isBossWindupWithArmor) {
                  // 蓄力重擊命中霸體前搖：可立即打斷並施加 30% 架勢！
                  Boss.state = "recover";
                  Boss.stateTimer = 0.65;
                  Boss.vx = -Boss.facing * 190;
                  Boss.flashFrames = 4;
                  Boss.consecutiveBlocks = 0;

                  damageBossPosture(30, "【蓄力破霸體】架勢 +30%！", null, false, true);
                  Boss.hp = Math.max(1, Boss.hp - 160);

                  Sound.play("parry", 1.0, 1.25);
                  triggerHitstop(7);
                  triggerShake(Player.facing, -0.25, 26, 0.3);
                  spawnSparks((Player.x + Boss.x) * 0.5, Boss.y - 65, "parry", Player.facing);
                  spawnFloatingText(Boss.x, Boss.y - 125, "【蓄力破霸體！】打斷霸體！(架勢+30%)", "#fde047", 1.35);
                  if (fxReady("spark")) spawnFx("spark", 2, Boss.x, Boss.y - 110, { w: 320, dur: 0.4 });
                  setTelemetry("✦ 蓄力重擊命中霸體前搖！強制打斷敵酋蓄力並施加 30% 架勢！");
                } else {
                  // 對無霸體招式：則只當普通重斬，不得有破防加成
                  Boss.consecutiveBlocks = 0;
                  let dmg = 110;
                  if (Progress.echoes && Progress.echoes.includes(14)) dmg = Math.round(dmg * 1.10); // 卷三回響14：連段傷害+10%
                  if (Progress.equippedSeals.includes("juemai") && Player.hp / Player.maxHp <= 0.35) dmg = Math.round(dmg * 1.8);
                  Boss.hp = Math.max(1, Boss.hp - dmg);
                  Boss.flashFrames = 2;
                  Boss.vx = Player.facing * 85;

                  damageBossPosture(10, null, null, false, true); // 普通重斬架勢，不得有破防加成！
                  Sound.play("hit", 0.9, 0.88);
                  Sound.play("s_hit", 0.7, 0.9);
                  triggerHitstopMs(hitstopByDmg(dmg));
                  triggerShake(Player.facing, -0.15, 14, 0.18);
                  spawnSparks((Player.x + Boss.x) * 0.5, Boss.y - 62, "hit", Player.facing);
                  bossHitFx("heavy");
                  spawnFloatingText(Boss.x, Boss.y - 105, `-${dmg} (蓄力重斬)`, "#38bdf8", 1.15);
                  setTelemetry(`青雲蓄力重斬命中！造成 ${dmg} 點實質氣血傷害！`);
                }
              } else if (isPunishWindow) {
                Boss.consecutiveBlocks = 0;
                let dmg = Player.comboStep === 3 ? 120 : 75;
                if (Progress.echoes && Progress.echoes.includes(14)) dmg = Math.round(dmg * 1.10); // 卷三回響14：連段傷害+10%
                let post = Boss.state === "frozen" ? 18 : Player.comboStep === 3 ? 9 : 6;
                if (Player.riposteAtk) { post *= 2; dmg = Math.round(dmg * 1.25); Player.riposteAtk = false; spawnFloatingText(Player.x, Player.y - 125, "【破勢反擊】架勢加倍！", "#fde047", 1.2); }
                if (Progress.equippedSeals.includes("juemai") && Player.hp / Player.maxHp <= 0.35) {
                  dmg = Math.round(dmg * 1.8);
                  post = Math.round(post * 1.8);
                }

                if (Boss.state === "grounded") {
                  dmg = Math.round(dmg * 1.5);
                  post = Math.round(post * 1.5);
                }

                Boss.hp = Math.max(1, Boss.hp - dmg);
                Boss.flashFrames = 2;
                Boss.vx = Player.facing * 75;

                Sound.play("hit", 0.85, 0.95 + Player.comboStep * 0.06);
                Sound.play("s_hit", 0.6, 0.95 + Player.comboStep * 0.05);
                triggerHitstopMs(hitstopByDmg(dmg));
                triggerShake(Player.facing, -0.15, 11, 0.16);
                spawnSparks((Player.x + Boss.x) * 0.5, Boss.y - 62, "hit", Player.facing);

                damageBossPosture(post, null, Boss.maxPosture * 0.6, false, true);
                bossHitFx(Player.comboStep === 3 ? "heavy" : "hit");
                spawnFloatingText(Boss.x + (Math.random() - 0.5) * 28, Boss.y - 105, `-${dmg}`, "#38bdf8", Player.comboStep === 3 ? 1.15 : 0.98);
                setTelemetry(`破綻重創！青雲劍斬中敵酋 (-${dmg} 氣血 / 架勢 +${post}%)`);
              } else {
                // 2. Boss 正常對峙防守：普通格擋與完美彈刀反擊！
                Boss.consecutiveBlocks = (Boss.consecutiveBlocks || 0) + 1;
                { /* v0.8.155 普攻一律扣血（使用者：天經地義）：Boss 對峙中被砍到＝扣約 55% 破綻傷害（第三劍 66、其餘 41）；架勢與格擋／彈刀反擊照舊 */
                  let dmgN = Player.comboStep === 3 ? 30 : 18; /* v0.8.158 普攻扣血 41／66 → 18／30：血條重點改放破綻窗口重擊與處決 */
                  if (Progress.echoes && Progress.echoes.includes(14)) dmgN = Math.round(dmgN * 1.10);
                  if (Progress.equippedSeals.includes("juemai") && Player.hp / Player.maxHp <= 0.35) dmgN = Math.round(dmgN * 1.8);
                  Boss.hp = Math.max(1, Boss.hp - dmgN); Boss.flashFrames = Math.max(Boss.flashFrames || 0, 1);
                  Sound.play("hit", 0.6, 1.1); spawnFloatingText(Boss.x + (Math.random() - 0.5) * 28, Boss.y - 105, `-${dmgN}`, "#38bdf8", 0.9);
                }

                if (Boss.consecutiveBlocks < 3) {
                  // Boss 普通格擋：沉悶鐵鳴，橘紅小火花，積累架勢，不傷氣血！
                  Boss.flashFrames = 1;
                  Boss.vx = Player.facing * 120;
                  Sound.play("block", 0.9, 1.0);
                  triggerHitstop(3);
                  spawnSparks((Player.x + Boss.x) * 0.5, Boss.y - 62, "block", Player.facing);
                  damageBossPosture(5, null, Boss.maxPosture * 0.6, false, true);
                  bossHitFx("block");
                  spawnFloatingText(Boss.x, Boss.y - 95, `敵將格擋 (第${Boss.consecutiveBlocks}劍)`, "#cbd5e1", 0.95);
                  setTelemetry(`〔交鋒：敵將舉兵格擋第 ${Boss.consecutiveBlocks} 劍，注意彈刀！〕`);
                } else {
                  // Boss 完美彈刀！（隻狼攻防互換核心：高亢金鐵巨響 + 金色星芒衝擊波 + 立即霸體反斬！）
                  Boss.consecutiveBlocks = 0;
                  Boss.flashFrames = 3;

                  Sound.play("parry", 1.0, 0.92);
                  triggerHitstop(5);
                  triggerShake(Player.facing, 0.22, 18, 0.24);
                  spawnSparks((Player.x + Boss.x) * 0.5, Boss.y - 62, "parry", -Player.facing);
                  /* v0.8.157 隻狼式閉環：Boss 彈刀＝「攻守互換」的訊號，不再替 Boss 加架勢（原本 +14 且無上限，連打普攻就能靠它破防）；改扣主角 20 劍勢 */
                  Player.stamina = Math.max(0, Player.stamina - 20); Player.staminaRecoverDelay = Math.max(Player.staminaRecoverDelay || 0, 0.8);

                  // 墨塵長劍被彈開受阻
                  Player.vx = -Player.facing * 160;
                  Player.state = "idle";
                  spawnFloatingText(Player.x, Player.y - 120, "【敵將完美彈刀！】立即招架！", "#fde047", 1.35);
                  setTelemetry("⚠️ 敵將完美彈刀！攻防互換，敵將霸體反斬，立即按 K 招架！");

                  // 敵將立即強行切入霸體反擊！懲罰盲目狂按普攻的玩家！
                  const counterRoll = Math.random();
                  if (counterRoll < 0.65) {
                    triggerBossMove("slash1");
                  } else {
                    triggerBossMove("thrust_peril");
                  }
                }
              }
            }
          }

          if (Player.stateTimer <= 0) {
            Player.state = Player.y < Config.groundY - 4 ? "jump" : "idle";
            Game.camera.targetZoom = 1.0;
          }
        }

        // 移動取消：攻擊後搖後半段按方向鍵可直接跑開（出招間隔仍由 atkCd 控制，不會變快）
        if (Player.state === "attack" && !Player.isChargedAttack && (Keys.left || Keys.right) && Player.stateTimer < (Player.comboStep === 3 ? 0.38 : 0.28) && Player.y >= Config.groundY - 2) {
          Player.state = "move";
        }

        if (Player.blast) updateBlast(dt);

        // Horizontal Movement
        if (Player.state === "idle" || Player.state === "move" || Player.state === "jump") {
          let dir = 0;
          if (Keys.left) dir -= 1;
          if (Keys.right) dir += 1;
          if (Game.mode === "enter") dir = Game.loadHold ? 0 : 1; /* v0.8.156 等圖載完時原地站著 */

          if (dir !== 0) {
            Player.vx = dir * 580;
            Player.facing = dir;
            if (Player.y >= Config.groundY - 2) Player.state = "move";
          } else {
            Player.vx *= Math.pow(0.001, dt);
            if (Player.y >= Config.groundY - 2) Player.state = "idle";
          }
        } else if (Player.state !== "dash" && !Player.blast) {
          Player.vx *= Math.pow(0.015, dt);
        }

        Player.x += Player.vx * dt;
        Player.vy += Config.gravity * dt;
        Game._vyBefore = Player.vy;
        Player.y += Player.vy * dt;
        if (Player.y < Config.groundY - 22) Player._airMs = performance.now(); /* v0.8.138 落地寬限：離地 22px 以上的最後時刻（第 4 關合圍用） */

        if (Player.y >= Config.groundY) {
          Player.y = Config.groundY;
          Player.vy = 0;
          Player.canDoubleJump = true;
          Player.canAirDash = true;
          Player.airAtkUsed = false;
          if (Player.state === "attack" && Player.isDive) {
            Player.stateTimer = Math.min(Player.stateTimer, 0.2);
            emitDust(Player.x, Config.groundY, 1, 5, 1.4); emitDust(Player.x, Config.groundY, -1, 5, 1.4);
            if (Boss.stageId === 1) landingFx(Player.x, 1.0, 3);
            triggerShake(0, 1, 10, 0.18);
          }
          Player.hasVaulted = false; if (Player.state === "jump") Player.state = "idle";
        }

        Player.x = Math.max(Game.mode === "battle" ? 70 : -1210, Math.min(Config.worldWidth - 70, Player.x));

        // 揚塵與落地回饋
        {
          const onGroundD = Player.y >= Config.groundY - 2;
          if (onGroundD && Game._wasAir) {
            if (Game._vyBefore > 380) {
              emitDust(Player.x, Config.groundY, 1, 4, 1.3);
              emitDust(Player.x, Config.groundY, -1, 4, 1.3);
              triggerShake(0, 1, 6, 0.14);
              hapticBuzz(14);
              Game._squashAmt = 0.2; Game._squashT = 0.15; /* v0.8.14 落地擠壓：重落 */
            } else {
              emitDust(Player.x, Config.groundY, Player.facing, 3, 0.8);
              Game._squashAmt = 0.08; Game._squashT = 0.15; /* 輕落 */
            }
          }
          if (Game._squashT > 0) Game._squashT = Math.max(0, Game._squashT - dt);
          Game._wasAir = !onGroundD;
          if (onGroundD && Player.state === "move") {
            Game._dustAcc += Math.abs(Player.vx) * dt;
            if (Game._dustAcc > 85) {
              Game._dustAcc = 0;
              emitDust(Player.x - Player.facing * 14, Config.groundY, -Player.facing, 2, 0.7);
            }
          } else {
            Game._dustAcc = 0;
          }
          if (onGroundD && Game._prevPState !== "move" && Player.state === "move") emitDust(Player.x - Player.facing * 10, Config.groundY, -Player.facing, 4, 1.0);
          if (onGroundD && Game._prevPState === "move" && Player.state === "idle") emitDust(Player.x, Config.groundY, Player.facing, 4, 0.9);
          Game._prevPState = Player.state;
        }

        if (Game.mode !== "battle") {
          hubTick(dt);
          updateCamera(dt, false);
          syncHUD();
          return;
        }

        updateBossAI(dt);
        updateIllusions(dt);
        Boss.x += Boss.vx * dt;
        Boss.x = Math.max(95, Math.min(Config.worldWidth - 95, Boss.x));

        // Hazard Zones Updates (原語 4: 區域封鎖)
        if (Game.hazardZones && Game.hazardZones.length > 0) {
          for (let i = Game.hazardZones.length - 1; i >= 0; i--) {
            const hz = Game.hazardZones[i];
            hz.warningTimer -= dt;
            hz.duration -= dt;
            if (hz.warningTimer <= 0) {
              const inZone = Math.abs(Player.x - hz.x) <= hz.w * 0.5 && (hz.tall || Player.y >= Config.groundY - 20); /* tall：魔焰獸玉的火柱又高又長，跳起也躲不掉 */
              if (inZone && Player.invulnTimer <= 0 && Player.state !== "execution") {
                /* v0.7.8 煞氣地形是持續傷害：每 0.3 秒結算一次、不硬直不停頓，可以走出去（以前每幀 takeDamage 會一直硬直卡死） */
                hz.tickT = (hz.tickT || 0) - dt;
                if (hz.tickT <= 0) { hz.tickT = 0.3; zoneDamage(hz.damagePerSec * 0.3, "身陷煞氣絕地！"); }
              }
            }
            if (hz.duration <= 0) {
              Game.hazardZones.splice(i, 1);
            }
          }
        }

        // Flying Swords Projectiles (原語 1: 彈道)
        for (let i = Game.flyingSwords.length - 1; i >= 0; i--) {
          const sw = Game.flyingSwords[i];
          if (sw.trajectory === "parabola") {
            sw.vy += 800 * dt;
            if (sw.y >= Config.groundY) sw.life = 0;
          }
          if (sw.trajectory === "vertical" && sw.y >= Config.groundY - 10) sw.life = 0; /* v0.8.65 垂落飛劍插到地面就碎（原本會穿進地下） */
          sw.x += sw.vx * dt;
          sw.y += sw.vy * dt;
          sw.life -= dt;

          if (!sw.reflected) {
            const d = Math.abs(sw.x - Player.x);
            if (d < 42 && sw.y > Player.y - Player.h * 2.05 && sw.y < Player.y + 6) { /* v0.8.65 判定改為圖上整個身體（約腳底上 230；原 -90～0 只到大腿，飛劍拉高後胸口也要能中） */
              if (Player.state === "parry") {
                sw.reflected = true;
                Player.parryCooldown = 0; /* v0.8.72 折射成功清冷卻（同近戰彈刀），連發飛劍可逐把按 */
                sw.vx = -sw.dir * 950;
                sw.dir = -sw.dir;
                Progress.parryCount++;
                Sound.play("parry", 1.0, 1.25);
                triggerHitstopMs(70);
                triggerShake(Player.facing, -0.2, 14, 0.2);
                spawnSparks(sw.x, sw.y, "parry", Player.facing);
                
                if (sw.isAerialShot && Boss.state === "active") {
                  const stage = Stages[Boss.stageId];
                  const m = stage.moves[Boss.moveType];
                  if (m && m.isAerial) {
                    Boss.aerialBreak += 1;
                    const req = m.aerialBreakHits || 3;
                    spawnFloatingText(Player.x, Player.y - 110, `天穹動搖 ${Boss.aerialBreak}/${req}`, "#fde047", 1.25);
                    if (Boss.aerialBreak >= req) {
                      Boss.state = "grounded";
                      Boss.groundedTimer = 3.0;
                      Boss.y = Config.groundY;
                      Sound.play("execution", 0.6, 1.2);
                      spawnFloatingText(Boss.x, Boss.y - 140, "墜落破綻！", "#ef4444", 1.4);
                      setTelemetry("🔥 敵將被擊落！產生巨大破綻，所有傷害與架勢打擊提升 1.5 倍！");
                      triggerShake(0, 1, 30, 0.4);
                    }
                  }
                } else {
                  spawnFloatingText(Player.x, Player.y - 110, "【飛劍折射】反噬敵酋！", "#fde047", 1.25);
                  setTelemetry("★ 青雲劍彈反折射飛劍！飛劍反噬射向 Boss！");
                }
              } else if (Player.invulnTimer <= 0) {
                takeDamage(sw.damage, sw.dir, "飛劍擊中！");
                swordImpactFx(sw);
                Game.flyingSwords.splice(i, 1);
                continue;
              }
            }
          } else if (partsBusy()) { /* v0.8.83 部位 Boss 一階段：折射飛劍打回巨手 */
            if (partsMode() && partsReflectHit(sw)) { Game.flyingSwords.splice(i, 1); continue; }
          } else {
            const d = Math.abs(sw.x - Boss.x);
            if (Boss.hp > 0 && d < 45 && sw.y > Boss.y - Boss.h * 1.6 && sw.y < Boss.y + 6) { /* Boss 已倒下就不再被折射飛劍打回 1 血 */ /* v0.8.65 折射回去也照圖上身高判定（原 -105～5） */
              const RD = (Stages[Boss.stageId] && Stages[Boss.stageId].reflectDmg) || [110, 14]; /* v0.8.78 每關可設折射傷害 [氣血, 架勢] */
              Boss.hp = Math.max(1, Boss.hp - RD[0]);
              Boss.flashFrames = 3;
              damageBossPosture(RD[1], "折射命中！架勢 +" + RD[1] + "%");
              Sound.play("hit", 1.0, 1.1);
              triggerHitstop(4);
              spawnSparks(sw.x, sw.y, "hit", -sw.dir);
              spawnFloatingText(Boss.x, Boss.y - 100, "-" + RD[0], "#fde047", 1.2);
              swordImpactFx(sw);
              Game.flyingSwords.splice(i, 1);
              continue;
            }
          }

          if (sw.life <= 0 || sw.x < 50 || sw.x > Config.worldWidth - 50) {
            swordImpactFx(sw);
            Game.flyingSwords.splice(i, 1);
          }
        }

        if (Player.scarfNodes.length > 0) {
          Player.scarfNodes[0].x = Player.x - Player.facing * 10;
          Player.scarfNodes[0].y = Player.y - 68;
          for (let i = 1; i < Player.scarfNodes.length; i++) {
            const prev = Player.scarfNodes[i - 1];
            const p = Player.scarfNodes[i];
            const tx = prev.x - Player.facing * 11 - Player.vx * 0.015;
            const ty = prev.y + Math.sin(performance.now() * 0.01 + i) * 2.5 + 1.5;
            p.x += (tx - p.x) * Math.min(1, dt * 22);
            p.y += (ty - p.y) * Math.min(1, dt * 22);
          }
        }

        for (let i = Game.particles.length - 1; i >= 0; i--) {
          const p = Game.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += p.gravity * dt;
          if (p.y > Config.groundY) {
            p.y = Config.groundY;
            p.vy *= -0.4;
            p.vx *= 0.7;
          }
          p.life -= dt;
          if (p.life <= 0) Game.particles.splice(i, 1);
        }

        for (let i = Game.shockwaves.length - 1; i >= 0; i--) {
          const sw = Game.shockwaves[i];
          sw.r += (sw.maxR - sw.r) * Math.min(1, dt * 16);
          sw.alpha -= dt * 4.2;
          if (sw.alpha <= 0) Game.shockwaves.splice(i, 1);
        }

        for (let i = Game.slashArcs.length - 1; i >= 0; i--) {
          const arc = Game.slashArcs[i];
          arc.life -= dt;
          if (arc.life <= 0) Game.slashArcs.splice(i, 1);
        }

        /* v0.8.96 角色殘影：瞬步／出刀衝步／下劈時，每 0.035 秒留一張半透明剪影（取代舊的藍色方塊） */
        if (Player._mcSpr && (Player.state === "dash" || Player.isDive || (Player.state === "attack" && Math.abs(Player.vx) > 150))) {
          Game._ghostT = (Game._ghostT || 0) - dt;
          if (Game._ghostT <= 0 && Game.afterimages.length < 14) {
            Game._ghostT = 0.035;
            Game.afterimages.push({ x: Player.x, y: Player.y, w: Player.w, h: Player.h, alpha: 0.55, spr: Player._mcSpr, s: Player._mcS, f: Player.facing,
              color: Player.y < Config.groundY - 2 ? "#86efac" : Player.state === "attack" ? "#bae6fd" : "#7dd3fc" });
          }
        }
        for (let i = Game.afterimages.length - 1; i >= 0; i--) {
          const img = Game.afterimages[i];
          img.alpha -= dt * 2.8;
          if (img.alpha <= 0) Game.afterimages.splice(i, 1);
        }

        for (let i = Game.floatingTexts.length - 1; i >= 0; i--) {
          const ft = Game.floatingTexts[i];
          ft.y += ft.vy * dt;
          ft.vy *= Math.pow(0.15, dt);
          ft.life -= dt;
          if (ft.life <= 0) Game.floatingTexts.splice(i, 1);
        }

        for (const leaf of Game.inkBambooLeaves) {
          leaf.x += leaf.vx * dt;
          leaf.y += leaf.vy * dt;
          leaf.angle += leaf.vAngle * dt;
          if (leaf.x < 0) leaf.x = Config.worldWidth;
          if (leaf.y > Config.groundY) {
            leaf.y = 100 + Math.random() * 200;
            leaf.x = Math.random() * Config.worldWidth;
          }
        }

        if (Game.flashWhiteOverlay > 0) Game.flashWhiteOverlay = Math.max(0, Game.flashWhiteOverlay - dt * 3.8);
        if (Game.darkVignetteAlpha > 0) Game.darkVignetteAlpha = Math.max(0, Game.darkVignetteAlpha - dt * 1.4);
        if (Game.executionBannerTimer > 0) Game.executionBannerTimer = Math.max(0, Game.executionBannerTimer - dt);
        if (Game.executionLines && Game.executionLines.length > 0) {
          for (let i = Game.executionLines.length - 1; i >= 0; i--) {
            const l = Game.executionLines[i];
            l.alpha -= dt * 1.6;
            if (l.alpha <= 0) Game.executionLines.splice(i, 1);
          }
        }
        if (Game.executionLine) {
          Game.executionLine.alpha -= dt * 1.6;
          if (Game.executionLine.alpha <= 0) Game.executionLine = null;
        }

        updateCamera(dt, false);
        syncHUD();
      }

      function updateCamera(dt, hitstopOnly) {
        const cam = Game.camera;
        if (!hitstopOnly) {
          const cineOn = !!Game.cine;
          const introOn = Game.introT > 0 || Game.dlgFocus || cineOn || !!Game.dir;
          if (Game.mode === "battle") { const stZ = Stages[Boss.stageId]; if (stZ) cam.targetZoom = stZ.camZoomP ? (stZ.camZoomP[Config.bossPhase] || 1) : 1.0 - Math.min(0.25, Math.max(0, (bossVis(stZ).k / 0.64 - 1) * 0.3)); } /* v0.8.83 camZoomP：依階段指定鏡頭縮放 */ /* v0.8.23 依 Boss 目前體型（含蛻變脹大）推算鏡頭拉遠 */
          const uw = Game.ultDim || 0;
          const focusX = (Game.dir && Game.dir.focusX != null) ? Game.dir.focusX : cineOn || (Game.dir && Player.blast) ? (Player.x + Boss.x) * 0.5 : introOn ? Boss.x : Player.x * (0.64 - 0.14 * uw) + Boss.x * (0.36 + 0.14 * uw);
          let targetX = focusX - Config.baseWidth * 0.5;
          let minCam = 0;
          if (Game.mode === "hub") { targetX = -1280; minCam = -1280; }
          else if (Game.mode === "enter") { targetX = Player.x - 420; minCam = -1280; }
          const clampedX = Math.max(minCam, Math.min(Config.worldWidth - Config.baseWidth, targetX));
          cam.x += (clampedX - cam.x) * Math.min(1, dt * 8.5);
          let zTarget = cam.targetZoom + (introOn && !cineOn ? 0.2 : 0) + 0.14 * uw;
          if (Game.mode === "hub" && canvas.width > canvas.height) {
            /* v0.7.5 營地填滿畫面：寬螢幕時放大到營地圖剛好撐滿左右，不露出黑邊與戰場；並在進入營地的第一幀直接到位 */
            zTarget = Math.max(zTarget, (canvas.width * Config.baseHeight) / (canvas.height * Config.baseWidth));
            if (!cam._hubSnap) { cam._hubSnap = true; cam.x = -1280; cam.zoom = zTarget; }
          } else if (Game.mode !== "hub") cam._hubSnap = false;
          const dc = Game.dir && Game.dir.camNow; /* v0.8.106 導演鏡頭：瞬間拉近（rate 大）／垂直對焦 */
          if (dc) zTarget = dc.zoom;
          cam.zoom += (zTarget - cam.zoom) * Math.min(1, dt * (dc ? dc.rate : 7.5));
          cam.y = (cam.y || 0) + ((dc ? dc.y : 0) - (cam.y || 0)) * Math.min(1, dt * (dc ? dc.rate : 6));
        }

        cam.shakeClock += dt;
        if (cam.trauma > 0) cam.trauma = Math.max(0, cam.trauma - dt);
      }
