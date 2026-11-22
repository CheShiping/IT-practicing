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
    { label: "答对", value: hydrated ? correct : 0, unit: "题", cls: "text-brand" },
    { label: "正确率", value: hydrated ? accuracy : 0, unit: "%", cls: "text-ink" },
    { label: "掌握度", value: hydrated ? mastery : 0, unit: "%", cls: "text-ink" },
  ];

  return (
    <div className="min-h-dvh">
      <TopBar title="学习统计" kicker="只统计这台设备上的记录" />

      <PageContainer className="pt-5">
        {/* 读数：一张印刷表，不是四张卡片 */}
        <dl className="grid grid-cols-2 border-y border-ink sm:grid-cols-4">
          {figures.map((f, i) => (
            <div
              key={f.label}
              className={`py-3 ${i % 2 === 1 ? "border-l border-rule pl-3" : ""} ${
                i >= 2 ? "border-t border-rule sm:border-t-0" : ""
              } ${i === 2 ? "sm:border-l sm:border-rule sm:pl-3" : ""}`}
            >
              <dt className="text-[11px] text-ink-3">{f.label}</dt>
              <dd className={`num mt-0.5 flex items-baseline gap-0.5 text-[24px] font-bold leading-none ${f.cls}`}>
                {f.value}
                <span className="text-[11px] font-normal text-ink-3">{f.unit}</span>
              </dd>
            </div>
          ))}
        </dl>

        {/* 近 14 天 */}
        <div className="mt-8">
          <SectionHead right={`单日最高 ${peak} 题`}>近 14 天</SectionHead>
          {peak === 0 ? (
            <div className="flex h-[96px] items-center justify-center border-b border-ink">
              <p className="text-[12px] text-ink-3">这 14 天还没有答题记录</p>
            </div>
          ) : (
          <div className="flex h-[96px] items-end gap-[3px] border-b border-ink">
            {daily.map((d) => (
              <div
                key={d.label}
                className="group flex min-w-0 flex-1 flex-col items-center justify-end"
                title={`${d.label}：${d.count} 题`}
              >
                <span
                  className={`num mb-0.5 text-[9.5px] leading-none ${
                    d.count ? "text-brand" : "text-transparent"
                  }`}
                >
                  {d.count}
                </span>
                <div
                  className={`w-full ${d.count ? "bg-brand" : "bg-paper-3"}`}
                  style={{ height: `${d.count ? Math.max(4, (d.count / maxDaily) * 68) : 3}px` }}
                />
              </div>
            ))}
          </div>
          )}
          <div className="num mt-1 flex justify-between text-[9.5px] text-ink-3">
            <span>{daily[0].label}</span>
            <span>{daily[Math.floor(daily.length / 2)].label}</span>
            <span>{daily[daily.length - 1].label}</span>
          </div>
        </div>

        {/* 库存 */}
        <div className="mt-8">
          <SectionHead right={`${total} 题`}>进度</SectionHead>
          <dl className="num text-[13px]">
            {[
              { k: "已练过", v: practiced },
              { k: "错题本", v: Object.keys(wrongBook).length },
              { k: "收藏", v: favorites.length },
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between border-b border-rule py-2">
                <dt className="font-sans text-ink-2">{r.k}</dt>
                <dd className="font-bold text-ink">{hydrated ? r.v : 0}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-2 flex h-[6px] w-full bg-paper-3">
            <span
              className="h-full bg-brand"
              style={{ width: `${total ? Math.min(100, (practiced / total) * 100) : 0}%` }}
            />
          </div>
          <p className="num mt-1 text-[10.5px] text-ink-3">
            题库完成度 {total ? Math.round((practiced / total) * 100) : 0}%
          </p>
        </div>

        {/* 章节进度 */}
        {unitStats.length ? (
          <div className="mt-8">
            <SectionHead right={`前 ${unitStats.length} 个小节`}>练得最多的</SectionHead>
            <ul>
              {unitStats.map((u) => (
                <li key={u.id} className="border-b border-rule py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[13.5px] text-ink">
                      {u.chapterTitle} · {u.title}
                    </span>
                    <span className="num shrink-0 text-[11px] text-ink-3">
                      {u.done}/{u.questionCount}
                    </span>
                  </div>
                  <div className="mt-1 h-[3px] bg-paper-3">
                    <div className="h-full bg-brand" style={{ width: `${u.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="num mt-8 border-t border-rule pt-3 text-[10.5px] leading-5 text-ink-3">
          记录只存在这台设备的浏览器里。排行榜与历年真题需要联网数据，本站没有，也不假装有。
        </p>
      </PageContainer>
    </div>
  );
}
