import numpy as np, glob, json, os
from PIL import Image
from scipy import ndimage as ndi
def key(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(float)
    r,g,b=a[...,0],a[...,1],a[...,2]
    gm=g-np.maximum(r,b)
    alpha=np.clip((70-gm)*255/45,0,255);alpha[gm>70]=0
    bg=gm>70
    edge=ndi.binary_dilation(bg,iterations=4)&~bg
    g2=np.where(edge,np.minimum(g,np.maximum(r,b)),g)
    rgba=np.dstack([r,g2,b,alpha]).astype(np.uint8)
    lab,n=ndi.label(alpha>128)
    if n>1:
        sizes=ndi.sum(alpha>128,lab,range(1,n+1));keep=lab==(1+int(np.argmax(sizes)))
        keep=ndi.binary_dilation(keep,iterations=3);rgba[...,3]=np.where(keep,rgba[...,3],0)
    return rgba
def core(rgba):
    m=rgba[...,3]>128;c=ndi.binary_opening(m,structure=np.ones((22,22)))
    return c if c.sum()>=500 else m
def process(d,P,t0,N,refpath,W,H,AX,BY,outdir,prefix,refH=None):
    fs=sorted(glob.glob(f'{d}/f_*.png'))
    idx=[int(round(t0+i*P/N)) for i in range(N)]
    frames=[key(fs[i]) for i in idx];cores=[core(f) for f in frames]
    ref=Image.open(refpath).convert('RGBA');ra=np.asarray(ref)[...,3]>128
    rc=ndi.binary_opening(ra,structure=np.ones((26,26)));ys,xs=np.where(rc);Href=refH or (ys.max()-ys.min()+1)
    hs=[];bots=[];cxs=[]
    for f,c in zip(frames,cores):
        ys,xs=np.where(c);hs.append(ys.max()-ys.min()+1);cxs.append(xs.mean())
        yy,_=np.where(f[...,3]>128);bots.append(yy.max())
    S=Href/max(hs);ground=max(bots);cx=np.mean(cxs)
    print(d,'idx',idx,'scale',round(S,3),'Href',Href)
    os.makedirs(outdir,exist_ok=True);outs=[]
    for k,f in enumerate(frames):
        im=Image.fromarray(f);im=im.resize((int(im.width*S),int(im.height*S)),Image.LANCZOS)
        ox=int(round(AX-cx*S));oy=int(round(BY-ground*S))
        cv=Image.new('RGBA',(W,H),(0,0,0,0))
        cv.alpha_composite(im.crop((max(0,-ox),max(0,-oy),min(im.width,W-ox),min(im.height,H-oy))),(max(0,ox),max(0,oy)))
        a=np.asarray(cv)[...,3]>10;ys,xs=np.where(a)
        if xs.min()==0 or xs.max()==W-1 or ys.min()==0:print('  WARN clipped',k)
        cv.save(f'{outdir}/{prefix}_{k+1:02d}.webp',quality=90,method=6);outs.append(cv)
    return outs
