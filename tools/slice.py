import sys,os,json
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
src,outdir,prefix=sys.argv[1:4]
names=sys.argv[4].split(',')
im=Image.open(src).convert('RGB');W0,H0=im.size
a=np.asarray(im).astype(float);r,g,b=a[...,0],a[...,1],a[...,2]
mag=np.clip(np.minimum(r,b)-g,0,255)
bg=mag>150
alpha=np.where(bg,0,np.clip((150-mag)*255/110,0,255))
edge=ndi.binary_dilation(bg,iterations=4)&~bg
sp=edge&(mag>12);out=a.copy();k=0.15
out[...,0]=np.where(sp,g+(r-g)*k,r);out[...,2]=np.where(sp,g+(b-g)*k,b)
rgba=np.dstack([np.clip(out,0,255),alpha]).astype(np.uint8)
mask=alpha>40
lab,n=ndi.label(ndi.binary_dilation(mask,iterations=6))
cw=W0//4
cells={}
for i in range(1,n+1):
    ys,xs=np.where((lab==i)&mask)
    if len(ys)<400: continue
    cells.setdefault(int(xs.mean()//cw)+4*int(ys.mean()//cw),[]).append(i)
print('cells',{k:len(v) for k,v in sorted(cells.items())})
os.makedirs(outdir,exist_ok=True)
boxes=[]
for c in range(16):
    m=np.isin(lab,cells[c])&ndi.binary_dilation(mask,iterations=2)
    ys,xs=np.where(m);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    sub=rgba[y0:y1,x0:x1].copy();sub[~m[y0:y1,x0:x1],3]=0
    Image.fromarray(sub).save(f'{outdir}/raw_{c+1:02d}.png');boxes.append((c,int(x0),int(y0),int(x1),int(y1)))
    print(c+1,x0-(c%4)*cw,y0-(c//4)*cw,x1-(c%4)*cw,y1-(c//4)*cw)
json.dump(boxes,open(f'{outdir}/boxes.json','w'))
