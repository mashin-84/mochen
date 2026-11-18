/* 墨塵傳 PWA Service Worker（v0.8.221；v0.8.222 配樂分段請求改從快取切）
 * 頁面（index.html）：網路優先——有網路一定拿最新版，離線才用快取（測試時不會卡在舊版）。
 * assets/：快取優先——網址帶 ?v=<該檔內容雜湊>（v0.8.222 起每檔各自），內容一變網址就變；開頭預載（91_main.js bootPreload）也寫進同一個快取並清掉舊版本。
 * 其他（字型等）：網路優先，失敗用快取。 */
const PAGE = "mochen-page-v1", ASSETS = "mochen-assets-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== PAGE && k !== ASSETS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isAsset = url.origin === location.origin && url.pathname.includes("/assets/");
  const range = req.headers.get("range");
  if (range) { /* v0.8.222 配樂（audio 分段請求）：快取裡有完整檔就切出那一段回 206，沒有才走網路 */
    if (!isAsset) return;
    e.respondWith(caches.open(ASSETS).then((c) => c.match(req.url)).then(async (hit) => {
      if (!hit) return fetch(req);
      const buf = await hit.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range) || [], size = buf.byteLength;
      const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], size - 1) : size - 1;
      return new Response(buf.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers: { "Content-Type": hit.headers.get("Content-Type") || "application/octet-stream", "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
    }).catch(() => fetch(req)));
    return;
  }
  if (isAsset) {
    e.respondWith(caches.open(ASSETS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok && res.status === 200) c.put(req, res.clone()); return res; }))));
    return;
  }
  e.respondWith(fetch(req).then((res) => {
    if (res.ok && (req.mode === "navigate" || url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com"))) { const cp = res.clone(); caches.open(PAGE).then((c) => c.put(req, cp)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("./") : undefined))));
});
