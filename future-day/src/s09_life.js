/* 18:00 日常生活：家庭面板（能源/库存/维护/明日）；选购保温水壶；制造配送；账户与公共服务额度；待决定事项 */
(() => {
  const SUBS = [
    { a: 0.8, b: 7.0, text: '傍晚回到家，家庭系统显示能源使用、食材库存、物品维护和明日安排。' },
    { a: 8.0, b: 12.4, text: '居住者在生活用品目录里，选了一只保温水壶。' },
    { a: 13.0, b: 18.6, text: 'AI 展示它的材料、设计、制造方式、交付时间和资源消耗。' },
    { a: 19.6, b: 24.6, text: '确认后，自动化制造与配送系统开始处理订单。' },
    { a: 26.0, b: 32.0, text: '居住者查看个人账户和公共服务额度，住房、医疗、交通都正常。' },
    { a: 33.0, b: 38.4, text: '需要本人决定的事项，系统会给出清晰的选项和相关信息。' },
  ];
  const DUR = 41;
  function bottle(x, y, s, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    fillRR(-50, -150, 100, 300, 40, col); ctx.fillStyle = 'rgba(255,255,255,.25)'; rr(-36, -130, 18, 250, 9); ctx.fill();
    fillRR(-38, -196, 76, 56, 14, '#c79f6a'); ctx.fillStyle = '#b58a55'; for (let i = 0; i < 4; i++) ctx.fillRect(-38, -186 + i * 12, 76, 3);
    fillRR(-50, 80 + Math.sin(rot) * 0, 100, 14, 0, 'rgba(0,0,0,.1)'); ctx.restore()
  }
  function living(t) {
    ctx.fillStyle = vgrad(0, 820, ['#f0dcc8', '#e4c9b0']); ctx.fillRect(0, 0, W, 820); ctx.fillStyle = '#9b7d62'; ctx.fillRect(0, 820, W, 260);
    // window sunset
    fillRR(1260, 110, 560, 560, 10, '#f8efe2'); ctx.fillStyle = vgrad(126, 654, ['#6a6aa8', '#f08a6a', '#ffcf8a']); ctx.fillRect(1276, 126, 528, 528); glow(1540, 560, 200, '#ffd08a', .8);
    [[1300, 260], [1400, 340], [1560, 220], [1690, 300]].forEach(([x, h]) => { fillRR(x, 654 - h, 80, h, 10, '#5c4a6e'); for (let y = 670 - h; y < 640; y += 30) fillRR(x + 20, y, 10, 10, 2, 'rgba(255,214,140,.8)') });
    line(1540, 126, 1540, 654, '#f8efe2', 12);
    // wall screen
    glass(220, 150, 900, 480, 24); ctx.strokeStyle = '#2a2f3d'; ctx.lineWidth = 12; rr(220, 150, 900, 480, 24); ctx.stroke(); ctx.save(); rr(220, 150, 900, 480, 24); ctx.clip(); dashboard(220, 150, .5625, t); ctx.restore();
    // sofa + person
    // 背面坐：人背对镜头看墙上的屏幕，沙发靠背挡在人前面
    personSeated(560, 790, 1.2, { back: true });
    fillRR(170, 752, 80, 88, 30, '#4f6286'); fillRR(910, 752, 80, 88, 30, '#4f6286'); fillRR(220, 738, 720, 102, 34, '#5b7096'); fillRR(1030, 760, 160, 14, 6, '#c9a27e'); fillRR(1100, 774, 16, 60, 4, '#9b7d62');
    circle(1120, 740, 18, '#ffffff'); glow(260, 120, 200, '#ffd9a0', .3);
  }
  // 家庭面板（按 1600x800 设计，s 为缩放）
  function dashboard(x, y, s, t, a0 = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    txt('家庭 · 今天', 50, 76, 38, '#fff', 700); txt('18:06 · 晴转多云', 300, 74, 24, '#8fa9c8');
    const cw = 360, ch = 600, Y = 120;
    const cards = [['能源', '#ffd66b'], ['食材库存', '#8ff0c4'], ['物品维护', '#7cc4ff'], ['明日安排', '#c7a7ff']];
    cards.forEach(([k, c], i) => { const X = 50 + i * (cw + 24), a = a0 ? easeOut(prog(t, a0 + i * .3, a0 + .6 + i * .3)) : 1; card(X, Y, cw, ch, a); alpha(a, () => { circle(X + 40, Y + 46, 9, c); txt(k, X + 60, Y + 56, 28, '#fff', 700);
      if (i === 0) { [[18.4, '#ffd66b', '发电'], [12.1, '#7cc4ff', '用电']].forEach(([v, cc, n], j) => { fillRR(X + 50 + j * 140, Y + 380 - v * 14, 90, v * 14, 12, cc); txt(v + ' kWh', X + 95 + j * 140, Y + 410, 22, '#fff', 600, 'center'); txt(n, X + 95 + j * 140, Y + 444, 22, '#9fb6d4', 500, 'center') }); txt('电池 86% · 余电并入社区', X + 32, Y + 520, 22, '#8ff0c4', 500) }
      if (i === 1) [['鸡蛋', '6 个', 0], ['番茄', '1 个', 1], ['面粉', '1.2 kg', 0], ['小葱', '1 把', 1], ['牛奶', '0.5 L', 0]].forEach(([n, v, low], j) => { txt(n, X + 32, Y + 130 + j * 80, 26, '#e6eef8'); txt(v, X + cw - 32, Y + 130 + j * 80, 26, low ? '#ffb35a' : '#fff', 600, 'right'); if (low) txt('已加入补货', X + cw - 32, Y + 158 + j * 80, 18, '#ffb35a', 400, 'right') });
      if (i === 2) [['空气滤网', '剩余 12 天', .2], ['洗碗机', '状态良好', .9], ['热水器', '下月保养', .6], ['扫地机', '电量 78%', .78]].forEach(([n, v, p], j) => { txt(n, X + 32, Y + 130 + j * 110, 26, '#e6eef8'); txt(v, X + 32, Y + 166 + j * 110, 22, '#9fb6d4'); fillRR(X + 200, Y + 150 + j * 110, 128, 10, 5, 'rgba(255,255,255,.12)'); fillRR(X + 200, Y + 150 + j * 110, 128 * p, 10, 5, p < .3 ? '#ffb35a' : '#7cc4ff') });
      if (i === 3) [['09:00', '烹饪课'], ['14:00', '天文学模拟'], ['19:30', '社区读书会']].forEach(([h, n], j) => { txt(h, X + 32, Y + 140 + j * 110, 30, '#c7a7ff', 700); txt(n, X + 32, Y + 180 + j * 110, 26, '#fff') });
    }) });
    ctx.restore()
  }
  function screen(t) {
    warmBokeh(t, '#efd9c4', '#ddbfa4', 12);
    const X = 160, Y = 128, Wd = 1600, Hd = 800;
    device(X, Y, Wd, Hd, t, () => {
      if (t < 8.4) { dashboard(X, Y, 1, t, 6.4); return }
      aiOrb(X + Wd - 70, Y + 56, 26, t, false);
      if (t < 13) {
        txt('生活用品', X + 50, Y + 76, 38, '#fff', 700); txt('本地微工厂制造 · 可回收设计', X + 260, Y + 74, 22, '#8fa9c8');
        const items = ['保温水壶', '徒步背包', '台灯', '陶瓷杯', '雨伞', '收纳盒', '坐垫', '眼罩'];
        items.forEach((n, i) => { const cx = X + 50 + (i % 4) * 380, cy = Y + 120 + Math.floor(i / 4) * 330, a = easeOut(prog(t, 8.4 + i * .1, 8.9 + i * .1)), sel = i === 0 && t > 10.8; card(cx, cy, 360, 310, a, sel); alpha(a, () => { if (i === 0) bottle(cx + 180, cy + 150, .55, '#4f7f86'); else { circle(cx + 180, cy + 130, 70, ['#e07a5f', '#f2cc8f', '#81b29a', '#3d5a80', '#9a8c98', '#c7a7ff', '#7cc4ff'][i - 1]); } txt(n, cx + 30, cy + 280, 26, '#fff', 600) }) });
        if (t > 9.6) { const [hx, hy] = track(t, [[9.6, 1950, 1250], [10.6, X + 260, Y + 300], [12.4, X + 260, Y + 300], [13, 2000, 1300]]); tap(X + 230, Y + 270, bump(t, 10.6, 11)); hand(hx, hy, bump(t, 10.6, 11)) }
      } else if (t < 25.6) {
        txt('保温水壶', X + 50, Y + 76, 38, '#fff', 700); txt('500 ml', X + 230, Y + 74, 24, '#8fa9c8');
        const ci = t > 15.6 ? 1 : 0, cols = ['#4f7f86', '#e07a5f', '#f2cc8f'];
        glow(X + 330, Y + 420, 260, '#7cc4ff', .15); bottle(X + 330, Y + 440, 1.2, cols[ci]);
        cols.forEach((c, i) => { circle(X + 250 + i * 80, Y + 740, 22, c); if (i === ci) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X + 250 + i * 80, Y + 740, 30, 0, 7); ctx.stroke() } });
        if (t < 19.6) {
          [['材料', '再生铝壶身 · 竹木盖 · 食品级硅胶圈', '#7cc4ff'], ['设计', '3 种配色 · 单手开合 · 保温 12 小时', '#c7a7ff'], ['制造方式', '本地微工厂 · 旋压成型 · 无涂层', '#8ff0c4'], ['交付时间', '明天 10:00 · 无人机送达', '#ffd66b'], ['资源消耗', '0.9 kg CO₂e · 可回收 96%', '#ff9f8a']].forEach(([k, v, c], i) => alpha(easeOut(prog(t, 13.2 + i * .6, 13.8 + i * .6)), () => { const yy = Y + 150 + i * 110; fillRR(X + 680, yy, 860, 92, 18, 'rgba(255,255,255,.06)'); circle(X + 716, yy + 46, 9, c); txt(k, X + 744, yy + 56, 26, c, 700); txt(v, X + 900, yy + 56, 28, '#fff') }));
          alpha(prog(t, 16.4, 17), () => button(X + 1400, Y + 730, 240, '确认下单', '#3d8bff', bump(t, 19, 19.4)));
        } else {
          txt('订单处理中', X + 680, Y + 170, 32, '#fff', 700);
          const st = [['下单', 19.8], ['微工厂制造', 20.8], ['质检', 22.6], ['无人机配送', 23.6]];
          st.forEach(([n, a], i) => { const on = t > a, yy = Y + 250 + i * 120; circle(X + 710, yy, 22, on ? '#2fbf71' : 'rgba(255,255,255,.15)'); if (on) check(X + 710, yy, 22, '#fff', prog(t, a, a + .4)); if (i < 3) line(X + 710, yy + 26, X + 710, yy + 94, on ? '#2fbf71' : 'rgba(255,255,255,.15)', 4); txt(n, X + 760, yy + 10, 30, on ? '#fff' : '#8fa9c8', 600) });
          // factory mini anim
          alpha(prog(t, 20.8, 21.2), () => { fillRR(X + 1100, Y + 300, 380, 200, 18, 'rgba(255,255,255,.05)'); const h = prog(t, 20.8, 22.6); fillRR(X + 1270, Y + 470 - 140 * h, 40, 140 * h, 10, cols[ci]); line(X + 1200, Y + 330, X + 1290, Y + 460 - 140 * h, '#cfd6e0', 8); circle(X + 1290, Y + 460 - 140 * h, 8, '#ffb35a'); txt('旋压成型 ' + Math.round(h * 100) + '%', X + 1130, Y + 480, 22, '#9fb6d4') });
          alpha(prog(t, 23.6, 24), () => { const p = prog(t, 23.6, 25.6); ctx.setLineDash([10, 8]); ctx.strokeStyle = '#9fd0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X + 1120, Y + 640); ctx.quadraticCurveTo(X + 1300, Y + 540, X + 1480, Y + 640); ctx.stroke(); ctx.setLineDash([]); const dx = lerp(X + 1120, X + 1480, p), dy = Y + 640 - Math.sin(p * Math.PI) * 50; fillRR(dx - 24, dy - 8, 48, 14, 6, '#e6eef8'); line(dx - 30, dy - 12, dx - 14, dy - 12, '#9fb6d4', 3); line(dx + 14, dy - 12, dx + 30, dy - 12, '#9fb6d4', 3); txt('明天 10:00 送达', X + 1300, Y + 700, 22, '#ffd66b', 600, 'center') });
        }
      } else {
        txt('个人账户', X + 50, Y + 76, 38, '#fff', 700); txt('公共服务额度 · 本月', X + 230, Y + 74, 24, '#8fa9c8');
        const S = [['住房', '正常', '社区租住 · 已覆盖', 1, '#8ff0c4'], ['医疗', '正常', '本月已用 1 次 · 下周二检查已预约', .85, '#7cc4ff'], ['交通', '正常', '额度剩余 78%', .78, '#ffd66b'], ['教育', '正常', '课程额度剩余 12 节', .6, '#c7a7ff']];
        S.forEach(([k, s2, d, p, c], i) => { const a = easeOut(prog(t, 26 + i * .4, 26.6 + i * .4)), yy = Y + 130 + i * 112; card(X + 50, yy, 760, 96, a); alpha(a, () => { circle(X + 96, yy + 48, 22, rgba(c, .25)); check(X + 96, yy + 48, 20, c); txt(k, X + 136, yy + 58, 30, '#fff', 700); txt(d, X + 230, yy + 58, 22, '#9fb6d4'); txt(s2, X + 780, yy + 58, 24, c, 600, 'right') }) });
        alpha(easeOut(prog(t, 33, 33.6)), () => {
          fillRR(X + 860, Y + 130, 690, 560, 24, 'rgba(255,179,90,.12)'); rr(X + 860, Y + 130, 690, 560, 24); ctx.strokeStyle = 'rgba(255,179,90,.6)'; ctx.lineWidth = 2; ctx.stroke();
          txt('需要你决定', X + 900, Y + 190, 30, '#ffcf9a', 700); txt('社区花园地块是否续期？', X + 900, Y + 250, 32, '#fff', 700);
          ['当前地块：南区 12 号 · 6 ㎡', '本季收成：番茄、小葱、香草', '续期一季占用公共额度 3%', '截止日期：本周日'].forEach((s, i) => txt('· ' + s, X + 900, Y + 310 + i * 46, 24, '#e6eef8'));
          ['续期一季', '暂不续期', '了解详情'].forEach((s, i) => button(X + 1000 + i * 210, Y + 620, 190, s, i === 0 ? '#3d8bff' : 'outline'))
        })
      }
    }, false)
  }
  SCENES.push({
    time: '18:00', title: '日常生活', dur: DUR, subs: SUBS, draw(t) {
      if (t < 6.8) { const z = ease(prog(t, 4.4, 6.8)); camera(lerp(1, 1.9, z), lerp(960, 670, z), lerp(540, 390, z), () => living(t)) }
      if (t >= 6.2) alpha(ease(prog(t, 6.2, 6.8)), () => screen(t));
    }
  });
})();
