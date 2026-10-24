// 把 film.html 渲染成视频 / 截图（Node + Playwright + ffmpeg）
//   node render.js video  out.mp4 ../bgm.mp3        整片 1080x1920 30fps，混入配乐
//   node render.js stills 12.5 40 100               导出这几个时间点（秒）的截图到 stills/
//   node render.js clip   30 50 out.mp4 ../bgm.mp3  只渲染 30–50 秒
// 渲染 B / C 版：命令前加 VER=b 或 VER=c（如 VER=b node render.js video ../out/china-kline-B.mp4 ../bgm.mp3）
// 依赖：npm i playwright && npx playwright install chromium；需要 ffmpeg
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), url = require('url');
const FPS = 30, GRAB = T => { drawFilm(T); return main.toDataURL('image/jpeg', 0.93) };

async function encode(pg, t0, t1, outp, audio) {
  const fade = await pg.evaluate('AUDIO_FADE');
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) args.push('-ss', t0.toFixed(3), '-t', (t1 - t0).toFixed(3), '-i', audio,
    '-af', `afade=t=out:st=${Math.max(0, fade[0] - t0).toFixed(3)}:d=${(fade[1] - fade[0]).toFixed(3)}`, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outp);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  const n = Math.round((t1 - t0) * FPS);
  for (let i = 0; i < n; i++) {
    const d = await pg.evaluate(GRAB, t0 + i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${i}/${n}`);
  }
  ff.stdin.end(); await done;
}

(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(url.pathToFileURL(path.join(__dirname, 'film.html')).href + '?render' + (process.env.VER ? '&' + process.env.VER : ''));
  await pg.evaluate('window.ready');
  const total = await pg.evaluate('TOTAL');
  if (mode === 'stills') {
    const out = path.join(__dirname, 'stills'); fs.mkdirSync(out, { recursive: true });
    for (const t of rest) {
      const d = await pg.evaluate(GRAB, +t);
      fs.writeFileSync(path.join(out, `T${(+t).toFixed(1).padStart(6, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
    }
  } else if (mode === 'clip') await encode(pg, +rest[0], +rest[1], rest[2], rest[3]);
  else await encode(pg, 0, total, rest[0], rest[1]);
  console.log('errors:', errs.slice(0, 5));
  await b.close();
})();
