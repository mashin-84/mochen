#!/usr/bin/env python3
"""v0.8.262 音效響度校正表：python3 tools/sfx_loudness.py [--dry]
量 assets/sfx/*.mp3 每個檔「最響 0.3 秒」的響度（先 120Hz 高通，近似耳朵對低頻較不敏感），
依分層目標算出校正 dB（限制 -12～+9），寫進 src/11_audio.js 的 SFX_NORM 區塊（不改音檔本身）。
分層：HI 關鍵回饋（招架、受擊、處決、危招）-13；LOW 呼嘯／位移／瞬移 -20；其餘（Boss 招式、大招）-16。
峰值 < -20 dBFS 的檔視為壞檔（例：第 5 關狼聲），不校正、列出警告。新增音效後重跑一次再 build。"""
import sys, os, re, glob, subprocess, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HI = re.compile(r"^(g_parry|g_hit|g_mikiri|g_execution|g_peril|g_block|sfx_hit|sfx_hurt|sfx_ult|b2u_shatter|b2_shatter(_\d)?|c_clang_big)$")
LOW = re.compile(r"^(b2_vanish.*|b2_appear.*|b3_dash.*|c_dash_.*|c_vanish|c_sword_throw|b2_sword_fly.*|g_flysword|g_gourd|g_assist|sfx_skill|c_slash_light|c_shing|s4_summon)$")
T_HI, T_MID, T_LOW = -13.0, -16.0, -20.0
def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "22050", "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768.0, 22050
def loud(a, sr):
    if len(a) < 64: return -99.0, -99.0
    # 一階高通 120Hz
    rc = 1 / (2 * np.pi * 120); al = rc / (rc + 1 / sr); y = np.empty_like(a); y[0] = a[0]
    for i in range(1, len(a)): y[i] = al * (y[i - 1] + a[i] - a[i - 1])
    w, hop = int(sr * 0.3), int(sr * 0.05); best = 1e-12
    for i in range(0, max(1, len(y) - w + 1), hop):
        seg = y[i:i + w]; best = max(best, float(np.mean(seg ** 2)))
    return 10 * np.log10(best), 20 * np.log10(np.abs(a).max() + 1e-12)
rows = []
for p in sorted(glob.glob(os.path.join(ROOT, "assets/sfx/*.mp3"))):
    n = os.path.splitext(os.path.basename(p))[0]; a, sr = load(p); L, pk = loud(a, sr)
    if pk < -20: rows.append((n, L, pk, None, "壞檔?")); continue  # v0.8.267 狼聲 11 檔已用原檔重做；m_roar 仍是壞檔（等使用者原檔或重生）
    t = T_HI if HI.match(n) else T_LOW if LOW.match(n) else T_MID
    g = max(-12.0, min(9.0, t - L, 2.0 - pk))  # 放大後峰值不超過 +2 dB（避免限幅器硬壓失真）
    rows.append((n, L, pk, round(g, 1), "HI" if t == T_HI else "LOW" if t == T_LOW else "MID"))
for r in sorted(rows, key=lambda r: r[1]):
    print(f"{r[0]:18s} 響度 {r[1]:6.1f}  峰值 {r[2]:6.1f}  {r[4]:4s} 校正 {r[3] if r[3] is not None else '—'}")
if "--dry" in sys.argv: sys.exit(0)
tbl = ", ".join(f"{r[0]}: {r[3]}" for r in rows if r[3] is not None)
src = os.path.join(ROOT, "src/11_audio.js"); s = open(src, encoding="utf-8").read()
new = f"/* @SFX_NORM 由 tools/sfx_loudness.py 產生，勿手改 */ const SFX_NORM = {{ {tbl} }}; /* @SFX_NORM_END */"
s2 = re.sub(r"/\* @SFX_NORM .*?/\* @SFX_NORM_END \*/", lambda m: new, s, flags=re.S)
if s2 == s and "@SFX_NORM" not in s: print("找不到 @SFX_NORM 區塊"); sys.exit(1)
open(src, "w", encoding="utf-8").write(s2); print("已寫入", sum(1 for r in rows if r[3] is not None), "筆")
