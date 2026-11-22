import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, NotebookPen, Star, XCircle } from "lucide-react";
import { Checker, PageContainer, SectionHead } from "@/components/layout/AppShell";
import { CoverArt } from "@/components/common/Illustration";
import { useHydrated, useManifest, useUnits } from "@/data/hooks";
import { todayCount, useStudyDays } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { QuestionBankSheet } from "@/features/library/QuestionBankSheet";

export default function HomePage() {
  const { manifest } = useManifest();
  const { units } = useUnits();
  const hydrated = useHydrated();
  const progress = useAppStore((s) => s.progress);
  const wrongBook = useAppStore((s) => s.wrongBook);
  const favorites = useAppStore((s) => s.favorites);
  const notes = useAppStore((s) => s.notes);
  const sessions = useAppStore((s) => s.sessions);
  const [bank, setBank] = useState<{
    open: boolean;
    mode: "quiz" | "recite";
    tab: "subject" | "years";
  }>({ open: false, mode: "quiz", tab: "subject" });

  const total = manifest?.totalQuestions ?? 0;
  const attempts = Object.values(progress).reduce((a, b) => a + b.attempts, 0);
  const correct = Object.values(progress).reduce((a, b) => a + b.correct, 0);
  const days = useStudyDays(progress);
  const today = todayCount(progress);

  const chapterStats = useMemo(() => {
    const out = new Map<string, { count: number; done: number }>();
    units?.forEach((u) => {
      const cur = out.get(u.chapterId) ?? { count: 0, done: 0 };
      cur.count += u.questionCount;
      out.set(u.chapterId, cur);
    });
    Object.keys(progress).forEach((id) => {
      const cur = out.get(id.slice(0, 3));
      if (cur) cur.done += 1;
    });
    return out;
  }, [units, progress]);

  const pending = sessions.find(
    (s) => s.questionIds.length && Object.keys(s.revealed).length < s.questionIds.length,
  );

  return (
    <div className="min-h-dvh">
      {/* 封面：天蓝铺底，棋盘格压边，白字与手绘插画 */}
      <header className="bg-azure">
        <Checker />
        <div className="mx-auto max-w-[560px] px-5 pb-20 pt-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[10.5px] font-bold tracking-[0.14em] text-on-azure">
                江西省普通高校专升本招生考试
              </p>
              <h1 className="mt-2 text-[35px] leading-none font-extrabold tracking-tight text-white">
                计基速刷
              </h1>
              <p className="mt-2 text-[12.5px] leading-5 font-semibold text-white">
                计算机（信息技术）
              </p>
            </div>
            <CoverArt className="mt-[2px] w-[148px] shrink-0 translate-x-1" />
          </div>

          <dl className="mt-5 flex items-end gap-6">
            {[
              { k: "今日", v: hydrated ? today : 0, u: "题" },
              {
                k: "正确率",
                v: hydrated && attempts ? Math.round((correct / attempts) * 100) : 0,
                u: "%",
              },
              { k: "连续", v: hydrated ? days : 0, u: "天" },
            ].map((it) => (
              <div key={it.k} className="min-w-[52px]">
                <dt className="text-[10px] font-bold tracking-wider text-on-azure">{it.k}</dt>
                <dd className="num mt-0.5 flex items-baseline gap-0.5 text-[21px] leading-none font-extrabold text-white">
                  {it.v}
                  <span className="text-[9.5px] font-bold text-on-azure">{it.u}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <PageContainer className="-mt-12">
        {/* 主行动 */}
        <section className="card p-4">
          <button
            type="button"
            onClick={() => setBank({ open: true, mode: "quiz", tab: "subject" })}
            className="press bg-yellow text-ink shadow-[0_3px_0_var(--yellow-deep)] mt-4 flex h-[50px] w-full items-center justify-center gap-2 text-[16px] active:translate-y-[3px]"
          >
            开始刷题
          </button>
          <button
            type="button"
            onClick={() => setBank({ open: true, mode: "recite", tab: "subject" })}
            className="press mt-2 h-[42px] w-full rounded-[12px] bg-shell text-[13.5px] font-bold text-ink-2 active:translate-y-[1px]"
          >
            背题模式 · 直接看答案
          </button>
        </section>

        {/* 续答 */}
        {pending ? (
          <Link
            to={`/quiz/${pending.id}`}
            className="card mt-3 flex items-center gap-3 p-3.5 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <span className="num flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-azure text-[12px] font-extrabold text-white">
              {pending.index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-bold text-ink">
                接着上次 · {pending.title}
              </span>
              <span className="num mt-0.5 block text-[10.5px] text-ink-3">
                已完成 {Object.keys(pending.revealed).length} / {pending.questionIds.length} 题
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-azure" aria-hidden />
          </Link>
        ) : null}

        {/* 七个专题：两列书架，第 8 格留给按题型 */}
        <div className="mt-6">
          <SectionHead right={`${total} 题`}>七个专题</SectionHead>
          <div className="grid grid-cols-2 gap-2.5">
            {manifest?.chapters.map((c, i) => {
              const st = chapterStats.get(c.id);
              const pct = st && st.count ? Math.min(100, (st.done / st.count) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  to={`/library#${c.id}`}
                  className="card p-3 transition-shadow hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="num flex size-6 items-center justify-center rounded-[7px] bg-azure text-[10px] font-extrabold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="num ml-auto text-[11px] font-bold text-ink-3">
                      {st?.count ?? 0}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[34px] text-[12.5px] leading-[1.35] font-extrabold text-ink">
                    {c.title}
                  </p>
                  <span className="mt-1.5 flex h-[5px] overflow-hidden rounded-full bg-shell-2">
                    <span
                      className="block h-full rounded-full bg-azure"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="num mt-1 block text-[9.5px] font-semibold text-ink-3">
                    {hydrated ? `已练 ${st?.done ?? 0}` : "未开始"}
                  </span>
                </Link>
              );
            })}
            <Link
              to="/library"
              className="flex flex-col justify-between rounded-[18px] border-2 border-dashed border-azure/35 bg-transparent p-3 transition-colors hover:border-azure/60"
            >
              <span className="num flex size-6 items-center justify-center rounded-[7px] border-2 border-azure/40 text-[13px] font-extrabold text-azure">
                +
              </span>
              <p className="mt-2 min-h-[34px] text-[12.5px] leading-[1.35] font-extrabold text-azure">
                按题型挑题
              </p>
              <span className="num mt-1 block text-[9.5px] font-semibold text-azure/70">
                8 种题型
              </span>
            </Link>
          </div>
        </div>

        {/* 我的 */}
        <div className="mt-6">
          <SectionHead>我的</SectionHead>
          <ul className="card divide-y divide-shell-2 overflow-hidden">
            {[
              {
                to: "/wrong",
                icon: XCircle,
                label: "错题本",
                n: Object.keys(wrongBook).length,
                tint: "text-red",
              },
              { to: "/favorites", icon: Star, label: "收藏", n: favorites.length, tint: "text-azure" },
              {
                to: "/notes",
                icon: NotebookPen,
                label: "笔记",
                n: Object.keys(notes).length,
                tint: "text-green",
              },
            ].map((r) => (
              <li key={r.to}>
                <Link
                  to={r.to}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-shell"
                >
                  <r.icon className={`size-[17px] ${r.tint}`} strokeWidth={2.1} aria-hidden />
                  <span className="text-[13.5px] font-semibold text-ink">{r.label}</span>
                  <span className="num ml-auto text-[13px] font-extrabold text-ink-2">
                    {hydrated ? r.n : 0}
                  </span>
                  <ChevronRight className="size-3.5 text-ink-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="num mt-6 px-1 pb-2 text-[10px] leading-5 text-ink-3">
          题源：《江西省专升本必刷2000题 · 信息技术》及配套答案册 · 每题可溯源到原书页码
        </p>
      </PageContainer>

      <QuestionBankSheet
        open={bank.open}
        onOpenChange={(v) => setBank((b) => ({ ...b, open: v }))}
        initialMode={bank.mode}
        initialTab={bank.tab}
      />
    </div>
  );
}
