"""關鍵姿勢表切圖（洋紅底、可有格線與英文標籤）：
自動模式：python3 keyposes.py 圖.jpg 輸出資料夾 縮放比 auto            → 依元件由上到下、由左到右輸出 p01…pNN.webp
格子模式：python3 keyposes.py 圖.jpg 輸出資料夾 縮放比 grid 欄 列 [內縮=14] → 每格取一個姿勢 c01…cNN.webp
去掉「幾乎全黑」的元件（格線、英文標籤），保留彩色元件（同格內相近的火焰碎片會併入主體）。
輸出 900×600、腳底（bbox 底）y=560、最低 8% 範圍水平中心 x=450。"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import key_magenta
W, H, AX, BY = 900, 600, 450, 560
def not_text(a, lab, i):
    px = a[lab == i]
    return (px.mean(axis=1) < 60).mean() < 0.2  # 英文標籤與格線：近黑像素比例高；角色只有細輪廓是暗的
def extract(a, S):
    rgba = key_magenta(a); m = rgba[..., 3] > 40
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=6))
    comps = []
    for i in range(1, n + 1):
        mm = (lab == i) & m
        if mm.sum() < 400: continue
        if not not_text(a, lab, i): continue
        ys, xs = np.where(mm); comps.append((mm.sum(), i, xs.min(), xs.max(), ys.min(), ys.max()))
    return rgba, m, lab, comps
def render(rgba, m, lab, ids, S, path):
    keep = np.isin(lab, ids) & m
    ys, xs = np.where(keep); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub = rgba[y0:y1, x0:x1].copy(); sub[~keep[y0:y1, x0:x1], 3] = 0
    h = sub.shape[0]; lo = sub[int(h - max(8, h * 0.08)):, :, 3] > 40
    _, fx = np.where(lo); feet_c = (fx.min() + fx.max()) / 2
    im = Image.fromarray(sub).resize((max(1, int(sub.shape[1] * S)), max(1, int(h * S))), Image.LANCZOS)
    ox = int(round(AX - feet_c * S)); oy = int(round(BY - im.height))
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cv.alpha_composite(im.crop((max(0, -ox), max(0, -oy), min(im.width, W - ox), min(im.height, H - oy))), (max(0, ox), max(0, oy)))
    aa = np.asarray(cv)[..., 3] > 10; yy, xx = np.where(aa)
    if xx.min() == 0 or xx.max() == W - 1 or yy.min() == 0: print('  WARN clipped', os.path.basename(path))
    cv.save(path, quality=90, method=6)
if __name__ == '__main__':
    src, out, S, mode = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
    os.makedirs(out, exist_ok=True)
    img = Image.open(src).convert('RGB'); full = np.asarray(img).astype(float)
    if mode == 'auto':
        rgba, m, lab, comps = extract(full, S)
        comps = [c for c in comps if c[0] > 3000]
        comps.sort(key=lambda c: ((c[4] + c[5]) // 2 // 300, (c[2] + c[3]) // 2))  # 粗略列（每 300px 一列）再依 x
        for k, c in enumerate(comps):
            render(rgba, m, lab, [c[1]], S, f'{out}/p{k+1:02d}.webp')
        print('poses', len(comps))
    else:
        cols, rows = int(sys.argv[5]), int(sys.argv[6]); pad = int(sys.argv[7]) if len(sys.argv) > 7 else 14
        cw, ch = img.width // cols, img.height // rows
        for k in range(cols * rows):
            x0, y0 = (k % cols) * cw, (k // cols) * ch
            a = full[y0 + pad:y0 + ch - max(pad, int(ch * 0.10)), x0 + pad:x0 + cw - pad]  # 底部 10% 常有英文標籤，一併切掉
            rgba, m, lab, comps = extract(a, S)
            if not comps: print('empty', k + 1); continue
            main = max(comps)
            ids = [c[1] for c in comps if c[1] == main[1] or (c[2] < main[3] + 40 and c[3] > main[2] - 40 and c[4] < main[5] + 40 and c[5] > main[4] - 40)]
            render(rgba, m, lab, ids, S, f'{out}/c{k+1:02d}.webp')
        print('cells', cols * rows)
