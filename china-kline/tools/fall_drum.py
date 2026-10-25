"""陨落音：用连板鼓点 drum.wav 的原声，加约 1.3 秒的回荡尾音（混响去掉刺耳的高频，像大鼓在大厅里敲一下），输出 fall.wav
render.js 在陨落那一拍叠这一声（音量 2.0），并在陨落前 0.8 秒到后 1.2 秒设锁定区间，把配乐里的鼓和贝斯抠掉；配乐发闷另外处理
  python fall_drum.py [drum.wav] [输出 fall.wav]     （默认都在 .claude/skills/kline-video/）
"""
import sys, wave, pathlib, numpy as np
d = pathlib.Path(__file__).resolve().parents[2] / '.claude/skills/kline-video'
src = sys.argv[1] if len(sys.argv) > 1 else str(d / 'drum.wav')
dst = sys.argv[2] if len(sys.argv) > 2 else str(d / 'fall.wav')
SR = 44100
w = wave.open(src); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(float) / 32767
n = int(SR * 1.6); y = np.zeros((n, 2)); y[:len(x)] = x
rng = np.random.default_rng(7)
ir_t = np.arange(int(SR * 1.4)) / SR
out = np.zeros_like(y)
for c in range(2):
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .38); ir[0] = 0
    ir = np.convolve(ir, np.ones(12) / 12, 'same')      # 混响尾巴去掉刺耳的高频，像大厅里的鼓声回荡
    wet = np.convolve(y[:, c], ir)[:n]
    wet = wet / np.abs(wet).max() * np.abs(y[:, c]).max()
    out[:, c] = y[:, c] + .55 * wet
out *= np.minimum(1, (n - np.arange(n)) / (SR * .2))[:, None]
out = out / np.abs(out).max() * .89
with wave.open(dst, 'wb') as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((out * 32767).astype(np.int16).tobytes())
