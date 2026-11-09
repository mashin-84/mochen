#!/usr/bin/env python3
"""黑底發光特效圖處理：python3 tools/fx_black.py 輸入.jpg 輸出.webp [列:邊緣淡出px …]（例：3:70 表示第 4 列用 70px 邊緣淡出，預設 12）
縮成 1024、扣掉底噪（黑底 floor 18）、每格邊緣 12px 淡出（避免相鄰格漏光）。"""
import sys, numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB").resize((1024, 1024), Image.LANCZOS)
a = np.asarray(im).astype(np.float32)
a = np.clip((a - 18) * (255.0 / (255 - 18)), 0, 255)
m = np.ones((1024, 1024), np.float32)
fades = {int(a.split(":")[0]): float(a.split(":")[1]) for a in sys.argv[3:]}
for c in range(4):
    for r in range(4):
        ramp = np.clip(np.arange(256) / fades.get(r, 12.0), 0, 1)
        edge = np.minimum(ramp, ramp[::-1])
        sl = (slice(r*256, r*256+256), slice(c*256, c*256+256))
        m[sl] = np.outer(edge, edge)
a *= m[..., None]
Image.fromarray(a.astype(np.uint8)).save(dst, "WEBP", quality=88, method=6)
