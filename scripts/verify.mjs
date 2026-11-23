#!/usr/bin/env node
/**
 * 基本运行验证：用真实浏览器跑一遍主流程
 *   首页 -> 题库 -> 开始练习 -> 作答 -> 判定 -> 结果页 -> 错题本 -> 统计
 * 同时收集 console 错误与未捕获异常。
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:4173";
const OUT = "build/verify";
mkdirSync(OUT, { recursive: true });

const errors = [];

// 浏览器解析顺序：CHROME_PATH → Playwright 自带版本 → 缓存里已有的任意 chromium。
// 不再写死具体版本号：Playwright 升级后会换 revision，写死必然崩。
function cachedChromium() {
  const base =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === "win32"
      ? join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "ms-playwright")
      : process.platform === "darwin"
        ? join(homedir(), "Library", "Caches", "ms-playwright")
        : join(homedir(), ".cache", "ms-playwright"));
  if (!existsSync(base)) return [];
  const rel =
    process.platform === "win32"
      ? ["chrome-win64", "chrome.exe"]
      : process.platform === "darwin"
        ? ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"]
        : ["chrome-linux", "chrome"];
  return readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
    .map((d) => join(base, d, ...rel))
    .filter((p) => existsSync(p));
}

const attempts = [];
if (process.env.CHROME_PATH) attempts.push({ path: process.env.CHROME_PATH, label: "CHROME_PATH" });
attempts.push({ path: null, label: "Playwright 自带版本" });
for (const p of cachedChromium()) attempts.push({ path: p, label: "缓存兜底" });

let browser;
let lastError;
for (const { path, label } of attempts) {
  try {
    browser = await chromium.launch(path ? { executablePath: path } : {});
    console.log(`浏览器：${label}${path ? `（${path}）` : ""}`);
    break;
  } catch (e) {
    lastError = e;
  }
}
if (!browser) {
  console.error(
    `浏览器启动失败：${lastError?.message}\n` +
      `请运行 npx playwright install chromium，或用 CHROME_PATH 指向本机 Chrome。`,
  );
  process.exit(1);
}
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// 静态托管下 /quiz/:id 这类动态路由由 404.html 空壳兜底，404 状态码是预期行为，不算错误
const isDynamicRouteFallback = (url) => /\/quiz\/[^/]+(\?.*)?$/.test(url);
page.on("requestfailed", (r) => {
  // 页面跳转会取消还在飞的请求（含 favicon），ERR_ABORTED 不是资源问题
  const why = r.failure()?.errorText ?? "";
  if (why === "net::ERR_ABORTED") return;
  errors.push(`[net] ${r.url()} ${why}`);
});
page.on("response", (r) => {
  if (r.status() >= 400 && !isDynamicRouteFallback(r.url())) {
    errors.push(`[${r.status()}] ${r.url()}`);
  }
});
page.on("console", (m) => {
  if (m.type() === "error" && !/status of 404/.test(m.text())) {
    errors.push(`[console] ${m.text()}`);
  }
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

const step = async (name, fn) => {
  process.stdout.write(`- ${name} … `);
  try {
    await fn();
    console.log("OK");
  } catch (e) {
    console.log(`FAIL: ${e.message}`);
    errors.push(`[step:${name}] ${e.message}`);
  }
};

await step("打开首页", async () => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=开始刷题", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true });
});

await step("首页显示题库题量", async () => {
  const txt = await page.textContent("body");
  const res = await page.evaluate(() => fetch("./data/manifest.json").then((r) => r.json()));
  if (!new RegExp(String(res.totalQuestions)).test(txt)) {
    throw new Error(`未显示题库总量 ${res.totalQuestions}：${txt.slice(0, 120)}`);
  }
});

await step("打开题库选择浮层", async () => {
  await page.click("text=开始刷题");
  await page.waitForSelector("text=选题", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/02-bank-sheet.png` });
});

await step("选中科目并确认进入练习", async () => {
  await page.locator("button", { hasText: "计算机基础知识" }).first().click();
  await page.waitForSelector("text=二、题型", { timeout: 10000 });
  await page.getByRole("button", { name: "开始", exact: true }).click();
  await page.waitForSelector("text=提交答案", { timeout: 45000 });
  await page.screenshot({ path: `${OUT}/03-quiz.png`, fullPage: true });
});

await step("章节列表页可用", async () => {
  await page.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=计算机基础知识", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/02b-library.png`, fullPage: true });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.click("text=开始刷题");
  await page.waitForSelector("text=选题", { timeout: 15000 });
  await page.locator("button", { hasText: "计算机基础知识" }).first().click();
  await page.getByRole("button", { name: "开始", exact: true }).click();
  await page.waitForSelector("text=提交答案", { timeout: 45000 });
});

await step("键盘可达并可选中", async () => {
  let hit = null;
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      return { label: el?.getAttribute("aria-label") };
    });
    if (info.label && info.label.startsWith("选项")) {
      hit = info.label;
      break;
    }
  }
  if (!hit) throw new Error("Tab 无法到达选项控件");
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  const selected = await page.evaluate(
    () => document.querySelectorAll('[aria-label^="选项"][aria-pressed="true"]').length,
  );
  if (!selected) throw new Error("空格键未能选中选项");
  await page.screenshot({ path: `${OUT}/04b-keyboard.png` });
});

await step("选择选项并提交", async () => {
  await page.locator('[aria-label="选项"] button').first().click();
  await page.click("text=提交答案");
  await page.waitForSelector('[role="status"]', { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/04-judged.png`, fullPage: true });
});

await step("进入下一题", async () => {
  await page.click("text=下一题");
  await page.waitForSelector("text=提交答案", { timeout: 10000 });
});

await step("刷新后进度保留", async () => {
  const url = page.url().split("?")[0];
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("text=提交答案", { timeout: 15000 });
  // 刷新后仍停在第 2 题（未作答），回到第 1 题应保留判定结果
  const counter = await page.textContent("body");
  if (!/第\s*2\s*\//.test(counter)) throw new Error("刷新后题号未保持：" + counter.slice(0, 80));
  await page.goto(`${url}?q=1`, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="status"]', { timeout: 15000 });
  const stored = await page.evaluate(() => localStorage.getItem("msz.v1.app") || "");
  if (!stored.includes("ch1-single-1")) throw new Error("本地进度未保存");
});

await step("题号与答题卡题号一致", async () => {
  // 第 182 题是本章多选第一题：原书题号会重新从 1 计，练习序号才是 182
  const base = page.url().split("?")[0];
  if (!/\/quiz\/[^/]+$/.test(base)) throw new Error("当前不在练习页：" + page.url());
  await page.goto(`${base}?q=182`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=提交答案", { timeout: 30000 });

  const read = () =>
    page.evaluate(() => {
      const badge = document.querySelector("article span.num")?.textContent?.trim() ?? "";
      const cells = [...document.querySelectorAll('[aria-current="true"]')].map((e) =>
        (e.textContent ?? "").trim(),
      );
      const m = document.body.innerText.match(/第\s*(\d+)\s*\/\s*(\d+)\s*题/);
      return { badge, cells, pos: m ? Number(m[1]) : 0, total: m ? Number(m[2]) : 0 };
    });

  const at182 = await read();
  if (at182.pos !== 182) throw new Error(`顶部题号应为 182，实际 ${at182.pos}`);
  if (at182.badge !== "182") throw new Error(`题面题号应为 182，实际「${at182.badge}」`);
  if (!at182.cells.length) throw new Error("答题卡没有标出当前题");
  for (const c of at182.cells) {
    if (c !== "182") throw new Error(`答题卡当前格应为 182，实际「${c}」`);
  }
  await page.screenshot({ path: `${OUT}/04c-qno.png`, fullPage: true });

  // 带 ?q= 进来后翻页，不能被旧参数拽回原题
  await page.getByRole("button", { name: "上一题" }).click();
  await page.waitForTimeout(300);
  const at181 = await read();
  if (at181.pos !== 181) throw new Error(`上一题后应在 181，实际 ${at181.pos}`);
  if (at181.badge !== "181") throw new Error(`上一题后题面题号应为 181，实际「${at181.badge}」`);
});

await step("结果页答题卡按练习序号并能跳题", async () => {
  await page.getByRole("button", { name: "返回" }).click();
  await page.getByRole("button", { name: "结束并看结果" }).click();
  await page.waitForURL(/\/quiz\/[^/]+\/result/, { timeout: 15000 });
  await page.waitForSelector('button[aria-label^="第 "]', { timeout: 20000 });

  const nos = await page.$$eval('button[aria-label^="第 "]', (els) =>
    els.map((e) => Number((e.textContent ?? "").trim())),
  );
  for (let i = 0; i < nos.length; i++) {
    if (nos[i] !== i + 1) throw new Error(`答题卡应为连续序号，第 ${i + 1} 格是 ${nos[i]}`);
  }
  await page.screenshot({ path: `${OUT}/04d-result.png`, fullPage: true });
  await page
    .locator('div.card:has(button[aria-label^="第 "])')
    .first()
    .screenshot({ path: `${OUT}/04e-result-sheet.png` });
  await page
    .locator('li.card:has-text("正确答案")')
    .first()
    .screenshot({ path: `${OUT}/04f-result-item.png` });

  await page.locator('button[aria-label^="第 3 题"]').first().click();
  await page.waitForURL(/[?&]q=3(?:&|$)/, { timeout: 10000 });
  await page.waitForSelector("text=提交答案", { timeout: 30000 });
  const m = (await page.textContent("body")).match(/第\s*(\d+)\s*\/\s*\d+\s*题/);
  if (!m || Number(m[1]) !== 3) throw new Error(`点第 3 格后应停在第 3 题，实际 ${m?.[1]}`);
});

await step("错题本可用", async () => {
  await page.goto(`${BASE}/wrong`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/05-wrong.png`, fullPage: true });
});

await step("统计页可用", async () => {
  await page.goto(`${BASE}/stats`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=累计答题", { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/06-stats.png`, fullPage: true });
});

await step("我的页可用", async () => {
  await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=关于", { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/07-profile.png`, fullPage: true });
});

await step("Office 章拆成 Word / Excel / PowerPoint 三个板块", async () => {
  await page.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: "Office 办公软件" }).first().click();
  for (const t of ["Word 文字处理", "Excel 电子表格", "PowerPoint 演示文稿"]) {
    await page.waitForSelector(`text=${t}`, { timeout: 10000 });
  }
  // 三个板块的题量之和必须等于该章总量（拆板块不能丢题）
  const check = await page.evaluate(async () => {
    const { units } = await fetch("./data/units.json").then((r) => r.json());
    const ch3 = units.filter((u) => u.chapterId === "ch3");
    const sum = (list) => list.reduce((a, u) => a + u.questionCount, 0);
    const mods = {};
    for (const u of ch3) mods[u.moduleId || "-"] = (mods[u.moduleId || "-"] || 0) + u.questionCount;
    return { total: sum(ch3), mods };
  });
  const parts = Object.values(check.mods).reduce((a, b) => a + b, 0);
  if (parts !== check.total) throw new Error(`板块题量和 ${parts} ≠ 章总量 ${check.total}`);
  await page.screenshot({ path: `${OUT}/07b-library-office.png`, fullPage: true });
});

await step("选题浮层按板块过滤题量", async () => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.click("text=开始刷题");
  await page.waitForSelector("text=选题", { timeout: 15000 });
  await page.locator("button", { hasText: "Office 办公软件" }).first().click();
  await page.waitForSelector("text=二、板块", { timeout: 10000 });
  await page.locator("button", { hasText: "Word 文字处理" }).first().click();
  const expectWord = await page.evaluate(async () => {
    const { units } = await fetch("./data/units.json").then((r) => r.json());
    return units
      .filter((u) => u.chapterId === "ch3" && u.moduleId === "w")
      .reduce((a, u) => a + u.questionCount, 0);
  });
  const sheetText = await page.textContent("body");
  if (!new RegExp(`本次\\s*${expectWord}\\s*题`).test(sheetText)) {
    throw new Error(`Word 板块题量应为 ${expectWord}：` + sheetText.slice(0, 160));
  }
  await page.screenshot({ path: `${OUT}/07c-sheet-module.png` });
  await page.getByRole("button", { name: "开始", exact: true }).click();
  await page.waitForSelector("text=提交答案", { timeout: 45000 });
  const title = await page.textContent("body");
  if (!title.includes("Word 文字处理")) throw new Error("练习标题没带板块名：" + title.slice(0, 120));
  if (!new RegExp(`/\\s*${expectWord}\\s*题`).test(title)) {
    throw new Error(`本次练习题量应为 ${expectWord}`);
  }
  await page.screenshot({ path: `${OUT}/07d-quiz-word.png`, fullPage: true });
});

await step("桌面端布局", async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=开始刷题", { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/08-desktop.png`, fullPage: true });
});

await browser.close();

if (errors.length) {
  console.log("\n发现问题：");
  for (const e of errors) console.log("  " + e);
  process.exit(1);
}
console.log("\n全部通过，无控制台错误。");
