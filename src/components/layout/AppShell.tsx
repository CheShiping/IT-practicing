import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChartNoAxesColumn, House, User } from "lucide-react";
import { cn } from "cn";
import { useAppStore } from "@/store/useAppStore";
import { useHydrated } from "@/data/hooks";

const NAV = [
  { to: "/", label: "目录", icon: House },
  { to: "/stats", label: "统计", icon: ChartNoAxesColumn },
  { to: "/profile", label: "我的", icon: User },
];

/** 书脊上的小方块：这本书的标记 */
export function Mark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-[22px] shrink-0 items-center justify-center rounded-[2px] bg-brand text-[12px] font-bold leading-none text-white",
        className,
      )}
    >
      计
    </span>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-[560px] items-stretch">
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[54px] flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                  active ? "font-semibold text-brand" : "text-ink-3",
                )}
              >
                <Icon
                  className="size-[19px]"
                  strokeWidth={active ? 2.1 : 1.7}
                  aria-hidden
                />
                <span>{item.label}</span>
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
    <nav aria-label="主导航" className="hidden border-b border-rule bg-paper md:block">
      <div className="mx-auto flex max-w-[1120px] items-center gap-8 px-6">
        <Link to="/" className="flex items-center gap-2 py-3">
          <Mark />
          <span className="text-[14px] font-bold tracking-tight text-ink">计基速刷</span>
          <span className="label mt-px hidden lg:inline">江西专升本 · 计算机</span>
        </Link>
        <ul className="ml-auto flex items-center gap-6">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-block border-b-2 py-3 text-[13px] transition-colors",
                    active
                      ? "border-brand font-semibold text-ink"
                      : "border-transparent text-ink-3 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="num ml-8 text-[11px] text-ink-3">
          {hydrated
            ? `累计 ${attempts} 题 · 正确率 ${attempts ? Math.round((correct / attempts) * 100) : 0}%`
            : "江西省统考 · 计算机"}
        </p>
      </div>
    </nav>
  );
}

/**
 * 书眉：教辅内页顶部那一行——左边书名或章节名，右边题号/页码读数。
 * cover 只在目录页用，加一条 2px 品红压顶线，像书的封面勒口。
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
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-rule bg-paper",
        cover && "border-t-2 border-t-brand md:hidden",
      )}
    >
      <div className="mx-auto flex min-h-[52px] max-w-[560px] items-center gap-2.5 px-5">
        {back ? (
          <button
            type="button"
            onClick={() => (typeof back === "function" ? back() : navigate(-1))}
            aria-label="返回"
            className="-ml-2 flex size-9 shrink-0 items-center justify-center text-ink-2 transition-colors hover:text-ink active:translate-y-px"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : cover ? (
          <Mark />
        ) : null}

        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "truncate text-[15px] font-bold leading-tight tracking-tight text-ink",
              !title && "sr-only",
            )}
          >
            {title || fallbackTitle}
          </h1>
          {kicker ? (
            <p className="num mt-0.5 truncate text-[11px] leading-tight text-ink-3">{kicker}</p>
          ) : showCountdown ? (
            <p className="num mt-0.5 truncate text-[11px] leading-tight text-ink-3">
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

/** 版面：一页书的正文宽度，桌面端也不拉伸成后台 */
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
        "mx-auto w-full px-5 pb-24 md:pb-14",
        wide ? "max-w-[880px]" : "max-w-[560px]",
        className,
      )}
    >
      {children}
    </main>
  );
}

/** 分区标题：一条印刷线 + 标题，像书的「一、单项选择题」 */
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
    <div id={id} className="mb-2 flex items-baseline gap-2 border-b border-ink pb-1.5">
      <h2 className="text-[13px] font-bold tracking-tight text-ink">{children}</h2>
      {right ? <div className="ml-auto num text-[11px] text-ink-3">{right}</div> : null}
    </div>
  );
}
