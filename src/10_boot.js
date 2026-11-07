  <script>
    (function () {
      "use strict";

      /* v0.7.8 圖片快取：assets/ 圖片網址一律加 ?v=版本，更新美術後不會讀到手機瀏覽器的舊快取（每次改圖就遞增 ASSET_VER） */
      const ASSET_VER = "0.8.110";
      (function () {
        const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
        if (!d || !d.set) return;
        Object.defineProperty(HTMLImageElement.prototype, "src", {
          get: d.get, configurable: true, enumerable: d.enumerable,
          set(v) { if (typeof v === "string" && v.indexOf("assets/") === 0 && v.indexOf("?") < 0) v += "?v=" + ASSET_VER; d.set.call(this, v); }
        });
      })();
