      /* =========================================================================
       * 7. 輸入監聽與虛擬按鍵
       * ========================================================================= */
      window.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        const c = e.code;
        if (c === "KeyA" || c === "ArrowLeft") {
          Keys.left = true; Keys.last = -1;
          document.getElementById("touch-left").classList.add("active");
        } else if (c === "KeyD" || c === "ArrowRight") {
          Keys.right = true; Keys.last = 1;
          document.getElementById("touch-right").classList.add("active");
        } else if (c === "KeyJ") {
          document.getElementById("touch-attack").classList.add("active");
          if (!e.repeat) startAttackCharge();
        } else if (c === "KeyK") {
          document.getElementById("touch-parry").classList.add("active");
          doParry();
        } else if (c === "KeyL" || c === "ShiftLeft" || c === "ShiftRight") {
          document.getElementById("touch-dash").classList.add("active");
          doDash();
        } else if (c === "Space" || c === "KeyW" || c === "ArrowUp") {
          e.preventDefault();
          document.getElementById("touch-jump").classList.add("active");
          doJump();
        } else if (c === "KeyH") {
          document.getElementById("touch-gourd").classList.add("active");
          doDrinkGourd();
        } else if (c === "KeyU" || c === "KeyI") {
          document.getElementById("touch-assist").classList.add("active");
          activateAssist();
        }
      });

      window.addEventListener("keyup", (e) => {
        const c = e.code;
        if (c === "KeyA" || c === "ArrowLeft") {
          Keys.left = false;
          document.getElementById("touch-left").classList.remove("active");
        } else if (c === "KeyD" || c === "ArrowRight") {
          Keys.right = false;
          document.getElementById("touch-right").classList.remove("active");
        } else if (c === "KeyJ") {
          document.getElementById("touch-attack").classList.remove("active");
          releaseAttackCharge();
        } else if (c === "KeyK") {
          document.getElementById("touch-parry").classList.remove("active");
        } else if (c === "KeyL" || c === "ShiftLeft" || c === "ShiftRight") {
          document.getElementById("touch-dash").classList.remove("active");
        } else if (c === "Space" || c === "KeyW" || c === "ArrowUp") {
          document.getElementById("touch-jump").classList.remove("active");
        } else if (c === "KeyH") {
          document.getElementById("touch-gourd").classList.remove("active");
        } else if (c === "KeyU" || c === "KeyI") {
          document.getElementById("touch-assist").classList.remove("active");
        }
      });

      function bindHoldBtn(el, onDown, onUp) {
        if (!el) return;
        const release = (ev) => {
          if (ev && ev.preventDefault) ev.preventDefault();
          if (el.classList.contains("active")) {
            el.classList.remove("active");
            if (onUp) onUp();
          }
          if (ev && ev.pointerId !== undefined && el.hasPointerCapture && el.hasPointerCapture(ev.pointerId)) {
            try { el.releasePointerCapture(ev.pointerId); } catch (err) {}
          }
        };

        el.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          try {
            el.setPointerCapture(ev.pointerId);
          } catch (err) {}
          el.classList.add("active");
          onDown();
        });

        el.addEventListener("pointerup", release);
        el.addEventListener("pointercancel", release);
        el.addEventListener("pointerleave", release);
        el.addEventListener("lostpointercapture", release);
      }

      function clearAllInputStates() {
        Keys.left = false;
        Keys.right = false;
        const ids = [
          "touch-left", "touch-right", "touch-attack", "touch-parry",
          "touch-dash", "touch-jump", "touch-gourd", "touch-assist"
        ];
        ids.forEach((id) => {
          const btn = document.getElementById(id);
          if (btn) btn.classList.remove("active");
        });
      }

      window.addEventListener("blur", clearAllInputStates);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          clearAllInputStates();
        }
      });

      bindHoldBtn(document.getElementById("touch-left"), () => { Keys.left = true; Keys.last = -1; }, () => { Keys.left = false; });
      bindHoldBtn(document.getElementById("touch-right"), () => { Keys.right = true; Keys.last = 1; }, () => { Keys.right = false; });
      bindHoldBtn(document.getElementById("touch-attack"), startAttackCharge, releaseAttackCharge);
      bindHoldBtn(document.getElementById("touch-parry"), doParry);
      bindHoldBtn(document.getElementById("touch-dash"), doDash);
      bindHoldBtn(document.getElementById("touch-jump"), doJump);
      bindHoldBtn(document.getElementById("touch-gourd"), doDrinkGourd);
      bindHoldBtn(document.getElementById("touch-assist"), activateAssist);

      const drawer = document.getElementById("scroll-drawer");
      const btnDrawer = document.getElementById("btn-drawer-toggle");
      if (btnDrawer) btnDrawer.addEventListener("click", () => { drawer.classList.toggle("open"); btnDrawer.classList.toggle("active", drawer.classList.contains("open")); });

      document.querySelectorAll(".drawer-tab-btn").forEach((tBtn) => {
        tBtn.addEventListener("click", () => {
          document.querySelectorAll(".drawer-tab-btn").forEach((b) => b.classList.remove("active"));
          document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
          tBtn.classList.add("active");
          const target = document.getElementById(tBtn.getAttribute("data-tab"));
          if (target) target.classList.add("active");
        });
      });

      const btnAudio = document.getElementById("btn-audio-toggle");
      if (btnAudio) btnAudio.addEventListener("click", () => { Sound.muted = !Sound.muted; btnAudio.textContent = Sound.muted ? "🔇 劍鳴：靜" : "🔊 劍鳴"; });

      // handled in menu

      document.querySelectorAll(".assist-seal-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".assist-seal-btn").forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          Player.selectedAssist = btn.getAttribute("data-assist");
          Player.assistAvailable = true;
          syncAssistUI();
        });
      });

      document.getElementById("btn-refill-all").addEventListener("click", () => {
        Player.assistAvailable = true;
        Player.gourds = 3;
        updateGourdUI();
        syncAssistUI();
        spawnFloatingText(Player.x, Player.y - 110, "太初靈氣與回生仙釀已充盈！", "#60a5fa", 1.1);
      });

      const rParry = document.getElementById("range-parry");
      const lParry = document.getElementById("label-parry");
      rParry.addEventListener("input", () => {
        Config.parryWindowMs = Number(rParry.value);
        lParry.textContent = `${Config.parryWindowMs}ms`;
      });

      const rHitstop = document.getElementById("range-hitstop");
      const lHitstop = document.getElementById("label-hitstop");
      rHitstop.addEventListener("input", () => {
        Config.parryHitstopFrames = Number(rHitstop.value);
        lHitstop.textContent = `${Config.parryHitstopFrames}幀`;
      });

      const rBgm = document.getElementById("range-bgm");
      const lBgm = document.getElementById("label-bgm");
      rBgm.value = Math.round(Music.vol * 100); lBgm.textContent = `${rBgm.value}%`;
      rBgm.addEventListener("input", () => { Music.setVol(Number(rBgm.value) / 100); lBgm.textContent = `${rBgm.value}%`; });

      const rShake = document.getElementById("range-shake");
      const lShake = document.getElementById("label-shake");
      rShake.addEventListener("input", () => {
        Config.shakeMultiplier = Number(rShake.value) / 100;
        lShake.textContent = `${rShake.value}%`;
      });

      const orientGuide = document.getElementById("landscape-guide");
      const btnFull = document.getElementById("btn-fullscreen");
      const btnEnterLandscape = document.getElementById("btn-enter-landscape");
      const btnForceLandscape = document.getElementById("btn-force-landscape-toggle");

      function requestFullscreenAndLockLandscape() {
        Sound.resume();
        const doc = document.documentElement;
        const req = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
        const tip = document.getElementById("landscape-tip-text");
        if (tip) tip.textContent = "〔正在請求全螢幕……請同時將手機轉為橫向！〕";

        if (req) {
          req.call(doc).then(() => {
            lockLandscapeOrientation();
          }).catch(() => {
            lockLandscapeOrientation();
          });
        } else {
          lockLandscapeOrientation();
        }
        setTimeout(() => {
          checkOrientationStatus();
        }, 350);
      }

      function lockLandscapeOrientation() {
        try {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock("landscape-primary").catch(() => {
              screen.orientation.lock("landscape").catch(() => {});
            });
          } else if (screen.lockOrientation) {
            screen.lockOrientation("landscape");
          } else if (screen.mozLockOrientation) {
            screen.mozLockOrientation("landscape");
          } else if (screen.msLockOrientation) {
            screen.msLockOrientation("landscape");
          }
        } catch (e) {}
      }

      let portraitBypassed = false;

      function checkOrientationStatus() {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (orientGuide) {
          if (isPortrait && !portraitBypassed) {
            orientGuide.style.display = "flex";
          } else {
            orientGuide.style.display = "none";
          }
        }
        if (!isPortrait) {
          portraitBypassed = false;
        }
      }

      function resizeCanvas() {
        checkOrientationStatus();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(window.innerWidth || 320, 320);
        const h = Math.max(window.innerHeight || 240, 240);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);

        if (Player && Boss) {
          const isPort = window.innerHeight > window.innerWidth;
          const refW = isPort ? 960 : Config.baseWidth;
          const focusX = isPort ? (Player.x * 0.5 + Boss.x * 0.5) : (Player.x * 0.64 + Boss.x * 0.36);
          Game.camera.x = Math.max(0, Math.min(Config.worldWidth - refW, focusX - refW * 0.5));
        }
        render();
      }

      function testOrientation() {
        checkOrientationStatus();
      }

      window.addEventListener("resize", resizeCanvas);
      window.addEventListener("orientationchange", () => {
        setTimeout(resizeCanvas, 150);
      });

      if (btnEnterLandscape) {
        btnEnterLandscape.addEventListener("click", requestFullscreenAndLockLandscape);
      }

      const btnBypassPortrait = document.getElementById("btn-bypass-portrait");
      if (btnBypassPortrait) {
        btnBypassPortrait.addEventListener("click", () => {
          portraitBypassed = true;
          if (orientGuide) orientGuide.style.display = "none";
          resizeCanvas();
          Sound.resume();
        });
      }

      if (btnForceLandscape) {
        btnForceLandscape.addEventListener("click", requestFullscreenAndLockLandscape);
      }

      if (btnFull) {
        btnFull.addEventListener("click", () => {
          if (!document.fullscreenElement) {
            requestFullscreenAndLockLandscape();
          } else {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          }
        });
      }

      window.addEventListener("pointerdown", () => {
        lockLandscapeOrientation();
      }, { once: true });

      let lastTime = performance.now();
      let raf = null;

      function loop(now) {
        if (Game.paused) { lastTime = now; raf = requestAnimationFrame(loop); return; } /* v0.8.21 暫停：畫面與模擬完全停住 */
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        let simDt = dt;
        if (Game.slowT > 0) {
          Game.slowT -= dt;
          simDt = dt * Game.slowScale;
          if (Game.slowT <= 0) Game.slowScale = 1;
        }
        try { updatePhysics(simDt); render(); }
        catch (e) { if (!loop._err) { loop._err = 1; console.error("loop error", e); } try { if (ctx.reset) ctx.reset(); else ctx.restore(); } catch (e2) { } } /* v0.8.60 單幀出錯不再中斷迴圈（以前會整個遊戲卡死） */
        raf = requestAnimationFrame(loop);
      }
