import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageContainer, SectionHead, TopBar } from "@/components/layout/AppShell";
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
    const out = new Map<string, { count: number; done: number; right: number; tries: number }>();
    units?.forEach((u) => {
      const cur = out.get(u.chapterId) ?? { count: 0, done: 0, right: 0, tries: 0 };
      cur.count += u.questionCount;
      out.set(u.chapterId, cur);
    });
    Object.entries(progress).forEach(([id, r]) => {
      const cid = id.slice(0, 3);
      const cur = out.get(cid);
      if (!cur) return;
      cur.done += 1;
      cur.right += r.correct;
      cur.tries += r.attempts;
    });
    return out;
  }, [units, progress]);

  const pending = sessions.find(
    (s) => s.questionIds.length && Object.keys(s.revealed).length < s.questionIds.length,
  );

  return (
    <div className="min-h-dvh">
      <TopBar
        cover
        title="计基速刷"
        kicker={
          !hydrated
            ? "江西省统考 · 计算机（信息技术）"
            : attempts
              ? `今日 ${today} 题 · 累计 ${attempts} 题 · 正确率 ${Math.round(
                  (correct / attempts) * 100,
                )}%`
              : "还没开始 · 原书 1934 道题等着你"
        }
      />

      <PageContainer className="pt-6">
        {/* 扉页 */}
        <section aria-labelledby="title-leaf">
          <p className="label">江西省普通高校专升本招生考试</p>
          <h2
            id="title-leaf"
            className="mt-2 text-[27px] leading-[1.22] font-bold tracking-tight text-ink"
          >
            计算机
            <span className="text-brand">（信息技术）</span>
          </h2>
          <p className="num mt-2.5 text-[12px] leading-5 text-ink-3">
            原书 {total || 1936} 道题 · 逐题答案与解析 · 不登录 · 进度只存在这台设备
          </p>
        </section>

        {/* 主行动 */}
        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={() => setBank({ open: true, mode: "quiz", tab: "subject" })}
            className="press h-[46px] flex-[1.4] rounded-[4px] bg-brand text-[15px] font-bold text-white hover:bg-[#a80a5c] active:translate-y-px"
          >
            开始刷题
          </button>
          <button
            type="button"
            onClick={() => setBank({ open: true, mode: "recite", tab: "subject" })}
            className="press h-[46px] flex-1 rounded-[4px] border border-ink bg-paper text-[15px] font-semibold text-ink hover:bg-paper-2 active:translate-y-px"
          >
            背题
          </button>
        </div>

        {/* 书签：上次停在哪 */}
        {pending ? (
          <Link
            to={`/quiz/${pending.id}`}
            className="mt-4 flex items-center gap-3 border border-brand bg-brand-tint px-3.5 py-3 transition-colors hover:bg-[#fadff0]"
          >
            <span className="label shrink-0 text-brand">续</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-ink">
                {pending.title}
              </span>
              <span className="num mt-0.5 block text-[11px] text-ink-2">
                第 {pending.index + 1} / {pending.questionIds.length} 题 · 已完成{" "}
                {Object.keys(pending.revealed).length} 题
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-brand" aria-hidden />
          </Link>
        ) : null}

        {/* 目录 */}
        <div className="mt-8">
          <SectionHead right={`${total} 题`}>目录</SectionHead>
          <ul>
            {manifest?.chapters.map((c, i) => {
              const st = chapterStats.get(c.id);
              const rate = st && st.tries ? Math.round((st.right / st.tries) * 100) : null;
              return (
                <li key={c.id}>
                  <Link
                    to={`/library#${c.id}`}
                    className="group block border-b border-rule py-3.5 transition-colors hover:bg-paper-2"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="num w-5 shrink-0 text-[11px] text-brand">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 truncate text-[15px] font-medium text-ink group-hover:text-brand">
                        {c.title}
                      </span>
                      <span aria-hidden className="dotline" />
                      <span className="num shrink-0 text-[12px] text-ink-2">
                        {st?.count ?? 0}
                      </span>
                    </div>
                    {hydrated && st && st.done > 0 ? (
                      <div className="num mt-1 flex items-center gap-3 pl-7 text-[11px] text-ink-3">
                        <span>已刷 {st.done}</span>
                        {rate !== null ? <span>正确率 {rate}%</span> : null}
                        <span className="h-[3px] w-16 bg-paper-3">
                          <span
                            className="block h-full bg-brand"
                            style={{
                              width: `${st.count ? Math.min(100, (st.done / st.count) * 100) : 0}%`,
                            }}
                          />
                        </span>
                      </div>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 索引 */}
        <div className="mt-8">
          <SectionHead>我的</SectionHead>
          <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[14px]">
            <li>
              <Link to="/wrong" className="text-ink underline-offset-4 hover:underline">
                错题本
                <span className="num ml-1.5 text-[12px] text-brand">
                  {hydrated ? Object.keys(wrongBook).length : 0}
                </span>
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="text-ink underline-offset-4 hover:underline">
                收藏
                <span className="num ml-1.5 text-[12px] text-brand">
                  {hydrated ? favorites.length : 0}
                </span>
              </Link>
            </li>
            <li>
              <Link to="/notes" className="text-ink underline-offset-4 hover:underline">
                笔记
                <span className="num ml-1.5 text-[12px] text-brand">
                  {hydrated ? Object.keys(notes).length : 0}
                </span>
              </Link>
            </li>
            <li>
              <Link to="/library" className="text-ink underline-offset-4 hover:underline">
                全部题型
              </Link>
            </li>
          </ul>
        </div>

        <p className="num mt-10 border-t border-rule pt-3 text-[10.5px] leading-5 text-ink-3">
          {hydrated && days > 0 ? `连续学习 ${days} 天 · ` : ""}
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
