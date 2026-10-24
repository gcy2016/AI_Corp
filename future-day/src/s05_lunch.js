/* 12:00 午餐：餐厅与服务机器人；桌面菜单与语音点餐；庭院小坐 */
(() => {
  const SUBS = [
    { a: 0.8, b: 5.4, text: '中午，居住者来到附近的餐厅。' },
    { a: 6.0, b: 12.0, text: '机器人在厨房与餐桌之间往返，完成备餐、送餐和清洁。' },
    { a: 13.8, b: 19.2, text: '桌面显示菜单、食材来源、营养信息和预计出餐时间。' },
    { a: 19.8, b: 22.8, who: 'ME', text: '一份土豆牛腩饭，少辣。' },
    { a: 23.2, b: 26.4, who: 'AI', text: '好的，预计十二分钟出餐。' },
    { a: 28.2, b: 35.4, text: '用餐结束后，居住者在庭院里坐了一会儿，看着树木和来往的人群。' },
  ];
  const DUR = 38;
  const COLS = [{ shirt: '#81b29a', pants: '#3d405b', hair: '#5a3b2e' }, { shirt: '#f2cc8f', pants: '#5b6f9e', hair: '#1f1f2a' }, { shirt: '#9a8c98', pants: '#2f3e46', hair: '#7a4b3a' }, { shirt: '#3d5a80', pants: '#c9a27e', hair: '#2c2331' }, { shirt: '#e07a5f', pants: '#3b4a6b', hair: '#463033' }];
  function walkers(t, y, s, n, seed, x0 = -100, x1 = 2020) {
    const r = seeded(seed); for (let i = 0; i < n; i++) { const sp = 50 + r() * 50, d = r() < .5 ? 1 : -1, off = r() * 3000, c = COLS[Math.floor(r() * COLS.length)];
      const span = x1 - x0, x = d > 0 ? x0 + ((off + t * sp) % span) : x1 - ((off + t * sp) % span);
      personSide(x, y + r() * 10, s, { pose: 'walk', ph: t * 6 + i, dir: d, c }) }
  }
  function restaurant(t) {
    ctx.fillStyle = vgrad(0, 800, ['#f3e7d6', '#ead8c0']); ctx.fillRect(0, 0, W, 800);
    // big window with street
    ctx.save(); rr(80, 120, 1280, 470, 14); ctx.clip();
    ctx.fillStyle = vgrad(120, 590, ['#a8d2f0', '#e8f4fa']); ctx.fillRect(80, 120, 1280, 470);
    [[150, 260], [420, 320], [760, 230], [1050, 300]].forEach(([x, h]) => fillRR(x, 520 - h, 160, h + 20, 10, '#d6cfc4'));
    ctx.fillStyle = '#cfc8bd'; ctx.fillRect(80, 520, 1280, 70);
    for (let i = 0; i < 5; i++) tree(160 + i * 280, 540, .8, t + i, '#86b882', '#6e9e6a');
    walkers(t, 580, .6, 7, 61, 60, 1380);
    ctx.restore(); ctx.strokeStyle = '#f8f3ea'; ctx.lineWidth = 16; rr(80, 120, 1280, 470, 14); ctx.stroke(); [507, 933].forEach(x => line(x, 120, x, 590, '#f8f3ea', 12));
    // floor
    ctx.fillStyle = '#b48e6c'; ctx.fillRect(0, 800, W, 280); ctx.fillStyle = '#a7815f'; [840, 900, 990].forEach(y => ctx.fillRect(0, y, W, 4));
    // kitchen pass
    fillRR(1440, 260, 480, 540, 0, '#e6dccd'); fillRR(1440, 480, 480, 30, 4, '#8b9aa8'); fillRR(1470, 300, 420, 160, 10, '#3a4150'); glow(1680, 380, 200, '#ffb070', .4);
    txt('后厨', 1680, 250, 26, '#8a7b68', 600, 'center');
    // lamps
    [380, 820, 1200].forEach(x => { line(x, 0, x, 120, '#6d5a4a', 3); ctx.fillStyle = '#2f3e46'; ctx.beginPath(); ctx.moveTo(x - 40, 150); ctx.lineTo(x - 18, 120); ctx.lineTo(x + 18, 120); ctx.lineTo(x + 40, 150); ctx.fill(); glow(x, 160, 120, '#ffd9a0', .35) });
    // tables
    const table = (x) => { fillRR(x - 130, 700, 260, 16, 6, '#7a5b45'); fillRR(x - 8, 716, 16, 100, 4, '#6a4e3b'); fillRR(x - 60, 812, 120, 8, 4, '#6a4e3b') };
    const chair = (x, d) => { fillRR(x - 34 * d - 6, 690, 12, 80, 4, '#5a4434'); fillRR(x - 40, 760, 80, 12, 4, '#6a4e3b'); fillRR(x - 34, 772, 8, 44, 3, '#5a4434'); fillRR(x + 26, 772, 8, 44, 3, '#5a4434') };
    chair(330, 1); chair(640, -1); chair(880, 1);
    personSide(330, 760, 1.05, { pose: 'sit', c: COLS[1], arm: 1.3, legH: 52 }); table(480); personSide(640, 760, 1.05, { pose: 'sit', dir: -1, c: COLS[2], arm: 1.3, legH: 52 });
    personSide(880, 760, 1.05, { pose: 'sit', arm: 1.2, legH: 52 }); table(1040);
    fillRR(990, 690, 60, 10, 4, '#fff'); fillRR(450, 690, 70, 10, 4, '#fff');
    // robots
    const b1 = track(t, [[0, 1580, 0], [2, 1580, 0], [5, 1160, 0], [7.5, 1160, 0], [10.5, 1580, 0], [14, 1580, 0]]);
    serviceBot(b1[0], 820, 1.15, t, t < 6.2 || t > 14 ? '#e5533d' : null);
    if (t > 6.2) fillRR(1060, 676, 50, 18, 6, '#e5533d');
    const b2 = track(t, [[0, 300, 0], [6, 700, 0], [12, 300, 0]]); ctx.save(); ctx.translate(0, 0); serviceBot(b2[0], 840, .8, t, null); ctx.restore();
    alpha(.6, () => { for (let i = 0; i < 6; i++) circle(b2[0] - 30 + i * 12, 846 + Math.sin(t * 8 + i) * 2, 3, '#bfe6ff') });
    chip(1180, 370, '送餐', '3 号桌 · 已送达', '#8ff0c4', easeOut(prog(t, 5.2, 5.7)) * (1 - prog(t, 9, 9.4)));
    chip(260, 640, '清洁', '地面巡检中', '#7cc4ff', easeOut(prog(t, 7.6, 8.1)) * (1 - prog(t, 12, 12.4)));
  }
  const DISH = [['土豆牛腩饭', '¥32', '牛腩 · 本地牧场 18 km', '蛋白质 32 g · 640 kcal', '12 分钟', '#c8874a'], ['时蔬藜麦沙拉', '¥26', '蔬菜 · 社区农场 3 km', '膳食纤维 11 g · 380 kcal', '6 分钟', '#6fae5a'], ['菌菇豆腐汤', '¥18', '菌菇 · 山区合作社 40 km', '蛋白质 14 g · 210 kcal', '8 分钟', '#d7a46f']];
  function menu(t) {
    ctx.fillStyle = '#9a7556'; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.03)'; ctx.fillRect(0, i * 80, W, 40) }
    // dappled shadow
    for (let i = 0; i < 9; i++) { const r = seeded(70 + i); glow(r() * W + Math.sin(t * .6 + i) * 20, r() * H, 120 + r() * 100, '#3a2a1e', .18) }
    const X = 240, Y = 110, Wd = 1440, Hd = 780;
    ctx.save(); ctx.translate(0, 0); glass(X, Y, Wd, Hd, 30, '#122236', '#173252'); ctx.restore();
    ctx.save(); rr(X, Y, Wd, Hd, 30); ctx.clip();
    txt('今日菜单', X + 50, Y + 76, 38, '#fff', 700); txt('食材来源可追溯 · 营养按你今天的活动量推荐', X + 260, Y + 74, 22, '#8fa9c8');
    const listen = t > 19.6 && t < 22.9; aiOrb(X + Wd - 80, Y + 60, 30, t, listen || speaking(SUBS, t)); txt(listen ? '正在聆听…' : '语音点餐', X + Wd - 130, Y + 70, 22, '#cfe3ff', 500, 'right');
    const chosen = t > 22.4;
    DISH.forEach(([n, p, src, nu, tm, c], i) => {
      const y = Y + 130 + i * 196, a = easeOut(prog(t, 13.4 + i * .35, 14 + i * .35)), hl = chosen && i === 0;
      card(X + 40, y, Wd - 80, 172, a, hl, 22); alpha(a, () => {
        circle(X + 130, y + 86, 62, '#f7f3ec'); circle(X + 130, y + 86, 44, c); circle(X + 112, y + 72, 12, 'rgba(255,255,255,.35)');
        txt(n, X + 220, y + 66, 34, '#fff', 700); txt(p, X + 220, y + 116, 28, '#ffcf9a', 700);
        txt('来源', X + 560, y + 62, 20, '#8fa9c8', 600); txt(src, X + 560, y + 98, 24, '#e6eef8');
        txt('营养', X + 900, y + 62, 20, '#8fa9c8', 600); txt(nu, X + 900, y + 98, 24, '#e6eef8');
        txt('出餐', X + 1220, y + 62, 20, '#8fa9c8', 600); txt(tm, X + 1220, y + 104, 30, '#8ff0c4', 700);
        if (hl) { pill(X + 400, y + 94, '少辣', '#e8875f', '#fff', 20) }
      })
    });
    if (t > 23.2) alpha(easeOut(prog(t, 23.2, 23.7)), () => { fillRR(X + 40, Y + Hd - 90, Wd - 80, 60, 16, 'rgba(47,191,113,.2)'); check(X + 80, Y + Hd - 60, 24, '#57d68d'); txt('已下单 · 土豆牛腩饭（少辣） · 预计 12:14 送达', X + 110, Y + Hd - 50, 26, '#8ff0c4', 600); fillRR(X + 900, Y + Hd - 66, 460, 12, 6, 'rgba(255,255,255,.12)'); fillRR(X + 900, Y + Hd - 66, 460 * prog(t, 23.4, 40) * .4, 12, 6, '#57d68d') });
    ctx.restore();
  }
  function courtyard(t) {
    ctx.fillStyle = vgrad(0, 700, ['#9ccdf0', '#e2f1f8']); ctx.fillRect(0, 0, W, 700);
    ridge(0, W, 520, 30, .003, 2, '#c7d8c6', 700); fillRR(0, 380, 700, 340, 0, '#e7dccb'); for (let i = 0; i < 4; i++) fillRR(60 + i * 160, 440, 100, 140, 8, '#a9c9e3');
    ctx.fillStyle = '#8fbf7f'; ctx.fillRect(0, 690, W, 390); ctx.fillStyle = '#d9cdb8'; ctx.beginPath(); ctx.moveTo(0, 780); ctx.lineTo(W, 760); ctx.lineTo(W, 860); ctx.lineTo(0, 880); ctx.fill();
    tree(1300, 760, 2.4, t, '#6fa86a', '#5a9156'); tree(300, 720, 1.3, t + 1); tree(1820, 740, 1.5, t + 2);
    // falling leaves
    for (let i = 0; i < 8; i++) { const r = seeded(90 + i), a = (t * .08 + r()) % 1; ctx.save(); ctx.translate(1100 + r() * 400 + Math.sin(a * 12) * 30, 420 + a * 520); ctx.rotate(a * 8); ctx.fillStyle = '#9cc46a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 4, 0, 0, 7); ctx.fill(); ctx.restore() }
    // bench + person
    // 长椅正面：按路人的比例缩小（坐着的人约为站立行人的 3/4 高），人挡住身后的靠背
    const BX = 1260, BG = 798, BS = .58, BY = BG - 72 * BS, BW = 210;
    fillRR(BX - BW / 2 + 10, BY - 56, 8, 60, 3, '#6a4e3b'); fillRR(BX + BW / 2 - 18, BY - 56, 8, 60, 3, '#6a4e3b'); fillRR(BX - BW / 2, BY - 50, BW, 10, 4, '#8a6a52'); fillRR(BX - BW / 2, BY - 31, BW, 10, 4, '#8a6a52');
    fillRR(BX - BW / 2, BY - 3, BW, 12, 4, '#9a7a60'); fillRR(BX - BW / 2 + 12, BY + 9, 9, BG - BY - 9, 3, '#6a4e3b'); fillRR(BX + BW / 2 - 21, BY + 9, 9, BG - BY - 9, 3, '#6a4e3b');
    personSeated(BX, BY, BS, { legH: 72, bob: Math.sin(t * .8) * 1 });
    walkers(t, 840, .85, 5, 66);
    for (let i = 0; i < 7; i++) { const r = seeded(120 + i); glow(1050 + r() * 500 + Math.sin(t + i) * 10, 700 + r() * 140, 50, '#ffffff', .25) }
  }
  SCENES.push({
    time: '12:00', title: '午餐', dur: DUR, subs: SUBS, draw(t) {
      if (t < 13.6) camera(1.04 - .04 * prog(t, 0, 13), 960, 540, () => restaurant(t));
      if (t >= 13.0 && t < 28.0) alpha(t < 13.6 ? ease(prog(t, 13, 13.6)) : 1, () => menu(t));
      if (t >= 27.4) alpha(ease(prog(t, 27.4, 28)), () => camera(1 + .04 * prog(t, 27.4, 38), 1200, 600, () => courtyard(t)));
    }
  });
})();
