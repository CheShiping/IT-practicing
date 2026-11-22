import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, ClipboardList, Loader2, NotebookPen, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { OptionItem, type OptionState } from "@/components/common/OptionItem";
import { AnswerSheet, type SheetGroup } from "@/components/common/AnswerSheet";
import { judge, loadChapter } from "@/data/loader";
import { KIND_LABEL, type Question } from "@/data/types";
import { useAppStore } from "@/store/useAppStore";

export default function QuizPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useAppStore((s) =>
    s.current?.id === sessionId ? s.current : (s.sessions.find((x) => x.id === sessionId) ?? null),
  );
  const favorites = useAppStore((s) => s.favorites);
  const notes = useAppStore((s) => s.notes);
  const updateSession = useAppStore((s) => s.updateSession);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const addWrong = useAppStore((s) => s.addWrong);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const saveNote = useAppStore((s) => s.saveNote);
  const endSession = useAppStore((s) => s.endSession);

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jumpTo = params.get("q");

  useEffect(() => {
    if (!session) return;
    let alive = true;
    Promise.all(session.chapterIds.map((id) => loadChapter(id)))
      .then((chapters) => {
        if (!alive) return;
        const map = new Map<string, Question>();
        for (const c of chapters) for (const q of c.questions) map.set(q.id, q);
        setQuestions(
          session.questionIds.map((id) => map.get(id)).filter((q): q is Question => Boolean(q)),
        );
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [session]);

  const index = session ? (jumpTo ? Math.max(0, Number(jumpTo) - 1) : session.index) : 0;
  const question = questions?.[index];
  const revealed = session ? Boolean(session.revealed[question?.id ?? ""]) : false;
  const isRecite = session?.mode === "recite";
  const answeredCount = session ? Object.keys(session.revealed).length : 0;
  const total = session?.questionIds.length ?? 0;

  useEffect(() => {
    if (!session || !question) return;
    setSelected(session.answers[question.id] ?? []);
  }, [session?.id, question?.id, session?.answers, question]);

  const submit = useCallback(() => {
    if (!session || !question) return;
    const ok = judge(question, selected);
    updateSession({
      answers: { ...session.answers, [question.id]: selected },
      revealed: { ...session.revealed, [question.id]: true },
      results: { ...session.results, [question.id]: ok },
    });
    recordAnswer(question.id, ok);
    if (!ok) addWrong(question.id);
  }, [session, question, selected, updateSession, recordAnswer, addWrong]);

  function optionState(key: string): OptionState {
    if (!question) return "idle";
    const isSelected = selected.includes(key);
    const isAnswer = question.answer.includes(key);
    if (isRecite) return isAnswer ? "correct" : "idle";
    if (!revealed) return isSelected ? "selected" : "idle";
    if (isSelected) return isAnswer ? "correct" : "wrong";
    return "idle";
  }

  function pick(key: string) {
    if (!question || revealed || isRecite) return;
    if (question.type === "multi") {
      setSelected((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
    } else {
      setSelected([key]);
    }
  }

  function go(delta: number) {
    if (!session) return;
    const next = Math.min(total - 1, Math.max(0, index + delta));
    updateSession({ index: next });
    window.scrollTo({ top: 0 });
  }

  function finish() {
    if (!session) return;
    endSession();
    navigate(`/quiz/${session.id}/result`, { replace: true });
  }

  if (!session) {
    return (
      <div className="min-h-dvh">
        <TopBar title="练习" back />
        <PageContainer className="pt-8">
          <p className="card p-6 text-center text-[13px] text-ink-2">
            找不到这次练习（可能已结束，或换了浏览器）。
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              className="bg-yellow text-ink shadow-[0_3px_0_var(--yellow-deep)] h-11 rounded-[12px] px-6 text-[14px] active:translate-y-[2px]"
              onClick={() => navigate("/library")}
            >
              去选题库
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh">
        <TopBar title="练习" back />
        <PageContainer className="pt-8 text-center text-[13px] text-ink-2">
          题库加载失败：{error}
        </PageContainer>
      </div>
    );
  }

  if (!questions || !question) {
    return (
      <div className="min-h-dvh">
        <TopBar title={session.title} back />
        <PageContainer className="flex items-center justify-center gap-2 pt-24 text-[13px] text-ink-3">
          <Loader2 className="size-4 animate-spin" aria-hidden /> 题目加载中…
        </PageContainer>
      </div>
    );
  }

  const options = question.options;
  const multi = question.type === "multi";
  const answered = revealed || isRecite;
  const correct = session.results[question.id];
  const pct = total ? (answeredCount / total) * 100 : 0;
  const starred = favorites.includes(question.id);
  const hasNote = Boolean(notes[question.id]);

  const sheetGroups: SheetGroup[] = [
    {
      title: session.title,
      items: questions.map((q, i) => ({
        no: i + 1,
        state:
          i === index
            ? ("current" as const)
            : session.revealed[q.id] === undefined
              ? ("unanswered" as const)
              : session.results[q.id]
                ? ("correct" as const)
                : ("wrong" as const),
      })),
    },
  ];

  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <TopBar
        title={session.title}
        kicker={`${KIND_LABEL[question.kind]} · 第 ${index + 1} / ${total} 题`}
        back={() => {
          if (answeredCount > 0 && !isRecite) setExitOpen(true);
          else navigate(-1);
        }}
        right={
          <div
            className="flex shrink-0 items-center rounded-full bg-white/15 p-0.5 md:bg-shell"
            role="group"
            aria-label="练习模式"
          >
            <button
              type="button"
              onClick={() => updateSession({ mode: "quiz" })}
              aria-pressed={!isRecite}
              className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
                isRecite ? "text-white/70 md:text-ink-3" : "bg-yellow text-ink"
              }`}
            >
              刷题
            </button>
            <button
              type="button"
              onClick={() => updateSession({ mode: "recite" })}
              aria-pressed={isRecite}
              className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
                isRecite ? "bg-yellow text-ink" : "text-white/70 md:text-ink-3"
              }`}
            >
              背题
            </button>
          </div>
        }
      />

      {/* 进度：天蓝轨道上的黄条 */}
      <div className="bg-azure px-0 pb-2 md:bg-transparent md:pb-0">
        <div className="mx-auto max-w-[560px] px-5 md:max-w-[1040px] md:px-6">
          <div
            className="h-[4px] overflow-hidden rounded-full bg-white/25 md:bg-shell-2"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="答题进度"
          >
            <div
              className="h-full rounded-full bg-yellow transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[560px] px-4 pt-4 md:grid md:max-w-[1040px] md:grid-cols-[300px_minmax(0,1fr)] md:items-start md:gap-8 md:px-6 md:pt-6">
        {/* 桌面端答题卡侧栏 */}
        <aside className="hidden md:block">
          <div className="card sticky top-6 max-h-[calc(100dvh-6rem)] overflow-y-auto p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[13px] font-extrabold text-ink">答题卡</p>
              <p className="num text-[10.5px] font-semibold text-ink-3">
                {answeredCount} / {total}
              </p>
            </div>
            <AnswerSheet
              groups={sheetGroups}
              onJump={(no) => {
                updateSession({ index: no - 1 });
                window.scrollTo({ top: 0 });
              }}
            />
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="sr-only"
            >
              关闭
            </button>
          </div>
        </aside>

        <div className="min-w-0">
        {/* 题面卡 */}
        <article key={question.id} className="rise card p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="num flex size-7 items-center justify-center rounded-[8px] bg-azure text-[11.5px] font-extrabold text-white">
              {question.no}
            </span>
            <span className="text-[10.5px] font-bold text-ink-3">{KIND_LABEL[question.kind]}</span>
            <div className="ml-auto flex items-center gap-0.5">
              <IconBtn
                label={starred ? "取消收藏" : "收藏本题"}
                active={starred}
                onClick={() => toggleFavorite(question.id)}
              >
                <Star
                  className={starred ? "size-4 fill-yellow text-ink" : "size-4"}
                  aria-hidden
                />
              </IconBtn>
              <IconBtn
                label="笔记"
                active={hasNote}
                onClick={() => {
                  setNoteText(notes[question.id]?.text ?? "");
                  setNoteOpen(true);
                }}
              >
                <NotebookPen className="size-4" aria-hidden />
              </IconBtn>
              <IconBtn label="答题卡" onClick={() => setSheetOpen(true)}>
                <ClipboardList className="size-4" aria-hidden />
              </IconBtn>
            </div>
          </div>

          <p className="text-[16px] leading-[1.8] font-semibold text-ink">{question.stem}</p>

          {multi && selected.length > 0 && !answered ? (
            <p className="num mt-2 text-[11px] font-bold text-azure">已选 {selected.length} 项</p>
          ) : null}
        </article>

        {/* 选项 */}
        {options.length ? (
          <div className="mt-3 space-y-2.5" role="group" aria-label="选项">
            {options.map((o) => (
              <OptionItem
                key={o.key}
                optionKey={o.key}
                text={o.text}
                state={optionState(o.key)}
                disabled={answered}
                onSelect={() => pick(o.key)}
              />
            ))}
          </div>
        ) : (
          <div className="card mt-3 p-4">
            <p className="label">参考答案</p>
            <p className="mt-1.5 text-[14px] leading-[1.8] font-medium text-ink">
              {question.answerText || question.analysis || "本题原书未给出参考答案"}
            </p>
          </div>
        )}

        {/* 判定 */}
        {answered && !isRecite && options.length ? (
          <section
            role="status"
            aria-live="polite"
            className={`verdict mt-3 rounded-[16px] border-2 p-3.5 ${
              correct ? "border-green bg-green-tint" : "border-red bg-red-tint"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-white ${
                  correct ? "bg-green" : "bg-red"
                }`}
              >
                {correct ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : (
                  <X className="size-4" strokeWidth={3} aria-hidden />
                )}
              </span>
              <p className={`text-[15px] font-extrabold ${correct ? "text-green" : "text-red"}`}>
                {correct ? "答对了" : "答错了"}
              </p>
              <p className="num ml-auto text-[10.5px] font-semibold text-ink-3">
                累计正确率 {globalAccuracy()}%
              </p>
            </div>
            <dl className="num mt-2.5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[12.5px]">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-[10.5px] font-semibold text-ink-3">正确答案</dt>
                <dd className="font-extrabold text-green">{question.answer.join(" ")}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-[10.5px] font-semibold text-ink-3">你选的</dt>
                <dd className={`font-extrabold ${correct ? "text-green" : "text-red"}`}>
                  {selected.length ? selected.join(" ") : "未作答"}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        {/* 解析 */}
        {answered ? (
          <section className="card mt-3 p-4">
            <p className="label">解析</p>
            {question.analysis ? (
              <p className="mt-1.5 text-[14px] leading-[1.85] font-medium text-ink">
                {question.analysis}
              </p>
            ) : (
              <p className="mt-1.5 text-[13px] text-ink-3">原书未给出解析。</p>
            )}
            <p className="num mt-3 border-t border-shell-2 pt-2 text-[10px] text-ink-3">
              原书第 {question.source.page} 页 · {question.source.book}
            </p>
          </section>
        ) : null}
        </div>
      </div>

      {/* 底部操作：移动端固定，桌面端跟在内容后面 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-shell-2 bg-paper px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mt-4 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-[520px] items-center gap-2.5 md:max-w-none">
          <button
            type="button"
            className="press h-[48px] flex-1 rounded-[13px] bg-paper text-[14px] font-bold text-ink-2 shadow-[0_1px_0_rgba(12,26,40,.06)] hover:bg-shell active:translate-y-[1px] disabled:opacity-40"
            disabled={index === 0}
            onClick={() => go(-1)}
          >
            上一题
          </button>
          {!answered && !isRecite ? (
            <button
              type="button"
              className="press h-[48px] flex-[1.5] rounded-[13px] bg-yellow text-[15px] font-extrabold text-ink shadow-[0_3px_0_var(--yellow-deep)] transition-colors hover:bg-[#f7c500] active:translate-y-[3px] active:shadow-none disabled:bg-shell-2 disabled:text-ink-3 disabled:shadow-none"
              disabled={selected.length === 0}
              onClick={submit}
            >
              提交答案
            </button>
          ) : index === total - 1 ? (
            <button
              type="button"
              className="press h-[48px] flex-[1.5] rounded-[13px] bg-yellow text-[15px] font-extrabold text-ink shadow-[0_3px_0_var(--yellow-deep)] transition-colors hover:bg-[#f7c500] active:translate-y-[3px] active:shadow-none"
              onClick={finish}
            >
              查看结果
            </button>
          ) : (
            <button
              type="button"
              className="press h-[48px] flex-[1.5] rounded-[13px] bg-yellow text-[15px] font-extrabold text-ink shadow-[0_3px_0_var(--yellow-deep)] transition-colors hover:bg-[#f7c500] active:translate-y-[3px] active:shadow-none"
              onClick={() => go(1)}
            >
              下一题
            </button>
          )}
        </div>
      </div>

      {/* 答题卡 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="sheet-in max-h-[76vh] rounded-t-[20px]">
          <SheetHeader>
            <SheetTitle className="text-left text-[14px] font-extrabold">答题卡</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <AnswerSheet
              groups={sheetGroups}
              onJump={(no) => {
                updateSession({ index: no - 1 });
                setSheetOpen(false);
                window.scrollTo({ top: 0 });
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* 笔记 */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[440px] overflow-hidden rounded-[18px]">
          <DialogHeader>
            <DialogTitle className="font-extrabold">笔记</DialogTitle>
            <DialogDescription className="line-clamp-2 break-words">
              {question.stem.slice(0, 40)}
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={5}
            maxLength={2000}
            aria-label="笔记内容"
            className="block w-full max-w-full min-w-0 resize-none rounded-[12px] border border-shell-2 bg-shell p-3 text-[14px] leading-7 outline-none focus-visible:border-azure"
            placeholder="记下你为什么选错…"
          />
          <DialogFooter>
            <Button
              variant="secondary"
              className="rounded-[10px] bg-shell text-ink-2"
              onClick={() => setNoteOpen(false)}
            >
              取消
            </Button>
            <Button
              className="bg-yellow text-ink shadow-[0_3px_0_var(--yellow-deep)] rounded-[10px]"
              onClick={() => {
                saveNote(question.id, noteText);
                setNoteOpen(false);
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退出确认 */}
      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent className="rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-extrabold">结束这次练习？</AlertDialogTitle>
            <AlertDialogDescription>
              已完成 {answeredCount} 题，进度会保留在这台设备上。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" className="rounded-[10px]">
              继续练习
            </AlertDialogCancel>
            <AlertDialogAction variant="default" className="bg-yellow text-ink shadow-[0_3px_0_var(--yellow-deep)] rounded-[10px]" onClick={finish}>
              结束并看结果
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IconBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex size-8 items-center justify-center rounded-[9px] transition-colors ${
        active ? "bg-yellow text-ink" : "text-ink-3 hover:bg-shell"
      }`}
    >
      {children}
    </button>
  );
}

function globalAccuracy() {
  const p = useAppStore.getState().progress;
  const rs = Object.values(p);
  if (!rs.length) return 0;
  const total = rs.reduce((a, b) => a + b.attempts, 0);
  const correct = rs.reduce((a, b) => a + b.correct, 0);
  return total ? Math.round((correct / total) * 100) : 0;
}
