import math, numpy as np
from PIL import Image
S=__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/'
SW=Image.open(S+'b3_gsword.png').convert('RGBA')
GR,GC=112,40   # 護手中心在劍圖的位置
OFF=(-8,-45)   # 護手相對後肩（直立時）
def sword_layer(P,lean,scale=1.0):
    th=60+lean; r=math.radians(lean)
    ox=OFF[0]*math.cos(r)-OFF[1]*math.sin(r); oy=OFF[0]*math.sin(r)+OFF[1]*math.cos(r)
    G=(P[0]+ox*scale,P[1]+oy*scale)
    sw=SW.resize((int(SW.width*scale),int(SW.height*scale)),Image.LANCZOS)
    cv=Image.new('RGBA',(900,600),(0,0,0,0)); cv.alpha_composite(sw,(int(round(G[0]-GC*scale)),int(round(G[1]-GR*scale))))
    return cv.rotate(90-th,center=G,resample=Image.BICUBIC)
def apply(char,P,lean,scale=1.0):
    out=sword_layer(P,lean,scale); out.alpha_composite(char); return out
