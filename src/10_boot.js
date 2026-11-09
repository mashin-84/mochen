  <script>
    (function () {
      "use strict";

      /* v0.7.8 圖片快取：assets/ 圖片網址一律加 ?v=版本，更新美術後不會讀到手機瀏覽器的舊快取（每次改圖就遞增 ASSET_VER） */
      const ASSET_VER = "@ASSET_HASH@"; /* v0.8.135 由 tools/build.py 依 assets/ 內容雜湊自動填入：只有圖片／音檔真的變了網址才換（原本每發一版全部換網址，手機要重載約 10 MB）。不必再手動遞增 */
      /* v0.8.156 共用圖片載入器 IMGQ：所有 assets/ 圖片（不論哪裡 new Image）都經過這裡。
       * - 先用隱藏的代理圖下載，成功才把網址交給真正的圖（此時從快取秒載、觸發原本的 onload）；
       *   下載中的圖沒有 src，畫出來不會丟錯（失敗狀態的圖 drawImage 會丟錯）。
       * - 同時最多 IMGQ_MAX 個下載；單次 20 秒沒回應視為失敗；失敗重試 3 次（0.6／1.2／1.8 秒後，網址加 &r=）；
       *   整輪都失敗就 6 秒後再來一輪；兩輪都失敗才對原圖發 error 事件（圖保持「沒有 src」，畫了也安全）。
       * - 同一網址只下載一次。IMGQ.pending() 給進場閘門用（v0.8.156 進戰場前等圖載完）。 */
      const ASSET_IMGS = new Set("@ASSET_LIST@".split(",")); /* v0.8.156 build.py 填入 assets 內全部 webp（"資料夾/檔名"） */
      const ASSET_DIRS = new Set([...ASSET_IMGS].map(s => s.split("/")[0]));
      const IMGQ_MAX = 12;
      const IMGQ = { q: [], active: 0, urls: {}, done: 0, total: 0, failed: 0, missing: [],
        pending() { let n = 0; for (const k in this.urls) { const u = this.urls[k]; if (u.st === 0) n++; } return n; },
        mark() { this.done = 0; this.total = this.pending(); this.failed = 0; } };
      (function () {
        const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
        if (!d || !d.set) return;
        const pump = () => {
          while (IMGQ.active < IMGQ_MAX && IMGQ.q.length) {
            const u = IMGQ.q.shift();
            IMGQ.active++;
            const px = new Image(); let fin = false;
            const end = (ok) => {
              if (fin) return; fin = true; clearTimeout(tm); IMGQ.active--;
              if (ok) {
                u.st = 1; u.ok = u.try ? u.url + "&r=" + u.try : u.url; IMGQ.done++;
                u.els.forEach(el => { if (el.__want === u.url) d.set.call(el, u.ok); }); u.els.length = 0;
              } else if (u.try % 4 < 3) { u.try++; setTimeout(() => { IMGQ.q.push(u); pump(); }, 600 * (u.try % 4)); }
              else if (u.try < 4) { u.try++; setTimeout(() => { IMGQ.q.push(u); pump(); }, 6000); }
              else {
                u.st = 2; IMGQ.done++; IMGQ.failed++; console.warn("Failed to load: " + u.url);
                u.els.forEach(el => { if (el.__want === u.url) el.dispatchEvent(new Event("error")); }); u.els.length = 0;
              }
              pump();
            };
            const tm = setTimeout(() => { d.set.call(px, ""); end(false); }, 20000);
            px.onload = () => end(px.naturalWidth > 0);
            px.onerror = () => end(false);
            d.set.call(px, u.try ? u.url + "&r=" + u.try : u.url);
          }
        };
        Object.defineProperty(HTMLImageElement.prototype, "src", {
          configurable: true, enumerable: d.enumerable,
          get() { const s = d.get.call(this); return s || this.__want || s; },
          set(v) {
            if (typeof v !== "string" || v.indexOf("assets/") !== 0) { this.__want = null; d.set.call(this, v); return; }
            v = v.replace(/[?&]r=\d+/, ""); /* 舊的各處重試網址一律收回同一筆 */
            if (v.indexOf("?") < 0) v += "?v=" + ASSET_VER;
            this.__want = v;
            let u = IMGQ.urls[v];
            if (!u) {
              const m = /^assets\/(.+)\.webp\?/.exec(v);
              if (m && ASSET_IMGS.size > 1 && !ASSET_IMGS.has(m[1])) { u = IMGQ.urls[v] = { url: v, st: 2, try: 0, els: [], ok: null }; IMGQ.missing.push(v.split("?")[0]); } /* 不存在的圖不發請求、直接算失敗（smoke 讀 IMGQ.missing 報缺圖） */
              else { u = IMGQ.urls[v] = { url: v, st: 0, try: 0, els: [], ok: null }; IMGQ.total++; IMGQ.q.push(u); }
            }
            if (u.st === 1) { d.set.call(this, u.ok); return; }
            if (u.st === 2) { const el = this; setTimeout(() => el.dispatchEvent(new Event("error")), 0); return; }
            if (u.els.indexOf(this) < 0) u.els.push(this);
            pump();
          }
        });
      })();
