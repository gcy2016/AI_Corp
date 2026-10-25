"""把配乐里的鼓去掉，只留旋律和声（谐波成分），给“连板锁定区间”用：区间内播放去鼓版，只听得到连板鼓点
做法：STFT 上沿时间做中值滤波得到谐波（持续的音），沿频率做中值滤波得到打击乐（短促的声），按软掩码只保留谐波。分段处理省内存。
  python make_nodrums.py <配乐> <输出.mp3>
本项目：python make_nodrums.py ../../.claude/skills/kline-video/bgm.mp3 ../../.claude/skills/kline-video/bgm_nodrums.mp3
"""
import sys, subprocess
import numpy as np

src, outp = sys.argv[1], sys.argv[2]
SR, N, HOP, K = 44100, 2048, 512, 17
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(float)
w = np.hanning(N)

def medfilt(a, k, axis):
    pad = [(0, 0), (0, 0)]; pad[axis] = (k // 2, k // 2)
    return np.median(np.lib.stride_tricks.sliding_window_view(np.pad(a, pad, mode='edge'), k, axis=axis), axis=-1)

out = np.zeros_like(x)
for ch in range(2):
    sig = np.concatenate([np.zeros(N), x[:, ch], np.zeros(N)])
    X = np.fft.rfft(np.lib.stride_tricks.sliding_window_view(sig, N)[::HOP] * w, axis=1)
    mag = np.abs(X); Hm = np.zeros_like(mag); Pm = np.zeros_like(mag)
    CH, OV = 1500, K
    for s0 in range(0, len(mag), CH):          # 分段做中值滤波，前后各多取 K 帧避免接缝
        a, b = max(0, s0 - OV), min(len(mag), s0 + CH + OV)
        Hm[s0:s0 + CH] = medfilt(mag[a:b], K, 0)[s0 - a:s0 - a + min(CH, len(mag) - s0)]
        Pm[s0:s0 + CH] = medfilt(mag[s0:s0 + CH], K, 1)
    Y = X * (Hm ** 2 / (Hm ** 2 + Pm ** 2 + 1e-12))
    fr = np.fft.irfft(Y, n=N, axis=1) * w
    y = np.zeros(HOP * (len(fr) - 1) + N); ws = np.zeros_like(y)
    for i, f in enumerate(fr): y[i * HOP:i * HOP + N] += f; ws[i * HOP:i * HOP + N] += w ** 2
    y = y / np.maximum(ws, 1e-6)
    out[:, ch] = y[N:N + len(x)]
pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "libmp3lame", "-b:a", "192k", outp], input=pcm, check=True)
print(outp)
