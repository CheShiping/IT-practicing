# 计基速刷 · 江西专升本计算机题库

面向江西统考专升本「计算机（信息技术）」科目的刷题网站。题目、答案与解析全部来自纸质教辅
《江西省专升本必刷2000题·信息技术》的扫描件抽取，**不编造、不使用示例占位数据**。

- 移动端与桌面浏览器双端支持（同一套代码），不做小程序、不做原生 App
- 纯静态托管在 GitHub Pages，构建期预渲染（SSG）+ 客户端接管
- 学习记录全部保存在本机浏览器，无需注册登录

## 功能

| 模块 | 说明 |
|---|---|
| 题库选择 | 按专题（7 个）→ 题型（8 类）选题，可切换「考点刷题 / 考点背诵」 |
| 刷题 | 单选、多选、判断三类客观题自动判分；填空、简答、分析、操作、综合应用题提供参考答案 |
| 判定反馈 | 判定后选项变为绿/红实心块，给出正确答案、你的答案与全对正确率 |
| 错题本 | 答错自动入库，记录错误次数与最近错误时间，可搜索、筛选、一键「消灭错题」重练 |
| 收藏 / 笔记 | 题目级收藏与笔记，随进度持久化 |
| 学习统计 | 完成度、综合掌握度、正确率、近 14 天题量、章节进度 |
| 我的 | 昵称、考试日期与倒计时、每日目标、字号缩放、数据导入导出 |

## 技术栈

- **Vite 8 + React 19 + TypeScript**
- **Tailwind CSS v4 + shadcn/ui**（Radix 版，`components/ui` 为 CLI 生成，业务代码只做组合）
- **React Router 7**（History 路由，`basename` 适配 GitHub Pages 子路径）
- **Zustand**（状态 + `persist` 本地持久化，`skipHydration` 延后读取以避免水合不一致）
- **Recharts 之外的图表用原生 CSS 绘制**，避免额外运行时体积

## 快速开始

```bash
npm install          # 安装依赖
npm run dev          # 本地开发（http://localhost:5173）
npm run build        # 客户端构建 → SSR bundle → 构建期预渲染 → dist/client
npm run preview      # 用 Vite 预览构建产物
node scripts/serve.mjs   # 用与 GitHub Pages 同规则的静态服务器预览（端口 4180）
```

> `vite preview` 对未知路径会回落到 `index.html`，与 GitHub Pages 的行为不同。
> 验证深链（如 `/quiz/xxx`）请使用 `scripts/serve.mjs`，它会像 GitHub Pages 一样返回 `404.html`。

### 端到端验证

```bash
npm run build
node scripts/serve.mjs &
BASE_URL=http://localhost:4180 node scripts/verify.mjs
```

会真实驱动 Chromium 跑完「首页 → 题库浮层 → 作答 → 判定 → 翻页 → 刷新恢复 → 错题本 → 统计 →
我的」全流程，并收集控制台错误，截图输出到 `build/verify/`。

## 题库数据管线

原始数据是两份扫描版 PDF（题目 244MB / 170 页，答案 173MB / 98 页），**文本流顺序与视觉顺序
不一致**，且选项按 4 列网格排布，因此无法用普通文本抽取。抽取脚本 `scripts/extract.py` 的做法：

1. 取每页 span 级坐标 → 按 y 聚成视觉行 → 行内按 x 排序 → 按间隙切成列段
2. 用本页识别成功的选项字母学习「选项网格列 x」，据此判定哪些列段是选项
3. 选项字母被 OCR 认错时（B→人、D→旦）按位置恢复
4. 题号被 OCR 拆成多段（「18 8.」）时先合并数字再匹配
5. 以「题号归 1」切分 45 个教材小节，再与答案册按（小节, 题号）对齐

```bash
pip install pymupdf
python scripts/extract.py     # 产出 public/data/** 与 build/data-report.json
```

### 数据质量

| 指标 | 数值 |
|---|---|
| 从 PDF 解析出的题块 | 2151 |
| 发布到线上的题目 | **1934**（可自动判分 1496 + 参考类 438） |
| 因题干残缺 / 选项异常 / 答案无法判读而排除 | 217（清单见 `build/data-report.json`） |

被排除的题目**不会**出现在网站上，也不会用编造内容补齐。原书 OCR 本身存在个别字符误差
（如「宾夕法尼亚州大学」），站内每道题都标注了原书页码，备考时请以原书为准。

## 部署（GitHub Pages）

仓库内置 `.github/workflows/deploy.yml`：`push` 到 `main` 即自动构建并发布。

- 构建命令会先产出客户端 bundle，再产出 SSR bundle，最后由 `scripts/prerender.mjs`
  把 7 个公开路由渲染成静态 HTML（`<route>/index.html`），并生成 `404.html` 与 `.nojekyll`
- `404.html` 使用**空壳模板**（不含预渲染内容），否则客户端在 `/quiz/*` 这类动态路由上
  会拿首页 HTML 去水合，触发 React 水合不一致
- 项目站点会自动推导 `base`（`/<repo>/`），路由与数据请求均使用 `import.meta.env.BASE_URL`

```bash
npm run build                      # 本地验证
BASE_PATH=/jishuan-computers/ npm run build   # 模拟子路径部署
```

## 目录结构

```
├─ src/
│  ├─ components/ui/       shadcn/ui 组件（CLI 生成，不写业务逻辑）
│  ├─ components/common/   跨页面复用：环形进度、选项块、答题卡、通用卡片
│  ├─ components/layout/   应用外壳：顶栏（黄条/白底双形态）、底部导航
│  ├─ features/            按业务域拆分：home / library / quiz / wrongbook / favorites / stats / profile
│  ├─ data/                类型定义、数据加载与判分逻辑
│  ├─ store/               Zustand 状态与本地持久化
│  ├─ App.tsx              路由表
│  ├─ main.tsx             客户端入口（hydrate / createRoot 自适应）
│  └─ entry-server.tsx     构建期预渲染入口
├─ scripts/
│  ├─ extract.py           题库抽取与质量报告
│  ├─ prerender.mjs        构建期预渲染 + 404/.nojekyll 生成
│  ├─ serve.mjs            类 GitHub Pages 的本地静态服务器
│  └─ verify.mjs           Playwright 端到端验证
├─ public/data/            题库 JSON（manifest / units / chapters）
└─ DESIGN.md               详细设计文档
```

## 已知限制

- 历年真题：题源是「教材同步训练」，不含真题。题库选择浮层保留了年份入口并显式说明未接入
- 排名：没有后端，统计页只展示「本机综合正确率」，不展示任何无数据来源的排名
- 题目插图：扫描件中的插图未纳入线上版本，涉及配图的题目可能影响理解
- 视觉主题已三次改版，当前为「这本教辅的印刷语法」：书页白 + 印刷黑 + 品红专色 `#c40d70` + 宋体题干。原型图的黄底圆角卡与 Cobalt 冷灰蓝仪表盘都已废弃，详见 `DESIGN.md` 第 12 章
- OCR 误差：个别字符识别有误，建议对照原书核对
