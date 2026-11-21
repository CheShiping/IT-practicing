import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { useUnits } from "@/data/hooks";
import { loadChapter } from "@/data/loader";
import type { Unit } from "@/data/types";
import { useAppStore } from "@/store/useAppStore";

const YEARS = [2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013];

/**
 * 题库选择浮层：对齐原型 —— 科目网格（选中项黄底 + 右下折角）、
 * 考点刷题 / 考点背诵切换、真题年份网格（虚线描边）、底部重置与确认。
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
      const questions =
        mode === "recite" ? pool : pool.filter((q) => q.answer.length > 0);
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
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-t-2xl p-0 md:side-right md:max-h-none md:w-[375px] md:rounded-none"
      >
        <SheetHeader className="px-4 pt-4 text-left">
          <SheetTitle className="text-left text-[17px] font-semibold text-ink">题库选择</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* 顶部两枚胶囊 */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Pill active={tab === "subject"} onClick={() => setTab("subject")}>
              选择科目
            </Pill>
            <Pill active={tab === "years"} onClick={() => setTab("years")}>
              历年真题
            </Pill>
          </div>

          {tab === "subject" ? (
            <>
              <h3 className="mb-2 text-sm font-medium text-ink">科目选择</h3>
              <ul className="grid grid-cols-3 gap-2">
                {chapters.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setChapterId(c.id);
                        setKindKeys([]);
                      }}
                      aria-pressed={chapterId === c.id}
                      className={cn(
                        "relative w-full overflow-hidden rounded-lg px-2 py-2.5 text-center text-[13px] transition-colors",
                        chapterId === c.id
                          ? "bg-brand font-medium text-ink"
                          : "bg-surface text-ink-2 hover:bg-black/5",
                      )}
                    >
                      <span className="block text-[12px] leading-4 leading-tight">{c.title}</span>
                      <span className="num mt-0.5 block text-[11px] opacity-70">{c.count} 题</span>
                      {chapterId === c.id ? (
                        <span
                          aria-hidden
                          className="absolute bottom-0 right-0 size-0 border-b-[10px] border-l-[10px] border-b-ink border-l-transparent"
                        />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>

              {chapterId ? (
                <>
                  <h3 className="mb-2 mt-5 text-sm font-medium text-ink">题型选择</h3>
                  <ul className="flex flex-wrap gap-2">
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
                              "rounded-full px-3 py-1.5 text-[13px] transition-colors",
                              active
                                ? "bg-brand text-ink"
                                : "bg-surface text-ink-3 line-through",
                            )}
                          >
                            {u.title}
                            <span className="num ml-1 opacity-70">{u.questionCount}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-[11px] text-ink-3">
                    不选则默认练习该专题全部题型；灰色表示已排除。
                  </p>
                </>
              ) : null}

              <h3 className="mb-2 mt-5 text-sm font-medium text-ink">练习形式</h3>
              <div className="grid grid-cols-2 gap-2">
                <Pill active={mode === "quiz"} onClick={() => setMode("quiz")}>
                  考点刷题
                </Pill>
                <Pill active={mode === "recite"} onClick={() => setMode("recite")}>
                  考点背诵
                </Pill>
              </div>
            </>
          ) : (
            <>
              <h3 className="mb-2 text-sm font-medium text-ink">真题选择</h3>
              <ul className="grid grid-cols-3 gap-2">
                {YEARS.map((y) => (
                  <li key={y}>
                    <div
                      aria-disabled
                      className="num cursor-not-allowed rounded-lg border border-dashed border-black/15 bg-white py-2.5 text-center text-[13px] text-ink-3"
                    >
                      {y}年
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg bg-surface p-3">
                <p className="text-[13px] leading-5 text-ink-2">
                  历年真题题源尚未接入。本站题源为《江西省专升本必刷2000题·信息技术》
                  的教材同步训练题，接入真题后会在这里按年份筛选。
                </p>
              </div>
            </>
          )}
        </div>

        {/* 底部操作 */}
        <div className="grid grid-cols-2 gap-3 border-t border-black/8 px-4 py-3">
          <Button
            variant="secondary"
            className="h-11 rounded-full bg-surface text-ink"
            onClick={reset}
            disabled={busy}
          >
            重置
          </Button>
          <Button
            className="h-11 rounded-full bg-brand text-ink hover:bg-brand/90"
            onClick={() => void confirm()}
            disabled={busy || !chapterId || tab === "years"}
          >
            {busy ? "准备中…" : "确认"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full py-2 text-[13px] transition-colors",
        active ? "bg-brand font-medium text-ink" : "bg-surface text-ink-2 hover:bg-black/5",
      )}
    >
      {children}
    </button>
  );
}
