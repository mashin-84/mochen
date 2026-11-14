      function drawDynamicBackground(camX) {
        const stage = Stages[Boss.stageId];
        const bg = stage.bgType;

        ctx.save();
        const artMode = drawArenaArt(camX, Boss.stageId);
        if (!artMode) {
        // Dynamic Moon / Star / Sky Celestial Body
        const orbX = camX + 850 - camX * 0.08;
        const orbY = 160;
        const orbGrad = ctx.createRadialGradient(orbX, orbY, 15, orbX, orbY, 70);
        let orbColor = "rgba(254, 243, 199, 0.9)";
        if (bg === "heaven_peak") orbColor = "rgba(244, 63, 94, 0.95)";
        else if (bg === "blood_pond" || bg === "demon_rift" || bg === "demonic_palace") orbColor = "rgba(239, 68, 68, 0.85)";
        else if (bg === "illusion" || bg === "moon_swamp") orbColor = "rgba(192, 132, 252, 0.85)";
        else if (bg === "gold_stairs" || bg === "celestial_gate") orbColor = "rgba(253, 224, 71, 0.95)";

        orbGrad.addColorStop(0, orbColor);
        orbGrad.addColorStop(1, "transparent");
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(orbX, orbY, 70, 0, Math.PI * 2);
        ctx.fill();

        // Heavenly Eye or Array Rings
        if (bg === "heaven_peak") {
          ctx.save();
          ctx.translate(orbX, orbY);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 110, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Mountain Peaks Silhouette
        let mountainFill = "rgba(15, 23, 42, 0.75)";
        if (bg === "blood_pond") mountainFill = "rgba(69, 10, 10, 0.8)";
        else if (bg === "illusion") mountainFill = "rgba(30, 20, 50, 0.8)";
        else if (bg === "heaven_peak") mountainFill = "rgba(35, 10, 30, 0.85)";
        
        ctx.fillStyle = mountainFill;
        ctx.beginPath();
        ctx.moveTo(camX - 100, Config.groundY);
        for (let i = 0; i <= 12; i++) {
          const px = i * 360 - camX * 0.35 + camX;
          const py = 240 + ((i * 71) % 120);
          ctx.lineTo(px, py);
        }
        ctx.lineTo(camX + Config.baseWidth + 200, Config.groundY);
        ctx.closePath();
        ctx.fill();

        }

        // Arena Ground & Pillars
        for (let x = 200; x <= Config.worldWidth - 200 && !artMode; x += 300) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.fillRect(x - 16, Config.groundY - 250, 32, 250);
          ctx.strokeStyle = varColor(bg);
          ctx.strokeRect(x - 16, Config.groundY - 250, 32, 250);

          ctx.fillStyle = varColor(bg);
          ctx.beginPath();
          ctx.arc(x, Config.groundY - 210, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }

        const ownGround = artMode && arenaHasGround(Boss.stageId);
        if (ownGround) {
          drawArenaLayers(camX, Boss.stageId, "ground"); /* M2 該關專屬地面（分層場景） */
        } else if (artMode) {
          const gg = ctx.createLinearGradient(0, Config.groundY, 0, Config.baseHeight + 120);
          gg.addColorStop(0, "#9aa7bf");
          gg.addColorStop(0.3, "#74829f");
          gg.addColorStop(1, "#3d4863");
          ctx.fillStyle = gg;
          ctx.fillRect(-3000, Config.groundY, Config.worldWidth + 6000, Config.baseHeight - Config.groundY + 120); /* 鏡頭拉遠時兩側也要有地面 */
          const mg2 = ctx.createLinearGradient(0, Config.groundY - 70, 0, Config.groundY);
          mg2.addColorStop(0, "rgba(220,235,255,0)");
          mg2.addColorStop(1, "rgba(220,235,255,0.35)");
          ctx.fillStyle = mg2;
          ctx.fillRect(-3000, Config.groundY - 70, Config.worldWidth + 6000, 70);
        } else {
          ctx.fillStyle = "#070c14";
          ctx.fillRect(-3000, Config.groundY, Config.worldWidth + 6000, Config.baseHeight - Config.groundY + 120); /* 鏡頭拉遠時兩側也要有地面 */
        }

        if (!ownGround) {
        ctx.strokeStyle = artMode ? "rgba(210, 230, 255, 0.5)" : varColor(bg);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3000, Config.groundY);
        ctx.lineTo(Config.worldWidth + 3000, Config.groundY);
        ctx.stroke();
        }

        ctx.font = "600 11px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif";
        ctx.textAlign = "center";
        for (let x = 0; x <= Config.worldWidth && !artMode; x += 160) {
          const major = x % 640 === 0;
          ctx.strokeStyle = major ? varColor(bg) : "rgba(148, 163, 184, 0.15)";
          ctx.lineWidth = major ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(x, Config.groundY);
          ctx.lineTo(x, Config.groundY + (major ? 24 : 10));
          ctx.stroke();

          if (major) {
            const screenRatio = (x / Config.baseWidth).toFixed(1);
            ctx.fillStyle = "rgba(254, 240, 138, 0.65)";
            ctx.fillText(`${screenRatio}x Screen (${x}m)`, x, Config.groundY + 40);
          }
        }

        // Drifting Bamboo or Soul Petals
        for (const l of Game.inkBambooLeaves) {
          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(l.angle);
          ctx.fillStyle = varColor(bg, 0.35);
          ctx.beginPath();
          ctx.ellipse(0, 0, l.len, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      function varColor(bg, alpha = 1.0) {
        if (bg === "blood_pond" || bg === "demon_rift" || bg === "demonic_palace") return `rgba(239, 68, 68, ${alpha})`;
        if (bg === "illusion" || bg === "moon_swamp") return `rgba(192, 132, 252, ${alpha})`;
        if (bg === "gold_stairs" || bg === "celestial_gate") return `rgba(245, 158, 11, ${alpha})`;
        if (bg === "heaven_peak") return `rgba(244, 63, 94, ${alpha})`;
        return `rgba(56, 189, 248, ${alpha})`;
      }

      /* v0.7.5 劍雨：move.swordRain = 劍數；前搖由高處下落，出手時插進紅圈，收招淡出 */
      function drawSwordRain() {
        const stage = Stages[Boss.stageId]; const m = stage.moves[Boss.moveType];
        if (!m || !m.swordRain || Boss.perilType !== "grab") return;
        let fall, alpha = 1;
        if (Boss.state === "windup") { const p = 1 - Boss.stateTimer / (Boss.stateDur || 1); fall = Math.min(1, Math.max(0, (p - 0.25) / 0.75)); fall = fall * fall; alpha = Math.min(1, 0.25 + p * 1.2); }
        else if (Boss.state === "active") fall = 1;
        else if (Boss.state === "recover") { fall = 1; alpha = Math.max(0, Boss.stateTimer / (m.recover * 0.5 || 0.4)); if (alpha > 1) alpha = 1; }
        else return;
        const r = m.range * 0.75, n = m.swordRain;
        const artK = stage.swordRainArt, art = artK && fxReady(artK) ? fxSheet(artK) : null;
        if (art) { /* v0.8.59 生圖劍雨：boss3fx 列 3（0 落下、1 插地、2～3 消散）；圖中劍尖約在格子 (0.66, 0.82) */
          const col = Boss.state === "windup" ? 0 : Boss.state === "active" ? 1 : (alpha > 0.5 ? 2 : 3);
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          for (let i = 0; i < n; i++) {
            const f = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
            const x = Boss.grabZoneX + f * r * 0.92, hover = 420 * (1 - fall);
            const tipY = Config.groundY + 4 - 8 * Math.abs(f) - hover - (i % 2) * 12;
            const S = 190 + (i % 3) * 18, mir = i % 2 ? -1 : 1;
            ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (Boss.state === "recover" ? 1.6 : 1))); ctx.translate(x, tipY); ctx.scale(mir, 1);
            ctx.drawImage(art.img, col * 256, 3 * 256, 256, 256, -S * 0.66, -S * 0.82, S, S);
            ctx.restore();
          }
          ctx.restore(); return;
        }
        ctx.save();
        for (let i = 0; i < n; i++) {
          const f = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
          const x = Boss.grabZoneX + f * r * 0.92;
          const depth = 8 + 10 * (1 - Math.abs(f));
          const hover = 420 * (1 - fall);
          const tipY = Config.groundY + 6 - 10 * Math.abs(f) - hover - (i % 2) * 14;
          const L = 118 + (i % 3) * 14;
          ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, tipY);
          ctx.rotate(((i % 2) ? 1 : -1) * 0.05 * (1 - fall) + f * 0.06);
          ctx.shadowColor = "#7dd3fc"; ctx.shadowBlur = 12;
          const g = ctx.createLinearGradient(0, -L, 0, 0); g.addColorStop(0, "#e0f2fe"); g.addColorStop(1, "#7aa8d8");
          ctx.fillStyle = g; ctx.strokeStyle = "#3b5b86"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -L + 14); ctx.lineTo(-5, -L); ctx.lineTo(5, -L); ctx.lineTo(5, -L + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.shadowBlur = 0; ctx.fillStyle = "#6b4a2b"; ctx.fillRect(-13, -L - 4, 26, 6); ctx.fillRect(-3, -L - 30, 6, 26);
          ctx.restore();
        }
        ctx.restore();
      }
      function drawTelegraphs() {
        drawSwordRain();
        if (Boss.state !== "windup" && Boss.state !== "active") return;
        const stage = Stages[Boss.stageId];
        const m = stage.moves[Boss.moveType];
        if (!m) return;

        const p = Boss.state === "windup" ? 1 - Boss.stateTimer / (Boss.stateDur || 1) : 1;
        ctx.save();

        if (Boss.perilType === "thrust") {
          const endX = Boss.x + Boss.facing * (m.range + 90);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + p * 0.55})`;
          ctx.lineWidth = 4 + p * 4;
          ctx.setLineDash([12, 8]);
          ctx.beginPath();
          ctx.moveTo(Boss.x, Config.groundY - 48);
          ctx.lineTo(endX, Config.groundY - 48);
          ctx.stroke();
        } else if (Boss.perilType === "sweep") {
          ctx.fillStyle = `rgba(239, 68, 68, ${0.16 + p * 0.28})`;
          ctx.fillRect(Boss.x - m.range, Config.groundY - 26, m.range * 2, 26);
          ctx.strokeStyle = `rgba(248, 113, 113, ${0.5 + p * 0.45})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(Boss.x - m.range, Config.groundY - 26, m.range * 2, 26);
        } else if (m.ultimate && Boss.stageId === 1 && fxReady("ult")) {
          drawUltArt(m, p);
        } else if (Boss.perilType === "grab" || Boss.perilType === "leap") {
          const r = m.range * (Boss.perilType === "leap" ? 1.0 : 0.75);
          ctx.fillStyle = `rgba(220, 38, 38, ${0.18 + p * 0.35})`;
          ctx.beginPath();
          ctx.ellipse(Boss.grabZoneX, Config.groundY, r, 20, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#f87171";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(Boss.grabZoneX, Config.groundY, r * p, 20 * p, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        drawThreatMarker(m);
      }

      /* v0.8.187 連擊段數提示（程式畫，待換生圖）：頭上 N 道爪痕／刀痕，起手時全亮，出一下滅一下；最後一下放大 */
      function drawComboPips() {
        if (Boss.state !== "windup" && Boss.state !== "active") return;
        const stC = Stages[Boss.stageId], m = stC && stC.moves[Boss.moveType];
        if (!m) return;
        const n = m.isCombo ? (m.comboTotalHits || 3) : 0;
        if (n < 2 || Boss._ilDraw) return;
        const left = Boss.state === "windup" ? n : Math.max(0, Boss.comboHitsLeft | 0);
        if (Boss.state === "active" && left <= 0) return;
        const col = m.armor ? "96,165,250" : "250,204,21", gap = 30, x0 = Boss.x - (n - 1) * gap / 2, y = Boss.y - Math.max(Boss.h, 165) - 60;
        const t = performance.now() / 1000;
        ctx.save();
        ctx.lineCap = "round";
        for (let i = 0; i < n; i++) {
          const used = i < n - left, last = i === n - 1, x = x0 + i * gap, s = (last ? 1.35 : 1) * (used ? 0.8 : 1 + 0.08 * Math.sin(t * 14));
          ctx.globalAlpha = used ? 0.22 : 0.95;
          ctx.strokeStyle = used ? "rgba(203,213,225,1)" : `rgba(${col},1)`;
          ctx.shadowColor = `rgba(${col},0.9)`; ctx.shadowBlur = used ? 0 : 10;
          ctx.lineWidth = 5 * s;
          ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 13 * s); ctx.lineTo(x + 7 * s, y + 13 * s); ctx.stroke();
        }
        ctx.restore();
      }

      /* v0.8.1 預警顏色統一：黃＝可招架、紅＝危（閃／跳／側閃）、藍＝霸體（打不斷，用蓄力重斬破、或閃開） */
      function drawThreatMarker(m) {
        if (Boss.state !== "windup" || !m || m.isMobility || !(m.damage > 0 || m.isCombo || m.isZone)) return;
        let col = "#facc15", key = "tg_yellow", txt = "黃圈：可招架（在紅圈收縮到底時按招架）";
        if (Boss.isPerilous) { col = "#ef4444"; key = "tg_red"; txt = "紅圈【危】：突刺類可在完美窗口內招架看破；橫掃、橫穿、躍斬類不能擋，要跳、瞬步或側閃"; }
        else if (m.armor) { col = "#60a5fa"; key = "tg_blue"; txt = "藍圈：霸體，普攻打不斷；可招架或閃開"; }
        if (m.hintText) { key = m.hintKey || key; txt = m.hintText; } /* 招式自訂提示（魔焰獸玉不能擋、要瞬步到狼身後） */
        hintOnce(key, txt);
        const p = 1 - Boss.stateTimer / (Boss.stateDur || 1);
        const cx = Boss.x, cy = Boss.y - Boss.h * 0.5;
        { const stM = Stages[Boss.stageId]; if (stM && stM.cueArt && fxReady("cue")) return; } /* v0.8.143 有生圖光圈的關卡：光圈改在 drawBossEntity 的 C4 提示（以實際命中時間 nextImpactIn 驅動），這裡只留提示文字 */
        if (fxReady("mark")) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.drawImage(fxSheet("mark").img, Math.min(3, Math.floor(p * 4)) * 256, (key === "tg_red" ? 1 : key === "tg_blue" ? 2 : 0) * 256, 256, 256, cx - 100, cy - 100, 200, 200);
          ctx.restore();
          return;
        }
        ctx.save();
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35 + 0.5 * p;
        ctx.beginPath(); ctx.arc(cx, cy, 11 + 26 * (1 - p), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

          function drawFlyingSwords() {
            const stBA = Stages[Boss.stageId] || {}; /* v0.8.65 飛劍改畫生圖：{sheet, row, frames, fps, w, tip}；v0.8.122 投射物資料化：Stages[n].bulletArts[bulletKind] 同格式（戈、箭…），沒圖才退回程式畫 */
            for (const sw of Game.flyingSwords) {
              const fsa = sw.kind ? (stBA.bulletArts && stBA.bulletArts[sw.kind]) : stBA.flySwordArt;
              const fsImg = fsa && fxReady(fsa.sheet) ? fxSheet(fsa.sheet).img : null;
              if (fsImg) {
                const fr = fsa.frames || [1, 2], f = fr[Math.floor(performance.now() / 1000 * (fsa.fps || 12)) % fr.length], w = fsa.w || 150, k = w / 256;
                ctx.save();
                ctx.translate(sw.x, sw.y);
                ctx.rotate(Math.atan2(sw.vy, sw.vx) + (fsa.rot || 0));
                ctx.globalCompositeOperation = "lighter";
                if (sw.reflected) ctx.filter = "sepia(1) saturate(3) hue-rotate(-12deg) brightness(1.15)"; /* 折射後轉金色 */
                ctx.drawImage(fsImg, f * 256, (fsa.row || 0) * 256, 256, 256, -(fsa.tipX != null ? fsa.tipX * k : w * (fsa.tip || 0.95)), -(fsa.tipY != null ? fsa.tipY * k : w / 2), w, w); /* 劍尖對準飛劍座標 */
                ctx.restore();
                continue;
              }
              ctx.save();
              ctx.translate(sw.x, sw.y);
              if (sw.dir < 0) ctx.scale(-1, 1);
              if (sw.kind === "halberd") {
                const hc = sw.reflected ? "#fde047" : "#f59e0b";
                ctx.shadowColor = hc;
                ctx.shadowBlur = 14;
                ctx.fillStyle = "#78350f";
                ctx.fillRect(-52, -2.5, 96, 5); /* 戈柄 */
                ctx.fillStyle = hc;
                ctx.beginPath(); ctx.moveTo(44, -9); ctx.lineTo(70, 0); ctx.lineTo(44, 9); ctx.closePath(); ctx.fill(); /* 戈尖 */
                ctx.fillRect(30, -12, 8, 24); /* 橫刃 */
                if (fxReady("boss2")) { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(fxSheet("boss2").img, (Math.floor(performance.now() / 70) % 4) * 256, 0, 256, 256, -202, -160, 320, 320); ctx.globalCompositeOperation = "source-over"; }
              } else {
              ctx.fillStyle = sw.reflected ? "#fde047" : "#38bdf8";
              ctx.shadowColor = sw.reflected ? "#fde047" : "#38bdf8";
              ctx.shadowBlur = 12;
              ctx.fillRect(-24, -3, 48, 6);
              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              ctx.fillRect(-18, -1.5, 36, 3);
              }
              ctx.restore();
            }
          }
