/* 09:00 工作与创造：旅行记忆产品；原型/数据结构/方案；调整；写代码测试；体验修改；发布授权 */
(() => {
  const SUBS = [
    { a: 0.8, b: 6.6, text: '回到家中的工作空间，居住者打开一个旅行记忆产品的项目。' },
    { a: 8.6, b: 14.6, text: '居住者描述想法与目标，AI 生成界面原型、数据结构和实现方案。' },
    { a: 15.0, b: 19.8, text: '居住者调整功能顺序、视觉风格和交互细节。' },
    { a: 20.6, b: 27.4, text: 'AI 根据确认的方案编写代码、运行测试、检查错误，生成可操作的版本。' },
    { a: 28.4, b: 34.4, text: '居住者体验原型、提出修改意见，AI 修改后再次测试。' },
    { a: 35.4, b: 41.4, text: '涉及发布、购买或外部数据访问的操作，会先请求授权。' },
  ];
  const DUR = 44;
  function travelTree(cx, cy, s, t, lit = 1, hl = -1) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    limb(0, 0, 0, -120, undefined, undefined, '#8a6a52', 18);
    const B = [[-1, -60, -70, -110], [1, -80, 70, -140], [-1, -110, -60, -180], [1, -130, 50, -200], [0, -120, 0, -220]];
    B.forEach(([d, y0, x1, y1], i) => { limb(0, y0, x1 * .6, y1 + 20, x1, y1, '#8a6a52', 9); const on = i < lit * B.length; circle(x1, y1, 26, on ? (i === hl ? '#ffd66b' : ['#ff9f8a', '#7cc4ff', '#8ff0c4', '#c7a7ff', '#ffcf9a'][i]) : 'rgba(255,255,255,.12)'); if (i === hl) glow(x1, y1, 60, '#ffd66b', .5 + .3 * Math.sin(t * 6)) });
    ctx.restore()
  }
  function phone(x, y, w, h, fn) { fillRR(x - 8, y - 8, w + 16, h + 16, 30, '#0a0f18'); ctx.save(); rr(x, y, w, h, 24); ctx.clip(); ctx.fillStyle = '#f6f1e8'; ctx.fillRect(x, y, w, h); fn(); ctx.restore() }
  function room(t) {
    ctx.fillStyle = vgrad(0, 820, ['#ece8f2', '#e2dcea']); ctx.fillRect(0, 0, W, 820); ctx.fillStyle = '#b9a58e'; ctx.fillRect(0, 820, W, 260);
    // window light + shelf
    fillRR(1540, 120, 300, 420, 10, '#f8f3ea'); ctx.fillStyle = vgrad(130, 530, ['#9cc9ef', '#e6f2fa']); ctx.fillRect(1556, 136, 268, 388); tree(1700, 530, .9, t, '#86b882', '#6e9e6a');
    fillRR(120, 200, 360, 14, 4, '#9b7d62'); fillRR(120, 340, 360, 14, 4, '#9b7d62');
    ['#e07a5f', '#3d5a80', '#f2cc8f', '#81b29a', '#9a8c98'].forEach((c, i) => fillRR(140 + i * 34, 120 + (i % 2) * 8, 26, 80 - (i % 2) * 8, 4, c)); circle(400, 300, 30, '#81b29a'); fillRR(380, 300, 40, 40, 6, '#d9c1a3');
    // desk
    fillRR(700, 690, 860, 24, 6, '#c9a27e'); fillRR(730, 714, 20, 120, 4, '#9b7d62'); fillRR(1500, 714, 20, 120, 4, '#9b7d62');
    // monitor
    fillRR(1100, 640, 60, 50, 6, '#2a2f3d'); glass(780, 300, 700, 340, 18); ctx.strokeStyle = '#1a1e29'; ctx.lineWidth = 10; rr(780, 300, 700, 340, 18); ctx.stroke();
    ctx.save(); rr(780, 300, 700, 340, 18); ctx.clip(); txt('旅行记忆', 810, 350, 26, '#fff', 700); travelTree(1000, 600, .9, t, prog(t, 1, 5)); fillRR(1150, 340, 300, 20, 6, 'rgba(255,255,255,.15)'); for (let i = 0; i < 6; i++) fillRR(1150, 380 + i * 34, 300 - i * 30, 14, 6, 'rgba(255,255,255,.1)'); ctx.restore();
    // floating panels
    alpha(.85, () => { glass(560, 230, 200, 150, 14, 'rgba(14,26,44,.9)', 'rgba(22,49,79,.9)'); txt('需求草稿', 580, 270, 20, '#cfe3ff', 600); for (let i = 0; i < 4; i++) fillRR(580, 290 + i * 20, 150 - i * 20, 8, 4, 'rgba(255,255,255,.2)') });
    // chair + person
    fillRR(520, 560, 90, 230, 30, '#3d4a63'); fillRR(510, 770, 210, 30, 12, '#3d4a63'); line(610, 800, 610, 860, '#2a2f3d', 10);
    personSide(620, 770, 1.3, { pose: 'sit', lean: 10, armTo: [[34, -40], [80 + Math.sin(t * 9) * 4, -46]] });
    fillRR(820, 676, 220, 14, 5, '#e8ecf0');
  }
  function ui(t) {
    warmBokeh(t, '#ebe6f1', '#d8d0e2', 4);
    const X = 160, Y = 128, Wd = 1600, Hd = 800;
    device(X, Y, Wd, Hd, t, () => {
      // sidebar
      ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(X, Y, 300, Hd);
      txt('旅行记忆', X + 36, Y + 64, 30, '#fff', 700); txt('项目 · v0.' + (t > 26 ? 3 : 2), X + 36, Y + 100, 20, '#8fa9c8');
      ['需求草稿', '界面原型', '数据结构', '代码', '测试', '发布'].forEach((k, i) => { const act = [t < 14.5, t >= 14.5 && t < 20.4, false, t >= 20.4 && t < 24, t >= 24 && t < 35.2, t >= 35.2][i]; if (act) fillRR(X + 20, Y + 140 + i * 60, 260, 46, 12, 'rgba(124,196,255,.18)'); txt(k, X + 44, Y + 172 + i * 60, 24, act ? '#fff' : '#9fb6d4', act ? 600 : 400) });
      aiOrb(X + Wd - 70, Y + 56, 28, t, t > 8.6 && t < 27.4);
      const MX = X + 340, MY = Y + 120;
      if (t < 20.4) {
        txt(t < 14.5 ? 'AI 生成的方案' : '调整方案', MX, Y + 70, 32, '#fff', 700);
        // prototype
        const a1 = easeOut(prog(t, 9.0, 9.7)); card(MX, MY, 400, 640, a1); alpha(a1, () => {
          txt('界面原型', MX + 28, MY + 46, 22, '#8fa9c8', 600); pill(MX + 300, MY + 22, t > 17 ? 'B' : 'A', t > 17 ? '#c7a7ff' : '#3d8bff', '#fff', 20);
          const style = t > 17 ? ['#20253a', '#c7a7ff'] : ['#f6f1e8', '#e07a5f'];
          phone(MX + 90, MY + 80, 220, 440, () => { ctx.fillStyle = style[0]; ctx.fillRect(MX + 90, MY + 80, 220, 440); txt('我们的旅行树', MX + 110, MY + 120, 18, style[1], 700); travelTree(MX + 200, MY + 400, .75, t, prog(t, 9.6, 12)); for (let i = 0; i < 3; i++) photo(MX + 104 + i * 66, MY + 440, 56, 44, i + 2, 0, false) });
          if (t > 15) ['#e07a5f', '#c7a7ff', '#81b29a'].forEach((c, i) => { circle(MX + 130 + i * 70, MY + 590, 18, c); if ((t > 17 && i === 1) || (t <= 17 && i === 0)) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(MX + 130 + i * 70, MY + 590, 26, 0, 7); ctx.stroke() } })
        });
        // data
        const a2 = easeOut(prog(t, 10.2, 10.9)); card(MX + 430, MY, 400, 300, a2); alpha(a2, () => {
          txt('数据结构', MX + 458, MY + 46, 22, '#8fa9c8', 600);
          const box = (x, y, n, f) => { fillRR(x, y, 150, 90, 12, 'rgba(124,196,255,.15)'); txt(n, x + 16, y + 32, 22, '#fff', 700); txt(f, x + 16, y + 66, 16, '#9fb6d4') };
          line(MX + 610, MY + 120, MX + 680, MY + 120, '#7cc4ff', 3); line(MX + 535, MY + 165, MX + 535, MY + 195, '#7cc4ff', 3); line(MX + 755, MY + 165, MX + 755, MY + 195, '#7cc4ff', 3);
          box(MX + 460, MY + 76, '旅程 Trip', 'id · 日期 · 成员'); box(MX + 680, MY + 76, '地点 Place', '坐标 · 名称'); box(MX + 460, MY + 196, '照片 Photo', '时间 · 位置'); box(MX + 680, MY + 196, '枝干 Branch', '区域 · 点亮时间')
        });
        // plan
        const a3 = easeOut(prog(t, 11.4, 12.1)); card(MX + 430, MY + 330, 400, 310, a3); alpha(a3, () => {
          txt('实现方案', MX + 458, MY + 376, 22, '#8fa9c8', 600);
          ['Web 前端', '2D 树 → 3D 树', '照片云同步', '离线缓存'].forEach((k, i) => pill(MX + 458 + (i % 2) * 180, MY + 404 + Math.floor(i / 2) * 60, k, 'rgba(255,255,255,.1)', '#e6eef8', 22));
          txt('预计 3 个迭代', MX + 458, MY + 580, 22, '#8ff0c4', 500)
        });
        // feature order
        const a4 = easeOut(prog(t, 12.6, 13.3)); card(MX + 860, MY, 380, 640, a4); alpha(a4, () => {
          txt('功能顺序', MX + 888, MY + 46, 22, '#8fa9c8', 600);
          const items = ['照片导入', '旅行树', '地图足迹', '共享相册', '回忆短片'];
          const sw = ease(prog(t, 15.4, 16.6)); // 旅行树 moves to top
          items.forEach((k, i) => { let y = i; if (i === 1) y = lerp(1, 0, sw); if (i === 0) y = lerp(0, 1, sw); const yy = MY + 80 + y * 84; const drag = i === 1 && t > 15.2 && t < 16.8; fillRR(MX + 884 + (drag ? 10 : 0), yy, 330, 66, 14, drag ? 'rgba(255,214,107,.25)' : 'rgba(255,255,255,.07)'); txt('⋮⋮', MX + 906, yy + 42, 20, '#6f86a6', 700); txt(k, MX + 946, yy + 42, 24, '#fff', 500) });
          txt('交互细节', MX + 888, MY + 540, 22, '#8fa9c8', 600);
          const on = t > 18.4; fillRR(MX + 888, MY + 566, 70, 36, 18, on ? '#2fbf71' : 'rgba(255,255,255,.2)'); circle(MX + (on ? 940 : 906), MY + 584, 14, '#fff'); txt('点亮枝干时播放动画', MX + 972, MY + 592, 20, '#e6eef8')
        });
        // cursor
        if (t > 14.6 && t < 20) { const [cx, cy] = track(t, [[14.6, 1500, 700], [15.2, MX + 1000, MY + 210], [16.6, MX + 1000, MY + 130], [16.9, MX + 280, MY + 600], [17.4, MX + 270, MY + 590], [18, MX + 920, MY + 584], [19.6, MX + 920, MY + 584]]); cursor(cx, cy) }
      } else if (t < 35.2) {
        if (t < 28) {
          txt('编写代码 · 运行测试', MX, Y + 70, 32, '#fff', 700);
          card(MX, MY, 760, 640, 1); const code = ['class TravelTree {', '  lightBranch(region, visitedAt) {', '    const b = this.branches.get(region);', '    b.color = seasonColor(visitedAt);', '    b.glow = ease(daysSince(visitedAt));', '    this.emit("lit", b);', '  }', '  layout(trips) {', '    return trips.sort(byDate)', '      .map(toBranch);', '  }', '}'];
          const n = Math.floor(prog(t, 20.6, 24) * code.length * 1.0001);
          code.slice(0, n + 1).forEach((l, i) => { const shown = i < n ? l : l.slice(0, Math.floor(((prog(t, 20.6, 24) * code.length) % 1) * l.length)); ctx.font = `400 24px "Noto Sans Mono","DejaVu Sans Mono",monospace`; ctx.fillStyle = l.trim().startsWith('class') || l.includes('return') ? '#c7a7ff' : l.includes('(') ? '#9fd0ff' : '#e6eef8'; ctx.textAlign = 'left'; ctx.fillText(shown, MX + 40, MY + 60 + i * 42); txt(String(i + 1), MX + 22, MY + 60 + i * 42, 16, '#4f6684', 400, 'right') });
          card(MX + 790, MY, 450, 640, easeOut(prog(t, 23.6, 24.2)));
          alpha(easeOut(prog(t, 23.6, 24.2)), () => {
            txt('测试', MX + 820, MY + 50, 24, '#8fa9c8', 600);
            const run1 = prog(t, 24, 25.2), fixed = t > 26.3;
            fillRR(MX + 820, MY + 80, 390, 12, 6, 'rgba(255,255,255,.12)'); fillRR(MX + 820, MY + 80, 390 * (fixed ? prog(t, 26.3, 27) : run1), 12, 6, fixed ? '#2fbf71' : '#7cc4ff');
            txt(fixed ? `${Math.round(lerp(41, 42, prog(t, 26.6, 27)))}/42 通过` : `${Math.round(41 * run1)}/42 通过`, MX + 820, MY + 140, 30, '#fff', 700);
            if (t > 25.2) { const e = fixed ? 'rgba(47,191,113,.15)' : 'rgba(255,107,90,.18)'; fillRR(MX + 820, MY + 170, 390, 120, 14, e); txt(fixed ? '✓ 已修复' : '✗ 枝干颜色越界', MX + 844, MY + 214, 24, fixed ? '#57d68d' : '#ff8a7a', 700); txt(fixed ? 'seasonColor 加入范围限制' : 'seasonColor(12月) 返回空值', MX + 844, MY + 256, 20, '#d6e4f5') }
            if (t > 27) alpha(easeOut(prog(t, 27, 27.5)), () => { fillRR(MX + 820, MY + 520, 390, 80, 16, '#2fbf71'); txt('已生成可体验版本 v0.3', MX + 1015, MY + 572, 24, '#fff', 700, 'center') })
          })
        } else {
          txt('体验原型', MX, Y + 70, 32, '#fff', 700);
          phone(MX + 160, MY - 20, 320, 640, () => { ctx.fillStyle = '#f6f1e8'; ctx.fillRect(MX + 160, MY - 20, 320, 640); txt('我们的旅行树', MX + 190, MY + 30, 24, '#e07a5f', 700); travelTree(MX + 320, MY + 470, 1.2, t, 1, t > 29.2 ? 1 : -1); txt('2026 · 已点亮 5 个地区', MX + 190, MY + 590, 18, '#8a7b68') });
          tap(MX + 320 + 84, MY + 470 - 168, bump(t, 29, 29.5));
          alpha(easeOut(prog(t, 30.2, 30.7)), () => { fillRR(MX + 560, MY + 120, 380, 120, 16, '#ffe9a8'); txt('修改意见', MX + 584, MY + 160, 20, '#8a6a2f', 700); txt('点亮动画再慢一点、柔一点', MX + 584, MY + 204, 24, '#5a4520', 500) });
          alpha(easeOut(prog(t, 31.8, 32.3)), () => { card(MX + 560, MY + 280, 640, 260, 1); txt('AI 修改', MX + 588, MY + 326, 22, '#8fa9c8', 600); txt('glow 时长 0.4s → 1.2s，缓动改为 easeOutCubic', MX + 588, MY + 372, 22, '#e6eef8'); fillRR(MX + 588, MY + 400, 580 * prog(t, 32.4, 33.6), 10, 5, '#2fbf71'); if (t > 33.6) txt('✓ 重新测试 42/42 通过', MX + 588, MY + 460, 24, '#57d68d', 700) })
        }
      } else {
        txt('发布', MX, Y + 70, 32, '#fff', 700); phone(MX + 60, MY, 240, 480, () => { travelTree(MX + 180, MY + 380, .9, t, 1) });
        const a = easeOut(prog(t, 35.6, 36.2)); alpha(a, () => {
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X, Y, Wd, Hd);
          fillRR(MX + 300, MY + 60 + (1 - a) * 20, 640, 420, 26, '#f4f8ff');
          txt('需要你的授权', MX + 340, MY + 124, 34, '#16243a', 700);
          ['发布到测试渠道（旅行记忆 v0.3）', '购买：云存储 50 GB · ¥6/月', '外部数据：读取相册与定位'].forEach((k, i) => { circle(MX + 352, MY + 178 + i * 56, 6, '#3d8bff'); txt(k, MX + 372, MY + 186 + i * 56, 24, '#33445c') });
          const ok = t > 40.6; button(MX + 520, MY + 400, 220, ok ? '✓ 已授权' : '授权', ok ? '#2fbf71' : '#3d8bff', bump(t, 40.2, 40.6)); fillRR(MX + 660, MY + 372, 220, 56, 28, '#e1e9f5'); txt('暂不', MX + 770, MY + 410, 26, '#33445c', 600, 'center')
        });
        if (t > 38.4 && t < 42) { const [cx, cy] = track(t, [[38.4, MX + 1100, MY + 600], [40, MX + 540, MY + 410], [42, MX + 540, MY + 410]]); cursor(cx, cy) }
      }
    }, false)
  }
  function cursor(x, y) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0d1420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 34); ctx.lineTo(x + 9, y + 26); ctx.lineTo(x + 16, y + 40); ctx.lineTo(x + 22, y + 37); ctx.lineTo(x + 15, y + 23); ctx.lineTo(x + 26, y + 23); ctx.closePath(); ctx.fill(); ctx.stroke() }
  SCENES.push({
    time: '09:00', title: '工作与创造', dur: DUR, subs: SUBS, draw(t) {
      if (t < 8.6) { const z = ease(prog(t, 6, 8.6)); camera(lerp(1, 2.2, z), lerp(960, 1130, z), lerp(540, 470, z), () => room(t)) }
      if (t >= 8.0) alpha(ease(prog(t, 8.0, 8.6)), () => ui(t));
    }
  });
})();
