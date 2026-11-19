      /* =========================================================================
       * v0.8.21 暫停：縮小遊戲、切到別的畫面（分頁隱藏／視窗失焦）時，遊戲與音樂完全暫停；
       * 回來時顯示選單（繼續／重新挑戰／退出戰鬥回營地）。
       * ========================================================================= */
      const elPause = document.createElement("div");
      elPause.id = "pause-menu";
      elPause.style.cssText = "position:fixed;inset:0;z-index:400;display:none;background:rgba(3,6,16,.8);align-items:center;justify-content:center;font-family:'Noto Serif TC',serif;";
      const PB = "display:block;width:100%;margin-top:10px;padding:11px 14px;border-radius:999px;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer;";
      elPause.innerHTML =
        '<div style="width:min(78vw,340px);padding:22px 24px 20px;border:1.5px solid rgba(250,204,21,.55);border-radius:14px;background:rgba(8,12,24,.97);text-align:center;color:#f1f5f9;box-shadow:0 10px 40px rgba(0,0,0,.7);">' +
        '<div style="font-size:22px;font-weight:900;color:#fde68a;letter-spacing:.4em;margin-bottom:4px;">暫　停</div>' +
        '<div style="font-size:13px;color:#94a3b8;margin-bottom:8px;">遊戲與音樂已暫停</div>' +
        '<button id="pause-resume" type="button" style="' + PB + 'border:1px solid rgba(250,204,21,.7);background:#78350f;color:#fef3c7;">繼續戰鬥</button>' +
        '<button id="pause-retry" type="button" style="' + PB + 'border:1px solid rgba(148,163,184,.5);background:rgba(30,41,59,.9);color:#e2e8f0;">重新挑戰</button>' +
        '<button id="pause-quit" type="button" style="' + PB + 'border:1px solid rgba(248,113,113,.5);background:rgba(69,10,10,.85);color:#fecaca;">退出戰鬥（回營地）</button>' +
        '</div>';
      document.body.appendChild(elPause);
      const elPRetry = elPause.querySelector("#pause-retry"), elPQuit = elPause.querySelector("#pause-quit"), elPResume = elPause.querySelector("#pause-resume");
      let pauseConfirm = null, pauseConfirmTimer = 0;
      function pauseResetConfirm() {
        pauseConfirm = null; clearTimeout(pauseConfirmTimer);
        elPRetry.textContent = "重新挑戰"; elPQuit.textContent = "退出戰鬥（回營地）";
      }
      function pauseGame() {
        if (Game.paused && !Game._menuPause) return;
        Game._menuPause = false;
        Game.paused = true; Game._pauseT0 = performance.now();
        try { clearAllInputStates(); } catch (e) { }
        Music.pauseAll();
        try { if (Sound.ctx && Sound.ctx.state === "running") Sound.ctx.suspend(); } catch (e) { }
        const inBattle = Game.mode === "battle";
        elPResume.textContent = inBattle ? "繼續戰鬥" : "繼續遊戲";
        elPRetry.style.display = inBattle ? "block" : "none"; elPQuit.style.display = inBattle ? "block" : "none";
        pauseResetConfirm();
        elPause.style.display = "flex";
      }
      function resumeGame() {
        if (!Game.paused) return;
        const dur = performance.now() - (Game._pauseT0 || performance.now());
        Game.paused = false;
        if (Progress.battleStartTime) Progress.battleStartTime += dur; /* 戰鬥計時不含暫停時間 */
        elPause.style.display = "none"; pauseResetConfirm();
        lastTime = performance.now();
        try { Sound.resume(); } catch (e) { }
        Music.resumeAll();
      }
      function pauseDoubleTap(btn, key, label, action) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (pauseConfirm === key) { action(); return; }
          pauseResetConfirm(); pauseConfirm = key; btn.textContent = "再按一次確認" + label;
          pauseConfirmTimer = setTimeout(pauseResetConfirm, 2500);
        });
      }
      function pauseLeaveBattle() { if (DLG.active) dlgFinish(); Game.nameCard = null; }
      elPResume.addEventListener("click", (e) => { e.stopPropagation(); resumeGame(); });
      pauseDoubleTap(elPRetry, "retry", "重打", () => { const sid = Boss.stageId; resumeGame(); pauseLeaveBattle(); loadStage(sid, { skipPre: true }); });
      pauseDoubleTap(elPQuit, "quit", "退出", () => { const sid = Boss.stageId; resumeGame(); pauseLeaveBattle(); Game.defeated = false; returnToHub(sid); });
      document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });
      window.addEventListener("blur", () => { pauseGame(); });
      window.addEventListener("keydown", (e) => { if (e.code === "KeyP" && !e.repeat) { if (Game.paused) resumeGame(); else pauseGame(); } });

            // Consolidated System Menu Listeners
      const elSysMenuModal = document.getElementById("system-menu-modal");
      const btnOpenSysMenu = document.getElementById("btn-open-sys-menu");
      const btnCloseSysMenu = document.getElementById("btn-close-sys-menu");

      if (btnOpenSysMenu) {
        btnOpenSysMenu.addEventListener("click", () => {
          if (elSysMenuModal) elSysMenuModal.classList.add("open");
        });
      }
      /* v0.8.220 齒輪選單開著時遊戲暫停（不顯示暫停畫面）；選單一關（含按選單裡的功能）就自動繼續 */
      function menuPause(on) {
        if (on) {
          if (Game.paused) return;
          Game.paused = true; Game._menuPause = true; Game._pauseT0 = performance.now();
          try { clearAllInputStates(); } catch (e) { }
          Music.pauseAll(); try { if (Sound.ctx && Sound.ctx.state === "running") Sound.ctx.suspend(); } catch (e) { }
        } else if (Game._menuPause) {
          Game._menuPause = false; resumeGame();
        }
      }
      if (elSysMenuModal && window.MutationObserver) { /* v0.8.239 天機演武抽屜開著也維持暫停 */
        const elDrawer = document.getElementById("scroll-drawer");
        const sync = () => menuPause(elSysMenuModal.classList.contains("open") || !!(elDrawer && elDrawer.classList.contains("open")));
        const mo = new MutationObserver(sync); mo.observe(elSysMenuModal, { attributes: true, attributeFilter: ["class"] }); if (elDrawer) mo.observe(elDrawer, { attributes: true, attributeFilter: ["class"] });
      }

      if (btnCloseSysMenu) {
        btnCloseSysMenu.addEventListener("click", () => {
          if (elSysMenuModal) elSysMenuModal.classList.remove("open");
        });
      }

      const btnMenuStory = document.getElementById("btn-story");
      if (btnMenuStory) {
        btnMenuStory.addEventListener("click", () => {
          if (elSysMenuModal) elSysMenuModal.classList.remove("open");
          showStoryDialog("pre_battle");
        });
      }

      const btnMenuChapters = document.getElementById("btn-chapter-list");
      if (btnMenuChapters) {
        btnMenuChapters.addEventListener("click", () => {
          if (elSysMenuModal) elSysMenuModal.classList.remove("open");
          renderChapterList();
          elChapterListModal.classList.add("open");
        });
      }

      const btnMenuPractice = document.getElementById("btn-drawer-toggle");
      if (btnMenuPractice) {
        btnMenuPractice.addEventListener("click", () => {
          if (elSysMenuModal) elSysMenuModal.classList.remove("open");
          if (drawer) drawer.classList.add("open");
        });
      }

      const btnMenuParryCue = document.getElementById("btn-parry-cue");
      const menuParryCueTxt = document.getElementById("menu-parry-cue-txt");
      const cueTexts = ["格擋提示：關", "格擋提示：弱", "格擋提示：強"];
      if (menuParryCueTxt) menuParryCueTxt.textContent = cueTexts[Config.parryCueLevel];
      if (btnMenuParryCue) {
        btnMenuParryCue.addEventListener("click", () => {
          Config.parryCueLevel = (Config.parryCueLevel + 1) % 3;
          menuParryCueTxt.textContent = cueTexts[Config.parryCueLevel];
          try { localStorage.setItem("qingyun_parry_cue", Config.parryCueLevel); } catch (e) {}
        });
      }

      { /* v0.8.237 手感調參面板（開著時齒輪選單保持開啟＝遊戲維持暫停） */
        Tune.apply();
        const b = document.getElementById("btn-tune"), t = document.getElementById("menu-tune-txt");
        const sync = () => { if (t) t.textContent = "手感調參" + (Tune.changed() ? "（已改 " + Tune.changed() + " 項）" : ""); };
        sync();
        if (b) b.addEventListener("click", () => { Tune.open(); });
        document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#tune-panel")) setTimeout(sync, 0); });
      }
      { /* v0.8.239 護心輔助開關 */
        const b = document.getElementById("btn-easy"); Easy.set(Easy.on);
        if (b) b.addEventListener("click", () => Easy.set(!Easy.on));
      }
      { /* v0.8.220 整體音量：大→中→小→極小 循環 */
        const b = document.getElementById("btn-volume"), t = document.getElementById("menu-volume-txt");
        const sync = () => { if (t) t.textContent = "整體音量：" + Sound.LEVEL_NAMES[Sound.levelIdx]; };
        sync();
        if (b) b.addEventListener("click", () => { Sound.setLevel(Sound.levelIdx + 1); sync(); });
      }
      const btnMenuHaptic = document.getElementById("btn-haptic");
      const menuHapticTxt = document.getElementById("menu-haptic-txt");
      const hapticTexts = ["震動回饋：關", "震動回饋：弱", "震動回饋：強"];
      if (menuHapticTxt) menuHapticTxt.textContent = hapticTexts[Config.hapticLevel] || hapticTexts[2];
      if (btnMenuHaptic) {
        btnMenuHaptic.addEventListener("click", () => {
          Config.hapticLevel = (Config.hapticLevel + 1) % 3;
          menuHapticTxt.textContent = hapticTexts[Config.hapticLevel];
          try { localStorage.setItem("qingyun_haptic", Config.hapticLevel); } catch (e) {}
          hapticBuzz(40);
        });
      }

      const btnUltTest = document.getElementById("btn-ult-test"); /* v0.8.163 大招測試：選關直接進二階段放招牌大招 */
      if (btnUltTest) btnUltTest.addEventListener("click", () => { if (elSysMenuModal) elSysMenuModal.classList.remove("open"); openUltTestMenu(); });

      const btnTestAll = document.getElementById("btn-testall");
      const menuTestAllTxt = document.getElementById("menu-testall-txt");
      if (menuTestAllTxt) menuTestAllTxt.textContent = TestAll.on ? "測試全解鎖：開" : "測試全解鎖：關";
      if (btnTestAll) {
        btnTestAll.addEventListener("click", () => {
          TestAll.on = !TestAll.on;
          try { localStorage.setItem("qingyun_testall", TestAll.on ? "1" : "0"); } catch (e) { }
          refreshUnlocked();
          menuTestAllTxt.textContent = TestAll.on ? "測試全解鎖：開" : "測試全解鎖：關";
          renderChapterList();
        });
      }

      const btnMenuAudio = document.getElementById("btn-audio-toggle");
      const menuAudioTxt = document.getElementById("menu-audio-txt");
      if (btnMenuAudio) {
        btnMenuAudio.addEventListener("click", () => {
          Sound.muted = !Sound.muted;
          if (menuAudioTxt) menuAudioTxt.textContent = Sound.muted ? "音效：已靜音" : "音效：開啟中";
          spawnFloatingText(Player.x, Player.y - 110, Sound.muted ? "🔇 已靜音" : "🔊 音效已開啟", "#a7f3d0", 1.1);
        });
      }

      const btnMenuFullscreen = document.getElementById("btn-fullscreen");
      if (btnMenuFullscreen) {
        btnMenuFullscreen.addEventListener("click", () => {
          if (elSysMenuModal) elSysMenuModal.classList.remove("open");
          requestFullscreenAndLockLandscape();
        });
      }

      const btnMenuRestart = document.getElementById("btn-restart");
      if (btnMenuRestart) {
        btnMenuRestart.addEventListener("click", () => {
          if (elSysMenuModal) elSysMenuModal.classList.remove("open");
          if (Game.mode === "hub") returnToHub(Boss.stageId);
          else loadStage(Boss.stageId, { skipPre: true });
        });
      }

      // ---- 卷三通關回響持久化 (v0.4.1 補上遺失定義) ----
      function savePersistedEchoes() {
        try {
          localStorage.setItem("qingyun_echoes", JSON.stringify(Progress.echoes || []));
        } catch (e) {}
      }
      function loadPersistedEchoes() {
        try {
          const raw = localStorage.getItem("qingyun_echoes");
          const arr = raw ? JSON.parse(raw) : [];
          Progress.echoes = ECHOES_FROZEN ? [] : (Array.isArray(arr) ? arr.filter((n) => n >= 11 && n <= 14) : []); /* v0.8.185 通關回響封存：舊存檔的回響也不生效 */
        } catch (e) {
          Progress.echoes = [];
        }
      }

      /* v0.8.222 開頭預載：把 assets 全部檔案（圖、音效、配樂）下載存進 Cache（與 sw.js 共用 mochen-assets-v1），之後進任何關卡只從手機讀；
       * 第二次開啟只比對、缺的才下載（每檔各自版本，改一張圖只重抓那張）；同時清掉舊版本的快取。最後再等主角與營地圖解碼完才揭開。 */
      const BOOT_KEYS = ["hub_shimei_1", "hub_shimei_2", "hub_shimei_3", "hub_shimei_4", "hub_gate", "hub_gate_front", "hub_fire_base"];
      const BOOT_TIPS = ["完美招架：在光圈縮到最小的瞬間按【招架】，架勢條滿了就能處決。", "紅圈【危】：突刺可以看破，橫掃要跳，其他用瞬步閃開。", "淡藍盾圈＝霸體重招：看到就按住攻擊蓄力，等他出手前放開。", "按住攻擊蓄滿（劍發金光）再放開＝青雲蓄力斬。", "架勢見底時，防守類動作（完美招架、踏劍看破）才能補滿最後一段。", "齒輪選單可以調整整體音量；開著選單時遊戲會暫停。"];
      async function bootPreload(onProg) {
        const want = new Map(); let total = 0; AFILES.forEach(([rel, sz]) => { want.set(new URL(assetUrl(rel), location.href).href, sz); total += sz; });
        let done = 0, fail = 0, cache = null;
        try { if (window.caches) cache = await caches.open("mochen-assets-v1"); } catch (e) { cache = null; }
        const todo = [];
        if (cache) {
          let have = new Set();
          try { const ks = await cache.keys(); ks.forEach(r => { if (want.has(r.url)) have.add(r.url); else if (r.url.indexOf("/assets/") >= 0) cache.delete(r); }); } catch (e) { have = new Set(); }
          want.forEach((sz, u) => { if (have.has(u)) done += sz; else todo.push([u, sz]); });
        } else want.forEach((sz, u) => todo.push([u, sz]));
        onProg(done, total, todo.length, fail);
        let i = 0;
        const one = async ([u, sz]) => {
          for (let tr = 0; tr < 3; tr++) {
            try { const res = await fetch(u); if (!res.ok) throw 0; if (cache) await cache.put(u, res); else await res.arrayBuffer(); done += sz; onProg(done, total, todo.length - i, fail); return; }
            catch (e) { await new Promise(r => setTimeout(r, 500 * (tr + 1))); }
          }
          fail++; done += sz; onProg(done, total, todo.length - i, fail);
        };
        const worker = async () => { while (i < todo.length) { const it = todo[i++]; await one(it); } };
        await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
        return { total, fail, fetched: todo.length };
      }
      function bootGate() {
        const el = document.getElementById("boot-loading"); if (!el) return;
        const bar = document.getElementById("boot-bar"), pct = document.getElementById("boot-pct"), msg = document.getElementById("boot-msg"), sub = document.getElementById("boot-sub"), tip = document.getElementById("boot-tip");
        let ti = Math.floor(Math.random() * BOOT_TIPS.length); const nextTip = () => { if (tip) tip.textContent = "提示：" + BOOT_TIPS[ti++ % BOOT_TIPS.length]; }; nextTip(); const tipT = setInterval(nextTip, 3200);
        const MB = (b) => (b / 1048576).toFixed(1);
        const show = (p, m, s2) => { const v = Math.max(0, Math.min(100, Math.floor(p))); if (pct) pct.textContent = v + "%"; if (bar) bar.style.width = v + "%"; if (msg && m) msg.textContent = m; if (sub) sub.textContent = s2 || ""; };
        const reveal = () => { clearInterval(tipT); el.style.opacity = "0"; setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 500); };
        bootPreload((d, t, left, f) => show(95 * d / t, left > 0 ? "下載遊戲素材（只有第一次或更新時需要）" : "檢查素材完成", MB(d) + " / " + MB(t) + " MB" + (f ? "　（" + f + " 個檔案失敗，遊戲中會再試）" : "")))
          .then(() => {
            const t0 = performance.now();
            const tick = () => { /* 最後 5%：主角動作圖與營地圖解碼 */
              const okK = BOOT_KEYS.filter(k => BG_ART[k] && (BG_ART[k].ok || BG_ART[k].fail)).length;
              const k = (Math.min(MC_READY, 16) + okK) / (16 + BOOT_KEYS.length);
              show(95 + 5 * k, "整理畫面中…", "");
              if ((MC_READY >= 16 && okK === BOOT_KEYS.length) || performance.now() - t0 > 8000) { show(100, "完成", ""); setTimeout(reveal, 200); return; }
              setTimeout(tick, 100);
            };
            tick();
          })
          .catch(() => reveal());
      }
      window.onload = function () {
        BOOT_KEYS.forEach(getBgArt); fxSheet("campfire"); fxSheet("xtz"); fxSheet("xtz_star"); fxSheet("xtz_shield"); fxSheet("heal_fx"); fxSheet("peril_aura"); /* 玄天珠圖要在營地與第一場就能用 */ /* 師妹各姿勢一開始就載好（原本到那個姿勢才載，圖沒到就整個人消失） */
        bootGate();
        refreshUnlocked();
        loadAssistChoice(); /* 讀回營地選的玄天珠之力 */
        loadPersistedEchoes();
        initScenery();
        initScarf();
        let hs0 = 1;
        try { hs0 = parseInt(localStorage.getItem("qingyun_hubstage") || "1", 10) || 1; } catch (e) { }
        returnToHub(Math.max(1, Math.min(hs0, Progress.unlockedStages)));
        Game.cutsceneActive = false;
        testOrientation();
        resizeCanvas();
        if (raf) cancelAnimationFrame(raf);
        lastTime = performance.now();
        raf = requestAnimationFrame(loop);
        let seenPro = false;
        try { seenPro = localStorage.getItem("qingyun_prologue") === "1"; } catch (e) { }
        if (!seenPro) {
          setTimeout(() => {
            dlgStart([
              { speaker: "天道", role: "narrator", text: "青雲山，子時。後山的禁制已被九幽魔氣侵蝕，山下人間，劫火漸起。" },
              { speaker: "師妹", role: "shidi", text: "師兄，玄天珠一直在發燙……統領就守在山門之外，我們躲不過了。" },
              { speaker: "墨塵", role: "mochen", text: "躲不了，便闖過去。掌門引魔入山，今夜我必須帶你們離開。" },
              { speaker: "師妹", role: "shidi", text: "那我跟在師兄身邊。師兄……請務必小心。" },
              { speaker: "天道", role: "narrator", text: "（向右走進山門，便是第一難。）" }
            ], () => {
              try { localStorage.setItem("qingyun_prologue", "1"); } catch (e) { }
              hintOnce("hub_go", "向右走進山門，挑戰下一關");
            });
          }, 500);
        }
      };
    })();
      /* v0.8.221 PWA：註冊 Service Worker（可「加到主畫面」全螢幕開啟；頁面網路優先，不會卡舊版） */
      if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) { window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { }); }); }
