/* 14:00 山谷：入口路线屏；步道坡度提示；识别植物；岩层三维模型；湖边拍照整理；在此居住三个月 */
(() => {
  const SUBS = [
    { a: 0.8, b: 6.6, text: '下午两点，车辆抵达山谷入口。远处是山脉、森林和一片湖泊。' },
    { a: 7.0, b: 11.4, text: '入口屏幕显示各条路线的距离、天气和实时人流。' },
    { a: 12.2, b: 17.0, who: 'AI', text: '前方坡度百分之十二，碎石路面，请放慢脚步。' },
    { a: 17.6, b: 22.6, text: '居住者指向一种植物，屏幕显示它的名称、特征和生长环境。' },
    { a: 23.4, b: 29.4, text: '对着岩层拍摄后，系统展示当地地质结构的三维模型。' },
    { a: 30.6, b: 37.6, text: '抵达湖边，居住者拍下湖面、山林和天空，照片按时间和地点自动整理。' },
    { a: 38.8, b: 41.6, who: 'ME', text: '能在这里住三个月吗？' },
    { a: 42.0, b: 48.8, who: 'AI', text: '可以。这是附近的住房、交通、生活设施，以及气候和环境风险。' },
  ];
  const DUR = 51;
  function forestRow(y, s, col, seed, x0 = -50, x1 = 1980, gap = 46) { const r = seeded(seed); for (let x = x0; x < x1; x += gap * s) pine(x + r() * 20, y + r() * 14, s * (.8 + r() * .5), col) }
  function landscape(t, sky = 1) {
    ctx.fillStyle = vgrad(0, 640, ['#7fb6ea', '#cfe6f5', '#eef6f8']); ctx.fillRect(0, 0, W, 700);
    glow(1500, 160, 300, '#fff6d8', .7); circle(1500, 160, 40, '#fffbe8');
    ridge(-100, 2050, 380, 90, .0042, 1.2, '#b6c3dd'); ridge(-100, 2050, 450, 70, .006, 3.3, '#93a9c8');
    // snow caps
    ctx.fillStyle = 'rgba(255,255,255,.7)'; [[560, 300], [1230, 310]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 50, y + 40); ctx.lineTo(x, y); ctx.lineTo(x + 50, y + 40); ctx.closePath(); ctx.fill() });
    forestRow(560, .55, '#5f8a74', 1); ridge(-100, 2050, 560, 30, .008, 5, '#6f9a7c');
    // lake
    ctx.fillStyle = vgrad(570, 700, ['#7fb3d8', '#5f97c2']); ctx.beginPath(); ctx.ellipse(1080, 630, 560, 70, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; for (let i = 0; i < 7; i++) { const x = 700 + i * 110 + Math.sin(t + i) * 20, y = 610 + (i % 3) * 18; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 50, y); ctx.stroke() }
    forestRow(690, .75, '#4f7d64', 2); ctx.fillStyle = '#7fae76'; ctx.fillRect(0, 700, W, 400);
    ctx.fillStyle = '#8bbb80'; ctx.beginPath(); ctx.moveTo(0, 760); ctx.quadraticCurveTo(900, 700, 1920, 780); ctx.lineTo(1920, 1080); ctx.lineTo(0, 1080); ctx.fill();
  }
  function trailPts() { return [[980, 1080], [1100, 900], [1300, 830], [1450, 760], [1640, 720], [1800, 690]] }
  function entrance(t) {
    landscape(t);
    // trail
    const P = trailPts(); ctx.strokeStyle = '#e3d3b4'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke();
    ctx.strokeStyle = '#e3d3b4'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(1300, 830); ctx.quadraticCurveTo(1150, 760, 980, 720); ctx.stroke();
    // visitors on trails
    for (let i = 0; i < 6; i++) { const r = seeded(200 + i), a = (r() + t * .02) % 1; const k = a * (P.length - 1), j = Math.floor(k), f = k - j; const x = lerp(P[j][0], P[j + 1][0], f), y = lerp(P[j][1], P[j + 1][1], f); personSide(x, y, .32 - a * .1, { pose: 'walk', ph: t * 6 + i, c: { shirt: ['#e07a5f', '#3d5a80', '#f2cc8f', '#81b29a'][i % 4] } }) }
    for (let i = 0; i < 3; i++) { const r = seeded(300 + i), a = (r() + t * .015) % 1; personSide(lerp(1300, 980, a), lerp(830, 720, a), .26, { pose: 'walk', ph: t * 6 + i, dir: -1, c: { shirt: '#c7a7ff' } }) }
    // gate
    fillRR(130, 560, 26, 380, 6, '#7a5b45'); fillRR(470, 560, 26, 380, 6, '#7a5b45'); fillRR(100, 530, 420, 54, 14, '#8a6a52'); txt('山谷入口', 310, 568, 30, '#fff4e0', 700, 'center');
    pod(300, 930, 1.25, { col: '#f4f6fa' });
    // board
    fillRR(735, 720, 20, 220, 4, '#4a5263'); glass(600, 430, 290, 300, 18); ctx.strokeStyle = '#2a2f3d'; ctx.lineWidth = 8; rr(600, 430, 290, 300, 18); ctx.stroke();
    ctx.save(); rr(600, 430, 290, 300, 18); ctx.clip();
    txt('路线与实时人流', 618, 462, 17, '#fff', 700); txt('晴 21℃ · 紫外线 中 · 风 2 级', 618, 486, 11, '#9fd0ff');
    [['湖畔步道', '6.2 km · 平缓', '人流 少', '#57d68d', .3], ['山脊线', '9.8 km · 较陡', '人流 中', '#ffb35a', .6], ['森林环线', '4.1 km · 平缓', '人流 少', '#57d68d', .25]].forEach(([n, d, c, col, p], i) => { const y = 510 + i * 68; fillRR(614, y, 262, 58, 10, 'rgba(255,255,255,.07)'); txt(n, 626, y + 24, 15, '#fff', 700); txt(d, 626, y + 46, 12, '#9fb6d4'); txt(c, 864, y + 24, 12, col, 700, 'right'); fillRR(780, y + 36, 84, 6, 3, 'rgba(255,255,255,.15)'); fillRR(780, y + 36, 84 * p, 6, 3, col) });
    txt('已为你推荐：湖畔步道', 618, 718, 13, '#8ff0c4', 600); ctx.restore();
    personSide(560, 950, .9, { pose: 'stand', arm: .2 });
  }
  function hike(t) {
    const tw2 = Math.min(t, 17.4), off = 150 * (tw2 - 11.6);
    ctx.fillStyle = vgrad(0, 700, ['#86bbe9', '#e6f2f8']); ctx.fillRect(0, 0, W, 800);
    ctx.save(); ctx.translate(-off * .1, 0); ridge(-100, 2400, 360, 90, .004, 2, '#aab9d6'); ctx.restore();
    ctx.save(); ctx.translate(-off * .35, 0); ridge(-100, 2800, 520, 60, .006, 4, '#7f9fbd'); forestRow(600, .8, '#5a8a6e', 9, -100, 2800, 40); ctx.restore();
    const gy = x => 900 - (x + off) * .12 + 160;
    ctx.fillStyle = '#86b07a'; ctx.beginPath(); ctx.moveTo(-10, gy(-10) - 40); for (let x = 0; x <= W + 20; x += 40) ctx.lineTo(x, gy(x) - 40); ctx.lineTo(W + 20, H); ctx.lineTo(-10, H); ctx.fill();
    ctx.fillStyle = '#d9c6a4'; ctx.beginPath(); ctx.moveTo(-10, gy(-10) - 40); for (let x = 0; x <= W + 20; x += 40) ctx.lineTo(x, gy(x) - 40); for (let x = W + 20; x >= -10; x -= 40) ctx.lineTo(x, gy(x) + 10); ctx.fill();
    const r = seeded(77); for (let i = 0; i < 60; i++) { const wx = r() * 3000, x = ((wx - off) % 3000 + 3000) % 3000 - 200; circle(x, gy(x) - 30 + r() * 34, 3 + r() * 4, '#b8a382') }
    // plant
    const px = 1150 + 150 * (17.4 - 11.6) - off, py = gy(px) - 40;
    ctx.fillStyle = '#4f8a4a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(px - 40 + i * 16, py - 30 - (i % 2) * 14, 26, 14, (i - 3) * .3, 0, 7); ctx.fill() }
    [[-30, -60], [0, -74], [26, -58], [-50, -40], [44, -38], [10, -48]].forEach(([dx, dy], i) => { circle(px + dx, py + dy, 13, i % 2 ? '#e67aa8' : '#f29cc1'); circle(px + dx, py + dy, 4, '#ffe08a') });
    // trees passing
    for (let i = 0; i < 5; i++) { const x = ((i * 520 - off * 1.0) % 2600 + 2600) % 2600 - 300; if (Math.abs(x - px) > 160) tree(x, gy(x) - 40, 1.3, t + i, '#6fa86a', '#5a9156') }
    // person
    const walking = t < 17.4, pxp = 760; const sy = gy(pxp) - 34;
    personSide(pxp, sy, 1.15, walking ? { pose: 'walk', ph: t * 6.5 } : { pose: 'stand', point: [lerp(1, 10, ease(prog(t, 17.4, 18))), lerp(2, 3, ease(prog(t, 17.4, 18)))] });
    // slope hint
    alpha(easeOut(prog(t, 12.2, 12.8)) * (1 - prog(t, 16.8, 17.2)), () => { chip(1060, 260, '坡度', '12% · 碎石路面 · 请放慢', '#ffb35a', 1); line(900, gy(900) - 60, 1500, gy(1500) - 60, 'rgba(255,179,90,.8)', 4); ctx.setLineDash([]) });
    // plant card
    alpha(easeOut(prog(t, 18.2, 18.8)), () => {
      const x = px + 120, y = py - 460; line(px + 20, py - 70, x, y + 300, 'rgba(255,255,255,.8)', 2);
      glass(x, y, 520, 320, 24, 'rgba(14,26,44,.92)', 'rgba(22,49,79,.92)');
      txt('高山杜鹃', x + 32, y + 62, 38, '#fff', 700); pill(x + 230, y + 30, '识别置信 97%', 'rgba(87,214,141,.25)', '#8ff0c4', 18);
      [['特征', '杜鹃花科常绿灌木，花冠漏斗状'], ['花期', '每年 4–6 月'], ['生长环境', '海拔 1500–3000 m 的酸性土壤']].forEach(([k, v], i) => alpha(easeOut(prog(t, 18.8 + i * .4, 19.3 + i * .4)), () => { txt(k, x + 32, y + 130 + i * 62, 22, '#8fa9c8', 600); txt(v, x + 140, y + 130 + i * 62, 24, '#e6eef8') }))
    });
  }
  function strata(t) {
    ctx.fillStyle = vgrad(0, 800, ['#8fc0ea', '#e8f3f8']); ctx.fillRect(0, 0, W, H);
    ridge(-100, 2050, 420, 60, .005, 1, '#a9bad5'); ctx.fillStyle = '#8bb07e'; ctx.fillRect(0, 820, W, 260);
    // cliff
    const cols = ['#c98f6a', '#b9a07f', '#9c8f86', '#d8b993', '#a77a62', '#8d8178'];
    for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); const y0 = 180 + i * 110; ctx.moveTo(-20, y0 + Math.sin(i) * 20); for (let x = 0; x <= 760; x += 40) ctx.lineTo(x, y0 + Math.sin(x * .01 + i) * 18 + x * .05); ctx.lineTo(760, 900); ctx.lineTo(-20, 900); ctx.fill() }
    ctx.fillStyle = '#8bb07e'; ctx.beginPath(); ctx.moveTo(760, 120); ctx.lineTo(820, 900); ctx.lineTo(760, 900); ctx.fill();
    personSide(1000, 900, 1.2, { pose: 'stand', dir: -1, point: [8, -5] }); fillRR(910, 714, 34, 54, 6, '#1a1e29');
    const fl = bump(t, 23.5, 23.9); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * .8})`; ctx.fillRect(0, 0, W, H) }
    // 3D model
    const a = easeOut(prog(t, 24.2, 24.9));
    alpha(a, () => {
      glass(1080, 110, 760, 700, 28, 'rgba(14,26,44,.94)', 'rgba(22,49,79,.94)');
      txt('当地地质结构 · 三维模型', 1120, 172, 30, '#fff', 700); txt('拖动可旋转 · 点击查看岩层', 1120, 208, 20, '#8fa9c8');
      const th = .6 + (t - 24) * .35, cx = 1400, cy = 520, w = 340, d = 220, hh = 300;
      const L = [['花岗岩基底', '#8d8178'], ['石灰岩', '#d8b993'], ['页岩', '#9c8f86'], ['砂岩', '#c98f6a']];
      const P = (x, y, z) => { const xr = x * Math.cos(th) - z * Math.sin(th), zr = x * Math.sin(th) + z * Math.cos(th); return [cx + xr, cy - y + zr * .42] };
      const C = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
      for (let f = 0; f < 4; f++) { const [x1, z1] = C[f], [x2, z2] = C[(f + 1) % 4]; const nx = (z2 - z1), nz = -(x2 - x1); const nzr = nx * Math.sin(th) + nz * Math.cos(th); if (nzr <= 0) continue;
        const shade = .78 + .22 * Math.abs(Math.cos(th + f));
        L.forEach(([n, c], i) => { const y0 = -hh / 2 + i * hh / 4, y1 = y0 + hh / 4; ctx.fillStyle = mix('#000000', c, shade); ctx.beginPath(); ctx.moveTo(...P(x1, y0, z1)); ctx.lineTo(...P(x2, y0, z2)); ctx.lineTo(...P(x2, y1, z2)); ctx.lineTo(...P(x1, y1, z1)); ctx.closePath(); ctx.fill() }) }
      ctx.fillStyle = '#9fc48a'; ctx.beginPath(); C.forEach(([x, z], i) => i ? ctx.lineTo(...P(x, hh / 2, z)) : ctx.moveTo(...P(x, hh / 2, z))); ctx.closePath(); ctx.fill();
      L.forEach(([n, c], i) => { const y = cy + hh / 2 - i * hh / 4 - hh / 8 + 20; alpha(prog(t, 25.4 + i * .4, 25.9 + i * .4), () => { circle(1620, y, 8, c); txt(n, 1640, y + 8, 22, '#e6eef8') }) });
      alpha(prog(t, 27.2, 27.8), () => txt('约 2 亿年前沉积形成 · 后期抬升出露', 1120, 770, 22, '#ffcf9a', 600));
    });
  }
  const PH = [[31.2, 3], [32.6, 1], [34.0, 2]];
  function lake(t, dim = 0) {
    ctx.fillStyle = vgrad(0, 560, ['#7fb6ea', '#e6f2f8']); ctx.fillRect(0, 0, W, 560);
    ridge(-100, 2050, 380, 110, .004, 2.2, '#a9bad5', 560); ridge(-100, 2050, 470, 60, .007, 4, '#7f9fbd', 560); forestRow(560, .7, '#567f69', 5);
    ctx.fillStyle = vgrad(560, 900, ['#6fa6cf', '#4f86b0']); ctx.fillRect(0, 560, W, 340);
    ctx.save(); ctx.globalAlpha = .25; ctx.translate(0, 1120); ctx.scale(1, -1); ridge(-100, 2050, 470, 60, .007, 4, '#3f6f8f', 560); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 3; for (let i = 0; i < 18; i++) { const r = seeded(500 + i), x = r() * W + Math.sin(t * .8 + i) * 30, y = 600 + r() * 280; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + r() * 60, y); ctx.stroke() }
    ctx.fillStyle = '#8bb07e'; ctx.beginPath(); ctx.moveTo(0, 880); ctx.quadraticCurveTo(900, 840, 1920, 900); ctx.lineTo(1920, 1080); ctx.lineTo(0, 1080); ctx.fill();
    fillRR(560, 822, 18, 90, 6, '#8a6a52'); fillRR(560, 892, 380, 18, 6, '#8a6a52'); fillRR(580, 910, 14, 38, 4, '#6a4e3b'); fillRR(906, 910, 14, 38, 4, '#6a4e3b');
    const shoot = PH.some(([a]) => t > a - .5 && t < a + .4);
    personSide(624, 892, 1.2, { pose: 'sit', point: shoot ? [6, -4] : undefined, arm: .8, legH: 46 });
    if (dim) { ctx.fillStyle = `rgba(10,18,32,${dim})`; ctx.fillRect(0, 0, W, H) }
  }
  function lakeShots(t) {
    lake(t);
    PH.forEach(([a, s]) => { const f = bump(t, a, a + .3); if (f > 0) { ctx.fillStyle = `rgba(255,255,255,${f * .6})`; ctx.fillRect(0, 0, W, H) } });
    alpha(easeOut(prog(t, 31.4, 32)), () => {
      glass(1200, 120, 640, 360, 24, 'rgba(14,26,44,.9)', 'rgba(22,49,79,.9)'); txt('自动整理', 1236, 176, 28, '#fff', 700); txt('按时间与地点', 1380, 176, 20, '#8fa9c8');
      PH.forEach(([a, s], i) => { const k = easeOut(prog(t, a + .2, a + 1)); if (k <= 0) return; const tx = 1236 + i * 196, ty = 220; photo(lerp(800, tx, k), lerp(600, ty, k), 176, 120, s, 0, false) });
      alpha(prog(t, 34.8, 35.3), () => { circle(1250, 396, 10, '#ff6b7a'); txt('湖边 · 14:42', 1272, 404, 24, '#fff', 600); txt('位置已标记 · 3 张', 1272, 440, 20, '#9fb6d4'); });
    });
  }
  const HOMES = [['湖畔木屋', '¥4,800 / 月', '步行到湖 5 分钟 · 安静', '#8ff0c4'], ['镇中心公寓', '¥3,200 / 月', '超市、诊所步行 8 分钟', '#7cc4ff'], ['共享社区', '¥2,600 / 月', '共享厨房 · 工作室', '#ffcf9a']];
  function living(t) {
    lake(t, .55);
    const a = easeOut(prog(t, 41.8, 42.5)); const listen = t > 38.8 && t < 41.6;
    alpha(listen ? 1 : 0, () => { aiOrb(960, 470, 50, t, true); txt('正在聆听…', 960, 580, 28, '#cfe3ff', 500, 'center') });
    alpha(a, () => {
      const X = 160, Y = 130; glass(X, Y, 1600, 780, 30, 'rgba(14,26,44,.95)', 'rgba(22,49,79,.95)');
      txt('在这里住三个月', X + 50, Y + 74, 40, '#fff', 700); txt('出发 · 下月初 · 1 人', X + 400, Y + 72, 22, '#8fa9c8'); aiOrb(X + 1530, Y + 60, 30, t, speaking(SUBS, t));
      HOMES.forEach(([n, p, d, c], i) => { const b = easeOut(prog(t, 42.6 + i * .35, 43.2 + i * .35)); card(X + 50 + i * 510, Y + 120, 480, 250, b, false); alpha(b, () => { photo(X + 74 + i * 510, Y + 144, 150, 110, 20 + i, 0, false); txt(n, X + 250 + i * 510, Y + 184, 30, '#fff', 700); txt(p, X + 250 + i * 510, Y + 226, 26, c, 700); txt(d, X + 74 + i * 510, Y + 320, 22, '#d6e4f5') }) });
      const INFO = [['交通', '镇巴士每 20 分钟一班 · 到市区约 40 分钟车程', '#7cc4ff'], ['生活设施', '超市 · 诊所 · 图书馆 · 每周集市', '#8ff0c4'], ['气候', '冬季均温 -3 ℃ · 夏季 24 ℃ · 年降水 900 mm', '#ffd66b'], ['环境风险', '山火风险 低 · 7–8 月暴雨季注意道路 · 地质稳定', '#ff9f8a']];
      INFO.forEach(([k, v, c], i) => alpha(easeOut(prog(t, 44.2 + i * .5, 44.7 + i * .5)), () => { const y = Y + 420 + i * 82; fillRR(X + 50, y, 1500, 66, 16, 'rgba(255,255,255,.05)'); circle(X + 84, y + 33, 9, c); txt(k, X + 110, y + 43, 26, c, 700); txt(v, X + 280, y + 43, 26, '#e6eef8') }));
    })
  }
  SCENES.push({
    time: '14:00', title: '山谷', dur: DUR, subs: SUBS, draw(t) {
      if (t < 12.1) { const z = ease(prog(t, 6.8, 9.6)); camera(lerp(1, 2.9, z), lerp(960, 745, z), lerp(540, 590, z), () => entrance(t)) }
      if (t >= 11.5 && t < 23.6) alpha(t < 12.1 ? ease(prog(t, 11.5, 12.1)) : 1, () => hike(t));
      if (t >= 23.0 && t < 30.9) alpha(t < 23.6 ? ease(prog(t, 23, 23.6)) : 1, () => strata(t));
      if (t >= 30.3 && t < 38.9) alpha(t < 30.9 ? ease(prog(t, 30.3, 30.9)) : 1, () => camera(1.04 - .04 * prog(t, 30.3, 38), 960, 540, () => lakeShots(t)));
      if (t >= 38.3) alpha(ease(prog(t, 38.3, 38.9)), () => living(t));
    }
  });
})();
