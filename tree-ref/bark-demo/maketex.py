# 临时树皮贴图（等 Muse 传真贴图后替换）：颜色、法线(GL)、粗糙度
import numpy as np; from PIL import Image
rng=np.random.default_rng(1); W=H=1024
def noise(sx,sy,oct=5):
    out=np.zeros((H,W))
    for o in range(oct):
        f=2**o; g=rng.random((int(sy*f)+2,int(sx*f)+2))
        ys=np.linspace(0,sy*f,H,endpoint=False); xs=np.linspace(0,sx*f,W,endpoint=False)
        y0=ys.astype(int); x0=xs.astype(int); fy=(ys-y0)[:,None]; fx=(xs-x0)[None,:]
        a=g[y0][:,x0]; b=g[y0][:,x0+1]; c=g[y0+1][:,x0]; d=g[y0+1][:,x0+1]
        out+=((a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy)/f
    return out/out.max()
h=np.abs(np.sin(noise(14,2)*18))**0.6*0.7+noise(6,6)*0.3   # 竖向裂纹
h=(h-h.min())/(h.max()-h.min())
col=np.stack([0.20+0.22*h,0.14+0.15*h,0.10+0.10*h],-1)*(0.85+0.3*noise(3,3)[...,None])
Image.fromarray((np.clip(col,0,1)*255).astype(np.uint8)).save('bark_diff.jpg')
gy,gx=np.gradient(h*6); n=np.stack([-gx,gy,np.ones_like(h)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
Image.fromarray(((n*0.5+0.5)*255).astype(np.uint8)).save('bark_nor_gl.jpg')
Image.fromarray(((0.95-0.3*h)*255).astype(np.uint8)).save('bark_rough.jpg')
