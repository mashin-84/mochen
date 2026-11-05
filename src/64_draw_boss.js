          /* v0.7.1 Boss 精靈資料化：Stages[n].sprite = "boss1" 即讀 assets/boss1/（16 格標準 + walk_01..12 + 17~19 倒地）。
             沒有 sprite 的關卡退回程式繪製。可用 Stages[n].spriteScale / spriteStride 覆寫。 */
          const BOSS_FRAME_NAMES = [
            "01_idle1", "02_idle2", "03_walk1", "04_walk2",
            "05_walk3", "06_walk4", "07_windup", "08_windup_thrust",
            "09_slash", "10_slash_rec", "11_thrust", "12_thrust_rec",
            "13_sweep", "14_cast", "15_hurt", "16_stagger"
          ];
          const BossSprites = {};
          function opaqueH(img) {
            const c = document.createElement("canvas"); c.width = img.naturalWidth || 900; c.height = img.naturalHeight || 600;
            const g = c.getContext("2d"); g.drawImage(img, 0, 0);
            const d = g.getImageData(0, 0, c.width, c.height).data;
            let top = -1, bot = -1;
            for (let y = 0; y < c.height; y++) {
              let hit = false;
              for (let x = 0; x < c.width; x += 2) { if (d[(y * c.width + x) * 4 + 3] > 40) { hit = true; break; } }
              if (hit) { if (top < 0) top = y; bot = y; }
            }
            return top < 0 ? 0 : bot - top + 1;
          }
          function getWalkNorm(SP) {
            if (SP.walkNorm) return SP.walkNorm;
            let k = 1;
            try {
              const idleH = opaqueH(SP.imgs["01_idle1"]);
              let sum = 0; SP.walk.forEach(im => { sum += opaqueH(im); });
              const mean = sum / SP.walk.length;
              if (idleH > 0 && mean > 0) k = Math.max(0.9, Math.min(1.3, idleH / mean));
            } catch (e) { k = 1; }
            SP.walkNorm = k;
            return k;
          }
          function getBossSprite(key, extras) {
            if (!key) return null;
            if (BossSprites[key]) {
              const sp0 = BossSprites[key];
              (extras || []).forEach(n => { if (!sp0.imgs[n]) { const im = new Image(); im.src = "assets/" + key + "/" + n + ".webp"; sp0.imgs[n] = im; } });
              return sp0;
            }
            const dir = "assets/" + key + "/";
            const sp = { key, imgs: {}, ready: 0, walk: [], walkReady: 0, phase: 0, lastX: null,
              death: { kneel: { ok: false, img: new Image() }, fall: { ok: false, img: new Image() }, lie: { ok: false, img: new Image() } } };
            BOSS_FRAME_NAMES.forEach(name => {
              const img = new Image();
              img.onload = () => { sp.ready++; };
              img.onerror = () => { console.warn("Failed to load: " + dir + name); };
              img.src = dir + name + ".webp";
              sp.imgs[name] = img;
            });
            [["kneel", "17_kneel"], ["fall", "18_fall"], ["lie", "19_lie"]].forEach(([k, f]) => {
              const d = sp.death[k];
              d.img.onload = () => { d.ok = true; };
              d.img.src = dir + f + ".webp";
            });
            for (let i = 1; i <= 12; i++) {
              const img = new Image();
              img.onload = () => { sp.walkReady++; };
              img.src = dir + "walk_" + String(i).padStart(2, "0") + ".webp";
              sp.walk.push(img);
            }
            (extras || []).forEach(n => { const im = new Image(); im.src = dir + n + ".webp"; sp.imgs[n] = im; });
            BossSprites[key] = sp;
            return sp;
          }

                function drawBossEntity() {
        ctx.save();
        const bx = Boss.x - Boss.w * 0.5;
        const by = Boss.y - Boss.h;

        // Ground shadow（有 sprite 的 Boss 在下面改畫輪廓投影；沒有的畫橢圓）
        const bossEllipse = () => {
          ctx.fillStyle = `rgba(0, 0, 0, ${0.55 * (Game.cine ? Math.max(0, Math.min(1, (Boss.y + 200) / (Config.groundY + 200))) : 1)})`;
          ctx.beginPath();
          ctx.ellipse(Boss.x, Config.groundY + 3, Boss.w * 0.65, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        };

        // Phase 2 Flaming Aura Particles
        for (const ap of Boss.auraParticles) {
          ctx.fillStyle = Boss.artId >= 11 ? "rgba(245, 158, 11, 0.6)" : Boss.artId >= 6 ? "rgba(168, 85, 247, 0.55)" : "rgba(239, 68, 68, 0.55)";
          ctx.beginPath();
          ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
          ctx.fill();
        }

        const stage = Stages[Boss.stageId];
        const bodyType = stage.bodyType || "human";
        const moveData = stage.moves[Boss.moveType];
        const anim = moveData ? (moveData.anim || "slash") : "slash";
        const isAction = Boss.state === "windup" || Boss.state === "active";
        const actionP = isAction ? (1 - Boss.stateTimer / (Boss.stateDur || 1)) : 0;
        const stnD = stanceOf(stage);
        const SP = getBossSprite(stnD ? stnD.sprite : stage.sprite);
        const useBossSprite = !!(SP && SP.ready === 16);
        if (!useBossSprite) bossEllipse();
        
        // C5: 前搖動作後傾 (狼王改為下壓蹲伏，其餘保持旋轉後傾)
        ctx.save();
        let leanAngle = 0;
        let crouchY = 0;
        let windupP = 0;
        let globalA = 1.0;
        if (Boss.state === "windup") {
            windupP = 1 - (Boss.stateTimer / (Boss.stateDur || 1));
        } else if (Boss.state === "active") {
            const ap = 1 - (Boss.stateTimer / (Boss.stateDur || 1));
            if (ap < 0.15) windupP = 1 - ap / 0.15;
        }

        if (bodyType === "beast") {
            crouchY = windupP * 25; // 身體下壓
        } else if (anim === "thrust") {
            crouchY = windupP * 12;
            leanAngle = Boss.facing * windupP * 0.2; // 身體前傾壓低
        } else {
            leanAngle = -Boss.facing * windupP * 0.25;
        }

        if (useBossSprite || (stage.mirror && MC_READY === 16)) {
            leanAngle = 0;
            crouchY = 0;
        }

        if (anim === "vanish") {
            if (Boss.state === "windup") globalA = Math.max(0, 1 - windupP * 1.5);
            else if (Boss.state === "active") globalA = 1.0;
            
            if (Boss.artId === 8) {
                ctx.fillStyle = "#f472b6";
                let scatter = 0;
                if (Boss.state === "windup") scatter = windupP * 80;
                else if (Boss.state === "active") scatter = Math.max(0, 80 - (1 - actionP) * 160);
                if (scatter > 0) {
                    for(let i=0; i<12; i++) {
                        ctx.beginPath();
                        ctx.arc(Boss.x + Math.cos(i)*scatter, Boss.y - 60 + Math.sin(i)*scatter, 4, 0, Math.PI*2);
                        ctx.fill();
                    }
                }
            } else if (Boss.artId === 13) {
                if (Boss.state === "windup" && windupP > 0) {
                    ctx.save();
                    ctx.strokeStyle = "#c084fc";
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = windupP;
                    ctx.beginPath();
                    ctx.moveTo(Boss.x - 20, Boss.y - 100);
                    ctx.lineTo(Boss.x + 10, Boss.y - 70);
                    ctx.lineTo(Boss.x - 15, Boss.y - 40);
                    ctx.lineTo(Boss.x + 20, Boss.y - 10);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
        ctx.globalAlpha = globalA;

        ctx.translate(Boss.x, Boss.y + crouchY);
        ctx.rotate(leanAngle);
        ctx.translate(-Boss.x, -(Boss.y + crouchY));

        const isFlashing = Boss.flashFrames > 0;
        let bodyColor = "#991b1b";
        let strokeColor = "#f87171";

        if (isFlashing) {
          bodyColor = "#ffffff";
          strokeColor = "#ffffff";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 22;
        } else if (Boss.state === "frozen") {
          bodyColor = "#1e3a8a";
          strokeColor = "#60a5fa";
          ctx.shadowColor = "#60a5fa";
          ctx.shadowBlur = 18;
        } else if (Boss.state === "staggered") {
          bodyColor = "#7f1d1d";
          strokeColor = "#fde047";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 20;
        } else {
          // Volume-based & archetype-based palette
          if (Boss.artId <= 5) {
            bodyColor = Config.bossPhase === 2 ? "#7f1d1d" : "#991b1b";
            strokeColor = Config.bossPhase === 2 ? "#fca5a5" : "#f87171";
          } else if (Boss.artId <= 10) {
            bodyColor = Config.bossPhase === 2 ? "#581c87" : "#4a044e";
            strokeColor = Config.bossPhase === 2 ? "#d8b4fe" : "#c084fc";
          } else {
            bodyColor = Config.bossPhase === 2 ? "#78350f" : "#451a03";
            strokeColor = Config.bossPhase === 2 ? "#fef08a" : "#f59e0b";
          }
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = Config.bossPhase === 2 ? 18 : 12;
        }

        if (stage.mirror && MC_READY === 16) {
          let f = "01_idle1", img = null;
          const mt = Boss.moveType, st = Boss.state;
          const heavyLike = (mt === "heavy" || mt === "grab_peril");
          if (st === "hurt" || st === "staggered" || st === "frozen") f = "16_hurt";
          else if (st === "windup" || st === "active" || (st === "recover" && Boss.moveType)) {
            if (mt === "counter_stance") f = "13_parry";
            else if (mt === "heal") f = "15_drink";
            else if (mt === "dash_strike") f = st === "windup" ? "01_idle1" : st === "active" ? "14_dash" : "11_thrust";
            else if (heavyLike) f = st === "windup" ? "12_charge" : st === "active" ? "11_thrust" : "10_slash2";
            else if (mt === "predict") f = st === "windup" ? "14_dash" : "09_slash1";
            else if (mt === "slash_combo") f = (st === "active" && Boss.comboHitsLeft % 2 === 0) ? "10_slash2" : "09_slash1";
            else f = st === "windup" ? "09_slash1" : "10_slash2";
          } else if (st === "approach" || (st === "idle" && Math.abs(Boss.vx) > 40)) {
            let ddx = Boss.mx === undefined ? 0 : Math.abs(Boss.x - Boss.mx); if (ddx > 60) ddx = 0;
            Boss.mph = ((Boss.mph || 0) + ddx / 238) % 1;
            if (MCR_READY === 10) img = MCR_IMGS[Math.floor(Boss.mph * 10) % 10];
            else f = ["03_run1", "04_run2", "05_run3", "06_run4"][Math.floor(performance.now() / 110) % 4];
          } else f = Math.floor(performance.now() / 600) % 2 === 0 ? "01_idle1" : "02_idle2";
          Boss.mx = Boss.x;
          if (!img) img = MC_IMGS[f];
          let a = 1;
          if (Game.bossDeath && performance.now() >= Game.bossDeath.start) {
            const bd = Game.bossDeath;
            img = MC_IMGS["16_hurt"];
            if (bd.out) a = Math.max(0, 1 - (performance.now() - bd.t0) / 1500);
          }
          ctx.save();
          ctx.globalAlpha = a;
          if (Boss.flashFrames > 0) ctx.filter = "brightness(2.5)";
          else ctx.filter = "brightness(0.5) contrast(1.15) drop-shadow(0 0 12px rgba(220,38,38,0.95))";
          ctx.translate(Boss.x, Boss.y + GROUND_SINK);
          const hrM = Boss.hitReactT > 0 ? Boss.hitReactT / (Boss.hitReactDur || 0.14) : 0;
          if (hrM > 0) ctx.rotate(-Boss.facing * 0.045 * hrM * hrM);
          const SM = MC_SCALE * (MC_FRAME_SCALE[f] || 1) * (stage.size || 1);
          ctx.scale(Boss.facing > 0 ? SM : -SM, SM);
          ctx.drawImage(img, -450, -529);
          ctx.filter = "none";
          ctx.restore();
        } else if (useBossSprite) {
          let dx = SP.lastX === null ? 0 : Math.abs(Boss.x - SP.lastX);
          if (dx > 60) dx = 0;
          SP.lastX = Boss.x;

          let imgKey = "01_idle1";
          let bossImg = null;
          let isWalkFrame = false;
          if (Boss.state === "hurt") {
            imgKey = "15_hurt";
          } else if (Boss.state === "staggered" || Boss.state === "frozen") {
            imgKey = "16_stagger";
          } else if (Boss.state === "windup") {
            if (Boss.moveType === "thrust_peril" || Boss.moveType === "exclusive_combo" || Boss.moveType === "charge_rush") imgKey = "08_windup_thrust";
            else if (Boss.moveType === "grab_peril") imgKey = "14_cast";
            else imgKey = "07_windup";
          } else if (Boss.state === "active") {
            if (Boss.moveType === "thrust_peril" || Boss.moveType === "exclusive_combo" || Boss.moveType === "charge_rush") imgKey = "11_thrust";
            else if (Boss.moveType === "sweep_peril") imgKey = "13_sweep";
            else if (Boss.moveType === "grab_peril") imgKey = "14_cast";
            else imgKey = "09_slash";
          } else if (Boss.state === "recover") {
            if (Boss.moveType === "thrust_peril" || Boss.moveType === "exclusive_combo" || Boss.moveType === "charge_rush") imgKey = "12_thrust_rec";
            else if (Boss.moveType === "grab_peril") imgKey = "14_cast";
            else imgKey = "10_slash_rec";
          } else if (Boss.state === "approach" || (Boss.state === "idle" && Math.abs(Boss.vx) > 40)) {
            SP.phase += dx / ((stnD && stnD.stride) || stage.spriteStride || 238);
            SP.phase %= 1;
            if (stnD && stnD.walkSeq) {
              /* v0.7.6 姿態可指定用動作表內的格子循環走路（影片抽幀畫風和動作表差太多時用） */
              imgKey = stnD.walkSeq[Math.floor(SP.phase * stnD.walkSeq.length) % stnD.walkSeq.length];
            } else if (SP.walkReady === 12) {
              bossImg = SP.walk[Math.floor(SP.phase * 12) % 12];
              isWalkFrame = true;
            } else {
              const walkIdx = Math.floor(performance.now() / 140) % 4;
              imgKey = ["03_walk1", "04_walk2", "05_walk3", "06_walk4"][walkIdx];
            }
          } else {
            imgKey = Math.floor(performance.now() / 700) % 2 === 0 ? "01_idle1" : "02_idle2";
          }
          if (moveData && moveData.pose && (Boss.state === "windup" || Boss.state === "active" || Boss.state === "recover")) {
            const PZ = { thrust: ["08_windup_thrust", "11_thrust", "12_thrust_rec"], sweep: ["07_windup", "13_sweep", "10_slash_rec"] }[moveData.pose];
            if (PZ) imgKey = PZ[Boss.state === "windup" ? 0 : Boss.state === "active" ? 1 : 2];
          }
          if (moveData && moveData.frames && moveData.frames[Boss.state]) {
            let fr = moveData.frames[Boss.state];
            if (Array.isArray(fr)) { /* v0.8.30 關鍵格序列：同一階段依進度平均切換多張圖 */
              let pr = 0;
              if (Boss.state === "recover") pr = 1 - Boss.stateTimer / Math.max(0.05, (moveData.recover || 0.5) * (Config.bossPhase === 2 ? 0.75 : 1));
              else pr = 1 - Boss.stateTimer / (Boss.stateDur || 1);
              fr = fr[Math.min(fr.length - 1, Math.max(0, Math.floor(pr * fr.length)))];
            }
            imgKey = fr;
          }
          if (moveData && moveData.isLeap && Boss.state === "active" && !(moveData.frames && moveData.frames.active)) imgKey = (1 - Boss.stateTimer / (Boss.stateDur || 1)) < 0.5 ? "07_windup" : "09_slash";
          if (stnD && stnD.remap && stnD.remap[imgKey]) imgKey = stnD.remap[imgKey]; /* 動作表某格畫壞時改用別格 */
          const hrP = Boss.hitReactT > 0 ? Boss.hitReactT / (Boss.hitReactDur || 0.14) : 0;
          if (hrP > 0.4 && Boss.hitReactKind !== "block" && (Boss.state === "idle" || Boss.state === "approach" || Boss.state === "recover")) {
            imgKey = "15_hurt";
            bossImg = null;
          }
          let deathRot = 0, deathAlpha = 1;
          if (Game.bossDeath && performance.now() >= Game.bossDeath.start) {
            const bd = Game.bossDeath;
            bossImg = null;
            imgKey = "16_stagger";
            if (!bd.out) {
              if (SP.death.kneel.ok) bossImg = SP.death.kneel.img;
            } else {
              const e = (performance.now() - bd.t0) / 1000;
              if (e < 0.5) {
                if (SP.death.fall.ok) bossImg = SP.death.fall.img; else deathRot = (e / 0.5) * 1.45;
              } else {
                if (SP.death.lie.ok) bossImg = SP.death.lie.img; else deathRot = 1.45;
                if (e >= 1.2) deathAlpha = Math.max(0, 1 - (e - 1.2) / 0.8);
              }
            }
          }
          if (Boss._cineImg) { imgKey = Boss._cineImg; bossImg = null; isWalkFrame = false; }
          if (!bossImg) bossImg = SP.imgs[imgKey];
          {
            let sk = bossVis(stage).k;
            if (isWalkFrame && bossImg !== SP.imgs[imgKey]) sk *= getWalkNorm(SP);
            const cineK = Game.cine ? Math.max(0, Math.min(1, (Boss.y + 200) / (Config.groundY + 200))) : 1;
            if (deathRot || !drawSpriteShadow(bossImg, Boss.x, 560, sk, Boss.facing, Config.groundY - Boss.y, cineK)) bossEllipse();
          }

          ctx.save();
          if (deathAlpha < 1) ctx.globalAlpha = deathAlpha;
          if (Boss.flashFrames > 0) ctx.filter = "brightness(2.5)";
          else if (Boss.state === "frozen") ctx.filter = "hue-rotate(160deg) brightness(1.1)";
          else if (Boss.isPerilous) ctx.filter = "drop-shadow(0 0 10px #ef4444)";

          ctx.translate(Boss.x, Boss.y + GROUND_SINK);
          if (deathRot) ctx.rotate(-Boss.facing * deathRot);
          const dfm = deathRot ? null : bossDeform(moveData);
          if (dfm) { ctx.translate(Boss.facing * dfm.ox, dfm.oy); ctx.rotate(Boss.facing * dfm.rot); ctx.scale(dfm.sx, dfm.sy); }
          if (hrP > 0) {
            const a = hrP * hrP;
            const lean = Boss.hitReactKind === "heavy" ? 0.07 : Boss.hitReactKind === "block" ? 0.025 : 0.045;
            ctx.rotate(-Boss.facing * lean * a);
            ctx.scale(1 + 0.04 * a, 1 - 0.04 * a);
          }
          let bossK = bossVis(stage).k;
          if (isWalkFrame && bossImg !== SP.imgs[imgKey]) bossK *= getWalkNorm(SP); /* 影片抽幀的走路圖人比動作表小，依不透明高度校正 */
          ctx.scale(Boss.facing > 0 ? bossK : -bossK, bossK);
          if (dfm && dfm.ghost > 0) { /* 殘影：沿身後依序淡出（不套用外光濾鏡，省效能） */
            const keepF = ctx.filter, keepA = ctx.globalAlpha; ctx.filter = "none";
            for (let gi = dfm.ghost; gi >= 1; gi--) {
              ctx.globalAlpha = keepA * 0.34 * (1 - gi / (dfm.ghost + 1.2));
              ctx.drawImage(bossImg, -450 - (dfm.gap * gi) / bossK, -560);
            }
            ctx.globalAlpha = keepA; ctx.filter = keepF;
          }
          ctx.drawImage(bossImg, -450, -560);
          
          ctx.filter = "none";
          ctx.restore();
        } else {
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;

        // Distinct Archetype Silhouettes
        
        let pounceOffsetY = 0, pounceOffsetX = 0;
        if (bodyType === "beast" && anim === "pounce" && Boss.state === "active") {
          pounceOffsetY = -Math.sin(actionP * Math.PI) * 50;
          pounceOffsetX = Boss.facing * Math.sin(actionP * Math.PI) * 40;
        }
        
        if (bodyType === "beast") {
          const bW = Boss.w + 40, bH = Boss.h - 40;
          ctx.fillRect(bx - 20 + pounceOffsetX, by + 40 + pounceOffsetY, bW, bH);
          ctx.strokeRect(bx - 20 + pounceOffsetX, by + 40 + pounceOffsetY, bW, bH);
          for (let i of [-15, 15]) {
            const isFrontLeg = (Boss.facing > 0 && i > 0) || (Boss.facing < 0 && i < 0);
            const legHeight = Math.max(5, 20 - (isFrontLeg ? crouchY : crouchY * 0.3));
            ctx.fillRect(Boss.x + i + pounceOffsetX, by + 40 + bH + pounceOffsetY, 8, legHeight);
          }
          ctx.beginPath();
          ctx.moveTo(Boss.x - Boss.facing * (bW / 2) + pounceOffsetX, by + 50 + pounceOffsetY);
          ctx.lineTo(Boss.x - Boss.facing * (bW / 2 + 30) + pounceOffsetX, by + 20 + pounceOffsetY);
          ctx.stroke();
          let headExt = 35;
          let jawOpen = 0;
          if (anim === "bite" && Boss.state === "active") {
             headExt += Math.sin(actionP * Math.PI) * 20;
             jawOpen = Math.sin(actionP * Math.PI) * 15;
          }
          const hX = Boss.facing > 0 ? Boss.x + headExt : Boss.x - headExt - 25;
          ctx.fillRect(hX + pounceOffsetX, by + 45 + pounceOffsetY - jawOpen, 25, 15);
          ctx.fillRect(hX + pounceOffsetX, by + 45 + pounceOffsetY + jawOpen, 25, 12);
        } else if (bodyType === "spirit") {
          const floatY = by + Math.sin(performance.now() * 0.003) * 15;
          let yOffset = 0;
          if (Boss.artId === 12 && anim === "slam" && Boss.state === "active") {
              yOffset = 40 * actionP; // 身體下沉
          }
          const grad = ctx.createLinearGradient(0, floatY + yOffset, 0, floatY + yOffset + Boss.h);
          grad.addColorStop(0, bodyColor);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.fillRect(bx, floatY + yOffset, Boss.w, Boss.h);
          ctx.strokeRect(bx, floatY + yOffset, Boss.w, Boss.h);
          if (Boss.artId === 7) {
            let wingExt = 35;
            if (anim === "slam") {
                if (Boss.state === "windup") wingExt = 35 + windupP * 45;
                else if (Boss.state === "active") wingExt = 80;
            }
            ctx.beginPath();
            ctx.moveTo(Boss.x - wingExt, floatY + 20);
            ctx.lineTo(Boss.x, floatY + 45);
            ctx.lineTo(Boss.x + wingExt, floatY + 20);
            ctx.stroke();
          }
          if (Boss.artId === 12 && anim === "slam" && Boss.state === "active") {
              ctx.save();
              ctx.fillStyle = "rgba(125, 211, 252, 0.6)";
              ctx.fillRect(Boss.x - 150 * actionP, Config.groundY - 10, 300 * actionP, 10);
              ctx.restore();
          }
          if (anim === "cast" && Boss.state === "active") {
            ctx.strokeStyle = strokeColor;
            ctx.beginPath();
            ctx.arc(Boss.x + Boss.facing * 40, floatY + yOffset + 40, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(Boss.x + Boss.facing * 40, floatY + yOffset + 40, 15, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (bodyType === "eye") {
          const eyeY = Boss.y - Boss.h * 0.5 - 60 + Math.sin(performance.now() * 0.002) * 20;
          ctx.beginPath();
          ctx.ellipse(Boss.x, eyeY, Boss.w, Boss.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          const trackX = Math.max(-15, Math.min(15, Player.x - Boss.x));
          const trackY = Math.max(-10, Math.min(10, Player.y - eyeY));
          let pupilSize = 15;
          if (isAction && Boss.moveType === "exclusive_feint") {
            if (Boss.state === "windup") pupilSize = 15 - 12 * windupP;
            else if (Boss.state === "active") {
                pupilSize = 3 + 12 * actionP;
                ctx.save();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 4 * (1 - actionP);
                ctx.beginPath();
                ctx.arc(Boss.x, eyeY, 150 * actionP, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
          } else if (isAction && actionP < 0.5) {
            pupilSize = 5 + 10 * (1 - actionP * 2);
          }
          
          if (anim === "cast" && Boss.state === "windup") {
            ctx.save();
            ctx.fillStyle = "rgba(192, 132, 252, 0.4)";
            for(let i=-1; i<=1; i++) {
                ctx.fillRect(Boss.x + i*100 - 15, eyeY - 200, 30, 200 * windupP);
            }
            ctx.restore();
          }

          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(Boss.x + trackX, eyeY + trackY, pupilSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(bx, by, Boss.w, Boss.h);
          ctx.strokeRect(bx, by, Boss.w, Boss.h);
        }

        // Eyes / Visor
        if (!isFlashing && bodyType === "human") {
          ctx.fillStyle = Config.bossPhase === 2 ? "#ef4444" : "#fef08a";
          const eyeX = Boss.facing > 0 ? Boss.x + 10 : Boss.x - 22;
          ctx.fillRect(eyeX, by + 20, 12, 5);
        }

        // Distinct Boss Weapons & Attack Pose
        if (bodyType === "human" || bodyType === "spirit") {
          ctx.save();
          let gripX = Boss.x + Boss.facing * 18;
          let gripY = Boss.y - 64;
          
          if (anim === "overhead" && (Boss.state === "windup" || Boss.feintPauseTimer > 0)) {
            gripX = Boss.x;
            gripY = Boss.y - 95;
          } else if (anim === "slam" && Boss.state === "active") {
            gripY = Boss.y - 15;
          }
          
          ctx.translate(gripX, gripY);
          let angle = Boss.facing > 0 ? 0.35 : Math.PI - 0.35;
          
          if (anim === "thrust") {
            if (Boss.state === "windup") angle = Boss.facing > 0 ? 0 : Math.PI;
            else if (Boss.state === "active") angle = Boss.facing > 0 ? 0.1 : Math.PI - 0.1;
          } else if (anim === "overhead") {
            if (Boss.state === "windup" || Boss.feintPauseTimer > 0) angle = Boss.facing > 0 ? -1.5 : Math.PI + 1.5;
            else if (Boss.state === "active") angle = Boss.facing > 0 ? 1.0 : Math.PI - 1.0;
          } else if (anim === "slam") {
            if (Boss.state === "windup") angle = Boss.facing > 0 ? -1.2 : Math.PI + 1.2;
            else if (Boss.state === "active") angle = Boss.facing > 0 ? 1.3 : Math.PI - 1.3;
          } else if (anim === "fan") {
            if (Boss.state === "windup") angle = Boss.facing > 0 ? -1.0 : Math.PI + 1.0;
            else if (Boss.state === "active") angle = Boss.facing > 0 ? 0.2 : Math.PI - 0.2;
          } else if (anim === "spin") {
            if (Boss.state === "windup") angle = Boss.facing > 0 ? -1.0 : Math.PI + 1.0;
            else if (Boss.state === "active") angle = (performance.now() * 0.015) % (Math.PI * 2);
          } else if (Boss.artId === 14 && Boss.moveType === "exclusive_combo" && Boss.state === "active") {
            if (Boss.comboHitsLeft === 2) angle = Boss.facing > 0 ? -1.0 : Math.PI + 1.0;
            else if (Boss.comboHitsLeft === 1) angle = Boss.facing > 0 ? 0 : Math.PI;
            else angle = Boss.facing > 0 ? 1.0 : Math.PI - 1.0;
          } else {
            if (Boss.state === "windup") {
              angle = Boss.facing > 0 ? -1.18 : Math.PI + 1.18;
            } else if (Boss.state === "active") {
              const p = 1 - (Boss.stateTimer / (Boss.stateDur || 1));
              angle = Boss.facing > 0 ? (-1.18 + p * 2.1) : (Math.PI + 1.18 - p * 2.1);
            }
          }
          ctx.rotate(angle);

          ctx.fillStyle = isFlashing ? "#ffffff" : Boss.isPerilous ? "#ef4444" : strokeColor;

          if (anim === "cast" || (anim === "slam" && Boss.artId === 7)) {
            ctx.fillRect(5, -5, 12, 10);
            ctx.fillRect(15, 10, 12, 10);
            if (Boss.artId === 5 && (Boss.state === "windup" || Boss.state === "active")) {
              ctx.save();
              ctx.rotate(-angle);
              for (let i = 0; i < 5; i++) {
                ctx.fillStyle = "#38bdf8";
                let swordX = -Boss.facing * 40;
                if (Boss.state === "active") {
                   const elapsed = (Boss.stateDur || 1) - Boss.stateTimer;
                   const delay = i * 0.08;
                   if (elapsed > delay) {
                       swordX += Boss.facing * (elapsed - delay) * 1500;
                   }
                }
                ctx.fillRect(swordX, -35 + i * 18, 30, 4);
              }
              ctx.restore();
            }
            if (Boss.artId === 9 && Boss.state === "windup") {
              ctx.save();
              ctx.rotate(-angle);
              ctx.fillStyle = "#ef4444";
              ctx.beginPath();
              ctx.arc(Boss.facing * 40, 0, 10 + windupP * 15, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          } else if (anim === "dual" || Boss.artId === 3) {
            if (Boss.feintPauseTimer > 0) {
              ctx.save();
              ctx.rotate(Math.PI / 4);
              ctx.fillRect(-15, -4, 50, 8);
              ctx.rotate(-Math.PI / 2);
              ctx.fillRect(-15, -4, 50, 8);
              ctx.restore();
            } else if (Boss.state === "active" && Boss.comboHitsLeft % 2 === 1) {
              ctx.fillRect(0, -5, 65, 8);
            } else {
              ctx.fillRect(10, 8, 55, 7);
              ctx.fillRect(0, -5, 65, 8);
            }
          } else if (Boss.artId === 4) {
            ctx.fillRect(0, -10, 140, 20);
            if (anim === "slam" && Boss.state === "active") {
              ctx.save();
              ctx.rotate(-angle);
              ctx.strokeStyle = "#f87171";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(10, Config.groundY - gripY);
              ctx.lineTo(40, Config.groundY - gripY + 8);
              ctx.lineTo(-20, Config.groundY - gripY - 6);
              ctx.stroke();
              ctx.restore();
            }
          } else if (Boss.artId === 10) {
            ctx.fillRect(anim === "spin" ? -50 : 0, -6, 115, 12);
            if (anim === "spin" && Boss.state === "active") {
                ctx.save();
                ctx.fillStyle = "rgba(168, 85, 247, 0.4)";
                ctx.rotate(0.5); ctx.fillRect(-50, -6, 115, 12);
                ctx.rotate(0.5); ctx.fillRect(-50, -6, 115, 12);
                ctx.restore();
            }
          } else if (Boss.artId === 11) {
            ctx.save();
            ctx.fillStyle = strokeColor;
            if (anim === "overhead" && (Boss.state === "windup" || Boss.feintPauseTimer > 0)) {
                ctx.rotate(-Math.PI/2);
                ctx.fillRect(10, -15, 80, 14);
                ctx.fillRect(10, 5, 80, 14);
            } else {
                ctx.fillRect(0, -15, 90, 14);
                ctx.fillRect(10, 5, 90, 14);
            }
            ctx.restore();
          } else if (Boss.artId === 14) {
            if (Boss.moveType === "exclusive_combo" && Boss.state === "active") {
                 if (Boss.comboHitsLeft === 2) angle = Boss.facing > 0 ? -1.0 : Math.PI + 1.0;
                 else if (Boss.comboHitsLeft === 1) angle = Boss.facing > 0 ? 0 : Math.PI;
                 else angle = Boss.facing > 0 ? 1.0 : Math.PI - 1.0;
                 ctx.save();
                 ctx.rotate(angle);
                 ctx.fillRect(0, -6, 115, 12);
                 ctx.restore();
            } else {
                 ctx.fillRect(0, -6, 115, 12);
            }
          } else if (anim === "fan" || anim === "ribbon" || Boss.artId === 2 || Boss.artId === 8) {
            if (anim === "ribbon") {
              ctx.beginPath();
              if (Boss.state === "active") {
                  ctx.moveTo(0,0);
                  ctx.quadraticCurveTo(40, -30, 80, 0);
                  ctx.quadraticCurveTo(100, 30, 120, -10);
              } else {
                  ctx.moveTo(0,0);
                  ctx.quadraticCurveTo(30, 10, 60, -5);
              }
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = 4;
              ctx.stroke();
            } else {
              ctx.beginPath();
              if (Boss.state === "active") ctx.arc(32, 0, 48, -0.9, 0.9);
              else ctx.arc(32, 0, 38, -0.6, 0.6);
              ctx.lineTo(0, 0);
              ctx.closePath();
              ctx.fill();
            }
              } else {
                if (anim === "thrust" && Boss.state === "active") {
                  const ext = Math.sin(actionP * Math.PI) * 45;
                  ctx.fillRect(ext, -6, 115, 12);
                } else {
                  ctx.fillRect(0, -6, 115, 12);
                }
              }
              ctx.restore();
            }
            } // 結束 if (useBossSprite) else
            ctx.restore(); // 結束後傾變換

        // C4: 提示畫面 (強/弱)
        if (Boss.nextImpactIn > 0 && Boss.nextImpactIn <= 0.35 && Config.parryCueLevel > 0) {
            const isStrong = Config.parryCueLevel === 2;
            const isPeril = Boss.isPerilous;
            const cueColor = isPeril ? "#ef4444" : "#fde047";
            const cueX = Boss.x;
            const cueY = Boss.y - Boss.h * 0.5; /* v0.8.10 以身體中心為圓心 */

            ctx.save();
            ctx.translate(cueX, cueY);
            
            if (isStrong) {
                const progress = 1 - (Boss.nextImpactIn / 0.35);
                const radius = 120 - (120 - 30) * progress;
                ctx.strokeStyle = cueColor;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            if (Boss.nextImpactIn <= 0.18 && Boss.nextImpactIn > 0.06) {
                const starScale = Math.sin(((0.18 - Boss.nextImpactIn) / 0.12) * Math.PI);
                ctx.fillStyle = cueColor;
                ctx.shadowColor = cueColor;
                ctx.shadowBlur = 10;
                ctx.scale(starScale, starScale);
                ctx.beginPath();
                ctx.moveTo(0, -46); ctx.lineTo(5, -5);
                ctx.lineTo(46, 0); ctx.lineTo(5, 5);
                ctx.lineTo(0, 46); ctx.lineTo(-5, 5);
                ctx.lineTo(-46, 0); ctx.lineTo(-5, -5);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // Perilous "危" Kanji Warning
        if (Boss.isPerilous && (Boss.state === "windup" || Boss.state === "active")) {
          const pulse = 1 + Math.sin(performance.now() * 0.025) * 0.12;
          ctx.save();
          ctx.translate(Boss.x, by - 48);
          ctx.scale(pulse, pulse);
          ctx.font = "900 44px var(--font-serif)";
          ctx.textAlign = "center";
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 18;
          ctx.fillText("危", 0, 0);

          ctx.restore();
        }

        // Posture-broken Deathblow Reticle "決"
        if (Boss.state === "staggered") {
          const pulse = 1 + Math.sin(performance.now() * 0.02) * 0.14;
          ctx.save();
          ctx.translate(Boss.x, Boss.y - Boss.h * 0.55);
          ctx.scale(pulse, pulse);
          ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
          ctx.strokeStyle = "#fde047";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = "900 20px var(--font-serif)";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("決", 0, 1);
          ctx.restore();
        }

        ctx.restore();
      }

      const MC_NAMES = [
        "01_idle1", "02_idle2", "03_run1", "04_run2",
        "05_run3", "06_run4", "07_jump", "08_fall",
        "09_slash1", "10_slash2", "11_thrust", "12_charge",
        "13_parry", "14_dash", "15_drink", "16_hurt"
      ];
      const MC_IMGS = {};
      let MC_READY = 0;
      const MC_SCALE = 0.506;
      const MC_FRAME_SCALE = { "11_thrust": 1.12 };

      MC_NAMES.forEach(name => {
        const img = new Image();
        img.onload = () => { MC_READY++; };
        img.onerror = () => { console.warn("Failed to load: " + name); };
        img.src = 'assets/mc/' + name + '.webp';
        MC_IMGS[name] = img;
      });

      /* M2 主角攻擊關鍵格：每一刀「預備 a → 出刀 b → 收招 c」三拍（v0.8.45 生圖，900×560、腳底 y=529、x=450） */
      const MC_ATK = { 1: ["20_s1a", "21_s1b", "22_s1c"], 2: ["23_s2a", "24_s2b", "25_s2c"], 3: ["26_t_a", "27_t_b", "28_t_c"] };
      ['17_slide', '18_plant', '19_rise', '20_s1a', '21_s1b', '22_s1c', '23_s2a', '24_s2b', '25_s2c', '26_t_a', '27_t_b', '28_t_c'].forEach(name => { const img = new Image(); img.src = 'assets/mc/' + name + '.webp'; MC_IMGS[name] = img; }); /* 選用（沒有圖時靜默，繪製時退回頂替格） */
      const MC_STRIDE = 250;
      let MC_PHASE = 0;
      let MC_LASTX = null;
      const MCR_IMGS = [];
      let MCR_READY = 0;
      for (let i = 1; i <= 10; i++) {
        const num = String(i).padStart(2, '0');
        const img = new Image();
        img.onload = () => { MCR_READY++; };
        img.onerror = () => { console.warn("Failed to load: run_" + num); };
        img.src = 'assets/mc/run_' + num + '.webp';
        MCR_IMGS.push(img);
      }

      /* v0.8.22 輪廓投影影子：把當下那一格的剪影壓扁貼在地上（跟著姿勢、武器變化），順月光方向微微斜拉；
         離地越高越淡越窄（跳躍、躍斬、墜落）。快取用 1/3 解析度（柔邊、省記憶體）。回傳 false＝圖還沒載入，呼叫端改畫橢圓。 */
      const _shMap = new WeakMap();
      function shadowImg(img) {
        if (!img || !img.naturalWidth) return null;
        let c = _shMap.get(img);
        if (!c) {
          const w = Math.max(1, Math.round(img.naturalWidth / 3)), h = Math.max(1, Math.round(img.naturalHeight / 3));
          c = document.createElement("canvas"); c.width = w; c.height = h;
          const g = c.getContext("2d"); g.drawImage(img, 0, 0, w, h);
          g.globalCompositeOperation = "source-in"; g.fillStyle = "#050308"; g.fillRect(0, 0, w, h);
          _shMap.set(img, c);
        }
        return c;
      }
      function drawSpriteShadow(img, x, anchorY, S, facing, height, alphaK) {
        const c = shadowImg(img); if (!c) return false;
        const lift = Math.max(0, height);
        const a = 0.46 * Math.max(0.15, 1 - lift / 420) * (alphaK == null ? 1 : alphaK);
        if (a <= 0.01) return true;
        const sx = Math.max(0.5, 1 - lift / 900);
        ctx.save();
        ctx.globalAlpha = a;
        const L = Game.mode !== "battle" ? hubLight(x) : null; /* 營地：影子隨營火方向與火光晃動 */
        if (L) ctx.globalAlpha = a * L.a / 0.46;
        ctx.transform((facing > 0 ? 1 : -1) * S * sx, 0, S * (L ? -L.skew : 0.38), -S * (L ? L.len : 0.16), x, Config.groundY + 2); /* d 為負：剪影的「高」往螢幕下方（朝觀眾）投到地面上 */
        ctx.drawImage(c, -450, -anchorY, img.naturalWidth, img.naturalHeight);
        ctx.restore();
        return true;
      }