      /* 心魔「適應」記錄：依玩家近期習慣挑招 */
      const Mirror = {
        atkStreak: 0, atkT: 0, dashTimes: [], farT: 0, nearT: 0, lastAct: null, healCd: 0, t: 0,
        reset() { this.atkStreak = 0; this.atkT = -9; this.dashTimes = []; this.farT = 0; this.nearT = 0; this.lastAct = null; this.healCd = 8; this.t = 0; },
        noteAttack() { if (this.t - this.atkT < 1.3) this.atkStreak++; else this.atkStreak = 1; this.atkT = this.t; this.lastAct = "attack"; },
        noteDash() { this.dashTimes.push(this.t); this.lastAct = "dash"; },
        noteCharge() { this.lastAct = "charge"; },
        noteParry() { this.lastAct = "parry"; },
        recentDashes() { this.dashTimes = this.dashTimes.filter(x => this.t - x < 6); return this.dashTimes.length; },
        tick(dt, dist) {
          this.t += dt;
          if (this.healCd > 0) this.healCd -= dt;
          if (this.t - this.atkT > 1.3) this.atkStreak = 0;
          this.farT = dist > 380 ? this.farT + dt : Math.max(0, this.farT - dt * 2);
          this.nearT = dist < 170 ? this.nearT + dt : Math.max(0, this.nearT - dt * 2);
        }
      };
      function bossMoveData() { const st = Stages[Boss.stageId]; return st && st.moves ? st.moves[Boss.moveType] : null; }
      function mirrorEchoMove() {
        return { attack: "slash_combo", dash: "dash_strike", charge: "heavy", parry: "sword_wave" }[Mirror.lastAct] || "slash_combo";
      }
      function mirrorPick(dist) {
        const r = Math.random();
        if (Boss.ultCd <= 0 && dist < 400 && r < 0.6) return "grab_peril";
        if (Mirror.atkStreak >= 5 && dist < 330) { Mirror.atkStreak = 0; return "counter_stance"; }
        if (Mirror.recentDashes() >= 3) { Mirror.dashTimes.length = 0; return "predict"; }
        if (Mirror.farT > 2.2) { Mirror.farT = 0; return "sword_wave"; }
        if (Mirror.nearT > 2.5 && dist < 220) { Mirror.nearT = 0; return "counter_stance"; }
        if (Boss.hp / Boss.maxHp < 0.6 && Mirror.healCd <= 0 && Math.random() < 0.3) { Mirror.healCd = 18; return "heal"; }
        if (dist > 300) return Math.random() < 0.5 ? "dash_strike" : (Math.random() < 0.5 ? "sword_wave" : null);
        if (Mirror.lastAct && Math.random() < 0.2) return mirrorEchoMove();
        const q = Math.random();
        return q < 0.45 ? "slash_combo" : q < 0.65 ? "dash_strike" : q < 0.9 ? "heavy" : "sword_wave";
      }
      function mirrorAI(dt, dist) {
        Mirror.tick(dt, dist);
        const p2 = Config.bossPhase === 2;
        if (dist > 230) { Boss.state = "approach"; Boss.vx = Boss.facing * (p2 ? 340 : 280); }
        else { Boss.state = "idle"; Boss.vx *= Math.pow(0.08, dt); }
        if (Boss.aiCooldown > 0) return;
        const pick = mirrorPick(dist);
        if (!pick) { Boss.aiCooldown = 0.25; return; }
        triggerBossMove(pick, p2 && pick !== "counter_stance" ? [mirrorEchoMove()] : []);
        if (pick === "counter_stance") {
          spawnFloatingText(Boss.x, Boss.y - 125, "【反制架式】停手！", "#f87171", 1.2);
          hintOnce("mirror_counter", "心魔架起反制：這時別攻擊，等它收架或拉開距離");
        } else if (pick === "predict") {
          spawnFloatingText(Boss.x, Boss.y - 125, "〔預判你的落點〕", "#c084fc", 1.1);
        }
      }
      /* 玩家攻擊命中反制架式：彈開並反擊 */
      function mirrorTryCounter() {
        const m = bossMoveData();
        if (!(m && m.isCounter && Boss.state === "active")) return false;
        Boss.flashFrames = 3;
        Sound.play("parry", 1.0, 0.9);
        triggerHitstop(6);
        triggerShake(Player.facing, -0.2, 22, 0.25);
        spawnSparks((Player.x + Boss.x) * 0.5, Boss.y - 62, "parry", Player.facing);
        spawnFloatingText(Boss.x, Boss.y - 125, "【彈開！】", "#f87171", 1.2);
        Player.vx = -Player.facing * 380;
        Player.stamina = Math.max(0, Player.stamina - 30);
        triggerBossMove("counter_slash");
        return true;
      }

/* v0.4.14 人物放大：Boss 招式的判定距離同步放大（aerial 的 range 為 0 不受影響） */
      Object.values(LegacyStages).forEach(st => {
        Object.values(st.moves || {}).forEach(m => { if (m && m.range) m.range = Math.round(m.range * CHAR_K); });
      });

      /* Mind Seals System (心印系統 - 5 Types, Max 2 Equipped) */
      const MindSeals = {
        wenxin: {
          id: "wenxin", name: "【問心印】", vol: 2,
          desc: "極限彈反：完美招架窗口縮至 90ms，但每次完美彈反削減 Boss 架勢 +100%（速破神技）。",
          effect: { parryWindowMod: 0.7, postureDmgMod: 2.0 }
        },
        tafeng: {
          id: "tafeng", name: "【踏風印】", vol: 2,
          desc: "靈活身法：瞬步與空中瞬身無敵時隙提升 50%，但普通格擋損耗雙倍劍勢。",
          effect: { invulnMod: 1.5, blockCostMod: 2.0 }
        },
        ningshen: {
          id: "ningshen", name: "【凝神印】", vol: 2,
          desc: "仙釀溫養：回生酒飲用硬直縮短 50%，恢復量提升至 600 氣血。",
          effect: { drinkTimeMod: 0.5, healAmount: 600 }
        },
        juemai: {
          id: "juemai", name: "【絕脈印】", vol: 2,
          desc: "逆境死戰：氣血低於 35% 時，墨塵青雲斬威力與破勢削韌提升 80%！",
          effect: { lowHpThreshold: 0.35, lowHpDmgMod: 1.8 }
        },
        bumie: {
          id: "bumie", name: "【不滅印】", vol: 2,
          desc: "太初護魂：太初玄天珠支援技能效果提升，【太初替身】無敵時隙延長至 3.5 秒。",
          effect: { tishenInvuln: 3.5 }
        }
      };

      const TestAll = { on: false };
      try { TestAll.on = localStorage.getItem("qingyun_testall") === "1"; } catch (e) { }
      function getClearedMax() { let v = 0; try { v = parseInt(localStorage.getItem("qingyun_cleared") || "0", 10) || 0; } catch (e) { } return Math.max(0, Math.min(9, v)); }
      function refreshUnlocked() { Progress.unlockedStages = TestAll.on ? 9 : Math.min(9, getClearedMax() + 1); }
      const Progress = {
        currentStage: 1,
        unlockedStages: 1, // 依進度解鎖；設定裡的「測試：全解鎖」可全開
        airDashUnlocked: true,
        equippedSeals: ["wenxin"],
        battleStartTime: 0,
        parryCount: 0,
        mikiriCount: 0,
        damageTaken: 0
      };
