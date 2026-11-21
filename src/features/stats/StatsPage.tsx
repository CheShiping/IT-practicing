import { useMemo } from "react";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { RadialProgress, StatCard } from "@/components/common/Primitives";
import { useManifest, useUnits } from "@/data/hooks";
import { masteryOf, useAppStore } from "@/store/useAppStore";

export default function StatsPage() {
  const { manifest } = useManifest();
  const { units } = useUnits();
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

  const maxDaily = Math.max(1, ...daily.map((d) => d.count));

  const unitStats = useMemo(() => {
    if (!units) return [];
    return units
      .map((u) => {
        const done = Object.keys(progress).filter((k) => k.startsWith(`${u.id}-`)).length;
        return { ...u, done, pct: u.questionCount ? Math.round((done / u.questionCount) * 100) : 0 };
      })
      .filter((u) => u.done > 0)
      .sort((a, b) => b.done - a.done)
      .slice(0, 8);
  }, [units, progress]);

  return (
    <div className="min-h-dvh">
      <TopBar title="学习统计" variant="plain" center />
      <PageContainer className="max-w-[720px] space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard value={attempts} unit="次" label="累计答题" />
          <StatCard value={correct} unit="题" label="累计答对" />
          <StatCard value={accuracy} unit="%" label="正确率" />
          <StatCard value={mastery} unit="%" label="综合掌握度" />
        </div>

        <section className="rounded-2xl bg-white p-4 card-shadow">
          <h2 className="text-[15px] font-semibold text-ink">刷题完成度</h2>
          <div className="mt-3 flex items-center gap-5">
            <RadialProgress value={total ? (practiced / total) * 100 : 0} size={92} />
            <ul className="flex-1 space-y-1.5 text-sm text-ink-2">
              <li className="flex justify-between">
                <span>已练题数</span>
                <span className="num text-ink">{practiced}</span>
              </li>
              <li className="flex justify-between">
                <span>题库总量</span>
                <span className="num text-ink">{total}</span>
              </li>
              <li className="flex justify-between">
                <span>错题本</span>
                <span className="num text-ink">{Object.keys(wrongBook).length}</span>
              </li>
              <li className="flex justify-between">
                <span>收藏</span>
                <span className="num text-ink">{favorites.length}</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 card-shadow">
          <h2 className="text-[15px] font-semibold text-ink">近 14 天刷题量</h2>
          <div className="mt-3 flex h-28 items-end gap-1 overflow-hidden">
            {daily.map((d) => (
              <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="num truncate text-[10px] text-ink-3">{d.count || ""}</span>
                <div
                  className="w-full rounded-t bg-brand"
                  style={{ height: `${Math.max(4, (d.count / maxDaily) * 84)}px` }}
                  title={`${d.label}：${d.count} 题`}
                />
                <span className="num truncate text-[10px] text-ink-3">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        {unitStats.length ? (
          <section className="rounded-2xl bg-white p-4 card-shadow">
            <h2 className="text-[15px] font-semibold text-ink">章节进度</h2>
            <ul className="mt-3 space-y-3">
              {unitStats.map((u) => (
                <li key={u.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate text-ink">
                      {u.chapterTitle} · {u.title}
                    </span>
                    <span className="num text-xs text-ink-3">
                      {u.done}/{u.questionCount}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${u.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-center text-[11px] text-ink-3">
          统计仅基于本机浏览器记录；排名与真题等需要联网数据的功能未接入。
        </p>
      </PageContainer>
    </div>
  );
}
