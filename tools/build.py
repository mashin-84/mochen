"""把 src/ 依 src/manifest.txt 的順序組回單檔 index.html（上線檔）。
用法：python3 tools/build.py            → 寫出 index.html
      python3 tools/build.py --check    → 只比對，index.html 與 src/ 不一致就回傳 1（推送前必跑）
規則：只改 src/，不要直接改 index.html（會被下一次 build 蓋掉）。新增檔案要加進 manifest.txt。"""
import sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, "src")
names = [n.strip() for n in open(os.path.join(src, "manifest.txt"), encoding="utf-8") if n.strip() and not n.startswith("#")]
parts = [open(os.path.join(src, n), encoding="utf-8", newline="").read() for n in names]
out = "\n".join(parts)
target = os.path.join(root, "index.html")
if "--check" in sys.argv:
    cur = open(target, encoding="utf-8", newline="").read()
    if cur != out:
        print("index.html 與 src/ 不一致：請改 src/ 後重跑 python3 tools/build.py"); sys.exit(1)
    print("build ok：index.html 與 src/ 一致（%d 個檔）" % len(names)); sys.exit(0)
open(target, "w", encoding="utf-8", newline="").write(out)
print("已組出 index.html（%d 個檔，%d bytes）" % (len(names), len(out.encode("utf-8"))))
