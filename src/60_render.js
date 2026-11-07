      /* =========================================================================
       * 5. 渲染引擎：動態多場景視差背景與角色剪影
       * ========================================================================= */
      function render() {
        const w = canvas.width;
        const h = canvas.height;
        ctx.save();
        ctx.clearRect(0, 0, w, h);
        { /* v0.8.85 先畫跟 #game-container 一樣的底色漸層，讓畫布不透明：黑底發光特效（lighter）在背景半透明處不再變成黑方塊 */
          const cx = w * 0.5, cy = h * 0.25, R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
          const bgG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); bgG.addColorStop(0, "#0f1c2e"); bgG.addColorStop(1, "#030712");
          ctx.fillStyle = bgG; ctx.fillRect(0, 0, w, h);
        }
        if (Game.cine && Game.cine.movie) { drawMovie(w, h); ctx.restore(); return; }
        if (Game.cine && Game.cine.t < CINE.A) { drawCineA(w, h); drawCineBars(w, h); ctx.restore(); return; }

        const isPortrait = h > w;
        let scale = 1.0;
        let offsetX = 0;
        let offsetY = 0;
        const refW = isPortrait ? 960 : Config.baseWidth;

        if (isPortrait) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const controlReserveH = 190 * dpr;
          const hudReserveH = 75 * dpr;
          const availH = Math.max(260 * dpr, h - controlReserveH - hudReserveH);
          scale = Math.min(w / refW, availH / Config.baseHeight);
          offsetX = (w - refW * scale) * 0.5;
          offsetY = hudReserveH + (availH - Config.baseHeight * scale) * 0.5;
        } else {
          scale = h / Config.baseHeight;
          offsetX = (w - refW * scale) * 0.5;
          offsetY = (h - Config.baseHeight * scale) * 0.5;
        }

        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        let shakeOffX = 0;
        let shakeOffY = 0;
        const cam = Game.camera;
        let shakeRoll = 0;
        if (cam.trauma > 0) {
          const sh = cam.trauma * cam.trauma * Config.shakeMultiplier;
          const tt = cam.shakeClock * 28 * (cam.shakeRate || 1); /* v0.8.112 導演可放慢震動頻率 */
          shakeOffX = 60 * sh * noise1(tt + 11.3);
          shakeOffY = 60 * sh * noise1(tt + 47.7);
          shakeRoll = 0.035 * sh * noise1(tt + 91.1);
        }

        ctx.translate(Config.baseWidth * 0.5, Config.baseHeight * 0.5);
        if (shakeRoll) ctx.rotate(shakeRoll);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-Config.baseWidth * 0.5 - cam.x + shakeOffX, -Config.baseHeight * 0.5 - (cam.y || 0) + shakeOffY); /* v0.8.106 cam.y：導演用的垂直對焦（平時 0） */

        drawDynamicBackground(cam.x);
        drawSkyExtension(cam);
        if (Game.mode !== "battle") drawHubScene();
        drawPartsBack(); /* v0.8.83 部位 Boss：背景本體與地面預警 */

        if (Game.ultDim > 0.01) {
          ctx.save();
          ctx.fillStyle = `rgba(2, 4, 14, ${0.62 * Game.ultDim})`;
          ctx.fillRect(-3000, -3000, Config.worldWidth + 6000, 7000);
          const ug = ctx.createRadialGradient(Boss.x, Boss.y - 110, 20, Boss.x, Boss.y - 110, 420);
          ug.addColorStop(0, `rgba(255, 70, 50, ${0.34 * Game.ultDim})`);
          ug.addColorStop(1, "rgba(255, 70, 50, 0)");
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = ug;
          ctx.fillRect(Boss.x - 450, Boss.y - 560, 900, 700);
          ctx.restore();
        }

        // Draw Hazard Zones (原語 4)
        if (Game.hazardZones && Game.hazardZones.length > 0) {
          for (const hz of Game.hazardZones) {
            ctx.save();
            const alpha = Math.max(0, Math.min(1, hz.duration / (hz.maxDur || 1)));
            const isWarn = hz.warningTimer > 0;
            if (hz.type === "wind") {
              ctx.fillStyle = `rgba(56, 189, 248, ${isWarn ? 0.25 : 0.45 * alpha})`;
              ctx.strokeStyle = "#38bdf8";
            } else if (hz.type === "fire") {
              ctx.fillStyle = `rgba(239, 68, 68, ${isWarn ? 0.3 : 0.5 * alpha})`;
              ctx.strokeStyle = "#f87171";
            } else if (hz.type === "ice") {
              ctx.fillStyle = `rgba(125, 211, 252, ${isWarn ? 0.25 : 0.45 * alpha})`;
              ctx.strokeStyle = "#7dd3fc";
            } else if (hz.type === "bone") {
              ctx.fillStyle = `rgba(241, 245, 249, ${isWarn ? 0.3 : 0.5 * alpha})`;
              ctx.strokeStyle = "#e2e8f0";
            }
            ctx.lineWidth = 2.5;
            const zA = Stages[Boss.stageId] && Stages[Boss.stageId].zoneArt && Stages[Boss.stageId].zoneArt[hz.type];
            if (zA && fxReady(zA[0])) { /* v0.8.59 生圖地面陣紋（4 格循環、疊加發光）；預警時淡、爆發後亮 */
              const sh = fxSheet(zA[0]), up = zA[2] === "up";
              /* v0.8.82 zA[2]="up"：直立物（白骨刺）腳底貼地；預警時只露第 0 格的刺尖，爆發後 1～3 格循環 */
              const col = up ? (isWarn ? 0 : 1 + Math.floor(performance.now() / 130) % 3) : Math.floor(performance.now() / 110) % 4;
              const zw = hz.w * (up ? 1.15 : 1.25), zh = up ? zw : zw * 0.5;
              ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = isWarn ? 0.45 + 0.25 * Math.sin(performance.now() / 60) : Math.min(1, alpha * 1.4);
              ctx.drawImage(sh.img, col * 256, zA[1] * 256, 256, 256, hz.x - zw / 2, up ? hz.y - zh * 0.92 : hz.y - zh * 0.56, zw, zh);
              ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
            } else {
            ctx.fillRect(hz.x - hz.w * 0.5, hz.y - hz.h, hz.w, hz.h);
            ctx.strokeRect(hz.x - hz.w * 0.5, hz.y - hz.h, hz.w, hz.h);
            }
            if (isWarn) {
              ctx.font = "700 12px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif";
              ctx.fillStyle = "#fde047";
              ctx.textAlign = "center";
              ctx.fillText("⚠️ 煞氣即將爆發！", hz.x, hz.y - hz.h - 8);
            }
            ctx.restore();
          }
        }

        if (Game.darkVignetteAlpha > 0) {
          ctx.fillStyle = `rgba(3, 7, 18, ${Game.darkVignetteAlpha * 0.82})`;
          ctx.fillRect(-3000, -3000, Config.worldWidth + 6000, 7000); /* v0.8.47 修正：寬螢幕手機與鏡頭拉遠時，處決暗場要蓋滿整個畫面 */
        }

        drawTelegraphs();
        if (Game.cine && !Game.cine.landed && !Game.cine.dash) drawCineMark();

        for (const img of Game.afterimages) {
          if (img.spr) { /* v0.8.96 角色剪影殘影 */
            const sil = silImg(img.spr, img.color || "#7dd3fc");
            if (sil) {
              ctx.save(); ctx.globalAlpha = Math.max(0, img.alpha * 0.85);
              ctx.translate(img.x, img.y + GROUND_SINK); ctx.scale(img.f > 0 ? img.s : -img.s, img.s);
              ctx.drawImage(sil, -450, -529); ctx.restore();
            }
          } else if (MC_READY !== 16) { /* 沒有角色圖時才畫舊方塊 */
            ctx.fillStyle = `rgba(56, 189, 248, ${img.alpha * 0.45})`;
            ctx.fillRect(img.x - img.w * 0.5, img.y - img.h, img.w, img.h);
          }
        }

        drawMist();
        drawFx(true);
        drawFlyingSwords();
        drawCineTrail();
        drawIllusions();
        drawBossEntity();
        drawPlayer();
        drawHubFront();
        drawArcs();
        drawSparks();
        drawHitFx();
        drawFx();
        drawLeaves();
        if (Game.mode === "battle") drawArenaLayers(Game.camera.x, Boss.stageId, "fg"); /* M2 前景剪影層 */

        if (Game.executionLines && Game.executionLines.length > 0) {
          for (const l of Game.executionLines) {
            ctx.save();
            ctx.strokeStyle = l.color || "#ffffff";
            ctx.globalAlpha = Math.max(0, Math.min(1, l.alpha));
            ctx.shadowColor = l.color || "#38bdf8";
            ctx.shadowBlur = 24;
            ctx.lineWidth = (l.width || 7) * l.alpha;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
            ctx.restore();
          }
        } else if (Game.executionLine) {
          const l = Game.executionLine;
          ctx.save();
          ctx.strokeStyle = `rgba(224, 242, 254, ${l.alpha})`;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 24;
          ctx.lineWidth = 7 * l.alpha;
          ctx.beginPath();
          ctx.moveTo(l.x1, l.y1);
          ctx.lineTo(l.x2, l.y2);
          ctx.stroke();
          ctx.restore();
        }

        for (const ft of Game.floatingTexts) {
          const a = Math.max(0, Math.min(1, ft.life / ft.maxLife));
          ctx.save();
          ctx.font = `800 ${Math.round(16 * ft.scale)}px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = a;
          ctx.shadowColor = "rgba(0,0,0,0.85)";
          ctx.shadowBlur = 6;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }

        ctx.restore();

        if (Game.cine) {
          const ft = Game.cine.t - CINE.A, fd = Game.cine.dash ? 0.8 : 0.35;
          if (ft < fd) { ctx.fillStyle = `rgba(${Stages[Boss.stageId].introFlash || "255,236,224"},${1 - ft / fd})`; ctx.fillRect(0, 0, w, h); }
          drawCineBars(w, h);
        }
        drawNameCard(w, h);
        drawDirOverlay(w, h);

        if (Game.flashWhiteOverlay > 0) {
          ctx.save();
          ctx.fillStyle = `rgba(224, 247, 250, ${Game.flashWhiteOverlay * 0.45})`;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }

        if (Game.executionBannerTimer > 0 && drawExecTitle(w, h)) {
          /* v0.8.10 新版大字已畫 */
        } else if (Game.executionBannerTimer > 0) {
          ctx.save();
          const a = Math.min(1, Game.executionBannerTimer * 1.5);
          ctx.globalAlpha = a;
          const inkS = fxSheet("ink");
          if (inkS.ok) {
            ctx.font = `900 64px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`;
            const tw = ctx.measureText("【 破 勢 處 決 ・ 一 劍 青 雲 】").width;
            const iw = Math.min(w * 0.98, tw * 1.45), ih = iw * 0.34;
            ctx.drawImage(inkS.img, 0, 768, 512, 256, w * 0.5 - iw / 2, h * 0.24 - ih / 2, iw, ih);
          } else {
          ctx.fillStyle = "rgba(11, 18, 32, 0.85)";
          ctx.fillRect(0, h * 0.24 - 38, w, 76);
          ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, h * 0.24 - 38);
          ctx.lineTo(w, h * 0.24 - 38);
          ctx.moveTo(0, h * 0.24 + 38);
          ctx.lineTo(w, h * 0.24 + 38);
          ctx.stroke();
          }

          ctx.font = inkS.ok ? `900 64px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif` : `900 36px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = "#fef08a";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 22;
          ctx.fillText("【 破 勢 處 決 ・ 一 劍 青 雲 】", w * 0.5, h * 0.24 + 12);
          ctx.restore();
        }
      }

      /* ====================== 背景美術（有圖就用圖，沒圖退回程式繪製） ====================== */
      const BG_ART = { camp: { ok: false, img: new Image() }, s1: { ok: false, img: new Image() } };
      BG_ART.camp.img.onload = () => { BG_ART.camp.ok = true; };
      BG_ART.s1.img.onload = () => { BG_ART.s1.ok = true; };
      BG_ART.camp.img.src = "assets/bg/camp.webp";
      BG_ART.s1.img.src = "assets/bg/arena1.webp";

      /* 戰場背景資料化：Stages[n].bg = "arena2" → assets/bg/arena2.webp；Stages[n].bgDim 為暗化（預設 0.4） */
      /* v0.8.111 鏡頭往上看超出背景時（登場下落），用背景頂端的顏色往上延伸，不露黑底 */
      function drawSkyExtension(cam) {
        if (!(cam.y < -0.5)) return;
        const stg = Stages[Boss.stageId], a = stg && stg.bg ? getBgArt(stg.bg) : null;
        if (!a || !a.ok) return;
        if (!a.top) { /* 直接取剛畫好的背景頂端像素（含調暗），只取一次；取不到才退回原圖頂端色 */
          try {
            const m = ctx.getTransform(), pt = m.transformPoint({ x: cam.x + Config.baseWidth * 0.5, y: 4 });
            if (pt.y >= 0 && pt.y < canvas.height - 1) {
              const px = Math.max(0, Math.min(canvas.width - 24, Math.round(pt.x) - 12)), d = ctx.getImageData(px, Math.round(pt.y), 24, 1).data;
              let r = 0, g = 0, b = 0; for (let i = 0; i < 24; i++) { r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; }
              a.top = [Math.round(r / 24), Math.round(g / 24), Math.round(b / 24)];
            }
          } catch (e) { }
        }
        if (!a.top) {
          try { const c = document.createElement("canvas"); c.width = 8; c.height = 1; const x = c.getContext("2d"); x.drawImage(a.img, 0, 0, a.img.naturalWidth, Math.max(2, a.img.naturalHeight * 0.01), 0, 0, 8, 1); const d = x.getImageData(0, 0, 8, 1).data; let r = 0, g = 0, b = 0; for (let i = 0; i < 8; i++) { r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; } a.top = [Math.round(r / 8), Math.round(g / 8), Math.round(b / 8)]; } catch (e) { a.top = [60, 60, 90]; }
        }
        const t = a.top, gr = ctx.createLinearGradient(0, -1200, 0, 140), c0 = `rgb(${Math.round(t[0] * 0.85)},${Math.round(t[1] * 0.85)},${Math.round(t[2] * 0.9)})`, c1 = `rgb(${t[0]},${t[1]},${t[2]})`;
        gr.addColorStop(0, c0); gr.addColorStop(0.8955, c1); gr.addColorStop(1, `rgba(${t[0]},${t[1]},${t[2]},0)`); /* 0.8955 = 世界 y=0（1200/1340）；往下 140px 羽化進背景，蓋掉接縫 */
        ctx.save(); ctx.fillStyle = gr; ctx.fillRect(cam.x - 600, -1200, Config.baseWidth + 1200, 1340); ctx.restore();
        const S = stg.bgSky ? getBgArt(stg.bgSky) : null; /* v0.8.113 有天空延伸圖就畫圖（與背景同一套左右鏡像補滿；底端 40 列淡出蓋接縫，圖已含調暗） */
        if (S && S.ok) {
          const h = Config.baseHeight, w = h * (a.img.naturalWidth / a.img.naturalHeight), k = w / S.img.naturalWidth, sh = S.img.naturalHeight * k;
          const f = Math.max(0, (w - Config.baseWidth) / (Config.worldWidth - Config.baseWidth)), cx = Math.max(0, Math.min(Config.worldWidth - Config.baseWidth, cam.x)), il = cx * (1 - f), y0 = -sh + 40 * k;
          ctx.save(); ctx.drawImage(S.img, il, y0, w, sh);
          ctx.save(); ctx.translate(il, 0); ctx.scale(-1, 1); ctx.drawImage(S.img, 0, y0, w, sh); ctx.restore();
          ctx.save(); ctx.translate(il + 2 * w, 0); ctx.scale(-1, 1); ctx.drawImage(S.img, 0, y0, w, sh); ctx.restore();
          ctx.restore();
        }
      }
      function getBgArt(key) {
        if (!BG_ART[key]) {
          const a = { ok: false, fail: false, n: 0, img: new Image() };
          a.img.onload = () => { a.ok = true; };
          a.img.onerror = () => { if (a.n < 3) { a.n++; setTimeout(() => { a.img.src = "assets/bg/" + key + ".webp?v=" + ASSET_VER + "&r=" + a.n; }, 500 * a.n); } else a.fail = true; }; /* v0.8.114 載入失敗自動重試 3 次 */
          a.img.src = "assets/bg/" + key + ".webp";
          BG_ART[key] = a;
        }
        return BG_ART[key];
      }
      function drawArenaArt(camX, stageId) {
        const stBg = Stages[stageId];
        const A = stBg && stBg.bg ? getBgArt(stBg.bg) : null;
        if (!A || !A.ok) return false;
        const h = Config.baseHeight;
        const w = h * (A.img.naturalWidth / A.img.naturalHeight);
        const f = Math.max(0, (w - Config.baseWidth) / (Config.worldWidth - Config.baseWidth));
        const cx = Math.max(0, Math.min(Config.worldWidth - Config.baseWidth, camX));
        const il = cx * (1 - f);
        ctx.drawImage(A.img, il, 0, w, h);
        /* v0.8.13 寬螢幕／切場景鏡頭拉遠時，畫面會超出背景左右邊界露出黑底：左右各接一張鏡像背景補滿 */
        ctx.save(); ctx.translate(il, 0); ctx.scale(-1, 1); ctx.drawImage(A.img, 0, 0, w, h); ctx.restore();
        ctx.save(); ctx.translate(il + 2 * w, 0); ctx.scale(-1, 1); ctx.drawImage(A.img, 0, 0, w, h); ctx.restore();
        drawArenaLayers(camX, stageId, "bg"); /* M2 分層場景：中景、地面等背景層（暗化前畫，一起被暗化） */
        ctx.fillStyle = `rgba(8, 14, 38, ${stBg.bgDim === undefined ? 0.4 : stBg.bgDim})`;
        ctx.fillRect(cx - 1400, 0, Config.baseWidth + 2800, h + 200);
        return true;
      }

      /* M2 分層場景（空洞騎士／奧日式視差）：Stages[n].layers = [{ img:"arena1_mid", par:0.5, y:0, h:720, fg:false, alpha:1, dim:0 }]
         img → assets/bg/<名>.webp（透明 webp，橫向可無縫接）；par 視差（0＝不動的天空、1＝跟地面同速、>1＝前景比角色快）；
         y／h 圖在世界座標的上緣與高度（寬依原圖比例）；fg:true 畫在角色前面（前景剪影，建議 alpha 0.85～1、只放畫面下緣）；
         dim 該層再加暗（前景常用 0.15～0.3 拉開景深）。沒有 layers 的關卡畫面不變。 */
      function arenaHasGround(stageId) { const st = Stages[stageId]; return !!(st && st.layers && st.layers.some((L) => L.ground && getBgArt(L.img).ok)); }
      function drawArenaLayers(camX, stageId, pass) { /* pass：bg 背景層／ground 地面層（取代共用地面帶）／fg 前景層 */
        const st = Stages[stageId]; if (!st || !st.layers) return;
        for (const L of st.layers) {
          if ((L.fg ? "fg" : L.ground ? "ground" : "bg") !== pass) continue;
          const A = getBgArt(L.img); if (!A.ok) continue;
          const h = L.h || Config.baseHeight, w = h * (A.img.naturalWidth / A.img.naturalHeight);
          const par = L.par == null ? 1 : L.par, y = L.y || 0;
          const off = camX * (1 - par); /* 世界座標的層原點 */
          const x0 = camX - 1400, x1 = camX + Config.baseWidth + 1400;
          let x = off + Math.floor((x0 - off) / w) * w;
          ctx.save();
          ctx.globalAlpha = L.alpha == null ? 1 : L.alpha;
          if (L.dim) ctx.filter = `brightness(${(1 - L.dim).toFixed(2)})`;
          for (; x < x1; x += w) ctx.drawImage(A.img, x, y, w, h);
          ctx.restore();
        }
      }
