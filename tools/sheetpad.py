"""有黑色格線邊框的動作表：python3 sheetpad.py 動作表.jpg 輸出資料夾 目標高度 [內縮像素=12]
每格往內縮 pad 像素去掉格線，再走 sheet.py 的去背、統一縮放（以第 1 格高度為準）、腳底落 y=560、腳中心對齊 x=450。"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sheet, poses
if __name__ == '__main__':
    src, out, target = sys.argv[1], sys.argv[2], int(sys.argv[3])
    pad = int(sys.argv[4]) if len(sys.argv) > 4 else 12
    sheet.cell_rgba = lambda img, c: poses.cell(img, c, 4, 4, pad)
    sheet.main(src, out, target, False)
