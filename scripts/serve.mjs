#!/usr/bin/env node
/**
 * 本地静态服务器，行为对齐 GitHub Pages：
 *   - 有扩展名的路径 → 找不到就 404
 *   - 目录路径     → 该目录下的 index.html
 *   - 其它路径     → 404.html（状态码 404），由客户端路由接管
 * 用于本地验证预渲染 + SPA 兜底是否正常。
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "client");
const port = Number(process.env.PORT || 4180);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function send(res, file, status = 200) {
  const data = await readFile(file);
  res.writeHead(status, {
    "content-type": MIME[extname(file)] || "application/octet-stream",
    "cache-control": "no-cache",
  });
  res.end(data);
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  const target = join(root, url);
  try {
    const s = await stat(target);
    if (s.isDirectory()) {
      await send(res, join(target, "index.html"));
      return;
    }
    await send(res, target);
  } catch {
    if (!extname(url)) {
      // 类 GitHub Pages：未知路径回落到 404.html
      try {
        await send(res, join(root, "404.html"), 404);
      } catch {
        res.writeHead(404).end("not found");
      }
    } else {
      res.writeHead(404).end("not found");
    }
  }
}).listen(port, () => {
  console.log(`静态服务器已启动：http://localhost:${port}（根目录 ${root}）`);
});
