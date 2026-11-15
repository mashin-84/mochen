#!/usr/bin/env python3
"""主角影片抽幀（v0.8.198）：python3 tools/mc_vid.py 影格資料夾 前綴 幀號,幀號,...
綠幕嚴格去背（gm>28 透明，連影片自帶的半透明綠刀光一起去掉）＋去綠溢色＋只留最大塊；
縮放以第 0 幀（站姿）高度對 assets/mc/01_idle1 的 477px，腳底 529、x 以第 0 幀質心對 450；色調對齊 01_idle1。
輸出 assets/mc/<前綴>_01.. .webp（1300×800，腳底距下緣 31px＝與 900×560 的腳底 529 同一基準，繪製端以圖寬一半、圖高-31 對齊）。"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
d, pre, sel = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
def key(i):
    a = np.asarray(Image.open(f'{d}/f_{i+1:03d}.png').convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; gm = g - np.maximum(r, b)
    al = np.clip((28 - gm) * 255 / 20, 0, 255); g2 = np.minimum(g, np.maximum(r, b) + 4)
    m = al > 128; lab, n = ndi.label(ndi.binary_dilation(m, iterations=3))
    if n > 1:
        sz = ndi.sum(m, lab, range(1, n + 1)); keep = lab == (1 + int(np.argmax(sz))); al = np.where(ndi.binary_dilation(keep, iterations=2), al, 0)
    return np.dstack([r, g2, b, al]).astype(np.uint8)
f0 = key(0); ys, xs = np.where(f0[..., 3] > 128); S = 477 / (ys.max() - ys.min() + 1); ground = ys.max(); cx = xs.mean()
ex = np.asarray(Image.open('assets/mc/01_idle1.webp').convert('RGBA')).astype(float); exm = ex[..., :3][ex[..., 3] > 200].mean(axis=0)
gain = np.clip(exm / f0[..., :3][f0[..., 3] > 200].astype(float).mean(axis=0), 0.85, 1.18)
for k, i in enumerate(sel):
    a = key(i).astype(float); a[..., :3] = np.clip(a[..., :3] * gain, 0, 255); im = Image.fromarray(a.astype(np.uint8), 'RGBA')
    im = im.resize((round(im.width * S), round(im.height * S)), Image.LANCZOS)
    CW, CH = 1300, 800; ox = round(CW / 2 - cx * S); oy = round(CH - 31 - ground * S); cv = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    cv.alpha_composite(im.crop((max(0, -ox), max(0, -oy), min(im.width, CW - ox), min(im.height, CH - oy))), (max(0, ox), max(0, oy)))
    A = np.asarray(cv)[..., 3] > 10; yy, xx = np.where(A)
    if xx.min() == 0 or xx.max() == CW - 1 or yy.min() == 0: print('  裁到邊', pre, k + 1)
    cv.save(f'assets/mc/{pre}_{k + 1:02d}.webp', 'WEBP', quality=90, method=6)
print(pre, len(sel), 'S', round(S, 3), 'gain', gain.round(3))
