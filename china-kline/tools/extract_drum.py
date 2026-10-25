"""从配乐里提取一记鼓点（连板用）：对一段配乐做谐波/打击乐分离（STFT 上沿时间、沿频率分别做中值滤波），
只保留打击乐成分，再挑低频起音最强的一下，截 0.3 秒存成 wav。
  python extract_drum.py <配乐> <起点秒> <终点秒> <输出.wav>
本项目 drum.wav（开盘鼓点，配乐第 17.44 秒）：python extract_drum.py ../../.claude/skills/kline-video/bgm.mp3 16.5 18.5 ../../.claude/skills/kline-video/drum.wav
"""
import sys, subprocess, wave
import numpy as np

src, t0, t1, outp = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
SR, N, HOP = 44100, 2048, 256
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t0), "-t", str(t1 - t0), "-i", src, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(float)
w = np.hanning(N)
def medfilt(a, k, axis):
    pad = [(0, 0), (0, 0)]; pad[axis] = (k // 2, k // 2)
    ap = np.pad(a, pad, mode='edge')
    return np.median(np.lib.stride_tricks.sliding_window_view(ap, k, axis=axis), axis=-1)
chs = []
for ch in range(2):
    X = np.fft.rfft(np.lib.stride_tricks.sliding_window_view(x[:, ch], N)[::HOP] * w, axis=1)
    mag = np.abs(X)
    Hm, Pm = medfilt(mag, 17, 0), medfilt(mag, 17, 1)          # 沿时间中值 = 谐波（旋律），沿频率中值 = 打击乐
    mask = Pm ** 2 / (Hm ** 2 + Pm ** 2 + 1e-12)
    fr = np.fft.irfft(X * mask, n=N, axis=1) * w
    out = np.zeros(HOP * (len(fr) - 1) + N); ws = np.zeros_like(out)
    for i, f in enumerate(fr): out[i * HOP:i * HOP + N] += f; ws[i * HOP:i * HOP + N] += w ** 2
    chs.append(out / np.maximum(ws, 1e-6))
p = np.stack(chs, 1)
mono = p.mean(1)
low = np.convolve(mono, np.ones(60) / 60, 'same')                # 粗略低通，找低频起音最强的一下
env = np.convolve(np.abs(low), np.ones(441) / 441, 'same')
on_curve = np.maximum(np.diff(env, prepend=0), 0)
on_curve[:int(.3 * SR)] = 0; on_curve[-int(.6 * SR):] = 0                 # 避开分离时两端的边缘假象
i = int(np.argmax(on_curve)); start = max(0, i - int(.012 * SR))
seg = p[start:start + int(.3 * SR)]
seg = seg * np.minimum(1, (len(seg) - np.arange(len(seg))) / (.12 * SR))[:, None]
seg = seg / np.abs(seg).max() * .89
with wave.open(outp, 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((seg * 32767).astype(np.int16).tobytes())
print(outp, f"hit at {t0 + start / SR:.3f}s in source")
