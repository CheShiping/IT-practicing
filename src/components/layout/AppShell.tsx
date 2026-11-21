import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, House, User } from "lucide-react";
import { cn } from "cn";
import { useHydrated } from "@/data/hooks";
import { useAppStore } from "@/store/useAppStore";

const NAV = [
  { to: "/", label: "首页", icon: House },
  { to: "/stats", label: "统计", icon: CalendarCheck },
  { to: "/profile", label: "我的", icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {NAV.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[12px] transition-colors",
                  active ? "text-ink" : "text-ink-3",
                )}
              >
                <Icon
                  className={cn("size-[22px]", active ? "text-ink" : "text-ink-3")}
                  strokeWidth={active ? 2.2 : 1.8}
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
  return (
    <nav aria-label="主导航" className="hidden border-b border-black/5 bg-white md:block">
      <ul className="mx-auto flex max-w-[1200px] items-center gap-1 px-6">
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-3 text-sm transition-colors",
                  active ? "font-medium text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
                {active && (
                  <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TopBar({
  title,
  subtitle,
  back,
  right,
  variant = "yellow",
  center = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean | (() => void);
  right?: React.ReactNode;
  variant?: "yellow" | "plain";
  center?: boolean;
}) {
  const navigate = useNavigate();
  const examDate = useAppStore((s) => s.profile.examDate);

  const hydrated = useHydrated();
  const countdown = useCountdown(examDate);
  const showCountdown = variant === "yellow" && !subtitle && hydrated && countdown;

  const yellow = variant === "yellow";
  return (
    <header className={yellow ? "brand-bar" : "border-b border-black/5 bg-white"}>
      <div
        className={cn(
          "mx-auto flex min-h-11 max-w-[1200px] items-center gap-2 px-4 md:px-6",
          center && !back && "justify-center",
        )}
      >
        {back ? (
          <button
            type="button"
            onClick={() => (typeof back === "function" ? back() : navigate(-1))}
            aria-label="返回"
            className={cn(
              "-ml-1 inline-flex size-8 items-center justify-center rounded-md transition-colors",
              yellow ? "text-brand-ink/80 hover:bg-black/5" : "text-ink-2 hover:bg-black/5",
            )}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        <div className={cn("min-w-0", !center && !back && "flex-1", center && "text-center")}>
          <p
            className={cn(
              "truncate text-[15px] font-semibold",
              yellow ? "text-brand-ink" : "text-ink",
            )}
          >
            {title}
          </p>
          {subtitle ? (
            <p className={cn("truncate text-xs", yellow ? "text-brand-ink/70" : "text-ink-3")}>
              {subtitle}
            </p>
          ) : showCountdown ? (
            <p className={cn("num truncate text-xs", yellow ? "text-brand-ink/70" : "text-ink-3")}>
              距考试 {countdown.days} 天 {countdown.hours}:{countdown.minutes}:{countdown.seconds}
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-[1200px] px-4 pb-24 md:px-6 md:pb-10", className)}>
      {children}
    </main>
  );
}
