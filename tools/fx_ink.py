#!/usr/bin/env python3
"""白底水墨特效圖處理（v0.8.240）：python3 tools/fx_ink.py 輸入.jpg 輸出.webp
白底黑墨 → 透明底：透明度＝墨色深淺（亮度越低越不透明），顏色統一成深藍墨（18,22,38），淡灰暈染自然變半透明，不會有洋紅去背的粉紅邊。
縮成 1024（4×4、每格 256）、扣掉紙白底噪、每格邊緣 12px 淡出。遊戲內用 spawnFx(..., {add:false}) 一般混色播放。"""
import sys, numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("L").resize((1024, 1024), Image.LANCZOS)
d = 255.0 - np.asarray(im).astype(np.float32)          # 墨的深度
a = np.clip((d - 14) * (255.0 / (255 - 14 - 40)), 0, 255)  # 扣紙白底噪；深墨（>~215）就全不透明
m = np.ones((1024, 1024), np.float32)
ramp = np.clip(np.arange(256) / 12.0, 0, 1); edge = np.minimum(ramp, ramp[::-1])
for c in range(4):
    for r in range(4):
        m[r*256:r*256+256, c*256:c*256+256] = np.outer(edge, edge)
a *= m
out = np.zeros((1024, 1024, 4), np.uint8); out[..., 0] = 18; out[..., 1] = 22; out[..., 2] = 38; out[..., 3] = a.astype(np.uint8)
Image.fromarray(out, "RGBA").save(dst, "WEBP", quality=90, method=6)
