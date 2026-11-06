      /* =========================================================================
       * v0.8.18 Boss 登場動畫（Stages[n].introCine = true 才啟用；敗北重打不播）
       * A 段（剪影）：Boss 站高處俯視主角 → 蓄力躍起 → 白閃轉場
       * B 段（戰場）：地面出現落點紅圈 → Boss 從天而降 → 落地震動、名字卡 → 接戰前劇情
       * ========================================================================= */
      const CINE = { A: 3.4, FALL: 3.95, LAND: 4.6, END: 6.0 };
      const _silCache = new Map();
      function silImg(img, col) {
        if (!img || !img.naturalWidth) return null;
        const k = img.src + "|" + col;
        let c = _silCache.get(k);
        if (!c) {
          c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
          const g = c.getContext("2d"); g.drawImage(img, 0, 0);
          g.globalCompositeOperation = "source-in"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
          _silCache.set(k, c);
        }
        return c;
      }
      const elCine = document.createElement("div");
      elCine.id = "cine-ui";
      elCine.style.cssText = "position:fixed;inset:0;z-index:200;display:none;pointer-events:none;font-family:'Noto Serif TC',serif;";
      elCine.innerHTML =
        '<button id="cine-skip" type="button" style="pointer-events:auto;position:absolute;right:14px;top:12px;padding:6px 16px;border-radius:999px;border:1px solid rgba(250,204,21,.5);background:rgba(8,12,24,.7);color:#fde68a;font-size:14px;font-weight:700;font-family:inherit;">跳過 ⏭</button>' +
        '<div id="cine-ask" style="display:none;pointer-events:auto;position:absolute;inset:0;background:rgba(2,4,12,.72);align-items:center;justify-content:center;">' +
        '<div style="padding:20px 26px;border:1.5px solid rgba(250,204,21,.55);border-radius:12px;background:rgba(8,12,24,.96);text-align:center;color:#f1f5f9;">' +
        '<div style="font-size:18px;font-weight:800;margin-bottom:16px;">要跳過動畫嗎？</div>' +
        '<div style="display:flex;gap:14px;justify-content:center;">' +
        '<button id="cine-keep" type="button" style="padding:8px 22px;border-radius:999px;border:1px solid rgba(250,204,21,.6);background:#78350f;color:#fef3c7;font-size:15px;font-weight:800;font-family:inherit;">繼續看</button>' +
        '<button id="cine-yes" type="button" style="padding:8px 22px;border-radius:999px;border:1px solid rgba(148,163,184,.5);background:rgba(30,41,59,.9);color:#e2e8f0;font-size:15px;font-weight:800;font-family:inherit;">跳過</button>' +
        '</div></div></div>';
      document.body.appendChild(elCine);
      function cineAsk(on) {
        if (!Game.cine) return;
        Game.cine.ask = on;
        if (on && Game.cine.vid) { try { Game.cine.vid.pause(); } catch (e) { } }
        elCine.querySelector("#cine-ask").style.display = on ? "flex" : "none";
      }
      elCine.querySelector("#cine-skip").addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); cineAsk(true); });
      elCine.querySelector("#cine-keep").addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); cineAsk(false); });
      elCine.querySelector("#cine-yes").addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); endBossCine(true); });
      window.addEventListener("keydown", (e) => {
        if (!Game.cine) return;
        e.stopImmediatePropagation(); e.preventDefault();
        if (e.repeat) return;
        if (e.code === "Escape") cineAsk(!Game.cine.ask);
        else if (Game.cine.ask && (e.code === "Enter" || e.code === "KeyY")) endBossCine(true);
      }, true);

      /* v0.8.89 影片過場（魂系 Boss 登場／換階段）：Stages[n].introMovie、p2Movie（不含副檔名）。
       * 期間整個戰鬥暫停（沿用 Game.cine，movie:true），只畫影片；專用「跳過」鍵＋確認；影片沒載好就回傳 false 走備案。 */
      function playMovie(base, opts) {
        if (!base) return false;
        const v = getCineVideo(base);
        if (!(v.readyState >= 3 && !v.error)) return false;
        opts = opts || {};
        Game.cine = { movie: true, t: 0, ask: false, vid: v, onEnd: opts.onEnd || null, landed: true };
        v.muted = !opts.audio; v.volume = 1;
        try { v.currentTime = 0; const pr = v.play(); if (pr && pr.catch) pr.catch(() => { v.muted = true; try { v.play(); } catch (e) { } }); } catch (e) { }
        document.body.classList.add("cine-mode");
        elHintToast.style.visibility = "hidden";
        elCine.style.display = "block";
        elCine.querySelector("#cine-ask").style.display = "none";
        return true;
      }
      function endMovie() {
        const c = Game.cine; if (!c || !c.movie) return;
        try { c.vid.pause(); c.vid.muted = true; } catch (e) { }
        Game.cine = null;
        document.body.classList.remove("cine-mode");
        elHintToast.style.visibility = "";
        elCine.style.display = "none";
        if (c.onEnd) c.onEnd();
      }
      function updateMovie(dt) {
        const c = Game.cine; if (c.ask) return;
        c.t += dt;
        const v = c.vid;
        if (v.ended || (v.duration && v.currentTime >= v.duration - 0.05) || v.error || c.t > 40) { endMovie(); return; }
        if (v.paused) { try { const pr = v.play(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } }
      }
      function drawMovie(w, h) {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
        const v = Game.cine.vid, vw = v.videoWidth || 16, vh = v.videoHeight || 9;
        const k = Math.min(w / vw, h / vh), dw = vw * k, dh = vh * k;
        if (v.readyState >= 2) ctx.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }
      function startBossCine() {
        const stage = Stages[Boss.stageId];
        if (stage && stage.introMovie) { /* 影片登場：播完出名牌；沒載好就回 false（呼叫端出名牌） */
          const ok = playMovie(stage.introMovie, { audio: true, onEnd: () => { if (STAGE_BGM[Boss.stageId]) Music.play(STAGE_BGM[Boss.stageId]); bossNameCard(stage); Game.introT = 0.7; Progress.battleStartTime = performance.now(); } });
          if (ok) { Game.introT = 0; Boss.facing = -1; }
          return ok;
        }
        if (!stage || !stage.introCine) return false;
        const SP = getBossSprite(stage.sprite || (stage.stances && stage.stances[(stage.stanceByPhase && stage.stanceByPhase[1]) || "A"].sprite));
        if (!(SP && SP.ready === 16 && MC_READY === 16 && MC_IMGS["01_idle1"])) return false;
        if (!getCineImg("bg", "assets/bg/" + stage.introBg + ".webp").ok) return false;
        for (const k of (stage.spriteExtras || [])) { const im = SP.imgs[k]; if (!(im && im.complete && im.naturalWidth)) return false; }
        let vid = null;
        if (stage.introVideo) { const v = getCineVideo(stage.introVideo); if (v.readyState >= 3 && !v.error) vid = v; }
        if (stage.introDash && !vid) return false; /* 衝進場模式沒有引擎剪影備案，影片沒載好就直接略過動畫 */
        const va = vid ? (stage.introA || 5.0) : 3.4; /* 影片版 A 段 5 秒（影片本身 5 秒），引擎剪影版 3.4 秒 */
        if (stage.introDash) { CINE.A = va; CINE.FALL = va; CINE.LAND = va + (stage.introAppear ? 0.75 : 0.55); CINE.END = va + 2.6; }
        else { CINE.A = va; CINE.FALL = va + 0.55; CINE.LAND = va + 1.2; CINE.END = va + 2.6; }
        Game.cine = { t: 0, ask: false, landed: false, vid, sfx: false, dash: !!stage.introDash, bx: Boss.x };
        if (vid) { try { vid.currentTime = 0; const pr = vid.play(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } }
        Boss.facing = -1; Boss.y = -900; Boss._cineImg = null;
        Game.introT = 0;
        document.body.classList.add("cine-mode");
        elHintToast.style.visibility = "hidden";
        elCine.style.display = "block";
        elCine.querySelector("#cine-ask").style.display = "none";
        return true;
      }
      function endBossCine(skipped) {
        if (!Game.cine) return;
        if (Game.cine.movie) { endMovie(); return; }
        const landed = Game.cine.landed;
        if (Game.cine.dash) Boss.x = Game.cine.bx;
        if (Game.cine.vid) { try { Game.cine.vid.pause(); } catch (e) { } }
        Game.cine = null;
        Boss._cineImg = null; Boss.y = Config.groundY; Boss.vy = 0;
        document.body.classList.remove("cine-mode");
        elHintToast.style.visibility = "";
        elCine.style.display = "none";
        if (skipped && !landed) bossNameCard(Stages[Boss.stageId]);
        Game.introT = skipped ? 0.5 : 0.7;
        Progress.battleStartTime = performance.now();
      }
      function cineLand() {
        const st = Stages[Boss.stageId], gy = Config.groundY;
        addTrauma(0.95);
        emitDust(Boss.x, gy, 1, 6, 1.6); emitDust(Boss.x, gy, -1, 6, 1.6);
        const lk = Game.cine && Game.cine.dash ? 0.6 : 1;
        landingFx(Boss.x, 1.8 * lk, 6);
        if (fxReady("land")) {
          spawnFx("land", 0, Boss.x, gy + 22, { w: 620 * lk, h: 620 * lk, dur: 0.6, anchor: "b", alpha: 0.85 });
          spawnFx("land", 1, Boss.x, gy + 6, { w: 400 * lk, h: 400 * lk, dur: 1.0, anchor: "b", alpha: 0.7 });
        }
        hapticBuzz(35);
        Sound.play("execution", 0.6, 0.55);
        Sound.play("s_hit", 0.7, 0.7);
        if (st.introLandSfx) Sound.play(st.introLandSfx, 0.85, 1);
        bossNameCard(st);
      }
      function updateCine(dt) {
        const c = Game.cine;
        if (c.movie) { updateMovie(dt); return; }
        if (c.ask) return;
        c.t += dt;
        if (c.vid && c.t < CINE.A) {
          if (c.vid.paused && !c.vid.ended) { try { const pr = c.vid.play(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } }
          else if (c.vid.currentTime > 0.05) c.t = c.vid.currentTime; /* 以影片時間為準，畫面與影片同步 */
          const st0 = Stages[Boss.stageId];
          if (st0.introSfx) { c.sfxN = c.sfxN || 0; while (c.sfxN < st0.introSfx.length && c.t >= st0.introSfx[c.sfxN][0]) { const e = st0.introSfx[c.sfxN++]; Sound.play(e[1], e[2], e[3]); } }
          else if (!c.sfx && c.t >= (st0.introSfxT || 3.8)) { c.sfx = true; Sound.play("slash", 0.6, 0.5); }
        } else if (c.vid && !c.vid.paused) { try { c.vid.pause(); } catch (e) { } }
        const t = c.t, gy = Config.groundY;
        if (c.dash && Stages[Boss.stageId].introAppear) { /* v0.8.58 鏡片聚合現身（第 2 關）：影片結束（鏡片蓋滿）→ 戰場淡入、鏡片旋風在原位聚合 → 顧天風現形＋名牌 */
          const st2 = Stages[Boss.stageId];
          const AP = Object.assign({ swirl: [2, 560, -20], land: [3, 420, -130], frames: ["33_tp_hit", "34_tp_rec"], rain: 0, sparks: "mikiri" }, st2.introAppearCfg || {}); /* v0.8.64 每關可設：聚合特效列／大小／高度、現身爆光、現身動作格、落劍數 */
          Boss.x = c.bx;
          if (Boss.flashFrames > 0) Boss.flashFrames = Math.max(0, Boss.flashFrames - dt * 60); /* 動畫期間物理不跑，閃白要自己倒數 */
          if (t < CINE.LAND) {
            Boss.y = -900; Boss._cineImg = null;
            if (t >= CINE.A && !c.swirl) {
              c.swirl = true;
              if (fxReady(st2.introAppear)) spawnFx(st2.introAppear, AP.swirl[0], c.bx, gy + AP.swirl[2], { w: AP.swirl[1], h: AP.swirl[3] || AP.swirl[1], dur: CINE.LAND - CINE.A + 0.15 });
              if (AP.rain && fxReady(st2.introAppear)) for (let i = 0; i < AP.rain; i++) { /* 飛劍從天而降插在現身處四周 */
                const ox = (i / Math.max(1, AP.rain - 1) - 0.5) * 420, dl = (i % 2 ? 0.12 : 0) + Math.abs(ox) / 2400;
                setTimeout(() => spawnFx(st2.introAppear, 3, c.bx + ox, gy - 70 - (i % 2) * 14, { w: 190, dur: 0.75, facing: ox < 0 ? -1 : 1 }), dl * 1000);
              }
              if (!bsfx("introSwirl")) Sound.play("assist", 0.7, 0.8);
            }
            if (AP.sparks && t >= CINE.A && Math.random() < dt * 30) spawnSparks(c.bx + (Math.random() - 0.5) * 260, gy - 40 - Math.random() * 200, AP.sparks, Math.random() < 0.5 ? -1 : 1);
          } else {
            Boss.y = gy;
            if (!c.landed) {
              c.landed = true; Boss.flashFrames = 5;
              if (fxReady(st2.introAppear)) spawnFx(st2.introAppear, AP.land[0], c.bx, gy + AP.land[2], { w: AP.land[1], h: AP.land[3] || AP.land[1], dur: 0.5 });
              addTrauma(0.35); hapticBuzz(25);
              if (!bsfx("introLand")) { Sound.play("mikiri", 0.8, 1.2); Sound.play("parry", 0.5, 1.6); }
              bossNameCard(st2);
            }
            Boss._cineImg = (t < CINE.LAND + 0.45) ? AP.frames[0] : (t < CINE.LAND + 1.2) ? AP.frames[1] : null;
          }
          updateHitParticles(dt);
          if (t >= CINE.END) endBossCine(false);
          return;
        }
        if (c.dash) { /* 衝進場：影片結束（揚塵蓋滿）→ 小狼由右側衝入並煞停 → 低伏低吼 */
          if (t < CINE.A) { Boss.y = -900; Boss._cineImg = null; }
          else if (t < CINE.LAND) {
            const k = (t - CINE.A) / (CINE.LAND - CINE.A), e = 1 - (1 - k) * (1 - k);
            Boss.y = gy; Boss.x = c.bx + 760 * (1 - e); Boss._cineImg = "26_rush";
            emitDust(Boss.x, gy, 1, 1, 0.9);
          } else {
            Boss.x = c.bx; Boss.y = gy;
            if (!c.landed) { c.landed = true; cineLand(); }
            Boss._cineImg = (t < CINE.LAND + 0.4) ? "25_pounce_land" : (t < CINE.LAND + 1.6) ? "20_bite_crouch" : null;
          }
          updateHitParticles(dt);
          if (t >= CINE.END) endBossCine(false);
          return;
        }
        if (t < CINE.FALL) { Boss.y = -900; Boss._cineImg = null; }
        else if (t < CINE.LAND) {
          const k = (t - CINE.FALL) / (CINE.LAND - CINE.FALL);
          Boss.y = -520 + (gy + 520) * k * k; Boss._cineImg = "21_fall";
        } else {
          if (!c.landed) { c.landed = true; cineLand(); }
          Boss.y = gy; Boss._cineImg = (t < CINE.LAND + 0.55) ? "22_land" : (t < CINE.LAND + 1.05) ? "23_rise" : null;
        }
        updateHitParticles(dt);
        if (t >= CINE.END) endBossCine(false);
      }
      function drawCineBars(w, h) {
        ctx.fillStyle = "#000";
        const bh = h * 0.07;
        ctx.fillRect(0, 0, w, bh); ctx.fillRect(0, h - bh, w, bh);
      }
      function drawCineMark() {
        const c = Game.cine, gy = Config.groundY;
        const k = Math.max(0, Math.min(1, (c.t - CINE.A) / (CINE.LAND - CINE.A)));
        ctx.save();
        const pulse = 0.5 + 0.5 * Math.sin(c.t * 18);
        ctx.fillStyle = `rgba(239,68,68,${0.12 + 0.22 * k})`;
        ctx.strokeStyle = `rgba(248,113,113,${0.45 + 0.4 * pulse})`;
        ctx.lineWidth = 3;
        const rx = 190 - 50 * k;
        ctx.beginPath(); ctx.ellipse(Boss.x, gy + 3, rx, 24 - 6 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      const CINE_IMG = { bg: {}, name: {} };
      function getCineImg(kind, path) {
        if (!CINE_IMG[kind][path]) { const o = { ok: false, img: new Image() }; o.img.onload = () => { o.ok = true; }; o.img.src = path; CINE_IMG[kind][path] = o; }
        return CINE_IMG[kind][path];
      }
      const CINE_VID = {};
      function getCineVideo(base) { /* base 不含副檔名；能播 H.264 用 mp4，否則用 webm */
        if (CINE_VID[base]) return CINE_VID[base];
        const v = document.createElement("video");
        v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto";
        v.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;";
        const mp4 = v.canPlayType('video/mp4; codecs="avc1.64001f"');
        v.src = base + (mp4 ? ".mp4" : ".webm") + "?v=" + ASSET_VER;
        document.body.appendChild(v); v.load();
        CINE_VID[base] = v;
        return v;
      }
      function drawFxCell(sheet, row, col, x, y, w, h, alpha, anchorB) {
        const s = fxSheet(sheet); if (!s.ok) return;
        const cs = s.img.width / 4;
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.drawImage(s.img, col * cs, row * cs, cs, cs, x - w / 2, anchorB ? y - h : y - h / 2, w, h);
        ctx.restore();
      }
      /* 登場動畫 A 段：以背景插圖（2576×1438）的座標系繪製，cover 方式鋪滿畫面 */
      function drawCineA(w, h) {
        const c = Game.cine, t = c.t, IW = 2576, IH = 1438;
        const stage = Stages[Boss.stageId];
        const SP = getBossSprite(stage.sprite);
        const bgO = getCineImg("bg", "assets/bg/" + stage.introBg + ".webp");
        ctx.fillStyle = "#0b0a16"; ctx.fillRect(0, 0, w, h);
        if (stage.introDash && !(c.vid && c.vid.readyState >= 2)) return; /* 衝進場模式沒有引擎剪影備案，影片暫時 seek 時先留黑幕 */
        if (c.vid && c.vid.readyState >= 2) { /* v0.8.20 影片版：cover 鋪滿，垂直焦點與背景圖一致 */
          const vs = Math.max(w / 1280, h / 720), vox = (w - 1280 * vs) / 2, voy = Math.max(h - 720 * vs, Math.min(0, h * 0.5 - 0.54 * 720 * vs));
          ctx.drawImage(c.vid, vox, voy, 1280 * vs, 720 * vs);
          if (t < 0.5) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.5})`; ctx.fillRect(0, 0, w, h); }
          if (t > CINE.A - 0.3) { ctx.fillStyle = `rgba(${stage.introFlash || "255,246,236"},${Math.min(1, (t - (CINE.A - 0.3)) / 0.3)})`; ctx.fillRect(0, 0, w, h); }
          return;
        }
        const sc = Math.max(w / IW, h / IH);
        const oy = Math.max(h - IH * sc, Math.min(0, h * 0.5 - 0.54 * IH * sc)), ox = (w - IW * sc) / 2;
        ctx.save();
        ctx.translate(ox, oy); ctx.scale(sc, sc);
        const z = 1 + 0.1 * Math.min(1, t / CINE.A), cx = IW * 0.66, cy = IH * 0.5;
        ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
        ctx.drawImage(bgO.img, 0, 0, IW, IH);
        const ledgeY = 688, bx0 = 1800, groundY = 1228;
        /* 主角（剪影，仰望） */
        const heroImg = silImg(MC_IMGS["01_idle1"], "#080a14");
        if (heroImg) {
          ctx.save(); ctx.translate(600, groundY + 12); ctx.scale(0.55, 0.55);
          ctx.shadowColor = "rgba(120,160,255,0.35)"; ctx.shadowBlur = 24;
          ctx.drawImage(heroImg, -450, -529); ctx.restore();
        }
        /* Boss（剪影）：站立 → 蓄力 → 躍起 */
        const bossK = 0.9;
        const drawBoss = (frame, x, y, rot, sy, alpha) => {
          const im = silImg(SP.imgs[frame], "#05040a"); if (!im) return;
          ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot);
          ctx.scale(-bossK, bossK * sy);
          ctx.shadowColor = "rgba(255,70,50,0.8)"; ctx.shadowBlur = 30;
          ctx.drawImage(im, -450, -560); ctx.restore();
        };
        const sink = 18;
        if (t < 2.2) {
          drawBoss(Math.floor(t / 0.8) % 2 === 0 ? "01_idle1" : "02_idle2", bx0, ledgeY + sink + Math.sin(t * 2) * 2, 0, 1, 1);
        } else if (t < 2.85) {
          const k = (t - 2.2) / 0.65, e = k * k;
          drawBoss("07_windup", bx0, ledgeY + sink + 12 * e, 0.06 * e, 1 - 0.05 * e, 1);
        } else {
          const u = Math.min(1, (t - 2.85) / 0.55);
          const pos = (uu) => ({ x: bx0 - 480 * uu, y: ledgeY + 30 - 1900 * uu * (0.55 + 0.45 * uu) });
          for (let i = 3; i >= 1; i--) { const p = pos(Math.max(0, u - i * 0.07)); drawBoss("20_jump", p.x, p.y, -0.12 * u, 1, 0.18 * (4 - i) / 3); }
          const p = pos(u); drawBoss("20_jump", p.x, p.y, -0.12 * u, 1, 1);
          const ra = t - 2.85;
          if (ra < 0.5) drawFxCell("land", 2, Math.min(3, Math.floor(ra / 0.5 * 4)), bx0 - 30, ledgeY - 10, 700, 700, 0.55);
        }
        /* 火星 */
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 40; i++) {
          const x = (i * 193 + t * (24 + (i % 4) * 14)) % (IW + 400) - 200;
          const y = IH + 40 - ((i * 107 + t * (56 + (i % 5) * 22)) % (IH + 120));
          const sz = 3 + (i % 3) * 1.6;
          ctx.fillStyle = `rgba(255,${120 + (i % 3) * 30},70,${0.3 + 0.25 * ((i % 4) / 3)})`;
          ctx.fillRect(x, y, sz, sz);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
        /* 淡入與結尾白閃 */
        if (t < 0.8) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.8})`; ctx.fillRect(0, 0, w, h); }
        if (t > CINE.A - 0.3) { ctx.fillStyle = `rgba(255,236,224,${Math.min(1, (t - (CINE.A - 0.3)) / 0.3)})`; ctx.fillRect(0, 0, w, h); }
      }
      /* Boss 墜落拖尾（世界座標，在 Boss 之前畫） */
      function drawCineTrail() {
        const c = Game.cine; if (!c || c.dash || c.t < CINE.FALL || c.t >= CINE.LAND) return;
        const k = (c.t - CINE.FALL) / (CINE.LAND - CINE.FALL);
        drawFxCell("land", 3, Math.min(3, Math.floor(k * 3.3)), Boss.x - 10, Boss.y - 90, 640, 640, 0.9, true);
      }
      /* 名字卡（書法圖，疊加發光）；圖沒載入就退回 DOM 橫幅 */
      function bossNameCard(st) {
        const o = st.introName ? getCineImg("name", st.introName) : null;
        if (o && o.ok) Game.nameCard = { t0: performance.now(), dur: 2000, img: o.img, sub: st.realmBadge };
        else showBanner(st.name, st.realmBadge, 1500, "#fde68a");
      }
      function drawNameCard(w, h) {
        const nc = Game.nameCard; if (!nc) return;
        const e = performance.now() - nc.t0;
        if (e > nc.dur) { Game.nameCard = null; return; }
        const aIn = Math.min(1, e / 200), aOut = Math.min(1, (nc.dur - e) / 600), a = Math.min(aIn, aOut);
        const pop = 1 + 0.12 * (1 - Math.min(1, e / 260)) * (1 - Math.min(1, e / 260));
        const iw = Math.min(w * 0.5, h * 1.5) * pop, ih = iw * nc.img.height / nc.img.width, cy = h * 0.25;
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
        ctx.drawImage(nc.img, w / 2 - iw / 2, cy - ih / 2, iw, ih);
        ctx.globalCompositeOperation = "source-over";
        if (nc.sub) {
          ctx.globalAlpha = a * Math.min(1, Math.max(0, (e - 250) / 250));
          ctx.font = `700 ${Math.round(h * 0.038)}px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`; ctx.textAlign = "center";
          ctx.fillStyle = "#fde68a"; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8;
          ctx.fillText(String(nc.sub).split("").join(" "), w / 2, cy + ih / 2 + h * 0.03);
        }
        ctx.restore();
      }
