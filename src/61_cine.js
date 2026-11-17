      /* v0.8.210 舊影片過場與剪影登場（CINE／playMovie／startBossCine）已刪除：九關都用 54_director.js 的戰場演出。這裡只留剪影快取、名牌圖與名牌繪製。 */
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
      const CINE_IMG = { bg: {}, name: {} };
      function getCineImg(kind, path) {
        if (!CINE_IMG[kind][path]) { const o = { ok: false, img: new Image() }; o.img.onload = () => { o.ok = true; }; o.img.src = path; CINE_IMG[kind][path] = o; }
        return CINE_IMG[kind][path];
      }
      /* 名字卡（書法圖，疊加發光）；圖沒載入就退回 DOM 橫幅 */
      function bossNameCard(st, opts) {
        const o = st.introName ? getCineImg("name", st.introName) : null;
        if (o && o.ok) Game.nameCard = { t0: performance.now(), dur: (opts && opts.dur) || 2000, img: o.img, sub: (opts && opts.sub) || st.realmBadge, slam: !!(opts && opts.slam), slide: !!(opts && opts.slide), tin: ((opts && opts.tin) || 0.22) * 1000, hold: ((opts && opts.hold) || 0.85) * 1000, tout: ((opts && opts.tout) || 0.3) * 1000, d0: Game.dir ? Game.dir.t : 0 };
        else showBanner(st.name, st.realmBadge, 1500, "#fde68a");
      }
      /* v0.8.111 名牌從左快速滑進 → 停留 → 往右飛走（以導演時間為準，世界暫停時它照走）；不畫黑底，疊加發光，移動時拖三道殘影 */
      function drawNameSlide(w, h, nc) {
        const ms = Game.dir ? (Game.dir.t - nc.d0) * 1000 : performance.now() - nc.t0;
        if (ms > nc.tin + nc.hold + nc.tout) { Game.nameCard = null; return; }
        const iw = Math.min(w * 0.56, h * 1.6), ih = iw * nc.img.height / nc.img.width, cy = h * 0.5; /* v0.8.112 名牌置中（可蓋到敵人） */
        const off = w / 2 + iw * 0.75;
        let px, mv = 0;
        if (ms < nc.tin) { const k = ms / nc.tin; px = w / 2 - off * Math.pow(1 - k, 3); mv = 1 - k; }
        else if (ms < nc.tin + nc.hold) px = w / 2 + ((ms - nc.tin) / nc.hold - 0.5) * 16;
        else { const k = (ms - nc.tin - nc.hold) / nc.tout; px = w / 2 + off * k * k * k; mv = k; }
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (let i = 3; i >= 1; i--) { const gx = px - Math.sign(mv) * mv * i * 38; if (mv > 0.05) { ctx.globalAlpha = 0.22 / i; ctx.drawImage(nc.img, gx - iw / 2, cy - ih / 2, iw, ih); } }
        ctx.globalAlpha = 1; ctx.drawImage(nc.img, px - iw / 2, cy - ih / 2, iw, ih);
        ctx.globalCompositeOperation = "source-over";
        if (nc.sub) {
          ctx.font = `700 ${Math.round(h * 0.04)}px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`; ctx.textAlign = "center";
          ctx.fillStyle = "#fde68a"; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8;
          ctx.fillText(String(nc.sub).split("").join(" "), px, cy + ih / 2 + h * 0.035);
        }
        ctx.restore();
      }
      function drawNameCard(w, h) {
        const nc = Game.nameCard; if (!nc) return;
        if (nc.slide) { drawNameSlide(w, h, nc); return; }
        const e = performance.now() - nc.t0;
        if (e > nc.dur) { Game.nameCard = null; return; }
        const aIn = Math.min(1, e / 200), aOut = Math.min(1, (nc.dur - e) / 600), a = Math.min(aIn, aOut);
        let pop = 1 + 0.12 * (1 - Math.min(1, e / 260)) * (1 - Math.min(1, e / 260)), sx = 0, sy = 0, a2 = a;
        if (nc.slam) { /* v0.8.106 蓋章：2.6 倍快速砸到 1.0，過衝回彈，附震動（戴夫式 Boss 登場字卡） */
          pop = e < 140 ? 2.6 - 1.6 * (e / 140) * (e / 140) : 1 + 0.09 * Math.sin((e - 140) / 80) * Math.exp(-(e - 140) / 170);
          const sh = Math.max(0, 1 - e / 320) * 16; sx = (Math.random() - 0.5) * sh; sy = (Math.random() - 0.5) * sh;
          a2 = Math.min(a, Math.min(1, e / 50));
        }
        const iw = Math.min(w * 0.5, h * 1.5) * pop, ih = iw * nc.img.height / nc.img.width, cy = h * 0.25;
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a2;
        ctx.drawImage(nc.img, w / 2 - iw / 2 + sx, cy - ih / 2 + sy, iw, ih);
        ctx.globalCompositeOperation = "source-over";
        if (nc.sub) {
          ctx.globalAlpha = a * Math.min(1, Math.max(0, (e - 250) / 250));
          ctx.font = `700 ${Math.round(h * 0.038)}px 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`; ctx.textAlign = "center";
          ctx.fillStyle = "#fde68a"; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8;
          ctx.fillText(String(nc.sub).split("").join(" "), w / 2, cy + ih / 2 + h * 0.03);
        }
        ctx.restore();
      }
