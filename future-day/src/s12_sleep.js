/* 23:00 入睡：查看明天天气与日程；加入烹饪课和天文学；灯光调暗、窗帘关闭、温度预设、夜间监测；屏幕熄灭 */
(() => {
  const SUBS = [
    { a: 0.8, b: 5.8, text: '晚上十一点，居住者查看第二天的天气与日程。' },
    { a: 6.4, b: 10.4, who: 'ME', text: '明天上午学做饭，下午继续看恒星。' },
    { a: 10.8, b: 16.8, who: 'AI', text: '已加入日程。需要面粉和小葱，明早送到，预计用时两小时。' },
    { a: 19.0, b: 26.4, text: '灯光逐渐调暗，窗帘关闭，温度调整到预设范围，健康设备开始记录夜间数据。' },
    { a: 27.4, b: 31.6, text: '屏幕熄灭，房间安静下来，居住者入睡。' },
  ];
  const DUR = 37;
  function ui(t) {
    warmBokeh(t, '#3a3350', '#2a2440', 23);
    ctx.fillStyle = '#4a3a30'; ctx.fillRect(0, 905, W, 175);
    const X = 300, Y = 128, Wd = 1320, Hd = 740;
    device(X, Y, Wd, Hd, t, () => {
      txt('23:00', X + 50, Y + 100, 80, '#fff', 700); txt('晚安 · 明天是周日', X + 54, Y + 146, 28, '#9fb6d4');
      const listen = t > 6.4 && t < 10.4; aiOrb(X + Wd - 90, Y + 80, 40, t, listen || speaking(SUBS, t)); txt(listen ? '正在聆听…' : 'AI 助手', X + Wd - 150, Y + 90, 24, '#cfe3ff', 500, 'right');
      const cw = 580;
      card(X + 50, Y + 200, cw, 480, easeOut(prog(t, .6, 1.2)));
      alpha(easeOut(prog(t, .6, 1.2)), () => { txt('明天天气', X + 80, Y + 250, 24, '#8fa9c8', 600);
        circle(X + 150, Y + 340, 34, '#ffd66b'); circle(X + 196, Y + 360, 40, '#dfe6f0'); circle(X + 150, Y + 372, 30, '#dfe6f0'); txt('多云 19℃', X + 260, Y + 362, 44, '#fff', 700);
        txt('早晚 12–21℃ · 降水 10% · 空气 优', X + 80, Y + 450, 24, '#d6e4f5'); txt('日出 06:34 · 日落 17:41', X + 80, Y + 500, 24, '#9fb6d4') });
      card(X + 690, Y + 200, cw, 480, easeOut(prog(t, 1, 1.6)), t > 10.8 && t < 13);
      alpha(easeOut(prog(t, 1, 1.6)), () => { txt('明天日程', X + 720, Y + 250, 24, '#8fa9c8', 600);
        const added = t > 10.8;
        if (!added) { txt('上午 · 空闲', X + 720, Y + 320, 30, '#fff'); txt('下午 · 空闲', X + 720, Y + 380, 30, '#fff'); txt('19:30 · 社区读书会', X + 720, Y + 440, 30, '#fff') }
        else {
          const a = easeOut(prog(t, 10.8, 11.4));
          alpha(a, () => { fillRR(X + 712, Y + 280, cw - 44, 120, 16, 'rgba(255,207,154,.15)'); txt('09:00 – 11:00', X + 736, Y + 320, 24, '#ffcf9a', 700); txt('学做外婆的葱油饼', X + 736, Y + 366, 30, '#fff', 600);
            fillRR(X + 712, Y + 414, cw - 44, 100, 16, 'rgba(255,179,71,.12)'); txt('14:00', X + 736, Y + 452, 24, '#ffb347', 700); txt('天文学 · 恒星的演化', X + 736, Y + 494, 28, '#fff', 600);
            txt('19:30 · 社区读书会', X + 736, Y + 560, 24, '#9fb6d4') });
          alpha(easeOut(prog(t, 12.6, 13.2)), () => { txt('需要的食材', X + 720, Y + 620, 22, '#8fa9c8', 600); txt('面粉 ✓   小葱 → 明早 07:30 送达   油 ✓', X + 860, Y + 620, 22, '#8ff0c4', 500) });
        }
      })
    })
  }
  function room(t) {
    const k = ease(prog(t, 19.2, 25)), off = ease(prog(t, 27.4, 28.6));
    window.BED = { clock: '23:00', night: 1, sky: 0, L: lerp(.62, .06, k), sys: 0, open: lerp(.42, 0, ease(prog(t, 20, 24.5))), screen: 1 - off, air: 0, noChips: 1, stir: 0 };
    ctx.save(); camera(1.02 + .03 * prog(t, 17, 37), 960, 540, () => window.drawBedroom(t)); ctx.restore();
    window.BED = null;
    chip(860, 300, '温度', `${lerp(22, 20.5, prog(t, 21.5, 24)).toFixed(1)} ℃ · 睡眠模式`, '#7cc4ff', easeOut(prog(t, 21.5, 22)) * (1 - prog(t, 29, 29.6)));
    chip(980, 420, '健康', '夜间监测已开启', '#c7a7ff', easeOut(prog(t, 23.8, 24.3)) * (1 - prog(t, 29, 29.6)));
    chip(1000, 120, '灯光', `${Math.round(lerp(60, 0, k))}%`, '#ffd27a', easeOut(prog(t, 19.4, 19.9)) * (1 - prog(t, 25.4, 26)));
    const e = ease(prog(t, 32.6, 34.2)); if (e > 0) { ctx.fillStyle = `rgba(0,0,0,${e})`; ctx.fillRect(0, 0, W, H) }
    alpha(win(t, 34.2, 37, .8), () => { txt('未来的一天', W / 2, H / 2, 72, '#ffffff', 700, 'center') });
  }
  SCENES.push({
    time: '23:00', title: '入睡', dur: DUR, subs: SUBS, tagTo: 32.6, draw(t) {
      if (t < 18.4) ui(t);
      if (t >= 17.8) alpha(ease(prog(t, 17.8, 18.4)), () => room(t));
    }
  });
})();
