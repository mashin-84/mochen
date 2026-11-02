"""登場／特殊姿勢切圖：python3 poses.py 姿勢表.jpg 輸出資料夾 縮放比 [名稱,...]
洋紅底 2x2（共 4 格）→ 去背（含去掉殘留的黑色格線）、統一縮放（用同一個縮放比，保持各格人物大小一致），
腳底（bbox 底）落在 y=560、最低 8% 範圍的水平中心對齊 x=450，輸出 900x600 webp。
縮放比的找法：用站姿單格量「頭盔羽飾頂到靴底」的高度，除以姿勢表裡接近站姿的那格同樣的高度。
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import key_magenta, strip_lines, bbox, W, H, AX, BY
def cell(img, c, cols=2, rows=2, pad=10):
    Wi, Hi = img.size; cw, ch = Wi // cols, Hi // rows
    x0, y0 = (c % cols) * cw, (c // cols) * ch
    a = np.asarray(img.crop((x0 + pad, y0 + pad, x0 + cw - pad, y0 + ch - pad)).convert('RGB')).astype(float)
    a = strip_lines(a)
    rgba = key_magenta(a); m = rgba[..., 3] > 40
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=5))
    sizes = ndi.sum(m, lab, range(1, n + 1)); big = 1 + int(np.argmax(sizes))
    keep = np.zeros_like(m)
    for i in range(1, n + 1):
        comp = lab == i
        if i == big or (sizes[i - 1] > 150 and not (comp[0].any() or comp[-1].any() or comp[:, 0].any() or comp[:, -1].any())): keep |= comp
    rgba[..., 3] = np.where(keep & ndi.binary_dilation(m, iterations=2), rgba[..., 3], 0)
    return rgba
if __name__ == '__main__':
    src, outdir, S = sys.argv[1], sys.argv[2], float(sys.argv[3])
    names = sys.argv[4].split(',') if len(sys.argv) > 4 else ['20_jump', '21_fall', '22_land', '23_rise']
    img = Image.open(src); os.makedirs(outdir, exist_ok=True)
    for k, nm in enumerate(names):
        rgba = cell(img, k); x0, y0, x1, y1 = bbox(rgba); rgba = rgba[y0:y1, x0:x1]
        h = rgba.shape[0]; lo = rgba[int(h - max(8, h * 0.08)):, :, 3] > 40
        _, fx = np.where(lo); feet_c = (fx.min() + fx.max()) / 2
        im = Image.fromarray(rgba).resize((max(1, int(rgba.shape[1] * S)), max(1, int(h * S))), Image.LANCZOS)
        ox = int(round(AX - feet_c * S)); oy = int(round(BY - im.height))
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        cv.alpha_composite(im.crop((max(0, -ox), max(0, -oy), min(im.width, W - ox), min(im.height, H - oy))), (max(0, ox), max(0, oy)))
        a = np.asarray(cv)[..., 3] > 10; ys, xs = np.where(a)
        if xs.min() == 0 or xs.max() == W - 1 or ys.min() == 0: print('  WARN clipped', nm)
        print(nm, 'src bbox h', h, 'out', im.size)
        cv.save(f'{outdir}/{nm}.webp', quality=90, method=6)
