江西专升本计算机题库刷题站。纯静态托管 GitHub Pages，移动端 1:1 还原原型、桌面端重排信息密度。
线上 https://cheshiping.github.io/IT-practicing/ 。产品与视觉规格在 `DESIGN.md`、`PRODUCT.md`，此处不重复。

## 命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | 本地开发（5173） |
| `npm run check` | **唯一门禁**：typecheck → lint → build → 起 4180 类 Pages 服务器 → 浏览器跑主流程，截图落在 `build/verify/` |
| `node scripts/check.mjs` | 只跑浏览器段（需已 build） |
| `npx playwright install chromium` | 首次或换机器后补浏览器 |

不要新造第二条验证命令。`verify` 已并入 `check`。

## 完成定义

三者缺一，不得说"做完了"：

1. 验收点写进 `feature_list.json`，且是**可观察行为**（例：390px 下笔记弹窗不溢出），不是"改好了"；
2. `npm run check` 全绿；
3. 证据写进 `progress.md`：命令、关键输出、截图文件名。UI 改动必须贴 `build/verify/` 里的截图。

## 修复循环

- 门禁红时**只修不加**，不许一边修 bug 一边加功能。
- 同一条红修两次仍不绿：停下，说明卡点，不许继续猜。
- 修 bug 先在 `scripts/verify.mjs` 加一条能复现的失败用例（先红后绿），否则无法证明修好。

## 提交与推送

- 只在 `npm run check` 绿之后提交。提交信息沿用现有风格：`feat:` / `fix:` / `docs:` / `refactor:` / `polish:` + 一句中文说清改了什么。
- 推完必须拿回执并记进 `progress.md`：`gh run list --limit 1 --json headSha,conclusion`，确认本次 commit 的 run 是 success。**push 退出码 0 不等于上线成功。**
- Pages 有 CDN 延迟，推完立刻 curl 到旧内容是正常的；以 run 结论加稍后内容校验为准，别据此判定部署失败。
- 以下四类不自动推（提交后停在本机等人工过目）：`public/data/**` 题库改动、依赖大版本升级、`DESIGN.md` 结构性重写、以及 check 绿但自己没把握的改动。

## 门禁口径

只有 error 拦截，warning 不拦。`react-refresh/only-export-components`、`set-state-in-effect`、`purity` 三条降为 warn：前两条与 shadcn 既有写法、hydration 标记冲突，`purity` 在 onClick 触发的 async 函数里会误报（`LibraryPage`）。新增规则若第一天就红，先校准口径再进门禁，不要整条关掉 lint。

## 硬约束

- 双端：移动端 + 桌面网站，不做小程序、不做原生 App。
- 组件统一 shadcn/ui（new-york + Tailwind v4），不引 MUI/AntD；非要自写组件，须在 `progress.md` 说明 shadcn 为何不覆盖。
- 题目只能来自 `docx/题库` 的两个 PDF，经离线解析加人工校对转 JSON；不自拟题目。
- 无数据源的功能（排行榜、历年真题）必须显式标注状态，禁止假数据冒充。
- 构建期预渲染加客户端 hydration 就是本项目的「SSR」，不是请求时 SSR。

## 会话收尾

先更新 `progress.md`（本会话做了什么、门禁结果、下一步），再更新 `feature_list.json` 的 `status` 与 `evidence`。
