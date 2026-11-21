#!/usr/bin/env node
/**
 * 构建期预渲染（SSG）
 *
 * GitHub Pages 是纯静态托管，没有 Node 运行时，无法做「请求时 SSR」。
 * 因此本项目把 SSR 落在构建期：vite 先构建服务端 bundle，再用本脚本
 * 把每个公开路由渲染成静态 HTML，与客户端产物一起发布。
 *
 *   1. 读取客户端产出的 index.html 作为模板（保证 head / 脚本 / 样式一致）
 *   2. 用服务端 bundle 渲染路由，替换 <div id="root"></div>
 *   3. 输出 dist/client/<route>/index.html，便于 GitHub Pages 直接命中
 *   4. 生成 404.html 与 .nojekyll
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(root, "dist", "client");
const serverEntry = join(root, "dist", "server", "entry-server.js");

const ROUTES = [
  { path: "/", title: "计基速刷 · 江西专升本计算机题库" },
  { path: "/library", title: "选择题库 · 计基速刷" },
  { path: "/wrong", title: "错题本 · 计基速刷" },
  { path: "/notes", title: "我的笔记 · 计基速刷" },
  { path: "/favorites", title: "我的收藏 · 计基速刷" },
  { path: "/stats", title: "学习统计 · 计基速刷" },
  { path: "/profile", title: "我的 · 计基速刷" },
];

if (!existsSync(serverEntry)) {
  console.error("[prerender] 找不到服务端产物：", serverEntry);
  process.exit(1);
}

const { render } = await import(pathToFileURL(serverEntry).href);
const template = readFileSync(join(clientDir, "index.html"), "utf-8");
const ROOT_DIV = '<div id="root"></div>';

if (!template.includes(ROOT_DIV)) {
  console.error("[prerender] index.html 中找不到 #root 挂载点");
  process.exit(1);
}

for (const route of ROUTES) {
  const html = render(route.path);
  const page = template
    .replace(ROOT_DIV, `<div id="root">${html}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="江西统考专升本计算机科目题库：1936 道真题、答案与解析，支持刷题、错题本与学习统计。" />`,
    );

  const outDir = route.path === "/" ? clientDir : join(clientDir, route.path.slice(1));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), page, "utf-8");
  console.log(`[prerender] ${route.path} -> ${outDir}/index.html (${(page.length / 1024).toFixed(1)} KB)`);
}

// 404 兜底：未知路径（如 /quiz/xxx）交给客户端渲染。
// 必须用「空壳」模板，不能用预渲染后的首页，否则客户端在非首页路由
// 会拿首页 HTML 去水合，直接触发 React 水合不一致（#418）。
writeFileSync(join(clientDir, "404.html"), template, "utf-8");

// GitHub Pages 需要 .nojekyll，否则 _ 开头目录会被忽略
writeFileSync(join(clientDir, ".nojekyll"), "", "utf-8");

console.log("[prerender] 完成");
