#!/usr/bin/env python3
"""GIF／影片轉出的黑底發光特效 → 16 格連續序列特效圖（4×4、每格 256，由左到右、由上到下＝第 0～15 格）。
用法：python3 tools/gif2sheet.py 輸入.gif 輸出.webp --frames 8:29 --center 320,180 --size 360 [--loop 6] [--fadeout 5] [--edge 30]
  --frames a:b  取第 a～b 格（含），平均挑 16 格；有 --loop K 時多取 K 格做頭尾交叉淡化（無縫循環）
  --center/--size  以 (x,y) 為中心裁 size×size 正方形（超出原圖補黑）
  --fadeout K   最後 K 格亮度漸減到 0（一次性特效收尾）
  --edge px     每格邊緣淡出（避免粒子在格邊被切成直線），預設 24
  --rect x0,y0,x1,y1  改用長方形裁切（壓成 256×256，遊戲內用 w／h 還原比例；取代 --center/--size）
  --blank y0:y1 把原圖這幾列塗黑（擦掉 AI 自己畫的地平線）　--tint r,g,b 依亮度重新上色（統一色調，0～1）
遊戲內用 spawnFx(名, 0, x, y, {seq:true, ...}) 播 16 格（70_fx.js 的 seq 會跨列）。"""
import sys, argparse, numpy as np
from PIL import Image, ImageSequence
ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("dst")
ap.add_argument("--frames", default=None); ap.add_argument("--center", default=None); ap.add_argument("--size", type=int, default=None)
ap.add_argument("--loop", type=int, default=0); ap.add_argument("--fadeout", type=int, default=0); ap.add_argument("--edge", type=float, default=24)
ap.add_argument("--rect", default=None); ap.add_argument("--blank", default=None); ap.add_argument("--tint", default=None)
A = ap.parse_args()
fr = [np.asarray(f.convert("RGB")).astype(np.float32) for f in ImageSequence.Iterator(Image.open(A.src))]
H, W = fr[0].shape[:2]
if A.blank:
    b0, b1 = map(int, A.blank.split(":"))
    for f in fr: f[b0:b1 + 1] = 0
if A.tint:
    tc = np.array([float(v) for v in A.tint.split(",")], np.float32)
    fr = [np.clip(f.max(2, keepdims=True) * tc, 0, 255) for f in fr]
a, b = (map(int, A.frames.split(":")) if A.frames else (0, len(fr) - 1))
K = A.loop
idx = np.round(np.linspace(a, b - K, 16)).astype(int) if K else np.round(np.linspace(a, b, 16)).astype(int)
step = (b - K - a) / 15.0 if K else 1
seq = []
for i, j in enumerate(idx):
    f = fr[j].copy()
    if K and i < K:  # 頭 K 格與「第 16 格之後」的 K 格交叉淡化 → 第 15 格接回第 0 格不跳
        j2 = min(len(fr) - 1, int(round(j + step * 16))); w = (i + 1) / (K + 1)
        f = f * w + fr[j2] * (1 - w)
    seq.append(f)
if A.fadeout:
    for i in range(A.fadeout):
        seq[15 - i] *= i / A.fadeout
cx, cy = (map(int, A.center.split(",")) if A.center else (W // 2, H // 2)); S = A.size or min(W, H)
ramp = np.clip(np.arange(256) / A.edge, 0, 1); edge = np.outer(np.minimum(ramp, ramp[::-1]), np.minimum(ramp, ramp[::-1]))[..., None]
out = np.zeros((1024, 1024, 3), np.float32)
for i, f in enumerate(seq):
    if A.rect: x0, y0, x1, y1 = map(int, A.rect.split(",")); can = f[y0:y1, x0:x1]
    else:
        can = np.zeros((S, S, 3), np.float32); x0, y0 = cx - S // 2, cy - S // 2
        sx0, sy0, sx1, sy1 = max(0, x0), max(0, y0), min(W, x0 + S), min(H, y0 + S)
        can[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = f[sy0:sy1, sx0:sx1]
    c = np.asarray(Image.fromarray(np.clip(can, 0, 255).astype(np.uint8)).resize((256, 256), Image.LANCZOS)).astype(np.float32)
    c = np.clip((c - 18) * (255.0 / 237), 0, 255) * edge
    out[(i // 4) * 256:(i // 4) * 256 + 256, (i % 4) * 256:(i % 4) * 256 + 256] = c
Image.fromarray(out.astype(np.uint8)).save(A.dst, "WEBP", quality=88, method=6)
print("frames", list(idx), "loop", K, "->", A.dst)
