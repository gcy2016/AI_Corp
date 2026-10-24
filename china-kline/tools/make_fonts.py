"""从 @fontsource 的分片字体中，抽出片中用到的字，合并成一个小字体文件
  python make_fonts.py <fontsource 包目录> <family 名> <字重> <输出.woff2> <文本文件...>
例：python make_fonts.py fontsource-noto-serif-sc-5.3.1 noto-serif-sc 900 ../fonts/NotoSerifSC-900.woff2 ../src/data.js ../src/film.js
"""
import sys, re, pathlib, io
from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

pkg, fam, wt, out, *srcs = sys.argv[1:]
pkg = pathlib.Path(pkg)
chars = set(chr(c) for c in range(0x20, 0x7f))
for s in srcs: chars |= set(pathlib.Path(s).read_text(encoding='utf-8'))
chars = {c for c in chars if c >= ' '}
css = (pkg / f'{wt}.css').read_text()
parts = []
for block in css.split('@font-face')[1:]:
    url = re.search(r"url\(\./files/([^)]+?\.woff2)\)", block).group(1)
    rng = re.search(r"unicode-range:\s*([^;]+);", block).group(1)
    cps = set()
    for r in rng.split(','):
        r = r.strip()[2:]
        a, _, b = r.partition('-'); a = int(a, 16); b = int(b, 16) if b else a
        cps |= {cp for cp in range(a, b + 1)}
    need = {c for c in chars if ord(c) in cps}
    if not need: continue
    f = TTFont(pkg / 'files' / url)
    opt = subset.Options(); opt.layout_features = []; opt.drop_tables += ['GSUB', 'GPOS', 'BASE', 'STAT', 'vhea', 'vmtx']
    opt.name_IDs = ['*']; opt.notdef_outline = True
    ss = subset.Subsetter(opt); ss.populate(text=''.join(need)); ss.subset(f)
    b = io.BytesIO(); f.flavor = None; f.save(b); b.seek(0); parts.append(b)
    chars -= need
merged = Merger().merge(parts)
merged.flavor = 'woff2'; merged.save(out)
print(out, 'parts', len(parts), 'missing', ''.join(sorted(c for c in chars if ord(c) > 0x7f)))
