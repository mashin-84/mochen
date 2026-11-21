      /* =========================================================================
       * v0.8.237 手機調參面板（參考櫻井政博〈調整をしやすくする仕組み〉：數值不寫死、執行中一鍵生效，試的次數決定調整深度）
       * 齒輪 → 🎚 手感調參：拉桿即時生效、存在這台手機（localStorage qingyun_tune）；「複製數值」把改過的值複製起來貼給 Claude 寫進程式。
       * 新增參數：在 TUNE_DEFS 加一行，程式裡用 Tune.v("鍵") 取值（預設值＝目前程式的正式值）。
       * ========================================================================= */
      const TUNE_DEFS = [
        { g: "手感（全部關卡）" },
        { k: "hsMul", n: "頓幀長度倍率", d: 1.2, min: 0, max: 2, s: 0.1 },
        { k: "hsVictim", n: "頓幀微震：受擊方（px）", d: 10, min: 0, max: 16, s: 1 },
        { k: "hsAttacker", n: "頓幀微震：出手方（px）", d: 2.5, min: 0, max: 8, s: 0.5 },
        { k: "shakeMul", n: "畫面震動倍率", d: 1.2, min: 0, max: 2, s: 0.1 },
        { k: "parryMs", n: "完美招架窗口（ms，不含關卡加成）", d: 130, min: 60, max: 250, s: 5 },
        { k: "bossDmgMul", n: "Boss 傷害倍率", d: 1, min: 0.3, max: 2, s: 0.05 },
        { k: "bossWindMul", n: "Boss 一般招式起手時間倍率", d: 1, min: 0.6, max: 1.6, s: 0.05 },
        { k: "recStrong", n: "強招收招下限（秒，傷害≥200 或危招）", d: 0.6, min: 0.3, max: 1.2, s: 0.05 },
        { k: "gifFx", n: "GIF 版特效（1 開／0 舊圖，比較用）", d: 1, min: 0, max: 1, s: 1 },
        { g: "第 3 關二階大招【千鈞鎖脈】" },
        { k: "s3b_d1", n: "第一刀：衝到背後後幾秒砍", d: 0.55, min: 0.25, max: 1.2, s: 0.05 },
        { k: "s3b_d2", n: "第二刀：衝到背後後幾秒砍", d: 0.5, min: 0.25, max: 1.2, s: 0.05 },
        { k: "s3b_charge", n: "千鈞一擊：舉劍到砸下（秒）", d: 1.6, min: 0.8, max: 3, s: 0.1 },
        { k: "s3b_swGap", n: "兩把飛劍間隔（秒）", d: 0.45, min: 0.2, max: 1, s: 0.05 },
        { k: "s3b_flash", n: "劍閃到砸下（秒）", d: 0.25, min: 0.1, max: 0.6, s: 0.05 },
        { g: "第 4 關大招【六劍朝宗】" },
        { k: "s4_atk", n: "飛劍攻擊期（秒）", d: 7, min: 4, max: 12, s: 0.5 },
        { k: "s4_gap", n: "飛劍出手間隔（秒，±15% 亂數）", d: 0.75, min: 0.45, max: 1.4, s: 0.05 },
        { k: "s4_fly", n: "每把飛劍：瞄準＋飛行（秒）", d: 0.8, min: 0.5, max: 1.4, s: 0.05 },
        { k: "s4_swGap", n: "天劍每下間隔（秒）", d: 0.8, min: 0.5, max: 1.4, s: 0.05 },
        { g: "第 5 關大招【幽影噬月／魔焰獸玉】" },
        { k: "s5a_fin", n: "噬月第三撲：懸空聚氣（秒）", d: 0.9, min: 0.4, max: 2, s: 0.1 },
        { k: "s5b_charge", n: "獸玉蓄力（秒）", d: 2.3, min: 1.2, max: 4, s: 0.1 },
        { k: "s5b_headN", n: "獸玉：砍頭幾下打斷", d: 3, min: 1, max: 6, s: 1 },
        { k: "s5b_beam1", n: "獸玉：前噴火柱（秒）", d: 1.6, min: 0.8, max: 3, s: 0.1 },
        { k: "s5b_sweep", n: "獸玉：橫掃回頭（秒，慢→快→慢）", d: 1.4, min: 0.6, max: 3, s: 0.1 },
        { k: "s5b_decay", n: "獸玉：甩到身後後火焰衰弱（秒）", d: 1.0, min: 0.3, max: 2.5, s: 0.1 },
        { k: "s5b_charge2", n: "獸玉：低頭白色集氣（秒）", d: 1.4, min: 0.6, max: 3, s: 0.1 }
      ];
      const Tune = {
        o: {},
        load() { try { this.o = JSON.parse(localStorage.getItem("qingyun_tune") || "{}") || {}; } catch (e) { this.o = {}; } for (const k of Object.keys(this.o)) { const d = this.def(k); if (!d || Math.abs(this.o[k] - d.d) < 1e-9) delete this.o[k]; } }, /* 已等於正式值（例如使用者回報後寫進程式）就清掉 */
        save() { try { localStorage.setItem("qingyun_tune", JSON.stringify(this.o)); } catch (e) { } },
        def(k) { return TUNE_DEFS.find(d => d.k === k); },
        v(k) { const d = this.def(k); const x = this.o[k]; return typeof x === "number" && isFinite(x) ? x : (d ? d.d : 0); },
        set(k, x) { const d = this.def(k); if (!d) return; if (Math.abs(x - d.d) < 1e-9) delete this.o[k]; else this.o[k] = x; this.save(); this.apply(); },
        reset() { this.o = {}; this.save(); this.apply(); },
        changed() { return Object.keys(this.o).length; },
        apply() { if (typeof Config !== "undefined") Config.parryWindowMs = this.v("parryMs"); }, /* 直接寫進 Config 的參數 */
        fmt(k, x) { const d = this.def(k); const dec = (String(d.s).split(".")[1] || "").length; return x.toFixed(dec); },
        el: null,
        open() {
          if (!this.el) this.build();
          this.render(); this.el.classList.add("open");
        },
        close() { if (this.el) this.el.classList.remove("open"); },
        build() {
          const el = document.createElement("div"); el.id = "tune-panel";
          el.innerHTML = '<div class="tune-box"><div class="tune-head"><b>🎚 手感調參</b><span>拉桿即時生效，只存在這台手機</span></div><div class="tune-list"></div>' +
            '<div class="tune-foot"><button type="button" data-a="copy">複製數值</button><button type="button" data-a="reset">全部重設</button><button type="button" data-a="close">關閉</button></div><div class="tune-toast"></div></div>';
          el.addEventListener("click", (e) => {
            const a = e.target.closest("button"); if (!a) return;
            if (a.dataset.a === "close") this.close();
            else if (a.dataset.a === "reset") { this.reset(); this.render(); this.toast("已全部重設為正式值"); }
            else if (a.dataset.a === "copy") this.copy();
            else if (a.dataset.r) { this.set(a.dataset.r, this.def(a.dataset.r).d); this.render(); }
          });
          el.addEventListener("input", (e) => {
            const r = e.target; if (!r.dataset || !r.dataset.k) return;
            const k = r.dataset.k, x = parseFloat(r.value); this.set(k, x);
            const row = r.closest(".tune-row"); row.querySelector(".tune-val").textContent = this.fmt(k, x); row.classList.toggle("mod", k in this.o);
          });
          document.body.appendChild(el); this.el = el;
        },
        render() {
          const L = this.el.querySelector(".tune-list"); let h = "";
          for (const d of TUNE_DEFS) {
            if (d.g) { h += '<div class="tune-g">' + d.g + "</div>"; continue; }
            const x = this.v(d.k);
            h += '<div class="tune-row' + (d.k in this.o ? " mod" : "") + '"><div class="tune-top"><span>' + d.n + '</span><small class="tune-def">正式 ' + this.fmt(d.k, d.d) + '</small><span class="tune-val">' + this.fmt(d.k, x) + '</span><button type="button" data-r="' + d.k + '" title="回正式值">↺</button></div>' +
              '<input type="range" data-k="' + d.k + '" min="' + d.min + '" max="' + d.max + '" step="' + d.s + '" value="' + x + '"></div>';
          }
          L.innerHTML = h;
        },
        copy() {
          const out = {}; for (const k of Object.keys(this.o)) out[k] = this.o[k];
          const txt = this.changed() ? "墨塵傳調參（" + new Date().toLocaleDateString() + "）\n" + TUNE_DEFS.filter(d => d.k && d.k in out).map(d => d.n + "（" + d.k + "）：" + this.fmt(d.k, d.d) + " → " + this.fmt(d.k, out[d.k])).join("\n") : "（沒有改過任何數值）";
          const done = () => this.toast("已複製，直接貼給 Claude");
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => this.copyFallback(txt, done)); else this.copyFallback(txt, done);
        },
        copyFallback(txt, done) {
          const ta = document.createElement("textarea"); ta.value = txt; ta.style.cssText = "position:fixed;left:0;top:0;opacity:0"; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); } catch (e) { this.toast("複製失敗，請截圖"); }
          ta.remove();
        },
        toast(s) { const t = this.el.querySelector(".tune-toast"); t.textContent = s; t.classList.add("on"); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove("on"), 1800); }
      };
      Tune.load();

      /* v0.8.239 卡關救濟（櫻井式〈クリアできないよりマシ〉）：同一關連輸 3 次，問要不要開「護心」輔助（Boss 傷害 −20%、完美招架窗口 +20ms），
         措辭不羞辱、隨時可在齒輪關掉。連輸次數存 qingyun_lose（{關卡: 次數}），過關歸零；護心開關存 qingyun_easy。 */
      const Easy = {
        on: (() => { try { return localStorage.getItem("qingyun_easy") === "1"; } catch (e) { return false; } })(),
        set(v) { this.on = !!v; try { localStorage.setItem("qingyun_easy", v ? "1" : "0"); } catch (e) { } const t = document.getElementById("menu-easy-txt"); if (t) t.textContent = "護心輔助：" + (this.on ? "開" : "關"); },
        streak() { try { return JSON.parse(localStorage.getItem("qingyun_lose") || "{}") || {}; } catch (e) { return {}; } },
        lose(sid) { const o = this.streak(); o[sid] = (o[sid] || 0) + 1; try { localStorage.setItem("qingyun_lose", JSON.stringify(o)); } catch (e) { } return o[sid]; },
        clear(sid) { const o = this.streak(); delete o[sid]; try { localStorage.setItem("qingyun_lose", JSON.stringify(o)); } catch (e) { } },
        /* 輸了之後：連輸 3、6、9…次且還沒開護心 → 先問再重打；否則照常 cb() */
        offer(sid, cb) {
          const n = this.lose(sid);
          if (this.on || n < 3 || n % 3 !== 0) { cb(); return; }
          const el = document.createElement("div"); el.id = "easy-offer";
          el.innerHTML = '<div class="eo-box"><div class="eo-t">這關已經挑戰 ' + n + ' 次了</div><div class="eo-d">要開啟「護心」輔助嗎？<br>Boss 傷害 −20%、完美招架判定 +20ms。<br><small>隨時可在齒輪選單關閉，不影響結算。</small></div>' +
            '<div class="eo-b"><button type="button" data-v="1">開啟並重來</button><button type="button" data-v="0">不用，再戰</button></div></div>';
          el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.v === "1") this.set(true); el.remove(); cb(); });
          document.body.appendChild(el);
        }
      };
