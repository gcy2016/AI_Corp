/* 16:00 学习：返程车内打开天文学；恒星形成粒子模拟；拖动时间轴、旋转、剖面；换一种解释；学习进度 */
(() => {
  const SUBS = [
    { a: 0.8, b: 6.0, text: '返程途中，居住者打开天文学学习界面，选择恒星形成。' },
    { a: 7.0, b: 12.8, who: 'AI', text: '一团星际气体在引力作用下逐渐聚集，中心温度不断升高。' },
    { a: 13.4, b: 19.4, who: 'AI', text: '原恒星形成，随后点燃核聚变，进入稳定的主序星阶段。' },
    { a: 20.4, b: 26.2, text: '居住者可以拖动时间轴、旋转模型，查看内部结构和温度分布。' },
    { a: 27.0, b: 29.6, who: 'ME', text: '能换一种方式解释吗？' },
    { a: 30.0, b: 35.8, who: 'AI', text: '想象一个越滚越紧的雪球，越压越热，最后被点燃。' },
    { a: 36.6, b: 41.8, text: '系统根据互动调整讲解深度，并记录学习进度。' },
  ];
  const DUR = 44;
  const R = seeded(808), N = 1100;
  const PT = [...Array(N)].map(() => { const u = R(), v = R(); const r = Math.pow(R(), .6); return { r, th: u * Math.PI * 2, ph: Math.acos(2 * v - 1), b: R(), s: R() } });
  const BG = [...Array(220)].map(() => ({ x: R() * W, y: R() * H, r: R() * 1.6 + .3, p: R() * 6 }));
  const tcol = k => k < .33 ? mix('#5a4fcf', '#d9534f', k / .33) : k < .66 ? mix('#d9534f', '#ffb347', (k - .33) / .33) : mix('#ffb347', '#fff6e0', (k - .66) / .34);
  /* s: 0 分子云 → .35 坍缩 → .65 原恒星 → 1 主序星；rot: 视角旋转 */
  function starSim(cx, cy, scale, s, rot, t, cut = 0) {
    const col = ease(prog(s, 0, .7)), flat = ease(prog(s, .4, .75)), ign = prog(s, .82, .95);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of PT) {
      const rr0 = p.r * lerp(1, .12 + .5 * p.b * flat, col), sp = s * 7 / (p.r + .15);
      let x = rr0 * Math.sin(p.ph) * Math.cos(p.th + sp), z = rr0 * Math.sin(p.ph) * Math.sin(p.th + sp), y = rr0 * Math.cos(p.ph) * lerp(1, .12, flat);
      const xr = x * Math.cos(rot) - z * Math.sin(rot), zr = x * Math.sin(rot) + z * Math.cos(rot);
      const yy = y * Math.cos(.35) - zr * Math.sin(.35);
      const heat = clamp((1 - rr0 * 2.2) * col + .05);
      const X = cx + xr * scale, Y = cy + yy * scale;
      if (cut && xr > 0 && Math.abs(yy) < .5) continue;
      ctx.fillStyle = tcol(heat); ctx.globalAlpha = .25 + .45 * (1 - rr0); ctx.beginPath(); ctx.arc(X, Y, 1.2 + p.s * 2.2 * (1 - col * .5), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const core = ease(prog(s, .45, .9));
    glow(cx, cy, scale * (.15 + core * .35), '#ffb35a', .25 + core * .4);
    if (ign > 0) { glow(cx, cy, scale * (.35 + ign * .4 + Math.sin(t * 4) * .01), '#fff1c2', .5 * ign); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * .1; ctx.strokeStyle = `rgba(255,240,200,${.15 * ign})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * scale * .12, cy + Math.sin(a) * scale * .12); ctx.lineTo(cx + Math.cos(a) * scale * (.5 + ign * .3), cy + Math.sin(a) * scale * (.5 + ign * .3)); ctx.stroke() } }
    ctx.restore();
    if (core > .2) circle(cx, cy, scale * (.04 + core * .06), tcol(.7 + core * .3));
    if (cut) { const L = [['核心 · 1500 万 K', '#fff6e0', .07], ['辐射区', '#ffb347', .13], ['对流区', '#d9534f', .2]]; L.slice().reverse().forEach(([n, c, r]) => { ctx.fillStyle = rgba(c.slice(0, 7), .8); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, scale * r, -Math.PI / 2, 0); ctx.closePath(); ctx.fill() });
      L.forEach(([n, c, r], i) => { line(cx + scale * r * .7, cy - scale * r * .7, cx + scale * .45, cy - scale * (.35 - i * .1), 'rgba(255,255,255,.7)', 2); txt(n, cx + scale * .47, cy - scale * (.35 - i * .1) + 8, 24, '#fff', 600) }) }
  }
  window.starSim = starSim;
  function simS(t) { // timeline value
    if (t < 7) return 0; if (t < 19.4) return ease(prog(t, 7, 19.2));
    if (t < 21.2) return 1; if (t < 23) return lerp(1, .55, ease(prog(t, 21.2, 23))); return lerp(.55, 1, ease(prog(t, 23.2, 24.0))) // 手松开（24.2）前滑块就停住
  }
  function space(t) {
    ctx.fillStyle = vgrad(0, H, ['#05060f', '#0d1030']); ctx.fillRect(0, 0, W, H);
    BG.forEach(b => circle(b.x, b.y, b.r, `rgba(255,255,255,${.3 + .5 * Math.abs(Math.sin(t * .7 + b.p))})`));
    const s = simS(t), rot = t * .12 + ease(prog(t, 24.6, 26)) * 1.4, cut = prog(t, 25.6, 26) > .5 && t < 27;
    starSim(760, 470, 380, s, rot, t, cut);
    // stage labels + timeline
    const st = ['分子云', '引力坍缩', '原恒星', '主序星'], X0 = 200, X1 = 1320, Y = 870;
    fillRR(X0, Y, X1 - X0, 8, 4, 'rgba(255,255,255,.15)'); fillRR(X0, Y, (X1 - X0) * s, 8, 4, '#ffb347');
    st.forEach((n, i) => { const x = X0 + (X1 - X0) * i / 3; circle(x, Y + 4, 9, s >= i / 3 - .01 ? '#ffb347' : '#4a4f72'); txt(n, x, Y - 22, 22, s >= i / 3 - .01 ? '#fff' : '#8a8fb0', 600, 'center') });
    const kx = X0 + (X1 - X0) * s; circle(kx, Y + 4, 16, '#fff');
    txt('开始', X0, Y + 50, 18, '#8a8fb0'); txt('约 5000 万年', X1, Y + 50, 18, '#8a8fb0', 400, 'right');
    // temperature bar
    const tg = ctx.createLinearGradient(0, 300, 0, 700); ['#fff6e0', '#ffb347', '#d9534f', '#5a4fcf'].forEach((c, i) => tg.addColorStop(i / 3, c)); fillRR(1380, 300, 18, 400, 9, tg);
    txt('温度', 1389, 280, 20, '#cfd3ef', 600, 'center'); txt('10⁷ K', 1410, 312, 18, '#cfd3ef'); txt('10 K', 1410, 700, 18, '#cfd3ef');
    // right panel
    glass(1480, 110, 380, 700, 24, 'rgba(14,20,44,.92)', 'rgba(24,30,70,.92)');
    txt('恒星形成', 1510, 166, 34, '#fff', 700); aiOrb(1810, 150, 22, t, speaking(SUBS, t));
    const depth = t > 34 ? 4 : 3; txt('讲解深度', 1510, 214, 20, '#8a8fb0'); for (let i = 0; i < 5; i++) circle(1620 + i * 26, 207, 8, i < depth ? '#ffb347' : '#3a3f62');
    if (t < 27) {
      const lines = s < .35 ? ['低温气体与尘埃', '密度略高的区域', '开始在引力下聚集'] : s < .65 ? ['气体向中心坍缩', '中心密度和温度上升', '外围形成旋转的盘'] : s < .9 ? ['原恒星发光', '靠引力收缩释放能量', '中心接近 1000 万 K'] : ['氢聚变为氦', '辐射压与引力平衡', '进入稳定的主序星阶段'];
      lines.forEach((l, i) => txt(l, 1510, 290 + i * 48, 26, '#e6e9fa'));
    } else if (t < 36) {
      alpha(easeOut(prog(t, 29.8, 30.4)), () => {
        pill(1510, 260, '换一种解释 · 类比', '#3d8bff', '#fff', 20);
        const g = ease(prog(t, 30.4, 34)); for (let i = 0; i < 4; i++) circle(1560 + i * 80, 420, 14 + i * 8 * (.5 + g * .5), mix('#e6eefa', i === 3 ? '#ffd27a' : '#ffffff', i === 3 ? g : 0));
        txt('滚', 1600, 380, 22, '#8a8fb0'); txt('压紧', 1700, 380, 22, '#8a8fb0'); txt('点燃', 1800, 380, 22, '#ffd27a', 700);
        txt('雪球越滚越紧 → 气体越压越密', 1510, 500, 22, '#e6e9fa'); txt('越压越热 → 中心温度升高', 1510, 540, 22, '#e6e9fa'); txt('热到一定程度 → 核聚变点燃', 1510, 580, 22, '#ffd27a');
        fillRR(1510, 620, 320, 50, 14, 'rgba(255,255,255,.07)'); txt('进入数学模型  →', 1530, 654, 22, '#9fd0ff', 600)
      })
    } else {
      txt('金斯判据', 1510, 290, 26, '#9fd0ff', 700); txt('M  >  M_J ∝ T^(3/2) ρ^(-1/2)', 1510, 340, 24, '#fff'); txt('云团质量超过金斯质量即会坍缩', 1510, 384, 20, '#cfd3ef');
      alpha(easeOut(prog(t, 37.4, 38)), () => { txt('学习进度', 1510, 470, 22, '#8a8fb0', 600); fillRR(1510, 490, 320, 14, 7, 'rgba(255,255,255,.12)'); fillRR(1510, 490, 320 * lerp(.25, .4, prog(t, 38, 40)), 14, 7, '#57d68d'); txt(Math.round(lerp(25, 40, prog(t, 38, 40))) + '%', 1830, 540, 24, '#8ff0c4', 700, 'right');
        txt('已掌握：坍缩、原恒星、点燃', 1510, 600, 20, '#cfd3ef'); txt('下一节：恒星的演化', 1510, 640, 22, '#ffcf9a', 600) })
    }
    // interactions
    // 手：先按住滑块拖动时间轴（指尖始终在滑块上），再移到模型上往左拖着旋转，最后顺着原位置移出画面
    if (t > 20.6 && t < 26.8) {
      let hx, hy;
      if (t < 21.2) [hx, hy] = [lerp(1900, kx, ease(prog(t, 20.6, 21.2))), lerp(1250, Y + 8, ease(prog(t, 20.6, 21.2)))];
      else if (t < 24.2) [hx, hy] = [kx, Y + 8];
      else if (t < 26) { const a = ease(prog(t, 24.2, 24.6)); [hx, hy] = [lerp(kx, 1060, a) - ease(prog(t, 24.6, 26)) * 260, lerp(Y + 8, 620, a)] }
      else [hx, hy] = [lerp(800, 2000, ease(prog(t, 26, 26.8))), lerp(620, 1300, ease(prog(t, 26, 26.8)))];
      hand(hx, hy, t > 24.6 && t < 26 ? .4 : 0, ME.shirt)
    }
    if (t > 27 && t < 29.8) { const k = easeOut(prog(t, 27, 27.4)); alpha(k, () => { aiOrb(1670, 560, 40, t, true); txt('正在聆听…', 1670, 640, 22, '#cfe3ff', 500, 'center') }) }
  }
  function car(t) {
    window.carInterior(t, {
      dusk: 1, speed: 200, screen: (x, y, w, h) => {
        ctx.fillStyle = vgrad(y, y + h, ['#0b0d24', '#1a1640']); ctx.fillRect(x, y, w, h);
        BG.slice(0, 60).forEach(b => circle(x + b.x % w, y + b.y % h, b.r, 'rgba(255,255,255,.6)'));
        txt('天文学', x + 40, y + 70, 36, '#fff', 700); txt('选择一个主题', x + 40, y + 110, 22, '#8a8fb0');
        ['恒星形成', '黑洞', '系外行星', '宇宙膨胀'].forEach((k, i) => { const sel = i === 0 && t > 3.2; fillRR(x + 40, y + 150 + i * 84, w - 80, 68, 16, sel ? 'rgba(255,179,71,.25)' : 'rgba(255,255,255,.06)'); if (sel) { rr(x + 40, y + 150 + i * 84, w - 80, 68, 16); ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.stroke() } txt(k, x + 70, y + 194 + i * 84, 28, '#fff', sel ? 700 : 400); txt(['约 40 分钟', '约 35 分钟', '约 30 分钟', '约 45 分钟'][i], x + w - 70, y + 194 + i * 84, 20, '#8a8fb0', 400, 'right') })
      }
    })
  }
  SCENES.push({
    time: '16:00', title: '学习', dur: DUR, subs: SUBS, draw(t) {
      if (t < 6.8) { const z = ease(prog(t, 4.6, 6.8)); camera(lerp(1.08, 1.9, z), lerp(960, 1480, z), lerp(500, 460, z), () => car(t)) }
      if (t >= 6.2) alpha(ease(prog(t, 6.2, 6.8)), () => space(t));
    }
  });
})();
