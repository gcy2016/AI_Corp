"""
《未来的一天》自动配音脚本（给 Muse 在 Windows 上执行）

用法：把 未来的一天.mp4、本脚本、../src/timeline.json 放在同一个文件夹，运行
    python dub.py
输出：未来的一天_配音版.mp4（原视频 + 配音），dub_audio.wav（单独的配音音轨）
依赖：Python 3.9+、ffmpeg（在 PATH 里）、pip install edge-tts（需要联网）
台词和时间全部来自 timeline.json，和视频里的字幕完全一致。
"""
import asyncio, subprocess, json, pathlib, sys, hashlib

HERE = pathlib.Path(__file__).parent
VIDEO = HERE / "未来的一天.mp4"
OUT = HERE / "未来的一天_配音版.mp4"
TIMELINE = next((p for p in [HERE / "timeline.json", HERE.parent / "src" / "timeline.json"] if p.exists()), None)

# 三种声音：旁白（沉稳男声）/ AI 助手（平静女声）/ 居住者（自然男声）
VOICES = {
    None: dict(voice="zh-CN-YunxiNeural", rate="-5%", pitch="+0Hz"),
    "AI": dict(voice="zh-CN-XiaoxiaoNeural", rate="-8%", pitch="+0Hz"),
    "ME": dict(voice="zh-CN-YunjianNeural", rate="+0%", pitch="+0Hz"),
}
MAX_SPEEDUP = 1.25   # 某句读得比字幕时间长时，最多加速到 1.25 倍

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if r.returncode != 0:
        sys.exit("命令失败：" + " ".join(map(str, cmd)) + "\n" + r.stderr[-800:])
    return r.stdout

def duration(path):
    return float(json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)]))["format"]["duration"])

def load_lines():
    tl = json.loads(TIMELINE.read_text(encoding="utf-8"))
    lines = []
    for sc in tl["scenes"]:
        for s in sc["subs"]:
            lines.append((sc["start"] + s["a"], sc["start"] + s["b"], s.get("who"), s["text"], sc["time"]))
    return tl["total"], lines

async def synth(lines):
    import edge_tts
    tmp = HERE / "dub_tmp"; tmp.mkdir(exist_ok=True)
    clips, warns = [], []
    for i, (a, b, who, text, scene) in enumerate(lines, 1):
        v = VOICES[who]
        key = hashlib.md5(f"{v}{text}".encode("utf-8")).hexdigest()[:8]  # 台词或音色变了就重新合成
        raw = tmp / f"{i:03d}_{key}_raw.mp3"
        if not raw.exists():
            await edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"]).save(str(raw))
        d, slot = duration(raw), (b - a) + 0.3
        speed = max(1.0, d / slot)
        if speed > MAX_SPEEDUP:
            warns.append(f"第{i}句（{scene}）偏长 {d:.1f}s / 时段 {slot:.1f}s，已按 {MAX_SPEEDUP} 倍压缩")
            speed = MAX_SPEEDUP
        fit = tmp / f"{i:03d}.wav"
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", f"atempo={speed:.3f}", "-ar", "48000", "-ac", "2", str(fit)])
        print(f"[{i:02d}/{len(lines)}] {scene} {a:7.1f}s  {v['voice']}  {text}")
        clips.append((a, fit))
    return clips, warns

def mix(clips, total):
    # 分批混音，避免一次输入太多文件
    tmp = HERE / "dub_tmp"; parts = []
    for n in range(0, len(clips), 20):
        batch = clips[n:n + 20]; cmd = ["ffmpeg", "-y", "-loglevel", "error"]
        for _, f in batch: cmd += ["-i", str(f)]
        fl = [f"[{k}]adelay={int(a*1000)}|{int(a*1000)}[d{k}]" for k, (a, _) in enumerate(batch)]
        fl.append("".join(f"[d{k}]" for k in range(len(batch))) + f"amix=inputs={len(batch)}:normalize=0,apad,atrim=0:{total}[out]")
        out = tmp / f"part{n//20}.wav"; run(cmd + ["-filter_complex", ";".join(fl), "-map", "[out]", str(out)]); parts.append(out)
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for p in parts: cmd += ["-i", str(p)]
    run(cmd + ["-filter_complex", "".join(f"[{k}]" for k in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0[out]", "-map", "[out]", str(HERE / "dub_audio.wav")])
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(VIDEO), "-i", str(HERE / "dub_audio.wav"), "-map", "0:v", "-map", "1:a",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(OUT)])

if __name__ == "__main__":
    if not VIDEO.exists(): sys.exit(f"找不到 {VIDEO.name}，请把视频放到脚本同目录")
    if not TIMELINE: sys.exit("找不到 timeline.json，请放到脚本同目录")
    total, lines = load_lines()
    clips, warns = asyncio.run(synth(lines))
    mix(clips, total)
    print("\n完成 →", OUT.name)
    if warns: print("\n需要人工听一下的句子：\n" + "\n".join(warns))
