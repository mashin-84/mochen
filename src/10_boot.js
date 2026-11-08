  <script>
    (function () {
      "use strict";

      /* v0.7.8 圖片快取：assets/ 圖片網址一律加 ?v=版本，更新美術後不會讀到手機瀏覽器的舊快取（每次改圖就遞增 ASSET_VER） */
      const ASSET_VER = "@ASSET_HASH@"; /* v0.8.135 由 tools/build.py 依 assets/ 內容雜湊自動填入：只有圖片／音檔真的變了網址才換（原本每發一版全部換網址，手機要重載約 10 MB）。不必再手動遞增 */
      (function () {
        const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
        if (!d || !d.set) return;
        Object.defineProperty(HTMLImageElement.prototype, "src", {
          get: d.get, configurable: true, enumerable: d.enumerable,
          set(v) { if (typeof v === "string" && v.indexOf("assets/") === 0 && v.indexOf("?") < 0) v += "?v=" + ASSET_VER; d.set.call(this, v); }
        });
      })();
