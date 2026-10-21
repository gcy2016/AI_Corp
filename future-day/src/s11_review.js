/* 21:00 整理一天：自动旅行相册；排序/删除/做短片；当天路线与照片节点；继续恒星模拟与其他项目 */
(() => {
  const SUBS = [
    { a: 0.8, b: 6.6, text: '晚上九点，AI 把当天的照片、视频和位置记录整理成旅行相册。' },
    { a: 7.4, b: 13.0, text: '居住者调整排序、删掉不需要的照片，选一段影像做成短片。' },
    { a: 14.6, b: 21.0, text: '屏幕展示当天的路线：从家出发，经过城市，抵达山谷和湖边，再回到家。' },
    { a: 21.8, b: 26.8, text: '照片和视频按拍摄时间，对应到路线上的每个节点。' },
    { a: 28.4, b: 35.2, text: '随后，居住者打开恒星模拟继续学习，也可以切换到音乐、绘画或游戏。' },
  ];
  const DUR = 38;
  const PH = [['08:02', '出发', 7], ['12:10', '餐厅', 4], ['14:08', '山谷入口', 1], ['14:31', '高山杜鹃', 9], ['14:42', '湖边', 3], ['14:44', '湖边', 2], ['15:05', '岩层', 5], ['16:20', '返程', 6]];
  function album(t) {
    txt('今天 · 旅行相册', X + 50, Y + 76, 38, '#fff', 700); txt('AI 已整理 · 8 张照片 · 2 段视频', X + 380, Y + 74, 22, '#8fa9c8');
    const del = 5, dp = ease(prog(t, 10, 10.8)), sw = ease(prog(t, 8.2, 9.2));
    PH.forEach(([tm, pl, s], i) => {
      let slot = i; if (i === 2) slot = lerp(2, 3, sw); if (i === 3) slot = lerp(3, 2, sw); if (i > del) slot -= dp;
      const a = easeOut(prog(t, .6 + i * .25, 1.2 + i * .25));
      const pos = n => [X + 50 + (n % 4) * 380, Y + 120 + Math.floor(n / 4) * 300], f = slot % 1, A = pos(Math.floor(slot)), B = pos(Math.ceil(slot));
      const cx = lerp(A[0], B[0], f), cy = lerp(A[1], B[1], f);
      let al = a; if (i === del) al *= 1 - dp; const drag = (i === 3 && t > 8 && t < 9.3);
      alpha(al, () => { ctx.save(); ctx.translate(cx + 170, cy + 120); if (i === del) { ctx.scale(1 - dp * .5, 1 - dp * .5); ctx.rotate(dp * .4) } if (drag) ctx.scale(1.05, 1.05);
        photo(-170, -120, 340, 200, s, 0, false); if (i === 4 || i === 6) { circle(130, -90, 18, 'rgba(0,0,0,.5)'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(124, -100); ctx.lineTo(124, -80); ctx.lineTo(140, -90); ctx.fill() }
        txt(pl, -170, 120, 26, '#fff', 600); txt(tm, 170, 120, 22, '#9fb6d4', 500, 'right'); ctx.restore() })
    });
    if (t > 9.8 && t < 11) alpha(bump(t, 9.8, 11), () => { circle(X + 1460, Y + 700, 40, 'rgba(255,107,90,.3)'); txt('删除', X + 1460, Y + 710, 22, '#ff8a7a', 600, 'center') });
    if (t > 11.2) alpha(easeOut(prog(t, 11.2, 11.8)), () => { fillRR(X + 50, Y + 690, 1500, 80, 20, 'rgba(124,196,255,.12)'); txt('短片', X + 80, Y + 742, 26, '#9fd0ff', 700); for (let i = 0; i < 8; i++) photo(X + 170 + i * 120, Y + 704, 108, 52, PH[i % 8][2], 0, false); fillRR(X + 170 + 360 * prog(t, 11.8, 13.6), Y + 696, 4, 68, 2, '#ffd66b'); button(X + 1400, Y + 730, 220, '生成短片', '#3d8bff', bump(t, 12.6, 13)) });
    const [hx, hy] = track(t, [[7, 1950, 1250], [8, X + 1310, Y + 300], [9.2, X + 930, Y + 300], [9.9, X + 1300, Y + 560], [10.8, X + 1460, Y + 700], [12.4, X + 1400, Y + 740], [13.4, 2000, 1300]]);
    if (t > 7 && t < 13.4) hand(hx, hy, bump(t, 12.6, 13) + bump(t, 7.9, 8.2));
  }
  let X = 160, Y = 128;
  const ROUTE = [[260, 640, '家 08:00', 7], [520, 520, '城市道路', -1], [760, 560, '餐厅 12:10', 4], [1040, 380, '山谷入口 14:08', 1], [1240, 300, '湖边 14:42', 3], [1380, 420, '岩层 15:05', 5], [1100, 700, '返程 16:20', 6], [440, 700, '回家 18:00', -1]];
  function route(t) {
    txt('今天的路线', X + 50, Y + 76, 38, '#fff', 700); txt('总里程 86 km · 步行 7.4 km', X + 290, Y + 74, 22, '#8fa9c8');
    ctx.save(); rr(X + 50, Y + 110, 1500, 640, 22); ctx.clip(); ctx.fillStyle = '#10243a'; ctx.fillRect(X + 50, Y + 110, 1500, 640);
    for (let i = 0; i < 12; i++) line(X + 50 + i * 140, Y + 110, X + 20 + i * 140 + 80, Y + 750, '#16304b', 6); for (let i = 0; i < 6; i++) line(X + 50, Y + 150 + i * 110, X + 1550, Y + 170 + i * 110, '#16304b', 6);
    ctx.fillStyle = '#16402e'; ctx.beginPath(); ctx.ellipse(X + 1200, Y + 340, 360, 220, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2b6f9e'; ctx.beginPath(); ctx.ellipse(X + 1250, Y + 330, 120, 50, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 10; i++) { const r = seeded(700 + i); pine(X + 950 + r() * 500, Y + 250 + r() * 220, .3, '#2a6a4a') }
    ctx.restore();
    const p = ease(prog(t, 14.6, 20.4)), P = ROUTE.map(([x, y]) => [X + x, Y + y]);
    let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { seg.push(Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); L += seg[i - 1] }
    ctx.strokeStyle = '#ffd66b'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...P[0]); let d = p * L, reached = 0;
    for (let i = 1; i < P.length; i++) { if (d >= seg[i - 1]) { ctx.lineTo(...P[i]); d -= seg[i - 1]; reached = i } else { const k = d / seg[i - 1]; ctx.lineTo(lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k)); break } } ctx.stroke();
    ROUTE.forEach(([x, y, lab, s], i) => { if (i > reached) return; circle(X + x, Y + y, 12, i === 0 || i === 7 ? '#7cc4ff' : '#ffd66b'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); txt(lab, X + x, Y + y + 40, 22, '#fff', 600, 'center');
      if (s >= 0 && t > 21.6) { const k = easeOut(prog(t, 21.8 + i * .4, 22.4 + i * .4)); alpha(k, () => { const ox = X + x - 70, oy = Y + y - 140 - (1 - k) * 20; line(X + x, Y + y - 14, X + x, oy + 96, 'rgba(255,255,255,.6)', 2); photo(ox, oy, 140, 90, s, 0, true) }) } });
  }
  function star(t) {
    ctx.fillStyle = vgrad(0, H, ['#05060f', '#0d1030']); ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { const r = seeded(1000 + i); circle(r() * W, r() * H, r() * 1.5 + .3, `rgba(255,255,255,${.3 + .5 * Math.abs(Math.sin(t * .6 + i))})`) }
    window.starSim(800, 470, 360, lerp(.95, 1, prog(t, 28, 36)), t * .15, t);
    pill(110, 140, '继续：恒星形成 · 40%', 'rgba(255,179,71,.25)', '#ffd27a', 24);
    const a = easeOut(prog(t, 31.5, 32.2));
    alpha(a, () => { glass(1430, 220, 380, 520, 26, 'rgba(14,20,44,.92)', 'rgba(24,30,70,.92)'); txt('个人空间', 1470, 280, 30, '#fff', 700);
      [['恒星模拟', '#ffb347'], ['音乐', '#8ff0c4'], ['绘画', '#ff9f8a'], ['游戏', '#7cc4ff'], ['旅行记忆 项目', '#c7a7ff']].forEach(([k, c], i) => { const y = 320 + i * 80, sel = i === 0; fillRR(1460, y, 320, 64, 16, sel ? rgba(c, .25) : 'rgba(255,255,255,.05)'); circle(1500, y + 32, 14, c); txt(k, 1530, y + 42, 26, '#fff', sel ? 700 : 400) }) })
  }
  SCENES.push({
    time: '21:00', title: '整理一天', dur: DUR, subs: SUBS, draw(t) {
      if (t < 28.2) { warmBokeh(t, '#e6dcef', '#d0c3e0', 21); device(X, Y, 1600, 800, t, () => { aiOrb(X + 1530, Y + 56, 26, t, false); if (t < 14.2) album(t); else alpha(ease(prog(t, 14.2, 14.8)), () => route(t)); if (t < 14.8 && t > 14.2) alpha(1 - ease(prog(t, 14.2, 14.8)), () => album(t)) }, false) }
      if (t >= 27.6) alpha(ease(prog(t, 27.6, 28.2)), () => star(t));
    }
  });
})();
