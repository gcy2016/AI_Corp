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

// ffmpeg 表达式里的 max() 只收两个参数，多个区间要嵌套
const maxOf = xs => xs.reduce((acc, x) => `max(${acc},${x})`, '0');

async function encode(pg, t0, t1, outp, audio) {
  const fade = await pg.evaluate('AUDIO_FADE');
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) {
    // 强调音：和配乐放在同一目录的 accent.wav，在 HITS 的每个时间点叠一次
    // 陨落：配乐在 FALLS 的时间段里发闷（低通滤波的配乐和原配乐交叉淡化，0.3 秒变闷、1 秒恢复），开头叠 fall.wav（大鼓，见 tools/fall_drum.py）；
    // 仿参考视频吕布白门楼：鼓响前 0.18 秒配乐先弱一下，鼓响后头 1.5 秒发闷的配乐压低到 0.45，再用 1 秒回到正常发闷音量
    const dir = path.dirname(audio), accent = path.join(dir, 'accent.wav'), fallWav = path.join(dir, 'fall.wav'), drumWav = path.join(dir, 'drum.wav');
    const hits = fs.existsSync(accent) ? (await pg.evaluate('HITS')).filter(h => h >= t0 && h < t1) : [];
    const falls = (await pg.evaluate('FALLS.map(f => [f.t0, f.t1])')).filter(([a, b]) => b > t0 && a < t1);
    const drums = fs.existsSync(drumWav) ? (await pg.evaluate('DRUMS')).filter(d => d >= t0 && d < t1) : [];
    const fx = [...hits.map(h => [accent, h, 1.1]), ...(fs.existsSync(fallWav) ? falls.filter(([a]) => a >= t0).map(([a]) => [fallWav, a, 1.2]) : []),
                ...drums.map(d => [drumWav, d, 1.3])];
    // 连板锁定区间：用 tools/lock_audio.py 在原配乐上把这几秒的鼓和贝斯去掉（只留主旋律，区间外不动，没有接缝）
    const locks = (await pg.evaluate('LOCKS')).filter(([a, b]) => b > t0 && a < t1);
    let music = audio;
    if (locks.length) {
      music = path.join(require('os').tmpdir(), `kline_locked_${process.pid}.wav`);
      const r = require('child_process').spawnSync('python3', ['-I', path.join(__dirname, '..', 'tools', 'lock_audio.py'), audio, music, ...locks.flat().map(String)], { stdio: 'inherit' });
      if (r.status) { console.error('lock_audio.py 出错'); process.exit(1) }
    }
    args.push('-ss', t0.toFixed(3), '-t', (t1 - t0).toFixed(3), '-i', music);
    const fx0 = 2;   // 音效输入从第几路开始
    fx.forEach(([f]) => args.push('-i', f));
    let fc = '[1:a]';
    fc += `afade=t=out:st=${Math.max(0, fade[0] - t0).toFixed(3)}:d=${(fade[1] - fade[0]).toFixed(3)}`;
    if (falls.length) {
      const M = maxOf(falls.map(([a, b]) => `clip((t-${(a - t0).toFixed(3)})/0.3,0,1)*clip((${(b - t0).toFixed(3)}-t)/1.0,0,1)`));
      const dip = maxOf(falls.map(([a]) => `between(t,${(a - t0 - .18).toFixed(3)},${(a - t0).toFixed(3)})`));
      const duck = maxOf(falls.map(([a]) => `gte(t,${(a - t0).toFixed(3)})*(1-clip((t-${(a - t0 + 1.5).toFixed(3)})/1.0,0,1))`));
      fc += `,volume='1-0.55*${dip}':eval=frame,asplit[d][w];[d]volume='1-${M}':eval=frame[d2];[w]lowpass=f=420,lowpass=f=420,volume='(1-0.55*${duck})*${M}':eval=frame[w2];[d2][w2]amix=inputs=2:normalize=0[m]`;
    } else fc += '[m]';
    fx.forEach(([, h, v], i) => { const ms = Math.round((h - t0) * 1000); fc += `;[${i + fx0}:a]adelay=${ms}|${ms},volume=${v}[h${i}]` });
    fc += fx.length ? `;[m]${fx.map((_, i) => `[h${i}]`).join('')}amix=inputs=${fx.length + 1}:normalize=0:duration=first,alimiter=limit=0.95[a]` : ';[m]anull[a]';
    args.push('-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', '-shortest');
    console.log('accent hits:', hits.join(', '), '| falls:', falls.map(f => f.join('-')).join(', '), '| drums:', drums.join(', '), '| locks:', locks.map(l => l.join('-')).join(', '));
  }
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outp);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  ff.on('close', code => { if (code) { console.error('ffmpeg 出错退出，代码', code); process.exit(1) } });
  ff.stdin.on('error', () => {});
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
