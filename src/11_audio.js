      /* =========================================================================
       * 1. 零延遲 Web Audio API 劍鳴與金石交鳴合成引擎
       * ========================================================================= */
      const Sound = {
        ctx: null,
        muted: false,
        buffers: {},
        ready: false,
        master: null,
        /* M1：同音同時上限、音高隨機微調（±4%，旋律類不抖）、檔案變體 */
        maxVoices: 4, pitchJitter: 0.04, noJitter: { victory: 1 },
        live: {}, variants: {}, ext: {},
        /* M1 通用音效換檔：檔案放 assets/sfx/g_<名>.mp3（變體 g_<名>_2.mp3、g_<名>_3.mp3…），在這裡登記「名: 變體數」才會載入；
           載入成功就蓋掉程式合成音（且不再過低通）。名字：parry block slash flysword hit peril mikiri execution gourd assist victory */
        /* v0.8.67 Boss 專屬音效（ElevenLabs 生成）：assets/sfx/<名>.mp3（變體 <名>_2.mp3），「名: 變體數」；各關在 Stages[n].sfx 指定事件用哪個（見 bsfx） */
        bossSfx: { b2_fan: 2, b2_thrust: 2, b2_vortex: 1, b2_sword_cast: 2, b2_sword_fly: 2, b2_sword_rain: 2, b2_vanish: 2, b2_appear: 2, b2_split: 2, b2_shatter: 2, b2_shard_hit: 1,
          b3_twin: 1, b3_cross: 2, b3_spin: 2, b3_dash: 2, b3_low: 2, b3_rain: 1, b3_draw: 1, b3_heavy: 1, b3_plunge: 1, b3_seal: 1, b3_charge: 1, b3_sweep: 1 },
        genSfx: { parry: 1, block: 1, slash: 1, flysword: 1, peril: 1, mikiri: 1, execution: 1, gourd: 1, assist: 1, victory: 1, hit: 1 }, /* v0.8.41 通用 11 個全部接入 */

        init() {
          if (this.ready) return;
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          /* M1 音效匯流排：所有音效 → 總音量 → 限幅器 → 喇叭（多個音效疊在一起不爆音） */
          try {
            this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
            const c = this.ctx.createDynamicsCompressor();
            c.threshold.value = -10; c.knee.value = 6; c.ratio.value = 12; c.attack.value = 0.003; c.release.value = 0.15;
            this.master.connect(c); c.connect(this.ctx.destination);
          } catch (e) { this.master = null; }
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
          this.loadSamples(); this.loadGeneric();
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
        loadGeneric() {
          const sets = [[this.genSfx, "g_"], [this.bossSfx, ""]];
          sets.forEach(([dict, pre]) => Object.keys(dict).forEach((k) => {
            const n = dict[k] || 1;
            for (let i = 1; i <= n; i++) {
              const f = i === 1 ? `${pre}${k}` : `${pre}${k}_${i}`;
              try { fetch(`assets/sfx/${f}.mp3?v=${ASSET_VER}`).then((r) => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then((b) => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no))).then((buf) => { (this.variants[k] = this.variants[k] || []).push(buf); this.buffers[k] = this.variants[k][0]; this.ext[k] = true; }).catch(() => { }); } catch (e) { }
            }
          }));
        },
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
            const now = this.ctx.currentTime;
            const live = (this.live[name] || []).filter((e) => e > now);
            if (live.length >= this.maxVoices) { this.live[name] = live; return; } /* 同音同時上限：狂按不疊爆 */
            const vs = this.variants[name];
            const buf = vs && vs.length > 1 ? vs[Math.floor(Math.random() * vs.length)] : this.buffers[name];
            const rate = Math.max(0.1, pitch * (this.noJitter[name] ? 1 : 1 + (Math.random() * 2 - 1) * this.pitchJitter));
            live.push(now + buf.duration / rate); this.live[name] = live;
            const out = this.master || this.ctx.destination;
            const s = this.ctx.createBufferSource();
            s.buffer = buf;
            s.playbackRate.value = rate;
            const g = this.ctx.createGain();
            g.gain.value = vol;
            s.connect(g);
            if (!this.ext[name] && name.indexOf("s_") !== 0 && name.indexOf("w_") !== 0 && name.indexOf("m_") !== 0) { /* v0.8.16 程式合成音一律過低通，削掉尖銳高頻；外部取樣不處理 */
              const lp = this.ctx.createBiquadFilter();
              lp.type = "lowpass"; lp.frequency.value = 2400; lp.Q.value = 0.5;
              g.connect(lp); lp.connect(out);
            } else g.connect(out);
            s.start(0);
          } catch (e) {}
        }
      };


      /* v0.8.67 關卡事件音效：Stages[目前關].sfx[事件] = [檔名, 音量, 音高]；有設定且已載入就播並回傳 true，否則回傳 false（呼叫端播原本的通用音效）。
         事件：tpOut 瞬移消失、tpIn 瞬移現身、split 分身、ilBreak 幻影碎裂、ilShard 鏡片反噬、swordFly 每把飛劍、swordRain 垂落飛劍、introSwirl／introLand 登場聚合與現形、zone 地面區域生成 */
      function bsfx(key) {
        const st = typeof Stages !== "undefined" && Stages[Boss.stageId], e = st && st.sfx && st.sfx[key];
        if (!e || !Sound.buffers[e[0]]) return false;
        Sound.play(e[0], e[1] == null ? 0.9 : e[1], e[2] || 1);
        return true;
      }

      /* =========================================================================
       * v0.8.9 背景音樂（取自一念飛仙倉庫 music/）：淡入淡出、可調音量、隨靜音鍵
       * ========================================================================= */
      const STAGE_BGM_P2 = { 2: "b2_p2", 3: "b3_p2", 5: "langwang" }; /* v0.8.69 第 2、3 關二階段專屬曲 */ /* 二階段換曲：關卡 id → 曲名（沒列就整場同一首） */
      const STAGE_BGM = { 1: "chisha", 2: "b2_p1", 3: "b3_p1", 4: "tianjie", 5: "youying", 6: "weiju", 7: "zhandou", 8: "tianjie", 9: "weiju" }; /* M1：2～4、6～9 關暫用一念飛仙舊曲，之後換專屬曲 */
      const HUB_BGM = "camp"; /* v0.8.69 營地專屬曲（原暫用「洞府」） */ /* 第 5 關：一階段「幽影」（小狼）、二階段 STAGE_BGM_P2「狼王」 */ /* 關卡 id → assets/music/<名>.webm；沒列的關卡維持無音樂 */
      const Music = {
        tracks: [], vol: 1.0, name: null, /* v0.8.15 預設音量 0.5→1.0（已調過滑桿的人沿用自己的設定） */
        /* v0.8.74 音樂閃避（ducking，取自 audio-design skill；先只在第 1 關測試）：處決時、Boss 大招壓暗畫面時把音樂壓低，讓關鍵音效凸顯；
           用獨立倍率乘在最後，不改玩家的音樂音量設定；壓下快（約 0.1 秒）、回復慢（約 0.4 秒），避免音樂忽大忽小 */
        duckCur: 1, duckLvl: 1, duckUntil: 0,
        duck(level, sec) { const now = performance.now(); if (now >= this.duckUntil) this.duckLvl = level; else this.duckLvl = Math.min(this.duckLvl, level); this.duckUntil = Math.max(this.duckUntil, now + sec * 1000); },
        duckTarget() {
          if (typeof Boss === "undefined" || typeof Game === "undefined" || Game.mode !== "battle") return 1;
          let t = performance.now() < this.duckUntil ? this.duckLvl : 1;
          return Math.min(t, 1 - 0.4 * (Game.ultDim || 0));
        },
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
          const dT = this.duckTarget();
          this.duckCur += (dT - this.duckCur) * (dT < this.duckCur ? 0.5 : 0.12);
          for (let i = this.tracks.length - 1; i >= 0; i--) {
            const t = this.tracks[i];
            t.cur += (t.target - t.cur) * 0.08;
            if (t.target === 0 && t.cur < 0.01) { t.el.pause(); this.tracks.splice(i, 1); continue; }
            t.el.volume = Math.max(0, Math.min(1, t.cur * this.vol * this.duckCur * (Sound.muted ? 0 : 1)));
          }
        }
      };
      Music.init();
