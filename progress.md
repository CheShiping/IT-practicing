## 2026-11-22 装门禁

做了什么

- 新增 `AGENTS.md`：命令表、完成定义（验收点可观察 + check 全绿 + 证据落盘）、修复循环（只修不加、两次不绿就停、先红后绿）、提交与推送规则（含四类不自动推）、门禁口径、硬约束。
- 新增 `scripts/check.mjs`：起 4180 类 Pages 服务器 → 轮询就绪 → 跑 `verify.mjs` → 收尾杀进程；失败带非 0 退出码，不再依赖手动开终端。
- `package.json` 加 `check`：`typecheck → lint → build → check.mjs`，一条命令到底。
- `scripts/verify.mjs`：删掉写死的 `chromium-1234`，改为三级解析（`CHROME_PATH` → Playwright 自带 → 缓存兜底），并打印实际使用的浏览器。
- `.github/workflows/deploy.yml`：build 之前插入 `typecheck + lint` 门禁，hook 被绕过也拦得住。
- `eslint.config.js`：`react-refresh/only-export-components`、`react-hooks/set-state-in-effect`、`react-hooks/purity` 降为 warn（shadcn 同文件导出 variants、hydration 标记、onClick 内 Date.now 误报），`src/components/ui/**` 直接 off。
- `src/data/loader.ts`：`\[\]` 改为 `\u005B\u005D`，消除 `no-useless-escape`。

门禁结果

- `npm run check` → 退出码 0。
- 13 步全 OK：打开首页 / 题量校验 / 选题浮层 / 进入练习 / 章节页 / 键盘可达 / 作答判定 / 下一题 / 刷新保进度 / 错题本 / 统计 / 我的 / 桌面端布局，无控制台错误。
- 浏览器走「缓存兜底」：`chromium-1234`。Playwright 1.65 期望 1255，`npx playwright install chromium` 未成功（下载未落地），先靠兜底跑通。
- 截图落盘：`build/verify/01-home.png` … `08-desktop.png`。
- 提交：`bb339b8`（工具链）、`9abbfc4`（loader 转义）。均未推送。

推送前发现的情况（未推送的原因）

- 21:07–21:13 期间，工作区出现 13 项不是我改的改动：`scripts/extract.py`(+437 行)、`LibraryPage.tsx`、`QuestionBankSheet.tsx`、`src/store/useAppStore.ts`、`src/App.tsx`、`src/data/types.ts`、`public/data/*`、新增 `public/data/legacy.json`。内容指向「Office 拆板块后题号重排 + legacy 题号迁移」。
- 不是本会话所为，也不是 `npm run build` 的产物（`prerender.mjs` 不写 `public/data`）。查询进程后确认当时已无写入者，属于另一会话留下、未提交的 WIP。
- 因此没有推送：`npm run check` 跑的是「HEAD + 上述 WIP」的源码，推上去的是「HEAD + 工具链」，证据与产物不对应，属于假绿；且这批改动命中「不自动推」清单里的 `public/data/**`。
- `src/data/loader.ts` 同时含本次转义修复与对方的 `loadLegacyMap`，故只把「去掉无用转义」这一行单独写入提交，工作区文件保持原样（`loadLegacyMap` 仍在）。

待办

- 浏览器版本对齐（重试 `npx playwright install chromium`）；兜底分支保留，届时会自然走「自带版本」。
- 等 WIP 提交后再推送工具链提交，补 CI run 回执（headSha + conclusion）。


## Office 章拆成 Word / Excel / PowerPoint 三个板块（21:25-21:50）

### 做了什么
- 数据：`ch3` 增加板块层，题型小节由 8 个变 21 个（Word 8 / Excel 7 / PowerPoint 6）；题量 265 / 290 / 168，合计 723，与原章一致。板块内题号按练习顺序从 1 连续重排，原书题号写进 `bookNo`；顺带修掉综合应用题 5 个重复 id。
- 归属判定：扫描件里没有软件分节标题，`extract.py` 按题干给每题打「软件分」（题干最先出现的软件名 > 专属术语 > 两可词）→ 段落平滑（切到别的软件要付代价，压掉 OCR 噪声）→ `OFFICE_OVERRIDES` 逐条对着原书复核（分析题六组案例、简答第 4 题、单选 441/442）。
- 界面：题库页在章节标题下分三个板块分组（板块名 + 题型数 + 进度），组内仍列题型；选题浮层在专题之后多一步「二、板块」，题型数量与「本次 N 题」随板块收窄。
- 迁移：构建输出 `public/data/legacy.json`（688 条旧 id → 新 id），`store.migrateIds` 首次加载把进度 / 错题 / 笔记 / 收藏搬一次；原书题号重复的综合题无法一一对应，不迁。

### 证据
- `npm run check` 退出码 0，15 步全 OK，无控制台错误。
- 新增两条验收：① Office 三板块可见，且三板块题量之和 = 章总量；② 选题浮层选 Word 后「本次 265 题」，进入的练习标题含「Word 文字处理」且题量 265。
- 截图：`build/verify/07b-library-office.png`、`07c-sheet-module.png`、`07d-quiz-word.png`。
- 数据校验：1942 题无重复 id；ch3 各节题号 1..N 连续；板块题量 265+290+168=723。
- 迁移自测：预置 `ch3-single-1`、`ch3-blank-5` 旧记录后加载，localStorage 变为 `ch3-w-single-1`、`ch3-w-blank-5`，题库页显示「已练 1」。
- 未推送：命中「`public/data/**` 题库改动不自动推」。

### 推送回执（21:26-21:31）

- `git push origin main`：`29a9175..35242b5`（首次 schannel 报错，改 `-c http.sslBackend=openssl` 成功）。
- CI：`gh run list` → run `45027555808`，headSha `35242b5`，conclusion **success**（build 前已带 typecheck + lint）。
- 线上内容校验（Node fetch，绕开 curl 的 schannel 问题）：
  - `data/manifest.json` 200，版本 `2026-11-22`，总题 1942
  - `data/units.json` 200，ch3 单元 21 个，板块 Word / Excel / PowerPoint，题量和 723
  - `data/legacy.json` 200，688 条映射
  - `data/chapters/ch3.json` 200，325.3KB
- 线上 UI：`/library` 展开 Office，三个板块标题正常（Word 文字处理 / Excel 电子表格 / PowerPoint 演示文稿），无控制台错误；截图 `build/shots/live-ch3.png`。
- 用户 21:25 明确「自动推送，这种需要」→ 后续 `public/data/**` 题库改动的推送限制解除，见 AGENTS.md。

## 题号统一为练习内序号（19:10-19:55）

### 问题

- 题面卡徽标用 `question.no`（原书题号：各题型各从 1 重计，删题后还有缺口），答题卡用 `i + 1`（练习内序号），两套号对不上：
  - 全章练习翻到多选时，徽标回落成 1，答题卡却是 182；
  - 错题 / 收藏重练时，徽标是原书第 47 题，答题卡是 1 —— 即用户看到的「题号大了」。
- 结果页答题卡直接用原书号，出现 `1..6 → 8` 的跳号（删题缺口）；点格子固定跳 `?q=1`，从来没跳到对应题。
- 附带：带 `?q=` 进练习后，「上一题 / 下一题」被旧参数拽回原题（`?q=` 覆盖 store 里的 index）。

### 做了什么

- `QuizPage`：题号统一为练习内序号 `index + 1`，原书题号降级成旁边的小字「原书第 N 题」（取 `bookNo ?? no`）；桌面侧栏答题卡与手机 Sheet 跳题都走 `goTo()`。
- 位置写进地址栏：`goTo()` 用 `navigate('/quiz/:id?q=n', { replace: true })` 同步，`?q=` 成为位置源头。原因：`updateSession` 只 patch 进行中的 `current`，已结束的会话（结果页回看）改不动 index，只靠 store 会落回离开时那题。
- `ResultPage`：答题卡与逐题解析按 `questionIds` 顺序算序号（`positionOf`），分组仍按题型；点格子 `navigate(?q={no})`，不再是固定 `?q=1`。
- `verify.mjs`：新增两步用例；`requestfailed` 过滤 `net::ERR_ABORTED`（页面跳转取消在飞的 favicon，不是资源错误，之前偶发把门禁判红）。

### 证据

- 先红后绿：改前 `题面题号应为 182，实际「1」`、`答题卡应为连续序号，第 7 格是 8`；改后同两条通过。
- `npm run check` 退出码 0，17 步全 OK，无控制台错误。
- 截图：`build/verify/04c-qno.png`（第 182 题 · 多选题 · 原书第 1 题）、`04d-result.png`、`04e-result-sheet.png`（答题卡 1 起连续）、`04f-result-item.png`（逐题解析带原书题号）。

### 推送回执（19:22-19:28）

- `git push origin main`：`31878ae..23f2905`，退出码 0（`credential-manager-core` 警告不影响推送）。
- CI：run `45164657856`，headSha `23f2905`，conclusion **success**。
- 线上内容：`index.html` 引用 `assets/index-DYO_4QRo.js`（462 KB），bundle 命中「原书第」。
- 线上 UI（390px 真实浏览器，`?q=182`）：徽标 182、答题卡当前格 182、顶部「第 182 / 340 题」；点「上一题」→ 181。截图 `build/shots/live-qno.png`。控制台仅 `/quiz/:id` 的 404 兜底，属预期。


