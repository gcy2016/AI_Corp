"""从参考视频里提取叠加在配乐上的音效（例如赤壁之战处的强调音），存成 wav
做法：参考视频音轨和原配乐对齐，按频率估计两者的增益差，做幅度谱相减，剩下的就是额外加的音效；再从起音处截取。
  python extract_accent.py <参考视频> <原配乐> <对齐偏移秒> <音效前的干净段起点> <音效开始> <音效结束> <输出.wav>
本项目 accent.wav 的提取参数（诸葛亮参考视频，赤壁之战）：
  python extract_accent.py zgl.mp4 ../../.claude/skills/kline-video/bgm.mp3 -0.0216 23.0 25.75 29.0 ../../.claude/skills/kline-video/accent.wav
对齐偏移：参考视频 t 秒对应配乐 t + 偏移 秒，可用 beats.py 的思路或互相关求得。
"""
import sys, subprocess, wave
import numpy as np

ref, bgm, off, pre0, s0, s1, outp = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6]), sys.argv[7]
SR, N, HOP = 44100, 2048, 256
load = lambda p: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                                              capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(float)
a, m = load(ref), load(bgm)
lag = int(round(off * SR))
w = np.hanning(N)
stft = lambda x: np.fft.rfft(np.lib.stride_tricks.sliding_window_view(x, N)[::HOP] * w, axis=1)
def istft(X):
    fr = np.fft.irfft(X, n=N, axis=1) * w; out = np.zeros(HOP * (len(fr) - 1) + N); ws = np.zeros_like(out)
    for i, f in enumerate(fr): out[i * HOP:i * HOP + N] += f; ws[i * HOP:i * HOP + N] += w ** 2
    return out / np.maximum(ws, 1e-6)
chs = []
for ch in range(2):
    A = stft(a[int(pre0 * SR):int(s1 * SR), ch]); M = stft(m[int(pre0 * SR) + lag:int(s1 * SR) + lag, ch]); k = min(len(A), len(M)); A, M = A[:k], M[:k]
    pre = slice(0, int((s0 - pre0) * SR / HOP))
    G = np.median(np.abs(A[pre]) / (np.abs(M[pre]) + 1e-9), axis=0)
    Mm = np.abs(M) * G
    Mm = np.maximum(Mm, np.roll(Mm, 1, 0) * .8); Mm = np.maximum(Mm, np.roll(Mm, -1, 0) * .8)
    mag = np.maximum(np.abs(A) - 1.6 * Mm, .02 * np.abs(A))
    chs.append(istft(mag * np.exp(1j * np.angle(A))))
x = np.stack(chs, 1)[int((s0 - pre0) * SR):]
e = np.convolve(np.sqrt((x ** 2).mean(1)), np.ones(441) / 441, 'same')
on = int(np.argmax(e > 10 ** (-24 / 20)))
x = x[max(0, on - int(.02 * SR)):][:int(2.6 * SR)]
x = x * np.minimum(1, (len(x) - np.arange(len(x))) / (.4 * SR))[:, None]
x = x / np.abs(x).max() * .89
with wave.open(outp, 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x * 32767).astype(np.int16).tobytes())
print(outp, f"onset {s0 + on / SR:.3f}s, {len(x) / SR:.2f}s")
