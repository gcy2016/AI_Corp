/* 11:00 健康检查：手环指标；健康终端趋势；生成就诊摘要；同意后预约并发送 */
(() => {
  const SUBS = [
    { a: 0.8, b: 6.2, text: '十一点，手腕上的健康设备汇总近期身体指标。' },
    { a: 8.6, b: 14.6, text: '家庭健康终端显示睡眠、活动和心率趋势，其中一项指标持续变化。' },
    { a: 15.2, b: 20.4, who: 'AI', text: '静息心率近三周持续升高，建议安排进一步检查。' },
    { a: 21.4, b: 26.4, text: 'AI 整理出一份给医疗人员的摘要，并列出需要确认的问题。' },
    { a: 27.6, b: 32.6, text: '经本人同意后，系统预约检查，并把资料发送至医疗机构。' },
    { a: 33.2, b: 37.6, text: '屏幕上展示检查时间、地点和准备事项。' },
  ];
  const DUR = 39;
  const R = seeded(51);
  const sleep = [...Array(30)].map(() => 6.4 + R() * 1.6), act = [...Array(30)].map((_, i) => 5 + Math.sin(i * .7) * 2 + R() * 2);
  const hr = [...Array(30)].map((_, i) => 60 + R() * 2 + Math.max(0, i - 18) * .7);
  function wrist(t) {
    ctx.fillStyle = vgrad(0, H, ['#e9f0ee', '#d4e2df']); ctx.fillRect(0, 0, W, H); glow(1500, 200, 600, '#ffffff', .6);
    ctx.save(); ctx.translate(0, Math.sin(t * .8) * 4);
    ctx.fillStyle = ME.skin; ctx.beginPath(); ctx.moveTo(-50, 470); ctx.quadraticCurveTo(900, 440, 1500, 500); ctx.quadraticCurveTo(1650, 520, 1700, 620); ctx.quadraticCurveTo(1650, 720, 1500, 720); ctx.quadraticCurveTo(900, 760, -50, 760); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ME.shirt; ctx.fillRect(-50, 440, 420, 340);
    fillRR(820, 410, 140, 380, 30, '#2a2f3d'); fillRR(740, 450, 300, 300, 70, '#14161d'); glass(760, 470, 260, 260, 56, '#0e1a2c', '#16314f');
    const beat = Math.pow(Math.abs(Math.sin(t * 3.4)), 8);
    ctx.save(); ctx.translate(890, 560); ctx.scale(1 + beat * .12, 1 + beat * .12); ctx.fillStyle = '#ff6b7a'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-40, -10, -20, -40, 0, -20); ctx.bezierCurveTo(20, -40, 40, -10, 0, 18); ctx.fill(); ctx.restore();
    txt('64', 890, 650, 52, '#fff', 700, 'center'); txt('bpm', 890, 684, 20, '#9fb6d4', 500, 'center');
    ctx.save(); rr(760, 470, 260, 260, 56); ctx.clip(); ctx.strokeStyle = 'rgba(255,107,122,.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = 760; x < 1020; x += 3) { const ph = ((x - t * 160) / 90) % 1, p = ph < 0 ? ph + 1 : ph; const y = 712 + (p > .45 && p < .5 ? -30 : p > .5 && p < .55 ? 18 : 0); x === 760 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) } ctx.stroke(); ctx.restore();
    ctx.restore();
    [['睡眠', '7 小时 42 分', 1.6, '#c7a7ff', 1180, 250], ['步数', '3,280', 2.3, '#ffd66b', 1200, 340], ['静息心率', '64 bpm', 3.0, '#ff8a9a', 1180, 830], ['血氧', '98%', 3.7, '#7cc4ff', 300, 830]].forEach(([k, v, a, c, x, y]) => chip(x, y, k, v, c, easeOut(prog(t, a, a + .5))));
  }
  function terminal(t) {
    warmBokeh(t, '#e7eeec', '#d3dfdc', 9);
    const X = 160, Y = 128, Wd = 1600, Hd = 800;
    device(X, Y, Wd, Hd, t, () => {
      txt('健康趋势 · 近 30 天', X + 50, Y + 74, 36, '#fff', 700); aiOrb(X + Wd - 70, Y + 60, 28, t, speaking(SUBS, t));
      if (t < 21.2) {
        const cw = 470;
        [['睡眠时长', '7.2 h', '#c7a7ff'], ['活动量', '6.1 千步', '#ffd66b'], ['静息心率', '64 bpm', '#ff8a9a']].forEach(([k, v, c], i) => {
          const x = X + 50 + i * (cw + 25), y = Y + 130, a = easeOut(prog(t, 8.8 + i * .4, 9.4 + i * .4)), hl = i === 2 && t > 13;
          card(x, y, cw, 420, a, false); alpha(a, () => {
            if (hl) { rr(x, y, cw, 420, 24); ctx.strokeStyle = '#ffb35a'; ctx.lineWidth = 3; ctx.stroke() }
            txt(k, x + 30, y + 50, 24, '#9fb6d4', 600); txt(v, x + 30, y + 100, 40, '#fff', 700);
            const p = prog(t, 9 + i * .4, 11.5 + i * .4);
            if (i === 0) sleep.forEach((s, j) => { if (j / 30 < p) fillRR(x + 30 + j * 13.6, y + 380 - (s - 5) * 80, 9, (s - 5) * 80, 4, c) });
            else if (i === 1) spark(x + 30, y + 160, cw - 60, 220, act, p, c);
            else {
              ctx.fillStyle = 'rgba(143,240,196,.08)'; ctx.fillRect(x + 30, y + 240, cw - 60, 90); txt('正常范围', x + cw - 40, y + 320, 18, '#8ff0c4', 500, 'right');
              const end = spark(x + 30, y + 160, cw - 60, 220, hr, p, hl ? '#ffb35a' : c);
              if (hl) { const sx = x + 30 + 18 / 29 * (cw - 60); ctx.fillStyle = 'rgba(255,179,90,.12)'; ctx.fillRect(sx, y + 150, x + cw - 30 - sx, 240); circle(end[0], end[1], 8, '#ffb35a') }
            }
          })
        });
        alpha(easeOut(prog(t, 13.4, 14)), () => { fillRR(X + 50, Y + 580, Wd - 100, 170, 24, 'rgba(255,179,90,.14)'); circle(X + 100, Y + 665, 22, '#ffb35a'); txt('!', X + 100, Y + 676, 30, '#16243a', 800, 'center');
          txt('静息心率近 3 周持续升高 +8 bpm', X + 140, Y + 650, 32, '#ffcf9a', 700); txt('睡眠和活动量变化不大 · 建议安排进一步检查', X + 140, Y + 700, 24, '#e6eef8') })
      } else {
        // summary doc
        const a = easeOut(prog(t, 21.4, 22.2)); alpha(a, () => {
          ctx.save(); ctx.translate(X + 60, Y + 130 + (1 - a) * 20); fillRR(0, 0, 640, 620, 18, '#f7f9fc');
          txt('就诊摘要', 40, 60, 32, '#16243a', 700); txt('供医疗人员查看 · AI 整理', 40, 96, 20, '#6b7c93');
          [['静息心率', '30 天均值 61 → 近 7 天 69 bpm'], ['睡眠', '平均 7.2 h，无明显变化'], ['活动', '日均 6,100 步'], ['近期', '无发热记录 · 无新增药物记录']].forEach(([k, v], i) => { const yy = 150 + i * 56; if (i / 4 < prog(t, 22, 24)) { txt(k, 40, yy, 22, '#3d8bff', 700); txt(v, 160, yy, 22, '#33445c') } });
          spark(40, 380, 560, 70, hr, prog(t, 22.5, 24), '#ff8a9a', 3, .1);
          txt('需要确认的问题', 40, 500, 22, '#16243a', 700);
          ['近期是否有心慌或胸闷？', '是否增加了咖啡或茶？', '最近压力是否较大？'].forEach((q, i) => alpha(prog(t, 24.4 + i * .4, 24.8 + i * .4), () => { circle(52, 532 + i * 30, 5, '#ffb35a'); txt(q, 70, 540 + i * 30, 20, '#33445c') }));
          ctx.restore()
        });
        // consent / appointment
        if (t < 29.4) {
          alpha(easeOut(prog(t, 25.6, 26.2)), () => { glass(X + 760, Y + 240, 760, 300, 26, '#1c3352', '#20406a'); txt('是否同意预约检查，', X + 800, Y + 310, 30, '#fff', 700); txt('并把摘要发送给医疗机构？', X + 800, Y + 356, 30, '#fff', 700); const ok = t > 28.2; button(X + 940, Y + 460, 220, ok ? '✓ 已同意' : '同意', ok ? '#2fbf71' : '#3d8bff', bump(t, 27.8, 28.2)); button(X + 1200, Y + 460, 220, '稍后再说', 'outline') });
          if (t > 26.6) { const [hx, hy] = track(t, [[26.6, 1900, 1200], [27.8, X + 950, Y + 470], [29.4, 2000, 1250]]); tap(X + 940, Y + 460, bump(t, 27.8, 28.2)); hand(hx, hy, bump(t, 27.8, 28.2)) }
        } else {
          const a2 = easeOut(prog(t, 29.4, 30)); card(X + 760, Y + 130, 780, 620, a2, true); alpha(a2, () => {
            txt('检查预约', X + 800, Y + 186, 26, '#8fa9c8', 600);
            txt('下周二 · 09:30', X + 800, Y + 256, 48, '#fff', 700); txt('城东医院 · 心内科门诊 3 楼', X + 800, Y + 310, 28, '#d6e4f5');
            const sent = prog(t, 30.4, 31.6); fillRR(X + 800, Y + 344, 680, 64, 16, 'rgba(255,255,255,.07)');
            if (sent < 1) { circle(X + 840 + sent * 560, Y + 376, 10, '#7cc4ff'); txt('摘要发送中…', X + 1460, Y + 386, 22, '#9fd0ff', 500, 'right') } else { check(X + 836, Y + 376, 26, '#57d68d'); txt('摘要已发送至 城东医院', X + 870, Y + 386, 24, '#57d68d', 600) }
            txt('准备事项', X + 800, Y + 470, 24, '#8fa9c8', 600);
            ['检查前 2 小时避免咖啡和茶', '继续佩戴健康手环', '携带身份证件'].forEach((k, i) => alpha(easeOut(prog(t, 33.4 + i * .5, 33.9 + i * .5)), () => { check(X + 818, Y + 516 + i * 54, 22, '#8ff0c4'); txt(k, X + 850, Y + 524 + i * 54, 26, '#fff') }))
          })
        }
      }
    }, false)
  }
  SCENES.push({
    time: '11:00', title: '健康检查', dur: DUR, subs: SUBS, draw(t) {
      if (t < 8.6) camera(1.05 - .05 * prog(t, 0, 8.6), 960, 560, () => wrist(t));
      if (t >= 8.0) alpha(ease(prog(t, 8.0, 8.6)), () => terminal(t));
    }
  });
})();
