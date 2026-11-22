#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
题库抽取与数据构建（最终版）
================================================================
  题目册 PDF  ->  45 个教材小节  ->  题目（题干 / 选项 / 答案 / 解析）
  答案册 PDF  ->  与题目册按 (小节, 题号) 对齐

版面重建原理见 extract 顶部说明。输出：
  quiz-app/public/data/manifest.json
  quiz-app/public/data/points.json
  quiz-app/public/data/chapters/<chapterId>.json
  build/data-report.json
"""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QPDF = os.path.join(ROOT, 'docx', '题库', '江西库课必刷2000题计算机.pdf')
APDF = os.path.join(ROOT, 'docx', '题库', '江西库课必刷2000题计算机答案.pdf')
OUT_DIR = os.path.join(ROOT, 'public', 'data')
BUILD = os.path.join(ROOT, 'build')
os.makedirs(BUILD, exist_ok=True)
os.makedirs(os.path.join(OUT_DIR, 'chapters'), exist_ok=True)

# ------------------------------------------------------------------ 教材结构
CHAPTERS = [
    ('ch1', '计算机基础知识', 8, 4),
    ('ch2', '操作系统', 31, 20),
    ('ch3', 'Office 办公软件', 58, 36),
    ('ch4', '计算机网络基础', 125, 68),
    ('ch5', '多媒体技术基础知识', 145, 80),
    ('ch6', '信息安全', 157, 88),
    ('ch7', '新一代信息技术', 165, 95),
]
SECTION_PLAN = {
    'ch1': ['single', 'multi', 'judge', 'blank', 'short', 'comprehensive'],
    'ch2': ['single', 'multi', 'judge', 'blank', 'short', 'comprehensive'],
    'ch3': ['single', 'multi', 'judge', 'blank', 'short', 'analysis', 'operation', 'comprehensive'],
    'ch4': ['single', 'multi', 'judge', 'blank', 'short', 'comprehensive'],
    'ch5': ['single', 'multi', 'judge', 'blank', 'short', 'comprehensive'],
    'ch6': ['single', 'multi', 'judge', 'blank', 'short', 'comprehensive'],
    'ch7': ['single', 'multi', 'judge', 'blank', 'short', 'analysis', 'comprehensive'],
}
TYPE_NAME = {
    'single': '单项选择题', 'multi': '多项选择题', 'judge': '判断题',
    'blank': '填空题', 'short': '简答题', 'analysis': '分析题',
    'operation': '操作题', 'comprehensive': '综合应用题',
}
AUTO_JUDGE = ('single', 'multi', 'judge')
BOOK_NAME = '江西省专升本必刷2000题·信息技术'
TAIL_PAGES = {('ch6', 'comprehensive'): (164, 164), ('ch7', 'comprehensive'): (169, 169)}

# ------------------------------------------------------------------ 版面重建


def get_lines(page):
    spans = []
    for b in page.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            for s in l['spans']:
                if s['text'].strip():
                    spans.append((s['bbox'], s['text']))
    if not spans:
        return []
    spans.sort(key=lambda s: (s[0][1], s[0][0]))
    lines = []
    for bbox, t in spans:
        if lines and abs(lines[-1]['y'] - bbox[1]) <= 3.2:
            lines[-1]['spans'].append((bbox, t))
        else:
            lines.append({'y': bbox[1], 'spans': [(bbox, t)]})
    for ln in lines:
        ln['spans'].sort(key=lambda s: s[0][0])
        ln['segs'] = split_segments(ln['spans'])
    return lines


def split_segments(spans, gap=14.0):
    segs = []
    for bbox, t in spans:
        if segs:
            prev = segs[-1]
            g = bbox[0] - prev['x1']
            merge = g <= gap
            if not merge and g <= 26:
                pt, ct = prev['text'].rstrip(), t.lstrip()
                if pt and ct and pt[-1].isdigit() and ct[0].isdigit():
                    merge = True
                elif pt and ct and pt[-1] in 'ABCDE' and ct[0] in '.．、':
                    merge = True
            if merge:
                prev['text'] += t
                prev['x1'] = max(prev['x1'], bbox[2])
                continue
        segs.append({'x0': bbox[0], 'x1': bbox[2], 'text': t})
    return segs


LETTER_HEAD_RE = re.compile(r'^\s*[。．.，,、；;：:）)\]】]*\s*([A-E])\s*[.．、]')
PUNCT_HEAD_RE = re.compile(r'^[。．.，,、；;：:）)\]】]+')
QNUM_RE = re.compile(r'^\s*(\d{1,3})\s*[.．、]')
DIGIT_SPACE_RE = re.compile(r'(?<=[0-9]) +(?=[0-9])')
WS = re.compile(r'[ \t　]+')


def seg_letter(seg):
    m = LETTER_HEAD_RE.match(seg['text'])
    return m.group(1) if m else None


def seg_is_option(seg, grid):
    """列段是否为选项：识别出字母，或 x 落在选项网格列上"""
    if seg_letter(seg):
        return True
    return in_grid(seg['x0'], grid)


def learn_grid(lines):
    xs = sorted(seg['x0'] for ln in lines for seg in ln['segs'] if seg_letter(seg))
    clusters = []
    for x in xs:
        if clusters and x - clusters[-1][-1] <= 12:
            clusters[-1].append(x)
        else:
            clusters.append([x])
    return [sum(c) / len(c) for c in clusters]


def in_grid(x, grid, tol=6.0):
    return any(abs(x - g) <= tol for g in grid)


def clean_text(s):
    s = s.replace(' ', ' ')
    s = WS.sub(' ', s).strip()
    s = re.sub(r'(?<=[0-9]) +(?=[0-9])', '', s)
    s = re.sub(r' +([，。；：、？！）])', r'\1', s)
    s = re.sub(r'([（【]) +', r'\1', s)
    return s.strip()


def strip_letter(txt):
    return re.sub(r'^\s*[。．.，,、；;：:）)\]】]*\s*[A-E]\s*[.．、]?\s*', '', txt)


# ------------------------------------------------------------------ 题目解析


def parse_book(doc, page_from):
    questions, cur = [], None

    def flush():
        nonlocal cur
        if cur is not None:
            finish(cur)
            questions.append(cur)
            cur = None

    for pno in range(page_from - 1, doc.page_count):
        lines = get_lines(doc[pno])
        grid = learn_grid(lines)
        for ln in lines:
            if ln['y'] < 62 or ln['y'] > 786:
                continue
            segs = ln['segs']
            if not segs:
                continue
            head = segs[0]
            htext = DIGIT_SPACE_RE.sub('', head['text'])
            m = QNUM_RE.match(htext)
            if m and 50 <= head['x0'] <= 92 and not in_grid(head['x0'], grid):
                if cur is not None and int(m.group(1)) == cur['no']:
                    continue
                flush()
                rest = htext[m.end():]
                cur = {'no': int(m.group(1)), 'page': pno + 1,
                       '_stem': [rest] if rest.strip() else [], '_opts': []}
                for sg in segs[1:]:
                    if not seg_is_option(sg, grid):
                        cur['_stem'].append(sg['text'])
                continue
            opt_segs = [sg for sg in segs if seg_is_option(sg, grid)]
            if opt_segs and cur is not None:
                for sg in opt_segs:
                    cur['_opts'].append({'x': sg['x0'], 'text': sg['text'], 'letter': seg_letter(sg)})
                for sg in segs:
                    if sg not in opt_segs and not cur['_opts'][:-len(opt_segs)]:
                        cur['_stem'].append(sg['text'])
                continue
            if cur is not None and not cur['_opts']:
                cur['_stem'].append(' '.join(sg['text'] for sg in segs))
    flush()
    return questions


def parse_book_range(doc, page_from, page_to):
    """按页区间解析题目（用于题号未归 1 的尾部小节）"""
    questions, cur = [], None

    def flush():
        nonlocal cur
        if cur is not None:
            finish(cur)
            questions.append(cur)
            cur = None

    for pno in range(page_from - 1, min(page_to, doc.page_count)):
        lines = get_lines(doc[pno])
        grid = learn_grid(lines)
        for ln in lines:
            if ln['y'] < 62 or ln['y'] > 786:
                continue
            segs = ln['segs']
            if not segs:
                continue
            head = segs[0]
            htext = DIGIT_SPACE_RE.sub('', head['text'])
            m = QNUM_RE.match(htext)
            if m and 50 <= head['x0'] <= 92 and not in_grid(head['x0'], grid):
                if cur is not None and int(m.group(1)) == cur['no']:
                    continue
                flush()
                rest = htext[m.end():]
                cur = {'no': int(m.group(1)), 'page': pno + 1,
                       '_stem': [rest] if rest.strip() else [], '_opts': []}
                for sg in segs[1:]:
                    if not seg_is_option(sg, grid):
                        cur['_stem'].append(sg['text'])
                continue
            opt_segs = [sg for sg in segs if seg_is_option(sg, grid)]
            if opt_segs and cur is not None:
                for sg in opt_segs:
                    cur['_opts'].append({'x': sg['x0'], 'text': sg['text'], 'letter': seg_letter(sg)})
                for sg in segs:
                    if sg not in opt_segs and not cur['_opts'][:-len(opt_segs)]:
                        cur['_stem'].append(sg['text'])
                continue
            if cur is not None and not cur['_opts']:
                cur['_stem'].append(' '.join(sg['text'] for sg in segs))
    flush()
    return questions


def finish(q):
    q['stem'] = clean_text(' '.join(p for p in q['_stem'] if p and p.strip()))
    segs = q['_opts']
    letters, ambiguous = assign_letters(segs)
    if ambiguous:
        q['letterAmbiguous'] = True
    options = []
    for seg, L in zip(segs, letters):
        raw = seg['text']
        lead = PUNCT_HEAD_RE.match(raw)
        head_punct = ''
        if lead and not seg['letter']:
            head_punct = lead.group(0)
            raw = raw[len(head_punct):]
        if options and head_punct:
            options[-1]['text'] = (options[-1]['text'] + head_punct).strip()
        options.append({'key': L, 'text': clean_text(strip_letter(raw)),
                        'ocrLetter': seg['letter']})
    q['options'] = options
    q.pop('_stem', None)
    q.pop('_opts', None)


def assign_letters(segs):
    """恢复选项字母。

    OCR 会把字母认错（B→E、D→旦、人…），所以不能只信识别结果：
      1. 若所有列段都识别出字母且严格递增（如 B,C,D），直接采用；
      2. 否则假设该题有 n 个选项（n=4/3/2/5），把「不在该字母表内」和
         「未识别」的列段视为待定，按位置补齐缺失字母。
    """
    rec = [s['letter'] for s in segs]
    if rec and all(rec):
        vals = [ord(c) for c in rec]
        if all(vals[i] < vals[i + 1] for i in range(len(vals) - 1)):
            return rec, False
    for alpha in ('ABCD', 'ABC', 'AB', 'ABCDE'):
        present = set(c for c in rec if c and c in alpha)
        unknown = [s for s in segs if (not s['letter']) or s['letter'] not in alpha]
        miss = [L for L in alpha if L not in present]
        if len(miss) == len(unknown):
            out, mi = [], 0
            for s in segs:
                if s['letter'] and s['letter'] in alpha and s not in unknown:
                    out.append(s['letter'])
                else:
                    out.append(miss[mi] if mi < len(miss) else '?')
                    mi += 1
            return out, False
    return [chr(ord('A') + i) for i in range(len(segs))], True


def assign(segs, missing):
    out, mi = [], 0
    for seg in segs:
        if seg['letter']:
            out.append(seg['letter'])
        else:
            out.append(missing[mi] if mi < len(missing) else '?')
            mi += 1
    return out


# ------------------------------------------------------------------ 答案解析

MARK = r'(?:精\s*析|参\s*考\s*答\s*案|解\s*析)'
ANS_RE = re.compile(
    r'(\d{1,3})\s*[.．、]?\s*[【\[［（(]?\s*' + MARK + r'\s*[】\]］）)]?\s*[:：]?\s*')
TRUE_TOKENS = set('√✓J LNV∨Y') | {'N’', 'N\'_'}
FALSE_TOKENS = set('×✗X错F✘')


GARBAGE_OK = set('。，、；：？！“”‘’（）《》〈〉—…·【】')


def text_noise_ratio(text):
    """OCR 把插图认成乱码行时，有效字符占比会很低"""
    if not text:
        return 1.0
    good = 0
    for ch in text:
        if ch.isalnum() or ch in GARBAGE_OK or ch.isspace():
            good += 1
    return 1 - good / len(text)


def parse_answers(doc):
    entries, cur = [], None
    for pno in range(doc.page_count):
        for ln in get_lines(doc[pno]):
            if ln['y'] < 68 or ln['y'] > 770:
                continue
            text = clean_text(' '.join(sg['text'] for sg in ln['segs']))
            if text_noise_ratio(text) > 0.34:
                continue
            m = ANS_RE.match(text)
            if m and re.match(r'^\s*\d{1,3}\s*[.．、]?\s*[【\[［（(]?\s*(?:精|参|解)', text):
                if cur:
                    entries.append(cur)
                cur = {'no': int(m.group(1)), 'rest': text[m.end():].strip(),
                       'parts': [], 'page': pno + 1}
            elif cur is not None:
                cur['parts'].append(text)
    if cur:
        entries.append(cur)
    for e in entries:
        e['analysis'] = clean_text(' '.join(p for p in e['parts'] if p.strip()))
        e.pop('parts', None)
    return entries


def judge_token(tok):
    t = (tok or '').strip()
    if not t:
        return None
    if any(c in t for c in '×✗✘错'):
        return False
    if any(c in t for c in '√✓'):
        return True
    h = t[0]
    if h in FALSE_TOKENS:
        return False
    if h in TRUE_TOKENS or h in '＼／':
        return True
    return None


# ------------------------------------------------------------------ 答案册：题型标题

TYPE_HEADER_PATTERNS = [
    ('single', re.compile(r'单项[选准][择搭]题|单项[选准]题')),
    ('multi', re.compile(r'多项[选准][择搭]题')),
    ('judge', re.compile(r'判断题|判断l题')),
    ('blank', re.compile(r'填空题')),
    ('short', re.compile(r'简[答爸][题|]|简答题')),
    ('analysis', re.compile(r'分析题')),
    ('operation', re.compile(r'操作题')),
    ('comprehensive', re.compile(r'综合应用[题l]')),
]


def detect_type_headers(doc):
    """扫描答案册，识别每个小节标题所在的 PDF 页 -> 题型"""
    headers = []
    for pno in range(doc.page_count):
        for ln in get_lines(doc[pno]):
            if ln['y'] < 62 or ln['y'] > 786:
                continue
            txt = ''.join(sg['text'] for sg in ln['segs'])
            if len(txt) > 20:
                continue
            for key, pat in TYPE_HEADER_PATTERNS:
                if pat.search(txt):
                    headers.append((pno + 1, key))
                    break
    return headers


def header_type_at(headers, page):
    """给定页，返回该页所属题型（取该页之前最近的一个标题）"""
    cur = None
    for p, t in headers:
        if p <= page:
            cur = t
        else:
            break
    return cur


PLAIN_MARK_RE = re.compile(r"【\s*(?:精\s*析|参\s*考\s*答\s*案|解\s*析)\s*】|精析|参考答案")


def parse_plain_answers(doc, page_from, page_to):
    """解析填空题答案（答案册里没有【精析】标记的纯答案条目）

    答案册填空题答案是双栏密排：左栏奇数题、右栏偶数题；同一页下半部分
    往往紧接「简答题」的【精析】条目，且简答题题号也从 1 开始。
    因此不能只靠页码边界，必须：
      1. 按内容排除带【精析】/参考答案的条目；
      2. 按「页 → 栏（左→右）→ y」排序，避免跨页时左右栏错位。
    """
    items = []
    last = min(page_to + 1, doc.page_count)
    for pno in range(max(0, page_from - 1), last):
        for ln in get_lines(doc[pno]):
            if ln['y'] < 62 or ln['y'] > 786:
                continue
            for sg in ln['segs']:
                # OCR 常把题号写成「1 2.」「4 2.」，先把数字间空格压掉再匹配
                raw = DIGIT_SPACE_RE.sub('', sg['text'])
                m = re.match(r'^\s*(\d{1,3})\s*[.．、]\s*(.*)$', raw)
                if not m:
                    continue
                if PLAIN_MARK_RE.search(raw):
                    continue
                text = clean_text(m.group(2))
                if not text:
                    continue
                # 填空题答案是关键词/短表达式，过长者多为解析正文或图注
                if len(text) > 40 or text_noise_ratio(text) > 0.3:
                    continue
                items.append({
                    'no': int(m.group(1)),
                    'text': text,
                    'col': 0 if sg['x0'] < 200 else 1,
                    'y': ln['y'],
                    'page': pno + 1,
                })
    return sorted(items, key=lambda i: (i['page'], i['col'], i['y']))


# ------------------------------------------------------------------ 小节切分


def segment(items):
    out, cur = [], []
    for q in items:
        if cur and q['no'] == 1 and cur[-1]['no'] != 1:
            out.append(cur)
            cur = []
        cur.append(q)
    if cur:
        out.append(cur)
    return out


def map_sections(segments, offset):
    """把分段映射到教材的 45 个小节（offset: 章节起始页在各自 PDF 中的偏移）"""
    res = []
    seg_i = 0
    for i, (cid, name, qstart, astart) in enumerate(CHAPTERS):
        start = qstart if offset == 0 else astart
        if offset == 0:
            end = (CHAPTERS[i + 1][2] - 1) if i + 1 < len(CHAPTERS) else 10 ** 6
        else:
            end = (CHAPTERS[i + 1][3] - 1) if i + 1 < len(CHAPTERS) else 10 ** 6
        types = SECTION_PLAN[cid]
        mine = []
        while seg_i < len(segments) and start <= segments[seg_i][0]['page'] <= end:
            mine.append(segments[seg_i])
            seg_i += 1
        if len(mine) > len(types):
            head, tail = mine[:len(types) - 1], mine[len(types) - 1:]
            merged = []
            for t in tail:
                merged.extend(t)
            mine = head + [merged]
        elif len(mine) < len(types):
            mine = mine + [[] for _ in range(len(types) - len(mine))]
        for t, sec in zip(types, mine):
            res.append((cid, t, sec))
    return res


# ------------------------------------------------------------------ Office 板块切分
#
# 原书第三章把 Word / Excel / PowerPoint 混排在一起，只有题型小标题，没有软件分节。
# 站内要把这一章拆成三个板块，只能按题干内容判定归属：
#   1. 先给每题打「软件分」：题干里最先出现的软件名权重最高，其次是专属术语
#      （文档/页眉、工作簿/单元格、幻灯片/母版），最后是两可词（表格、图表、视图）；
#   2. 再做段落平滑：这本书按软件顺序编排，同一软件连续成段，单题抖动多半是
#      OCR 噪声，用「切段有代价」的最短路径把零星的误判拉回所属段落；
#   3. 剩下的跨段个案在 OVERRIDES 里逐条改判，都是对着原书复核过的。

OFFICE_CID = 'ch3'
OFFICE_MODULES = [
    ('w', 'Word 文字处理'),
    ('e', 'Excel 电子表格'),
    ('p', 'PowerPoint 演示文稿'),
]
MODULE_TITLE = dict(OFFICE_MODULES)

APP_NAME_RE = {
    'w': re.compile(r'word'),
    'e': re.compile(r'excel'),
    'p': re.compile(r'power\s*point|ppt'),
}
APP_STRONG_RE = {
    'w': re.compile(
        r'文档|段落|样式|页眉|页脚|目录|邮件合并|分栏|批注|修订|水印|页边距|制表位|'
        r'项目符号|脚注|尾注|题注|艺术字|文本框|拼写|字数统计|首行缩进|悬挂缩进|'
        r'分节符|纸张|打印预览|大纲|导航窗格|中文版式|带圈字符|稿纸|信封|docx|改写|'
        r'特殊符号|标题1|行距|分页符|图文混排|环绕方式|段落标记|回车符'),
    'e': re.compile(
        r'工作簿|工作表|单元格|公式|函数|填充柄|绝对引用|相对引用|混合引用|分类汇总|'
        r'数据透视|条件格式|数据有效|数据验证|编辑栏|名称框|列标|行号|排序|筛选|求和|'
        r'自动填充|序列|sum|average|count|vlookup|if\s*\(|max\s*\(|min\s*\(|round|'
        r'int\s*\(|合并后居中|列宽|行高|图表|数据源|图例|分类轴|数值轴|记录'),
    'p': re.compile(
        r'幻灯片|演示文稿|版式|母版|切换|动画|放映|排练计时|占位符|备注页|讲义|'
        r'超链接|smartart|主题|演示'),
}
APP_WEAK_RE = {
    'w': re.compile(r'表格|视图|插入|选项卡|工具栏|剪贴板|保存|打开|新建|页面设置|快捷键|字体|字号|对齐'),
    'e': re.compile(r'表格|数据|区域|列|行'),
    'p': re.compile(r'背景|图形|形状|对象|音频|视频|图片|切换效果'),
}

# 逐条复核后的改判（键为「题型, 原书题号」）
#   分析题按（一）～（六）的案例成组：前三组是 Word，后三组是 Excel；
#   题 6/11/12 的题干把下一组的导语和「操作题」标题一起吸进来了，只看字面会误判。
#   第 4 题简答是 PowerPoint；单选 441/442 属于「用 PowerPoint 汇报」那一段。
OFFICE_OVERRIDES = {
    ('short', 4): 'p',
    ('single', 441): 'p',
    ('single', 442): 'p',
}
for _i in range(1, 7):
    OFFICE_OVERRIDES[('analysis', _i)] = 'w'
for _i in range(7, 13):
    OFFICE_OVERRIDES[('analysis', _i)] = 'e'


def app_scores(q):
    """给一道题打 Word / Excel / PowerPoint 三个软件分"""
    text = re.sub(r'\s+', '', (q['stem'] + ' ' + ' '.join(o['text'] for o in q['options'])).lower())
    hits = []
    for key in 'wep':
        for m in APP_NAME_RE[key].finditer(text):
            hits.append((m.start(), key))
    hits.sort()
    out = {}
    for key in 'wep':
        mine = [i for i, h in enumerate(hits) if h[1] == key]
        first = bool(mine) and mine[0] == 0
        out[key] = 8 * int(first) + 3 * max(0, len(mine) - int(first))
        out[key] += 2 * len(set(APP_STRONG_RE[key].findall(text)))
        out[key] += len(set(APP_WEAK_RE[key].findall(text)))
    return out


def smooth_apps(seq, switch=6.0):
    """最短路径分词：切到另一个软件要付 switch 的代价，压掉单题抖动"""
    labels = 'wep'
    n = len(seq)
    cost = [[0.0] * 3 for _ in range(n)]
    back = [[0] * 3 for _ in range(n)]
    for i, sc in enumerate(seq):
        for j in range(3):
            cur = -sc[labels[j]]
            if i == 0:
                cost[i][j] = cur
                continue
            best, arg = None, 0
            for k in range(3):
                c = cost[i - 1][k] + (0 if k == j else switch) + cur
                if best is None or c < best:
                    best, arg = c, k
            cost[i][j], back[i][j] = best, arg
    j = min(range(3), key=lambda x: cost[-1][x])
    out = [j]
    for i in range(n - 1, 0, -1):
        j = back[i][j]
        out.append(j)
    return [labels[x] for x in reversed(out)]


def office_modules(qs, kind):
    labels = smooth_apps([app_scores(q) for q in qs])
    return [OFFICE_OVERRIDES.get((kind, q['no']), L) for q, L in zip(qs, labels)]


# ------------------------------------------------------------------ 主流程


def map_answer_sections(segments, qstats):
    """答案册分段 -> (chapterId, typeKey, entries)

    题目册与答案册的小节题号体系完全一致（每个小节都从 1 重新编号），
    因此用「小节最大题号」来匹配最可靠；匹配不上的小节留空（该题型答案
    本来就没有【精析】标记，如填空题）。
    """
    out = []
    for ci, (cid, _name, _qs, astart) in enumerate(CHAPTERS):
        aend = (CHAPTERS[ci + 1][3] - 1) if ci + 1 < len(CHAPTERS) else 10 ** 6
        types = SECTION_PLAN[cid]
        mine = [seg for seg in segments if astart <= seg[0]['page'] <= aend]
        used = [False] * len(mine)
        for t in types:
            exp_max, exp_cnt = qstats.get((cid, t), (None, None))
            best, best_score = -1, -1e9
            for i, seg in enumerate(mine):
                if used[i]:
                    continue
                smax = max(e['no'] for e in seg)
                scnt = len(seg)
                score = 0.0
                if exp_max and smax == exp_max:
                    score += 100
                elif exp_max and smax >= exp_max - 1:
                    score += 40
                if exp_cnt and scnt == exp_cnt:
                    score += 30
                score -= abs(scnt - (exp_cnt or scnt)) * 0.05
                score -= i * 0.01
                if score > best_score:
                    best, best_score = i, score
            if best >= 0 and best_score > 0:
                used[best] = True
                out.append((cid, t, mine[best]))
            else:
                out.append((cid, t, []))
    return out


def make_section(cid, mid, tk, qs, ans_entries, plain, report):
    """把一段同题型的题目落成一个小节

    mid 不为空表示这是 Office 章下的软件板块：题号按练习顺序从 1 重排，
    原书题号写进 bookNo（原书综合题按案例组重复编号，照抄会撞 id）。
    """
    sec_id = '%s-%s-%s' % (cid, mid, tk) if mid else '%s-%s' % (cid, tk)
    ans_map = {a['no']: a for a in ans_entries}
    stats = {'ok': 0, 'noAnswer': 0, 'badOption': 0, 'suspect': 0, 'excluded': 0}
    out_qs = []
    book_nos = []
    for q in qs:
        item = {
            # 板块内的正式 id / 题号要等质量闸门筛完再排（见函数末尾），这里先用原书题号占位
            'id': '%s-book%d' % (sec_id, q['no']) if mid else '%s-%d' % (sec_id, q['no']),
            'chapterId': cid,
            'sectionId': sec_id,
            'no': 0 if mid else q['no'],
            'type': tk if tk in AUTO_JUDGE else 'subjective',
            'kind': tk,
            'stem': q['stem'],
            'options': [{'key': o['key'], 'text': o['text']} for o in q['options']]
                      if tk in AUTO_JUDGE else [],
            'answer': [],
            'analysis': '',
            'source': {'book': BOOK_NAME, 'page': q['page']},
        }
        if mid:
            item['moduleId'] = mid
        a = ans_map.get(q['no'])
        if tk == 'blank':
            txt = plain.get(q['no'])
            if txt:
                item['answerText'] = txt
                item['analysis'] = txt
                stats['ok'] += 1
            else:
                stats['noAnswer'] += 1
                item['reviewFlag'] = 'noAnswer'
                report['issues'].append({'id': item['id'], 'reason': '填空题答案缺失'})
        elif a is None:
            stats['noAnswer'] += 1
            item['reviewFlag'] = 'noAnswer'
            report['issues'].append({'id': item['id'], 'reason': '答案缺失'})
        else:
            rest = a.get('rest', '')
            item['analysis'] = rest
            if tk == 'judge':
                mm = re.match(r"^([×✗√✓✔J L N X T V F Y／＼][\u2019\']?)", rest)
                tok = mm.group(1) if mm else ''
                if tok:
                    item['analysis'] = rest[len(tok):].strip()
            elif tk in ('single', 'multi'):
                mm = re.match(r'^([A-Ea-e]{1,5})', rest)
                tok = mm.group(1).upper() if mm else ''
                if tok:
                    item['analysis'] = rest[len(tok):].strip()
            else:
                tok = ''
            # 解析正文＝首行（已去掉答案字母）＋ 后续行
            cont = a.get('analysis', '')
            if cont:
                item['analysis'] = (item['analysis'] + ' ' + cont).strip()
            if tk == 'judge':
                v = judge_token(tok)
                if v is None:
                    stats['noAnswer'] += 1
                    item['reviewFlag'] = 'noAnswer'
                    report['issues'].append({'id': item['id'], 'reason': '判断题答案符号无法识别: %r' % tok})
                else:
                    item['answer'] = ['A'] if v else ['B']
                    item['options'] = [{'key': 'A', 'text': '正确'}, {'key': 'B', 'text': '错误'}]
                    stats['ok'] += 1
            elif tk in ('single', 'multi'):
                mlead = re.match(r'^[A-E]{1,5}', tok.upper())
                letters = list(mlead.group(0)) if mlead else []
                if len(letters) > 4:
                    letters = letters[:4]
                keys = [o['key'] for o in item['options']]
                if tk == 'single':
                    letters = letters[:1]
                if letters and all(c in keys for c in letters):
                    item['answer'] = letters
                    if (tk == 'single' and len(letters) != 1) or (tk == 'multi' and len(letters) < 2):
                        item['reviewFlag'] = 'suspect'
                        stats['suspect'] += 1
                    else:
                        stats['ok'] += 1
                else:
                    stats['noAnswer'] += 1
                    item['reviewFlag'] = 'noAnswer'
                    report['issues'].append({'id': item['id'], 'reason': '答案与选项不匹配: %r' % tok})
            else:
                item['answerText'] = item['analysis']
                stats['ok'] += 1
        if tk in AUTO_JUDGE and tk != 'judge' and len(item['options']) < 2:
            item['reviewFlag'] = 'badOption'
            stats['badOption'] += 1
            report['issues'].append({'id': item['id'], 'reason': '选项缺失'})
        # 质量闸门：题干完整 + 选项齐全 + 答案可判分，否则不进线上题库
        drop = None
        if not item['stem']:
            drop = '题干为空'
        elif tk in AUTO_JUDGE and tk != 'judge':
            if len(item['options']) < 3 or len(item['options']) > 4:
                drop = '选项数异常(%d)' % len(item['options'])
            elif not item['answer']:
                drop = '缺少可判分答案'
            elif any(not o['text'].strip() for o in item['options']):
                drop = '存在空选项'
        elif tk == 'judge':
            if not item['answer']:
                drop = '缺少判断题答案'
        else:
            if not item.get('answerText'):
                drop = '缺少参考答案'
        if drop:
            stats['excluded'] += 1
            report['excluded'].append({'id': item['id'], 'reason': drop,
                                       'stem': item['stem'][:60]})
            continue
        item['answerable'] = tk in AUTO_JUDGE
        out_qs.append(item)
        book_nos.append(q['no'])
    if mid:
        # 筛完再编号：题号连续，原书题号留在 bookNo 里溯源
        for i, item in enumerate(out_qs, 1):
            item['no'] = i
            item['id'] = '%s-%d' % (sec_id, i)
            item['bookNo'] = book_nos[i - 1]
    sec = {
        'id': sec_id, 'chapterId': cid, 'title': TYPE_NAME[tk], 'kind': tk,
        'autoJudged': tk in AUTO_JUDGE,
        'questionCount': len(out_qs),
        'usableCount': stats['ok'],
    }
    if mid:
        sec['moduleId'] = mid
    report['sections'].append({
        'chapterId': cid, 'sectionId': sec_id, 'title': TYPE_NAME[tk],
        'moduleId': mid,
        'questions': len(out_qs), 'answers': len(ans_entries), **stats,
    })
    return sec, out_qs, stats


def build():
    qdoc = pymupdf.open(QPDF)
    adoc = pymupdf.open(APDF)

    raw_q = parse_book(qdoc, 8)
    q_sections = map_sections(segment(raw_q), 0)
    # 尾部小节（综合应用题题号未归 1）单独按页补采
    qmap = {(c, t): qs for c, t, qs in q_sections}
    for (cid, t), (p_from, p_to) in TAIL_PAGES.items():
        qmap[(cid, t)] = parse_book_range(qdoc, p_from, p_to)
    ordered = [(c[0], t) for c in CHAPTERS for t in SECTION_PLAN[c[0]]]

    qstats = {}
    for (c, t), qs in qmap.items():
        if qs:
            qstats[(c, t)] = (max(q['no'] for q in qs), len(qs))
    ans_all = parse_answers(adoc)
    a_sections = map_answer_sections(segment(ans_all), qstats)
    amap = {(c, t): entries for c, t, entries in a_sections}

    # 填空题答案：无【精析】标记，按章节内「判断题答案结束页 ~ 简答题答案开始页」区间双栏还原
    plain_map = {}
    for cid in [c[0] for c in CHAPTERS]:
        judge_ents = amap.get((cid, 'judge'), [])
        short_ents = amap.get((cid, 'short'), [])
        lo = judge_ents[-1]['page'] if judge_ents else 0
        hi = short_ents[0]['page'] if short_ents else 10 ** 6
        plain = parse_plain_answers(adoc, lo, hi)
        m = {}
        for it in plain:
            m.setdefault(it['no'], it['text'])
        plain_map[(cid, 'blank')] = m

    report = {'sections': [], 'issues': [], 'excluded': []}
    chapters = {}
    total_q = 0

    for cid, tk in ordered:
        qs = qmap.get((cid, tk), [])
        ch = chapters.setdefault(cid, {'id': cid, 'title': '', 'sections': [], 'questions': []})
        ans_entries = amap.get((cid, tk), [])
        plain = plain_map.get((cid, tk), {}) if tk == 'blank' else {}
        if cid == OFFICE_CID:
            mids = office_modules(qs, tk) if qs else []
            groups = [(m, [q for q, x in zip(qs, mids) if x == m]) for m, _ in OFFICE_MODULES]
            groups = [(m, g) for m, g in groups if g]  # 该板块没有这个题型就不建空小节
        else:
            groups = [(None, qs)]
        for mid, sub in groups:
            sec, items, _stats = make_section(cid, mid, tk, sub, ans_entries, plain, report)
            ch['sections'].append(sec)
            ch['questions'].extend(items)
            total_q += len(items)

    titles = {c[0]: c[1] for c in CHAPTERS}
    modules_meta = [{'id': m, 'title': t, 'order': i + 1} for i, (m, t) in enumerate(OFFICE_MODULES)]
    for cid, ch in chapters.items():
        ch['title'] = titles[cid]
        ch['order'] = int(cid[2:])
        ch['questionCount'] = len(ch['questions'])
        if cid == OFFICE_CID:
            ch['modules'] = modules_meta

    usable = sum(1 for ch in chapters.values() for q in ch['questions'] if q.get('answerable'))
    manifest_chapters = []
    for i, c in enumerate(CHAPTERS):
        meta = {'id': c[0], 'title': c[1], 'order': i + 1}
        if c[0] == OFFICE_CID:
            meta['modules'] = modules_meta
        manifest_chapters.append(meta)
    manifest = {
        'book': BOOK_NAME,
        'source': 'docx/题库/江西库课必刷2000题计算机.pdf + 答案.pdf',
        'dataVersion': '2026-11-22',
        'totalQuestions': total_q,
        'usableQuestions': usable,
        'excludedQuestions': len(report['excluded']),
        'chapters': manifest_chapters,
    }

    for cid, ch in chapters.items():
        with open(os.path.join(OUT_DIR, 'chapters', '%s.json' % cid), 'w', encoding='utf-8') as f:
            json.dump(ch, f, ensure_ascii=False, separators=(',', ':'))

    # 板块拆分后 Office 的题号重排，本地进度/错题/收藏仍存着旧 id：
    # 输出「旧 id -> 新 id」，客户端首次加载时迁移一次（综合题原书题号重复，无法对应，跳过）
    legacy = {}
    for q in chapters[OFFICE_CID]['questions']:
        old = '%s-%s-%d' % (OFFICE_CID, q['kind'], q.get('bookNo', q['no']))
        legacy[old] = None if old in legacy else q['id']
    legacy = {k: v for k, v in legacy.items() if v}
    with open(os.path.join(OUT_DIR, 'legacy.json'), 'w', encoding='utf-8') as f:
        json.dump(legacy, f, ensure_ascii=False, separators=(',', ':'))

    # 练习单元：以「专题 →（板块 →）题型小节」为最小可刷单位
    units = []
    for cid, ch in chapters.items():
        for sec in ch['sections']:
            unit = {
                'id': sec['id'], 'chapterId': cid, 'chapterTitle': ch['title'],
                'title': sec['title'], 'kind': sec['kind'],
                'autoJudged': sec['autoJudged'],
                'questionCount': sec['questionCount'],
                'gradableCount': sum(1 for q in ch['questions']
                                     if q['sectionId'] == sec['id'] and q.get('answerable')),
            }
            if sec.get('moduleId'):
                unit['moduleId'] = sec['moduleId']
                unit['moduleTitle'] = MODULE_TITLE[sec['moduleId']]
            units.append(unit)
    with open(os.path.join(OUT_DIR, 'units.json'), 'w', encoding='utf-8') as f:
        json.dump({'units': units}, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT_DIR, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(BUILD, 'data-report.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=1)

    print('章节 %d，发布题目 %d（自动判分 %d），排除 %d，问题条目 %d'
          % (len(chapters), total_q, usable, len(report['excluded']), len(report['issues'])))
    for s in report['sections']:
        print('  %-3s %-6s %-8s 发布%4d 答案%4d 可用%4d 无答案%3d 选项异常%3d 存疑%3d 排除%3d'
              % (s['chapterId'], s['moduleId'] or '-', s['title'], s['questions'], s['answers'],
                 s['ok'], s['noAnswer'], s['badOption'], s['suspect'], s.get('excluded', 0)))
    print('Office 板块：' + '，'.join(
        '%s %d 题' % (t, sum(1 for q in chapters[OFFICE_CID]['questions'] if q.get('moduleId') == m))
        for m, t in OFFICE_MODULES))


if __name__ == '__main__':
    build()
