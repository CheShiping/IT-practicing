import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, RotateCcw } from "lucide-react";
import { Checker, PageContainer, SectionHead, TopBar } from "@/components/layout/AppShell";
import { AnswerSheet, type SheetGroup } from "@/components/common/AnswerSheet";
import { loadChapter } from "@/data/loader";
import { KIND_LABEL, type Question } from "@/data/types";
import { useAppStore } from "@/store/useAppStore";

export default function ResultPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = useAppStore((s) => s.sessions.find((x) => x.id === sessionId) ?? null);
  const wrongBook = useAppStore((s) => s.wrongBook);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [onlyWrong, setOnlyWrong] = useState(false);

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
      .catch(() => alive && setQuestions([]));
    return () => {
      alive = false;
    };
  }, [session]);

  const stats = useMemo(() => {
    if (!session) return { total: 0, correct: 0, wrong: 0, unanswered: 0, pct: 0 };
    const total = session.questionIds.length;
    let correct = 0;
    let answered = 0;
    for (const id of session.questionIds) {
      const r = session.results[id];
      if (r === undefined) continue;
      answered += 1;
      if (r) correct += 1;
    }
    return {
      total,
      correct,
      wrong: answered - correct,
      unanswered: total - answered,
      pct: total ? Math.round((correct / total) * 100) : 0,
    };
  }, [session]);

  const groups: SheetGroup[] = useMemo(() => {
    if (!questions) return [];
    const byType = new Map<string, SheetGroup["items"]>();
    for (const q of questions) {
      const key = KIND_LABEL[q.kind];
      if (!byType.has(key)) byType.set(key, []);
      const r = session?.results[q.id];
      byType.get(key)!.push({
        no: q.no,
        state: r === undefined ? "unanswered" : r ? "correct" : "wrong",
      });
    }
    return [...byType.entries()].map(([title, items]) => ({ title, items }));
  }, [questions, session]);

  const wrongIds = useMemo(
    () => (session ? session.questionIds.filter((id) => session.results[id] === false) : []),
    [session],
  );

  if (!session) {
    return (
      <div className="min-h-dvh">
        <TopBar title="答题结果" back />
        <PageContainer className="pt-8">
          <p className="card p-6 text-center text-[13px] text-ink-2">找不到这次练习的结果。</p>
        </PageContainer>
      </div>
    );
  }

  const minutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));

  return (
    <div className="min-h-dvh">
      <header className="bg-azure">
        <Checker />
        <div className="mx-auto max-w-[560px] px-5 pb-12 pt-1">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[15px] font-extrabold text-white">答题结果</h1>
            <p className="num ml-auto text-[10.5px] text-on-azure">
              共 {stats.total} 题 · 用时 {minutes} 分钟
            </p>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <p className="num text-[58px] leading-[0.82] font-extrabold tracking-tighter text-white">
              {stats.correct + stats.wrong
                ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
                : 0}
            </p>
            <p className="num pb-2 text-[13px] font-bold text-on-azure">%</p>
            <p className="num ml-1 pb-1.5 text-[11px] font-semibold text-on-azure">
              已答 {stats.correct + stats.wrong} / {stats.total} 题
            </p>
          </div>
          <p className="mt-2 text-[11.5px] font-semibold text-white">{session.title}</p>
        </div>
      </header>

      <PageContainer className="-mt-8">
        {/* 三格读数 + 比例条 */}
        <section className="card rise p-4">
          <div className="flex h-[8px] w-full overflow-hidden rounded-full bg-shell-2">
            <span
              className="h-full bg-green"
              style={{ width: `${stats.total ? (stats.correct / stats.total) * 100 : 0}%` }}
            />
            <span
              className="h-full bg-red"
              style={{ width: `${stats.total ? (stats.wrong / stats.total) * 100 : 0}%` }}
            />
          </div>
          <dl className="mt-3 grid grid-cols-3">
            {[
              { k: "答对", v: stats.correct, c: "text-green" },
              { k: "答错", v: stats.wrong, c: "text-red" },
              { k: "未答", v: stats.unanswered, c: "text-ink-2" },
            ].map((it, i) => (
              <div key={it.k} className={i ? "border-l border-shell-2 pl-4" : ""}>
                <dt className="text-[10.5px] font-semibold text-ink-3">{it.k}</dt>
                <dd className={`num mt-0.5 text-[24px] leading-none font-extrabold ${it.c}`}>
                  {it.v}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 答案速查 */}
        <div className="mt-6">
          <SectionHead right={questions ? `${groups.length} 个题型` : undefined}>
            答案速查
          </SectionHead>
          <div className="card p-3.5">
            {questions ? (
              <div className="max-h-[236px] overflow-y-auto overscroll-contain pr-0.5">
                <AnswerSheet groups={groups} onJump={() => navigate(`/quiz/${session.id}?q=1`)} />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-ink-3">
                <Loader2 className="size-4 animate-spin" aria-hidden /> 加载中…
              </div>
            )}
          </div>
        </div>

        {/* 逐题解析 */}
        <div className="mt-6">
          <SectionHead
            right={
              questions ? (
                <button
                  type="button"
                  onClick={() => setOnlyWrong((v) => !v)}
                  className={`text-[11px] font-bold transition-colors ${
                    onlyWrong ? "text-azure" : "text-ink-3 hover:text-ink-2"
                  }`}
                >
                  {onlyWrong ? "只看错题 ✓" : `全部 ${questions.length} 题`}
                </button>
              ) : undefined
            }
          >
            逐题解析
          </SectionHead>
          {questions ? (
            <ul className="space-y-2.5">
              {questions
                .filter((q) => (onlyWrong ? session.results[q.id] !== true : true))
                .map((q) => {
                  const r = session.results[q.id];
                  const mine = session.answers[q.id] ?? [];
                  return (
                    <li key={q.id} className="card p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="num flex size-6 items-center justify-center rounded-[7px] bg-shell text-[10.5px] font-extrabold text-ink-2">
                          {q.no}
                        </span>
                        <span className="text-[10px] font-bold text-ink-3">
                          {KIND_LABEL[q.kind]}
                        </span>
                        <span
                          className={`num ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                            r === undefined
                              ? "bg-shell text-ink-3"
                              : r
                                ? "bg-green-tint text-green"
                                : "bg-red-tint text-red"
                          }`}
                        >
                          {r === undefined ? "未作答" : r ? "答对" : "答错"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-[1.8] font-medium text-ink">
                        {q.stem}
                      </p>
                      <p className="num mt-1.5 text-[11.5px] font-bold">
                        <span className="font-semibold text-ink-3">正确答案 </span>
                        <span className="text-green">
                          {q.answer.length
                            ? q.answer.join(" ")
                            : q.answerText
                              ? q.answerText.slice(0, 60) + (q.answerText.length > 60 ? "…" : "")
                              : "—"}
                        </span>
                        {mine.length ? (
                          <>
                            <span className="ml-4 font-semibold text-ink-3">你的 </span>
                            <span className={r ? "text-green" : "text-red"}>{mine.join(" ")}</span>
                          </>
                        ) : null}
                      </p>
                      {q.analysis && q.analysis.trim() !== (q.answerText ?? "").trim() ? (
                        <p className="mt-1.5 text-[12.5px] leading-[1.8] text-ink-2">
                          {q.analysis}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            className="press h-[44px] rounded-[12px] bg-paper px-1 text-[12.5px] font-bold text-ink-2 shadow-[0_1px_0_rgba(12,26,40,.06)] hover:bg-shell active:translate-y-[1px]"
            onClick={() => navigate(`/quiz/${session.id}?q=1`)}
          >
            回看题目
          </button>
          <button
            type="button"
            className="press h-[44px] rounded-[12px] bg-paper px-1 text-[12.5px] font-bold text-ink-2 shadow-[0_1px_0_rgba(12,26,40,.06)] hover:bg-shell active:translate-y-[1px]"
            onClick={() => navigate("/library")}
          >
            换一组题
          </button>
          <button
            type="button"
            className="press h-[44px] rounded-[12px] bg-yellow px-1 text-[12.5px] font-extrabold text-ink shadow-[0_3px_0_var(--yellow-deep)] transition-colors hover:bg-[#f7c500] active:translate-y-[2px] active:shadow-none"
            onClick={() => {
              if (!wrongIds.length) {
                navigate("/library");
                return;
              }
              const id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
              useAppStore.getState().startSession({
                id,
                unitIds: session.unitIds,
                chapterIds: session.chapterIds,
                mode: "quiz",
                title: `${session.title} · 错题重练`,
                questionIds: wrongIds,
                index: 0,
                answers: {},
                revealed: {},
                results: {},
                startedAt: Date.now(),
              });
              navigate(`/quiz/${id}`);
            }}
          >
            <RotateCcw className="mr-1 size-3.5" aria-hidden />
            错题重练
          </button>
        </div>

        <p className="num mt-3 text-center text-[10px] text-ink-3">
          错题已收进错题本（当前 {Object.keys(wrongBook).length} 道）
        </p>
      </PageContainer>
    </div>
  );
}
