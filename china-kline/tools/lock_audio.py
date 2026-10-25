"""连板锁定区间：在原配乐上直接把这几秒里的鼓和贝斯去掉，只留主旋律（不换音轨，所以没有接缝），输出给 render.js 用
做法（STFT 软掩码）：约 150 Hz 以下（底鼓、贝斯）整段去掉（150–260 Hz 平滑过渡）；更高频率里，沿时间/沿频率中值滤波
估出打击乐（镲、军鼓）的比例并减掉。处理强度在区间两头 0.15 秒内从 0 平滑到 1，区间外逐采样等于原曲。
  python lock_audio.py <配乐> <输出.wav> <起1> <止1> [<起2> <止2> ...]     （秒）
"""
import sys, subprocess
import numpy as np

src, outp = sys.argv[1], sys.argv[2]
wins = [(float(a), float(b)) for a, b in zip(sys.argv[3::2], sys.argv[4::2])]
SR, N, HOP, K, RAMP = 44100, 2048, 256, 17, .15
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(float)
y = x.copy()
w = np.hanning(N)
f = np.fft.rfftfreq(N, 1 / SR)
lowcut = np.clip((260 - f) / (260 - 150), 0, 1)              # 150 Hz 以下 = 1，260 Hz 以上 = 0
med = lambda a, k, ax: np.median(np.lib.stride_tricks.sliding_window_view(np.pad(a, [(k // 2, k // 2) if i == ax else (0, 0) for i in range(2)], mode='edge'), k, axis=ax), axis=-1)
for a, b in wins:
    s0, s1 = max(0, int((a - 1.0) * SR)), min(len(x), int((b + 1.0) * SR))     # 前后多算 1 秒，那里掩码为 0
    t_s = (np.arange(s1 - s0) + s0) / SR
    for ch in range(2):
        seg = x[s0:s1, ch]
        pad = np.concatenate([np.zeros(N), seg, np.zeros(N)])
        X = np.fft.rfft(np.lib.stride_tricks.sliding_window_view(pad, N)[::HOP] * w, axis=1)
        mag = np.abs(X); Hm, Pm = med(mag, K, 0), med(mag, K, 1)
        P = Pm ** 2 / (Hm ** 2 + Pm ** 2 + 1e-12)
        remove = np.maximum(P, lowcut[None, :])                   # 要去掉的比例：低频全去，高频去打击乐
        t = (np.arange(len(X)) * HOP - N + N / 2) / SR + s0 / SR
        g = np.clip((t - a) / RAMP, 0, 1) * np.clip((b - t) / RAMP, 0, 1)
        Y = X * (1 - g[:, None] * remove)
        fr = np.fft.irfft(Y, n=N, axis=1) * w
        out = np.zeros(HOP * (len(fr) - 1) + N); ws = np.zeros_like(out)
        for i, fr_i in enumerate(fr): out[i * HOP:i * HOP + N] += fr_i; ws[i * HOP:i * HOP + N] += w ** 2
        rec = (out / np.maximum(ws, 1e-6))[N:N + len(seg)]
        m = np.clip((t_s - (a - RAMP - .1)) / .05, 0, 1) * np.clip(((b + RAMP + .1) - t_s) / .05, 0, 1)   # 只在处理范围内替换
        y[s0:s1, ch] = seg * (1 - m) + rec * m
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", outp],
               input=y.astype(np.float32).tobytes(), check=True)
print(outp, wins)
