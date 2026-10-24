"""把 film.html 渲染成视频 / 截图 / 字幕时间轴
  python render.py video  未来的一天.mp4      整片 1920x1080 30fps（需要 ffmpeg）
  python render.py stills 12.5 80 200       导出这几个时间点（秒，整片时间）的截图到 stills/
  python render.py scene  3 0 5 10          导出第 3 个场景内 0/5/10 秒的截图
  python render.py clip   6                 只渲染第 6 个场景 → 场景06.mp4（约 1 分钟）
  python render.py timeline                 生成 timeline.json 和 未来的一天.srt
依赖：pip install playwright && python -m playwright install chromium
"""
import sys, json, base64, subprocess, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
FPS = 30

def srt_time(x):
    ms = int(round(x * 1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"

def main():
    mode = sys.argv[1]
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1920, "height": 1080})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto((HERE / "film.html").as_uri() + "?render")
        pg.evaluate("window.ready")
        total = pg.evaluate("TOTAL")
        grab = "T=>{drawFilm(T);return main.toDataURL('image/jpeg',0.94)}"
        if mode in ("stills", "scene"):
            out = HERE / "stills"; out.mkdir(exist_ok=True)
            args = sys.argv[2:]
            if mode == "scene":
                i = int(args[0]) - 1; st = pg.evaluate(f"SCENES[{i}].start"); args = [str(st + float(a)) for a in args[1:]]
            for t in args:
                d = pg.evaluate(grab, float(t))
                (out / f"T{float(t):06.1f}.jpg").write_bytes(base64.b64decode(d.split(",")[1]))
        elif mode == "timeline":
            tl = pg.evaluate("timeline()")
            (HERE / "timeline.json").write_text(json.dumps({"total": total, "scenes": tl}, ensure_ascii=False, indent=1), encoding="utf-8")
            lines, n = [], 0
            for s in tl:
                for x in s["subs"]:
                    n += 1; lines.append(f"{n}\n{srt_time(s['start']+x['a'])} --> {srt_time(s['start']+x['b'])}\n{x['text']}\n")
            (HERE / "未来的一天.srt").write_text("\n".join(lines), encoding="utf-8")
            print("total", total, "subs", n)
        else:
            t0 = 0
            if mode == "clip":  # 只渲染一个场景，方便逐个确认
                i = int(sys.argv[2]) - 1; t0 = pg.evaluate(f"SCENES[{i}].start"); total = pg.evaluate(f"SCENES[{i}].dur")
                outp = sys.argv[3] if len(sys.argv) > 3 else f"场景{i + 1:02d}.mp4"
            else:
                outp = sys.argv[2]
            ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
                                   "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outp], stdin=subprocess.PIPE)
            n = int(total * FPS)
            for i in range(n):
                ff.stdin.write(base64.b64decode(pg.evaluate(grab, t0 + i / FPS).split(",")[1]))
                if i % 300 == 0: print(f"{i}/{n}", flush=True)
            ff.stdin.close(); ff.wait()
        print("errors:", errs[:5])
        b.close()

main()
