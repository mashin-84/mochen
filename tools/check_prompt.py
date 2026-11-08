#!/usr/bin/env python3
"""生圖提示詞自我檢查（v0.8.126）：python3 tools/check_prompt.py 提示詞.txt   或   cat 提示詞.txt | python3 tools/check_prompt.py
檢查：①開頭是完整風格聖經 ②有 EXACTLY N ③底色寫明（純黑 #000000 或洋紅 #FF00FF）④沒有殘留 [ ] 佔位符 ⑤沒有三個反引號 ⑥有「不畫人物」或參考圖說明。
有問題印 ✘ 並以代碼 1 結束；全過印 ✔、代碼 0。"""
import sys, re
args = [a for a in sys.argv[1:] if not a.startswith("--")]
VIDEO = "--video" in sys.argv  # 影片提示詞：不要求 EXACTLY N，改要求「固定鏡頭／單一鏡頭」「秒數」「Audio」
t = open(args[0], encoding='utf-8').read() if args else sys.stdin.read()
BIBLE = "Style bible: quiet fantasy-journey anime aesthetic set in ancient China."
BIBLE_END = "readable at small size."
bad = []
if not t.lstrip().startswith(BIBLE): bad.append("開頭不是完整風格聖經（必須直接寫進去，不可用佔位符）")
elif BIBLE_END not in t[:1400]: bad.append("風格聖經被截斷（少了結尾 …readable at small size.）")
if VIDEO:
    if not re.search(r"\d+-second|\d+ second", t): bad.append("影片沒寫秒數")
    if not re.search(r"single shot|one single|fixed camera|continuous", t, re.I): bad.append("影片沒寫單一連續／固定鏡頭")
    if not re.search(r"Audio", t): bad.append("影片沒寫 Audio 要求")
elif not re.search(r"EXACTLY\s+\d+", t): bad.append("沒有 EXACTLY N 格數")
if not re.search(r"#000000|#FF00FF|black|magenta", t, re.I): bad.append("沒寫明底色（發光用純黑 #000000、不發光用洋紅 #FF00FF）")
ph = re.findall(r"\[[^\]\n]{1,80}\]", t)
if ph: bad.append("殘留佔位符：" + "、".join(sorted(set(ph))[:6]) + "（請先填好）")
if "```" in t: bad.append("內含三個反引號（程式碼框會被截斷）")
if not re.search(r"no characters|no people|no person|reference image|I attach", t, re.I): bad.append("沒寫「不畫人物」也沒有參考圖說明")
if bad:
    print("✘ 提示詞檢查未過："); [print("  - " + b) for b in bad]; sys.exit(1)
print("✔ 提示詞檢查通過")
