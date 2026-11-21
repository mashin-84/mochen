#!/usr/bin/env python3
"""v0.8.268 第 5 關 m_roar 疊層（真實音檔疊加，不合成）：python3 tools/sfx_layer_s5.py 主層.mp3 副層.mp3 輸出.mp3
主層＋副層（起音對齊、0.75）＋主層放慢 0.68 倍（低 6～7 個半音，補低頻撐巨獸體型、0.55）；限 1.75 秒、淡出 0.12、峰值 -1.5 dBFS、單聲道。
用的是 ElevenLabs 生的兩個乾淨版（另兩個爆音的不用）。"""
import subprocess, sys, numpy as np

SR = 44100
def load(p): return np.frombuffer(subprocess.run(['ffmpeg','-nostdin','-v','quiet','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout,np.float32).copy()
def norm(x, db=0): return x/(np.abs(x).max()+1e-9)*10**(db/20)
def onset(x): e=np.abs(x); return int(np.argmax(e > e.max()*0.08))
def slow(x, k): n = int(len(x)/k); return np.interp(np.arange(n)*k, np.arange(len(x)), x).astype(np.float32)  # 放慢＝音高降低
a, b = norm(load(sys.argv[1])), norm(load(sys.argv[2])); a = a[max(0, onset(a)-int(0.01*SR)):]; b = b[max(0, onset(b)-int(0.01*SR)):]
lo = norm(slow(a, 0.68)); lo = lo[max(0, onset(lo)-int(0.01*SR)):]
n = int(1.75*SR); out = np.zeros(n, np.float32)
for l, g in [(a, 1.0), (b, 0.75), (lo, 0.55)]: m = min(n, len(l)); out[:m] += l[:m]*g
nz = np.nonzero(np.abs(out) > 1e-4)[0]; out = out[:nz[-1]+1]
f = int(0.12*SR); out[-f:] *= np.linspace(1, 0, f); out[:int(0.005*SR)] *= np.linspace(0, 1, int(0.005*SR))
out = norm(out, -1.5)
subprocess.run(['ffmpeg','-nostdin','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','libmp3lame','-b:a','128k',sys.argv[3]], input=out.tobytes())
