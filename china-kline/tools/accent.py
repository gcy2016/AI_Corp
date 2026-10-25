"""合成两个音效，输出到 .claude/skills/kline-video/（可用第一个参数改目录）
  accent.wav：“高光时刻”强调音（仿参考视频赤壁之战处）：低频轰鸣 + F 音铜锣长音 + 镲片 + 简单混响
  fall.wav：“陨落”重击音（仿参考视频吕布白门楼处）：更深的低频重击 + 下坠的音调 + 碎裂噪声；之后配乐发闷由 render.js 处理
  python accent.py [输出目录]
参考视频里这个音：40–55 Hz 的“咚”约 0.7 秒；基音约 174 Hz（F3），3、4 倍泛音明显，约 2 秒衰减完；开头 1–4 kHz 突然变亮。
"""
import sys, wave, pathlib
import numpy as np

SR, DUR = 44100, 3.0
t = np.arange(int(SR * DUR)) / SR
rng = np.random.default_rng(20261025)

def env(attack, tau):
    return np.minimum(t / attack, 1) * np.exp(-np.maximum(t - attack, 0) / tau)

# 低频轰鸣：60 Hz 滑到 40 Hz
f = 40 + 20 * np.exp(-t / .25)
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(.004, .45)
# 打击瞬态：短促的低通噪声
n = rng.standard_normal(len(t))
lp = np.convolve(n, np.ones(40) / 40, 'same')
thump = lp * env(.002, .05) * 3
# 铜锣/铜管长音：F3 基音，泛音带一点不协和，听起来有金属感
f0 = 174.6
gong = sum(a * np.sin(2 * np.pi * f0 * k * (1 + d) * t + p) for k, a, d, p in
           [(1, 1, 0, 0), (2, .45, .002, 1), (3, .75, -.003, 2), (4, .6, .004, .5), (5, .25, .007, 3), (6, .15, -.006, 1.5)])
gong = gong / 3.2 * env(.02, .9) * (1 + .15 * np.sin(2 * np.pi * 4.5 * t))
# 镲片：高通噪声，慢衰减
hp = n - np.convolve(n, np.ones(6) / 6, 'same')
crash = hp * env(.003, .7) * .5

dry = .9 * boom + .5 * thump + .55 * gong + .35 * crash
# 混响：和指数衰减噪声卷积
ir_t = np.arange(int(SR * 1.4)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .45); ir[0] = 0
wet = np.convolve(dry, ir)[:len(t)]
wet = wet / np.abs(wet).max() * np.abs(dry).max()
out = dry + .35 * wet
out *= np.minimum(1, (DUR - t) / .3)          # 结尾 0.3 秒淡出
out = out / np.abs(out).max() * .89
# 立体声：混响部分左右略有差异
L = out; R = np.roll(out, 90) * .97 + out * .03
def save(name, out):
    L = out; R = np.roll(out, 90) * .97 + out * .03
    pcm = (np.stack([L, R], 1) * 32767).astype(np.int16)
    d = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parents[2] / '.claude/skills/kline-video'
    with wave.open(str(d / name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(d / name, f"{DUR}s")

save('accent.wav', out)

# 陨落：70 Hz 滑到 28 Hz 的深重击 + 从 320 Hz 往下坠到 55 Hz 的音调 + 碎裂噪声（中频带通、快衰减）
f = 28 + 42 * np.exp(-t / .35)
sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(.003, .7)
fd = 55 + 265 * np.exp(-t / .5)
drop = (np.sin(2 * np.pi * np.cumsum(fd) / SR) + .4 * np.sin(4 * np.pi * np.cumsum(fd) / SR)) * env(.01, .6)
bp = np.convolve(n, np.ones(8) / 8, 'same') - np.convolve(n, np.ones(60) / 60, 'same')
shatter = bp * env(.002, .25) * 2.2
dry = .95 * sub + .5 * thump + .35 * drop + .4 * shatter
wet = np.convolve(dry, ir)[:len(t)]
wet = wet / np.abs(wet).max() * np.abs(dry).max()
out = dry + .4 * wet
out *= np.minimum(1, (DUR - t) / .3)
out = out / np.abs(out).max() * .89
save('fall.wav', out)
