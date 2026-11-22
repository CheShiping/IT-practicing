import io, os

OUT = ".impeccable/mocks/decision"
os.makedirs(OUT, exist_ok=True)

BASE = """
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:390px;height:844px;overflow:hidden}
body{font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.num{font-variant-numeric:tabular-nums}
.serif{font-family:"Songti SC",SimSun,"Noto Serif CJK SC",serif}
"""

def w(name, body, extra_css=""):
    html = f"""<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<style>{BASE}{extra_css}</style></head><body>{body}</body></html>"""
    io.open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8").write(html)
    print("wrote", name, len(html))

# ============================================================ ① 打孔卡（assigned）
# 布局：没有列表也没有底部导航 —— 每一行是「一条打孔带」，带子本身就是导航
chapters = [
    ("01", "计算机基础知识", 332, [1, 1, 1, 1, 0, 0], 165),
    ("02", "操作系统", 343, [1, 0, 0, 0, 0, 0], 12),
    ("03", "Office 办公软件", 729, [0, 0, 0, 0, 0, 0, 0], 0),
    ("04", "计算机网络基础", 242, [0, 0, 0, 0, 0, 0], 0),
    ("05", "多媒体技术基础", 142, [0, 0, 0, 0, 0], 0),
    ("06", "信息安全", 99, [0, 0, 0, 0, 0], 0),
    ("07", "新一代信息技术", 47, [0, 0, 0, 0], 0),
]
rows = ""
for no, name, total, cells, done in chapters:
    holes = "".join(f'<i class="{"p" if c else ""}"></i>' for c in cells)
    rows += (f'<li><span class="no num">{no}</span>'
             f'<span class="band">{holes}</span>'
             f'<span class="nm">{name}</span>'
             f'<span class="c num">{total}</span></li>')

w("assigned", f"""
<div class="desk">
  <div class="card">
    <span class="cut"></span>
    <div class="hd">
      <span class="no">NO. 0001</span>
      <span class="title">计基速刷</span>
      <span class="total num">1934</span>
    </div>
    <div class="rule"></div>
    <p class="meta">江西省统考 · 计算机（信息技术）</p>
    <p class="hint">每一格是一类题，打掉即已练过</p>

    <ul class="bands">{rows}</ul>

    <div class="legend">
      <span><i class="p"></i>已打孔</span>
      <span><i></i>未开始</span>
      <span class="right num">已打 165 / 1934</span>
    </div>

    <div class="cta">开始刷题</div>
  </div>
</div>
""", """
.desk{width:390px;height:844px;background:#3b362c;display:flex;align-items:center;justify-content:center;padding:20px 16px}
.card{position:relative;width:358px;padding-bottom:20px;background:#efe9da;padding:18px 18px 0;box-shadow:0 12px 30px rgba(0,0,0,.36)}
.cut{position:absolute;left:0;top:0;width:0;height:0;border-top:18px solid #3b362c;border-right:18px solid transparent}
.hd{display:flex;align-items:baseline;gap:8px}
.hd .no{font-size:9px;letter-spacing:.16em;color:#2b5d4a;font-weight:700}
.hd .title{font-size:17px;font-weight:700;color:#1b1a17}
.hd .total{margin-left:auto;font-size:11px;color:#6b6353}
.rule{height:2px;background:#2b5d4a;margin-top:6px}
.meta{margin-top:6px;font-size:10px;color:#6b6353;letter-spacing:.05em}
.hint{margin-top:12px;font-size:9.5px;color:#8a8271;letter-spacing:.06em}
.bands{list-style:none;margin-top:6px}
.bands li{display:flex;align-items:center;gap:7px;padding:8px 0;border-bottom:1px solid #ded6c2}
.bands .no{font-size:9.5px;font-weight:700;color:#2b5d4a;width:15px;flex:none}
.bands .band{display:flex;gap:2px;flex:none}
.bands .band i{width:13px;height:17px;background:#efe9da;border:1px solid #cdc4ab;display:block}
.bands .band i.p{background:#2b5d4a;border-color:#2b5d4a}
.bands .nm{font-size:11.5px;color:#1b1a17;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0}
.bands .c{margin-left:auto;font-size:10px;color:#6b6353;flex:none}
.legend{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:9px;color:#6b6353}
.legend span{display:flex;align-items:center;gap:3px}
.legend i{width:9px;height:12px;border:1px solid #cdc4ab;display:block}
.legend i.p{background:#2b5d4a;border-color:#2b5d4a}
.legend .right{margin-left:auto;color:#1b1a17;font-weight:700}
.cta{margin-top:20px;height:46px;background:#1b1a17;color:#efe9da;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;letter-spacing:.06em}
""")

# ============================================================ ② 机考作答（pick）
# 布局：像答机考卷 —— 顶部状态条 + 题面 + 题号栅格在底部当导航 + 抬头的交卷
w("model-pick", """
<div class="app">
  <div class="statusbar">
    <span class="subj">计算机（信息技术）· 单项选择题</span>
    <span class="clock num">42:15</span>
  </div>
  <div class="body">
    <div class="qno"><span class="num">42</span><span class="of num">/181</span></div>
    <div class="stem serif">下列不属于网络基本拓扑结构的是（　）</div>
    <ul class="opts">
      <li><i></i><span class="k num">A</span><span class="t serif">主从型</span></li>
      <li class="on"><i></i><span class="k num">B</span><span class="t serif">星形</span></li>
      <li><i></i><span class="k num">C</span><span class="t serif">总线型</span></li>
      <li><i></i><span class="k num">D</span><span class="t serif">环形</span></li>
    </ul>
    <div class="note">点击下方题号可直接跳转</div>
  </div>
  <div class="dock">
    <div class="grid">
      <i class="done">1</i><i class="done">2</i><i class="done">3</i><i class="done">4</i><i class="done">5</i><i class="done">6</i><i class="done">7</i><i class="done">8</i><i class="done">9</i>
      <i class="done">10</i><i class="done">11</i><i class="done">12</i><i class="done">13</i><i class="done">14</i><i class="done">15</i><i class="done">16</i><i class="done">17</i><i class="done">18</i>
      <i class="done">19</i><i class="done">20</i><i class="done">21</i><i class="done">22</i><i class="done">23</i><i class="done">24</i><i class="done">25</i><i class="done">26</i><i class="done">27</i>
      <i class="done">28</i><i class="done">29</i><i class="done">30</i><i class="done">31</i><i class="done">32</i><i class="done">33</i><i class="done">34</i><i class="done">35</i><i class="done">36</i>
      <i class="done">37</i><i class="done">38</i><i class="done">39</i><i class="done">40</i><i class="done">41</i><i class="cur">42</i><i>43</i><i>44</i><i>45</i>
    </div>
    <div class="bar">
      <button class="ghost">上一题</button>
      <button class="solid">提交答案</button>
    </div>
  </div>
</div>
""", """
.app{width:390px;height:844px;background:#f2f1ee;display:flex;flex-direction:column}
.statusbar{display:flex;align-items:center;background:#1c1c1a;color:#fff;padding:11px 16px;font-size:11px}
.statusbar .subj{opacity:.8;overflow:hidden;white-space:nowrap}
.statusbar .clock{margin-left:auto;font-size:12.5px;letter-spacing:.08em;font-weight:700}
.body{flex:1;background:#fff;padding:18px 16px 0;display:flex;flex-direction:column}
.qno{display:flex;align-items:baseline;gap:3px}
.qno .num{font-size:26px;font-weight:700;color:#1c1c1a;line-height:1}
.qno .of{font-size:12px;color:#9a9892}
.stem{margin-top:12px;font-size:16px;line-height:1.85;color:#1c1c1a}
.opts{list-style:none;margin-top:12px;border-top:1px solid #e6e4df}
.opts li{display:flex;align-items:flex-start;gap:9px;padding:13px 0;border-bottom:1px solid #eceae5}
.opts i{width:16px;height:16px;border:1.5px solid #a9a7a1;border-radius:50%;margin-top:4px;flex:none;background:#fff}
.opts li.on i{border-color:#1c1c1a;border-width:5px}
.opts .k{font-size:11px;color:#a9a7a1;width:12px;margin-top:3px}
.opts li.on .k{color:#1c1c1a;font-weight:700}
.opts .t{font-size:15px;line-height:1.7;color:#1c1c1a}
.note{margin-top:auto;padding:10px 0 14px;font-size:10px;color:#b0aea8;text-align:center}
.dock{background:#f7f6f3;border-top:1px solid #d9d7d1;padding:10px 12px 16px}
.grid{display:grid;grid-template-columns:repeat(9,1fr);gap:3px}
.grid i{display:flex;align-items:center;justify-content:center;height:24px;border:1px solid #dcdad4;background:#fff;font-size:9.5px;font-style:normal;color:#9a9892}
.grid i.done{background:#1c1c1a;border-color:#1c1c1a;color:#fff}
.grid i.cur{border:2px solid #a8331f;color:#a8331f;font-weight:700}
.bar{display:flex;gap:8px;margin-top:12px}
.bar button{flex:1;height:46px;font-size:14px;font-family:inherit}
.bar .ghost{background:#fff;border:1px solid #c9c7c1;color:#1c1c1a}
.bar .solid{background:#1c1c1a;border:1px solid #1c1c1a;color:#fff;font-weight:700;flex:1.4}
""")

# ============================================================ ③ 索引卡盒
# 布局：一次只有一张卡，卡叠本身就是页面；没有列表、没有导航栏
w("grounded-cardbox", """
<div class="desk">
  <div class="head"><span class="num">142 / 242</span><span class="ttl">计算机网络基础</span><span class="x">收起</span></div>
  <div class="stack s3"></div>
  <div class="stack s2"></div>
  <div class="stack s1"></div>
  <div class="card">
    <span class="tab"></span>
    <span class="fold"></span>
    <div class="top"><span class="no num">NO. 0142</span><span class="kind">单项选择题</span></div>
    <div class="stem serif">下列不属于网络基本拓扑结构的是（　）</div>
    <ul class="opts">
      <li><b class="num">A</b><span class="serif">主从型</span></li>
      <li><b class="num">B</b><span class="serif">星形</span></li>
      <li><b class="num">C</b><span class="serif">总线型</span></li>
      <li><b class="num">D</b><span class="serif">环形</span></li>
    </ul>
    <div class="src">《必刷2000题》P62 · 答案 B</div>
  </div>
  <div class="nav">
    <span class="btn">← 上一张</span>
    <span class="dots"><i class="on"></i><i></i><i></i><i></i><i></i></span>
    <span class="btn">下一张 →</span>
  </div>
</div>
""", """
.desk{position:relative;width:390px;height:844px;background:#e7e1d4;padding:0 20px}
.head{display:flex;align-items:baseline;gap:10px;padding:16px 2px 0;font-size:11px;color:#6f654e}
.head .ttl{font-size:13px;font-weight:700;color:#2a261c}
.head .x{margin-left:auto;text-decoration:underline;text-underline-offset:3px}
.stack{position:absolute;left:20px;right:20px;height:470px;background:#fffdf6;border:1px solid #ddd5c2}
.s1{top:156px;transform:rotate(-1.2deg)}
.s2{top:162px;transform:rotate(1.5deg);opacity:.8}
.s3{top:168px;transform:rotate(-2.4deg);opacity:.55}
.card{position:relative;margin-top:150px;background:#fffdf6;border:1px solid #d8cfb9;padding:24px 20px 20px;box-shadow:0 2px 0 #d8cfb9,0 16px 28px rgba(60,50,30,.14)}
.tab{position:absolute;left:18px;top:-11px;width:78px;height:11px;background:#bfae86}
.fold{position:absolute;right:0;top:0;width:0;height:0;border-top:18px solid #e7e1d4;border-left:18px solid transparent}
.top{display:flex;align-items:baseline;justify-content:space-between}
.top .no{font-size:9.5px;letter-spacing:.16em;color:#8a7f66;font-weight:700}
.top .kind{font-size:10px;color:#8a7f66;border:1px solid #d8cfb9;padding:2px 6px}
.stem{margin-top:16px;font-size:17px;line-height:1.85;color:#2a261c}
.opts{list-style:none;margin-top:14px}
.opts li{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #efe9db;font-size:15.5px;line-height:1.7;color:#2a261c}
.opts b{font-size:11px;color:#8a7f66;font-weight:700;width:12px;margin-top:4px}
.src{margin-top:18px;font-size:9.5px;color:#a29880;letter-spacing:.05em}
.nav{display:flex;align-items:center;justify-content:space-between;margin-top:30px;font-size:12px;color:#6f654e}
.nav .btn{border-bottom:1px dashed #b5a988;padding-bottom:2px}
.dots{display:flex;gap:5px}
.dots i{width:5px;height:5px;border-radius:50%;background:#c9bda0}
.dots i.on{background:#6f654e;width:14px;border-radius:3px}
""")

# ============================================================ ④ 电子表格
# 布局：整页就是一张表 —— 列标行号、公式栏、筛选页签、状态栏；表格本身是导航
rows = [
    ("42", "计算机网络基础", "单选", "未做", "—", False),
    ("43", "计算机网络基础", "单选", "已对", "1/1", True),
    ("44", "计算机网络基础", "单选", "已错", "1/2", False),
    ("103", "Office 办公软件", "操作", "未做", "—", False),
    ("7", "计算机基础知识", "判断", "已对", "3/3", False),
    ("88", "操作系统", "多选", "已错", "1/3", False),
    ("12", "信息安全", "填空", "未做", "—", False),
    ("31", "多媒体技术基础", "单选", "未做", "—", False),
    ("56", "新一代信息技术", "单选", "已对", "2/2", False),
]
body_rows = ""
for i, r in enumerate(rows, start=2):
    cls = "sel" if r[5] else ""
    state = r[3]
    sc = "ok" if state == "已对" else ("bad" if state == "已错" else "nul")
    body_rows += (f'<div class="r {cls}"><span class="rn num">{i}</span>'
                  f'<span class="c num">{r[0]}</span><span class="c">{r[1]}</span>'
                  f'<span class="c">{r[2]}</span><span class="c {sc}">{state}</span>'
                  f'<span class="c num">{r[4]}</span></div>')

w("grounded-sheet", f"""
<div class="app">
  <div class="titlebar">
    <span class="nm">计基速速刷.xlsx</span>
    <span class="num">1934 行</span>
  </div>
  <div class="tabs">
    <span class="on">全部</span><span>未做</span><span>已错</span><span>收藏</span><span>统计</span>
  </div>
  <div class="fbar"><span class="ref num">B2</span><span class="fx">fx</span><span class="val serif">下列不属于网络基本拓扑结构的是（　）</span></div>
  <div class="grid">
    <div class="r hd"><span class="rn"></span><span class="c">A</span><span class="c">B</span><span class="c">C</span><span class="c">D</span><span class="c">E</span></div>
    <div class="r hd2"><span class="rn"></span><span class="c">题号</span><span class="c">专题</span><span class="c">题型</span><span class="c">状态</span><span class="c">已练</span></div>
    {body_rows}
  </div>
  <div class="status"><span>筛选：计算机网络基础</span><span class="num">242 题 · 已练 96</span></div>
  <div class="bar"><button class="solid">刷这一组（96 题）</button></div>
</div>
""", """
.app{width:390px;height:844px;background:#fff;display:flex;flex-direction:column}
.titlebar{display:flex;align-items:baseline;justify-content:space-between;padding:12px 14px 8px;border-bottom:1px solid #e2e2dc}
.titlebar .nm{font-size:13.5px;font-weight:700;color:#1d1d1b}
.titlebar .num{font-size:10.5px;color:#8a8a82}
.tabs{display:flex;border-bottom:1px solid #dcdcd6;background:#f7f7f4}
.tabs span{flex:1;text-align:center;padding:8px 0;font-size:11px;color:#6f6f68;border-right:1px solid #e8e8e2}
.tabs span.on{background:#fff;color:#1f6f4a;font-weight:700;box-shadow:inset 0 -2px 0 #1f6f4a}
.fbar{display:flex;align-items:center;gap:7px;padding:7px 10px;border-bottom:1px solid #dcdcd6;background:#fbfbf9}
.fbar .ref{font-size:10.5px;font-weight:700;color:#1f6f4a;width:32px}
.fbar .fx{font-size:10px;color:#8a8a82;font-style:italic;border-right:1px solid #dcdcd6;padding-right:7px}
.fbar .val{font-size:11.5px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grid{flex:1;overflow:hidden}
.r{display:grid;grid-template-columns:26px 40px 1fr 44px 44px 40px;border-bottom:1px solid #e8e8e2}
.r > span{padding:7px 5px;font-size:10.5px;border-right:1px solid #e8e8e2;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#333}
.r .rn{background:#f4f4f0;color:#8a8a82;text-align:center;font-size:9.5px}
.r.hd > span{background:#eef1ee;color:#5d6b62;text-align:center;font-size:9.5px}
.r.hd2 > span{background:#f4f4f0;color:#6f6f68}
.r.sel{outline:2px solid #1f6f4a;outline-offset:-2px;background:#f2f8f4}
.r.sel .rn{background:#1f6f4a;color:#fff}
.c.ok{color:#1f6f4a;font-weight:700}
.c.bad{color:#a8331f;font-weight:700}
.c.nul{color:#a0a099}
.status{display:flex;justify-content:space-between;padding:8px 10px;font-size:10px;color:#8a8a82;background:#fbfbf9;border-top:1px solid #dcdcd6;border-bottom:1px solid #dcdcd6}
.bar{padding:10px 12px 18px}
.bar .solid{width:100%;height:44px;background:#1f6f4a;color:#fff;border:0;font-size:14px;font-weight:700;font-family:inherit}
""")

# ============================================================ ⑤ 知识线路图
# 布局：地图就是首页 —— 七条线路即七个专题，站点即题型；没有列表
w("grounded-map", """
<div class="app">
  <div class="hd"><span class="t">知识线路</span><span class="s num">7 线 · 51 站 · 走过 8 站</span></div>
  <div class="map">
    <svg viewBox="0 0 348 336" width="348" height="336" aria-hidden="true">
      <g stroke="#dcdcd6" stroke-width="6" fill="none" stroke-linecap="round">
        <path d="M26 34 H210"/>
        <path d="M26 80 H250"/>
        <path d="M60 126 H318"/>
        <path d="M26 172 H196"/>
        <path d="M96 218 H330"/>
        <path d="M26 264 H230"/>
        <path d="M74 310 H300"/>
      </g>
      <path d="M32 172 H196" stroke="#2b5d4a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <g stroke="#bdbdb6" stroke-width="2" fill="#fff">
        <circle cx="96" cy="172" r="6"/><circle cx="132" cy="172" r="6"/><circle cx="196" cy="172" r="6"/>
        <circle cx="70" cy="34" r="5"/><circle cx="120" cy="34" r="5"/><circle cx="170" cy="34" r="5"/>
        <circle cx="70" cy="80" r="5"/><circle cx="140" cy="80" r="5"/><circle cx="200" cy="80" r="5"/>
        <circle cx="120" cy="126" r="5"/><circle cx="200" cy="126" r="5"/><circle cx="270" cy="126" r="5"/>
        <circle cx="150" cy="218" r="5"/><circle cx="240" cy="218" r="5"/><circle cx="300" cy="218" r="5"/>
        <circle cx="90" cy="264" r="5"/><circle cx="160" cy="264" r="5"/><circle cx="220" cy="264" r="5"/>
        <circle cx="130" cy="310" r="5"/><circle cx="220" cy="310" r="5"/><circle cx="290" cy="310" r="5"/>
      </g>
      <g stroke="#2b5d4a" stroke-width="2" fill="#2b5d4a">
        <circle cx="40" cy="172" r="9"/><circle cx="64" cy="172" r="7"/>
      </g>
      <circle cx="96" cy="172" r="11" fill="#fff" stroke="#2b5d4a" stroke-width="3.5"/>
      <g fill="#1d1d1b" font-size="9" font-family="PingFang SC,sans-serif">
        <text x="34" y="20">01 计算机基础</text>
        <text x="34" y="66">02 操作系统</text>
        <text x="68" y="112">03 Office</text>
        <text x="34" y="158">04 网络基础</text>
        <text x="104" y="204">05 多媒体</text>
        <text x="34" y="250">06 信息安全</text>
        <text x="82" y="296">07 新一代</text>
      </g>
    </svg>
  </div>
  <div class="cur">
    <div class="c-hd"><span>当前站 · 单项选择题</span><b class="num">165 / 181</b></div>
    <ul>
      <li><span class="dot on"></span>单项选择题<b class="num">165/181</b></li>
      <li><span class="dot"></span>多项选择题<b class="num">18/34</b></li>
      <li><span class="dot"></span>判断题<b class="num">0/46</b></li>
      <li><span class="dot"></span>填空题<b class="num">0/20</b></li>
      <li><span class="dot"></span>简答题<b class="num">0/6</b></li>
    </ul>
  </div>
  <div class="bar"><button class="solid">继续这一站</button></div>
</div>
""", """
.app{width:390px;height:844px;background:#fff;display:flex;flex-direction:column}
.hd{display:flex;align-items:baseline;justify-content:space-between;padding:16px 16px 6px}
.hd .t{font-size:17px;font-weight:700;color:#1d1d1b}
.hd .s{font-size:10px;color:#8a8a82}
.map{padding:0 14px;border-bottom:1px solid #e6e6e0;background:#fcfcfa}
.cur{flex:1;padding:12px 16px 0;overflow:hidden}
.c-hd{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid #e6e6e0;padding-bottom:6px}
.c-hd span{font-size:12px;font-weight:700;color:#2b5d4a}
.c-hd b{font-size:10.5px;color:#6f6f68}
.cur ul{list-style:none;margin-top:2px}
.cur li{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #f2f2ec;font-size:13.5px;color:#1d1d1b}
.dot{width:9px;height:9px;border-radius:50%;border:2px solid #c8c8c1;flex:none}
.dot.on{background:#2b5d4a;border-color:#2b5d4a}
.cur li b{margin-left:auto;font-size:10.5px;color:#8a8a82}
.bar{padding:10px 16px 18px}
.bar .solid{width:100%;height:44px;background:#2b5d4a;color:#fff;border:0;font-size:14px;font-weight:700;font-family:inherit}
""")

# ============================================================ ⑥ 品类标准
w("canon", """
<div class="app">
  <div class="hero">
    <div class="chip">江西统考 · 计算机</div>
    <h1>计基速刷</h1>
    <p>1934 道原书题 · 含答案与解析</p>
    <button>开始刷题</button>
  </div>
  <div class="stat">
    <div><b class="num">0</b><span>今日</span></div>
    <div><b class="num">0%</b><span>正确率</span></div>
    <div><b class="num">0</b><span>错题</span></div>
  </div>
  <div class="list">
    <div class="li"><span class="ic">📘</span><span>计算机基础知识</span><i class="num">332</i></div>
    <div class="li"><span class="ic">💻</span><span>操作系统</span><i class="num">343</i></div>
    <div class="li"><span class="ic">📊</span><span>Office 办公软件</span><i class="num">729</i></div>
    <div class="li"><span class="ic">🌐</span><span>计算机网络基础</span><i class="num">242</i></div>
  </div>
  <div class="tabbar"><span class="on">🏠<i>首页</i></span><span>📈<i>统计</i></span><span>👤<i>我的</i></span></div>
</div>
""", """
.app{width:390px;height:844px;background:#f5f7fa;display:flex;flex-direction:column}
.hero{background:linear-gradient(140deg,#6366f1,#8b5cf6);color:#fff;padding:34px 22px 30px;border-radius:0 0 26px 26px}
.chip{display:inline-block;background:rgba(255,255,255,.2);border-radius:999px;padding:4px 10px;font-size:11px}
.hero h1{margin-top:12px;font-size:30px;font-weight:800;letter-spacing:-.02em}
.hero p{margin-top:6px;font-size:12.5px;opacity:.85}
.hero button{margin-top:18px;width:100%;height:46px;border:0;border-radius:14px;background:#fff;color:#5b4bd6;font-size:15px;font-weight:700;font-family:inherit}
.stat{display:flex;background:#fff;border-radius:18px;margin:14px 16px 0;padding:14px 0;box-shadow:0 6px 18px rgba(31,41,55,.07)}
.stat div{flex:1;text-align:center}
.stat b{display:block;font-size:20px;color:#1f2937}
.stat span{font-size:10.5px;color:#8b93a1}
.list{background:#fff;border-radius:18px;margin:14px 16px;overflow:hidden;box-shadow:0 6px 18px rgba(31,41,55,.07)}
.li{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f1f3f6;font-size:13.5px;color:#1f2937}
.li:last-child{border-bottom:0}
.li .ic{font-size:17px}
.li i{margin-left:auto;font-size:12px;color:#9aa2b1;font-style:normal}
.tabbar{margin-top:auto;display:flex;background:#fff;border-top:1px solid #e9ecf2}
.tabbar span{flex:1;text-align:center;padding:9px 0 12px;font-size:17px;color:#b3bac6}
.tabbar span i{display:block;font-size:10.5px;font-style:normal;margin-top:2px}
.tabbar span.on{color:#6366f1}
""")

print("done")
