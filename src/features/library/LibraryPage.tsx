import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/Primitives";
import { useUnits } from "@/data/hooks";
import { loadChapter } from "@/data/loader";
import type { Unit } from "@/data/types";
import { useAppStore } from "@/store/useAppStore";

const CN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

interface Group {
  key: string;
  title?: string;
  units: Unit[];
}

/** 按板块归类（没有板块的章节只有一组）；题型顺序沿用数据里的顺序 */
function groupByModule(list: Unit[]): Group[] {
  const groups: Group[] = [];
  const seen = new Map<string, Group>();
  for (const u of list) {
    const key = u.moduleId ?? "";
    let g = seen.get(key);
    if (!g) {
      g = { key, title: u.moduleTitle, units: [] };
      seen.set(key, g);
      groups.push(g);
    }
    g.units.push(u);
  }
  return groups;
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { units, error } = useUnits();
  const progress = useAppStore((s) => s.progress);
  const [mode, setMode] = useState<"quiz" | "recite">(
    params.get("mode") === "recite" ? "recite" : "quiz",
  );
  const [starting, setStarting] = useState<string | null>(null);
  // 默认只展开第一篇，其余收起
  const [closed, setClosed] = useState<Record<string, boolean>>({});

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
      // 全题型可练：填空走输入比对，主观题揭示答案后自评
      const questions = chapter.questions.filter((q) => q.sectionId === unit.id);
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
        title: [unit.chapterTitle, unit.moduleTitle, unit.title].filter(Boolean).join(" · "),
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

  const doneOf = (list: Unit[]) =>
    list.reduce(
      (a, u) => a + Object.keys(progress).filter((k) => k.startsWith(`${u.id}-`)).length,
      0,
    );

  return (
    <div className="min-h-dvh">
      <TopBar
        title="题库"
        kicker={mode === "quiz" ? "先作答，再判定" : "直接看答案与解析"}
        back
        right={
          <div
            className="flex shrink-0 items-center overflow-hidden rounded-[10px] border border-shell-2"
            role="group"
            aria-label="练习形式"
          >
            <button
              type="button"
              onClick={() => setMode("quiz")}
              aria-pressed={mode === "quiz"}
              className={`px-2.5 py-1 text-[12px] ${
                mode === "quiz" ? "bg-ink font-semibold text-white" : "bg-paper text-ink-2"
              }`}
            >
              刷题
            </button>
            <button
              type="button"
              onClick={() => setMode("recite")}
              aria-pressed={mode === "recite"}
              className={`px-2.5 py-1 text-[12px] ${
                mode === "recite" ? "bg-ink font-semibold text-white" : "bg-paper text-ink-2"
              }`}
            >
              背题
            </button>
          </div>
        }
      />

      <PageContainer className="pt-5">
        {error ? (
          <EmptyState title="题库加载失败" description={error} />
        ) : !units ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-ink-3">
            <Loader2 className="size-4 animate-spin" aria-hidden /> 题库加载中…
          </div>
        ) : byChapter.length === 0 ? (
          <EmptyState title="暂无可用题库" description="题库数据为空，请检查 data 目录。" />
        ) : (
          byChapter.map(([chapterId, list], ci) => {
            const done = doneOf(list);
            const totalQ = list.reduce((a, u) => a + u.questionCount, 0);
            const isOpen = ci === 0 ? !closed[chapterId] : Boolean(closed[chapterId]);
            const groups = groupByModule(list);
            const hasModules = groups.some((g) => g.title);
            return (
              <section key={chapterId} id={chapterId} className={ci ? "mt-6" : undefined}>
                <button
                  type="button"
                  onClick={() => setClosed((o) => ({ ...o, [chapterId]: !o[chapterId] }))}
                  aria-expanded={isOpen}
                  className="flex w-full items-baseline gap-2 border-b border-ink pb-1.5 text-left"
                >
                  <h2 className="text-[13px] font-bold tracking-tight text-ink">
                    <span className="num mr-1.5 text-azure">刷题{CN[ci]}</span>
                    {list[0].chapterTitle}
                  </h2>
                  <span className="num ml-auto text-[11px] text-ink-3">
                    {isOpen
                      ? ""
                      : `${hasModules ? `${groups.length} 个板块 · ` : ""}${list.length} 个题型 · `}
                    {done} / {totalQ}
                  </span>
                  <ChevronDown
                    className={`size-3.5 shrink-0 text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                <div className={isOpen ? "space-y-3 pt-3" : "hidden"}>
                  {groups.map((g) => (
                    <div key={g.key || "all"}>
                      {g.title ? (
                        <div className="mb-2 flex items-baseline gap-2 border-l-[3px] border-azure pl-2">
                          <h3 className="text-[12px] font-semibold tracking-tight text-ink-2">
                            {g.title}
                          </h3>
                          <span className="num ml-auto text-[10.5px] text-ink-3">
                            {g.units.length} 个题型 · {doneOf(g.units)} /{" "}
                            {g.units.reduce((a, u) => a + u.questionCount, 0)}
                          </span>
                        </div>
                      ) : null}
                      <ul className="space-y-2">
                        {g.units.map((u) => {
                          const doneCount = Object.keys(progress).filter((k) =>
                            k.startsWith(`${u.id}-`),
                          ).length;
                          const pct = u.questionCount
                            ? Math.round((doneCount / u.questionCount) * 100)
                            : 0;
                          return (
                            <li key={u.id} className="card flex items-center gap-3 p-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                  <span className="truncate text-[14.5px] text-ink">{u.title}</span>
                                  <span
                                    className={`num ml-auto shrink-0 text-[10.5px] ${
                                      u.autoJudged ? "text-azure" : "text-ink-3"
                                    }`}
                                  >
                                    {u.kind === "blank"
                                      ? "填空自测"
                                      : u.autoJudged
                                        ? "自动判分"
                                        : "参考答案自评"}
                                  </span>
                                </div>
                                <div className="num mt-1 flex items-center gap-2 text-[11px] text-ink-3">
                                  <span>
                                    {u.questionCount} 题 · 已练 {doneCount}
                                  </span>
                                  <span className="h-[3px] w-14 bg-shell-2">
                                    <span
                                      className="block h-full bg-azure"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="press h-8 shrink-0 rounded-[10px] border border-azure bg-paper px-3 text-[12.5px] font-semibold text-azure hover:bg-[#e9f6ff] active:translate-y-px"
                                disabled={!!starting}
                                onClick={() => void start(u)}
                              >
                                {starting === u.id ? (
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                                ) : (
                                  "开始"
                                )}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}

        <p className="num mt-8 border-t border-shell-2 pt-3 text-[10.5px] leading-5 text-ink-3">
          题号按本站练习顺序编排，每节从 1 开始，原书页码可溯源 · 主观题给参考答案，不自动判分
        </p>
      </PageContainer>
    </div>
  );
}
