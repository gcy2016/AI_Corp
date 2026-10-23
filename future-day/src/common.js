/* 未来的一天 · 公共组件
   所有场景共用：缓动、颜色、文字、卡片、人物、机械臂、手、山、树、字幕、时间标签 */
const W = 1920, H = 1080;
const F = '"Noto Sans CJK SC","Microsoft YaHei","PingFang SC",sans-serif';
let ctx; // 当前绘制上下文（转场时会切换到离屏画布）

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3) };
const prog = (t, a, b) => clamp((t - a) / (b - a));
const win = (t, a, b, f = .3) => Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b));
const bump = (t, a, b) => Math.sin(Math.PI * prog(t, a, b));
function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) }
function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))).join(',')})` }
function rgba(h, a) { const A = hex(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})` }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }
function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); ctx.fillStyle = c; ctx.fill() }
function circle(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 7); ctx.fill() }
function txt(s, x, y, size, color, weight = 400, align = 'left') {
  ctx.font = `${weight} ${size}px ${F}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y)
}
function tw(s, size, weight = 400) { ctx.font = `${weight} ${size}px ${F}`; return ctx.measureText(s).width }
function line(x1, y1, x2, y2, c, w, cap = 'round') { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke() }
function alpha(a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore() }
function seeded(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function camera(s, cx, cy, fn) { if (s >= 1) { cx = clamp(cx, W / 2 / s, W - W / 2 / s); cy = clamp(cy, H / 2 / s, H - H / 2 / s) } ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore() }

/* 背景 */
function vgrad(y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g }
function glow(x, y, r, c, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r) }
function ridge(x0, x1, base, amp, f, ph, col, bottom = H + 200) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, bottom);
  for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, base - amp * (.6 * Math.sin(x * f + ph) + .4 * Math.sin(x * f * 2.3 + ph * 1.7)));
  ctx.lineTo(x1, bottom); ctx.fill()
}
function tree(x, y, s, t, col = '#5f8f62', dark = '#4c7a52', trunk = '#7a5b45') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fillRR(-8, -90, 16, 92, 6, trunk);
  const sw = Math.sin(t * 1.1 + x * .01) * 3;
  circle(-34 + sw, -110, 46, dark); circle(30 + sw, -112, 48, dark); circle(sw, -150, 54, col); circle(-28 + sw, -128, 40, col); circle(32 + sw, -134, 38, col);
  ctx.restore()
}
function pine(x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 120 * s); ctx.lineTo(x + 34 * s, y); ctx.lineTo(x - 34 * s, y); ctx.fill() }

/* UI 组件 */
function glass(x, y, w, h, r = 30, a = '#0e1a2c', b = '#16314f') {
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, a); g.addColorStop(1, b); rr(x, y, w, h, r); ctx.fillStyle = g; ctx.fill()
}
function card(x, y, w, h, al = 1, hl = false, r = 24) {
  alpha(al, () => {
    rr(x, y + (1 - al) * 20, w, h, r); ctx.fillStyle = hl ? 'rgba(120,180,255,.16)' : 'rgba(255,255,255,.06)'; ctx.fill();
    ctx.strokeStyle = hl ? 'rgba(140,200,255,.6)' : 'rgba(255,255,255,.1)'; ctx.lineWidth = 2; ctx.stroke()
  })
}
function pill(x, y, label, bg, fg = '#fff', size = 22, align = 'left') {
  const w = tw(label, size, 600) + size * 1.4, h = size * 1.6; const x0 = align === 'center' ? x - w / 2 : x;
  fillRR(x0, y, w, h, h / 2, bg); txt(label, x0 + w / 2, y + h * .7, size, fg, 600, 'center'); return w
}
function button(cx, cy, w, label, style, press = 0) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1 - press * .06, 1 - press * .06); rr(-w / 2, -28, w, 56, 28);
  if (style === 'outline') { ctx.strokeStyle = '#9fd0ff'; ctx.lineWidth = 2; ctx.stroke(); txt(label, 0, 10, 26, '#9fd0ff', 600, 'center') }
  else { ctx.fillStyle = style || '#3d8bff'; ctx.fill(); txt(label, 0, 10, 26, '#fff', 600, 'center') }
  ctx.restore()
}
function chip(x, y, k, v, col, al = 1, tx, ty) {
  alpha(al, () => {
    const w = tw(v, 26, 500) + tw(k, 24, 700) + 76, h = 50;
    if (tx !== undefined) {
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.lineTo(tx < x ? x : x + w, y + h / 2); ctx.stroke(); ctx.setLineDash([]); circle(tx, ty, 6, '#fff')
    }
    fillRR(x, y + (1 - al) * 10, w, h, 25, 'rgba(16,24,44,.74)'); circle(x + 26, y + 25 + (1 - al) * 10, 7, col);
    txt(k, x + 44, y + 34 + (1 - al) * 10, 24, col, 700); txt(v, x + 56 + tw(k, 24, 700), y + 34 + (1 - al) * 10, 26, '#fff', 500)
  })
}
function aiOrb(x, y, r, t, spk) {
  if (spk) for (let i = 0; i < 3; i++) { const ph = (t * 1.2 + i / 3) % 1; ctx.strokeStyle = `rgba(140,200,255,${.5 * (1 - ph)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + ph * r * 1.1, 0, 7); ctx.stroke() }
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, '#7cc8ff'); g.addColorStop(1, '#a98bff'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const h = spk ? r * .18 + Math.abs(Math.sin(t * 9 + i * 1.7)) * r * .6 : r * .14; rr(x - r * .6 + i * r * .25, y - h / 2, r * .14, h, r * .07); ctx.fill() }
}
function spark(x, y, w, h, data, p, col, lw = 4, fillA = .15) {
  const n = data.length, mn = Math.min(...data), mx = Math.max(...data), k = Math.max(1, Math.floor((n - 1) * p) + 1);
  const P = data.map((v, i) => [x + i / (n - 1) * w, y + h - (v - mn) / (mx - mn || 1) * h]);
  ctx.beginPath(); P.slice(0, k).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.lineTo(P[k - 1][0], y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fillStyle = rgba(col, fillA); ctx.fill();
  return P[k - 1]
}
function ring(x, y, r, p, col, lw = 12, label) {
  ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p)); ctx.stroke()
}
function check(x, y, s, col, p = 1) {
  ctx.strokeStyle = col; ctx.lineWidth = s * .18; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  const a = [x - s * .35, y], b = [x - s * .08, y + s * .28], c = [x + s * .4, y - s * .3];
  ctx.moveTo(...a); if (p < .4) ctx.lineTo(lerp(a[0], b[0], p / .4), lerp(a[1], b[1], p / .4)); else { ctx.lineTo(...b); ctx.lineTo(lerp(b[0], c[0], (p - .4) / .6), lerp(b[1], c[1], (p - .4) / .6)) } ctx.stroke()
}
function photo(x, y, w, h, seed, rot = 0, frame = true) {
  const R = seeded(seed); ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
  if (frame) fillRR(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 6, '#fbf8f2');
  ctx.save(); rr(-w / 2, -h / 2, w, h, 4); ctx.clip();
  const sky = ['#9cc9ef', '#ffcf9f', '#b8d7f0', '#f7b98a'][seed % 4]; ctx.fillStyle = sky; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = ['#7f9cbf', '#8a7fae', '#6f8fa8'][seed % 3]; ctx.beginPath(); ctx.moveTo(-w / 2, h / 4); ctx.lineTo(-w / 2 + w * R(), -h / 6 - R() * h / 4); ctx.lineTo(w * (R() - .3), h / 8); ctx.lineTo(w / 2, -h / 8); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.fill();
  if (seed % 2) { ctx.fillStyle = '#4f8fbf'; ctx.fillRect(-w / 2, h / 6, w, h / 3) } ctx.fillStyle = '#5f8f62'; ctx.fillRect(-w / 2, h / 3, w, h / 6);
  circle(w * (R() - .5) * .6, -h / 4, Math.min(w, h) * .08, '#fff3cf');
  ctx.restore(); ctx.restore()
}

/* 人物（扁平、无五官）
   side：侧面，dir=1 朝右；pose: stand | walk | sit ；o.ph 走路相位；o.arm 手臂角度覆盖；o.point 指向 */
const ME = { skin: '#f0c6a3', hair: '#2c2331', shirt: '#e8875f', pants: '#3b4a6b', shoe: '#2a2a35' };
function limb(x1, y1, x2, y2, x3, y3, c, w) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); if (x3 !== undefined) ctx.lineTo(x3, y3); ctx.stroke() }
function personSide(x, y, s, o = {}) {
  const C = Object.assign({}, ME, o.c || {}), d = o.dir || 1, pose = o.pose || 'stand', ph = o.ph || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * d, s);
  let hip, sh;
  if (pose === 'sit') {
    // 坐姿：臀部落在座面上（y=0），大腿水平，小腿垂到地面；o.legH = 座面到地面的高度（局部坐标）
    hip = [0, 0]; sh = [-4 + (o.lean || 0), -62]; const lh = o.legH || 60;
    fillRR(-22, -18, 50, 30, 14, C.pants);
    limb(0, 0, 44, 2, 46, lh - 6, C.pants, 22); limb(46, lh - 6, 60, lh - 6, undefined, undefined, C.shoe, 13);
  } else {
    hip = [0, -80]; sh = [2, -142];
    const a = pose === 'walk' ? Math.sin(ph) * .42 : 0, b = -a;
    const kneeB = pose === 'walk' ? Math.max(0, -Math.cos(ph)) * 10 : 0, kneeA = pose === 'walk' ? Math.max(0, Math.cos(ph)) * 10 : 0;
    for (const [ang, kb, sh2] of [[b, kneeA, .85], [a, kneeB, 1]]) {
      const kx = Math.sin(ang) * 40 + kb, ky = -80 + Math.cos(ang) * 40, fx = Math.sin(ang) * 80, fy = -80 + Math.cos(ang) * 80 - (kb ? 4 : 0);
      ctx.globalAlpha *= 1; limb(0, -80, kx, ky, fx, fy, sh2 < 1 ? mix(C.pants, '#000000', .2) : C.pants, 20); limb(fx, fy, fx + 14, fy, undefined, undefined, C.shoe, 13)
    }
  }
  // back arm
  const swing = pose === 'walk' ? Math.sin(ph) * .5 : 0;
  const armBack = o.armBack !== undefined ? o.armBack : -swing;
  limb(sh[0], sh[1] + 6, sh[0] + Math.sin(armBack) * 34, sh[1] + 6 + Math.cos(armBack) * 34, sh[0] + Math.sin(armBack) * 34 + Math.sin(armBack + .3) * 30, sh[1] + 6 + Math.cos(armBack) * 34 + Math.cos(armBack + .3) * 30, mix(C.shirt, '#000000', .18), 16);
  // torso
  ctx.fillStyle = C.shirt; ctx.beginPath(); ctx.moveTo(sh[0] - 18, sh[1]); ctx.quadraticCurveTo(sh[0] + 22, sh[1] - 6, sh[0] + 20, sh[1] + 10); ctx.lineTo(hip[0] + 18, hip[1] + 6); ctx.lineTo(hip[0] - 18, hip[1] + 6); ctx.closePath(); ctx.fill();
  // head
  const hy = sh[1] - 30 + (o.bob || 0);
  limb(sh[0] + 2, sh[1], sh[0] + 4, hy + 10, undefined, undefined, C.skin, 12);
  circle(sh[0] + 6, hy, 22, C.skin);
  ctx.fillStyle = C.hair; ctx.beginPath(); ctx.arc(sh[0] + 3, hy - 3, 23, Math.PI * .72, Math.PI * 2.08); ctx.fill();
  // front arm
  let e1, e2;
  if (o.point) { const [px, py] = o.point; const L = Math.hypot(px, py); e1 = [sh[0] + px / L * 34, sh[1] + 8 + py / L * 34]; e2 = [sh[0] + px / L * 66, sh[1] + 8 + py / L * 66] }
  else if (o.armTo) { e1 = o.armTo[0]; e2 = o.armTo[1] }
  else { const a2 = o.arm !== undefined ? o.arm : swing; e1 = [sh[0] + Math.sin(a2) * 34, sh[1] + 8 + Math.cos(a2) * 34]; e2 = [e1[0] + Math.sin(a2 + .35) * 30, e1[1] + Math.cos(a2 + .35) * 30] }
  limb(sh[0], sh[1] + 8, e1[0], e1[1], e2[0], e2[1], C.shirt, 16); circle(e2[0], e2[1], 8, C.skin);
  ctx.restore()
}
/* 正面坐姿上半身（餐桌、朋友） */
function personFront(x, y, s, o = {}) {
  const C = Object.assign({}, ME, o.c || {}); ctx.save(); ctx.translate(x, y + (o.bob || 0)); ctx.scale(s, s);
  ctx.fillStyle = C.shirt; ctx.beginPath(); ctx.moveTo(-50, 40); ctx.quadraticCurveTo(-48, -40, 0, -44); ctx.quadraticCurveTo(48, -40, 50, 40); ctx.closePath(); ctx.fill();
  fillRR(-9, -64, 18, 24, 6, C.skin); circle(0, -88, 30, C.skin);
  ctx.fillStyle = C.hair; ctx.beginPath();
  if (o.long) { ctx.moveTo(-32, -40); ctx.lineTo(-32, -90); ctx.arc(0, -90, 32, Math.PI, 0); ctx.lineTo(32, -40); ctx.lineTo(22, -40); ctx.lineTo(22, -86); ctx.quadraticCurveTo(0, -102, -22, -86); ctx.lineTo(-22, -40); }
  else { ctx.arc(0, -92, 32, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(10, -104, -31, -86) }
  ctx.fill();
  if (o.wave) { const a = o.wave; limb(40, -20, 70, -50 - a * 10, 80 + a * 8, -90 - a * 10, C.shirt, 18); circle(80 + a * 8, -92 - a * 10, 10, C.skin) }
  ctx.restore()
}
/* 机械臂（两段 IK） */
function robotArm(bx, by, tx, ty, l1 = 170, l2 = 150, o = {}) {
  const dx = tx - bx, dy = ty - by, d = Math.min(Math.hypot(dx, dy), l1 + l2 - 1);
  const a = Math.atan2(dy, dx), cb = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), sgn = o.flip ? -1 : 1;
  const a1 = a - sgn * Math.acos(cb), ex = bx + Math.cos(a1) * l1, ey = by + Math.sin(a1) * l1;
  const hx = bx + Math.cos(a) * d, hy = by + Math.sin(a) * d;
  fillRR(bx - 40, by - 6, 80, 30, 10, '#cfd6e0');
  limb(bx, by, ex, ey, undefined, undefined, '#e9eef5', 30); limb(ex, ey, hx, hy, undefined, undefined, '#f4f7fb', 24);
  circle(bx, by, 22, '#9aa7ba'); circle(ex, ey, 18, '#9aa7ba'); circle(ex, ey, 7, '#7cc4ff');
  const g = o.grip === undefined ? .5 : o.grip, ga = Math.atan2(hy - ey, hx - ex);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ga); fillRR(-6, -14, 20, 28, 6, '#8996aa');
  limb(12, -8, 30, -8 - 10 * g, undefined, undefined, '#6f7c90', 7); limb(12, 8, 30, 8 + 10 * g, undefined, undefined, '#6f7c90', 7); ctx.restore();
  return [hx, hy]
}
/* 服务机器人 */
function serviceBot(x, y, s, t, tray) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 4, 46, 8, 0, 0, 7); ctx.fill();
  fillRR(-40, -130, 80, 128, 34, '#f4f6fa'); fillRR(-30, -118, 60, 34, 16, '#1d2638');
  circle(-11, -101, 5, '#7cf0ff'); circle(11, -101, 5, '#7cf0ff'); fillRR(-44, -68, 88, 10, 5, '#cdd5e0');
  if (tray) { fillRR(-50, -150, 100, 8, 4, '#cdd5e0'); fillRR(-18, -142, 6, 14, 2, '#cdd5e0'); circle(-12, -160, 14, tray); fillRR(10, -170, 22, 22, 4, '#ffd6a0') }
  ctx.restore()
}
/* 自动驾驶小车（侧面） */
function pod(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s);
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, 6, 190, 14, 0, 0, 7); ctx.fill();
  ctx.fillStyle = o.col || '#f2f4f8'; ctx.beginPath(); ctx.moveTo(-190, -30); ctx.quadraticCurveTo(-186, -120, -90, -138); ctx.lineTo(80, -138); ctx.quadraticCurveTo(180, -128, 192, -40); ctx.lineTo(190, -22); ctx.lineTo(-190, -22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1f2a3f'; ctx.beginPath(); ctx.moveTo(-160, -60); ctx.quadraticCurveTo(-150, -118, -86, -124); ctx.lineTo(80, -124); ctx.quadraticCurveTo(160, -116, 170, -60); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(-160, -124, 100, -60); g.addColorStop(0, 'rgba(160,210,255,.35)'); g.addColorStop(1, 'rgba(160,210,255,0)'); ctx.fillStyle = g; ctx.fill();
  if (o.door) { alpha(o.door, () => fillRR(-60, -126, 116, 104, 10, '#26303f')); if (o.cabin) o.cabin(); // 车门打开后露出车厢，o.cabin 画正在上车的人
    ctx.fillStyle = o.col || '#f2f4f8'; const dx = o.door * 120; ctx.save(); ctx.beginPath(); ctx.rect(-190, -140, 380, 140); ctx.clip(); fillRR(-60 + dx, -126, 116, 104, 10, mix(o.col || '#f2f4f8', '#000000', .06)); ctx.restore() }
  else line(-4, -124, -4, -24, 'rgba(0,0,0,.1)', 3);
  ctx.fillStyle = o.light || '#7cd4ff'; fillRR(150, -52, 40, 8, 4, o.light || '#7cd4ff'); fillRR(-190, -52, 26, 8, 4, '#ff7a7a');
  for (const wx of [-110, 110]) { circle(wx, -12, 34, '#2a2f3d'); circle(wx, -12, 16, '#9aa7ba'); }
  if (o.inside) o.inside();
  ctx.restore()
}
/* 指点的手（从右下伸入） */
function hand(x, y, press = 0, sleeve = '#e8875f', rot = -.42) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const s = 1 - press * .06; ctx.scale(s, s);
  fillRR(-22, 18, 48, 330, 24, 'rgba(0,0,0,.16)'); fillRR(-58, 250, 170, 260, 26, sleeve);
  ctx.fillStyle = '#e9b892'; rr(-46, 96, 128, 170, 48); ctx.fill(); rr(14, 104, 32, 74, 16); ctx.fill(); rr(44, 112, 30, 66, 15); ctx.fill();
  ctx.save(); ctx.translate(-40, 170); ctx.rotate(.5); rr(-17, -10, 34, 96, 17); ctx.fill(); ctx.restore();
  fillRR(-17, 0, 34, 140, 17, '#f0c6a3'); fillRR(-9, 8, 18, 24, 9, 'rgba(255,255,255,.35)'); ctx.restore()
}
function tap(x, y, p) { if (p > .15) { ctx.strokeStyle = `rgba(255,255,255,${p * .8})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 20 + p * 24, 0, 7); ctx.stroke() } }
/* 从 a 移到 b 的路径插值（关键帧） */
function track(t, keys) { // keys: [[t,x,y],...]
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const k = ease(prog(t, keys[i - 1][0], keys[i][0])); return [lerp(keys[i - 1][1], keys[i][1], k), lerp(keys[i - 1][2], keys[i][2], k)] }
  const l = keys[keys.length - 1]; return [l[1], l[2]]
}
/* 平板/桌面大屏特写背景 */
function warmBokeh(t, top = '#f3e0c8', bot = '#e2c4a5', seed = 3) {
  ctx.fillStyle = vgrad(0, H, [top, bot]); ctx.fillRect(0, 0, W, H);
  const R = seeded(seed); for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H * .8, r = 60 + R() * 140; glow(x + Math.sin(t * .2 + i) * 10, y, r, '#fff0d7', .1 + R() * .12) }
}
function device(x, y, w, h, t, fn, stand = true) {
  if (stand) { ctx.fillStyle = '#232733'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 80, y + h + 16); ctx.lineTo(x + w / 2 + 80, y + h + 16); ctx.lineTo(x + w / 2 + 120, y + h + 58); ctx.lineTo(x + w / 2 - 120, y + h + 58); ctx.fill() }
  fillRR(x - 10, y + 24, w + 20, h + 20, 46, 'rgba(0,0,0,.18)'); fillRR(x - 16, y - 16, w + 32, h + 32, 44, '#1a1e29');
  ctx.save(); rr(x, y, w, h, 30); ctx.clip(); glass(x, y, w, h, 30);
  glow(x + w - 120, y + 60, 520, '#ffbe78', .16);
  fn(); const sh = ctx.createLinearGradient(x, y, x + w * .6, y + h); sh.addColorStop(0, 'rgba(255,255,255,.07)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
  ctx.restore()
}

/* 字幕与时间标签 */
const ROLE = { AI: ['AI 助手', '#3d8bff', '#dcefff'], ME: ['居住者', '#e8875f', '#fff1e8'] };
function subtitles(subs, t) {
  for (const s of subs) {
    if (t < s.a || t > s.b) continue; const al = win(t, s.a, s.b, .25);
    alpha(al, () => {
      const r = ROLE[s.who], w0 = tw(s.text, 44, 500), lw = r ? tw(r[0], 26, 600) + 36 : 0, total = w0 + (r ? lw + 18 : 0), x0 = W / 2 - total / 2 - 34, y0 = H - 124;
      fillRR(x0, y0, total + 68, 76, 38, 'rgba(8,12,24,.66)'); let x = x0 + 34;
      if (r) { fillRR(x, y0 + 19, lw, 38, 19, r[1]); txt(r[0], x + lw / 2, y0 + 47, 26, '#fff', 600, 'center'); x += lw + 18 }
      txt(s.text, x, y0 + 53, 44, r ? r[2] : '#ffffff', 500)
    })
  }
}
function chapterTag(time, title, a = 1) {
  alpha(a * .92, () => {
    const w = tw(time, 28, 700) + tw(title, 28, 500) + 82;
    fillRR(48, 44, w, 56, 28, 'rgba(12,18,34,.55)'); circle(80, 72, 8, '#ffcf9a');
    txt(time, 100, 82, 28, '#ffffff', 700); txt(title, 114 + tw(time, 28, 700), 82, 28, '#ffcf9a', 500)
  })
}
const SCENES = [];
const speaking = (subs, t, who = 'AI') => subs.some(s => s.who === who && t >= s.a && t <= s.b);
