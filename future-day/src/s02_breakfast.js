/* 07:00 早餐：机械臂取材→清洗→切配→烹饪→摆盘；餐桌营养信息；描述记忆中的家常菜；自动收纳 */
(() => {
  const SUBS = [
    { a: 1.0, b: 6.6, text: '七点，机械臂从冰箱取出食材，完成清洗、切配、烹饪和摆盘。' },
    { a: 15.6, b: 20.4, text: '桌面屏幕显示食物的成分与营养信息。' },
    { a: 21.0, b: 27.4, text: '居住者描述一道记忆中的家常菜：食材、味道、颜色，还有模糊的做法。' },
    { a: 27.9, b: 32.6, who: 'ME', text: '外婆做的葱油饼，金黄酥脆，好像最后还刷了一层油。' },
    { a: 33.1, b: 38.6, who: 'AI', text: '找到了授权的家庭食谱和老照片，已生成做法，开始制作。' },
    { a: 39.8, b: 44.6, text: '早餐结束后，餐具自动清洗收纳，厨房恢复整洁。' },
  ];
  const DUR = 46;
  const R = seeded(21), steam = [...Array(14)].map(() => ({ x: R(), p: R(), s: R() }));
  const EFF = [[0, 560, 300], [1.0, 560, 300], [2.6, 205, 452], [3.4, 205, 452], [5.0, 660, 520], [7.0, 660, 520], [8.2, 1010, 568], [8.5, 1010, 540], [10.1, 1010, 540], [10.5, 1010, 570], [11.9, 1372, 548], [13.0, 1372, 548], [14.0, 1688, 556]];
  const BASE = [[0, 640, 0], [1, 640, 0], [2.6, 430, 0], [5, 640, 0], [8.2, 960, 0], [11.9, 1290, 0], [14, 1560, 0]];
  const CLEAN = [[39, 1560, 300], [40.2, 1300, 585], [41, 700, 585], [41.8, 1250, 585], [42.6, 760, 585], [43.6, 1000, 330]];
  const CBASE = [[39, 1560, 0], [40.2, 1300, 0], [41, 760, 0], [41.8, 1200, 0], [42.6, 800, 0], [43.6, 1000, 0]];

  function tomato(x, y, r = 18) { circle(x, y, r, '#e5533d'); circle(x - r * .3, y - r * .3, r * .3, 'rgba(255,255,255,.35)'); fillRR(x - 4, y - r - 4, 8, 7, 3, '#4f8a4a') }
  function kitchen(t, clean) {
    ctx.fillStyle = vgrad(0, 860, ['#eef1ea', '#e3e8e0']); ctx.fillRect(0, 0, W, 860);
    ctx.fillStyle = '#c9b49a'; ctx.fillRect(0, 860, W, 220); ctx.fillStyle = '#bba387'; [900, 960, 1040].forEach(y => ctx.fillRect(0, y, W, 4));
    // window light
    ctx.fillStyle = 'rgba(255,220,170,.25)'; ctx.beginPath(); ctx.moveTo(1780, 0); ctx.lineTo(1920, 0); ctx.lineTo(1920, 600); ctx.lineTo(1500, 860); ctx.lineTo(1200, 860); ctx.closePath(); ctx.fill();
    // rail
    fillRR(250, 44, 1620, 18, 9, '#b7c1cc'); fillRR(250, 20, 1620, 10, 5, '#d5dde5');
    // upper cabinets
    for (let x = 720; x < 1660; x += 240) { fillRR(x, 110, 228, 210, 8, '#f6f7f3'); fillRR(x + 196, 190, 8, 50, 4, '#c3c9cf') }
    // backsplash
    ctx.fillStyle = '#dfe9ec'; ctx.fillRect(360, 380, 1460, 220); ctx.strokeStyle = '#cfdde2'; ctx.lineWidth = 2;
    for (let x = 360; x < 1820; x += 60) { ctx.beginPath(); ctx.moveTo(x, 380); ctx.lineTo(x, 600); ctx.stroke() } for (let y = 410; y < 600; y += 30) { ctx.beginPath(); ctx.moveTo(360, y); ctx.lineTo(1820, y); ctx.stroke() }
    // counter
    fillRR(340, 596, 1500, 22, 4, '#8b9aa8'); ctx.fillStyle = '#e8ecef'; ctx.fillRect(350, 618, 1480, 242);
    ctx.strokeStyle = '#cfd6dc'; ctx.lineWidth = 3; for (let x = 350; x < 1830; x += 246) ctx.strokeRect(x + 8, 632, 230, 214);
    // dishwasher panel
    const dw = clean ? ease(prog(t, 39.6, 40.2)) * (1 - ease(prog(t, 41.2, 41.8))) : 0;
    fillRR(1338, 632 + dw * 30, 230, 214, 6, mix('#e8ecef', '#d8dfe5', dw)); circle(1540, 650, 6, clean && t > 41.8 ? '#57d68d' : '#9aa7ba');
    if (clean && t > 41.8) txt('清洗中', 1450, 700, 24, '#4a9e6e', 600, 'center');
    // fridge
    const door = clean ? 0 : ease(prog(t, 1.0, 2.2)) * (1 - ease(prog(t, 4.6, 5.6)));
    fillRR(70, 110, 270, 750, 16, '#f4f6f8'); ctx.fillStyle = '#e4eef3'; ctx.fillRect(84, 124, 242, 722);
    [300, 430, 560, 700].forEach(y => fillRR(84, y, 242, 8, 2, '#cfdbe2'));
    glow(205, 300, 200, '#dff3ff', .6 * door);
    if (t < 3.2 || clean) { tomato(180, 412); tomato(230, 414) } else tomato(230, 414);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#fff8ea'; ctx.beginPath(); ctx.ellipse(130 + i * 34, 540, 13, 17, 0, 0, 7); ctx.fill() }
    fillRR(240, 500, 50, 60, 6, '#ffffff'); fillRR(240, 500, 50, 16, 4, '#7cc4ff'); ctx.fillStyle = '#6fae5a'; ctx.beginPath(); ctx.ellipse(170, 680, 60, 18, 0, 0, 7); ctx.fill();
    fillRR(70, 110, lerp(270, 26, door), 750, 16, '#f9fafb'); if (door < .5) { fillRR(300 - door * 200, 300, 10, 160, 5, '#c3c9cf'); line(84, 470, 326 - door * 240, 470, '#e6eaee', 3) }
    // sink + faucet
    fillRR(560, 592, 200, 10, 3, '#6d7b88'); ctx.strokeStyle = '#aab4bf'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(740, 596); ctx.lineTo(740, 470); ctx.quadraticCurveTo(740, 430, 690, 440); ctx.lineTo(680, 460); ctx.stroke();
    const water = clean ? 0 : prog(t, 5.0, 5.3) * (1 - prog(t, 6.9, 7.2));
    if (water > 0) { ctx.fillStyle = `rgba(150,210,255,${.7 * water})`; ctx.fillRect(672, 466, 14, 128); for (let i = 0; i < 10; i++) { const a = (t * 3 + i * .37) % 1; circle(660 + Math.sin(i * 7) * 40 * a, 520 + a * 70 - a * a * 40, 4, `rgba(170,220,255,${water * (1 - a)})`) } }
    // board
    fillRR(900, 584, 230, 14, 6, '#d7a46f');
    // stove + pan
    fillRR(1240, 592, 270, 8, 3, '#2a2f3d'); const heat = clean ? 0 : prog(t, 10.8, 11.5) * (1 - prog(t, 14.5, 15));
    if (heat > 0) { ctx.fillStyle = `rgba(255,120,60,${.6 * heat})`; ctx.fillRect(1280, 592, 190, 5) }
    fillRR(1300, 560, 150, 32, 12, '#3a4150'); fillRR(1440, 566, 120, 12, 6, '#2a2f3d');
    if (!clean && t > 1 && t < 13.9) { fillRR(1318, 552, 112, 12, 6, '#ffd35a'); if (t > 11.9) { for (let i = 0; i < 4; i++) circle(1335 + i * 26 + Math.sin(t * 6 + i) * 3, 553, 9, '#e5533d') } }
    if (heat > 0) steam.forEach(s => { const a = (t * .5 + s.p) % 1; circle(1320 + s.x * 110 + Math.sin(a * 8 + s.s * 6) * 12, 540 - a * 180, 10 + a * 24, `rgba(255,255,255,${.35 * heat * (1 - a)})`) });
    // plate
    const plated = !clean && t > 13.9;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(1690, 590, 90, 12, 0, 0, 7); ctx.fill(); fillRR(1640, 592, 100, 6, 3, '#e3e6ea');
    if (plated) { ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.ellipse(1690, 578, 58, 14, 0, Math.PI, 0); ctx.fill(); for (let i = 0; i < 4; i++) circle(1660 + i * 20, 570, 8, '#e5533d'); circle(1700, 563, 4, '#6fae5a') }
    // board contents
    if (!clean && t > 8.3 && t < 10.5) { const n = Math.floor(prog(t, 8.6, 10.0) * 5); if (n < 1) tomato(1010, 566); else for (let i = 0; i < n + 1; i++) { fillRR(985 + i * 14, 560, 10, 24, 5, '#e5533d') } }
    // arm
    const C = clean ? CLEAN : EFF, B = clean ? CBASE : BASE; let [ex, ey] = track(t, C);
    if (!clean && t > 5 && t < 7) ex += Math.sin(t * 20) * 6;
    if (!clean && t > 8.5 && t < 10.1) ey = 540 + Math.abs(Math.sin(t * 9)) * 26;
    if (!clean && t > 11.9 && t < 13) ex += Math.sin(t * 8) * 30;
    const bx = track(t, B)[0];
    fillRR(bx - 46, 50, 92, 30, 10, '#9aa7ba');
    const grip = !clean && ((t > 3.2 && t < 8.3) || (t > 8.5 && t < 11.9)) ? .1 : .7;
    const [hx, hy] = robotArm(bx, 78, ex, ey, 260, 250, { grip, flip: ex < bx });
    if (!clean) {
      if (t > 3.2 && t < 8.3) tomato(hx + 26, hy + 18, 17);
      if (t > 8.5 && t < 10.15) { fillRR(hx + 10, hy + 6, 12, 20, 3, '#333'); ctx.fillStyle = '#d6dde5'; ctx.beginPath(); ctx.moveTo(hx + 12, hy + 26); ctx.lineTo(hx + 26, hy + 26); ctx.lineTo(hx + 22, hy + 70); ctx.closePath(); ctx.fill() }
      if (t > 10.5 && t < 11.9) for (let i = 0; i < 3; i++) fillRR(hx + 14 + i * 10, hy + 14, 8, 18, 4, '#e5533d');
    } else {
      if (t > 40 && t < 43) fillRR(hx + 10, hy + 6, 44, 18, 6, '#7cc4ff');
      if (t > 40.6) for (let i = 0; i < 6; i++) { const a = prog(t, 40.6 + i * .3, 41.6 + i * .3); const sx = 600 + i * 160, sy = 570; if (a > 0 && a < 1) { ctx.save(); ctx.globalAlpha = bump(a, 0, 1); ctx.translate(sx, sy - a * 30); ctx.rotate(a * 3); fillRR(-2, -12, 4, 24, 2, '#fff'); fillRR(-12, -2, 24, 4, 2, '#fff'); ctx.restore() } }
      // plates flying into dishwasher
      for (let i = 0; i < 3; i++) { const a = ease(prog(t, 39.6 + i * .25, 40.6 + i * .25)); if (a < 1) { const x = lerp(1690, 1450, a), y = lerp(586 - i * 8, 720, a); ctx.globalAlpha = 1 - a * .8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, 70 - a * 30, 10, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1 } }
    }
  }
  function dining(t) {
    ctx.fillStyle = vgrad(0, H, ['#f4e6d4', '#ead6bf']); ctx.fillRect(0, 0, W, H);
    // window
    fillRR(1260, 90, 520, 520, 10, '#f8f3ea'); ctx.fillStyle = vgrad(100, 600, ['#9cc9ef', '#ffe2bd']); ctx.fillRect(1276, 106, 488, 488);
    tree(1420, 600, 1.4, t, '#7fb07a', '#6a9a66'); tree(1660, 610, 1.1, t + 1, '#86b882', '#6e9e6a'); line(1520, 106, 1520, 594, '#f8f3ea', 12);
    ctx.fillStyle = 'rgba(255,220,170,.22)'; ctx.beginPath(); ctx.moveTo(1276, 106); ctx.lineTo(1764, 106); ctx.lineTo(1300, 1080); ctx.lineTo(600, 1080); ctx.closePath(); ctx.fill();
    // lamp
    line(760, 0, 760, 170, '#6d5a4a', 3); ctx.fillStyle = '#e8b06a'; ctx.beginPath(); ctx.moveTo(700, 220); ctx.quadraticCurveTo(760, 140, 820, 220); ctx.closePath(); ctx.fill(); glow(760, 230, 160, '#ffd9a0', .4);
    // chair back
    fillRR(640, 470, 240, 300, 40, '#b98a65');
    personFront(760, 700, 1.6, { bob: Math.sin(t * 1.4) * 2 });
    // eating arm
    const e = bump((t - 14.5) % 3.2, 0.6, 2.6);
    // 手臂从肩膀长出（两段 IK，肘部向外下方弯）
    const hx = lerp(850, 796, e), hy = lerp(770, 600, e), sx = 812, sy = 664 + Math.sin(t * 1.4) * 2, l1 = 80, l2 = 125;
    const dx = hx - sx, dy = hy - sy, d = clamp(Math.hypot(dx, dy), l2 - l1 + 1, l1 + l2 - 1), a0 = Math.atan2(dy, dx), da = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
    const ang = Math.cos(a0 + da) > Math.cos(a0 - da) ? a0 + da : a0 - da; // 取肘部朝外（右侧）的解
    const elx = sx + Math.cos(ang) * l1, ely = sy + Math.sin(ang) * l1;
    limb(sx, sy, elx, ely, hx, hy, ME.shirt, 26); circle(hx, hy, 14, ME.skin); line(hx, hy, hx - 40, hy - 10 + e * 20, '#c0c6cf', 5);
    // table
    ctx.fillStyle = '#c79f7b'; ctx.fillRect(0, 760, W, 320); ctx.fillStyle = '#d7b08c'; ctx.fillRect(0, 760, W, 26);
    // table screen strip
    glass(380, 800, 1160, 120, 18, '#14253b', '#1c3a5c'); alpha(.9, () => { txt('今日早餐 · 番茄炒蛋 · 小米粥 · 凉拌菠菜', 420, 868, 28, '#d6e4f5', 500); [[0, '#ffd66b'], [1, '#7cc4ff'], [2, '#8ff0c4'], [3, '#ff9f8a']].forEach(([i, c]) => fillRR(420 + i * 270, 900, 250 * clamp(prog(t, 15 + i * .3, 16.5 + i * .3)), 10, 5, c)) });
    // plate & bowl
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(700, 800, 130, 26, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.ellipse(700, 792, 80, 16, 0, Math.PI, 0); ctx.fill(); for (let i = 0; i < 4; i++) circle(660 + i * 26, 786, 9, '#e5533d');
    ctx.fillStyle = '#f2f2ee'; ctx.beginPath(); ctx.moveTo(900, 770); ctx.quadraticCurveTo(960, 840, 1020, 770); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f7d48a'; ctx.beginPath(); ctx.ellipse(960, 772, 60, 9, 0, 0, 7); ctx.fill();
    // nutrition hologram
    const a = easeOut(prog(t, 15.4, 16.2));
    alpha(a, () => {
      const x = 1180, y = 150 + (1 - a) * 20; glass(x, y, 620, 560, 28, 'rgba(14,26,44,.92)', 'rgba(22,49,79,.92)');
      txt('营养信息', x + 40, y + 70, 36, '#fff', 700); txt('按你的近期活动量推荐', x + 40, y + 112, 24, '#8fa9c8');
      const items = [['热量', '520', 'kcal', .62, '#ffd66b'], ['蛋白质', '26', 'g', .7, '#7cc4ff'], ['碳水', '58', 'g', .55, '#8ff0c4'], ['脂肪', '18', 'g', .4, '#ff9f8a']];
      items.forEach(([k, v, u, p, c], i) => { const cx = x + 100 + i * 140, cy = y + 230; ring(cx, cy, 52, p * ease(prog(t, 16 + i * .25, 17.4 + i * .25)), c, 12); txt(v, cx, cy + 10, 30, '#fff', 700, 'center'); txt(k + ' ' + u, cx, cy + 90, 22, '#9fb6d4', 500, 'center') });
      txt('主要成分', x + 40, y + 380, 24, '#8fa9c8', 500);
      ['番茄 · 维生素C', '鸡蛋 · 优质蛋白', '小米 · 膳食纤维', '菠菜 · 铁、叶酸'].forEach((s, i) => alpha(prog(t, 17.5 + i * .3, 18 + i * .3), () => pill(x + 40 + (i % 2) * 280, y + 400 + Math.floor(i / 2) * 56, s, 'rgba(255,255,255,.1)', '#e6eef8', 22)));
    })
  }
  function memoryUI(t) {
    warmBokeh(t, '#efe3d2', '#dcc6ac', 8); ctx.fillStyle = '#bfc7cf'; ctx.fillRect(0, 930, W, 150);
    const X = 250, Y = 100, Wd = 1420, Hd = 780;
    device(X, Y, Wd, Hd, t, () => {
      txt('记忆中的家常菜', X + 50, Y + 80, 40, '#fff', 700);
      const listen = t > 27.9 && t < 32.6; alpha(listen ? 1 : .5, () => { aiOrb(X + Wd - 90, Y + 70, 36, t, listen || speaking(SUBS, t)); txt(listen ? '正在聆听…' : 'AI 助手', X + Wd - 140, Y + 80, 24, '#cfe3ff', 500, 'right') });
      // col 1 description tags
      card(X + 40, Y + 130, 420, 600, 1); txt('你的描述', X + 70, Y + 180, 26, '#8fa9c8', 600);
      const tags = [['食材', '面粉 · 小葱 · 油', 28.6], ['味道', '咸香 · 酥脆', 29.6], ['颜色', '金黄', 30.4], ['做法', '最后刷一层油？', 31.2]];
      tags.forEach(([k, v, a], i) => alpha(easeOut(prog(t, a, a + .5)), () => { const y = Y + 230 + i * 110; txt(k, X + 70, y, 24, '#9fb6d4', 600); rr(X + 70, y + 14, 360, 56, 14); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fill(); if (i === 3) { ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ffcf9a'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]) } txt(v, X + 90, y + 52, 28, i === 3 ? '#ffcf9a' : '#fff', 500) }));
      // col 2 family archive
      const a2 = easeOut(prog(t, 33.2, 33.8)); card(X + 500, Y + 130, 420, 600, a2); alpha(a2, () => {
        txt('家庭资料', X + 530, Y + 180, 26, '#8fa9c8', 600); pill(X + 760, Y + 154, '已授权', '#2fbf71', '#fff', 20);
        ctx.save(); ctx.filter = 'sepia(.8) saturate(.7)'; photo(X + 540, Y + 220, 160, 120, 5, -.05); photo(X + 730, Y + 230, 150, 110, 6, .06); ctx.restore();
        ctx.save(); ctx.translate(X + 710, Y + 520); ctx.rotate(-.03); fillRR(-170, -130, 340, 250, 6, '#f6ecd6');
        txt('外婆的葱油饼', -140, -86, 26, '#6b4a2f', 700); for (let i = 0; i < 6; i++) { ctx.strokeStyle = '#a8865f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-140, -50 + i * 30); for (let x = -140; x < 140 - (i % 3) * 30; x += 10) ctx.lineTo(x, -50 + i * 30 + Math.sin(x * .3 + i) * 2); ctx.stroke() }
        txt('1998', 120, 100, 20, '#a8865f', 500, 'right'); ctx.restore();
        const sc = prog(t, 34, 35.5); if (sc > 0 && sc < 1) { ctx.fillStyle = 'rgba(124,196,255,.35)'; ctx.fillRect(X + 520, Y + 200 + sc * 520, 380, 6) }
      });
      // col 3 recipe
      const a3 = easeOut(prog(t, 35.2, 35.8)); card(X + 960, Y + 130, 420, 600, a3, t > 35.2); alpha(a3, () => {
        txt('生成的做法', X + 990, Y + 180, 26, '#8fa9c8', 600);
        ['温水和面，醒 20 分钟', '擀薄，刷油撒葱花和盐', '卷起盘圆，再擀成饼', '中小火两面煎至金黄', '出锅前刷一层葱油'].forEach((s, i) => alpha(easeOut(prog(t, 35.6 + i * .35, 36 + i * .35)), () => { const y = Y + 240 + i * 74; circle(X + 1006, y - 9, 16, i === 4 ? '#ffcf9a' : '#3d8bff'); txt(String(i + 1), X + 1006, y, 20, '#fff', 700, 'center'); txt(s, X + 1036, y, 26, '#fff', 400) }));
        const pg = prog(t, 37.5, 46); fillRR(X + 990, Y + 650, 360, 14, 7, 'rgba(255,255,255,.12)'); fillRR(X + 990, Y + 650, 360 * pg * .5, 14, 7, '#2fbf71');
        txt('厨房制作中 · 预计 25 分钟', X + 990, Y + 700, 24, '#8ff0c4', 500)
      });
      // arrows
      [[X + 470, 33.4], [X + 930, 35.1]].forEach(([ax, a]) => alpha(prog(t, a, a + .4), () => { line(ax, Y + 430, ax + 20, Y + 430, '#9fd0ff', 4); ctx.fillStyle = '#9fd0ff'; ctx.beginPath(); ctx.moveTo(ax + 26, Y + 430); ctx.lineTo(ax + 14, Y + 420); ctx.lineTo(ax + 14, Y + 440); ctx.fill() }))
    })
  }
  SCENES.push({
    time: '07:00', title: '早餐', dur: DUR, subs: SUBS, draw(t) {
      if (t < 15.2) camera(1 + .03 * prog(t, 0, 15), 960, 540, () => kitchen(t, false));
      if (t >= 14.6 && t < 27.8) alpha(t < 15.2 ? ease(prog(t, 14.6, 15.2)) : 1, () => camera(1.02 - .02 * prog(t, 14.6, 27.6), 960, 540, () => dining(t)));
      if (t >= 27.2 && t < 39.6) alpha(t < 27.8 ? ease(prog(t, 27.2, 27.8)) : 1, () => memoryUI(t));
      if (t >= 39.0) alpha(t < 39.6 ? ease(prog(t, 39.0, 39.6)) : 1, () => { kitchen(t, true); if (t > 43) chip(1250, 440, '厨房', '已整理完毕', '#8ff0c4', easeOut(prog(t, 43, 43.5))) });
    }
  });
})();
