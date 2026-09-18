# -*- coding: utf-8 -*-
import io, json, html, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
T = json.load(io.open('ladders.json', encoding='utf-8'))
E = lambda s: html.escape(str(s))

rows = []
for name, ind, note, stop, rungs in T:
    real = [r for r in rungs if r[1] > 0]
    branch = [r for r in rungs if r[1] == 0]
    rows.append(dict(name=name, ind=ind, note=note, stop=stop, rungs=real, branch=branch,
                     yrs=sum(r[2] for r in real), mult=real[-1][1] / real[0][1]))
rows.sort(key=lambda r: -r['mult'])
mx = max(r['mult'] for r in rows)


def ladder(r):
    out = []
    for i, (rn, g, y) in enumerate(r['rungs']):
        cls = 'rung'
        if i + 1 == r['stop']:
            cls += ' stop'
        if i == len(r['rungs']) - 1:
            cls += ' top'
        yr = ('+' + str(y) + ' 年') if y else '顶'
        out.append('<li class="%s"><span class="rk">%s</span><span class="rg">%s</span><span class="ry">%s</span></li>'
                   % (cls, E(rn), format(g, ','), yr))
    return ''.join(out)


cards = []
for r in rows:
    bar = int(round(r['mult'] / mx * 100))
    tone = 'hi' if r['mult'] >= 8 else ('lo' if r['mult'] <= 3 else '')
    br = ''.join('<p class="branch">分支线：%s</p>' % E(b[0]) for b in r['branch'])
    cards.append(
        '<section class="track"><header><h3>%s<em>%s</em></h3>'
        '<div class="stat"><span class="mult %s">%.1f×</span>'
        '<span class="yrs">爬满 %d 年</span><span class="cnt">%d 格</span></div></header>'
        '<div class="spread"><i style="width:%d%%"></i></div>'
        '<p class="note">%s</p><ol class="rungs">%s</ol>%s</section>'
        % (E(r['name']), E(r['ind']), tone, r['mult'], r['yrs'], len(r['rungs']), bar,
           E(r['note']), ladder(r), br))

summary = ''.join(
    '<tr><td>%s</td><td class="n">%d</td><td class="n">%s</td><td class="n">%s</td>'
    '<td class="n %s">%.1f×</td><td class="n">%d</td><td class="n">第 %d 格</td></tr>'
    % (E(r['name']), len(r['rungs']), format(r['rungs'][0][1], ','), format(r['rungs'][-1][1], ','),
       'hi' if r['mult'] >= 8 else ('lo' if r['mult'] <= 3 else ''), r['mult'], r['yrs'], r['stop'])
    for r in rows)

CSS = """
:root{--paper:#efece4;--panel:#f6f4ee;--panel2:#e9e5da;--line:#d5cfc0;--line2:#c4bcaa;
 --ink:#23211d;--ink2:#5c574d;--ink3:#8b8578;--seal:#a83a30;--note:#4a6480;}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#141517;--panel:#1b1d21;
 --panel2:#232529;--line:#2e3137;--line2:#3d4149;--ink:#ddd9d1;--ink2:#98938a;--ink3:#6d6961;
 --seal:#c2554a;--note:#7d9ab8;}}
:root[data-theme="dark"]{--paper:#141517;--panel:#1b1d21;--panel2:#232529;--line:#2e3137;
 --line2:#3d4149;--ink:#ddd9d1;--ink2:#98938a;--ink3:#6d6961;--seal:#c2554a;--note:#7d9ab8;}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
 font:400 14px/1.75 "Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif}
.wrap{max-width:1120px;margin:0 auto;padding:34px 20px 80px}
h1{font-family:"Noto Serif SC",serif;font-weight:600;font-size:22px;letter-spacing:.18em;margin:0}
h1::after{content:"";display:block;width:46px;height:2px;background:var(--seal);margin-top:11px}
.sub{color:var(--ink3);font-size:12px;letter-spacing:.09em;margin:12px 0 26px;
 font-family:"IBM Plex Mono",monospace}
.lead{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--seal);
 border-radius:3px;padding:16px 20px;margin-bottom:28px;max-width:64ch;line-height:1.95}
.lead b{color:var(--seal);font-weight:500}
h2{font-family:"Noto Serif SC",serif;font-weight:600;font-size:15px;letter-spacing:.16em;
 margin:34px 0 12px;padding-bottom:7px;border-bottom:1.5px solid var(--line2)}
.tblwrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px}
th{text-align:left;color:var(--ink3);font-weight:400;font-size:10.5px;letter-spacing:.14em;
 padding:6px 8px;border-bottom:1px solid var(--line2)}
th.r{text-align:right}
td{padding:5px 8px;border-bottom:1px dotted var(--line)}
td.n{text-align:right;font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums}
.hi{color:var(--seal)} .lo{color:var(--note)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}
.track{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:14px 16px}
.track header{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.track h3{font-family:"Noto Serif SC",serif;font-weight:600;font-size:15px;margin:0}
.track h3 em{font-style:normal;color:var(--ink3);font-size:11px;margin-left:8px;
 font-family:"Noto Sans SC",sans-serif}
.stat{text-align:right;flex-shrink:0;font-family:"IBM Plex Mono",monospace;
 font-variant-numeric:tabular-nums}
.stat .mult{font-size:16px;display:block}
.stat .mult.hi{color:var(--seal)} .stat .mult.lo{color:var(--note)}
.stat .yrs,.stat .cnt{font-size:10.5px;color:var(--ink3);margin-left:6px}
.spread{height:3px;background:var(--panel2);border-radius:2px;overflow:hidden;margin:9px 0 8px}
.spread i{display:block;height:100%;background:var(--seal);opacity:.75}
.note{color:var(--ink2);font-size:12.5px;line-height:1.8;margin:0 0 11px}
.rungs{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.rungs li{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:baseline;
 padding:4px 0 4px 14px;border-bottom:1px dotted var(--line);position:relative;font-size:12.5px}
.rungs li::before{content:"";position:absolute;left:2px;top:11px;width:5px;height:5px;
 border-radius:50%;background:var(--line2)}
.rungs li.stop::before{background:var(--seal);outline:3px solid var(--panel2)}
.rungs li.stop .rk{color:var(--seal)}
.rungs li.stop .rk::after{content:"　多数人停在这";font-size:10.5px;color:var(--ink3)}
.rungs li.top .rk{font-weight:500}
.rg{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;color:var(--ink2)}
.ry{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--ink3);
 min-width:44px;text-align:right}
.branch{color:var(--ink3);font-size:11.5px;margin:8px 0 0;padding-left:13px;
 border-left:2px solid var(--line2)}
.foot{color:var(--ink3);font-size:11.5px;margin-top:30px;line-height:1.9;max-width:64ch}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
"""

HEAD = ('<title>职业阶梯表</title>\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
        'family=Noto+Serif+SC:wght@500;600&family=Noto+Sans+SC:wght@300;400;500'
        '&family=IBM+Plex+Mono:wght@400;500&display=swap">\n')

LEAD = ('<div class="lead">每条线都有梯子。区别在于<b>梯子有多矮、多挤、爬多久，以及爬上去值不值</b>。<br>'
        '保安物业七格，二十四年，从 4400 爬到 12000。券商投行八格，十九年，从 4000 爬到 80000。<br>'
        '同样是爬到顶，一个换来 2.7 倍，一个换来 20 倍。<br><br>'
        '标红的那一格是<b>多数人停下来的地方</b> —— 这个数字对玩家隐藏，只以传闻形式出现。</div>')

FOOT = ('<p class="foot">入口决定天花板：同一条公务员线，乡镇进的锁在正科，定向选调进的能到正厅。<br>'
        '薪资是杭州基准税前，引擎按城市系数换算（北京 ×1.35 … 县城 ×0.60）。<br>'
        '升职成功率 = 台阶基础难度 + 在岗年限 + 绩效 + 专业等级余量 + 领导关系 + 名额 − 竞争者。'
        '失败只扣数值。</p>')

TH = ('<thead><tr><th>职业线</th><th class="r">格数</th><th class="r">起薪</th><th class="r">顶薪</th>'
      '<th class="r">倍数</th><th class="r">爬满(年)</th><th class="r">多数人停在</th></tr></thead>')

doc = (HEAD + '<style>' + CSS + '</style>\n<div class="wrap">\n'
       + '<h1>职 业 阶 梯 表</h1>\n'
       + '<div class="sub">现实纪元 · 35 条职业线 · 253 个职级 · 杭州基准税前月薪</div>\n'
       + LEAD
       + '<h2>全 表 · 按 倍 数 排</h2>\n<div class="tblwrap"><table>' + TH + '<tbody>' + summary + '</tbody></table></div>\n'
       + '<h2>逐 条 职 级</h2>\n<div class="grid">' + ''.join(cards) + '</div>\n'
       + FOOT + '\n</div>')

io.open('ladders.html', 'w', encoding='utf-8').write(doc)
print('ladders.html %d bytes, %d tracks' % (len(doc), len(rows)))
