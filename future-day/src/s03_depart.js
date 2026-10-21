/* 08:00 出发：自动驾驶车辆到达；交通系统协同；车内与 AI 规划日本一个月 */
(() => {
  const SUBS = [
    { a: 1.0, b: 6.4, text: '居住者决定前往山谷，楼下的自动驾驶车辆准时抵达。' },
    { a: 10.2, b: 16.2, text: '交通系统实时协调周边车辆与信号灯，动态调整路线。' },
    { a: 20.6, b: 25.4, text: '车内可以休息、阅读、听音乐，也可以与 AI 对话。' },
    { a: 26.0, b: 29.0, who: 'ME', text: '我想去日本住一个月。' },
    { a: 29.4, b: 35.6, who: 'AI', text: '按时间、兴趣和预算整理了三个方案。证件和签证需要您本人确认。' },
    { a: 36.4, b: 41.4, text: '乘客选定一个方案，相关预订在授权后自动办理。' },
  ];
  const DUR = 43;
  const R = seeded(31);
  const blocks = [...Array(60)].map(() => ({ c: R(), h: R() }));

  function street(t) {
    ctx.fillStyle = vgrad(0, 760, ['#8ec3ef', '#d8ecf7']); ctx.fillRect(0, 0, W, 760);
    ridge(0, W, 520, 30, .004, 1, '#b9cfe0', 760);
    [[900, 380, 90], [1060, 300, 70], [1260, 420, 110], [1480, 260, 80], [1700, 360, 120]].forEach(([x, h, w]) => { fillRR(x, 760 - h, w, h + 10, 18, '#c6d6e6'); for (let y = 760 - h + 30; y < 740; y += 36) fillRR(x + 14, y, w - 28, 10, 4, '#b1c5d9') });
    // apartment
    fillRR(-20, 80, 720, 700, 0, '#efe6da'); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { fillRR(40 + c * 165, 120 + r * 150, 120, 100, 8, '#9fc4e3'); fillRR(40 + c * 165, 210 + r * 150, 120, 8, 2, '#d8cfc2') }
    fillRR(260, 600, 220, 170, 10, '#6f8aa6'); glass(276, 616, 188, 154, 6, '#9fc4e3', '#c7def0'); line(370, 616, 370, 770, '#6f8aa6', 6);
    txt('7 栋', 370, 588, 26, '#8a7b68', 600, 'center');
    tree(80, 770, .9, t); tree(640, 770, .8, t + 2);
    // sidewalk + road
    ctx.fillStyle = '#d9d4cc'; ctx.fillRect(0, 760, W, 70); ctx.fillStyle = '#5d6573'; ctx.fillRect(0, 830, W, 250);
    ctx.fillStyle = '#e8e8e8'; for (let x = -((t * 0) % 200); x < W; x += 200) ctx.fillRect(x, 950, 110, 8);
    fillRR(0, 826, W, 8, 2, '#b8b2a8');
    // lamp
    line(820, 770, 820, 520, '#59606d', 8); line(820, 520, 870, 510, '#59606d', 6); fillRR(860, 505, 40, 10, 5, '#ffe9b5');
    // car
    const arrive = easeOut(prog(t, .8, 4.6)), leave = Math.pow(prog(t, 9.0, 11), 2);
    const cx = lerp(2300, 1200, arrive) - leave * 1600, door = ease(prog(t, 5.0, 5.9)) * (1 - ease(prog(t, 8.2, 8.9)));
    // person
    const pw = track(t, [[0, 420, 0], [.6, 420, 0], [3.2, 900, 0], [5.6, 900, 0], [7.4, 1150, 0]])[0];
    const walking = (t > .6 && t < 3.2) || (t > 5.6 && t < 7.4);
    const pin = 1 - prog(t, 7.4, 8.0);
    pod(cx, 905, 1.0, { door, col: '#f4f6fa' });
    if (pin > 0) alpha(pin, () => personSide(pw, 800, 1.15, { pose: walking ? 'walk' : 'stand', ph: t * 7 }));
    chip(cx - 170, 640, '目的地', '山谷 · 预计 40 分钟', '#8ff0c4', easeOut(prog(t, 5.2, 5.8)) * (1 - prog(t, 8.6, 9)));
    alpha(easeOut(prog(t, 1.4, 2)) * (1 - prog(t, 4.6, 5)), () => chip(1350, 600, '车辆', '准时到达 08:00', '#7cc4ff', 1));
  }
  // 城市路网俯视
  const GX = [180, 420, 660, 900, 1140, 1380, 1620, 1820], GY = [140, 330, 520, 710, 900];
  const ROUTE = [[180, 900], [660, 900], [660, 710], [1140, 710], [1140, 330], [1620, 330], [1620, 140], [1820, 140]];
  const ALT = [[1140, 710], [1380, 710], [1380, 330], [1620, 330]];
  function polyAt(P, p) { let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(l); L += l } let d = p * L; for (let i = 1; i < P.length; i++) { if (d <= seg[i - 1]) { const k = d / seg[i - 1]; return [lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k)] } d -= seg[i - 1] } return P[P.length - 1] }
  function drawPoly(P, p, col, w, dash) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(...P[0]); let L = 0; const ls = []; for (let i = 1; i < P.length; i++) { ls.push(Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); L += ls[i - 1] } let d = p * L; for (let i = 1; i < P.length; i++) { if (d >= ls[i - 1]) { ctx.lineTo(...P[i]); d -= ls[i - 1] } else { const k = d / ls[i - 1]; ctx.lineTo(lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k)); break } } ctx.stroke(); ctx.setLineDash([]) }
  function map(t) {
    ctx.fillStyle = '#0d1a2b'; ctx.fillRect(0, 0, W, H);
    let k = 0; for (let i = 0; i < GX.length - 1; i++) for (let j = 0; j < GY.length - 1; j++) { const b = blocks[k++]; fillRR(GX[i] + 22, GY[j] + 22, GX[i + 1] - GX[i] - 44, GY[j + 1] - GY[j] - 44, 12, b.c < .2 ? '#14352a' : '#13243a'); if (b.h > .5) fillRR(GX[i] + 50, GY[j] + 50, 60, 60, 8, '#1a3050') }
    GX.forEach(x => line(x, 60, x, 1000, '#24405f', 18, 'butt')); GY.forEach(y => line(60, y, 1880, y, '#24405f', 18, 'butt'));
    const jam = prog(t, 13, 13.6); if (jam > 0) alpha(jam, () => { line(1140, 710, 1140, 330, '#ff6b5a', 14, 'butt'); pill(1160, 500, '前方拥堵', '#ff6b5a', '#fff', 22) });
    const rp = ease(prog(t, 9.6, 11.2));
    const useAlt = t > 14.2;
    drawPoly(ROUTE, rp, useAlt ? 'rgba(124,196,255,.25)' : '#7cc4ff', 8);
    if (useAlt) drawPoly(ALT, ease(prog(t, 14.2, 15.2)), '#8ff0c4', 10);
    // other cars
    for (let i = 0; i < 26; i++) { const r = seeded(100 + i); const horiz = r() < .5; const lane = horiz ? GY[Math.floor(r() * GY.length)] + (r() < .5 ? -5 : 5) : GX[Math.floor(r() * GX.length)] + (r() < .5 ? -5 : 5); const sp = (r() * .06 + .03) * (r() < .5 ? 1 : -1); const p = ((r() + t * sp) % 1 + 1) % 1; const [x, y] = horiz ? [60 + p * 1820, lane] : [lane, 60 + p * 940]; circle(x, y, 6, '#d6e2f0') }
    // signals
    [[660, 900], [660, 710], [1140, 710], [1380, 710], [1380, 330], [1620, 330]].forEach(([x, y], i) => { const g = t > 10.5 + i * .9; circle(x + 22, y - 22, 9, g ? '#57d68d' : '#ff6b5a'); glow(x + 22, y - 22, 26, g ? '#57d68d' : '#ff6b5a', .5) });
    // our car
    const P = useAlt ? [...ROUTE.slice(0, 3), [1140, 710], ...ALT.slice(1), ...ROUTE.slice(5)] : ROUTE;
    const cp = useAlt ? lerp(.36, .62, prog(t, 14.2, 20.5)) : lerp(0, .36, prog(t, 9.6, 14.2));
    const [x, y] = polyAt(useAlt ? [...ROUTE.slice(0, 3), [1140, 710], [1380, 710], [1380, 330], [1620, 330], [1620, 140], [1820, 140]] : ROUTE, cp);
    glow(x, y, 60, '#7cc4ff', .6); circle(x, y, 14, '#ffffff'); circle(x, y, 8, '#3d8bff');
    pin(1820, 140, '山谷', '#2fbf71');
    // HUD
    glass(60, 130, 470, 300, 22, 'rgba(10,20,36,.9)', 'rgba(18,40,66,.9)');
    txt('交通协同中', 96, 188, 32, '#fff', 700); aiOrb(470, 174, 22, t, false);
    [['周边车辆', Math.round(lerp(96, 128, prog(t, 10, 13))) + ' 辆'], ['信号灯优先', Math.min(6, Math.floor(prog(t, 10.5, 16) * 7)) + ' 处'], ['预计到达', t > 15 ? '08:36' : '08:40']].forEach(([k, v], i) => { txt(k, 96, 250 + i * 56, 26, '#8fa9c8', 500); txt(v, 490, 250 + i * 56, 28, i === 2 && t > 15 ? '#8ff0c4' : '#fff', 600, 'right') });
    chip(1180, 760, '路线', '已动态调整 · 节省 4 分钟', '#8ff0c4', easeOut(prog(t, 15.2, 15.8)));
  }
  function pin(x, y, label, col) { circle(x, y, 16, col); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); txt(label, x, y - 28, 24, '#fff', 600, 'center') }
  // 车内（侧视）——供 16:00 学习场景复用
  function carInterior(t, o = {}) {
    const dusk = o.dusk || 0, speed = o.speed || 260;
    ctx.fillStyle = mix('#e9edf2', '#3a3550', dusk * .7); ctx.fillRect(0, 0, W, H);
    // window
    ctx.save(); rr(90, 150, 1000, 470, 60); ctx.clip();
    ctx.fillStyle = vgrad(150, 620, dusk ? ['#3b3f7a', '#e88a6a', '#ffc58a'] : ['#8ec3ef', '#e0f0f8']); ctx.fillRect(90, 150, 1000, 470);
    if (dusk) glow(820, 520, 260, '#ffb070', .7);
    const off = t * speed;
    ridge(90 - 400, 1490, 470, 40, .006, off * .0004 * 50, dusk ? '#6b5a8a' : '#a9bfd6', 700);
    for (let i = 0; i < 9; i++) { const x = ((i * 190 - off * .5) % 1710 + 1710) % 1710 - 200; fillRR(x, 400 - (i % 3) * 60, 90, 300, 14, dusk ? '#5a4a72' : '#bccbdc') }
    ctx.fillStyle = dusk ? '#4c4566' : '#86b882'; ctx.fillRect(90, 560, 1000, 60);
    for (let i = 0; i < 12; i++) { const x = ((i * 140 - off) % 1680 + 1680) % 1680 - 200; tree(x, 600, .55, t, dusk ? '#5b5f7a' : '#7fb07a', dusk ? '#4b4f68' : '#6a9a66') }
    ctx.restore();
    ctx.strokeStyle = mix('#d7dde5', '#2a2640', dusk * .7); ctx.lineWidth = 16; rr(90, 150, 1000, 470, 60); ctx.stroke();
    // floor + seat
    ctx.fillStyle = mix('#d5dbe3', '#2c2a3e', dusk * .7); ctx.fillRect(0, 860, W, 220);
    fillRR(380, 520, 120, 330, 40, mix('#c9b79f', '#6a5a52', dusk * .5)); fillRR(380, 760, 380, 100, 30, mix('#d8c6ae', '#6a5a52', dusk * .5));
    personSide(520, 760, 1.25, { pose: 'sit', lean: 6, armTo: o.armTo, arm: .9 });
    // screen
    glass(1140, 200, 680, 520, 30); ctx.strokeStyle = '#1a1e29'; ctx.lineWidth = 14; rr(1140, 200, 680, 520, 30); ctx.stroke();
    ctx.save(); rr(1140, 200, 680, 520, 30); ctx.clip(); if (o.screen) o.screen(1140, 200, 680, 520); ctx.restore();
  }
  window.carInterior = carInterior;
  const PLANS = [['京都 · 町屋长住', '¥ 2.8 万', '寺院 · 庭园 · 料理课', '#ff9f8a'], ['札幌 · 公寓', '¥ 2.4 万', '温泉 · 徒步 · 市场', '#7cc4ff'], ['福冈 · 海边', '¥ 2.1 万', '海岸 · 屋台 · 慢生活', '#8ff0c4']];
  function planScreen(t) {
    return (x, y, w, h) => {
      txt(t < 25.8 ? '车内模式' : '日本 · 一个月', x + 40, y + 64, 34, '#fff', 700);
      aiOrb(x + w - 60, y + 54, 26, t, speaking(SUBS, t) || speaking(SUBS, t, 'ME'));
      if (t < 25.8) {
        [['休息', '#c7a7ff'], ['阅读', '#ffd66b'], ['音乐', '#8ff0c4'], ['对话', '#7cc4ff']].forEach(([k, c], i) => alpha(easeOut(prog(t, 20.4 + i * .3, 21 + i * .3)), () => { const cx = x + 110 + i * 155, cy = y + 230; circle(cx, cy, 52, rgba(c, .2)); circle(cx, cy, 22, c); txt(k, cx, cy + 96, 28, '#fff', 500, 'center') }));
        alpha(prog(t, 22, 22.6), () => { txt('正在播放 · 晨间钢琴', x + 40, y + 420, 24, '#9fb6d4'); fillRR(x + 40, y + 440, w - 80, 8, 4, 'rgba(255,255,255,.12)'); fillRR(x + 40, y + 440, (w - 80) * ((t - 20) / 30), 8, 4, '#8ff0c4') });
      } else {
        txt('时间 30 天 · 兴趣 文化/自然/美食 · 预算 ¥3 万内', x + 40, y + 104, 20, '#8fa9c8');
        const sel = t > 37 ? 0 : -1;
        PLANS.forEach(([n, p, d, c], i) => { const a = easeOut(prog(t, 29.6 + i * .4, 30.2 + i * .4)); card(x + 30 + i * 210, y + 130, 196, 230, a, sel === i, 20); alpha(a, () => { fillRR(x + 46 + i * 210, y + 146, 164, 70, 12, rgba(c, .35)); photo(x + 60 + i * 210, y + 152, 136, 58, 10 + i, 0, false); txt(n, x + 46 + i * 210, y + 254, 22, '#fff', 700); txt(p, x + 46 + i * 210, y + 292, 26, c, 700); txt(d, x + 46 + i * 210, y + 330, 18, '#9fb6d4') }) });
        alpha(easeOut(prog(t, 32.6, 33.2)), () => { rr(x + 30, y + 384, w - 60, 52, 14); ctx.strokeStyle = '#ffcf9a'; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); txt('需本人确认：护照有效期 · 签证材料', x + 54, y + 418, 22, '#ffcf9a', 600) });
        if (t > 37.4) ['机票', '住宿', '交通卡', '日语课'].forEach((k, i) => alpha(easeOut(prog(t, 37.6 + i * .5, 38 + i * .5)), () => { const bx = x + 30 + i * 158; fillRR(bx, y + 452, 146, 50, 14, 'rgba(47,191,113,.2)'); check(bx + 28, y + 476, 22, '#57d68d', prog(t, 37.6 + i * .5, 38.1 + i * .5)); txt(k, bx + 52, y + 486, 22, '#fff', 600) }));
      }
    }
  }
  SCENES.push({
    time: '08:00', title: '出发', dur: DUR, subs: SUBS, draw(t) {
      if (t < 10.1) camera(1.04 - .04 * prog(t, 0, 10), 960, 540, () => street(t));
      if (t >= 9.5 && t < 20.6) alpha(t < 10.1 ? ease(prog(t, 9.5, 10.1)) : 1, () => camera(1 + .03 * prog(t, 9.5, 20.5), 960, 540, () => map(t)));
      if (t >= 20.0) alpha(ease(prog(t, 20.0, 20.6)), () => {
        const tp = bump(t, 36.4, 37.6), reach = ease(prog(t, 35.8, 36.8)) * (1 - ease(prog(t, 38.2, 39.2)));
        camera(1.08, 960, 500, () => carInterior(t, { screen: planScreen(t), armTo: reach > 0 ? [[30, -40 - reach * 6], [lerp(44, 120, reach), lerp(-8, -84, reach)]] : undefined }));
      });
    }
  });
})();
