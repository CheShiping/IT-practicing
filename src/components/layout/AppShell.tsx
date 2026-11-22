import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChartNoAxesColumn, House, User } from "lucide-react";
import { cn } from "cn";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/data/hooks";

const NAV = [
  { to: "/", label: "首页", icon: House },
  { to: "/stats", label: "统计", icon: ChartNoAxesColumn },
  { to: "/profile", label: "我的", icon: User },
];

/** 棋盘格边条：参考图里的品牌纹样，放在状态条顶上 */
export function Checker({ className }: { className?: string }) {
  return <div aria-hidden className={cn("checker h-[10px] w-full", className)} />;
}

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-40 px-3 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto flex max-w-[520px] items-stretch rounded-[18px] bg-paper px-1.5 py-1.5 shadow-[0_-2px_0_rgba(12,26,40,.03),0_10px_28px_rgba(12,40,64,.18)]">
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-[13px] py-2 text-[12px] transition-colors",
                  active ? "text-ink" : "text-ink-3",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-[10px] transition-colors",
                    active ? "bg-yellow" : "bg-transparent",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                </span>
                <span className={active ? "font-extrabold" : "font-medium"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopNav() {
  const { pathname } = useLocation();
  const progress = useAppStore((s) => s.progress);
  const hydrated = useHydrated();
  const attempts = Object.values(progress).reduce((a, b) => a + b.attempts, 0);
  const correct = Object.values(progress).reduce((a, b) => a + b.correct, 0);
  return (
    <nav aria-label="主导航" className="hidden md:block">
      <Checker />
      <div className="bg-azure">
        <div className="mx-auto flex max-w-[1040px] items-center gap-7 px-6">
          <Link to="/" className="flex items-baseline gap-2 py-3">
            <span className="text-[17px] font-extrabold tracking-tight text-white">计基速刷</span>
            <span className="text-[11px] font-semibold text-on-azure/80">江西专升本 · 计算机</span>
          </Link>
          <ul className="ml-auto flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-block rounded-[10px] px-3 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-yellow font-extrabold text-ink"
                        : "font-medium text-on-azure hover:bg-white/15",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="num text-[11px] text-on-azure/70">
            {hydrated
              ? `累计 ${attempts} 题 · 正确率 ${attempts ? Math.round((correct / attempts) * 100) : 0}%`
              : "1934 道原书题"}
          </p>
        </div>
      </div>
    </nav>
  );
}

/**
 * 状态条：天蓝压顶 + 棋盘格；这是全站唯一的"框架"，
 * 页面内容全部是浮在灰底上的白卡。
 */
export function TopBar({
  title,
  kicker,
  back,
  right,
  cover = false,
  fallbackTitle = "计基速刷",
}: {
  title: string;
  kicker?: string;
  back?: boolean | (() => void);
  right?: React.ReactNode;
  cover?: boolean;
  fallbackTitle?: string;
}) {
  const navigate = useNavigate();
  const examDate = useAppStore((s) => s.profile.examDate);
  const hydrated = useHydrated();
  const countdown = useCountdown(examDate);
  const showCountdown = Boolean(title) && !kicker && hydrated && countdown;

  return (
    <header className={cn("sticky top-0 z-30 bg-azure", !cover && "md:hidden")}>
      <Checker />
      <div className="mx-auto flex min-h-[54px] max-w-[560px] items-center gap-2 px-5">
        {back ? (
          <button
            type="button"
            onClick={() => (typeof back === "function" ? back() : navigate(-1))}
            aria-label="返回"
            className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "truncate text-[16px] leading-tight font-extrabold tracking-tight text-white",
              !title && "sr-only",
            )}
          >
            {title || fallbackTitle}
          </h1>
          {kicker ? (
            <p className="num mt-0.5 truncate text-[10.5px] leading-tight font-medium text-on-azure">
              {kicker}
            </p>
          ) : showCountdown ? (
            <p className="num mt-0.5 truncate text-[10.5px] leading-tight font-medium text-on-azure">
              距考试 {countdown.days} 天
            </p>
          ) : null}
        </div>

        {right}
      </div>
    </header>
  );
}

export function useCountdown(examDate: string) {
  const now = Date.now();
  if (!examDate) return { days: "--", hours: "00", minutes: "00", seconds: "00" };
  const target = new Date(`${examDate}T09:00:00`).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return {
    days: String(days),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function PageContainer({
  children,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 pb-28 md:px-6 md:pb-16",
        wide ? "max-w-[960px]" : "max-w-[560px]",
        className,
      )}
    >
      {children}
    </main>
  );
}

/** 分区标题：粗黑体 + 右侧读数，不再用 1px 横线 */
export function SectionHead({
  children,
  right,
  id,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="mb-2.5 flex items-baseline gap-2 px-1">
      <h2 className="text-[13px] font-extrabold tracking-tight text-ink">{children}</h2>
      {right ? (
        <div className="num ml-auto text-[11px] font-semibold text-ink-3">{right}</div>
      ) : null}
    </div>
  );
}
