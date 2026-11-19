#!/usr/bin/env python3
"""v0.8.248 第 3 關／通用大招音效疊層配方（真實音檔疊加，不合成）：python3 tools/sfx_layer_s3.py 資料夾（內有 raw_<名>.mp3）→ 輸出 <名>.mp3。
做法：以撞擊峰值對齊疊 b1u_stab（轟）、放慢版（更低的震）、b3_plunge（碎石）、雷聲放慢（餘震）；蓄力疊反轉的轟＋反轉放慢雷聲＝越來越大的漲起；全部峰值 -1.5 dBFS、單聲道。"""
import subprocess,numpy as np,sys
from scipy.signal import resample
SR=44100;A='assets/sfx/';S=sys.argv[1]
def load(p):
    r=subprocess.run(['ffmpeg','-v','quiet','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True);return np.frombuffer(r.stdout,np.float32).copy()
def pk(x): return np.abs(x).max()+1e-9
def norm(x,db=0): return x/pk(x)*10**(db/20)
def slow(x,k): return resample(x,int(len(x)/k)).astype(np.float32)  # k<1 → 變慢變低
def hit_t(x): e=np.convolve(x**2,np.ones(441),'same'); return int(np.argmax(e))
def trim_lead(x,keep=0.02):
    e=np.abs(x);i=int(np.argmax(e>pk(x)*0.08));return x[max(0,i-int(keep*SR)):]
def place(base,layer,at,gain):
    at=int(at); n=max(len(base),at+len(layer)); out=np.zeros(n,np.float32); out[:len(base)]+=base
    if at<0: layer=layer[-at:]; at=0
    out[at:at+len(layer)]+=layer*gain; return out
def fade(x,t): n=int(t*SR); x=x.copy(); x[-n:]*=np.linspace(1,0,n); return x
def save(x,name,maxlen=None):
    if maxlen: x=x[:int(maxlen*SR)]
    x=fade(x,0.04); x=norm(x,-1.5)
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','libmp3lame','-q:a','3',S+'/'+name+'.mp3'],input=x.tobytes())
R=lambda n: load(S+'/raw_'+n+'.mp3')
stab,plunge,heavy,thunder,charge=[load(A+n+'.mp3') for n in ['b1u_stab','b3_plunge','b3_heavy','sfx_thunder','b3_charge']]
# 巨劍砸地：劍鳴＋轟（b1u_stab）＋更低的震（b1u_stab 放慢 0.6）＋碎石（b3_plunge）＋餘震隆隆（雷聲放慢 0.55）
x=norm(R('c_slam_huge'));h=hit_t(x)
x=place(x,norm(stab),h-hit_t(stab),0.8); x=place(x,norm(slow(stab,0.6)),h-hit_t(slow(stab,0.6)),0.5)
x=place(x,norm(plunge),h-hit_t(plunge),0.55); x=place(x,fade(norm(slow(thunder,0.55)),0.7),h+0.1*SR,0.75); save(x,'c_slam_huge',1.9)
# 刺地：加 b3_plunge 撞擊
x=norm(R('c_stab_ground'));h=hit_t(x); x=place(x,norm(plunge),h-hit_t(plunge),0.8); x=place(x,norm(stab),h-hit_t(stab),0.35); save(x,'c_stab_ground',0.85)
# 大碰撞：加重劍撞擊身體與低頻
x=norm(R('c_clang_big'));h=hit_t(x); x=place(x,norm(heavy),h-hit_t(heavy),0.3); x=place(x,norm(stab),h-hit_t(stab),0.22); save(x,'c_clang_big',1.25)
# 重劍衝刺：加低頻腳步（b3_charge 短低音）
x=norm(R('c_dash_heavy')); x=place(x,norm(charge),0.02*SR,0.6); x=place(x,norm(slow(stab,0.8)),0.05*SR,0.25); save(x,'c_dash_heavy',0.55)
# 蓄力：原檔是越來越小 → 疊反轉轟（越來越大，結束在 1.4 秒）＋反轉放慢雷聲的低頻漲起
x=norm(R('c_gather')); L=int(1.4*SR); x=np.pad(x,(0,max(0,L-len(x))))
rs=norm(stab[::-1]); x=place(x,rs,L-len(rs),0.55); rt=norm(slow(thunder,0.5)[::-1]); rt=rt[-L:]; rt=norm(rt*np.sqrt(np.linspace(0.15,1,len(rt)))); x=place(x,rt,L-len(rt),0.6); save(x,'c_gather',1.42)
# 化影、十字：前面空白太長 → 裁掉
save(trim_lead(R('c_vanish'),0.12),'c_vanish'); save(trim_lead(R('s3_cross')),'s3_cross')
for n in ['c_dash_light','c_slash_light','c_appear_stab','c_swing_heavy','c_sword_throw','c_shing']: save(trim_lead(R(n)),n)
