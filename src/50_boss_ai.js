      /* v0.7.4 雙姿態 Boss（第 3 關）：Stages[n].stances = { A:{sprite,stride,pool,poolP2,far,farP2,alias}, B:{...} }
         每 switchEvery 招（二階段 switchEveryP2）插入「換姿」招式（stance_switch，前搖期間 Boss 有破綻），姿態決定用哪套動作表與招式池 */
      function stanceOf(stage) { return stage.stances ? stage.stances[Boss.stance] : null; }
      /* v0.8.23 姿態可各自指定 spriteScale／size／hurtHalf（受擊範圍加成）／bodyW／bodyH；Boss._scaleMul＝蛻變脹大中的倍率 */
      function bossVis(stage) {
        const st = stanceOf(stage) || {};
        const scale = st.spriteScale || stage.spriteScale || 0.64, size = st.size || stage.size || 1;
        return { scale, size, k: scale * size * (Boss._scaleMul || 1), hurt: st.hurtHalf || stage.hurtHalf || 0 };
      }
      function applyBossBody(stage) { const st = stanceOf(stage); if (st && st.bodyW) { Boss.w = st.bodyW; Boss.h = st.bodyH || Boss.h; } else { Boss.w = 100; Boss.h = 162; } }
      function bossHurt() { const stg = Stages[Boss.stageId]; return stg ? bossVis(stg).hurt : 0; }
      function stanceKey(stage, k) { const st = stanceOf(stage); return (st && st.alias && st.alias[k]) || k; }
      function weightedPick(list, moves) {
        const pp = list.filter(e => moves[e[0].split("+")[0]]);
        let tot = 0; pp.forEach(e => tot += e[1]);
        let roll = Math.random() * tot, pk = pp[0][0];
        for (const e of pp) { roll -= e[1]; if (roll <= 0) { pk = e[0]; break; } }
        return pk;
      }
      /* 進二階段：依 stage.stanceByPhase 換姿態（第 3 關：一階段雙劍、二階段玄鐵重劍） */
      function onBossPhase2() {
        const stage = Stages[Boss.stageId];
        if (stage && !stage.transformMove && STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]); /* v0.8.69 二階段換曲（第 5 關在蛻變落地時換） */
        if (stage && stage.transformMove && stage.moves[stage.transformMove] && stage.stanceByPhase && Boss.stance !== stage.stanceByPhase[2]) {
          triggerBossMove(stage.transformMove); /* 蛻變演出：長嘯脹大，active 起點才換姿態 */
          return;
        }
        if (stage && stage.phaseSwitchMove && stage.stanceByPhase && Boss.stance !== stage.stanceByPhase[2]) { /* v0.8.59 第 3 關：真的播一次拔重劍；被打斷（破勢等）就直接換 */
          triggerBossMove(stage.phaseSwitchMove);
          if (Boss.moveType === stage.phaseSwitchMove && Boss.state === "windup") return;
        }
        if (stage && stage.splitMove) Boss._splitPending = true; /* v0.8.55 第 2 關：二階段一開始先分身 */
        if (stage && stage.stanceByPhase && stage.stanceByPhase[2] && Boss.stance !== stage.stanceByPhase[2]) {
          Boss.stance = stage.stanceByPhase[2]; Boss.stanceCount = 0; Boss.flashFrames = 4;
          spawnFloatingText(Boss.x, Boss.y - 135, Boss.stance === "B" ? "〔拔出玄鐵重劍〕" : "〔青雲雙劍〕", "#a5b4fc", 1.2);
        }
      }
      /* v0.8.0 讀玩家打法：近 8 秒的招架／瞬步／跳躍／攻擊次數＋貼身比例；Boss 招式池依此調整權重 */
      const Reader = { parry: [], dash: [], jump: [], atk: [], nearAvg: 0,
        note(k) { const a = this[k]; a.push(performance.now() / 1000); if (a.length > 24) a.shift(); },
        count(k, sec) { const n = performance.now() / 1000; return this[k].filter(t => n - t < sec).length; },
        reset() { this.parry = []; this.dash = []; this.jump = []; this.atk = []; this.nearAvg = 0; } };
      /* 招式池：[[招式key（可用 + 串接：先出前者、收招後接後者）, 權重, 標籤], …]；標籤 break＝霸體破防、ranged／chase＝遠程追擊、push＝震退、mobility＝走位 */
      function pickFromPool(list, moves) {
        const parry = Reader.count("parry", 8), dash = Reader.count("dash", 8), near = Reader.nearAvg;
        const pp = list.filter(e => moves[e[0].split("+")[0]]).map(e => {
          let w = e[1]; const tag = e[2];
          if (tag === "break" && parry >= 3) w *= 2.5;
          if ((tag === "ranged" || tag === "chase") && dash >= 3) w *= 2.2;
          if (tag === "push" && near > 0.65) w *= 2.6;
          if (tag === "mobility" && near > 0.65) w *= 1.5;
          if (e[0].indexOf("leap_slam") >= 0 && (Boss._leapPity || 0) >= 5) w *= 3; /* 保底：連續 5 招沒躍斬，下一招權重 ×3 */
          return [e[0], w];
        });
        const pk = weightedPick(pp, moves);
        Boss._leapPity = pk.indexOf("leap_slam") >= 0 ? 0 : (Boss._leapPity || 0) + 1;
        return pk;
      }
      /* v0.8.27 衝擊波震飛：主角被震得往後飛（無敵、無法操作），落地滑行（劍在地上拖出火花），再用劍插進地面穩住自己，最後拔劍起身。
         動作格 17_slide／18_plant／19_rise 為選用美術（assets/mc/），沒有時用 16_hurt／13_parry／01_idle1 頂替 */
      function blastPlayer(dir) {
        if (Player.blast) return;
        Player.blast = { t: 0, phase: "fly", dir, spark: 0 };
        Player.state = "hitstun"; Player.stateTimer = 99; Player.hurtInv = 3.0;
        Player.isChargingAttack = false;
        Player.facing = -dir;
        Player.vx = dir * 1250; Player.vy = -470;
        Player.flashFrames = 3;
        hapticBuzz([80, 40, 120]); Sound.play("hit", 0.9, 0.6); Sound.play("s_hurt", 0.8, 0.8);
        spawnSparks(Player.x, Player.y - 50, "hit", dir);
      }
      function updateBlast(dt) {
        const B = Player.blast; if (!B) return;
        B.t += dt;
        const onG = Player.y >= Config.groundY - 2;
        const gy = Config.groundY;
        if (B.phase === "fly") {
          if (!onG) { Player.vx *= Math.pow(0.72, dt); B.air = true; }
          else {
            if (B.air) { B.air = false; B.slideT = 0; emitDust(Player.x, gy, -B.dir, 6, 1.5); triggerShake(B.dir, 0, 14, 0.2); }
            B.slideT = (B.slideT || 0) + dt;
            Player.vx *= Math.pow(0.2, dt);
            B.spark -= dt;
            if (B.spark <= 0) { B.spark = 0.045; spawnSparks(Player.x - B.dir * 20, gy - 4, "block", -B.dir); emitDust(Player.x, gy, -B.dir, 1, 0.9); }
            if ((B.slideT > 0.2 && Math.abs(Player.vx) < 520) || B.slideT > 0.7) { /* 劍插地 */
              B.phase = "plant"; B.pt = 0; Player.vx *= 0.5;
              spawnSparks(Player.x - Player.facing * 40, gy - 6, "parry", -B.dir);
              emitDust(Player.x, gy, -B.dir, 6, 1.6); addTrauma(0.5); hapticBuzz(30);
              Sound.play("block", 0.8, 0.6); Sound.play("slash", 0.5, 0.5);
              spawnFloatingText(Player.x, Player.y - 120, "〔以劍駐地〕", "#a5b4fc", 1.1);
              if (fxReady("land")) spawnFx("land", 0, Player.x - Player.facing * 40, gy + 14, { w: 330, h: 330, dur: 0.45, anchor: "b", alpha: 0.6 });
            }
          }
        } else if (B.phase === "plant") {
          B.pt += dt; Player.vx *= Math.pow(0.0004, dt);
          if (B.pt > 0.85) { B.phase = "rise"; B.rt = 0; }
        } else {
          B.rt += dt; Player.vx *= Math.pow(0.001, dt);
          if (B.rt > 0.3) {
            Player.blast = null; Player.hurtInv = Math.min(Player.hurtInv, 0.6); Player.state = "idle"; Player.stateTimer = 0; Player.facing = Boss.x >= Player.x ? 1 : -1;
          }
        }
      }
      /* v0.8.29 招式誇張變形（動畫的「關鍵格」手法：單格看很變形，連起來很有動態）：
         move.dfm = { w:{…}, a:{…, rotEnd, ghost, gap}, r:{…}, pulse, shake }，欄位 sx／sy（以腳底為軸的縮放）、rot（弧度，正＝往前傾）、
         ox（沿面向的位移）、oy（垂直位移）。windup 由中立漸入 w（蓄力壓扁後縮）→ active 快速彈到 a（拉長前衝、帶殘影 ghost 張、間距 gap）→
         recover 回彈到中立（帶彈性過衝）。只影響繪製，不影響判定。 */
      function bossDeform(move) {
        const d = move && move.dfm; if (!d) return null;
        const st = Boss.state; if (st !== "windup" && st !== "active" && st !== "recover") return null;
        const N = { sx: 1, sy: 1, rot: 0, ox: 0, oy: 0 };
        const stg = Stages[Boss.stageId], K = move.dfmK != null ? move.dfmK : (stg && stg.dfmK != null ? stg.dfmK : 1); /* 變形強度倍率（0＝不變形） */
        const soft = (o) => { const r = Object.assign({}, N, o); r.sx = 1 + (r.sx - 1) * K; r.sy = 1 + (r.sy - 1) * K; r.rot *= K; r.ox *= K; r.oy *= K; if (o && o.rotEnd != null) r.rotEnd = o.rotEnd * K; return r; };
        const W = soft(d.w), A = Object.assign(soft(d.a), { ghost: d.a && d.a.ghost, gap: d.a && d.a.gap });
        const cl = (v) => Math.max(0, Math.min(1, v));
        const mix = (P, Q, t) => ({ sx: P.sx + (Q.sx - P.sx) * t, sy: P.sy + (Q.sy - P.sy) * t, rot: P.rot + (Q.rot - P.rot) * t, ox: P.ox + (Q.ox - P.ox) * t, oy: P.oy + (Q.oy - P.oy) * t });
        let out;
        if (st === "windup") {
          const p = cl(1 - Boss.stateTimer / (Boss.stateDur || 1));
          out = mix(N, W, 1 - Math.pow(1 - p, 2.2));
          if (d.shake) out.ox += Math.sin(performance.now() * 0.09) * d.shake * p;
        } else if (st === "active") {
          const p = cl(1 - Boss.stateTimer / (Boss.stateDur || 1));
          let t = 1 - Math.pow(1 - cl(p / 0.22), 3);
          if (d.pulse) { const hits = move.comboTotalHits || 2; t *= 0.4 + 0.6 * Math.abs(Math.sin(p * Math.PI * hits)); }
          out = mix(W, A, t);
          if (A.rotEnd != null) out.rot = A.rot + (A.rotEnd - A.rot) * p;
          out.ghost = A.ghost || 0; out.gap = A.gap || 40;
          if (d.kick && Boss._kickMs) { /* v0.8.72 連發投射：每發一頓（往前推＋前傾，110ms 衰減） */
            const e = Math.exp(-Math.max(0, performance.now() - Boss._kickMs) / 110);
            out.ox += (d.kick.ox || 0) * K * e; out.rot += (d.kick.rot || 0) * K * e; out.sx += ((d.kick.sx || 1) - 1) * K * e; out.sy += ((d.kick.sy || 1) - 1) * K * e;
          }
        } else {
          const rd = (move.recover || 0.5) * (Config.bossPhase === 2 ? 0.75 : 1);
          const p = cl(1 - Boss.stateTimer / Math.max(0.05, rd));
          const R = soft(d.r);
          const e = 1 - Math.pow(1 - p, 2);
          const A2 = Object.assign({}, A, A.rotEnd != null ? { rot: A.rotEnd } : {});
          out = mix(A2, R, e);
          const k = Math.sin(p * Math.PI) * (1 - p) * 1.6 * (d.bounce == null ? 1 : d.bounce); /* 彈性過衝 */
          out.sx += (R.sx - A.sx) * -k * 0.35; out.sy += (R.sy - A.sy) * -k * 0.35;
        }
        out.ghost = out.ghost || 0;
        return out;
      }
      /* v0.8.25 招式特效（資料驅動）：move.fxAct＝出招起點、move.fxHit＝連擊每一下、move.fxLand＝躍擊落地；
         欄位 {sheet,row,ox(沿面向偏移),oy,w,h,dur,anchor,alpha} */
      function spawnMoveFx(f) {
        if (Array.isArray(f)) { f.forEach(spawnMoveFx); return; } /* v0.8.59 一次可出多個特效（刀弧＋落地震波） */
        if (!f || !fxReady(f.sheet)) return;
        spawnFx(f.sheet, f.row, Boss.x + Boss.facing * (f.ox || 0), Boss.y + (f.oy || 0), { w: f.w, h: f.h || f.w, dur: f.dur || 0.35, facing: Boss.facing, anchor: f.anchor || "c", alpha: f.alpha == null ? 1 : f.alpha, rot: (f.rot || 0) * Boss.facing });
      }
      function triggerMacro(k) { const parts = k.split("+"); triggerBossMove(parts[0], parts.slice(1)); }
      /* v0.8.66 飛劍招前搖：在出手高度召喚成形（flySwordArt.summonRow）；幻影也照它要射的高度召喚，避免洩漏真身 */
      function summonSwordsFx(stage, m) {
        const fsa = stage.flySwordArt;
        if (!fsa || fsa.summonRow == null || !m.isRanged || !m.bulletY || m.bulletTrajectory === "vertical" || !fxReady(fsa.sheet)) return;
        const w = fsa.w || 150, dur = (m.windup || 0.5) + 0.1;
        const at = (x, fc, ys) => ys.forEach(by => spawnFx(fsa.sheet, fsa.summonRow, x + fc * ((m.bulletX || 30) - 60), Boss.y + by, { w, dur, facing: fc }));
        at(Boss.x, Boss.facing, m.bulletY);
        (Game.illusions || []).forEach(il => { if (!il.dead) at(il.x, Player.x >= il.x ? 1 : -1, [0, 1].map(i => m.bulletY[(i * 2) % m.bulletY.length])); });
      }
      function triggerBossMove(moveKey, queue = []) {
        if (Boss.state === "staggered" || Boss.state === "frozen") return;
        const stage = Stages[Boss.stageId];
        const m = stage.moves[moveKey];
        if (!m) return;

        Boss.facing = Player.x >= Boss.x ? 1 : -1;
        if (m.isSplit && illusionsAlive()) { triggerBossMove(stage.splitFallback || "slash1", queue); return; }
        illusionFaceAll(); Boss._ilStruck = false;
        Boss.moveType = moveKey;
        summonSwordsFx(stage, m);
        Boss.landedHit = false;
        if (m.isRage && Boss.stageId === 1 && fxReady("boss2")) spawnFx("boss2", 3, Boss.x, Boss.y + 12, { anchor: "b", w: 380, dur: m.windup + m.active + 0.5, loop: true, fps: 10, follow: () => ({ x: Boss.x, y: Boss.y + 12 }) });
        if (m.isRage) { spawnFloatingText(Boss.x, Boss.y - 150, "〔怒氣爆發〕", "#f87171", 1.3); Sound.play("peril", 0.8, 0.8); Boss.flashFrames = 4; }
        if (stage.stances && !m.isSwitch) Boss.stanceCount++;
        if (m.isSwitch && !m.isTransform) hintOnce("stance", "【換姿】莫寒川拔劍換姿時有破綻，趁機攻擊！");
        Boss.state = "windup";
        if (m.sfx && m.sfx.w) Sound.play(m.sfx.w, 0.85, 1); /* v0.8.34 招式前搖聲（低吼／嚎叫） */
        const phaseMod = Config.bossPhase === 2 ? 0.82 : 1.0;
        Boss.stateTimer = m.windup * phaseMod;
        Boss.stateDur = m.windup * phaseMod;
        Boss.isPerilous = !!m.isPerilous;
        Boss.perilType = m.perilType || null;
        if (m.ultimate) {
          Boss.ultCd = Config.bossPhase === 2 ? 16 : 24;
          const ultName = String(m.name).replace(/【危】/, "").replace(/\s*[（(].*[）)]\s*/, "");
          showBanner(ultName, "大　招", Math.round(m.windup * 1000) + 350, "#fca5a5");
          Sound.play("peril", 1.0, 0.7);
          hapticBuzz([30, 40, 60]);
        }
        Boss.hitRegistered = false;
        Boss.comboChain = queue;
        Boss.grabZoneX = Player.x;
        Boss.feintTriggered = false;
        Boss.feintPauseTimer = 0;
        Boss.teleportExecuted = false;
        Boss.comboHitsLeft = m.isCombo ? (m.comboTotalHits || 3) : 0;
        Boss.comboHitTimer = 0;
        Boss.lastCueSoundId = "";
        Boss.nextImpactIn = 999;
        Boss.aerialBreak = 0;
        Boss.aerialTimer = 0;
        Boss.aerialShotTimer = m.aerialShotInterval || 1.1;
        Boss.jumpedOver = false;
        if (m.isCharge) hintOnce("charge", "【衝鋒】跳躍越過，或在它貼近時瞬步閃開");

        if (m.isAerial) {
          const hits = m.aerialBreakHits || 3;
          setTelemetry(`敵將騰空！彈開攻擊 ${hits} 次可將其擊落`);
          hintOnce("aerial", `敵將騰空！彈開飛劍 ${hits} 次可將其擊落`);
          Sound.play("peril", 0.9, 1.0);
        } else if (Boss.isPerilous) {
          Sound.play("peril", 0.9, 1.0);
          const hint =
            Boss.perilType === "thrust"
              ? "【危・突刺】迎刃按 [瞬步 L] 踏劍看破！"
              : Boss.perilType === "sweep"
              ? "【危・橫掃】按 [跳躍 Space] 滯空踩頭！"
              : "【危・法陣】按 [瞬步 L] 極限側閃脫離！";
          setTelemetry(hint);
          hintOnce("peril_" + Boss.perilType, hint);
        } else {
          setTelemetry(`${stage.name} 施放：${m.name}｜把握時機按 K 青雲格擋`);
        }
      }

      function updateBossAI(dt) {
        if (Game.bossDeath) {
          Boss.vx = 0;
          Boss.state = "recover";
          Boss.stateTimer = 9;
          Boss.isPerilous = false;
          return;
        }
        const stage = Stages[Boss.stageId];
        /* v0.8.0 怒氣：累積 Boss 受到的傷害；貼身比例（讀玩家打法用） */
        if (Boss.lastHp > Boss.hp) Boss.rage += Boss.lastHp - Boss.hp;
        Boss.lastHp = Boss.hp;
        Reader.nearAvg += (((Math.abs(Player.x - Boss.x) < 230) ? 1 : 0) - Reader.nearAvg) * Math.min(1, dt / 6);

        // C3: 命中預測與提示記錄
        Boss.nextImpactIn = 999;
        const moveForCue = stage && stage.moves ? stage.moves[Boss.moveType] : null;
        if (moveForCue && (Boss.state === "windup" || Boss.state === "active") && !moveForCue.isRanged && !moveForCue.isZone && !moveForCue.isSwitch && !moveForCue.isMobility && !moveForCue.isSplit) {
            if (moveForCue.isAerial) {
                if (Boss.state === "active") {
                    Boss.nextImpactIn = Boss.aerialShotTimer;
                }
            } else if (moveForCue.isCombo) {
                if (Boss.state === "windup") {
                    Boss.nextImpactIn = Boss.stateTimer;
                } else if (Boss.state === "active" && Boss.comboHitsLeft > 0) {
                    Boss.nextImpactIn = Boss.comboHitTimer;
                }
            } else {
                if (Boss.state === "windup") {
                    const phaseMod = Config.bossPhase === 2 ? 0.82 : 1.0;
                    const volSpeedMod = stage.volume === 2 ? 0.78 : stage.volume === 3 ? 0.64 : 1.0;
                    const activeDur = moveForCue.active * phaseMod * volSpeedMod;
                    Boss.nextImpactIn = Boss.stateTimer + activeDur * 0.35;
                } else if (Boss.state === "active" && !Boss.hitRegistered) {
                    Boss.nextImpactIn = Boss.stateTimer - Boss.stateDur * 0.65;
                }
            }
        }

        if (Boss.nextImpactIn > 0 && Boss.nextImpactIn <= 0.35) {
            if (Boss.nextImpactIn <= 0.18) {
                const soundId = Boss.state + "_" + Boss.moveType + "_" + Boss.comboHitsLeft;
                if (Boss.lastCueSoundId !== soundId) {
                    Boss.lastCueSoundId = soundId;
                    if (Config.parryCueLevel === 2 && !Boss.isPerilous) {
                        Sound.play("parry", 0.25, 1.8);
                    }
                }
            }
        }

        if (Config.bossPhase === 2) {
          Boss.auraParticles.push({
            x: Boss.x + (Math.random() - 0.5) * Boss.w * 0.9,
            y: Boss.y - Math.random() * Boss.h,
            vx: (Math.random() - 0.5) * 30,
            vy: -40 - Math.random() * 80,
            life: 0.45, maxLife: 0.45, size: 2.5 + Math.random() * 2
          });
        }
        for (let i = Boss.auraParticles.length - 1; i >= 0; i--) {
          const ap = Boss.auraParticles[i];
          ap.x += ap.vx * dt;
          ap.y += ap.vy * dt;
          ap.life -= dt;
          if (ap.life <= 0) Boss.auraParticles.splice(i, 1);
        }

        if (Boss.frozenTimer > 0) {
          Boss.frozenTimer -= dt;
          if (Boss.frozenTimer <= 0) {
            Boss.state = "idle";
            Boss.aiCooldown = 0.3;
          }
          return;
        }

        if (Boss.state === "staggered") {
          Boss.staggerTimer -= dt;
          Boss.vx *= Math.pow(0.05, dt);
          if (Boss.staggerTimer <= 0) {
            Boss.state = "idle";
            Boss.posture = Math.round(Boss.maxPosture * 0.45);
            Boss.aiCooldown = 0.35;
          }
          return;
        }

        if (Boss.state === "grounded") {
          Boss.groundedTimer -= dt;
          Boss.vx *= Math.pow(0.05, dt);
          if (Boss.groundedTimer <= 0) {
            Boss.state = "recover";
            Boss.stateTimer = 1.0;
          }
          return;
        }

        if (Boss.postureDecayDelay > 0) {
          Boss.postureDecayDelay -= dt;
        } else if (Boss.state === "idle" || Boss.state === "approach") {
          // 隻狼核心機制：Boss 氣血決定架勢恢復速度！
          // 血量 > 75%：架勢恢復極快 (12%/s，拉開距離瞬間回滿)！
          // 血量 50%~75%：架勢恢復中速 (6%/s)
          // 血量 < 50%：架勢幾乎停止恢復 (2%/s)，此時正是拼刀忍殺良機！
          const hpRatio = Boss.hp / Boss.maxHp;
          let decayRate = hpRatio > 0.75 ? 12 : hpRatio > 0.5 ? 6 : 2;
          Boss.posture = Math.max(0, Boss.posture - decayRate * dt);
        }

        if (Boss.state === "hurt") {
          Boss.stateTimer -= dt;
          Boss.vx *= Math.pow(0.08, dt);
          if (Boss.stateTimer <= 0) {
            Boss.state = "idle";
            Boss.aiCooldown = 0.25;
          }
          return;
        }

        // stage declared at top of updateBossAI
        const move = stage.moves[Boss.moveType];

        if (move && move.isAerial) {
          if (Boss.state === "windup") {
            const t = 1 - (Boss.stateTimer / (Boss.stateDur || 1));
            Boss.y = Config.groundY - 260 * Math.sin(t * Math.PI * 0.5);
          } else if (Boss.state === "active") {
            Boss.y = Config.groundY - 260;
          } else if (Boss.state === "recover") {
            const t = 1 - (Boss.stateTimer / (move.recover || 1));
            Boss.y = (Config.groundY - 260) + 260 * Math.sin(t * Math.PI * 0.5);
          }
        } else if (Boss.state !== "staggered" && Boss.state !== "grounded" && Boss.state !== "frozen") {
          Boss.y += (Config.groundY - Boss.y) * Math.min(1, dt * 5); // smooth return if interrupted
        }

        // Progressive Difficulty Scaling:
        // Vol 1 (1-5): Normal speed (0.6s windup)
        // Vol 2 (6-10): 25% faster windup & aggressive recovery
        // Vol 3 (11-15): 40% faster windup, instant reactions
        let volSpeedMod = 1.0;
        if (stage.volume === 2) volSpeedMod = 0.78;
        else if (stage.volume === 3) volSpeedMod = 0.64;

        if (Boss.state === "windup") {
          Boss.vx *= Math.pow(0.05, dt);

          // 原語 (2) 變速假動作：前搖中途停頓再出招
          if (move.isFeint && !Boss.feintTriggered) {
            const windupProgress = 1 - (Boss.stateTimer / (Boss.stateDur || 1));
            if (windupProgress >= (move.feintPauseAt || 0.42)) {
              Boss.feintTriggered = true;
              Boss.feintPauseTimer = move.feintPauseDur || 0.25;
              Boss.flashFrames = 2;
              Sound.play("block", 0.55, 1.4);
              spawnFloatingText(Boss.x, Boss.y - 110, "〔蓄勢變速〕", "#fde047", 0.95);
            }
          }
          if (Boss.feintPauseTimer > 0) {
            Boss.feintPauseTimer -= dt;
            Boss.vx = 0;
            return; // 假動作懸停中，暫停前搖倒數
          }

          // 原語 (5) 位移突襲：前搖期間瞬移到玩家身後
          if (move.isTeleport && !Boss.teleportExecuted) {
            const windupProgress = 1 - (Boss.stateTimer / (Boss.stateDur || 1));
            if (windupProgress >= (move.teleportDelay || 0.35)) {
              Boss.teleportExecuted = true;
              if (move.tpFx) { /* v0.8.55 瞬移：原地鏡碎（v0.8.57 改用第 2 關專屬特效 boss2fx 列 3） */
                if (fxReady("boss2fx")) spawnFx("boss2fx", 3, Boss.x, Boss.y - 110, { w: 340, dur: 0.42 });
                else if (fxReady("spark")) spawnFx("spark", 2, Boss.x, Boss.y - 85, { w: 300, dur: 0.38 });
                bsfx("tpOut");
              }
              spawnSparks(Boss.x, Boss.y - 60, "hit", Boss.facing);
              Boss.x = Math.max(100, Math.min(Config.worldWidth - 100, Player.x - Player.facing * 110));
              Boss.facing = Player.facing;
              Boss.flashFrames = 3;
              if (move.tpFx) { if (fxReady("boss2fx")) spawnFx("boss2fx", 2, Boss.x, Config.groundY - 20, { w: 360, h: 360, dur: 0.4 }); emitDust(Boss.x, Config.groundY, -Boss.facing, 4, 1.0); }
              if (!bsfx("tpIn")) Sound.play("assist", 0.85, 1.45);
              spawnFloatingText(Boss.x, Boss.y - 120, move.teleportText || "【虛空瞬襲】！", move.teleportColor || "#c084fc", 1.2);
            }
          }

          if (move.isTransform) { /* 蛻變前搖：長嘯、逐漸脹大、地面震動與黑氣 */
            const tp = Math.max(0, Math.min(1, 1 - Boss.stateTimer / (Boss.stateDur || 1)));
            Boss._scaleMul = 1 + ((stage.transformGrow || 2) - 1) * tp * tp;
            addTrauma(dt * (0.25 + 0.6 * tp));
            if (Math.random() < dt * 14) emitDust(Boss.x + (Math.random() - 0.5) * 120 * Boss._scaleMul, Config.groundY, Math.random() < 0.5 ? -1 : 1, 2, 0.9 + tp);
          }
          Boss.stateTimer -= dt;
          if ((Boss.perilType === "grab" || Boss.perilType === "leap") && Boss.stateTimer > 0.2) {
            Boss.grabZoneX += (Player.x - Boss.grabZoneX) * Math.min(1, dt * 6);
            if (Boss.perilType === "leap") { const mx = (Boss.__leapMax = (stage.moves[Boss.moveType].leapMax || 480)); Boss.grabZoneX = Boss.x + Math.max(-mx, Math.min(mx, Boss.grabZoneX - Boss.x)); } /* 躍擊最遠飛行距離 */
          }
          if (Boss.stateTimer <= 0) {
            Boss.state = "active";
            const phaseMod = Config.bossPhase === 2 ? 0.82 : 1.0;
            Boss.stateTimer = move.active * phaseMod * volSpeedMod;
            Boss.stateDur = move.active * phaseMod * volSpeedMod;
            Boss.vx = Boss.facing * move.lunge * (Config.bossPhase === 2 ? 1.2 : 1.0);
            spawnMoveFx(move.fxAct); illusionMoveFx(move.fxAct); /* 幻影也出同樣的特效，否則特效會洩漏真身 */
            if (move.isSplit) illusionSplit();
            if (move.isRanged) illusionShoot(move);
            const sfxA0 = move.sfx && (move.sfx.a || move.sfx.h), sfxA = sfxA0 && Sound.buffers[sfxA0] ? sfxA0 : null; /* v0.8.34 出招聲：有指定且檔案已載入才取代預設揮劍音 */
            if (sfxA) Sound.play(sfxA, 0.9, 1);
            if (move.kick) addTrauma(move.kick);
            if (move.isCharge && Boss.stageId === 1 && fxReady("boss2")) spawnFx("boss2", 2, Boss.x, Boss.y - 120, { w: 440, dur: Math.max(0.4, move.active), loop: true, fps: 11, facing: Boss.facing, follow: () => ({ x: Boss.x - Boss.facing * 90, y: Boss.y - 120 }) });
            if (move.swordRain) {
              for (let k = -2; k <= 2; k++) emitDust(Boss.grabZoneX + k * move.range * 0.3, Config.groundY, k < 0 ? -1 : 1, 2, 0.8);
              triggerShake(Boss.facing, 0, 16, 0.3); Sound.play("peril", 0.7, 1.4);
            }
            if (move.isLeap) {
              Boss.leapStartX = Boss.x;
              Boss.leapLandX = Math.max(120, Math.min(Config.worldWidth - 120, Boss.grabZoneX - Boss.facing * 55));
              Boss.vx = 0; if (!sfxA) Sound.play("slash", 0.6, 0.7); emitDust(Boss.x, Config.groundY, -Boss.facing, 5, 1.1);
            }
            if (move.isMobility && !sfxA) Sound.play("slash", 0.4, 1.7);
            if (move.isSwitch) {
              Boss.stance = Boss.stance === "A" ? "B" : "A";
              Boss.hitRegistered = true; Boss.flashFrames = 3;
              Sound.play("block", 0.55, 1.2);
              if (move.burst) { spawnMoveFx(move.burst); addTrauma(0.45); triggerHitstopMs(60); emitDust(Boss.x, Config.groundY, 1, 5, 1.3); emitDust(Boss.x, Config.groundY, -1, 5, 1.3); }
              const swTxt = (move.switchText && move.switchText[Boss.stance]) || (Boss.stance === "B" ? "〔換姿・玄鐵重劍〕" : "〔換姿・青雲雙劍〕");
              spawnFloatingText(Boss.x, Boss.y - 130, swTxt, move.isTransform ? "#f87171" : "#a5b4fc", 1.2);
              if (move.isTransform) { /* 蛻變完成：換成大狼、震波、震退玩家 */
                Boss._scaleMul = 1; applyBossBody(stage);
                addTrauma(0.9); Boss.flashFrames = 5; triggerHitstopMs(90); hapticBuzz(40);
                emitDust(Boss.x, Config.groundY, 1, 8, 1.8); emitDust(Boss.x, Config.groundY, -1, 8, 1.8);
                if (fxReady("land")) spawnFx("land", 0, Boss.x, Config.groundY + 22, { w: 900, h: 900, dur: 0.7, anchor: "b", alpha: 0.9 });
                Sound.play("execution", 0.7, 0.55);
                Sound.play("m_roar", 1.0, 1); /* v0.8.34 大狼覺醒的怪物咆哮；二階段配樂（若有） */
                if (STAGE_BGM_P2[Boss.stageId]) Music.play(STAGE_BGM_P2[Boss.stageId]);
                blastPlayer(Player.x >= Boss.x ? 1 : -1); /* 震飛主角，劍插地穩住 */
                if (Boss.stageId === 5 && fxReady("flame")) { /* 大狼背上的魔焰（v0.8.33 新圖 flame.webp：第 3 列大火、第 4 列飄散火星）：疊加發光、循環搖擺，跟著 Boss */
                  [[-140, 6.5, 2, 190, 0.5], [-10, 8, 2, 220, 0.5], [115, 7, 2, 190, 0.5], [0, 5, 3, 300, 0.7]].forEach(([o, fps, row, sz, al]) => spawnFx("flame", row, Boss.x, Boss.y - 185, { anchor: "b", w: sz, h: sz, alpha: al, dur: 9999, loop: true, fps, follow: () => (Boss.hp > 0 ? { x: Boss.x + Boss.facing * o, y: Boss.y - 185 } : { x: -9999, y: -9999 }) }));
                }
              }
            }

            // 原語 (1) 彈道：發射多種彈道投射物
            if (move.isRanged) {
              spawnProjectiles(move);
            }
            // 原語 (4) 區域封鎖：召喚地表持續傷害區域
            if (move.isZone) {
              bsfx("zone");
              const zX = (move.zoneTargetPlayer || (move.zoneTargetP2 && Config.bossPhase === 2)) ? Player.x : Boss.x + Boss.facing * (move.range * 0.5);
              Game.hazardZones.push({
                x: zX,
                y: Config.groundY,
                w: move.zoneWidth || 300,
                h: 30,
                duration: move.zoneDuration || 2.5,
                maxDur: move.zoneDuration || 2.5,
                type: move.zoneType || "fire",
                damagePerSec: move.zoneDamagePerSec || 150,
                warningTimer: 0.5
              });
              Sound.play("peril", 0.85, 1.3);
              spawnFloatingText(zX, Config.groundY - 50, "【煞氣絕地形成】！", "#f87171", 1.15);
            }

            if (!move.isRanged && !move.isZone && !move.isCounter && !move.isHeal && !move.isSwitch && !move.isMobility && !move.isLeap && !move.isSplit) {
              if (!sfxA) Sound.play("slash", 0.85, Boss.isPerilous ? 0.72 : 0.95);
              if (Boss.perilType !== "grab") {
                const bType = Stages[Boss.stageId].bodyType || "human";
                const anim = move.anim || "slash";
                const aType = bType === "beast" ? "claw" : bType === "eye" ? "beam" : anim;
                const bArt = Boss.stageId === 1 && fxReady("boss1");
                if (bArt) {
                  const bf = Boss.facing, rg = move.range;
                  if (Boss.perilType === "thrust") {
                    const bw = rg + 160;
                    spawnFx("boss1", 1, Boss.x + bf * 10, Boss.y - 140, { anchor: "l", w: bw, h: bw * 0.55, dur: Math.max(0.3, move.active * 1.3), facing: bf });
                  } else if (Boss.perilType === "sweep") {
                    const bw = rg * 2.7;
                    spawnFx("boss1", 2, Boss.x + bf * rg * 0.25, Config.groundY - bw * 0.2, { w: bw, dur: 0.42, facing: bf });
                  } else {
                    const bw = rg * 2.3;
                    spawnFx("boss1", 0, Boss.x + bf * rg * 0.35, Boss.y - 150, { w: bw, dur: 0.26, facing: bf });
                  }
                }
                Game.slashArcs.push({
                  art: bArt || !!(Stages[Boss.stageId].arcArt && fxReady(Stages[Boss.stageId].arcArt)), /* v0.8.57 有專屬特效圖的關卡不畫程式刀弧 */
                  x: Boss.x + Boss.facing * 26,
                  y: Boss.y - (Boss.perilType === "sweep" ? 22 : 64),
                  facing: Boss.facing,
                  radius: move.range * 0.8,
                  startAngle: Boss.perilType === "sweep" ? 0.25 : -1.15,
                  endAngle: Boss.perilType === "sweep" ? 1.35 : 0.95,
                  life: 0.19, maxLife: 0.19,
                  color: Boss.isPerilous ? "#ef4444" : Boss.artId >= 11 ? "#fde047" : "#fb923c",
                  isRiposte: false,
                  arcType: aType
                });
              }
            }
          }
          return;
        }

        if (Boss.state === "active") {
          Boss.stateTimer -= dt;
          if (move.isLeap) {
            const lt = Math.min(1, Math.max(0, 1 - Boss.stateTimer / (Boss.stateDur || 1)));
            Boss.x = Boss.leapStartX + (Boss.leapLandX - Boss.leapStartX) * lt;
            Boss.y = Config.groundY - (move.leapH || 230) * Math.sin(lt * Math.PI);
            Boss.vx = 0;
          }
          if (move.isMobility && Math.random() < dt * 28) emitDust(Boss.x - Math.sign(Boss.vx || 1) * 30, Config.groundY, -Math.sign(Boss.vx || 1), 2, 0.8);
          if (move.isCharge) {
            Boss.vx = Boss.facing * (move.chargeSpeed || 760);
            if (Math.random() < dt * 40) emitDust(Boss.x - Boss.facing * 30, Config.groundY, -Boss.facing, 2, 0.8);
            const cdx = Player.x - Boss.x;
            if (!Boss.hitRegistered && Player.state !== "execution" && Math.abs(cdx) <= move.range && cdx * Boss.facing > -40 && Player.y >= Config.groundY - 60) {
              Boss.hitRegistered = true;
              resolveBossStrike(move);
            } else if (!Boss.hitRegistered && Math.abs(cdx) <= move.range && Player.y < Config.groundY - 60 && !Boss.jumpedOver) {
              Boss.jumpedOver = true;
              spawnFloatingText(Player.x, Player.y - 95, "躍過【衝鋒】！", "#34d399", 1.05);
            }
          }
          if (move.isHeal) {
            Boss.hp = Math.min(Boss.maxHp, Boss.hp + Boss.maxHp * 0.08 * dt / (move.active || 1.2));
            if (Math.random() < dt * 14) spawnSparks(Boss.x + (Math.random() - 0.5) * 50, Boss.y - 40 - Math.random() * 60, "hit", 1);
          }

          if (move.isAerial) {
            Boss.aerialTimer += dt;
            Boss.aerialShotTimer -= dt;
            if (Boss.aerialShotTimer <= 0) {
              Boss.aerialShotTimer = move.aerialShotInterval || 1.1;
              const dx = Player.x - Boss.x;
              const dy = (Player.y - 45) - Boss.y;
              const dist = Math.hypot(dx, dy) || 1;
              const speed = 850;
              Game.flyingSwords.push({
                x: Boss.x,
                y: Boss.y,
                vx: (dx / dist) * speed,
                vy: (dy / dist) * speed,
                dir: Boss.facing,
                damage: move.damage || 130,
                reflected: false,
                life: 3.0,
                color: Boss.artId >= 11 ? "#fde047" : "#c084fc",
                trajectory: "linear",
                isAerialShot: true
              });
              Sound.play("flysword", 0.8, 1.1);
            }
            
            if (Boss.aerialTimer >= (move.aerialMaxDuration || 9)) {
              Boss.state = "recover";
              Boss.stateTimer = move.recover || 1.0;
              Boss.isPerilous = false;
            }
            return;
          }

          // 原語 (3) 多段連擊：依間隔連續揮斬判定
          if (move.isCombo && Boss.comboHitsLeft > 0) {
            Boss.comboHitTimer -= dt;
            if (Boss.comboHitTimer <= 0) {
              Boss.comboHitTimer = move.comboInterval || 0.20;
              Boss.comboHitsLeft--;
              if (Boss.comboHitsLeft === 1 && move.comboLastDelay) Boss.comboHitTimer = move.comboLastDelay; /* 補刀延遲：逼玩家不要連按招架 */
              Boss.hitRegistered = false;

              if (move.sfx && move.sfx.h && Sound.buffers[move.sfx.h]) Sound.play(move.sfx.h, 0.85, 0.95 + (move.comboTotalHits - Boss.comboHitsLeft) * 0.05); else Sound.play("slash", 0.85, 0.9 + (move.comboTotalHits - Boss.comboHitsLeft) * 0.08);
              spawnMoveFx(move.fxHit);
              if (move.kickHit) addTrauma(move.kickHit);
              const bType = Stages[Boss.stageId].bodyType || "human";
              const anim = move.anim || "slash";
              const aType = bType === "beast" ? "claw" : bType === "eye" ? "beam" : anim;
              
              let sAngle = Boss.comboHitsLeft % 2 === 0 ? 0.25 : -1.15;
              let eAngle = Boss.comboHitsLeft % 2 === 0 ? 1.35 : 0.95;
              if (Boss.artId === 14 && Boss.moveType === "exclusive_combo") {
                if (Boss.comboHitsLeft === 2) { sAngle = -0.5; eAngle = -1.5; }
                else if (Boss.comboHitsLeft === 1) { sAngle = -0.2; eAngle = 0.2; }
                else { sAngle = 1.5; eAngle = 0.5; }
              }

              const cArt = Boss.stageId === 1 && fxReady("boss1");
              if (cArt) {
                const cw = move.range * 2.1;
                spawnFx("boss1", Boss.perilType === "thrust" ? 1 : 0, Boss.x + Boss.facing * move.range * 0.35, Boss.y - 150,
                  { w: cw, dur: 0.22, facing: Boss.facing, rot: Boss.comboHitsLeft % 2 === 0 ? 0.45 : -0.35, anchor: Boss.perilType === "thrust" ? "l" : "c" });
              }
              Game.slashArcs.push({
                art: cArt || !!(Stages[Boss.stageId].arcArt && fxReady(Stages[Boss.stageId].arcArt)),
                x: Boss.x + Boss.facing * 26,
                y: Boss.y - 64,
                facing: Boss.facing,
                radius: move.range * 0.8,
                startAngle: sAngle,
                endAngle: eAngle,
                life: 0.18, maxLife: 0.18,
                color: Boss.isPerilous ? "#ef4444" : "#f59e0b",
                isRiposte: false,
                arcType: aType
              });

              const dx = Player.x - Boss.x;
              const inFront = dx * Boss.facing >= -25;
              const dist = Math.abs(dx);
              if (inFront && dist <= move.range && Player.state !== "execution") {
                Boss.hitRegistered = true;
                resolveBossStrike({
                  damage: move.comboDamagePerHit || Math.round(move.damage / move.comboTotalHits),
                  parryPostureDmg: Math.round((move.parryPostureDmg || 20) * 0.6)
                });
              }
              illusionStrike(move, move.comboDamagePerHit || Math.round(move.damage / move.comboTotalHits));
            }
          }

          const swingProgress = 1 - (Boss.stateTimer / (Boss.stateDur || 1));
          if (!Boss._ilStruck && swingProgress >= 0.35 && !move.isRanged && !move.isZone && !move.isCombo && !move.isCounter && !move.isHeal && !move.isLeap && !move.isMobility && !move.isSwitch && !move.isSplit) { Boss._ilStruck = true; illusionStrike(move); }
          if (!Boss.hitRegistered && Player.state !== "execution" && !move.isRanged && !move.isZone && !move.isCombo && !move.isCounter && !move.isHeal && !move.isCharge && !move.isLeap && !move.isMobility && !move.isSplit && swingProgress >= 0.35) {
            if (Boss.perilType === "grab") {
              const d = Math.abs(Player.x - Boss.grabZoneX);
              if (d <= move.range * 0.75 && Player.y >= Config.groundY - 70) {
                Boss.hitRegistered = true;
                resolveBossStrike(move);
              }
            } else {
              const dx = Player.x - Boss.x;
              const inFront = dx * Boss.facing >= -25;
              const dist = Math.abs(dx);
              if (inFront && dist <= move.range) {
                Boss.hitRegistered = true;
                resolveBossStrike(move);
                if (move.pushback && Player.state !== "parry" && Player.invulnTimer <= 0.05) Player.vx = (Player.x >= Boss.x ? 1 : -1) * move.pushback;
              }
            }
          }

          if (Boss.stateTimer <= 0) {
            if (move.isLeap) {
              /* 躍擊落地：砸地塵土＋震動；落點範圍內且在地面才命中（跳起可躲，空中按跳躍可踩頭） */
              Boss.x = Boss.leapLandX; Boss.y = Config.groundY;
              for (let k = -1; k <= 1; k++) emitDust(Boss.x + k * 70, Config.groundY, k || 1, 3, 1.0);
              if (Boss.stageId === 1 && fxReady("boss1")) { const lw = move.range * 2.8; spawnFx("boss1", 3, Boss.x, Config.groundY - lw * 0.26, { w: lw, dur: 0.5 }); landingFx(Boss.x, 1.7, 5); }
              if (move.fxLand && fxReady("land")) {
                const fl = move.fxLand === true ? 1 : move.fxLand;
                spawnFx("land", 0, Boss.x, Config.groundY + 22, { w: 760 * fl, h: 760 * fl, dur: 0.6, anchor: "b", alpha: 0.85 });
                spawnFx("land", 1, Boss.x, Config.groundY + 6, { w: 480 * fl, h: 480 * fl, dur: 1.0, anchor: "b", alpha: 0.7 });
                addTrauma(0.6 * fl);
              }
              triggerShake(Boss.facing, 0, 20, 0.25); Sound.play("peril", 0.6, 1.3);
              if (!Boss.hitRegistered && Player.state !== "execution" && Math.abs(Player.x - Boss.x) <= move.range && Player.y >= Config.groundY - 70) {
                Boss.hitRegistered = true;
                resolveBossStrike(move);
              }
            }
            Boss.state = "recover";
            Boss.stateTimer = move.recover * (Config.bossPhase === 2 ? 0.75 : 1.0);
            Boss.isPerilous = false;
            Boss.vx *= 0.2;
          }
          return;
        }

        if (Boss.state === "recover") {
          Boss.stateTimer -= dt;
          Boss.vx *= Math.pow(0.04, dt);
          if (Boss.stateTimer <= 0) {
            const mPrev = stage.moves[Boss.moveType];
            if (Boss.comboChain && Boss.comboChain.length > 0 && mPrev && mPrev.chainOnHit && !Boss.landedHit) Boss.comboChain = [];
            if (Boss.comboChain && Boss.comboChain.length > 0) {
              const next = Boss.comboChain.shift();
              triggerBossMove(next, Boss.comboChain);
            } else {
              Boss.state = "idle";
              Boss.aiCooldown = Config.bossPhase === 2 ? 0.32 : 0.60;
            }
          }
          return;
        }

        // Idle / Approach
        Boss.facing = Player.x >= Boss.x ? 1 : -1;
        Boss.aiCooldown -= dt;
        const dist = Math.abs(Player.x - Boss.x);
        if (stage.mirror) { mirrorAI(dt, dist); return; }
        if (stage.phaseSwitchMove && Config.bossPhase === 2 && stage.stanceByPhase && Boss.stance !== stage.stanceByPhase[2] && Boss.aiCooldown <= 0) { triggerBossMove(stage.phaseSwitchMove); return; } /* 拔劍被打斷時，下一個出招機會補播 */
        if (Boss._splitPending && Boss.aiCooldown <= 0 && stage.splitMove) { Boss._splitPending = false; triggerBossMove(stage.splitMove); return; }
        if (stage.stances && !stage.stanceByPhase && Boss.aiCooldown <= 0 && Boss.stanceCount >= ((Config.bossPhase === 2 && stage.switchEveryP2) || stage.switchEvery || 3)) {
          Boss.stanceCount = 0; triggerBossMove("stance_switch"); return;
        }
        const stn = stanceOf(stage);

        const hurtX = stn ? (stn.hurtHalf || 0) : 0;
        if (dist > 220 + hurtX) {
          Boss.state = "approach";
          Boss.vx = Boss.facing * ((stn && stn.speed) || (Config.bossPhase === 2 ? 320 : 260));
          /* v0.7.2 遠距招式：stage.farMoves（兩階段）＋ stage.farMovesP2（僅二階段），約每 0.5 秒一次機會 */
          const farBase = stn ? (stn.far || []) : (stage.farMoves || []);
          const farP2 = stn ? (stn.farP2 || []) : (stage.farMovesP2 || []);
          const farList = farBase.concat(Config.bossPhase === 2 ? farP2 : []).filter(k => stage.moves[k.split("+")[0]]);
          if (farList.length && Boss.aiCooldown <= 0 && Math.random() < dt * 2) {
            triggerMacro(farList[Math.floor(Math.random() * farList.length)]);
            return;
          }
          if (dist < 360 && Boss.aiCooldown <= 0 && Math.random() < 0.45) {
            triggerBossMove(stanceKey(stage, "thrust_peril"));
          }
          return;
        }

        Boss.vx *= Math.pow(0.08, dt);
        if (Boss.aiCooldown <= 0) {
          const r = Math.random();
          const moveKeys = Object.keys(stage.moves);
          const ultKey = moveKeys.find(k => stage.moves[k].ultimate);
          if (ultKey && Boss.ultCd <= 0 && Math.random() < 0.6) {
            triggerBossMove(ultKey);
          } else if (((stn && stn.rageMove) || stage.rageMove) && stage.moves[(stn && stn.rageMove) || stage.rageMove] && Boss.rage >= stage.maxHp * (stage.rageEvery || 0.18)) {
            Boss.rage = 0; triggerBossMove((stn && stn.rageMove) || stage.rageMove);
          } else if (!stn && stage.pool) {
            triggerMacro(pickFromPool(Config.bossPhase === 2 && stage.poolP2 ? stage.poolP2 : stage.pool, stage.moves));
          } else if (stn && stn.pool) {
            triggerMacro(pickFromPool(Config.bossPhase === 2 && stn.poolP2 ? stn.poolP2 : stn.pool, stage.moves)); /* v0.8.23 姿態池也支援 + 串接與標籤 */
          } else if (Config.bossPhase === 2) {
            const pool = moveKeys.filter(k => !stage.moves[k].ultimate);
            const pick = pool[Math.floor(Math.random() * pool.length)];
            triggerBossMove(pick);
          } else if (stage.p1Pool && stage.p1Pool.length) {
            /* v0.7.2 一階段權重池：[[招式key, 權重], ...] */
            const pp = stage.p1Pool.filter(e => stage.moves[e[0]]);
            let tot = 0; pp.forEach(e => tot += e[1]);
            let roll = Math.random() * tot, pk = pp[0][0];
            for (const e of pp) { roll -= e[1]; if (roll <= 0) { pk = e[0]; break; } }
            triggerBossMove(pk);
          } else {
            if (stage.moves.exclusive_aerial && Math.random() < 0.18) triggerBossMove("exclusive_aerial");
            else if (r < 0.45) triggerBossMove(moveKeys[0]);
            else if (r < 0.75) triggerBossMove("thrust_peril");
            else triggerBossMove("sweep_peril");
          }
        }

      }

      function updateHitParticles(dt) {
        for (let i = Game.hitFx.length - 1; i >= 0; i--) {
          const fx = Game.hitFx[i];
          fx.life -= dt;
          if (fx.type === "spark") {
            fx.x += fx.vx * dt;
            fx.y += fx.vy * dt;
            fx.vy += 520 * dt;
            fx.vx *= Math.pow(0.12, dt);
          } else if (fx.type === "dust") {
            fx.x += fx.vx * dt;
            fx.y += fx.vy * dt;
            fx.vx *= Math.pow(0.06, dt);
            fx.vy *= Math.pow(0.06, dt);
          }
          if (fx.life <= 0) Game.hitFx.splice(i, 1);
        }
        updateFx(dt);
      }
