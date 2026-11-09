/* 九關自動對打測試（M0）
 * 用法：node tools/smoke.js [index.html] [每關秒數=20] [關卡=1-9，例 1,5]
 * 做法：複製一份掛了除錯鉤子的 index.html 到暫存資料夾（assets 用連結），內建靜態伺服器，
 *       Playwright 以手機橫向尺寸載入，每關跳過對話與登場動畫後，用鍵盤亂數操作（移動／普攻／招架／瞬步／跳躍）對打。
 * 檢查：頁面錯誤、座標或血量變成 NaN、Boss 卡在同一狀態太久、Boss 招式不輪替、主角卡在非站立狀態太久。
 * 輸出：每關一行結果，截圖存 /home/claude/smoke/s<關>.png；有任何 FAIL 時結束碼為 1。 */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const { chromium } = require('playwright');

const file = path.resolve(process.argv[2] || 'index.html');
const secs = Number(process.argv[3] || 20);
const stages = (process.argv[4] || '1,2,3,4,5,6,7,8,9').split(',').map(Number);
const root = path.dirname(file);
const outDir = process.env.SMOKE_OUT || '/home/claude/smoke';
fs.mkdirSync(outDir, { recursive: true });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-'));
let html = fs.readFileSync(file, 'utf8');
const anchor = 'window.onload = function () {';
if (html.split(anchor).length !== 2) { console.log('找不到唯一的 window.onload 鉤點'); process.exit(1); }
html = html.replace(anchor, 'window.__B=Boss;window.__P=Player;window.__G=Game;window.__L=loadStage;window.__PR=Progress;window.__S=Stages;window.__DLG=DLG;window.__IMGQ=IMGQ;\n      ' + anchor);
fs.writeFileSync(path.join(tmp, 'index.html'), html);
fs.symlinkSync(path.join(root, 'assets'), path.join(tmp, 'assets'));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webm': 'video/webm', '.mp4': 'video/mp4', '.json': 'application/json' };
const missing = new Set(); /* v0.8.89 讀不到的 assets/ 檔案（缺圖、缺音效）一律記下，最後算 FAIL */
const server = http.createServer((req, res) => {
  const p = path.join(tmp, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (err, data) => {
    if (err) { if (req.url.startsWith('/assets/')) missing.add(req.url.split('?')[0]); res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForTimeout(2500);
  let failed = 0;
  const keys = ['KeyA', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'Space'];
  for (const sid of stages) {
    const e0 = errs.length;
    await page.evaluate((sid) => { const sm = document.getElementById('settlement-modal'); if (sm) sm.classList.remove('open'); __G.cutsceneActive = false; __PR.unlockedStages = 9; __L(sid); }, sid);
    const stat = { moves: new Set(), nan: 0, bossStuck: 0, playerStuck: 0, modes: new Set(), minHp: Infinity, lastBoss: '', bossSince: 0, lastP: '', pSince: 0 };
    const t0 = Date.now();
    let held = null;
    while (Date.now() - t0 < secs * 1000) {
      const s = await page.evaluate(() => {
        const sk = document.querySelector('#dlg-skip');
        if (sk && sk.offsetParent) sk.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        if (__G.cine) __G.cine.t = 999;
        return { won: /\bopen\b/.test((document.getElementById('settlement-modal') || {}).className || ''), aer: !!((__S[__B.stageId].moves || {})[__B.moveType] || {}).isAerial, mode: __G.mode, bs: __B.state, mv: __B.moveType, bx: __B.x, by: __B.y, hp: __B.hp, px: __P.x, py: __P.y, php: __P.hp, ps: __P.state, dlg: __DLG.active };
      });
      const now = Date.now();
      if (s.won) { stat.won = true; break; } /* v0.8.65 打贏（結算畫面已開）就結束本關；原本會把結算時主角不動誤報成「主角卡住」 */
      stat.modes.add(s.mode);
      if ([s.bx, s.by, s.hp, s.px, s.py, s.php].some(v => typeof v === 'number' && Number.isNaN(v))) stat.nan++;
      if (s.mode === 'battle' && !s.dlg) {
        if (s.mv) stat.moves.add(s.mv);
        if (typeof s.hp === 'number') stat.minHp = Math.min(stat.minHp, s.hp);
        if (s.bs !== stat.lastBoss) { stat.lastBoss = s.bs; stat.bossSince = now; } else if (now - stat.bossSince > (s.aer ? 13000 : 9000) && s.bs !== 'idle' && s.bs !== 'chase') stat.bossStuck++;
        const pBusy = s.ps && s.ps !== 'idle' && s.ps !== 'move';
        if (s.ps !== stat.lastP) { stat.lastP = s.ps; stat.pSince = now; } else if (pBusy && now - stat.pSince > 6000) stat.playerStuck++;
      }
      if (held) { await page.keyboard.up(held); held = null; }
      const k = keys[Math.floor(Math.random() * keys.length)];
      await page.keyboard.down(k);
      if (k === 'KeyA' || k === 'KeyD') held = k; else { await page.waitForTimeout(40); await page.keyboard.up(k); }
      await page.waitForTimeout(160);
    }
    if (held) await page.keyboard.up(held);
    await page.screenshot({ path: `${outDir}/s${sid}.png` });
    const newErr = errs.slice(e0);
    const probs = [];
    if (newErr.length) probs.push(`頁面錯誤 ${newErr.length}：${newErr[0]}`);
    if (stat.nan) probs.push('出現 NaN');
    if (stat.bossStuck) probs.push(`Boss 卡在「${stat.lastBoss}」`);
    if (stat.playerStuck) probs.push(`主角卡在「${stat.lastP}」`);
    if (!stat.modes.has('battle')) probs.push('沒有進入戰鬥');
    else if (stat.moves.size < 2) probs.push(`招式只出現 ${stat.moves.size} 種`);
    if (probs.length) failed++;
    console.log(`${probs.length ? 'FAIL' : 'ok  '} 第 ${sid} 關${stat.won ? '（擊敗）' : ''}｜招式 ${stat.moves.size} 種｜Boss 最低血量 ${stat.minHp === Infinity ? '-' : Math.round(stat.minHp)}${probs.length ? '｜' + probs.join('；') : ''}`);
  }
  try { (await page.evaluate(() => (window.__IMGQ && __IMGQ.missing) || [])).forEach(u => missing.add('/' + u)); } catch (e) { } /* v0.8.156 IMGQ 不對不存在的圖發請求，改從它的清單收 */
  await b.close(); server.close();
  /* tools/missing_ok.txt 列的是「還沒做、程式會自動退回替代圖」的檔案（例：還沒生的半身像、走路影片），只提示不算 FAIL */
  const okFile = path.join(__dirname, 'missing_ok.txt');
  const okSet = new Set(fs.existsSync(okFile) ? fs.readFileSync(okFile, 'utf8').split(/\r?\n/).map(x => x.trim()).filter(x => x && !x.startsWith('#')) : []);
  const newMiss = [...missing].filter(x => !okSet.has(x)).sort();
  if (newMiss.length) { failed++; console.log(`FAIL 缺檔 ${newMiss.length} 個：${newMiss.join('、')}`); }
  if (missing.size - newMiss.length) console.log(`（已知未製作 ${missing.size - newMiss.length} 個，見 tools/missing_ok.txt）`);
  console.log(failed ? `SMOKE FAIL ${failed} 關` : `SMOKE OK ${stages.length} 關，截圖在 ${outDir}/`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.log('SMOKE ERROR', e.message); process.exit(1); });
