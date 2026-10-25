"""测配乐的节拍：输出 BPM、第 0 拍的时间（PHASE）、每拍秒数（BEAT）、哪一拍是小节重拍、每 2 秒响度、明显鼓点
  python beats.py <音频或视频文件>
把结果里的 BEAT、PHASE 填进 src/data.js；第 b 拍的时间 = PHASE + b * BEAT，每 32 拍（8 小节）一个乐句
"""
import subprocess, sys
import numpy as np

SR, HOP, N = 22050, 256, 2048
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32).astype(float)
fr = np.lib.stride_tricks.sliding_window_view(x, N)[::HOP] * np.hanning(N)
S = np.log1p(10 * np.abs(np.fft.rfft(fr, axis=1)))
f = np.fft.rfftfreq(N, 1 / SR)
flux = np.maximum(np.diff(S, axis=0), 0)
z = lambda v: (v - v.mean()) / v.std()
o, low = z(flux.sum(1)), z(flux[:, f < 150].sum(1))
fps = SR / HOP
ac = np.correlate(o, o, 'full')[len(o) - 1:]
lag = np.arange(len(ac)) / fps
m = (lag > .4) & (lag < .8)
T = lag[m][ac[m].argmax()]
best = None
for P in np.arange(T - .01, T + .01, .0002):
    for ph in np.arange(0, P, .005):
        idx = (np.arange(ph, len(o) / fps, P) * fps).astype(int); idx = idx[idx < len(o)]
        sc = o[idx].mean()
        if best is None or sc > best[0]: best = (sc, P, ph)
_, P, ph = best
beats = np.arange(ph, len(x) / SR, P)
bars = [low[(beats[k::4] * fps).astype(int)[(beats[k::4] * fps).astype(int) < len(low)]].mean() for k in range(4)]
k = int(np.argmax(bars)); ph += k * P
print(f"BPM {60 / P:.2f}   BEAT = {P:.4f}   PHASE = {ph:.3f}   （第 0 拍是小节重拍）")
rms = [20 * np.log10(np.sqrt((x[i * SR:(i + 1) * SR] ** 2).mean()) + 1e-9) for i in range(len(x) // SR)]
print("每 2 秒响度 dB：", " ".join(f"{i * 2}:{round(v)}" for i, v in enumerate(rms[::2])))
pk = [i for i in range(1, len(o) - 1) if o[i] > 4 and o[i] == o[max(0, i - 20):i + 20].max()]
print("明显鼓点（秒）：", " ".join(f"{i / fps:.2f}" for i in pk))
print(f"时长 {len(x) / SR:.1f} 秒")
