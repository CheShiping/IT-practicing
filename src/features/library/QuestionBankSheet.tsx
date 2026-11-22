import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "cn";
import { useUnits } from "@/data/hooks";
import { loadChapter } from "@/data/loader";
import type { Unit } from "@/data/types";
import { useAppStore } from "@/store/useAppStore";

const YEARS = [2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013];

/**
 * 选题：像从书的扉页翻到目录——先选专题，再选题型，最后定练习形式。
 */
export function QuestionBankSheet({
  open,
  onOpenChange,
  initialMode = "quiz",
  initialTab = "subject",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialMode?: "quiz" | "recite";
  initialTab?: "subject" | "years";
}) {
  const navigate = useNavigate();
  const { units } = useUnits();
  const [tab, setTab] = useState<"subject" | "years">(initialTab);
  const [mode, setMode] = useState<"quiz" | "recite">(initialMode);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [kindKeys, setKindKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const chapters = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    for (const u of units ?? []) {
      const cur = map.get(u.chapterId);
      if (cur) cur.count += u.questionCount;
      else map.set(u.chapterId, { id: u.chapterId, title: u.chapterTitle, count: u.questionCount });
    }
    return [...map.values()];
  }, [units]);

  const kinds = useMemo(
    () => (units ?? []).filter((u) => u.chapterId === chapterId),
    [units, chapterId],
  );

  const pickedCount = useMemo(() => {
    const picked = kinds.filter((u) => !kindKeys.length || kindKeys.includes(u.kind));
    return picked.reduce((a, u) => a + u.questionCount, 0);
  }, [kinds, kindKeys]);

  function reset() {
    setChapterId(null);
    setKindKeys([]);
    setMode("quiz");
  }

  async function confirm() {
    if (!chapterId || busy) return;
    setBusy(true);
    try {
      const picked: Unit[] = (units ?? []).filter(
        (u) => u.chapterId === chapterId && (!kindKeys.length || kindKeys.includes(u.kind)),
      );
      const ids = picked.map((u) => u.id);
      const chapter = await loadChapter(chapterId);
      const pool = chapter.questions.filter((q) => ids.includes(q.sectionId));
      const questions = mode === "recite" ? pool : pool.filter((q) => q.answer.length > 0);
      if (!questions.length) {
        setBusy(false);
        return;
      }
      const id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      const title = `${chapters.find((c) => c.id === chapterId)?.title ?? ""} · ${
        mode === "quiz" ? "刷题" : "背诵"
      }`;
      useAppStore.getState().startSession({
        id,
        unitIds: ids,
        chapterIds: [chapterId],
        mode,
        title,
        questionIds: questions.map((q) => q.id),
        index: 0,
        answers: {},
        revealed: {},
        results: {},
        startedAt: Date.now(),
      });
      onOpenChange(false);
      navigate(`/quiz/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="sheet-in flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-t-[6px] p-0 md:side-right md:max-h-none md:w-[380px] md:rounded-none"
      >
        <SheetHeader className="border-b border-rule px-5 pb-2.5 pt-4 text-left">
          <SheetTitle className="text-left text-[15px] font-bold text-ink">选题</SheetTitle>
        </SheetHeader>

        {/* 两页签：科目 / 真题 */}
        <div className="flex border-b border-rule px-5" role="tablist" aria-label="选题范围">
          {(
            [
              ["subject", "按专题"],
              ["years", "按年份"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "-mb-px border-b-2 px-1 py-2 text-[13px] transition-colors",
                tab === k
                  ? "border-brand font-semibold text-ink"
                  : "border-transparent text-ink-3 hover:text-ink-2",
              )}
            >
              {label}
            </button>
          ))}
          <span className="num ml-auto self-center text-[10.5px] text-ink-3">
            {tab === "subject" ? "7 个专题" : "未接入"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {tab === "subject" ? (
            <>
              <p className="label mt-4">一、专题</p>
              <ul className="mt-1.5 grid grid-cols-2 gap-1.5">
                {chapters.map((c, i) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterId(c.id);
                        setKindKeys([]);
                      }}
                      aria-pressed={chapterId === c.id}
                      className={cn(
                        "flex h-[52px] w-full items-center gap-2 rounded-[3px] border px-2.5 text-left transition-colors",
                        chapterId === c.id
                          ? "border-brand bg-brand-tint"
                          : "border-rule bg-paper hover:bg-paper-2",
                      )}
                    >
                      <span
                        className={cn(
                          "num shrink-0 text-[10.5px]",
                          chapterId === c.id ? "text-brand" : "text-ink-3",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-[12.5px] font-medium text-ink">
                          {c.title}
                        </span>
                        <span className="num text-[10.5px] text-ink-3">{c.count} 题</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {chapterId ? (
                <>
                  <p className="label mt-5">二、题型</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {kinds.map((u) => {
                      const active = kindKeys.length === 0 || kindKeys.includes(u.kind);
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              setKindKeys((prev) => {
                                const set = new Set(prev);
                                if (set.has(u.kind)) set.delete(u.kind);
                                else set.add(u.kind);
                                return [...set];
                              })
                            }
                            className={cn(
                              "rounded-[3px] border px-2.5 py-1.5 text-[12.5px] transition-colors",
                              active
                                ? "border-ink bg-paper font-medium text-ink"
                                : "border-rule bg-paper-2 text-ink-3 line-through",
                            )}
                          >
                            {u.title}
                            <span className="num ml-1 text-ink-3">{u.questionCount}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-1.5 text-[10.5px] leading-5 text-ink-3">
                    不选则练该专题全部题型；划线的是已排除。
                  </p>
                </>
              ) : null}

              <p className="label mt-5">{chapterId ? "三" : "二"}、形式</p>
              <div className="mt-1.5 flex overflow-hidden rounded-[3px] border border-rule-2">
                {(
                  [
                    ["quiz", "刷题", "先作答，再判定"],
                    ["recite", "背题", "直接看答案"],
                  ] as const
                ).map(([k, label, hint]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMode(k)}
                    aria-pressed={mode === k}
                    className={cn(
                      "flex-1 px-3 py-2 text-left transition-colors",
                      mode === k ? "bg-ink text-white" : "bg-paper text-ink-2",
                    )}
                  >
                    <span className="block text-[13px] font-semibold">{label}</span>
                    <span
                      className={cn(
                        "block text-[10.5px]",
                        mode === k ? "text-white/70" : "text-ink-3",
                      )}
                    >
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="label mt-4">真题年份</p>
              <ul className="mt-1.5 grid grid-cols-3 gap-1.5">
                {YEARS.map((y) => (
                  <li key={y}>
                    <div
                      aria-disabled
                      className="num cursor-not-allowed rounded-[3px] border border-dashed border-rule-2 bg-paper py-2.5 text-center text-[12.5px] text-ink-3"
                    >
                      {y}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-rule pt-2.5 font-serif text-[12.5px] leading-[1.8] text-ink-2">
                历年真题的题源尚未接入。这里只有《江西省专升本必刷2000题·信息技术》的教材同步训练题；
                拿到真题后会按年份列在这里，不拿模拟题凑数。
              </p>
            </>
          )}
        </div>

        {/* 底部：先报总数，再确认 */}
        <div className="border-t border-rule px-5 py-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="num text-[11px] text-ink-3">
              {chapterId ? `本次 ${pickedCount} 题` : "先选一个专题"}
            </span>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="text-[11.5px] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
            >
              重置
            </button>
          </div>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy || !chapterId || tab === "years"}
            className="press h-[46px] w-full rounded-[4px] bg-brand text-[15px] font-bold text-white transition-colors hover:bg-[#a80a5c] active:translate-y-px disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-3"
          >
            {busy ? "准备中…" : chapterId ? "开始" : "选择专题后开始"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
