      /* =========================================================================
       * CINEMA VIDEO PLAYER & EXQUISITE DIALOGUE ENGINE (一念飛仙正統風格)
       * ========================================================================= */
      const elStoryModal = document.getElementById("story-dialog-modal");
      const elStoryTag = document.getElementById("story-tag");
      const cinemaCanvas = document.getElementById("cinema-canvas");
      const cinemaCtx = cinemaCanvas ? cinemaCanvas.getContext("2d") : null;
      const sceneVideo = document.getElementById("scene-video");
      const videoFileInput = document.getElementById("video-file-input");

      const elAvatarHolder = document.getElementById("avatar-visual-holder");
      const elAvatarRole = document.getElementById("avatar-role-tag");
      const elSpeakerName = document.getElementById("speaker-name-label");
      const elSpeakerRealm = document.getElementById("speaker-realm-label");
      const elTypewriterText = document.getElementById("dialogue-typewriter-text");
      const elDialogueCard = document.getElementById("vn-dialogue-card");
      const elHistoryDrawer = document.getElementById("dialogue-history-drawer");
      const btnAutoPlay = document.getElementById("btn-auto-play");
      const btnDialogueLog = document.getElementById("btn-dialogue-log");

      const StoryEngine = {
        lines: [],
        currentIndex: 0,
        typewriterTimer: null,
        isTyping: false,
        fullCurrentText: "",
        autoPlay: false,
        autoTimer: null,
        historyLog: [],
        currentKey: "pre_battle",

        start(key) {
          Game.cutsceneActive = true;
          this.currentKey = key;
          const stage = Stages[Boss.stageId];
          this.lines = (stage.dialogue && stage.dialogue[key === "post_battle" ? "post" : "pre"]) || [];
          this.currentIndex = 0;
          this.historyLog = [];
          elHistoryDrawer.innerHTML = "";
          elHistoryDrawer.classList.remove("open");

          elStoryTag.textContent = key === "post_battle" 
            ? `【${stage.chapter}】通關回憶繪卷` 
            : `【${stage.chapter}】戰前對話`;

          document.getElementById("cinema-scene-title").textContent = `${stage.name}・${key === "post_battle" ? "宿命回憶過場" : "戰前陣前對峙"}`;

          CinemaEngine.start(stage, key);
          elStoryModal.classList.add("open");
          this.showLine(0);
        },

        showLine(index) {
          if (index >= this.lines.length) {
            this.finish();
            return;
          }
          this.currentIndex = index;
          const line = this.lines[index];
          this.historyLog.push(line);

          // Update avatar & role styling
          this.updateSpeakerInfo(line);

          // Typewriter text animation
          if (this.typewriterTimer) clearInterval(this.typewriterTimer);
          if (this.autoTimer) clearTimeout(this.autoTimer);

          this.isTyping = true;
          this.fullCurrentText = line.text;
          elTypewriterText.innerHTML = "";

          const isNarrator = line.role === "narrator";
          let charIndex = 0;
          const speed = isNarrator ? 18 : 26;

          this.typewriterTimer = setInterval(() => {
            charIndex++;
            if (charIndex <= this.fullCurrentText.length) {
              const partial = this.fullCurrentText.substring(0, charIndex);
              elTypewriterText.innerHTML = isNarrator 
                ? `<span class="narrator-hint">${partial}</span>` 
                : partial;
            } else {
              clearInterval(this.typewriterTimer);
              this.isTyping = false;
              if (this.autoPlay) {
                this.autoTimer = setTimeout(() => { this.nextLine(); }, 1800);
              }
            }
          }, speed);
        },

        completeTypewriter() {
          if (this.typewriterTimer) clearInterval(this.typewriterTimer);
          this.isTyping = false;
          const line = this.lines[this.currentIndex];
          elTypewriterText.innerHTML = line.role === "narrator"
            ? `<span class="narrator-hint">${line.text}</span>`
            : line.text;
          if (this.autoPlay) {
            if (this.autoTimer) clearTimeout(this.autoTimer);
            this.autoTimer = setTimeout(() => { this.nextLine(); }, 1800);
          }
        },

        nextLine() {
          if (this.isTyping) {
            this.completeTypewriter();
          } else {
            this.showLine(this.currentIndex + 1);
          }
        },

        updateSpeakerInfo(line) {
          const role = line.role;
          const speaker = line.speaker;
          elSpeakerName.textContent = speaker;

          if (role === "mochen") {
            elAvatarHolder.textContent = "🗡️";
            elAvatarRole.textContent = "墨塵";
            elAvatarRole.style.color = "#38bdf8";
            elSpeakerRealm.textContent = "【青雲劍主・通玄初期】";
          } else if (role === "shidi") {
            elAvatarHolder.textContent = "🔮";
            elAvatarRole.textContent = "師妹";
            elAvatarRole.style.color = "#60a5fa";
            elSpeakerRealm.textContent = "【太初傳人・玄天珠使】";
          } else if (role === "narrator") {
            elAvatarHolder.textContent = "📜";
            elAvatarRole.textContent = "天道";
            elAvatarRole.style.color = "#fef08a";
            elSpeakerRealm.textContent = "〔天道宿命記載〕";
          } else {
            // Boss
            elAvatarHolder.textContent = Boss.artId >= 11 ? "⚡" : Boss.artId >= 6 ? "👹" : "⚔️";
            elAvatarRole.textContent = "守關者";
            elAvatarRole.style.color = "#f87171";
            elSpeakerRealm.textContent = `【${Stages[Boss.stageId].realmBadge}】`;
          }
        },

        finish() {
          if (this.typewriterTimer) clearInterval(this.typewriterTimer);
          if (this.autoTimer) clearTimeout(this.autoTimer);
          CinemaEngine.stop();
          elStoryModal.classList.remove("open");
          Game.cutsceneActive = false;
        }
      };

      // Cinematic Video / Animatics Engine
      const CinemaEngine = {
        active: false,
        animFrame: null,
        stage: null,
        key: "pre_battle",
        startTime: 0,
        customVideoPlaying: false,

        init() {
          if (videoFileInput) {
            videoFileInput.addEventListener("change", (e) => {
              const file = e.target.files[0];
              if (file && sceneVideo) {
                const url = URL.createObjectURL(file);
                sceneVideo.src = url;
                sceneVideo.style.display = "block";
                cinemaCanvas.style.display = "none";
                sceneVideo.play().catch(() => {});
                this.customVideoPlaying = true;
                spawnFloatingText(Player.x, Player.y - 120, "已載入外部影片播放！", "#a7f3d0", 1.2);
              }
            });
          }
        },

        start(stage, key) {
          this.active = true;
          this.stage = stage;
          this.key = key;
          this.startTime = performance.now();
          if (cinemaCanvas) {
            cinemaCanvas.width = 680;
            cinemaCanvas.height = 360;
          }
          if (this.customVideoPlaying && sceneVideo) {
            sceneVideo.currentTime = 0;
            sceneVideo.play().catch(() => {});
          } else {
            this.loop();
          }
        },

        stop() {
          this.active = false;
          if (this.animFrame) cancelAnimationFrame(this.animFrame);
          if (sceneVideo) sceneVideo.pause();
        },

        loop() {
          if (!this.active || this.customVideoPlaying) return;
          this.renderFrame();
          this.animFrame = requestAnimationFrame(() => this.loop());
        },

        renderFrame() {
          if (!cinemaCtx || !cinemaCanvas) return;
          const w = cinemaCanvas.width;
          const h = cinemaCanvas.height;
          const t = (performance.now() - this.startTime) / 1000;
          cinemaCtx.clearRect(0, 0, w, h);

          // 1. Cinematic Background Gradient based on stage
          const bgGrad = cinemaCtx.createLinearGradient(0, 0, 0, h);
          if (this.stage.id === 9) {
            bgGrad.addColorStop(0, "#2e1065");
            bgGrad.addColorStop(0.5, "#4c0519");
            bgGrad.addColorStop(1, "#030712");
          } else if (this.stage.volume === 2) {
            bgGrad.addColorStop(0, "#3b0764");
            bgGrad.addColorStop(1, "#09090b");
          } else {
            bgGrad.addColorStop(0, "#082f49");
            bgGrad.addColorStop(0.7, "#0f172a");
            bgGrad.addColorStop(1, "#020617");
          }
          cinemaCtx.fillStyle = bgGrad;
          cinemaCtx.fillRect(0, 0, w, h);

          // 2. Cinematic Camera Pan & Zoom Simulation
          const camZoom = 1 + Math.sin(t * 0.4) * 0.08;
          const camPanX = Math.sin(t * 0.3) * 35;
          cinemaCtx.save();
          cinemaCtx.translate(w * 0.5 + camPanX, h * 0.5);
          cinemaCtx.scale(camZoom, camZoom);
          cinemaCtx.translate(-w * 0.5, -h * 0.5);

          // Celestial Moon / Eye
          const moonX = w * 0.72;
          const moonY = h * 0.32;
          cinemaCtx.fillStyle = this.stage.id === 9 ? "rgba(244, 63, 94, 0.8)" : "rgba(254, 243, 199, 0.85)";
          cinemaCtx.shadowColor = cinemaCtx.fillStyle;
          cinemaCtx.shadowBlur = 24;
          cinemaCtx.beginPath();
          cinemaCtx.arc(moonX, moonY, 36, 0, Math.PI * 2);
          cinemaCtx.fill();

          // Mountains Silhouette
          cinemaCtx.fillStyle = "rgba(15, 23, 42, 0.9)";
          cinemaCtx.shadowBlur = 0;
          cinemaCtx.beginPath();
          cinemaCtx.moveTo(0, h);
          for (let i = 0; i <= 6; i++) {
            const px = i * (w / 5);
            const py = h * 0.65 + Math.sin(i * 1.5 + t * 0.2) * 20;
            cinemaCtx.lineTo(px, py);
          }
          cinemaCtx.lineTo(w, h);
          cinemaCtx.fill();

          // Character Silhouettes (Mo Chen on left, Boss / Spirit on right)
          // Mo Chen standing with swaying sword tassel
          const mcX = w * 0.24;
          const mcY = h * 0.75;
          cinemaCtx.fillStyle = "#0c4a6e";
          cinemaCtx.strokeStyle = "#38bdf8";
          cinemaCtx.lineWidth = 2;
          cinemaCtx.fillRect(mcX - 14, mcY - 50, 28, 50);
          cinemaCtx.strokeRect(mcX - 14, mcY - 50, 28, 50);

          // Glowing Qingyun Sword
          cinemaCtx.strokeStyle = "#bae6fd";
          cinemaCtx.lineWidth = 3;
          cinemaCtx.beginPath();
          cinemaCtx.moveTo(mcX + 10, mcY - 26);
          cinemaCtx.lineTo(mcX + 38, mcY - 48);
          cinemaCtx.stroke();

          // Taichu Spirit Pearl Companion
          const orbY = mcY - 58 + Math.sin(t * 3) * 6;
          cinemaCtx.fillStyle = "#60a5fa";
          cinemaCtx.shadowColor = "#60a5fa";
          cinemaCtx.shadowBlur = 16;
          cinemaCtx.beginPath();
          cinemaCtx.arc(mcX - 22, orbY, 6, 0, Math.PI * 2);
          cinemaCtx.fill();

          // Boss Silhouette on right
          const bX = w * 0.76;
          const bY = h * 0.75;
          cinemaCtx.fillStyle = this.stage.id === 9 ? "#831843" : "#7f1d1d";
          cinemaCtx.strokeStyle = this.stage.id === 9 ? "#f43f5e" : "#f87171";
          cinemaCtx.lineWidth = 2.5;
          cinemaCtx.fillRect(bX - 20, bY - 65, 40, 65);
          cinemaCtx.strokeRect(bX - 20, bY - 65, 40, 65);

          // Drifting ink particles
          for (let p = 0; p < 18; p++) {
            const px = ((p * 45 + t * 40) % (w + 40)) - 20;
            const py = (p * 22 + Math.sin(t + p) * 15) % h;
            cinemaCtx.fillStyle = "rgba(56, 189, 248, 0.4)";
            cinemaCtx.beginPath();
            cinemaCtx.arc(px, py, 2, 0, Math.PI * 2);
            cinemaCtx.fill();
          }

          cinemaCtx.restore();

          // Cinematic Title Calligraphy Overlay
          cinemaCtx.save();
          cinemaCtx.font = "900 22px var(--font-serif)";
          cinemaCtx.fillStyle = "rgba(254, 240, 138, 0.9)";
          cinemaCtx.shadowColor = "rgba(0,0,0,0.9)";
          cinemaCtx.shadowBlur = 8;
          cinemaCtx.fillText(`第 ${this.stage.id} 難・${this.stage.name}`, 20, 36);
          cinemaCtx.font = "600 12px var(--font-serif)";
          cinemaCtx.fillStyle = "rgba(148, 163, 184, 0.85)";
          cinemaCtx.fillText(this.stage.chapter, 20, 56);
          cinemaCtx.restore();
        }
      };

      // Modal & Dialogue Controller Events
      if (elDialogueCard) {
        elDialogueCard.addEventListener("click", () => {
          StoryEngine.nextLine();
        });
      }

      document.getElementById("btn-dismiss-story").addEventListener("click", () => {
        StoryEngine.finish();
      });

      document.getElementById("btn-dialogue-skip").addEventListener("click", () => {
        StoryEngine.finish();
      });


      if (btnAutoPlay) {
        btnAutoPlay.addEventListener("click", () => {
          StoryEngine.autoPlay = !StoryEngine.autoPlay;
          btnAutoPlay.textContent = StoryEngine.autoPlay ? "⏸ 暫停" : "▶ 自動";
          btnAutoPlay.classList.toggle("active", StoryEngine.autoPlay);
          if (StoryEngine.autoPlay && !StoryEngine.isTyping) {
            StoryEngine.nextLine();
          }
        });
      }

      if (btnDialogueLog) {
        btnDialogueLog.addEventListener("click", () => {
          elHistoryDrawer.classList.toggle("open");
          if (elHistoryDrawer.classList.contains("open")) {
            elHistoryDrawer.innerHTML = StoryEngine.historyLog.map(l => `
              <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <b style="color: var(--amber-light);">${l.speaker}:</b> ${l.text}
              </div>
            `).join("");
          }
        });
      }

      const btnToggleCinema = document.getElementById("btn-toggle-cinema-mode");
      if (btnToggleCinema) {
        btnToggleCinema.addEventListener("click", () => {
          const vp = document.getElementById("cinema-viewport");
          if (vp.style.display === "none") {
            vp.style.display = "flex";
            btnToggleCinema.textContent = "🎬 隱藏影片";
            CinemaEngine.start(Stages[Boss.stageId], StoryEngine.currentKey);
          } else {
            vp.style.display = "none";
            btnToggleCinema.textContent = "🎬 展開影片";
            CinemaEngine.stop();
          }
        });
      }

      const btnCinemaReplay = document.getElementById("btn-cinema-replay");
      if (btnCinemaReplay) {
        btnCinemaReplay.addEventListener("click", () => {
          CinemaEngine.start(Stages[Boss.stageId], StoryEngine.currentKey);
        });
      }

      CinemaEngine.init();

      function showStoryDialog(key) {
        StoryEngine.start(key);
      }

      /* HUD References */
      const elHpBar = document.getElementById("player-hp-bar");
      const elHpTxt = document.getElementById("player-hp-txt");
      const elStaminaBar = document.getElementById("player-stamina-bar");
      const elPlayerState = document.getElementById("player-state-txt");
      const elBossHpBar = document.getElementById("boss-hp-bar");
      const elBossHpGhost = document.getElementById("boss-hp-ghost");
      let bossGhostPct = 100, bossGhostLast = 100, bossGhostHold = 0, bossGhostT = 0;

      const elCombo = document.createElement("div");
      elCombo.style.cssText = "position:fixed;right:3vw;top:24%;z-index:30;pointer-events:none;display:none;text-align:right;font-family:'Noto Serif TC',serif;font-weight:900;line-height:1;text-shadow:0 0 12px rgba(0,0,0,.8),0 2px 0 rgba(0,0,0,.6);transform-origin:right center;";
      elCombo.innerHTML = '<span style="font-size:clamp(34px,7vh,64px)">0</span><span style="font-size:clamp(16px,3vh,26px);margin-left:4px">連</span>';
      document.body.appendChild(elCombo);
      let comboShown = 0;

      const elHurtFlash = document.createElement("div");
      elHurtFlash.style.cssText = "position:fixed;inset:0;z-index:25;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(220,38,38,0.9) 100%);";
      document.body.appendChild(elHurtFlash);
      function hurtFlash(a) {
        elHurtFlash.style.transition = "none";
        elHurtFlash.style.opacity = String(a);
        void elHurtFlash.offsetWidth;
        elHurtFlash.style.transition = "opacity 0.45s ease-out";
        elHurtFlash.style.opacity = "0";
      }

      const elBanner = document.createElement("div");
      elBanner.style.cssText = "position:fixed;left:0;right:0;top:26%;z-index:31;pointer-events:none;text-align:center;opacity:0;font-family:'Noto Serif TC',serif;";
      elBanner.innerHTML = '<div style="font-weight:900;font-size:clamp(30px,8.5vh,76px);letter-spacing:.18em;text-shadow:0 0 18px rgba(0,0,0,.9),0 0 30px currentColor"></div><div style="margin-top:.5vh;font-weight:700;font-size:clamp(13px,2.8vh,24px);letter-spacing:.5em;opacity:.9;text-shadow:0 0 10px rgba(0,0,0,.9)"></div>';
      document.body.appendChild(elBanner);
      let bannerTimer = null;
      function showBanner(title, sub, holdMs, color) {
        elBanner.style.color = color || "#fde68a";
        elBanner.children[0].textContent = title;
        elBanner.children[1].textContent = sub || "";
        elBanner.children[0].style.transition = "none";
        elBanner.children[0].style.letterSpacing = ".6em";
        elBanner.style.transition = "none";
        elBanner.style.opacity = "0";
        void elBanner.offsetWidth;
        elBanner.style.transition = "opacity .3s ease-out";
        elBanner.children[0].style.transition = "letter-spacing .6s ease-out";
        elBanner.children[0].style.letterSpacing = ".18em";
        elBanner.style.opacity = "1";
        if (bannerTimer) clearTimeout(bannerTimer);
        bannerTimer = setTimeout(() => {
          elBanner.style.transition = "opacity .45s ease-in";
          elBanner.style.opacity = "0";
        }, holdMs || 1200);
      }

      const elScreenFlash = document.createElement("div");
      elScreenFlash.style.cssText = "position:fixed;inset:0;z-index:26;pointer-events:none;opacity:0;";
      document.body.appendChild(elScreenFlash);
      function screenFlash(color, a, sec) {
        elScreenFlash.style.background = color;
        elScreenFlash.style.transition = "none";
        elScreenFlash.style.opacity = String(a);
        void elScreenFlash.offsetWidth;
        elScreenFlash.style.transition = `opacity ${sec}s ease-out`;
        elScreenFlash.style.opacity = "0";
      }

      const elHintToast = document.createElement("div");
      elHintToast.style.cssText = "position:fixed;left:50%;top:17%;transform:translateX(-50%);z-index:29;pointer-events:none;opacity:0;padding:10px 28px;border-radius:999px;background:rgba(10,15,26,.9);border:1.5px solid rgba(250,204,21,.7);color:#fde68a;font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(17px,4.2vh,30px);letter-spacing:.04em;text-align:center;max-width:88vw;box-shadow:0 6px 22px rgba(0,0,0,.7),0 0 18px rgba(250,204,21,.18);";
      document.body.appendChild(elHintToast);
      let hintToastTimer = null;
      function showHintToast(text) {
        elHintToast.textContent = text;
        elHintToast.style.transition = "none";
        elHintToast.style.opacity = "0";
        void elHintToast.offsetWidth;
        elHintToast.style.transition = "opacity .3s ease-out";
        elHintToast.style.opacity = "1";
        if (hintToastTimer) clearTimeout(hintToastTimer);
        hintToastTimer = setTimeout(() => {
          elHintToast.style.transition = "opacity .5s ease-in";
          elHintToast.style.opacity = "0";
        }, 6500);
      }

      const btnBattleLog = document.getElementById("btn-battle-log");
      if (btnBattleLog) {
        btnBattleLog.addEventListener("click", () => {
          const ov = document.createElement("div");
          ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;";
          const box = document.createElement("div");
          box.style.cssText = "width:min(560px,90vw);max-height:78vh;overflow:auto;background:#0b1220;border:1px solid rgba(250,204,21,.5);border-radius:10px;padding:12px 16px;color:#e2e8f0;font-size:13px;line-height:1.7;font-family:'Noto Serif TC',serif;";
          box.innerHTML = '<div style="font-weight:900;color:#fde68a;margin-bottom:6px">戰報紀錄（點任意處關閉）</div>' + BATTLE_LOG.slice().reverse().map(t => '<div style="border-top:1px solid rgba(148,163,184,.15);padding:3px 0">' + String(t).replace(/</g, "&lt;") + '</div>').join("");
          ov.appendChild(box);
          ov.addEventListener("click", () => ov.remove());
          document.body.appendChild(ov);
        });
      }
      const btnHintReset = document.getElementById("btn-hint-reset");
      if (btnHintReset) {
        btnHintReset.addEventListener("click", () => {
          try { localStorage.removeItem("qingyun_hints"); } catch (e) { }
          showHintToast("教學提示已重置，下次遇到會再提示一次");
        });
      }
