/* 19:00 与朋友共进晚餐：朋友到来；机械臂烹饪、灯光晚餐模式；围坐聊天；照片投影立体场景；按时间地点排列；一起收拾 */
(() => {
  const SUBS = [
    { a: 0.8, b: 5.4, text: '晚上七点，几位朋友来到家中。' },
    { a: 6.6, b: 12.4, text: '机械臂完成切配和烹饪，餐桌灯光调整为适合晚餐的亮度。' },
    { a: 13.6, b: 19.2, text: '大家围坐在一起，聊旅行、电影、兴趣和最近遇到的事。' },
    { a: 20.4, b: 26.6, text: '有人展示白天拍的照片，桌面把它们投影成可旋转的立体场景。' },
    { a: 27.6, b: 33.2, text: '其他人补充各自的记忆，系统按时间和地点排列影像。' },
    { a: 34.6, b: 39.6, text: '晚餐后，大家一起收拾桌面，继续聊天。' },
  ];
  const DUR = 42;
  const FR = [{ shirt: '#81b29a', hair: '#5a3b2e', pants: '#3d405b' }, { shirt: '#f2cc8f', hair: '#1f1f2a', pants: '#5b6f9e' }, { shirt: '#9a8c98', hair: '#7a4b3a', pants: '#2f3e46' }, { shirt: '#3d5a80', hair: '#2c2331', pants: '#c9a27e' }];
  function room(t, lamp) {
    ctx.fillStyle = vgrad(0, 800, ['#4a3f55', '#5e4c5c']); ctx.fillRect(0, 0, W, 800); ctx.fillStyle = '#5a4434'; ctx.fillRect(0, 800, W, 280);
    // window night
    fillRR(120, 120, 460, 440, 10, '#3a3045'); ctx.fillStyle = vgrad(130, 550, ['#1b1d44', '#3b3366']); ctx.fillRect(134, 134, 432, 412);
    [[150, 200], [250, 280], [360, 180], [460, 300]].forEach(([x, h]) => { fillRR(x, 546 - h, 80, h, 8, '#2a2848'); for (let y = 560 - h; y < 530; y += 26) for (let k = 0; k < 2; k++) if ((x + y + k) % 3) fillRR(x + 16 + k * 30, y, 12, 10, 2, 'rgba(255,214,140,.85)') });
    circle(500, 190, 22, '#f4f1dc');
    // lamp glow
    glow(960, 260, 700, '#ffc98a', .18 + .3 * lamp); line(960, 0, 960, 210, '#2a2230', 3); ctx.fillStyle = '#e8b06a'; ctx.beginPath(); ctx.moveTo(880, 260); ctx.quadraticCurveTo(960, 170, 1040, 260); ctx.closePath(); ctx.fill(); glow(960, 280, 260, '#ffd9a0', .3 + .4 * lamp);
  }
  function arrival(t) {
    room(t, .3);
    // door
    const open = ease(prog(t, .2, 1.2));
    fillRR(1400, 260, 260, 560, 8, '#2a2230'); ctx.fillStyle = vgrad(260, 820, ['#ffe2b0', '#f2c58a']); ctx.fillRect(1410, 270, 240, 550); fillRR(1410, 270, 240 * (1 - open * .85), 550, 6, '#7a5b45');
    for (let i = 0; i < 3; i++) { const x = track(t, [[0, 1560 + i * 50, 0], [1 + i * .5, 1560, 0], [4.5 + i * .5, 1220 - i * 160, 0]])[0]; const w = t > 1 + i * .5 && t < 4.5 + i * .5; if (t > .8 + i * .5) personSide(x, 830, 1.15, { pose: w ? 'walk' : 'stand', ph: t * 6.5, dir: -1, c: FR[i], arm: t > 5 ? -2.2 + Math.sin(t * 6) * .3 : undefined }) }
    personSide(560, 830, 1.15, { pose: 'stand', arm: t > 2.5 && t < 6 ? -2.4 + Math.sin(t * 7) * .3 : undefined });
  }
  function kitchenTable(t) {
    const lamp = ease(prog(t, 8.4, 10.2)); room(t, lamp);
    // kitchen (right)
    fillRR(1260, 520, 640, 30, 4, '#8b9aa8'); ctx.fillStyle = '#d8d0c6'; ctx.fillRect(1270, 550, 620, 270); glow(1580, 470, 220, '#ff9a5a', .25);
    fillRR(1460, 494, 150, 28, 10, '#3a4150'); for (let i = 0; i < 6; i++) { const a = (t * .5 + i * .17) % 1; circle(1490 + i * 18 + Math.sin(a * 9) * 8, 480 - a * 140, 8 + a * 16, `rgba(255,255,255,${.3 * (1 - a)})`) }
    const [ex, ey] = [1530 + Math.sin(t * 3) * 40, 460 + Math.abs(Math.sin(t * 6)) * 10]; fillRR(1480, 40, 120, 16, 8, '#9aa7ba'); robotArm(1540, 56, ex, ey, 230, 220, { grip: .2 });
    for (let i = 0; i < 5; i++) fillRR(1300 + i * 26, 496, 18, 22, 4, ['#e5533d', '#6fae5a', '#ffd35a', '#e5533d', '#6fae5a'][i]);
    // table (side)
    fillRR(420, 640, 700, 22, 8, '#7a5b45'); fillRR(460, 662, 18, 160, 4, '#6a4e3b'); fillRR(1062, 662, 18, 160, 4, '#6a4e3b');
    [520, 680, 840, 1000].forEach((x, i) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, 636, 50, 8, 0, 0, 7); ctx.fill(); if (t > 11 - i * .3) { ctx.fillStyle = ['#e5533d', '#d7a46f', '#6fae5a', '#ffd35a'][i]; ctx.beginPath(); ctx.ellipse(x, 630, 30, 8, 0, Math.PI, 0); ctx.fill() } });
    chip(560, 420, '灯光', `晚餐模式 · ${Math.round(lerp(4000, 2700, lamp))}K · ${Math.round(lerp(100, 60, lamp))}%`, '#ffd27a', easeOut(prog(t, 8.2, 8.8)), 960, 270);
    chip(1250, 300, '厨房', '4 道菜 · 2 道已完成', '#8ff0c4', easeOut(prog(t, 7.2, 7.8)));
  }
  function frontTable(t, after) {
    room(t, 1);
    const people = [[420, FR[0], 0], [700, FR[1], 1], [960, null, 0], [1220, FR[2], 1], [1500, FR[3], 0]];
    const talker = Math.floor(t / 1.6) % 5;
    people.forEach(([x, c, long], i) => { const bob = i === talker && !after ? Math.sin(t * 9) * 3 : 0; personFront(x, 660, 1.5, { c: c || undefined, long: !!long, bob, wave: i === talker && !after ? .5 + Math.sin(t * 5) * .5 : 0 }) });
    // table
    ctx.fillStyle = '#7a5b45'; ctx.fillRect(0, 700, W, 380); ctx.fillStyle = '#8a6a52'; ctx.fillRect(0, 700, W, 30);
    glass(260, 760, 1400, 150, 20, '#1a2236', '#24304a'); alpha(.8, () => { txt('今晚 · 5 人', 300, 820, 26, '#cfe3ff', 700); txt('番茄牛腩 · 葱油饼 · 清炒时蔬 · 菌菇汤', 300, 866, 24, '#9fb6d4'); });
    if (!after) [420, 700, 960, 1220, 1500].forEach((x, i) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, 724, 70, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = ['#e5533d', '#d7a46f', '#6fae5a', '#ffd35a', '#e5533d'][i]; ctx.beginPath(); ctx.ellipse(x, 718, 40, 9, 0, Math.PI, 0); ctx.fill() });
    // speech topics
    if (t < 20) { const icons = ['✈', '🎬', '♪', '☕', '⛰']; const labels = ['旅行', '电影', '音乐', '最近的事', '徒步'];
      [[420, 0], [700, 1], [960, 2], [1220, 3], [1500, 4]].forEach(([x, k], i) => { if (i !== talker) return; const a = win((t % 1.6) / 1.6, 0, 1, .2); alpha(a, () => { fillRR(x - 70, 330, 140, 60, 30, 'rgba(255,255,255,.92)'); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.moveTo(x - 10, 388); ctx.lineTo(x, 410); ctx.lineTo(x + 12, 388); ctx.fill(); txt(labels[k], x, 370, 26, '#4a3f55', 700, 'center') }) }) }
  }
  function holo(t) {
    frontTable(t, false);
    const a = easeOut(prog(t, 21, 22)); if (a <= 0) return;
    // phone raised by friend at 700
    // hologram above table centre
    alpha(a, () => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const cx = 960, cy = 420, th = (t - 21) * .5;
      const P = (x, y, z) => { const xr = x * Math.cos(th) - z * Math.sin(th), zr = x * Math.sin(th) + z * Math.cos(th); return [cx + xr, cy - y + zr * .35] };
      ctx.fillStyle = 'rgba(124,196,255,.12)'; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const an = i / 40 * Math.PI * 2; const [x, y] = P(Math.cos(an) * 330, -80, Math.sin(an) * 330); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.fill();
      ctx.fillStyle = 'rgba(80,160,230,.35)'; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const an = i / 40 * Math.PI * 2; const [x, y] = P(Math.cos(an) * 140 + 60, -78, Math.sin(an) * 80); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.fill();
      ctx.strokeStyle = 'rgba(150,215,255,.7)'; ctx.lineWidth = 2;
      [[-200, -60, 150], [-60, -150, 220], [120, 140, 170], [-260, 120, 110]].forEach(([x, z, h]) => { const b = [[x - 90, z], [x + 90, z], [x, z + 70]]; const top = P(x, -80 + h, z + 20); b.forEach(([bx, bz]) => { ctx.beginPath(); ctx.moveTo(...P(bx, -80, bz)); ctx.lineTo(...top); ctx.stroke() }); ctx.beginPath(); b.forEach(([bx, bz], i) => i ? ctx.lineTo(...P(bx, -80, bz)) : ctx.moveTo(...P(bx, -80, bz))); ctx.closePath(); ctx.stroke() });
      for (let i = 0; i < 12; i++) { const r = seeded(900 + i); const [x, y] = P(r() * 500 - 250, -80 + r() * 20, r() * 500 - 250); pine(x, y, .25, 'rgba(120,230,170,.5)') }
      ctx.restore();
      glow(960, 760, 240, '#7cc4ff', .25);
      txt('湖边 · 14:42 · 拖动可旋转', 960, 210, 24, '#cfe9ff', 600, 'center');
    });
    // phone in friend's hand
    alpha(prog(t, 20.4, 20.8) * (1 - prog(t, 22.5, 23)), () => { fillRR(740, 470, 50, 90, 8, '#1a1e29'); fillRR(746, 476, 38, 78, 5, '#7cc4ff') });
  }
  function timeline(t) {
    frontTable(t, false);
    const a = easeOut(prog(t, 27.2, 27.8));
    alpha(a, () => {
      glass(220, 140, 1480, 420, 26, 'rgba(14,26,44,.9)', 'rgba(22,49,79,.9)'); txt('大家的今天 · 按时间和地点排列', 260, 200, 30, '#fff', 700);
      line(280, 420, 1640, 420, 'rgba(255,255,255,.25)', 4);
      const E = [['10:20', '城市公园', 0, 2], ['12:05', '餐厅', 2, 4], ['14:10', '山谷入口', 2, 1], ['14:42', '湖边', 2, 3], ['15:30', '咖啡馆', 1, 6], ['17:50', '美术馆', 3, 5]];
      const cols = [FR[0].shirt, FR[1].shirt, ME.shirt, FR[2].shirt, FR[3].shirt];
      E.forEach(([tm, pl, who, s], i) => { const k = easeOut(prog(t, 28 + i * .45, 28.6 + i * .45)); if (k <= 0) return; const x = 330 + i * 250; const fx = [420, 700, 960, 1220, 1500][who];
        alpha(k, () => { photo(lerp(fx, x - 90, k), lerp(640, 240, k), 180, 120, s, 0, false); circle(x, 420, 10, cols[who]); txt(tm, x, 460, 24, '#fff', 700, 'center'); txt(pl, x, 494, 22, '#9fb6d4', 500, 'center') }) })
    })
  }
  function cleanup(t) {
    room(t, 1);
    ctx.fillStyle = '#7a5b45'; fillRR(420, 640, 700, 22, 8, '#7a5b45'); fillRR(460, 662, 18, 160, 4, '#6a4e3b'); fillRR(1062, 662, 18, 160, 4, '#6a4e3b');
    fillRR(1260, 520, 640, 30, 4, '#8b9aa8'); ctx.fillStyle = '#d8d0c6'; ctx.fillRect(1270, 550, 620, 270);
    const n = 4 - Math.floor(prog(t, 35, 38.5) * 4.99); for (let i = 0; i < n; i++) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(520 + i * 160, 636, 50, 8, 0, 0, 7); ctx.fill() }
    personSide(600, 830, 1.15, { pose: 'stand', c: FR[0], armTo: [[20, -40], [50, -30]] }); fillRR(640, 676, 70, 10, 4, '#fff');
    const wx = track(t, [[34, 900, 0], [37, 1350, 0], [40, 900, 0]])[0]; personSide(wx, 830, 1.15, { pose: 'walk', ph: t * 6, c: FR[1], dir: t < 37 ? 1 : -1, armTo: [[24, -40], [52, -36]] }); fillRR(wx + 40, 670, 60, 20, 4, '#fff');
    personSide(1200, 830, 1.15, { pose: 'stand', dir: -1, arm: -1.5 + Math.sin(t * 5) * .3 }); personSide(300, 830, 1.15, { pose: 'stand', c: FR[2], arm: .3 }); personSide(1500, 830, 1.15, { pose: 'stand', dir: -1, c: FR[3], arm: .2 });
    [[300, '哈哈'], [1500, '下次一起去山谷']].forEach(([x, s], i) => { const a = bump(t, 36 + i * 1.6, 38.4 + i * 1.6); alpha(a, () => { const w = tw(s, 24, 600) + 40; fillRR(x - w / 2, 560, w, 50, 25, 'rgba(255,255,255,.92)'); txt(s, x, 594, 24, '#4a3f55', 600, 'center') }) });
  }
  SCENES.push({
    time: '19:00', title: '与朋友共进晚餐', dur: DUR, subs: SUBS, draw(t) {
      if (t < 6.8) arrival(t);
      if (t >= 6.2 && t < 13.6) alpha(t < 6.8 ? ease(prog(t, 6.2, 6.8)) : 1, () => camera(1.02, 960, 540, () => kitchenTable(t)));
      if (t >= 13.0 && t < 27.4) alpha(t < 13.6 ? ease(prog(t, 13, 13.6)) : 1, () => (t < 20.2 ? frontTable(t, false) : holo(t)));
      if (t >= 26.8 && t < 34.4) alpha(t < 27.4 ? ease(prog(t, 26.8, 27.4)) : 1, () => timeline(t));
      if (t >= 33.8) alpha(ease(prog(t, 33.8, 34.4)), () => cleanup(t));
    }
  });
})();
