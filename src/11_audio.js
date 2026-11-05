      /* =========================================================================
       * 1. 零延遲 Web Audio API 劍鳴與金石交鳴合成引擎
       * ========================================================================= */
      const Sound = {
        ctx: null,
        muted: false,
        buffers: {},
        ready: false,

        init() {
          if (this.ready) return;
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.ready = true;
          this.bake();
        },

        resume() {
          if (!this.ready) this.init();
          if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
          }
        },

        bakeBuffer(dur, fn) {
          if (!this.ctx) return null;
          const rate = this.ctx.sampleRate;
          const len = Math.floor(rate * dur);
          const buf = this.ctx.createBuffer(1, len, rate);
          const ch = buf.getChannelData(0);
          for (let i = 0; i < len; i++) {
            ch[i] = Math.max(-1, Math.min(1, fn(i / rate, dur)));
          }
          return buf;
        },

        /* v0.8.9 外部音效（取自一念飛仙倉庫 sfx/）：載入失敗就維持程式合成音 */
        loadSamples() {
          const list = { s_hit: "sfx_hit", s_hurt: "sfx_hurt", s_skill: "sfx_skill", s_ult: "sfx_ult", s_thunder: "sfx_thunder" };
          Object.keys(list).forEach((k) => {
            try {
              fetch(`assets/sfx/${list[k]}.mp3?v=${ASSET_VER}`)
                .then((r) => r.arrayBuffer())
                .then((b) => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no)))
                .then((buf) => { this.buffers[k] = buf; })
                .catch(() => { });
            } catch (e) { }
          });
        },

        bake() {
          this.loadSamples();
          this.buffers.parry = this.bakeBuffer(0.42, (t) => {
            const env = Math.exp(-t * 13);
            const transient = (Math.random() * 2 - 1) * Math.exp(-t * 110) * 0.4;
            const f1 = Math.sin(2 * Math.PI * 880.0 * t);
            const f2 = Math.sin(2 * Math.PI * 1318.5 * t) * 0.5;
            const f3 = Math.sin(2 * Math.PI * 1760.0 * t) * 0.2;
            return transient + (f1 + f2 + f3) * env * 0.5;
          });

          this.buffers.block = this.bakeBuffer(0.2, (t) => {
            const env = Math.exp(-t * 26);
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.35;
            const low = Math.sin(2 * Math.PI * (260 - t * 450) * t) * env * 0.65;
            return noise + low;
          });

          this.buffers.slash = this.bakeBuffer(0.18, (t) => {
            const env = Math.sin((t / 0.18) * Math.PI) * Math.exp(-t * 12);
            const noise = (Math.random() * 2 - 1) * 0.2;
            const whistle = Math.sin(2 * Math.PI * (480 + t * 700) * t) * 0.2;
            return (noise + whistle) * env;
          });

          this.buffers.flysword = this.bakeBuffer(0.25, (t) => {
            const env = Math.sin((t / 0.25) * Math.PI) * Math.exp(-t * 6);
            const highWhistle = Math.sin(2 * Math.PI * (800 + t * 900) * t) * 0.35;
            return (highWhistle + (Math.random() * 2 - 1) * 0.12) * env;
          });

          this.buffers.hit = this.bakeBuffer(0.22, (t) => {
            const env = Math.exp(-t * 20);
            const kick = Math.sin(2 * Math.PI * (190 - t * 500) * t) * 0.7;
            const metal = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 38) * 0.3;
            const grit = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.2;
            return (kick + metal + grit) * env;
          });

          this.buffers.peril = this.bakeBuffer(0.52, (t) => {
            const drum = Math.sin(2 * Math.PI * (140 * Math.exp(-t * 5)) * t) * Math.exp(-t * 7) * 0.7;
            const bell = (Math.sin(2 * Math.PI * 523.3 * t) + Math.sin(2 * Math.PI * 784.0 * t) * 0.6) * Math.exp(-t * 7) * 0.3;
            return drum + bell;
          });

          this.buffers.mikiri = this.bakeBuffer(0.48, (t) => {
            const bass = Math.sin(2 * Math.PI * (170 * Math.exp(-t * 6)) * t) * Math.exp(-t * 8) * 0.8;
            const steel = (Math.sin(2 * Math.PI * 830.6 * t) + Math.sin(2 * Math.PI * 1244.5 * t) * 0.5) * Math.exp(-t * 8) * 0.35;
            return bass + steel;
          });

          this.buffers.execution = this.bakeBuffer(0.85, (t) => {
            const boom = Math.sin(2 * Math.PI * (115 * Math.exp(-t * 3.5)) * t) * Math.exp(-t * 4.2) * 0.85;
            const cry = (Math.sin(2 * Math.PI * 932.3 * t) + Math.sin(2 * Math.PI * 1396.9 * t) * 0.5) * Math.exp(-t * 5) * 0.32;
            return boom + cry;
          });

          this.buffers.gourd = this.bakeBuffer(0.42, (t) => {
            const pop = (Math.random() * 2 - 1) * Math.exp(-t * 65) * 0.3;
            const glug = Math.sin(2 * Math.PI * (340 + Math.sin(t * 35) * 60) * t) * Math.exp(-t * 6) * 0.45;
            return pop + glug;
          });

          this.buffers.assist = this.bakeBuffer(0.5, (t) => {
            const f = 659.25 + Math.sin(t * 32) * 50;
            return (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.5 * t) * 0.4) * Math.exp(-t * 5.2) * 0.6;
          });

          this.buffers.victory = this.bakeBuffer(1.2, (t) => {
            const env = Math.exp(-t * 2.5);
            return (Math.sin(2 * Math.PI * 329.6 * t) + Math.sin(2 * Math.PI * 493.9 * t) * 0.7) * env * 0.75;
          });
          this.bakeWolf();
        },

        /* v0.8.34 狼與巨狼的聲音：改用真實音效檔（程式合成版太難聽已移除）。
           檔案放 assets/sfx/<名>.mp3，載入成功才有聲；沒有檔案的招式維持原本的揮劍音。w_*＝小狼，m_*＝大狼（怪物）。 */
        extSfx: ["w_snarl", "w_bark", "w_snap", "w_claw", "w_howl", "w_yelp", "m_growl", "m_roar", "m_bite", "m_swipe", "m_stomp", "m_howl"],
        bakeWolf() {
          this.extSfx.forEach((k) => {
            try { fetch(`assets/sfx/${k}.mp3?v=${ASSET_VER}`).then((r) => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then((b) => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no))).then((buf) => { this.buffers[k] = buf; }).catch(() => { }); } catch (e) { }
          });
        },

        play(name, vol = 0.8, pitch = 1.0) {
          if (this.muted) return;
          this.resume();
          if (!this.ctx || !this.buffers[name]) return;
          try {
            const s = this.ctx.createBufferSource();
            s.buffer = this.buffers[name];
            s.playbackRate.value = pitch;
            const g = this.ctx.createGain();
            g.gain.value = vol;
            s.connect(g);
            if (name.indexOf("s_") !== 0 && name.indexOf("w_") !== 0 && name.indexOf("m_") !== 0) { /* v0.8.16 程式合成音一律過低通，削掉尖銳高頻；外部取樣（s_*）不處理 */
              const lp = this.ctx.createBiquadFilter();
              lp.type = "lowpass"; lp.frequency.value = 2400; lp.Q.value = 0.5;
              g.connect(lp); lp.connect(this.ctx.destination);
            } else g.connect(this.ctx.destination);
            s.start(0);
          } catch (e) {}
        }
      };


      /* =========================================================================
       * v0.8.9 背景音樂（取自一念飛仙倉庫 music/）：淡入淡出、可調音量、隨靜音鍵
       * ========================================================================= */
      const STAGE_BGM_P2 = { 5: "langwang" }; /* 二階段換曲：關卡 id → 曲名（沒列就整場同一首） */
      const STAGE_BGM = { 1: "chisha", 5: "youying" }; /* 第 5 關：一階段「幽影」（小狼）、二階段 STAGE_BGM_P2「狼王」 */ /* 關卡 id → assets/music/<名>.webm；沒列的關卡維持無音樂 */
      const Music = {
        tracks: [], vol: 1.0, name: null, /* v0.8.15 預設音量 0.5→1.0（已調過滑桿的人沿用自己的設定） */
        init() {
          try { const v = parseFloat(localStorage.getItem("qingyun_bgmvol")); if (!isNaN(v)) this.vol = Math.max(0, Math.min(1, v)); } catch (e) { }
          setInterval(() => this.tick(), 50);
          document.addEventListener("visibilitychange", () => {
            this.tracks.forEach((t) => { if (document.hidden) t.el.pause(); else if (t.target > 0 && !Game.paused) this.tryPlay(t); });
          });
          const retry = () => { if (Game.paused) return; this.tracks.forEach((t) => { if (t.target > 0 && t.el.paused) this.tryPlay(t); }); };
          window.addEventListener("pointerdown", retry, true);
          window.addEventListener("keydown", retry, true);
        },
        tryPlay(t) { try { const pr = t.el.play(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } },
        play(name) {
          if (this.name === name) { const t = this.tracks.find((x) => x.name === name && x.target > 0); if (t) return; }
          this.fadeOut();
          const el = new Audio(`assets/music/${name}.webm?v=${ASSET_VER}`);
          el.loop = true; el.preload = "auto"; el.volume = 0;
          const t = { name, el, cur: 0, target: 1 };
          this.tracks.push(t); this.name = name;
          this.tryPlay(t);
        },
        fadeOut() { this.tracks.forEach((t) => { t.target = 0; }); this.name = null; },
        pauseAll() { this.tracks.forEach((t) => { try { t.el.pause(); } catch (e) { } }); },
        resumeAll() { this.tracks.forEach((t) => { if (t.target > 0) this.tryPlay(t); }); },
        setVol(v) { this.vol = Math.max(0, Math.min(1, v)); try { localStorage.setItem("qingyun_bgmvol", String(this.vol)); } catch (e) { } },
        tick() {
          for (let i = this.tracks.length - 1; i >= 0; i--) {
            const t = this.tracks[i];
            t.cur += (t.target - t.cur) * 0.08;
            if (t.target === 0 && t.cur < 0.01) { t.el.pause(); this.tracks.splice(i, 1); continue; }
            t.el.volume = Math.max(0, Math.min(1, t.cur * this.vol * (Sound.muted ? 0 : 1)));
          }
        }
      };
      Music.init();
