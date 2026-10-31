import re,sys
src,patch,out=sys.argv[1:4]
code=open(src,encoding='utf-8').read().split('\n')
lines=open(patch,encoding='utf-8').read().split('\n')
patches=[];cur=None;mode=None
for l in lines:
    s=l.strip()
    if re.match(r'^(#+\s*)?PATCH\s*\d+',s): cur={'name':s,'find':[],'rep':[]};patches.append(cur);mode=None;continue
    if re.match(r'^[C-E]\.\s',s) and cur: cur=None;mode=None;continue
    if cur is None: continue
    if s=='FIND:': mode='find';continue
    if s=='REPLACE:': mode='rep';continue
    if s.startswith('`'*3): continue
    if mode: cur[mode].append(l)
def clean(b):
    b=list(b)
    while b and not b[-1].strip(): b.pop()
    while b and not b[0].strip(): b.pop(0)
    return b
ok=True
for p in patches:
    f=clean(p['find']);r=clean(p['rep'])
    fs=[x.strip() for x in f]
    hits=[i for i in range(len(code)-len(f)+1) if [x.strip() for x in code[i:i+len(f)]]==fs]
    if len(hits)!=1: print('FAIL',len(hits),p['name']);ok=False;continue
    i=hits[0];code[i:i+len(f)]=r;print('ok',p['name'])
open(out,'w',encoding='utf-8').write('\n'.join(code));print('ALL OK' if ok else 'SOME FAILED')
