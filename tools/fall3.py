"""倒地三格（單列 3 姿勢、洋紅底）：python3 fall3.py 倒地.jpg 輸出資料夾 [縮放=0.58]
依元件分組（不按等寬網格）；只留人（丟掉掉在地上的武器），腳底/身體底落在 y=560、水平置中 x=450 → 17_kneel / 18_fall / 19_lie.webp"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import key_magenta
src, outdir = sys.argv[1], sys.argv[2]; S = float(sys.argv[3]) if len(sys.argv) > 3 else 0.58
img = Image.open(src).convert('RGB'); a = np.asarray(img).astype(float)
rgba = key_magenta(a); m = rgba[..., 3] > 40
lab, n = ndi.label(ndi.binary_dilation(m, iterations=5))
comps = []
for i in range(1, n + 1):
    ys, xs = np.where((lab == i) & m)
    if len(ys) < 150: continue
    comps.append((i, len(ys), xs.mean(), xs.min(), xs.max(), ys.min(), ys.max()))
comps.sort(key=lambda c: -c[1])
print([(c[0], c[1], int(c[2])) for c in comps[:12]])
# 人 = 面積最大的 3 個元件（依 x 由左到右）；武器較小或較細
persons = sorted(comps[:3], key=lambda c: c[2])
W, H, AX, BY = 900, 600, 450, 560
os.makedirs(outdir, exist_ok=True)
for (c, name) in zip(persons, ['17_kneel', '18_fall', '19_lie']):
    i, sz, cx, x0, x1, y0, y1 = c
    keep = (lab == i) & ndi.binary_dilation(m, iterations=2)
    sub = rgba[y0:y1 + 1, x0:x1 + 1].copy(); sub[~keep[y0:y1 + 1, x0:x1 + 1], 3] = 0
    # 去掉黏在人身上的淺藍劍身（b 明顯大於 r、且偏亮）；之後只留最大塊
    r_, g_, b_ = sub[..., 0].astype(int), sub[..., 1].astype(int), sub[..., 2].astype(int)
    blade = (b_ > r_ + 12) & (g_ > r_ + 5) & ((r_ + g_ + b_) / 3 > 150)
    sub[ndi.binary_dilation(blade, iterations=1), 3] = 0
    l2, n2 = ndi.label(sub[..., 3] > 40)
    if n2 > 1:
        sz2 = ndi.sum(sub[..., 3] > 40, l2, range(1, n2 + 1)); big = 1 + int(np.argmax(sz2))
        sub[ndi.binary_dilation(l2 == big, iterations=3) == False, 3] = 0
    ys2, xs2 = np.where(sub[..., 3] > 40); sub = sub[ys2.min():ys2.max() + 1, xs2.min():xs2.max() + 1]
    im = Image.fromarray(sub).resize((int(sub.shape[1] * S), int(sub.shape[0] * S)), Image.LANCZOS)
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ox = int(AX - im.width / 2); oy = BY - im.height
    cv.alpha_composite(im, (ox, oy)); cv.save(f'{outdir}/{name}.webp', quality=90, method=6)
    print(name, im.size, 'sz', sz)
