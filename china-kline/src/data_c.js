// C 版（自己看，到清帝退位）：在 data.js（A 版）基础上修改
// 长期趋势系数的斜率放大 30%（1.8 → 2.34）；所有下跌只跌到原来深度的六成，数据更好看
// 只做到 1912 年清帝退位，之后的事一概不提
(function () {
  const find = t => EVENTS.findIndex(e => e.t === t);
  EVENTS.splice(find('鸦片战争'));
  const E = (b, y, t, s, v, more) => EVENTS.push(Object.assign({ b, y, era: '清', t, s, v }, more));
  E(192, '1840', '鸦片战争', '国门洞开', 180);
  E(195, '1851', '太平天国战争', '江南人口锐减', 120);
  E(199, '1877', '丁戊奇荒', '饿殍千万', 110);
  E(203, '1894', '甲午战败', '割地赔款', 108);
  E(207, '1900', '庚子国变', '八国联军', 105);
  E(211, '1901', '清末新政', '废科举 · 兴学堂', 120);
  E(216, '1912', '清帝退位', '帝制终结', 125, { last: true, big: ['清帝退位', '1912 · 两千年帝制终结'] });
  // 下跌只跌六成：跌的时候从上一根（已调整的）位置往原目标走 60%；涨的时候至少涨到原目标
  let po = null, pn = null;
  EVENTS.forEach(e => {
    const v = e.v;
    if (po !== null) e.v = v < po ? .6 * v + .4 * pn : Math.max(v, pn * (1 + (v / po - 1) * .5));
    po = v; pn = e.v;
  });
  // 高光强调音：一件大事直接拉起来的大阳线；陨落：安史之乱，从开元盛世的巅峰跌下来
  ['开元盛世', '清明上河'].forEach(t => { EVENTS[find(t)].hit = true });
  Object.assign(EVENTS[find('安史之乱')], { big: ['安史之乱', '755 · 盛世崩塌'], fall: true });
  CHAPTERS[5] = { name: '晚清', b0: 192, mark: '清' };
  PANO_LABELS.length = 0;
  [['大禹治水', '开盘'], ['文景之治', '文景'], ['汉末三国', '三国'], ['开元盛世', '开元'], ['清明上河', '巅峰'],
   ['小冰期', '明末'], ['康雍乾', '康乾'], ['清帝退位', '收盘']].forEach(([t, l]) => PANO_LABELS.push({ i: find(t), t: l }));
  Object.assign(VERSION, {
    span: '前2070 – 1912', years: 2070 + 1912 - 1, endYear: '1912', ddText: '',
    pano: { lo: 80, hi: 950, grid: [100, 200, 400, 800] },
  });
})();
TREND_SLOPE = 2.34;
