#!/usr/bin/env node
/**
 * 基本运行验证：用真实浏览器跑一遍主流程
 *   首页 -> 题库 -> 开始练习 -> 作答 -> 判定 -> 结果页 -> 错题本 -> 统计
 * 同时收集 console 错误与未捕获异常。
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:4173";
const OUT = "build/verify";
mkdirSync(OUT, { recursive: true });

const errors = [];
const EXEC =
  process.env.CHROME_PATH ||
  "C:/Users/Shiping/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe";
const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console] ${m.text()}`);
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
  await page.waitForSelector("text=考点刷题", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true });
});

await step("首页显示题库题量", async () => {
  const txt = await page.textContent("body");
  if (!/1936/.test(txt)) throw new Error(`未显示题库总量：${txt.slice(0, 120)}`);
});

await step("打开题库选择浮层", async () => {
  await page.click("text=考点刷题");
  await page.waitForSelector("text=题库选择", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/02-bank-sheet.png` });
});

await step("选中科目并确认进入练习", async () => {
  await page.locator("button", { hasText: "计算机基础知识" }).first().click();
  await page.waitForSelector("text=题型选择", { timeout: 10000 });
  await page.click("text=确认");
  await page.waitForSelector("text=提交答案", { timeout: 20000 });
  await page.screenshot({ path: `${OUT}/03-quiz.png`, fullPage: true });
});

await step("章节列表页可用", async () => {
  await page.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=计算机基础知识", { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/02b-library.png`, fullPage: true });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.click("text=考点刷题");
  await page.waitForSelector("text=题库选择", { timeout: 15000 });
  await page.locator("button", { hasText: "计算机基础知识" }).first().click();
  await page.click("text=确认");
  await page.waitForSelector("text=提交答案", { timeout: 20000 });
});

await step("选择选项并提交", async () => {
  await page.locator("label").first().click();
  await page.click("text=提交答案");
  await page.waitForSelector('[role="status"]', { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/04-judged.png`, fullPage: true });
});

await step("进入下一题", async () => {
  await page.click("text=下一题");
  await page.waitForSelector("text=提交答案", { timeout: 10000 });
});

await step("刷新后进度保留", async () => {
  const url = page.url();
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("text=提交答案", { timeout: 15000 });
  // 刷新后仍停在第 2 题（未作答），回到第 1 题应保留判定结果
  const counter = await page.textContent("body");
  if (!/2\s*单选题/.test(counter)) throw new Error("刷新后题号未保持：" + counter.slice(0, 80));
  await page.goto(`${url}?q=1`, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="status"]', { timeout: 15000 });
  const stored = await page.evaluate(() => localStorage.getItem("msz.v1.app") || "");
  if (!stored.includes("ch1-single-1")) throw new Error("本地进度未保存");
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
  await page.waitForSelector("text=数据管理", { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/07-profile.png`, fullPage: true });
});

await step("桌面端布局", async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=考点刷题", { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/08-desktop.png`, fullPage: true });
});

await browser.close();

if (errors.length) {
  console.log("\n发现问题：");
  for (const e of errors) console.log("  " + e);
  process.exit(1);
}
console.log("\n全部通过，无控制台错误。");
