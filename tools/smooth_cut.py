#!/usr/bin/env python3
"""絲滑補間格切圖（v0.8.188）：python3 tools/smooth_cut.py 設定.json
設定：{"src":原圖, "asset":"assets/boss5", "cols":6, "rows":3, "bg":"magenta"|"auto",
       "rows_def":[{"move":"s_bite","anchors":{"2":"40_sb_wind","4":"41_sb_open",...}}, ...], "out_prefix":"sm_", "preview":"預覽.png"}
做法：整張去背（bg=auto 時以邊緣中位色當底色）→ 全圖連通塊（膨脹）→ 依質心分到格子 → 每格只留最大塊＋腳底以上的小塊（濾掉格下文字）
→ 同一列用「錨點格 vs 現有格」的高度比（中位數）求統一縮放，並用錨點的腳底位置求該列的地平線 → 補間格依同一縮放與地平線落位
→ 質心對 x=450（與現有格同規則），腳底 y 依地平線換算（空中格會自然抬高）→ 輸出 900x600 webp：<prefix><move>_<1..6>.webp"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, sheet
from PIL import Image
from scipy import ndimage as ndi
cfg = json.load(open(sys.argv[1], encoding='utf-8'))
img = Image.open(cfg["src"]).convert('RGB'); Wi, Hi = img.size; a = np.asarray(img).astype(float)
cols, rows = cfg["cols"], cfg["rows"]
if cfg.get("bg", "magenta") == "auto":
    bd = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)]); bgc = np.median(bd, axis=0)
    d = np.sqrt(((a - bgc) ** 2).sum(axis=2)); alpha = np.clip((d - 45) * 255 / 45, 0, 255)
    al = np.clip(alpha / 255.0, 0.001, 1)[..., None]; rgb = np.clip((a - (1 - al) * bgc) / al, 0, 255); rgb = np.where(alpha[..., None] < 255, rgb, a)
    rgba = np.dstack([rgb, alpha]).astype(np.uint8)
else:
    rgba = sheet.key_magenta(sheet.strip_lines(a))
m = rgba[..., 3] > 40
if cfg.get('kill_text'):  # 格下標籤文字（白字黑邊）：白色填字膨脹後從遮罩與透明度移除
    tw = ndi.binary_dilation((a.min(axis=2) > 225), iterations=5); m &= ~tw; rgba[..., 3] = np.where(tw, 0, rgba[..., 3])
# 去掉白色細格線（Gemini 偶爾畫）：細長的近白像素
white = (a[..., 0] > 235) & (a[..., 2] > 235) & (a[..., 1] > 150)
wl = ndi.binary_dilation(ndi.binary_opening(white, structure=np.ones((1, 60))) | ndi.binary_opening(white, structure=np.ones((60, 1))), iterations=2)
m &= ~wl; rgba[..., 3] = np.where(wl, 0, rgba[..., 3])
if cfg.get('thin_lines'):  # 任何顏色的細長格線（厚度≤5、長≥80）：開運算分離後移除（桿身這類粗線不受影響）
    tl = (ndi.binary_opening(m, structure=np.ones((1, 80))) & ~ndi.binary_opening(m, structure=np.ones((7, 80)))) | (ndi.binary_opening(m, structure=np.ones((80, 1))) & ~ndi.binary_opening(m, structure=np.ones((80, 7))))
    tl = ndi.binary_dilation(tl, iterations=2); m &= ~tl; rgba[..., 3] = np.where(tl, 0, rgba[..., 3])
cw, ch = Wi / cols, Hi / rows; cells = {}
if cfg.get('seeds'):  # 武器伸進隔壁格、兩格武器相連時：先找「身體」種子（開運算去掉細長武器），再用分水嶺沿遮罩把每個像素分給最近（路徑最短）的身體
    from skimage.segmentation import watershed
    se = np.zeros((cfg.get('seed_r', 21),) * 2, bool); rr = cfg.get('seed_r', 21) // 2
    yy, xx = np.ogrid[-rr:rr + 1, -rr:rr + 1]; se = (yy * yy + xx * xx) <= rr * rr
    body = ndi.binary_opening(m, structure=se); bl, bn = ndi.label(body); mk = np.zeros(m.shape, np.int32); best = {}
    for i in range(1, bn + 1):
        ys, xs = np.where(bl == i)
        if len(ys) < 800: continue
        k = (int(ys.mean() // ch), int(xs.mean() // cw))
        if k not in best or len(ys) > best[k][0]: best[k] = (len(ys), i)
    ids = {}
    for j, (k, (_, i)) in enumerate(sorted(best.items())): mk[bl == i] = j + 1; ids[j + 1] = k
    ws = watershed(np.zeros(m.shape, np.uint8), markers=mk, mask=ndi.binary_dilation(m, iterations=1))
    for j, k in ids.items():
        comp = (ws == j) & m; ys, xs = np.where(comp); cells[k] = [(comp.sum(), comp, ys.max())]
else:
  lab, n = ndi.label(ndi.binary_dilation(m, iterations=cfg.get('dil', 6))); objs = ndi.find_objects(lab)
  rr_ = cfg.get('seed_r', 21) // 2; yy_, xx_ = np.ogrid[-rr_:rr_ + 1, -rr_:rr_ + 1]; se_ = (yy_ * yy_ + xx_ * xx_) <= rr_ * rr_
  body_ = ndi.binary_opening(m, structure=se_) if cfg.get('split_merged') else None
  for i in range(1, n + 1):
    comp = (lab == i) & m; area = comp.sum()
    if area < 400: continue
    parts = [comp]
    if body_ is not None:  # 兩格的長武器相連成一塊：找各格身體的 x 位置，在兩身體之間「像素最少的那一欄」切開（相連處多半只是戟尖碰到另一格的桿尾）
        bl_, bn_ = ndi.label(body_ & comp); cs = []
        for j in range(1, bn_ + 1):
            yb, xb = np.where(bl_ == j)
            if len(yb) >= 800: cs.append((xb.mean(), yb.mean(), len(yb)))
        cs.sort(); grp = [cs[0]] if cs else []; same_row = []
        for c_ in cs[1:]:
            if int(c_[1] // ch) == int(grp[-1][1] // ch) and int(c_[0] // cw) != int(grp[-1][0] // cw): same_row.append((grp[-1][0], c_[0])); grp.append(c_)
        if same_row:
            xsall = np.where(comp.any(axis=0))[0]; cuts = []
            colc = comp.sum(axis=0)
            for xa, xb in same_row:
                lo, hi = int(xa) + 40, int(xb) - 40
                if hi > lo: cuts.append(lo + int(np.argmin(colc[lo:hi])))
            if cuts:
                edges = [0] + cuts + [comp.shape[1]]; parts = []
                for a_, b_ in zip(edges[:-1], edges[1:]):
                    pc = np.zeros_like(comp); pc[:, a_:b_] = comp[:, a_:b_]; parts.append(pc)
    for comp in parts:
        area = comp.sum()
        if area < 400: continue
        ys, xs = np.where(comp); c = int(xs.mean() // cw); r = int(ys.mean() // ch)
        cells.setdefault((r, c), []).append((area, comp, ys.max()))
def bb(mask): ys, xs = np.where(mask); return xs.min(), ys.min(), xs.max(), ys.max()
cut = {}
for key, lst in cells.items():
    lst.sort(key=lambda t: -t[0]); big = lst[0]; keep = big[1].copy()
    for ar, comp, yb in lst[1:]:
        ys, _ = np.where(comp)
        if ar > 400 and ys.mean() < big[2] - 4: keep |= comp
    if cfg.get('kill_text'):  # 文字殘筆黏在腳下：細筆畫（<7px）侵蝕後消失，以侵蝕後最大塊的最低點為腳底，往下超過 8px 的像素砍掉
        er = ndi.binary_erosion(keep, iterations=3); l2, n2 = ndi.label(er)
        if n2:
            sz = ndi.sum(er, l2, range(1, n2 + 1)); yy, _ = np.where(l2 == 1 + int(np.argmax(sz))); lim = yy.max() + 8
            keep[lim + 1:, :] = False
    keep = ndi.binary_dilation(keep, iterations=2) & (rgba[..., 3] > 0)
    out = rgba.copy(); out[..., 3] = np.where(keep, out[..., 3], 0); x0, y0, x1, y1 = bb(keep); cut[key] = (out, (x0, y0, x1, y1))
expect = rows * cols
if len(cut) != expect: print("警告：找到", len(cut), "格，預期", expect)
asset = cfg["asset"]; prefix = cfg.get("out_prefix", "sm_"); preview = []; report = []
def exist_bbox(name):
    e = np.asarray(Image.open(os.path.join(asset, name + ".webp")).convert('RGBA'))[..., 3] > 40
    ys, xs = np.where(e); return xs.min(), ys.min(), xs.max(), ys.max()
for r, rd in enumerate(cfg["rows_def"]):
    anchors = {int(k): v for k, v in rd.get("anchors", {}).items()}
    ratios = []; bases = []
    for c, nm in anchors.items():
        if (r, c - 1) not in cut: continue
        nb = cut[(r, c - 1)][1]; eb = exist_bbox(nm)
        ratios.append(((eb[3] - eb[1] + 1) / (nb[3] - nb[1] + 1), (eb[2] - eb[0] + 1) / (nb[2] - nb[0] + 1), nm, c))
    sc = float(np.median([x[0] for x in ratios])) if ratios else rd.get("scale", cfg.get("scale", 0.5))
    for c, nm in anchors.items():  # 該列地平線：錨點格腳底（新圖座標）換算成「現有格腳底 = 560 + 其垂直偏移」
        if (r, c - 1) not in cut: continue
        nb = cut[(r, c - 1)][1]; eb = exist_bbox(nm); bases.append(nb[3] - (eb[3] - 560) / sc)
    base = float(np.median(bases)) if bases else None
    gain = np.ones(3); bgain = None
    if cfg.get("colormatch") and anchors:  # 色調校正：錨點格新圖 vs 現有格的 RGB 平均比（限 0.8～1.25），整列套用
        gs = []
        for c, nm in anchors.items():
            if (r, c - 1) not in cut: continue
            rg, b = cut[(r, c - 1)]; mn = rg[..., 3] > 200; ex = np.asarray(Image.open(os.path.join(asset, nm + ".webp")).convert('RGBA')); me = ex[..., 3] > 200
            gs.append(ex[..., :3][me].mean(axis=0) / np.maximum(rg[..., :3][mn].mean(axis=0), 1))
        if gs: gain = np.clip(np.median(gs, axis=0), 0.8, 1.25)
        bgs = []  # 骨頭／淡色部位另外校（只動 R≥150、G≥0.8R、R-B<90 的米黃／骨色像素，火焰與紅圍巾不動）
        for c, nm in anchors.items():
            if (r, c - 1) not in cut: continue
            rg, b = cut[(r, c - 1)]; ex = np.asarray(Image.open(os.path.join(asset, nm + ".webp")).convert('RGBA'))
            mk = lambda z: (z[..., 3] > 200) & (z[..., 0] > 150) & (z[..., 1] > 0.8 * z[..., 0]) & (z[..., 0].astype(int) - z[..., 2] < 90)
            mn, me = mk(rg), mk(ex)
            if mn.sum() > 200 and me.sum() > 200: bgs.append(ex[..., :3][me].mean(axis=0) / np.maximum(rg[..., :3][mn].mean(axis=0), 1))
        if bgs: bgain = np.clip(np.median(bgs, axis=0), 0.7, 1.3)
    report.append((rd["move"], round(sc, 3), [round(float(g), 2) for g in gain], [(x[3], x[2], round(x[0], 3)) for x in ratios]))
    row_imgs = []
    for c in range(cols):
        if (r, c) not in cut: print("缺格", rd["move"], c + 1); continue
        rg, b = cut[(r, c)]; sub = rg[b[1]:b[3] + 1, b[0]:b[2] + 1].copy(); bm = (sub[..., 0] > 150) & (sub[..., 1] > 0.8 * sub[..., 0]) & (sub[..., 0].astype(int) - sub[..., 2] < 90)
        f = sub[..., :3].astype(float) * gain
        if bgain is not None: f = np.where(bm[..., None], sub[..., :3].astype(float) * bgain, f)
        sub[..., :3] = np.clip(f, 0, 255).astype(np.uint8); crop = Image.fromarray(sub, 'RGBA')
        scc = sc
        if cfg.get('fit'): scc = min(sc, cfg['fit'] / max(1, crop.height))  # 畫布高度上限（舊格是貼底對齊的高格：戟尖頂到畫布上緣）
        crop = crop.resize((max(1, round(crop.width * scc)), max(1, round(crop.height * scc))), Image.LANCZOS)
        al = np.asarray(crop)[..., 3]; cx = np.where(al > 40)[1].mean()
        foot = 560 if (base is None or cfg.get('ground_all')) else round((b[3] - base) * sc + 560)
        o = Image.new('RGBA', (900, 600), (0, 0, 0, 0)); ox = round(450 - cx); oy = foot - crop.height + 1
        if oy < 0 or ox < 0 or ox + crop.width > 900: print("警告：超出畫布", rd["move"], c + 1, (ox, oy, crop.width, crop.height))
        o.alpha_composite(crop, (max(ox, 0), max(oy, 0))); name = f'{prefix}{rd["move"]}_{c + 1}'
        o.save(os.path.join(asset, name + ".webp"), 'WEBP', quality=92, method=6); row_imgs.append(o)
    preview.append(row_imgs)
for rep in report: print(rep)
if cfg.get("preview") and preview:
    w, h = 300, 200; P = Image.new('RGB', (w * cols, h * len(preview)), (200, 200, 200))
    for r, ri in enumerate(preview):
        for c, o in enumerate(ri):
            bg = Image.new('RGBA', (900, 600), (200, 200, 200, 255)); bg.alpha_composite(o); P.paste(bg.convert('RGB').resize((w, h)), (c * w, r * h))
    P.save(cfg["preview"])
