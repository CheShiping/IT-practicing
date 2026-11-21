import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ClipboardList, Loader2, NotebookPen, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup } from "@/components/ui/radio-group";
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
        <TopBar title="练习" variant="plain" center back />
        <PageContainer className="pt-8">
          <p className="text-center text-sm text-ink-2">找不到这次练习（可能已结束或换了浏览器）。</p>
          <div className="mt-4 flex justify-center">
            <Button className="rounded-lg bg-brand text-ink" onClick={() => navigate("/library")}>
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
        <TopBar title="练习" variant="plain" center back />
        <PageContainer className="pt-8 text-center text-sm text-ink-2">题库加载失败：{error}</PageContainer>
      </div>
    );
  }

  if (!questions || !question) {
    return (
      <div className="min-h-dvh">
        <TopBar title={session.title} variant="plain" center back />
        <PageContainer className="flex items-center justify-center gap-2 pt-20 text-sm text-ink-3">
          <Loader2 className="size-4 animate-spin" aria-hidden /> 题目加载中…
        </PageContainer>
      </div>
    );
  }

  const options = question.options;
  const multi = question.type === "multi";
  const answered = revealed || isRecite;
  const correct = session.results[question.id];
  const pct = total ? Math.round((answeredCount / total) * 100) : 0;

  const sheetGroups: SheetGroup[] = [
    {
      title: "答题卡",
      items: questions.map((q, i) => ({
        no: i + 1,
        state:
          session.revealed[q.id] === undefined
            ? ("unanswered" as const)
            : session.results[q.id]
              ? ("correct" as const)
              : ("wrong" as const),
      })),
    },
  ];

  return (
    <div className="min-h-dvh">
      <TopBar
        title=""
        variant="plain"
        back={() => {
          if (answeredCount > 0 && !isRecite) setExitOpen(true);
          else navigate(-1);
        }}
        right={
          <div
            className="flex items-center rounded-full bg-surface p-0.5"
            role="group"
            aria-label="练习模式"
          >
            <button
              type="button"
              onClick={() => updateSession({ mode: "quiz" })}
              aria-pressed={!isRecite}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                isRecite ? "text-ink-3" : "bg-ink text-white"
              }`}
            >
              刷题
            </button>
            <button
              type="button"
              onClick={() => updateSession({ mode: "recite" })}
              aria-pressed={isRecite}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                isRecite ? "bg-ink text-white" : "text-ink-3"
              }`}
            >
              背题
            </button>
          </div>
        }
      />

      <PageContainer className="max-w-[460px] space-y-3 pt-3 pb-28 md:pb-24">
        {/* 题号 + 进度 + 工具图标 */}
        <div className="flex items-center gap-3">
          <span className="num shrink-0 text-[15px] font-medium text-ink">{index + 1}</span>
          <Progress value={pct} className="h-1.5 flex-1" aria-label="答题进度" />
          <div className="flex shrink-0 items-center gap-0.5">
            <IconBtn
              label={favorites.includes(question.id) ? "取消收藏" : "收藏本题"}
              active={favorites.includes(question.id)}
              onClick={() => toggleFavorite(question.id)}
            >
              <Star
                className={
                  favorites.includes(question.id) ? "size-4.5 fill-danger text-danger" : "size-4.5"
                }
                aria-hidden
              />
            </IconBtn>
            <IconBtn
              label="添加笔记"
              active={Boolean(notes[question.id])}
              onClick={() => {
                setNoteText(notes[question.id]?.text ?? "");
                setNoteOpen(true);
              }}
            >
              <NotebookPen className="size-4.5" aria-hidden />
            </IconBtn>
            <IconBtn label="答题卡" onClick={() => setSheetOpen(true)}>
              <ClipboardList className="size-4.5" aria-hidden />
            </IconBtn>
          </div>
        </div>

        {/* 题型标签 */}
        <div className="flex items-center gap-2">
          <Badge className="rounded bg-success px-1.5 py-0.5 text-[11px] text-white">
            {KIND_LABEL[question.kind]}
          </Badge>
          {multi && selected.length > 0 && !answered ? (
            <Badge
              variant="outline"
              className="rounded border-black/15 bg-transparent px-1.5 py-0.5 text-[11px] text-ink-2"
            >
              已选 {selected.length} 项
            </Badge>
          ) : null}
          {isRecite ? <span className="text-xs text-ink-3">背诵模式</span> : null}
        </div>

        {/* 题干 */}
        <p className="rounded-xl bg-white p-4 text-[15px] leading-7 text-ink">{question.stem}</p>

        {/* 选项 */}
        {options.length ? (
          <RadioGroup
            value={selected[0] ?? ""}
            onValueChange={(v) => {
              if (answered) return;
              if (multi) {
                setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
              } else {
                setSelected([v]);
              }
            }}
            className="space-y-1.5"
          >
            {options.map((o) => (
              <OptionItem
                key={o.key}
                optionKey={o.key}
                text={o.text}
                multi={multi}
                state={optionState(o.key)}
                disabled={answered}
                onSelect={() => {
                  if (answered) return;
                  if (multi) {
                    setSelected((prev) =>
                      prev.includes(o.key) ? prev.filter((x) => x !== o.key) : [...prev, o.key],
                    );
                  } else {
                    setSelected([o.key]);
                  }
                }}
              />
            ))}
          </RadioGroup>
        ) : (
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs text-ink-2">参考答案</p>
            <p className="mt-1 text-[15px] leading-7 text-ink">
              {question.answerText || question.analysis || "本题暂无解析"}
            </p>
          </div>
        )}

        {/* 判定卡片 */}
        {answered && !isRecite && options.length ? (
          <section
            role="status"
            aria-live="polite"
            className="rounded-xl border border-black/8 bg-white p-3.5"
          >
            <div className="flex items-center justify-between">
              <p
                className={`flex items-center gap-1.5 text-[15px] font-semibold ${
                  correct ? "text-success-strong" : "text-danger-strong"
                }`}
              >
                <span aria-hidden className="size-2.5 rounded-sm bg-current" />
                {correct ? "回答正确!" : "回答错误!"}
              </p>
              <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-3">已答题</span>
            </div>
            <p className="num mt-1.5 text-sm">
              正确答案:{" "}
              <span className="font-medium text-success-strong">{question.answer.join("、")}</span>
              <span className="mx-2 text-ink-3">你的答案: </span>
              <span className="font-medium text-danger-strong">
                {selected.length ? selected.join("、") : "未作答"}
              </span>
            </p>
            <p className="num mt-2 rounded-md bg-success/25 px-2.5 py-1.5 text-xs text-ink">
              全对正确率 {globalAccuracy()}%
            </p>
          </section>
        ) : null}

        {/* 解析 */}
        {answered ? (
          <section className="rounded-xl border border-black/8 bg-white p-3.5">
            <h2 className="text-sm font-medium text-ink">解析</h2>
            <div className="mt-2 flex aspect-video w-full items-center justify-center rounded-lg bg-[#9a9a9a]">
              <span className="flex size-11 items-center justify-center rounded-full bg-white/90">
                <Play className="ml-0.5 size-5 fill-ink text-ink" aria-hidden />
              </span>
              <span className="sr-only">视频解析占位</span>
            </div>
            {question.analysis ? (
              <p className="mt-2.5 text-[15px] leading-7 text-ink">{question.analysis}</p>
            ) : (
              <p className="mt-2.5 text-sm text-ink-3">原书未给出解析。</p>
            )}
            <p className="mt-2.5 text-[11px] text-ink-3">
              来源：{question.source.book} 第 {question.source.page} 页
            </p>
          </section>
        ) : null}
      </PageContainer>

      {/* 底部操作：两枚等宽按钮 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-[460px] items-center gap-3">
          <Button
            variant="secondary"
            className="h-11 flex-1 rounded-lg bg-surface text-ink disabled:opacity-60"
            disabled={index === 0}
            onClick={() => go(-1)}
          >
            上一题
          </Button>
          {!answered && !isRecite ? (
            <Button
              className="h-11 flex-1 rounded-lg bg-brand text-ink hover:bg-brand/90"
              onClick={submit}
            >
              提交答案
            </Button>
          ) : index === total - 1 ? (
            <Button
              className="h-11 flex-1 rounded-lg bg-brand text-ink hover:bg-brand/90"
              onClick={finish}
            >
              查看结果
            </Button>
          ) : (
            <Button
              className="h-11 flex-1 rounded-lg bg-brand text-ink hover:bg-brand/90"
              onClick={() => go(1)}
            >
              下一题
            </Button>
          )}
        </div>
      </div>

      {/* 答题卡 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">答题卡</SheetTitle>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>笔记</DialogTitle>
            <DialogDescription className="truncate">{question.stem.slice(0, 40)}</DialogDescription>
          </DialogHeader>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={5}
            maxLength={2000}
            aria-label="笔记内容"
            className="w-full rounded-lg border border-black/10 p-3 text-sm outline-none focus-visible:border-brand"
            placeholder="记录你的想法…"
          />
          <DialogFooter>
            <Button variant="secondary" className="rounded-lg" onClick={() => setNoteOpen(false)}>
              取消
            </Button>
            <Button
              className="rounded-lg bg-brand text-ink"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>信息确认</AlertDialogTitle>
            <AlertDialogDescription>
              本次练习已完成 {answeredCount} 题，退出后进度会保留在本地。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" className="rounded-lg">
              继续练习
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              className="rounded-lg bg-brand text-ink"
              onClick={finish}
            >
              结束并查看结果
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
      className="flex size-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-black/5"
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
