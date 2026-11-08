/* 特效／音效盲點檢查（v0.8.122）：逐招觸發某關 Boss 的每一招，報告「用了哪些生圖特效、有沒有程式畫的刀弧、投射物是否有圖、有沒有專屬音效、瞬移有沒有現身消失圖」。
 * 用法：NODE_PATH=$(npm root -g) node tools/audit_fx.js index.html 1,2,3   （預設第 1 關）
 * 每一招都重新載入關卡，避免上一招的特效殘留。標 ⚠ 的就是還沒生圖／沒音效的地方（每關完成定義要清零）。 */
const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), path = require('path');
(async () => {
  const file = process.argv[2] || 'index.html', stages = (process.argv[3] || '1').split(',').map(Number);
  const root = path.resolve(path.dirname(file));
  let html = fs.readFileSync(file, 'utf8').replace('window.onload = function () {', 'window.__B=Boss;window.__P=Player;window.__G=Game;window.__L=loadStage;window.__Pr=Progress;window.__T=triggerBossMove;window.__S=Stages;window.onload = function () {');
  const tmp = path.join(root, '__audit_tmp.html'); fs.writeFileSync(tmp, html);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.webm': 'video/webm', '.mp4': 'video/mp4', '.png': 'image/png', '.css': 'text/css', '.json': 'application/json' };
  const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); }).listen(0);
  const port = srv.address().port;
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${port}/__audit_tmp.html`); await pg.waitForTimeout(1500);
  let warn = 0;
  for (const sid of stages) {
    console.log(`\n===== 第 ${sid} 關 =====`);
    await pg.evaluate(s => { __Pr.unlockedStages = 9; __L(s, { skipPre: true }); }, sid); await pg.waitForTimeout(1600);
    const info = await pg.evaluate(() => ({ keys: Object.keys(__S[__B.stageId].moves), sfx: !!__S[__B.stageId].sfx, bulletArts: Object.keys(__S[__B.stageId].bulletArts || {}), flySwordArt: !!__S[__B.stageId].flySwordArt, sfxClass: __S[__B.stageId].sfxClass || null, tpSfx: !!(__S[__B.stageId].sfx && __S[__B.stageId].sfx.tpOut), arcArt: __S[__B.stageId].arcArt || null }));
    for (const k of info.keys) {
      await pg.evaluate(s => { __L(s, { skipPre: true }); }, sid); await pg.waitForTimeout(700);
      const meta = await pg.evaluate(k => {
        __G.cutsceneActive = false; __G.dlgFocus = false; __G.pendingPre = false; document.querySelectorAll('[id^=dlg]').forEach(e => e.style.display = 'none');
        __B.state = 'idle'; __B.stateTimer = 0; __B.aiCooldown = 99; __B.x = 1500; __P.x = 1280; __P.invulnTimer = 99; __P.hp = 1000; __G.slashArcs = []; __G.fxList = [];
        const m = __S[__B.stageId].moves[k]; __T(k);
        return { dmg: !!(m.damage || m.isCombo || m.isRanged || m.isZone), ranged: !!m.isRanged, kind: m.bulletKind || null, tele: !!m.isTeleport, mob: !!m.isMobility, sfx: !!m.sfx, sfxInfo: m.sfx ? (m.sfx.auto ? '類別自動:' + (m.sfx.a || m.sfx.h) : '專屬:' + (m.sfx.a || m.sfx.h || m.sfx.w)) : '', fxAct: !!(m.fxAct || m.fxHit), vanish: !!((m.fxVanish && m.fxAppear) || m.tpFx), name: m.name };
      }, k);
      const res = await pg.evaluate(() => new Promise(r => { const o = { arcNo: 0, arcArt: 0, fx: {}, proj: {} }; let n = 0; const iv = setInterval(() => { (__G.slashArcs || []).forEach(a => a.art ? o.arcArt++ : o.arcNo++); (__G.fxList || []).forEach(f => o.fx[(f.sheet.name || f.sheet) + ':' + f.row] = 1); (__G.flyingSwords || []).forEach(s => o.proj[s.kind || 'sword'] = 1); if (++n > 80) { clearInterval(iv); r(o); } }, 25); }));
      const w = [];
      if (res.arcNo > 0) w.push('程式畫刀弧');
      Object.keys(res.proj).forEach(kd => { const art = kd === 'sword' ? info.flySwordArt : info.bulletArts.includes(kd); if (!art) w.push(`投射物「${kd}」程式畫`); });
      if (meta.tele && !meta.vanish) w.push('瞬移沒有消失／現身圖（fxVanish／fxAppear）');
      if (meta.mob && !meta.fxAct) w.push('位移招沒有拖尾／煙塵圖（fxAct）');
      if (meta.dmg && !meta.sfx && !(meta.tele && (info.sfxClass || info.tpSfx))) w.push('沒有音效（沒配到武器類別，也沒有專屬音效）');
      const projArt = Object.keys(res.proj).some(kd => kd === 'sword' ? info.flySwordArt : info.bulletArts.includes(kd));
      if (!Object.keys(res.fx).length && !projArt && meta.dmg) w.push('沒有任何生圖特效');
      warn += w.length;
      console.log(`${k.padEnd(18)} ${meta.name}${meta.sfxInfo ? '　［' + meta.sfxInfo + '］' : ''}\n    特效圖：${Object.keys(res.fx).join(', ') || '—'}${Object.keys(res.proj).length ? '　投射物：' + Object.keys(res.proj).join(',') : ''}${w.length ? '\n    ⚠ ' + w.join('；') : '\n    ✔'}`);
    }
  }
  console.log(`\n共 ${warn} 個盲點。` + (errs.length ? '\n頁面錯誤：' + errs.join(' | ') : ''));
  await b.close(); srv.close(); try { fs.unlinkSync(tmp); } catch (e) { }
})();
