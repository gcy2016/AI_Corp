"""陨落音（仿参考视频吕布白门楼）：一声大鼓，没有固定音高的音符（固定音高的音叠在一起听着像古筝，用户否定过）
大鼓 = 音调很快往下掉的低频“咚”（130 Hz 掉到 45 Hz）+ 鼓皮的噪声（只留 1 kHz 以下）+ 大厅混响；500 Hz 以上很少，不尖
  python fall_drum.py [输出 fall.wav]
"""
import sys, wave, pathlib, numpy as np
SR, DUR = 44100, 3.0
t = np.arange(int(SR * DUR)) / SR
rng = np.random.default_rng(20261025)
def env(a, tau): return np.minimum(t / a, 1) * np.exp(-np.maximum(t - a, 0) / tau)
def lp(x, fc, k=2):
    a = np.exp(-2 * np.pi * fc / SR)
    for _ in range(k):
        y = np.empty_like(x); z = 0.
        for i in range(len(x)): z = (1 - a) * x[i] + a * z; y[i] = z
        x = y
    return x
f = 45 + 85 * np.exp(-t / .07)                                   # 鼓的“咚”：130 Hz 很快掉到 45 Hz
shell = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(.003, .55)
n = rng.standard_normal(len(t))
skin = (lp(n, 900) - lp(n, 90)) * env(.002, .09) * 16            # 鼓皮：90–900 Hz 的噪声，很短
body = lp(n, 250) * env(.004, .35) * 4                           # 鼓腔：250 Hz 以下的噪声，稍长
dry = .8 * shell + .8 * skin + .6 * body
ir_t = np.arange(int(SR * 1.8)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .55); ir[0] = 0
wet = lp(np.convolve(dry, ir)[:len(t)], 500)                     # 大厅混响，只留低频，拖出 1 秒多的尾巴
wet = wet / np.abs(wet).max() * np.abs(dry).max()
out = lp(dry + .5 * wet, 1200, 1)
out *= np.minimum(1, (DUR - t) / .4)
out = out / np.abs(out).max() * .89
dst = sys.argv[1] if len(sys.argv) > 1 else str(pathlib.Path(__file__).resolve().parents[2] / '.claude/skills/kline-video/fall.wav')
pcm = (np.stack([out, np.roll(out, 90) * .97 + out * .03], 1) * 32767).astype(np.int16)
with wave.open(dst, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
