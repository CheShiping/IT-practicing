import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ListChecks, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/Primitives";
import { useUnits } from "@/data/hooks";
import { loadChapter } from "@/data/loader";
import type { Unit } from "@/data/types";
import { useAppStore } from "@/store/useAppStore";

export default function LibraryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { units, error } = useUnits();
  const progress = useAppStore((s) => s.progress);
  const [mode, setMode] = useState<"quiz" | "recite">(
    params.get("mode") === "recite" ? "recite" : "quiz",
  );
  const [starting, setStarting] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const byChapter = useMemo(() => {
    const map = new Map<string, Unit[]>();
    for (const u of units ?? []) {
      if (!map.has(u.chapterId)) map.set(u.chapterId, []);
      map.get(u.chapterId)!.push(u);
    }
    return [...map.entries()];
  }, [units]);

  const autoUnit = params.get("unit");

  async function start(unit: Unit) {
    if (starting) return;
    setStarting(unit.id);
    try {
      const chapter = await loadChapter(unit.chapterId);
      const pool = chapter.questions.filter(
        (q) => q.sectionId === unit.id && (mode === "recite" ? true : q.answerable !== false),
      );
      const questions = mode === "recite" ? pool : pool.filter((q) => q.answer.length > 0);
      if (!questions.length) {
        setStarting(null);
        alert("该小节暂无可用题目");
        return;
      }
      const id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      useAppStore.getState().startSession({
        id,
        unitIds: [unit.id],
        chapterIds: [unit.chapterId],
        mode,
        title: `${unit.chapterTitle} · ${unit.title}`,
        questionIds: questions.map((q) => q.id),
        index: 0,
        answers: {},
        revealed: {},
        results: {},
        startedAt: Date.now(),
      });
      navigate(`/quiz/${id}`);
    } catch (e) {
      setStarting(null);
      alert(String(e));
    }
  }

  useMemo(() => {
    if (autoUnit && units) {
      const u = units.find((x) => x.id === autoUnit);
      if (u) void start(u);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoUnit, units]);

  return (
    <div className="min-h-dvh">
      <TopBar title="选择题库" variant="plain" center back />

      <PageContainer className="max-w-[560px] space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => v && setMode(v as "quiz" | "recite")}
            variant="outline"
            className="rounded-xl bg-surface p-1"
          >
            <ToggleGroupItem value="quiz" className="rounded-lg px-5 data-[state=on]:bg-brand data-[state=on]:text-ink">
              考点刷题
            </ToggleGroupItem>
            <ToggleGroupItem value="recite" className="rounded-lg px-5 data-[state=on]:bg-brand data-[state=on]:text-ink">
              考点背诵
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-ink-3">
            {mode === "quiz" ? "先作答后判定，客观题自动判分" : "直接显示答案与解析"}
          </p>
        </div>

        {error ? (
          <EmptyState title="题库加载失败" description={error} />
        ) : !units ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-3">
            <Loader2 className="size-4 animate-spin" aria-hidden /> 题库加载中…
          </div>
        ) : byChapter.length === 0 ? (
          <EmptyState title="暂无可用题库" description="题库数据为空，请检查 data 目录。" />
        ) : (
          byChapter.map(([chapterId, list]) => {
            const done = list.reduce((a, u) => {
              return (
                a +
                Object.keys(progress).filter((k) => k.startsWith(`${u.id}-`)).length
              );
            }, 0);
            const totalQ = list.reduce((a, u) => a + u.gradableCount, 0);
            const isOpen = open[chapterId] ?? true;
            return (
              <section key={chapterId} className="overflow-hidden rounded-2xl bg-white card-shadow">
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [chapterId]: !isOpen }))}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="text-[15px] font-medium text-ink">{list[0].chapterTitle}</span>
                  <span className="flex items-center gap-2">
                    <span className="num text-xs text-ink-3">
                      {done}/{totalQ}
                    </span>
                    <ChevronDown
                      className={`size-4 text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </span>
                </button>
                {isOpen ? (
                  <ul className="border-t border-black/5">
                    {list.map((u) => {
                      const doneCount = Object.keys(progress).filter((k) => k.startsWith(`${u.id}-`)).length;
                      const pct = u.questionCount ? Math.round((doneCount / u.questionCount) * 100) : 0;
                      return (
                        <li key={u.id} className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm text-ink">{u.title}</span>
                              {u.autoJudged ? (
                                <Badge className="rounded-md bg-brand-soft text-[11px] text-ink">可判分</Badge>
                              ) : (
                                <Badge className="rounded-md bg-surface text-[11px] text-ink-2">仅解析</Badge>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface">
                                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="num text-[11px] text-ink-3">
                                {u.questionCount} 题 · 已练 {doneCount}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="h-9 shrink-0 rounded-xl bg-brand px-4 text-ink hover:bg-brand/90"
                            disabled={!!starting}
                            onClick={() => void start(u)}
                          >
                            {starting === u.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                              <ListChecks className="size-4" aria-hidden />
                            )}
                            开始
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })
        )}
      </PageContainer>
    </div>
  );
}
