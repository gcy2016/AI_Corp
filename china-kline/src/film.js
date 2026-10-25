// 画面绘制：drawFilm(T) 画出第 T 秒的整帧（1080×1920），纯函数，不依赖上一帧
const W = 1080, H = 1920;
const C = {
  bg: '#111318', panel: '#171a20', line: '#2a2e36', text: '#ebe7de', dim: '#6d717a', dim2: '#9a9ea6',
  red: '#e5463d', green: '#22c497', gold: '#d9ae5b', gold2: '#f0d28e', ma5: '#e6dfcc', ma20: '#6c6fe0',
};
const SERIF = '"Noto Serif SC", serif', SANS = '"Noto Sans SC", "WenQuanYi Zen Hei", sans-serif', MONO = '"JetBrains Mono", monospace';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
const easeIn = k => Math.pow(clamp(k), 2);
const easeInOut = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2 };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) };
const beatOf = t => (t - PHASE) / BEAT;
const prevV = e => { const k = EVENTS.indexOf(e); return k ? EVENTS[k - 1].v : 96 };
const fmtP = v => v.toFixed(2);

// ---------- K 线数据（确定性生成） ----------
EVENTS.forEach(e => { e.raw = e.v; if (!e.abs) e.v = Math.round(e.v * TREND(e.y)) });
const CANDLES = [];
(function build() {
  let s = 20261024; const R = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  let prev = 96;
  EVENTS.forEach((e, k) => {
    const o = prev, c = e.v, span = Math.abs(c - o);
    const h = Math.max(o, c) + span * .1 + Math.max(o, c) * .012 * (1 + R());
    const l = Math.min(o, c) - span * .1 - Math.min(o, c) * .012 * (1 + R());
    const next = k + 1 < EVENTS.length ? EVENTS[k + 1].b : END.title;
    const kd = Math.min(3, next - e.b);           // 大 K 线走约 3 拍（1.5 秒）的“盘中”行情
    CANDLES.push({ b0: e.b, b1: e.b + kd * .95, o, c, h, l, key: k });
    prev = c;
    for (let b = Math.ceil(e.b + kd); b < next; b++) {   // 大 K 线之后的小 K 线：每拍一根，在目标值附近震荡
      const o2 = prev, c2 = o2 + (e.v - o2) * .3 + o2 * (R() - .5) * .04;
      CANDLES.push({ b0: b, b1: b + .9, o: o2, c: c2, h: Math.max(o2, c2) * (1 + R() * .014), l: Math.min(o2, c2) * (1 - R() * .014), key: -1 });
      prev = c2;
    }
  });
  CANDLES.forEach((c, i) => { c.i = i; c.ch = CHAPTERS.reduce((a, ch, j) => c.b0 >= ch.b0 ? j : a, 0) });
  // 盘中走势参数：三组正弦叠加的抖动，开头和结尾收敛到开盘价、收盘价
  let s2 = 7; const R2 = () => (s2 = (s2 * 1664525 + 1013904223) >>> 0) / 4294967296;
  CANDLES.forEach(c => {
    const span = Math.abs(c.c - c.o);
    c.amp = c.key >= 0 ? Math.max(span * .32, c.o * .03) : Math.max(span * .6, c.o * .012);
    c.wave = [[2 + R2() * 1.5, R2() * 6.3, .55], [4.5 + R2() * 2, R2() * 6.3, .3], [8 + R2() * 3, R2() * 6.3, .15]];
    c.sgn = c.c >= c.o ? 1 : -1;
    c.flip = R2() < .35;          // 约三分之一的 K 线盘中先反向走一段，红绿变色
    c.flipAmp = Math.max(span * (.2 + R2() * .15), c.o * .02);
    let hi = Math.max(c.o, c.c), lo = Math.min(c.o, c.c);
    for (let j = 0; j <= 48; j++) { const v = pathAt(c, j / 48); hi = Math.max(hi, v); lo = Math.min(lo, v) }
    c.h = Math.max(c.h, hi); c.l = Math.min(c.l, lo);
  });
})();
function pathAt(c, u) {
  const env = Math.pow(Math.sin(Math.PI * u), .8);
  let n = 0; c.wave.forEach(([f, ph, w]) => n += Math.sin(u * f * 6.2832 + ph) * w);
  let v = c.o + (c.c - c.o) * easeInOut(u) + c.amp * n * env;
  if (c.flip) v -= c.sgn * c.flipAmp * Math.sin(Math.PI * Math.min(u / .45, 1));   // 先反向，再拉回
  else v = c.sgn > 0 ? Math.max(v, c.o + c.o * .002 * env) : Math.min(v, c.o - c.o * .002 * env);   // 不变色：只在收盘方向一侧波动
  return v;
}
const STATS = (() => {
  let hi = EVENTS[0], lo = EVENTS[0], up = 0, down = 0, peak = EVENTS[0], dd = 0, ddFrom, ddTo;
  EVENTS.forEach((e, k) => {
    if (e.v > hi.v) hi = e; if (e.v < lo.v) lo = e;
    const o = k ? EVENTS[k - 1].v : 96;
    if (e.v >= o * 1.2) up++; if (e.v <= o * .8) down++;
    if (e.v > peak.v) peak = e;
    if (e.v / peak.v - 1 < dd) { dd = e.v / peak.v - 1; ddFrom = peak; ddTo = e }
  });
  if (!VERSION.ddText) VERSION.ddText = `${ddFrom.era} → ${ddTo.t}`;
  return { hi, lo, up, down, dd, years: VERSION.years };
})();

// 某根 K 线在拍子 bt 时的状态
function candleAt(c, bt) {      // 盘中：价格沿 pathAt 抖动，影线随已走过的最高/最低价长出来
  const p = clamp((bt - c.b0) / (c.b1 - c.b0));
  if (p >= 1) return { p, cur: c.c, h: c.h, l: c.l };
  if (p <= 0) return { p, cur: c.o, h: c.o, l: c.o };
  const cur = pathAt(c, p);
  let h = Math.max(c.o, cur), l = Math.min(c.o, cur);
  for (let j = 1; j < 16; j++) { const v = pathAt(c, p * j / 16); h = Math.max(h, v); l = Math.min(l, v) }
  const k = Math.pow(p, 4);       // 临近收盘时影线补齐到最终的最高/最低价
  return { p, cur, h: lerp(h, Math.max(h, c.h), k), l: lerp(l, Math.min(l, c.l), k) };
}
const visibleCount = bt => { let n = 0; while (n < CANDLES.length && CANDLES[n].b0 <= bt) n++; return n };
const eventIndex = bt => { let k = -1; EVENTS.forEach((e, i) => { if (e.b <= bt) k = i }); return k };
const chapterIndex = bt => CHAPTERS.reduce((a, ch, j) => bt >= ch.b0 ? j : a, 0);

// ---------- 通用绘制 ----------
let ctx;
function text(s, x, y, size, color, font = SANS, weight = 400, align = 'left', ls = 0) {
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
}
function tw(s, size, font = SANS, weight = 400, ls = 0) { ctx.font = `${weight} ${size}px ${font}`; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w }
function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h) }
function rrect(x, y, w, h, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill() } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke() }
}
function withAlpha(a, f) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); f(); ctx.restore() }
function vignette() {
  const g = ctx.createRadialGradient(W / 2, H * .45, H * .2, W / 2, H * .45, H * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); rect(0, 0, W, H, g);
}
function stamp(label, x, y, color, k, rot = -.12, size = 44) {    // 红/绿印章，k 为出现进度
  if (k <= 0) return;
  const s = lerp(1.9, 1, easeOut(k * 1.6)), a = clamp(k * 3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  const w = tw(label, size, SERIF, 900, 4) + 28, h = size + 22;
  rrect(-w / 2, -h / 2, w, h, 6, color); rrect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 4, null, 'rgba(255,255,255,.75)', 2);
  text(label, 2, size * .36, size, '#fff', SERIF, 900, 'center', 4);
  ctx.restore();
}

// ---------- 顶栏 / 快讯 ----------
function topBar(T, bt) {
  rect(0, 0, W, 82, C.bg);
  text('历史交易所', 36, 52, 24, C.gold, SANS, 500); text('终端 · 新股', 170, 52, 22, C.dim);
  const st = bt < 32 ? '集合竞价' : bt < END.title || VERSION.live ? '连续竞价' : '已休市';
  const sw = tw(st, 20, SANS, 700) + 20;
  const clock = new Date((9 * 3600 + 15 * 60 + T * 3) * 1000).toISOString().slice(11, 19);
  rrect(W - 36 - 150 - sw, 30, sw, 32, 3, bt < END.title || VERSION.live ? C.gold : '#55585f');
  text(st, W - 36 - 150 - sw / 2, 53, 20, '#1a1407', SANS, 700, 'center');
  text(clock, W - 36, 55, 26, C.dim2, MONO, 500, 'right');
  rect(0, 82, W, 1, C.line);
}
function ticker(T) {
  const y = 1818; rect(0, y - 8, W, 60, '#0d0f13'); rect(0, y - 8, W, 1, C.line);
  ctx.save(); ctx.beginPath(); ctx.rect(120, y - 8, W - 120, 60); ctx.clip();
  const w = tw(TICKER, 21); const off = (T * 70) % w;
  for (let x = 130 - off; x < W; x += w) text(TICKER, x, y + 30, 21, C.dim);
  ctx.restore();
  rrect(24, y + 4, 80, 36, 3, C.red); text('快讯', 64, y + 30, 21, '#fff', SANS, 700, 'center');
}

// ---------- 交易界面 ----------
const CH = { x0: 40, x1: 950, y0: 450, y1: 1220 };   // K 线绘图区
const NWIN = 24;

function yRangeRaw(bt) {
  const n = visibleCount(bt); if (!n) return [90, 110];
  const last = CANDLES[n - 1], frac = easeOut((bt - last.b0) / .6);
  const pos = n - 1 + frac;
  let lo = 1e9, hi = -1e9;
  for (let i = Math.max(0, Math.floor(pos - NWIN)); i < n; i++) { const s = candleAt(CANDLES[i], bt); lo = Math.min(lo, s.l); hi = Math.max(hi, s.h) }
  const pad = (hi - lo) * .14 + 4; return [lo - pad, hi + pad * 1.8];
}
function yRange(bt) {      // 多点采样平均，相当于平滑缩放
  let a = 0, b = 0; const N = 8;
  for (let k = 0; k < N; k++) { const r = yRangeRaw(bt - k * .18); a += r[0]; b += r[1] } return [a / N, b / N];
}

function header(bt, k) {
  const y = 96; rect(0, y, W, 250, C.bg);
  rrect(36, y + 22, 62, 62, 6, C.red); text(TX.seal, 67, y + 66, 40, '#fff', SERIF, 900, 'center');
  text(TX.name, 116, y + 56, 40, C.text, SERIF, 900);
  text(TX.code + ' · ' + TX.board, 118, y + 84, 18, C.dim);
  const live = bt < END.title;
  const on = live || VERSION.live;
  ctx.beginPath(); ctx.arc(W - 150, y + 48, 7, 0, 7); ctx.fillStyle = on ? C.green : C.red; ctx.fill();
  text(on ? '交易中' : '已休市', W - 36, y + 56, 22, on ? C.green : C.red, SANS, 500, 'right');

  const n = visibleCount(bt), c = n ? CANDLES[n - 1] : null, s = c ? candleAt(c, bt) : { cur: 100 };
  const price = live ? s.cur : EVENTS[EVENTS.length - 1].v;
  const ref = live ? (c ? c.o : 100) : 100;
  const d = price - ref, up = d >= 0, col = up ? C.red : C.green;
  const e = EVENTS[Math.max(0, k)];
  const yr = live ? e.y : VERSION.endYear;
  const bc = yr.startsWith('前');
  if (bc) text('前', 38, y + 172, 30, C.gold, SERIF, 900);
  const yrText = bc ? yr.slice(1) : yr;
  text(yrText, bc ? 74 : 38, y + 176, 62, C.text, MONO, 700);
  const yx = (bc ? 74 : 38) + tw(yrText, 62, MONO, 700) + 22;
  text(live ? (e.era ? e.era + ' · ' + e.t : e.t) : VERSION.span, yx, y + 146, 26, C.text, SANS, 500);
  text(live ? TX.index + ' · ' + TX.unit : '全景 · 对数坐标', yx, y + 176, 18, C.dim);
  text(fmtP(price), W - 36, y + 170, 68, col, MONO, 700, 'right');
  const pct = (d / ref * 100);
  text(`${up ? '▲' : '▼'} ${up ? '+' : ''}${pct.toFixed(2)}%    ${up ? '+' : ''}${d.toFixed(1)}`, W - 36, y + 208, 20, col, MONO, 500, 'right');
  text(`历史最高 ${Math.round(maxClose(bt))}`, 38, y + 226, 18, C.dim);
  text(`较发行价 ${((price / 100 - 1) * 100).toFixed(0)}%`, 220, y + 226, 18, C.dim);
  rect(36, y + 244, W - 72, 2, C.line);
  rect(36, y + 244, (W - 72) * clamp((bt - 32) / (END.title - 32)), 2, C.gold);
}
function maxClose(bt) { let m = 100; const n = visibleCount(bt); for (let i = 0; i < n; i++) if (CANDLES[i].key >= 0) m = Math.max(m, candleAt(CANDLES[i], bt).cur); return m }

function chart(T, bt) {
  const P = { x: 24, y: 366, w: W - 48, h: 930 };
  rrect(P.x, P.y, P.w, P.h, 4, C.panel, C.line, 1.5);
  // 角标
  ctx.strokeStyle = '#4a4e57'; ctx.lineWidth = 2;
  [[P.x, P.y, 1, 1], [P.x + P.w, P.y, -1, 1], [P.x, P.y + P.h, 1, -1], [P.x + P.w, P.y + P.h, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x + 18 * sx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + 18 * sy); ctx.stroke();
  });
  const n = visibleCount(bt), chI = chapterIndex(bt);
  // 水印大字
  withAlpha(.045, () => text(CHAPTERS[chI].mark, W / 2, 1060, 560, C.text, SERIF, 900, 'center'));

  const last = CANDLES[Math.max(0, n - 1)], frac = n ? easeOut((bt - last.b0) / .6) : 0;
  const pos = n - 1 + frac, sp = (CH.x1 - CH.x0) / NWIN;
  const X = i => CH.x1 - sp * .7 - (pos - i) * sp;
  const [lo, hi] = yRange(bt);
  const Y = v => CH.y1 - (v - lo) / (hi - lo) * (CH.y1 - CH.y0);

  // 标题行
  const ma = (i, m) => { let s = 0, c = 0; for (let j = Math.max(0, i - m + 1); j <= i; j++) { s += candleAt(CANDLES[j], bt).cur; c++ } return s / c };
  text(TX.index + ' · ' + TX.unit, 48, 404, 19, C.text, SANS, 500);
  if (n) {
    text(`MA5 ${ma(n - 1, 5).toFixed(1)}`, 220, 404, 17, C.ma5, MONO); text(`MA20 ${ma(n - 1, 20).toFixed(1)}`, 360, 404, 17, C.ma20, MONO);
  }
  text('红涨绿跌', W - 48, 404, 17, C.dim, SANS, 400, 'right');
  rect(40, 420, W - 80, 1, C.line);

  // 网格与价格轴
  const step = niceStep((hi - lo) / 5);
  for (let v = Math.ceil(lo / step) * step; v < hi; v += step) {
    const y = Y(v); if (y < CH.y0 - 10 || y > CH.y1 + 10) continue;
    ctx.setLineDash([4, 8]); ctx.strokeStyle = '#262a31'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(CH.x0, y); ctx.lineTo(CH.x1 + 10, y); ctx.stroke(); ctx.setLineDash([]);
    text(v.toFixed(0), W - 40, y + 6, 16, C.dim, MONO, 400, 'right');
  }

  ctx.save(); ctx.beginPath(); ctx.rect(CH.x0 - 6, CH.y0 - 40, CH.x1 - CH.x0 + 12, CH.y1 - CH.y0 + 60); ctx.clip();
  const i0 = Math.max(0, Math.floor(pos - NWIN - 1));
  // 均线
  [[5, C.ma5, .55], [20, C.ma20, .9]].forEach(([m, col, a]) => {
    ctx.beginPath(); for (let i = i0; i < n; i++) { const x = X(i), y = Y(ma(i, m)); i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
    ctx.strokeStyle = col; ctx.globalAlpha = a; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
  });
  // K 线
  const bw = sp * .62;
  for (let i = i0; i < n; i++) {
    const c = CANDLES[i], s = candleAt(c, bt), x = X(i), up = s.cur >= c.o, col = up ? C.red : C.green;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, Y(s.h)); ctx.lineTo(x, Y(s.l)); ctx.stroke();
    const yt = Y(Math.max(c.o, s.cur)), yb = Y(Math.min(c.o, s.cur)), hh = Math.max(3, yb - yt);
    if (up) { rect(x - bw / 2, yt, bw, hh, C.panel); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(x - bw / 2 + 1.5, yt + 1.5, bw - 3, hh - 3) }
    else rect(x - bw / 2, yt, bw, hh, col);
    if (c.key >= 0 && i === n - 1 && s.p < 1) {     // 正在形成的大 K 线发光
      ctx.save(); ctx.globalAlpha = .25 * (1 - s.p); rect(x - bw, yt - 10, bw * 2, hh + 20, col); ctx.restore();
    }
  }
  ctx.restore();

  // 当前价标签
  if (n) {
    const s = candleAt(last, bt), up = s.cur >= last.o, y = Y(s.cur);
    ctx.setLineDash([3, 5]); ctx.strokeStyle = up ? C.red : C.green; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(X(n - 1), y); ctx.lineTo(CH.x1 + 4, y); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    rrect(CH.x1 + 4, y - 15, 86, 30, 3, up ? C.red : C.green); text(s.cur.toFixed(1), CH.x1 + 47, y + 7, 17, '#fff', MONO, 700, 'center');
  }

  // 事件标注：最近 3 个大 K 线
  const keys = []; for (let i = n - 1; i >= i0 && keys.length < 3; i--) if (CANDLES[i].key >= 0) keys.push(CANDLES[i]);
  const placed = [];   // 已放好的标注框，新的在前；旧标注撞上就挪到上方或下方
  keys.forEach((c, j) => {
    const e = EVENTS[c.key], s = candleAt(c, bt), x = X(c.i), up = c.c >= c.o;
    const a = easeOut((bt - c.b0) / .8) * (j === 0 ? 1 : j === 1 ? .7 : .4);
    const anchor = up ? Y(s.h) - 14 : Y(s.l) + 14;
    const right = x < CH.x0 + 330;
    const w = Math.max(tw(e.t, 32, SERIF, 900), tw(`${e.y} · ${e.s}`, 18, SANS, 400));
    const bx0 = right ? x + 22 : x - 22 - w, bx1 = bx0 + w;
    const box = ty => { const nY = up ? ty - 8 : ty - 20; return [nY - 34, nY + 36]; };
    const hit = ty => { const [a0, a1] = box(ty); return placed.some(p => bx0 < p[2] && p[0] < bx1 && a0 < p[3] && p[1] < a1); };
    let ty = up ? Math.max(CH.y0 + 30, anchor - 70) : Math.min(CH.y1 - 20, anchor + 60);
    if (hit(ty)) {
      const [t0, t1] = box(ty), off = t0 - ty, h = t1 - t0, cands = [];
      placed.forEach(p => cands.push(p[1] - 6 - h - off, p[3] + 6 - off));
      const ok = cands.filter(t => box(t)[0] >= CH.y0 + 4 && box(t)[1] <= CH.y1 - 4 && !hit(t)).sort((p, q) => Math.abs(p - ty) - Math.abs(q - ty));
      if (ok.length) ty = ok[0];
    }
    { const [a0, a1] = box(ty); placed.push([bx0, a0, bx1, a1]); }
    withAlpha(a, () => {
      const lx = right ? x + 22 : x - 22, al = right ? 'left' : 'right';
      ctx.strokeStyle = 'rgba(235,231,222,.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, anchor); ctx.lineTo(x, ty - (up ? 0 : 30)); ctx.lineTo(lx, ty - (up ? 0 : 30)); ctx.stroke();
      const nameY = up ? ty - 8 : ty - 20;
      text(e.t, lx, nameY, 32, C.text, SERIF, 900, al);
      text(`${e.y} · ${e.s}`, lx, nameY + 28, 18, C.dim2, SANS, 400, al);
    });
  });

  // 底部章节条
  const by = 1238;
  for (let i = i0; i < n; i++) {
    const c = CANDLES[i], x = X(i); if (x < CH.x0 - sp || x > CH.x1 + sp) continue;
    const cur = c.ch === chI;
    rect(Math.max(CH.x0, x - sp / 2), by, Math.min(sp, CH.x1 + sp * .3 - (x - sp / 2)), 22, cur ? C.gold : '#353840');
  }
  CHAPTERS.forEach((ch, j) => {         // 章节名写在色条中央
    let xs = [], cand = CANDLES.filter(c => c.ch === j && c.i >= i0 && c.i < n);
    cand.forEach(c => xs.push(X(c.i))); if (!xs.length) return;
    const a = Math.max(CH.x0, Math.min(...xs) - sp / 2), b = Math.min(CH.x1, Math.max(...xs) + sp / 2);
    if (b - a > 90) text(ch.name, (a + b) / 2, by + 18, 16, j === chI ? '#241a06' : C.dim2, SANS, 700, 'center');
  });
  // 年份刻度
  keys.slice(0, 3).forEach(c => text(EVENTS[c.key].y, X(c.i), by + 50, 15, C.dim, MONO, 400, 'center'));
}
function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x))); const m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p }

function namePanel(bt, k) {
  const y = 1316; rect(0, y - 6, W, 500, C.bg);
  const chI = chapterIndex(bt), ch = CHAPTERS[chI];
  text(TX.panel, 40, y + 30, 18, C.dim);
  const sw = easeOut((bt - ch.b0) / 1.5);
  withAlpha(sw, () => {
    text(ch.name, 40, y + 96, 54, C.text, SERIF, 900);
    text(`第 ${chI + 1} 章 / 共 ${CHAPTERS.length} 章`, 52 + tw(ch.name, 54, SERIF, 900), y + 94, 18, C.dim);
  });
  const nb = chI + 1 < CHAPTERS.length ? CHAPTERS[chI + 1].b0 : END.title;
  rect(40, y + 122, W - 80, 4, '#2c2f36'); rect(40, y + 122, (W - 80) * clamp((bt - ch.b0) / (nb - ch.b0)), 4, C.gold);

  // 大事记
  const ly = y + 172; text('大事记', 40, ly, 18, C.red, SANS, 500);
  ctx.beginPath(); ctx.arc(W - 46, ly - 6, 5, 0, 7); ctx.fillStyle = C.red; ctx.fill();
  for (let j = 0; j < 3; j++) {
    const ei = k - j; if (ei < 0) break;
    const e = EVENTS[ei], ry = ly + 22 + j * 96;
    const a = j === 0 ? easeOut((bt - e.b) / .5) : 1;
    withAlpha(a * (j === 0 ? 1 : .75 - j * .15), () => {
      if (j === 0) { rect(40, ry, W - 80, 84, '#1d2027'); rect(40, ry, 5, 84, C.red) }
      text(e.y, 64, ry + 36, 17, C.dim, MONO);
      text(e.t, 180, ry + 38, 31, C.text, SANS, 700);
      text(e.s, 180, ry + 70, 19, C.dim2);
      const o = ei ? EVENTS[ei - 1].v : 96, d = (e.v / o - 1) * 100;
      text(`${d >= 0 ? '+' : ''}${d.toFixed(1)}%`, W - 64, ry + 52, 26, d >= 0 ? C.red : C.green, MONO, 700, 'right');
    });
  }
}

// 涨停 / 跌停印章与连板
function stamps(bt) {
  const k = eventIndex(bt); if (k < 0) return;
  const e = EVENTS[k], o = k ? EVENTS[k - 1].v : 96, r = e.v / o;
  const age = bt - e.b - (e.big && !e.bigAt ? 3.6 : 0); if (age > 5 || age < 0 || e.last) return;   // 有大字转场的，等转场结束再盖章
  let streak = 0;
  for (let j = k; j >= 0; j--) { const oo = j ? EVENTS[j - 1].v : 96; if (EVENTS[j].v >= oo * 1.18) streak++; else break }
  const fade = 1 - clamp((age - 4) / 1);
  withAlpha(fade, () => {
    if (r >= 1.18) {
      if (streak >= 2) text(['', '', '二', '三', '四', '五'][Math.min(streak, 5)] + '连板', 300, 560, 46, C.gold2, SERIF, 900, 'center');
      for (let j = 0; j < Math.min(streak, 3); j++) stamp('涨停', 300, 620 + j * 74, C.red, (age - .25 - j * .25) / 1, -.08);
    } else if (r <= .82) {
      for (let j = 0; j < (r <= .6 ? 3 : r <= .72 ? 2 : 1); j++) stamp('跌停', 300, 880 + j * 74, '#159a76', (age - .2 - j * .25) / 1, .08);
    }
  });
}

// 大字转场：章节名或关键时刻
function bigOverlays(bt) {
  const items = [];
  CHAPTERS.forEach((ch, j) => { if (j > 0) items.push({ b: ch.b0, t: ch.name, s: `第 ${j + 1} 章`, col: C.gold2, d: 3 }) });
  EVENTS.forEach(e => { if (e.big) items.push({ b: e.bigAt || e.b, t: e.big[0], s: e.big[1], col: e.v < prevV(e) ? '#7fe3c4' : C.gold2, d: 4 }) });
  items.push({ b: 32, t: '开盘', s: TX.open, col: C.red, d: 2.5 });
  items.push({ b: END.title, t: TX.span, s: VERSION.span, col: C.gold2, d: 3 });
  items.forEach(it => {
    const age = bt - it.b; if (age < 0 || age > it.d) return;
    const a = Math.min(easeOut(age / .35), 1 - clamp((age - it.d + .8) / .8));
    withAlpha(a * .62, () => rect(0, 366, W, 930, '#08090c'));
    withAlpha(a, () => {
      const sc = lerp(1.25, 1, easeOut(age / .5));
      ctx.save(); ctx.translate(W / 2, 840); ctx.scale(sc, sc);
      ctx.shadowColor = it.col; ctx.shadowBlur = 40;
      text(it.t, 0, 0, it.t.length > 4 ? 120 : 150, it.col, SERIF, 900, 'center', 8);
      ctx.shadowBlur = 0;
      text(it.s, 0, 70, 28, C.dim2, SANS, 400, 'center', 4);
      ctx.restore();
    });
  });
}

// ---------- 开场 ----------
function intro(T, bt) {
  rect(0, 83, W, H - 83, C.bg); vignette();
  if (bt < 8) {          // 标题逐字出现
    const lines = TX.title;
    rect(64, 690, 10, 330, C.gold);
    let idx = 0;
    lines.forEach((l, li) => {
      [...l].forEach((ch, ci) => {
        const k = easeOut((bt - .3 - idx * .45) / .5); idx++;
        withAlpha(k, () => text(ch, 110 + ci * 132, 830 + li * 160 + (1 - k) * 30, 128, C.text, SERIF, 900));
      });
    });
    withAlpha(easeOut((bt - 5.8) / 1), () => text(TX.tagline, 112, 1110, 32, C.gold, SANS, 500));
    withAlpha(1 - clamp((bt - 7.4) / .6), () => { });
    return;
  }
  if (bt < 22) {         // 股票信息卡
    const a = easeOut((bt - 8) / .6);
    withAlpha(a, () => {
      text(TX.ask[0], 60, 220, 44, C.text, SERIF, 900);
      text(TX.ask[1], 60, 286, 44, C.text, SERIF, 900);
      rrect(60, 320, 120, 34, 3, C.gold); text('新股发行', 120, 344, 20, '#1a1407', SANS, 700, 'center');
      rect(60, 380, W - 120, 1, C.line);
    });
    const rows = TX.rows;
    rows.forEach(([l, v], j) => {
      const k = easeOut((bt - 9 - j * .9) / .5), y = 460 + j * 92;
      withAlpha(k, () => {
        text(l, 60, y, 28, C.dim);
        text(v, W - 60 + (1 - k) * 40, y, 40, j === 2 ? C.red : C.text, j === 2 || j === 0 ? MONO : SERIF, 900, 'right');
        rect(60, y + 30, W - 120, 1, '#22252c');
      });
    });
    const q = easeOut((bt - 15) / .8);
    withAlpha(q, () => {
      rrect(60, 1080, W - 120, 380, 6, '#16140f', C.gold, 2);
      text('引言', 96, 1134, 22, C.gold, SANS, 500);
      TX.quote.forEach((l, i) => text(l, 96, 1250 + Math.round(i * TX.quoteSize * 1.31) - (TX.quote.length - 2) * 60, TX.quoteSize, C.text, SERIF, 900));
      text(TX.quoteSrc, W - 100, TX.quote.length > 2 ? 1445 : 1420, 26, C.dim2, SERIF, 700, 'right');
    });
    stamp('买入', 860, 1330, C.red, (bt - 18.5) / 1, -.18, 52);
    return;
  }
  // 集合竞价
  for (let i = 0; i < 170; i++) {
    const x = hash(i) * W, sp = 300 + hash(i + 9) * 600, len = 30 + hash(i + 3) * 90;
    const y = ((hash(i + 5) * 2400 + T * sp) % 2400) - 300;
    ctx.fillStyle = i % 2 ? 'rgba(229,70,61,.45)' : 'rgba(34,196,151,.4)';
    ctx.fillRect(x, y, 2.5, len);
  }
  const a = easeOut((bt - 22) / .5);
  withAlpha(a, () => {
    text('开 盘 集 合 竞 价', W / 2, 800, 28, C.dim2, SANS, 400, 'center', 6);
    const settle = bt >= 28;
    const v = settle ? 100 : 100 + (hash(Math.floor(T * 12)) - .5) * 24;
    ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.35)'; ctx.shadowBlur = settle ? 30 : 10;
    text(fmtP(v), W / 2, 1010, 200, '#f4f1ea', MONO, 700, 'center'); ctx.restore();
    rect(W / 2 - 230, 1060, 460, 1, '#3a3d44');
    text(settle ? '预计开盘价 · 撮合完成' : '预计开盘价 · 撮合中', W / 2, 1110, 26, C.gold, SANS, 500, 'center', 3);
  });
}

// ---------- 收尾：全景 + 复盘 ----------
function panorama(T, bt) {
  const P = { x: 24, y: 366, w: W - 48, h: 930 };
  const tr = clamp((bt - END.pano) / (END.panoEnd - END.pano));
  const pts = CANDLES.map((c, i) => {      // 全景线：大 K 线收盘值保持原值，小 K 线做 5 根平滑
    if (c.key >= 0) return { i, v: c.c };
    let s = 0, n = 0; for (let j = Math.max(0, i - 2); j <= Math.min(CANDLES.length - 1, i + 2); j++) { s += CANDLES[j].c; n++ } return { i, v: s / n };
  });
  const lo = Math.log(VERSION.pano.lo), hi = Math.log(VERSION.pano.hi);
  const X = i => 70 + i / (pts.length - 1) * (W - 200), Y = v => 1180 - (Math.log(v) - lo) / (hi - lo) * 640;
  const appear = easeOut((bt - (END.title + 2.2)) / 1);
  withAlpha(appear, () => {
    rrect(P.x, P.y, P.w, P.h, 4, C.panel, C.line, 1.5);
    text(TX.index + ' · 全景', 48, 404, 19, C.text, SANS, 500); text('对数坐标', W - 48, 404, 17, C.dim, SANS, 400, 'right');
    rect(40, 420, W - 80, 1, C.line);
    VERSION.pano.grid.forEach(v => {
      ctx.setLineDash([4, 8]); ctx.strokeStyle = '#262a31'; ctx.beginPath(); ctx.moveTo(60, Y(v)); ctx.lineTo(W - 120, Y(v)); ctx.stroke(); ctx.setLineDash([]);
      text(String(v), W - 40, Y(v) + 6, 16, C.dim, MONO, 400, 'right');
    });
    // 发行价基准线
    ctx.strokeStyle = 'rgba(217,174,91,.35)'; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(60, Y(100)); ctx.lineTo(W - 120, Y(100)); ctx.stroke(); ctx.setLineDash([]);
    // 章节刻度
    CHAPTERS.forEach((ch, j) => {
      const i = CANDLES.findIndex(c => c.ch === j); const x = X(i);
      rect(x, 1236, 2, 12, '#4a4e57'); text(ch.name, x + 6, 1262, 16, C.dim, SANS, 400);
    });
    const m = Math.max(1, Math.floor(tr * (pts.length - 1)));
    ctx.save(); ctx.beginPath();
    for (let i = 0; i <= m; i++) { const x = X(i), y = Y(pts[i].v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
    ctx.lineJoin = 'round'; ctx.shadowColor = C.gold2; ctx.shadowBlur = 22; ctx.strokeStyle = C.gold2; ctx.lineWidth = 5; ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#fff6dc'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    // 光点
    const hx = X(m), hy = Y(pts[m].v);
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
    // 标注
    PANO_LABELS.forEach(L => {
      const ci = CANDLES.findIndex(c => c.key === L.i); if (ci > m) return;
      const e = EVENTS[L.i], x = X(ci), y = Y(e.v), k = easeOut((bt - (END.pano + (ci / (pts.length - 1)) * (END.panoEnd - END.pano))) / .6);
      withAlpha(k, () => {
        const up = L.i === 0 || e.v >= prevV(e) || L.i === EVENTS.length - 1;
        const ty = up ? y - 34 : y + 58;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = C.gold2; ctx.fill();
        text(L.t, x, ty, 30, C.gold2, SERIF, 900, 'center');
        text(e.y, x, ty + (up ? -36 : 26), 15, C.dim2, MONO, 400, 'center');
      });
    });
  });
  stamp(VERSION.panoStamp, W - 300, 1150, C.red, (bt - END.stamp) / 1, -.2, 46);
}

function report(bt) {
  const y = 1316; rect(0, y - 6, W, 500, C.bg);
  const a = easeOut((bt - END.report) / .8);
  withAlpha(a, () => {
    text('复盘报告', 40, y + 52, 38, C.gold2, SERIF, 900);
    text(TX.code + ' · ' + VERSION.span, 232, y + 50, 18, C.dim);
    rect(40, y + 76, W - 80, 1, C.line);
  });
  const items = [
    [TX.report[0], `${STATS.years}`, '年'], ['历史最高', `${STATS.hi.v}`, `${STATS.hi.era} · ${STATS.hi.y}`],
    ['区间涨幅', `+${EVENTS[EVENTS.length - 1].v - 100}%`, VERSION.span.replace(' – ', ' → ')], ['最大回撤', `${(STATS.dd * 100).toFixed(0)}%`, VERSION.ddText],
    [TX.report[1], `${STATS.up}`, '次 · 单根涨超20%'], [TX.report[2], `${STATS.down}`, '次 · 单根跌超20%'],
  ];
  items.forEach(([l, v, u], j) => {
    const k = easeOut((bt - END.report - 1 - j * .7) / .6);
    const x = 40 + (j % 2) * 520, yy = y + 136 + Math.floor(j / 2) * 118;
    withAlpha(k, () => {
      text(l, x, yy, 20, C.dim);
      const col = j === 3 || j === 5 ? C.green : j === 4 || j === 1 || j === 2 ? C.red : C.text;
      text(v, x, yy + 54, 50, col, MONO, 700);
      text(u, x + tw(v, 50, MONO, 700) + 12, yy + 52, 20, C.dim2);
    });
  });
}

function quote(T, bt) {
  const a = easeOut((bt - END.quote) / 1.5);
  withAlpha(a, () => {
    rect(0, 0, W, H, '#0b0c10');
    const g = ctx.createRadialGradient(W / 2, 860, 50, W / 2, 860, 700); g.addColorStop(0, 'rgba(217,174,91,.10)'); g.addColorStop(1, 'rgba(0,0,0,0)'); rect(0, 0, W, H, g);
    const l1 = easeOut((bt - END.quote - .3) / 1.2), l2 = easeOut((bt - END.quote - 1.5) / 1.2);
    withAlpha(l1, () => text(TX.end[0], W / 2, 800, 132, C.text, SERIF, 900, 'center', 16));
    withAlpha(l2, () => text(TX.end[1], W / 2, 980, 132, C.text, SERIF, 900, 'center', 16));
    withAlpha(easeOut((bt - END.quote - 3) / 1.2), () => text(TX.endSrc, W / 2 + 260, 1070, 30, C.dim2, SERIF, 700, 'center'));
    withAlpha(easeOut((bt - END.quote - 5) / 1.5), () => text(TX.endLine, W / 2, 1250, 36, C.gold, SANS, 500, 'center', 2));
    stamp(VERSION.closeStamp, W / 2, 1420, C.red, (bt - END.quote - 8) / 1, -.06, 48);
  });
}

// ---------- 主函数 ----------
function drawFilm(T) {
  const bt = beatOf(T);
  ctx.save(); rect(0, 0, W, H, C.bg);
  if (bt < 32) { intro(T, bt) }
  else {
    const k = eventIndex(bt);
    header(bt, k);
    if (bt < END.title + 2.2) { chart(T, bt); stamps(bt) }
    if (bt >= END.title + 1.5) panorama(T, bt);
    if (bt < END.report) namePanel(bt, k); else report(bt);
    bigOverlays(bt);
    vignette();
    const fl = 1 - clamp((bt - 32) / .5); if (fl > 0) withAlpha(fl * .5, () => rect(0, 0, W, H, '#fff'));   // 开盘闪白
  }
  topBar(T, bt); ticker(T);
  if (bt >= END.quote) quote(T, bt);
  const fo = clamp((T - (TOTAL - 2)) / 2); if (fo > 0) withAlpha(fo, () => rect(0, 0, W, H, '#000'));
  ctx.restore();
}
