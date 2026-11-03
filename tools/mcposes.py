"""主角特殊姿勢切圖（單列多姿勢、洋紅底、各姿勢彼此分離）：
python3 mcposes.py 圖.jpg 輸出資料夾 縮放比 名稱1,名稱2,… [取第幾個元件(由左到右,逗號分隔,預設依序 0,1,2…)]
依元件分組（不按等寬網格），輸出 900×560 webp：腳底（bbox 底）落在 y=529、最低 8% 範圍的水平中心對齊 x=450（和主角動作格一致）。"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import key_magenta
src, outdir, S = sys.argv[1], sys.argv[2], float(sys.argv[3])
names = sys.argv[4].split(',')
pick = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 else list(range(len(names)))
img = Image.open(src).convert('RGB'); a = np.asarray(img).astype(float)
rgba = key_magenta(a); m = rgba[..., 3] > 40
lab, n = ndi.label(ndi.binary_dilation(m, iterations=4))
comps = []
for i in range(1, n + 1):
    ys, xs = np.where((lab == i) & m)
    if len(ys) > 3000: comps.append((i, xs.mean()))
comps.sort(key=lambda c: c[1]); print('components', len(comps))
W, H, AX, BY = 900, 560, 450, 529
os.makedirs(outdir, exist_ok=True)
for nm, k in zip(names, pick):
    i = comps[k][0]
    keep = (lab == i) & ndi.binary_dilation(m, iterations=2)
    ys, xs = np.where(keep); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub = rgba[y0:y1, x0:x1].copy(); sub[~keep[y0:y1, x0:x1], 3] = 0
    h = sub.shape[0]; lo = sub[int(h - max(8, h * 0.08)):, :, 3] > 40
    _, fx = np.where(lo); feet_c = (fx.min() + fx.max()) / 2
    im = Image.fromarray(sub).resize((max(1, int(sub.shape[1] * S)), max(1, int(h * S))), Image.LANCZOS)
    ox = int(round(AX - feet_c * S)); oy = int(round(BY - im.height))
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cv.alpha_composite(im.crop((max(0, -ox), max(0, -oy), min(im.width, W - ox), min(im.height, H - oy))), (max(0, ox), max(0, oy)))
    aa = np.asarray(cv)[..., 3] > 10; yy, xx = np.where(aa)
    if xx.min() == 0 or xx.max() == W - 1 or yy.min() == 0: print('  WARN clipped', nm)
    cv.save(f'{outdir}/{nm}.webp', quality=90, method=6); print(nm, im.size)
