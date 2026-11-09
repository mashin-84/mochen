#!/usr/bin/env python3
"""不規則格子的洋紅底關鍵格切圖（v0.8.147 魔焰獸玉 7 格用過）：python3 tools/cut_keys.py 設定.json
設定：{"src": 原圖, "out": 輸出資料夾, "pad": 4, "cells": [{"name": "64_br_deep", "rect": [x0,y0,x1,y1]}…],
       "scale": 0.46  或  "match": {"cell": 2, "height": 409}（以第 cell 格的去背後高度對到 height，算出統一縮放）}
rect 用原圖像素。流程：去黑格線（sheet.strip_lines）→ 洋紅去背 → 只留大元件 → 統一縮放 → 質心對 x=450、腳底 y=560，輸出 900×600 webp。
另印出每格「嘴部發光」中心（相對腳底中心的 dx, dy；沒有發光就印 None，需手量）。"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, sheet
from PIL import Image
from scipy import ndimage as ndi
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
arr = sheet.strip_lines(np.asarray(Image.open(cfg["src"]).convert('RGB')).astype(float))
pad = cfg.get("pad", 4); cells = []
for c in cfg["cells"]:
    x0, y0, x1, y1 = c["rect"]; sub = arr[y0 + pad:y1 - pad, x0 + pad:x1 - pad]
    rgba = sheet.key_magenta(sub); m = rgba[..., 3] > 40
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=5)); sizes = ndi.sum(m, lab, range(1, n + 1))
    keep = np.zeros_like(m)
    for i in range(1, n + 1):
        comp = lab == i; touches = comp[0].any() or comp[-1].any() or comp[:, 0].any() or comp[:, -1].any()
        if sizes[i - 1] == sizes.max() or (sizes[i - 1] > 0.15 * sizes.max() and not touches): keep |= comp
    rgba[..., 3] = np.where(keep & ndi.binary_dilation(m, iterations=2), rgba[..., 3], 0)
    cells.append((c["name"], rgba, sub))
def bbox(r): ys, xs = np.where(r[..., 3] > 40); return xs.min(), ys.min(), xs.max(), ys.max()
if "scale" in cfg: sc = cfg["scale"]
else: b = bbox(cells[cfg["match"]["cell"]][1]); sc = cfg["match"]["height"] / (b[3] - b[1] + 1)
print("scale", round(sc, 4)); os.makedirs(cfg["out"], exist_ok=True)
for name, rgba, sub in cells:
    b = bbox(rgba); R, G, B = sub[..., 0], sub[..., 1], sub[..., 2]
    gl = (B > 200) & (R > 175) & (B >= R) & (G > 110) & (G < R - 10) & (rgba[..., 3] > 40); ys, xs = np.where(gl)
    im = Image.fromarray(rgba[b[1]:b[3] + 1, b[0]:b[2] + 1], 'RGBA'); im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
    a = np.asarray(im)[..., 3]; cx = np.where(a > 40)[1].mean()
    out = Image.new('RGBA', (900, 600), (0, 0, 0, 0)); ox = round(450 - cx); oy = 560 - im.height
    out.alpha_composite(im, (ox, oy)); out.save(os.path.join(cfg["out"], name + ".webp"), 'WEBP', quality=92, method=6)
    mouth = (round(ox + (xs.mean() - b[0]) * sc - 450), round(oy + (ys.mean() - b[1]) * sc - 560)) if len(xs) > 60 else None
    print(name, im.size, "mouth", mouth)
