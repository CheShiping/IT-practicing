import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, SectionHead, TopBar } from "@/components/layout/AppShell";
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
      const key = q.type === "subjective" ? "主观题（仅解析）" : KIND_LABEL[q.kind];
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
        <PageContainer className="pt-10 text-center text-[13px] text-ink-2">
          找不到这次练习的结果。
        </PageContainer>
      </div>
    );
  }

  const minutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));

  return (
    <div className="min-h-dvh pb-6">
      <TopBar title="答题结果" kicker={session.title} back />

      <PageContainer className="pt-5">
        {/* 成绩单 */}
        <section className="rise" aria-label="本次成绩">
          <p className="label">本次成绩</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="num text-[58px] leading-[0.9] font-bold tracking-tight text-brand">
              {stats.pct}
            </p>
            <p className="num pb-1.5 text-[13px] text-ink-3">分</p>
            <p className="num ml-auto pb-1.5 text-[11px] leading-4 text-ink-3">
              共 {stats.total} 题 · 用时 {minutes} 分钟
            </p>
          </div>

          <div className="mt-3 flex h-[7px] w-full overflow-hidden bg-paper-3">
            <span
              className="h-full bg-brand"
              style={{ width: `${stats.total ? (stats.correct / stats.total) * 100 : 0}%` }}
            />
            <span
              className="h-full bg-danger"
              style={{ width: `${stats.total ? (stats.wrong / stats.total) * 100 : 0}%` }}
            />
          </div>

          <dl className="mt-2 grid grid-cols-3 border-y border-ink">
            {[
              { k: "答对", v: stats.correct, cls: "text-brand" },
              { k: "答错", v: stats.wrong, cls: "text-danger" },
              { k: "未答", v: stats.unanswered, cls: "text-ink-2" },
            ].map((it, i) => (
              <div
                key={it.k}
                className={`py-2.5 ${i > 0 ? "border-l border-rule pl-3" : ""}`}
              >
                <dt className="text-[11px] text-ink-3">{it.k}</dt>
                <dd className={`num mt-0.5 text-[19px] font-bold leading-none ${it.cls}`}>
                  {it.v}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 答案速查 */}
        <div className="mt-7">
          <SectionHead right={questions ? `${groups.length} 个题型` : undefined}>
            答案速查
          </SectionHead>
          {questions ? (
            <div className="max-h-[228px] overflow-y-auto overscroll-contain pr-0.5">
              <AnswerSheet
                groups={groups}
                onJump={() => navigate(`/quiz/${session.id}?q=1`)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-ink-3">
              <Loader2 className="size-4 animate-spin" aria-hidden /> 加载中…
            </div>
          )}
        </div>

        {/* 逐题解析 */}
        <div className="mt-8">
          <SectionHead
            right={
              questions ? (
                <button
                  type="button"
                  onClick={() => setOnlyWrong((v) => !v)}
                  className={`text-[11px] transition-colors ${
                    onlyWrong ? "font-semibold text-brand" : "text-ink-3 hover:text-ink-2"
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
            <ul>
              {questions
                .filter((q) => (onlyWrong ? session.results[q.id] !== true : true))
                .map((q) => {
                const r = session.results[q.id];
                return (
                  <li key={q.id} className="border-b border-rule py-3.5">
                    <div className="flex items-baseline gap-2">
                      <span className="num text-[12px] font-bold text-brand">{q.no}</span>
                      <span className="text-[11px] text-ink-3">{KIND_LABEL[q.kind]}</span>
                      <span
                        className={`num ml-auto text-[11px] font-semibold ${
                          r === undefined
                            ? "text-ink-3"
                            : r
                              ? "text-success"
                              : "text-danger"
                        }`}
                      >
                        {r === undefined ? "未作答" : r ? "答对" : "答错"}
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-[14.5px] leading-[1.8] text-ink">
                      {q.stem}
                    </p>
                    <p className="num mt-1.5 text-[12px] text-ink-2">
                      <span className="text-ink-3">正确答案 </span>
                      <span className="font-bold text-success">
                        {q.answer.join(" ") || q.answerText || "—"}
                      </span>
                      {session.answers[q.id]?.length ? (
                        <>
                          <span className="ml-4 text-ink-3">你的 </span>
                          <span
                            className={`font-bold ${r ? "text-success" : "text-danger"}`}
                          >
                            {session.answers[q.id].join(" ")}
                          </span>
                        </>
                      ) : null}
                    </p>
                    {q.analysis ? (
                      <p className="mt-1.5 font-serif text-[13px] leading-[1.8] text-ink-2">
                        {q.analysis}
                      </p>
                    ) : null}
                  </li>
                );
                })}
            </ul>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            className="press h-[44px] rounded-[3px] border border-rule-2 bg-paper px-1 text-[13px] text-ink hover:bg-paper-2 active:translate-y-px"
            onClick={() => navigate(`/quiz/${session.id}?q=1`)}
          >
            回看题目
          </Button>
          <Button
            variant="secondary"
            className="press h-[44px] rounded-[3px] border border-rule-2 bg-paper px-1 text-[13px] text-ink hover:bg-paper-2 active:translate-y-px"
            onClick={() => navigate("/library")}
          >
            换一组题
          </Button>
          <Button
            className="press h-[44px] rounded-[3px] bg-brand px-1 text-[13px] font-bold text-white hover:bg-[#a80a5c] active:translate-y-px"
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
          </Button>
        </div>

        <p className="num mt-3 text-center text-[10.5px] text-ink-3">
          错题已收进错题本（当前 {Object.keys(wrongBook).length} 道）
        </p>
      </PageContainer>
    </div>
  );
}
