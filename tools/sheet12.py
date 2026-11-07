"""主角補格切圖（v0.8.97）：python3 sheet12.py 動作表.jpg 輸出資料夾 [上緣基準格索引=2] [基準高度=466]
洋紅底 4 欄 x 3 列 = 12 格（逐列 band 標記，去格線），統一縮放（以基準格高度為準），腳底落在 y=525、腳中心對齊 x=450，輸出 900x560 webp。"""
import sys, os
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import sheet as S
NAMES = ["29_parry_a","30_parry_b","31_parry_c","32_jump_a","33_dash_a","34_dash_b","35_dash_c","36_hurt_a",
         "37_hurt_b","38_hv_a","39_hv_b","40_hv_c"]
W, H, AX, BY = 900, 560, 450, 525
def main(src, outdir, ref=2, refh=466):
    img = Image.open(src).convert('RGB'); os.makedirs(outdir, exist_ok=True)
    cells = [c for r in range(3) for c in S.band_cells(img, r, cols=4, rows=3)]
    from scipy import ndimage as ndi
    for rgba in cells:  # 濾掉殘留格線：高度 <=8px 且寬 >=60px 的細長元件
        lab, n = ndi.label(rgba[..., 3] > 40)
        for i, sl in enumerate(ndi.find_objects(lab), 1):
            hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            if hh <= 8 and ww >= 60: rgba[..., 3][sl] = np.where(lab[sl] == i, 0, rgba[..., 3][sl])
    x0, y0, x1, y1 = S.bbox(cells[ref]); sc = refh / (y1 - y0)
    print('scale', round(sc, 3), 'ref cell h', y1 - y0)
    for k, rgba in enumerate(cells):
        x0, y0, x1, y1 = S.bbox(rgba); h = y1 - y0
        lo = rgba[int(y1 - max(8, h * 0.08)):y1, :, 3] > 40; _, fx = np.where(lo); feet_c = (fx.min() + fx.max()) / 2
        im = Image.fromarray(rgba).resize((int(rgba.shape[1] * sc), int(rgba.shape[0] * sc)), Image.LANCZOS)
        ox = int(round(AX - feet_c * sc)); oy = int(round(BY - y1 * sc))
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        cv.alpha_composite(im.crop((max(0, -ox), max(0, -oy), min(im.width, W - ox), min(im.height, H - oy))), (max(0, ox), max(0, oy)))
        ys, xs = np.where(np.asarray(cv)[..., 3] > 10)
        print(NAMES[k], 'h', ys.max() - ys.min() + 1, 'x', xs.min(), xs.max(), 'WARN clipped' if xs.min() == 0 or xs.max() == W - 1 or ys.min() == 0 else '')
        cv.save(f'{outdir}/{NAMES[k]}.webp', quality=90, method=6)
if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2, int(sys.argv[4]) if len(sys.argv) > 4 else 466)
