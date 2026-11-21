import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App";

/** 构建期预渲染入口：把指定路由渲染成 HTML 字符串 */
export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url} basename={import.meta.env.BASE_URL}>
      <App />
    </StaticRouter>,
  );
}
