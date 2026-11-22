import { useMemo } from "react";
import { PageContainer, SectionHead, TopBar } from "@/components/layout/AppShell";
import { useHydrated, useManifest, useUnits } from "@/data/hooks";
import { masteryOf, useAppStore } from "@/store/useAppStore";

export default function StatsPage() {
  const { manifest } = useManifest();
  const { units } = useUnits();
  const hydrated = useHydrated();
  const progress = useAppStore((s) => s.progress);
  const wrongBook = useAppStore((s) => s.wrongBook);
  const favorites = useAppStore((s) => s.favorites);

  const total = manifest?.totalQuestions ?? 0;
  const records = Object.values(progress);
  const attempts = records.reduce((a, b) => a + b.attempts, 0);
  const correct = records.reduce((a, b) => a + b.correct, 0);
  const practiced = records.length;
  const mastery = total ? Math.round(records.reduce((a, b) => a + masteryOf(b), 0) / total) : 0;
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;

  const daily = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const from = d.getTime();
      const to = from + 86400000;
      const count = records.filter((r) => r.lastAt >= from && r.lastAt < to).length;
      days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count });
    }
    return days;
  }, [records]);

  const peak = Math.max(0, ...daily.map((d) => d.count));
  const maxDaily = Math.max(1, peak);

  const unitStats = useMemo(() => {
    if (!units) return [];
    return units
      .map((u) => {
        const done = Object.keys(progress).filter((k) => k.startsWith(`${u.id}-`)).length;
        return { ...u, done, pct: u.questionCount ? Math.round((done / u.questionCount) * 100) : 0 };
      })
      .filter((u) => u.done > 0)
      .sort((a, b) => b.done - a.done)
      .slice(0, 10);
  }, [units, progress]);

  const figures = [
    { label: "累计答题", value: hydrated ? attempts : 0, unit: "次", cls: "text-ink" },
    { label: "答对", value: hydrated ? correct : 0, unit: "题", cls: "text-green" },
    { label: "正确率", value: hydrated ? accuracy : 0, unit: "%", cls: "text-azure" },
    { label: "掌握度", value: hydrated ? mastery : 0, unit: "%", cls: "text-ink" },
  ];

  return (
    <div className="min-h-dvh">
      <TopBar title="学习统计" kicker="只统计这台设备上的记录" />

      <PageContainer className="pt-4">
        {/* 四格读数 */}
        <section className="card grid grid-cols-2 gap-y-3 p-4">
          {figures.map((f, i) => (
            <div key={f.label} className={i % 2 === 1 ? "border-l border-shell-2 pl-4" : ""}>
              <p className="text-[10.5px] font-semibold text-ink-3">{f.label}</p>
              <p
                className={`num mt-0.5 flex items-baseline gap-0.5 text-[24px] leading-none font-extrabold ${f.cls}`}
              >
                {f.value}
                <span className="text-[10px] font-bold text-ink-3">{f.unit}</span>
              </p>
            </div>
          ))}
        </section>

        {/* 近 14 天 */}
        <div className="mt-6">
          <SectionHead right={`单日最高 ${peak} 题`}>近 14 天</SectionHead>
          <section className="card p-4">
            {peak === 0 ? (
              <div className="flex h-[104px] items-center justify-center">
                <p className="text-[12px] text-ink-3">这 14 天还没有答题记录</p>
              </div>
            ) : (
              <div className="flex h-[104px] items-end gap-[4px]">
                {daily.map((d) => (
                  <div
                    key={d.label}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end"
                    title={`${d.label}：${d.count} 题`}
                  >
                    <span
                      className={`num mb-1 text-[9px] leading-none font-bold ${
                        d.count ? "text-azure" : "text-transparent"
                      }`}
                    >
                      {d.count}
                    </span>
                    <div
                      className={`w-full rounded-t-[4px] ${
                        d.count ? "bg-azure" : "bg-shell-2"
                      }`}
                      style={{ height: `${d.count ? Math.max(6, (d.count / maxDaily) * 74) : 4}px` }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="num mt-2 flex justify-between text-[9.5px] font-semibold text-ink-3">
              <span>{daily[0].label}</span>
              <span>{daily[Math.floor(daily.length / 2)].label}</span>
              <span>{daily[daily.length - 1].label}</span>
            </div>
          </section>
        </div>

        {/* 进度 */}
        <div className="mt-6">
          <SectionHead right={`${total} 题`}>进度</SectionHead>
          <section className="card p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10.5px] font-semibold text-ink-3">题库完成度</p>
                <p className="num mt-0.5 text-[26px] leading-none font-extrabold text-azure">
                  {total ? Math.round((practiced / total) * 100) : 0}
                  <span className="text-[11px] font-bold text-ink-3">%</span>
                </p>
              </div>
              <p className="num pb-1 text-[11px] font-semibold text-ink-3">
                {practiced} / {total}
              </p>
            </div>
            <div className="mt-3 h-[8px] overflow-hidden rounded-full bg-shell-2">
              <div
                className="h-full rounded-full bg-azure"
                style={{ width: `${total ? Math.min(100, (practiced / total) * 100) : 0}%` }}
              />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 border-t border-shell-2 pt-3">
              <div className="flex items-baseline justify-between pr-3">
                <dt className="text-[12px] text-ink-2">错题本</dt>
                <dd className="num text-[13px] font-extrabold text-red">
                  {hydrated ? Object.keys(wrongBook).length : 0}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-l border-shell-2 pl-3">
                <dt className="text-[12px] text-ink-2">收藏</dt>
                <dd className="num text-[13px] font-extrabold text-ink">
                  {hydrated ? favorites.length : 0}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* 章节进度 */}
        {unitStats.length ? (
          <div className="mt-6">
            <SectionHead right={`前 ${unitStats.length} 个`}>练得最多的</SectionHead>
            <ul className="space-y-2.5">
              {unitStats.map((u) => (
                <li key={u.id} className="card p-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[13px] font-bold text-ink">
                      {[u.chapterTitle, u.moduleTitle, u.title].filter(Boolean).join(" · ")}
                    </span>
                    <span className="num shrink-0 text-[11px] font-semibold text-ink-3">
                      {u.done}/{u.questionCount}
                    </span>
                  </div>
                  <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-shell-2">
                    <div className="h-full rounded-full bg-azure" style={{ width: `${u.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-6 px-1 pb-2 text-[10px] leading-5 text-ink-3">
          记录只存在这台设备的浏览器里。排行榜与历年真题需要联网数据，本站没有，也不假装有。
        </p>
      </PageContainer>
    </div>
  );
}
