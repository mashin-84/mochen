/* 墨塵傳 PWA Service Worker（v0.8.221）
 * 頁面（index.html）：網路優先——有網路一定拿最新版，離線才用快取（測試時不會卡在舊版）。
 * assets/：快取優先——網址帶 ?v=<內容雜湊>，內容一變網址就變，舊快取自然不會被用到。
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
  if (req.headers.get("range")) return; /* 影音分段請求交給瀏覽器 */
  if (url.origin === location.origin && url.pathname.includes("/assets/")) {
    e.respondWith(caches.open(ASSETS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok && res.status === 200) c.put(req, res.clone()); return res; }))));
    return;
  }
  e.respondWith(fetch(req).then((res) => {
    if (res.ok && (req.mode === "navigate" || url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com"))) { const cp = res.clone(); caches.open(PAGE).then((c) => c.put(req, cp)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("./") : undefined))));
});
