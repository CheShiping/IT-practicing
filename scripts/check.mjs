#!/usr/bin/env node
/**
 * 验证门禁的收尾一段：构建产物 → 起类 Pages 静态服务器 → 跑 verify.mjs → 收尾。
 *
 * 由 `npm run check` 调用，此时 typecheck / lint / build 已通过。
 * 单独手动跑也可以：node scripts/check.mjs（需先 npm run build）。
 *
 * 退出码 0 = 门禁绿；非 0 = 门禁红，按 AGENTS.md 只修不加。
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const PORT = String(process.env.CHECK_PORT || 4180);
const BASE = `http://localhost:${PORT}`;

if (!existsSync(join(root, "dist/client/index.html"))) {
  console.error("未找到 dist/client/index.html，请先 npm run build");
  process.exit(1);
}

async function waitForServer(timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try {
      const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return;
    } catch {
      // 还没起来，继续等
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`静态服务器 ${timeout}ms 内未就绪`);
}

const server = spawn(process.execPath, [join(here, "serve.mjs")], {
  env: { ...process.env, PORT },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverErr = "";
server.stderr.on("data", (d) => (serverErr += d));

let closed = false;
const cleanup = () => {
  if (closed) return;
  closed = true;
  try {
    server.kill();
  } catch {
    // 已退出
  }
};
process.on("exit", cleanup);
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    cleanup();
    process.exit(130);
  });
}

let code = 1;
try {
  console.log(`起静态服务器：${BASE}（端口 ${PORT}）`);
  await waitForServer();
  code = await new Promise((resolve) => {
    const verify = spawn(process.execPath, [join(here, "verify.mjs")], {
      env: { ...process.env, BASE_URL: BASE },
      stdio: "inherit",
    });
    verify.on("exit", (c) => resolve(c ?? 1));
  });
} catch (e) {
  console.error(`门禁失败：${e.message}`);
  if (serverErr.trim()) console.error(serverErr.trim());
  code = 1;
} finally {
  cleanup();
}

console.log(
  code === 0
    ? "\n门禁通过，可以提交。"
    : "\n门禁红：只修不加；修完重跑 npm run check。",
);
process.exit(code);
