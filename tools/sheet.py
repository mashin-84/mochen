"""動作表切圖：python3 sheet.py 動作表.jpg 輸出資料夾 [目標待機高度=492]
洋紅底 4x4 網格 → 16 格去背，統一縮放（以第 1 格為準）、腳底落在 y=560、腳中心對齊 x=450，輸出 900x600 webp。
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
NAMES = ["01_idle1","02_idle2","03_walk1","04_walk2","05_walk3","06_walk4","07_windup","08_windup_thrust",
         "09_slash","10_slash_rec","11_thrust","12_thrust_rec","13_sweep","14_cast","15_hurt","16_stagger"]
W, H, AX, BY = 900, 600, 450, 560
def key_magenta(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = np.clip(np.minimum(r, b) - g, 0, 255)
    bg = mag > 150
    alpha = np.where(bg, 0, np.clip((150 - mag) * 255 / 110, 0, 255))
    edge = ndi.binary_dilation(bg, iterations=4) & ~bg
    sp = edge & (mag > 12); out = a.copy(); k = 0.15
    out[..., 0] = np.where(sp, g + (r - g) * k, r); out[..., 2] = np.where(sp, g + (b - g) * k, b)
    return np.dstack([np.clip(out, 0, 255), alpha]).astype(np.uint8)
def cell_rgba(img, c, cols=4, rows=4):
    Wi, Hi = img.size; cw, ch = Wi // cols, Hi // rows
    x0, y0 = (c % cols) * cw, (c // cols) * ch
    a = np.asarray(img.crop((x0, y0, x0 + cw, y0 + ch)).convert('RGB')).astype(float)
    rgba = key_magenta(a); m = rgba[..., 3] > 40
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=5))
    if n == 0: raise SystemExit(f'cell {c+1} empty')
    sizes = ndi.sum(m, lab, range(1, n + 1)); big = 1 + int(np.argmax(sizes))
    keep = np.zeros_like(m)
    for i in range(1, n + 1):
        comp = lab == i
        touches = comp[0].any() or comp[-1].any() or comp[:, 0].any() or comp[:, -1].any()
        if i == big or (sizes[i - 1] > 150 and not touches): keep |= comp
    rgba[..., 3] = np.where(keep & ndi.binary_dilation(m, iterations=2), rgba[..., 3], 0)
    return rgba
def bbox(a):
    ys, xs = np.where(a[..., 3] > 40); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
def main(src, outdir, target=492):
    img = Image.open(src); os.makedirs(outdir, exist_ok=True)
    cells = [cell_rgba(img, c) for c in range(16)]
    x0, y0, x1, y1 = bbox(cells[0]); S = target / (y1 - y0)
    print('scale', round(S, 3), 'idle h', y1 - y0)
    meta = []
    for k, rgba in enumerate(cells):
        x0, y0, x1, y1 = bbox(rgba)
        h = y1 - y0; lo = rgba[int(y1 - max(8, h * 0.08)):y1, :, 3] > 40
        _, fx = np.where(lo); feet_c = (fx.min() + fx.max()) / 2
        im = Image.fromarray(rgba).resize((int(rgba.shape[1] * S), int(rgba.shape[0] * S)), Image.LANCZOS)
        ox = int(round(AX - feet_c * S)); oy = int(round(BY - y1 * S))
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        cv.alpha_composite(im.crop((max(0, -ox), max(0, -oy), min(im.width, W - ox), min(im.height, H - oy))), (max(0, ox), max(0, oy)))
        a = np.asarray(cv)[..., 3] > 10; ys, xs = np.where(a)
        if xs.min() == 0 or xs.max() == W - 1 or ys.min() == 0: print('  WARN clipped', NAMES[k])
        cv.save(f'{outdir}/{NAMES[k]}.webp', quality=90, method=6)
        meta.append(NAMES[k])
    json.dump({"canvas": [W, H], "anchorX": AX, "baselineY": BY, "facing": "right", "frames": [n.split('_', 1)[1] for n in NAMES]}, open(f'{outdir}/meta.json', 'w'))
if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 492)
