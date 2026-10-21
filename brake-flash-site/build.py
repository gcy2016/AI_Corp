#!/usr/bin/env python3
"""C589/C363 刷写包自助站构建脚本.

以后更新(V1.5...)时:
  1. 把新版压缩包解压到本目录, 改下面的 VER(手册路径/文件名、页面上的版本号和手册按钮都跟着变);
     如果新版文件夹或手册的命名规则变了, 再改 GUIDE_DIR / SRC_ROOT / MANUAL_SRC
  2. 在 pkg_data.json 里增删改条目(字段: pt动力类型 / model车型 / part硬件件号 /
     src源文件夹相对路径 / cfg配置字 / wheel轮速协议 / flow流程类型)
     flow 取值: fuel(燃油) / bosch(伯特利) / hybrid_both(伯特利+大陆双流程)
     slug 字段: 纯 ASCII, 用于生成 zip 文件名, 新增条目时手动编一个
  3. 运行: python3 build.py        (只重建页面: python3 build.py html)
     任何一个源文件夹或手册找不到都会直接报错退出, 不生成任何东西, 按提示修好再跑
  4. 把 dist/ 下的 index.html + packages/ 上传到 COS 存储桶对应位置覆盖即可, 网址不变

页面是"三步选择器": ①选车型 → ②选件号 → ③出现下载按钮,
用纯 CSS 驱动, 零 JS, 当网页打开/当文件下载下来打开都能点:
车型用 radio + :checked; 件号是页内锚点链接, 点了靠浏览器自带的锚点跳转滚到下载卡片,
卡片用 :target 显示(有的手机浏览器不跑脚本, 所以不靠 JS 滚动).
件号展示时去掉用户内部版本标记 "_SW..." 后缀(售后不需要看).
"""
import json
import os
import re
import shutil
import sys
import zipfile
from html import escape

HERE = os.path.dirname(os.path.abspath(__file__))
VER = "V1.4"
GUIDE_DIR = os.path.join(HERE, "C589及C363系列制动控制模块售后换件指南 %s" % VER)
SRC_ROOT = os.path.join(GUIDE_DIR, "软件刷写包_根据车型及硬件件号选择")
DIST = os.path.join(HERE, "dist")

# COS 固定下载基地址(永久不变, 二维码背后就是它; 下载链接必须用绝对地址,
# 这样页面即使被手机当文件下载下来打开, 下载按钮依然有效)
COS_BASE = "https://c589-c363-brake-pkg-1497637272.cos-website.ap-chongqing.myqcloud.com/packages/"

MANUAL_SRC = os.path.join(GUIDE_DIR, "指导手册%s.pdf" % VER)
MANUAL_NAME = "C589_C363_guide_%s.pdf" % VER

FUEL_STEPS_BODY = """1. 诊断仪进入 EPBi 特殊功能 → 车型配置，按下方配置字选择
2. EPBi 特殊功能 → 轮速配置，按下方轮速协议选择（四代逸动跳过此步）
3. EPBi 特殊功能 → 惯性传感器标定
4. EPS 特殊功能 → 转角传感器标定
5. 踩住制动踏板，连续拉起/释放手刹 4 个循环以上 → 卡钳装配学习（挡位置于 N 档；无手刹硬开关则跳过）
6. 清除故障码，再读取 EPBi 确认无故障码
注：如更换过悬架/转向柱/方向盘，先做四轮定位，车辆停在水平地面、方向盘与车轮回正后再做第 3、4 步。"""

BOSCH_STEPS_BODY = """1. 诊断仪进入 IBCU 特殊功能 → 人工排气，按诊断仪提示操作
2. IBCU 特殊功能 → 加注状态配置：选择"加注完成并成功"
3. IBCU 特殊功能 → 装配模式配置：选择"退出装配模式"
4. IBCU 特殊功能 → 车型配置，按下方配置字选择（欧尚520 无需此步）
5. SRS 特殊功能 → 惯性传感器标定
6. EPS 特殊功能 → 转角传感器标定
7. 踩住制动踏板，连续拉起/释放手刹 4 个循环以上 → 卡钳装配学习（挡位置于 N 档）
8. 清除故障码，再读取 IBCU 确认无故障码
注：如更换过悬架/转向柱/方向盘，先做四轮定位，车辆停在水平地面、方向盘与车轮回正后再做第 5、6 步。"""

CONTI_STEPS_BODY = """1. 诊断仪进入 IBCU 特殊功能 → 人工排气，按诊断仪提示操作
2. IBCU 特殊功能 → 真空加注字节写入：选择"加注完成并成功"
3. IBCU 特殊功能 → PSM 状态写入：02
4. IBCU 特殊功能 → 车型配置，按下方配置字选择
5. SRS 特殊功能 → 惯性传感器标定
6. EPS 特殊功能 → 转角传感器标定
7. 踩住制动踏板，连续拉起/释放手刹 4 个循环以上 → 卡钳装配学习（挡位置于 N 档）
8. 清除故障码，再读取 IBCU 确认无故障码
注：如更换过悬架/转向柱/方向盘，先做四轮定位，车辆停在水平地面、方向盘与车轮回正后再做第 5、6 步。"""


def show_part(p):
    """售后展示用件号: 去掉用户内部版本标记 '_SW...' / '-SWD...' 之后的一坨, 售后不需要看."""
    i = p.find("_SW")
    if i != -1:
        return p[:i]
    j = p.find("-SWD")
    if j != -1:
        return p[:j]
    return p


def calib_txt(d, fuel_ms, bosch_ms, hyb_ms):
    head = "车型：%s\n硬件件号：%s\n" % (d["model"], d["part"])
    if d.get("cfg"):
        head += "配置字：%s\n" % d["cfg"]
    if d.get("wheel"):
        head += "轮速协议：%s\n" % d["wheel"]
    flow = d["flow"]
    if flow == "fuel":
        title = "刷写后标定步骤（燃油车型：%s）——必须做，否则故障灯亮" % " / ".join(fuel_ms)
        return head + "\n" + title + "\n" + FUEL_STEPS_BODY + "\n"
    if flow == "hybrid_both":
        return (head + "\n【请先确认车辆是否带智驾功能】\n"
                "不带智驾 → 按下面【伯特利流程】；带智驾 → 按下面【大陆流程】\n\n"
                "========== 伯特利流程 ==========\n"
                "刷写后标定步骤（伯特利系统：%s）——必须做\n" % " / ".join(bosch_ms) + BOSCH_STEPS_BODY +
                "\n\n========== 大陆流程 ==========\n"
                "刷写后标定步骤（大陆系统：%s）——必须做\n" % " / ".join(hyb_ms) + CONTI_STEPS_BODY + "\n")
    title = "刷写后标定步骤（伯特利系统：%s）——必须做" % " / ".join(bosch_ms)
    return head + "\n" + title + "\n" + BOSCH_STEPS_BODY + "\n"


def render_index(data, fuel_ms, bosch_ms, hyb_ms):
    """三步选择器页面: ①选车型 → ②选件号 → ③下载按钮出现.
    车型: radio + :checked; 件号: 锚点链接 → 跳到始终占位的 .tg 锚点(高 0),
    紧跟其后的下载卡片用 :target 显示. 锚点本身一直可见, 跳转不依赖"先显示后滚动"的时序."""
    groups = []  # [(pt, model, [entries])]
    for d in data:
        if groups and groups[-1][1] == d["model"]:
            groups[-1][2].append(d)
        else:
            groups.append([d["pt"], d["model"], [d]])
    for pt, model, entries in groups:
        shown = [show_part(d["part"]) for d in entries]
        assert len(set(shown)) == len(shown), "去SW后缀后件号在该车型下不唯一: %s %s" % (model, shown)

    cx_radios = []
    css_step2, css_sel_m, css_sel_p, css_pg, css_dl = [], [], [], [], []
    s1_labels, pg_divs, dlcards = [], [], []

    for mi, (pt, model, entries) in enumerate(groups):
        cx_radios.append('<input type="radio" name="cx" id="cx%d" class="hx">' % mi)
        s1_labels.append('<label class="opt" for="cx%d">%s</label>' % (mi, escape(model)))
        css_step2.append('#cx%d:checked~#step2' % mi)
        css_sel_m.append('#cx%d:checked~.s1 label[for="cx%d"]' % (mi, mi))
        pgs = []
        for pi, d in enumerate(entries):
            pid = 'pn%d_%d' % (mi, pi)
            pgs.append('<a class="opt" href="#t_%s">%s</a>' % (pid, escape(show_part(d["part"]))))
            css_sel_p.append('body:has(#t_%s:target) a[href="#t_%s"]' % (pid, pid))
            css_dl.append('#cx%d:checked~#dlzone #t_%s:target+#dl%s' % (mi, pid, pid))
            url = COS_BASE + "C589_%s.zip" % d["slug"]
            meta = []
            if d.get("cfg"):
                meta.append("配置字：" + escape(d["cfg"]))
            if d.get("wheel"):
                meta.append("轮速协议：" + escape(d["wheel"]))
            dlcards.append(
                '  <div class="tg" id="t_%s"></div>\n'
                '  <div class="dlcard" id="dl%s">\n'
                '    <div class="step-h"><span class="n">3</span>下载刷写包</div>\n'
                '    <div class="carmodel">车型：%s</div>\n'
                '    <div class="part">%s</div>\n'
                '    <div class="meta">%s</div>\n'
                '    <a class="dl" href="%s">⬇ 下载刷写包</a>\n'
                '  </div>' % (pid, pid, escape(d["model"]), escape(show_part(d["part"])), "<br>".join(meta), url))
        pg_divs.append('  <div class="grid pgs" id="pg%d">\n%s\n  </div>' % (mi, "\n".join(pgs)))
        css_pg.append('#cx%d:checked~#step2 #pg%d' % (mi, mi))

    sections = (
        "\n".join(cx_radios) + "\n"
        '<div class="step s1">\n'
        '  <div class="step-h"><span class="n">1</span>选择车型</div>\n'
        '  <div class="grid">\n' + "\n".join(s1_labels) + '\n  </div>\n</div>\n'
        '<div class="step s2" id="step2">\n'
        '  <div class="step-h"><span class="n">2</span>选择硬件件号 <span class="hint">(硬件标签上的 3550100 / 3505200 开头编号)</span></div>\n'
        + "\n".join(pg_divs) + '\n</div>\n'
        '<div id="dlzone">\n' + "\n".join(dlcards) + '\n</div>')

    sel = '{border-color:#2e75b6;background:#eaf3fd;color:#1f4e78;font-weight:700;}'
    pickcss = (
        '#step2{display:none;}\n'
        + ','.join(css_step2) + '{display:block;}\n'
        + ','.join(css_sel_m) + sel + '\n'
        # 选中件号高亮用 :has(), 老浏览器不认时只是不高亮(单独一条规则, 不连累别的)
        + ','.join(css_sel_p) + sel + '\n'
        + ','.join(css_pg) + '{display:grid;}\n'
        + ','.join(css_dl) + '{display:block;}\n')


    with open(os.path.join(HERE, "template.html"), encoding="utf-8") as f:
        tpl = f.read()
    html = (tpl.replace("__SECTIONS__", sections)
               
               .replace("__VER__", VER)
               .replace("__PICKCSS__", pickcss))
    html = html.replace("__MANUAL_URL__", COS_BASE + MANUAL_NAME)
    assert "__MANUAL_URL__" not in html
    for ph in ("__SECTIONS__", "__VER__", "__PICKCSS__", "__MANUAL_URL__"):
        assert ph not in html, "模板占位符未替换: " + ph
    assert "<script" not in html, "页面不放脚本(有的手机浏览器不跑), 跳转靠锚点"
    assert len(re.findall(r'<input[^>]*name="cx"', html)) == len(groups), "车型 radio 数量不对"
    assert len(re.findall(r'<a class="opt" href="#t_pn', html)) == len(data), "件号链接数量不对"
    assert html.count('class="tg"') == len(data), "锚点数量不对"
    assert html.count('class="dlcard"') == len(data), "下载卡片数量不对"
    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("done: index.html (%d bytes, %d models, %d entries, no script)"
          % (len(html.encode("utf-8")), len(groups), len(data)))


def flow_models(data, *flows):
    out = []
    for d in data:
        if d["flow"] in flows and d["model"] not in out:
            out.append(d["model"])
    return out


def main(html_only=False):
    with open(os.path.join(HERE, "pkg_data.json"), encoding="utf-8") as f:
        data = json.load(f)

    fuel_ms = flow_models(data, "fuel")
    bosch_ms = flow_models(data, "bosch")
    hyb_ms = flow_models(data, "hybrid_both")

    if not html_only:
        # 先查齐所有源文件夹和手册, 缺任何一个都不动 dist/ 直接退出:
        # 否则页面上会有一个点了 404 的下载按钮, 上传后只能等售后打电话才发现
        missing = [d["src"] for d in data if not os.path.isdir(os.path.join(SRC_ROOT, d["src"]))]
        if not os.path.isfile(MANUAL_SRC):
            missing.append(MANUAL_SRC)
        if missing:
            sys.exit("!! 以下源文件夹/手册找不到, 未生成任何文件:\n   " + "\n   ".join(missing))

        pkg_dir = os.path.join(DIST, "packages")
        shutil.rmtree(DIST, ignore_errors=True)
        os.makedirs(pkg_dir)

        for d in data:
            zip_name = "C589_%s.zip" % d["slug"]
            assert all(ord(c) < 128 for c in zip_name), "slug 必须为纯 ASCII: " + zip_name
            d["zip"] = "packages/" + zip_name
            src = os.path.join(SRC_ROOT, d["src"])
            txt_name = ("刷写后标定步骤_%s_%s.txt" % (d["model"], d["part"])).replace("/", "_").replace(" ", "")
            with zipfile.ZipFile(os.path.join(pkg_dir, zip_name), "w", zipfile.ZIP_DEFLATED) as z:
                for root, _, files in os.walk(src):
                    for fn in files:
                        fp = os.path.join(root, fn)
                        z.write(fp, os.path.basename(fp))
                z.writestr(txt_name, calib_txt(d, fuel_ms, bosch_ms, hyb_ms).encode("utf-8"))
            print("ok  " + zip_name)
        shutil.copy(MANUAL_SRC, os.path.join(pkg_dir, MANUAL_NAME))
        print("ok  " + MANUAL_NAME)
        print("done: %d packages -> %s/" % (len(data), DIST))
    else:
        os.makedirs(DIST, exist_ok=True)

    render_index(data, fuel_ms, bosch_ms, hyb_ms)


if __name__ == "__main__":
    main(html_only=len(sys.argv) > 1 and sys.argv[1] == "html")
