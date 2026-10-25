# 如果中国历史是一只股票 · 民生 K 线短视频

仿《如果霍去病是一只股票》的竖屏短视频。人民史观：百姓日子好就涨，苦就跌。方案见 [PLAN.md](PLAN.md)。

- **A 版（抖音）**：夏 → 1949 年，1080×1920 / 30fps，约 2 分 26 秒，只有背景音乐，没有配音。
- **B 版（自己看）**：夏 → 今天，约 3 分 04 秒。1949 年以前补了侯景之乱、国共内战，明清易代、宋金元战争写明具体事件；1949 年以后分“新中国”“改革开放”两章。

- **C 版（自己看）**：夏 → 1912 年清帝退位，约 2 分 26 秒。趋势系数斜率放大 30%，所有下跌只跌原来深度的六成，收在 415（A 版同期约 320）。

- **姜子牙版**：《如果姜子牙是一只股票》，约前1156 → 清，约 2 分 26 秒。生前依据《史记·齐太公世家》等，身后按历代封号祭祀（唐封武成王、明初罢祀、《封神演义》）。数据在 `src/data_jzy.js`，预览加 `?jzy`，渲染加 `VER=jzy`。

- **霍去病版**：前140 → 前117（去世收盘），数据在 `src/data_huo.js`（`?huo` / `VER=huo`）。
- **国足版**：1957 → 2025，只写比赛成绩，数据在 `src/data_gz.js`（`?gz` / `VER=gz`）。
- **李世民版**：598 → 649（去世收盘），数据在 `src/data_lsm.js`（`?lsm` / `VER=lsm`）。
- **苏轼版**：1037 → 1101，指数按仕途与声望，数据在 `src/data_ss.js`（`?ss` / `VER=ss`）。
- **项羽版**：前232 → 前202（乌江自刎收盘），数据在 `src/data_xy.js`（`?xy` / `VER=xy`）。
- **大唐版**：618 → 907，指数按国力与声望，8 章、片长 184 秒，数据在 `src/data_tang.js`（`?tang` / `VER=tang`）。
- **司马懿版**：179 → 251，指数按权势与声望，不采用《三国演义》情节，数据在 `src/data_smy.js`（`?smy` / `VER=smy`）。

所有画面都由代码逐帧绘制（Canvas 2D，原生 JS）。

## 目录
| 路径 | 内容 |
|---|---|
| `src/film.html` | 入口。双击用浏览器打开就能预览；把配乐拷一份到 `china-kline/bgm.mp3` 会同步播放。空格暂停，←/→ 跳 2 秒 |
| `src/data_b.js` | B 版在 A 版基础上的修改和 1949 年以后的数据；预览时地址后加 `?b`，渲染时命令前加 `VER=b` |
| `src/data_c.js` | C 版的修改；预览加 `?c`，渲染加 `VER=c` |
| `src/data.js` | **内容都在这里**：节拍、章节、每根大 K 线（年份、标注、副标题、指数）、全景标注、快讯文字 |
| `src/film.js` | 画面绘制：开场、交易界面、K 线、印章、大字转场、全景、复盘报告、结束语 |
| `src/render.js` | 渲染成 MP4（带配乐）或导出截图 |
| `fonts/` | 思源宋体 / 思源黑体（只含片中用到的字）、JetBrains Mono |
| `tools/make_fonts.py` | 改了文字后重新生成字体子集 |

配乐和 kline-video 技能放在一起：`.claude/skills/kline-video/bgm.mp3`。

## 踩点
配乐约 112.8 BPM，第 b 拍的时间 = 0.365 + b × 0.5319 秒，每 32 拍（8 小节，约 17 秒）一个乐句。`data.js` 里所有时间都用拍子写：
- 第 0–32 拍：开场（标题 → 股票信息卡 → 集合竞价），第 32 拍鼓点进来时开盘（17.4 秒，和原视频一样）
- 第 32、64、96、128、160、192 拍：六个章节（先秦、秦汉、魏晋隋唐、宋元、明清、近代），各占一个乐句
- 第 224 拍：“四千年”，全景走势 + 复盘报告；第 256 拍：结束语“民为邦本，本固邦宁”，“未完待续”
- 每根大 K 线都从一拍开始；大字转场（白骨露于野、开元盛世、清明上河、小冰期、山河破碎）都在小节重拍上

## 渲染
    npm i playwright && npx playwright install chromium   # 另需 ffmpeg
    cd src
    BGM=../../.claude/skills/kline-video/bgm.mp3
    node render.js video ../out/china-kline-A.mp4 $BGM   # 整片，约 3 分钟
    node render.js clip 30 50 ../out/clip.mp4 $BGM       # 只渲染 30–50 秒
    node render.js stills 18 60 130                            # 截图 → src/stills/
    VER=b node render.js video ../out/china-kline-B.mp4 $BGM   # B 版整片

改了 `data.js` 或 `film.js` 里的中文后，重新生成字体子集（需要 `pip install fonttools brotli` 和 `npm pack @fontsource/noto-serif-sc @fontsource/noto-sans-sc` 解压后的目录）：

    python tools/make_fonts.py <fontsource-noto-serif-sc 目录> x 900 fonts/NotoSerifSC-900.woff2 src/data.js src/film.js
    （700 字重和 noto-sans-sc 的 400/500/700 同理）
