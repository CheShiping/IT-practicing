import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { RadialProgress } from "@/components/common/Primitives";
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

  useEffect(() => {
    if (!session) return;
    let alive = true;
    Promise.all(session.chapterIds.map((id) => loadChapter(id)))
      .then((chapters) => {
        if (!alive) return;
        const map = new Map<string, Question>();
        for (const c of chapters) for (const q of c.questions) map.set(q.id, q);
        setQuestions(session.questionIds.map((id) => map.get(id)).filter((q): q is Question => Boolean(q)));
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
        <PageContainer className="pt-8 text-center text-sm text-ink-2">找不到这次练习的结果。</PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <TopBar title="答题结果" back />

      <PageContainer className="max-w-[460px] space-y-4 pt-4">
        {/* 成绩卡 */}
        <section className="brand-bar rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-5">
            <RadialProgress
              value={stats.pct}
              size={104}
              stroke={9}
              label={`${stats.pct}%`}
              className="shrink-0"
            />
            <ul className="flex-1 space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full bg-success-strong" />
                答对 <span className="num ml-auto font-medium">{stats.correct}</span> 题
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full bg-danger-strong" />
                答错 <span className="num ml-auto font-medium">{stats.wrong}</span> 题
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full bg-ink-3" />
                未答 <span className="num ml-auto font-medium">{stats.unanswered}</span> 题
              </li>
            </ul>
          </div>
          <p className="num mt-3 text-center text-xs text-ink/70">
            共 {stats.total} 题 · 用时 {Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))} 分钟
          </p>
        </section>

        {/* 答题卡 / 解析 */}
        <Tabs defaultValue="sheet">
          <TabsList className="w-full rounded-xl bg-surface p-1">
            <TabsTrigger value="sheet" className="rounded-lg data-[state=on]:bg-white">
              答题卡
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-lg data-[state=on]:bg-white">
              解析
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sheet" className="mt-3">
            <div className="max-h-[340px] overflow-y-auto rounded-2xl bg-white p-4 card-shadow">
              {questions ? (
                <AnswerSheet groups={groups} onJump={() => navigate(`/quiz/${session.id}?q=1`)} />
              ) : (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-3">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> 加载中…
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="analysis" className="mt-3">
            <ul className="space-y-3">
              {(questions ?? []).map((q) => {
                const r = session.results[q.id];
                return (
                  <li key={q.id} className="rounded-2xl bg-white p-4 card-shadow">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="rounded-md bg-brand-soft text-[11px] text-ink">
                        {KIND_LABEL[q.kind]}
                      </Badge>
                      <span className="num text-xs text-ink-3">第 {q.no} 题</span>
                      {r === undefined ? (
                        <span className="text-xs text-ink-3">未作答</span>
                      ) : r ? (
                        <span className="text-xs text-success-strong">答对</span>
                      ) : (
                        <span className="text-xs text-danger-strong">答错</span>
                      )}
                    </div>
                    <p className="text-[15px] leading-7 text-ink">{q.stem}</p>
                    <p className="num mt-2 text-sm text-ink-2">
                      正确答案：{q.answer.join("、") || q.answerText || "—"}
                    </p>
                    {q.analysis ? (
                      <p className="mt-1.5 text-sm leading-6 text-ink-2">{q.analysis}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            className="h-11 rounded-lg bg-surface px-2 text-[13px] text-ink"
            onClick={() => navigate(`/quiz/${session.id}?q=1`)}
          >
            查看解析
          </Button>
          <Button
            variant="secondary"
            className="h-11 rounded-lg bg-surface px-2 text-[13px] text-ink"
            onClick={() => navigate("/library")}
          >
            返回章节列表
          </Button>
          <Button
            className="h-11 rounded-lg bg-brand px-2 text-[13px] text-ink hover:bg-brand/90"
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
            <RotateCcw className="size-4" aria-hidden />
            错题重练
          </Button>
        </div>

        <p className="text-center text-[11px] text-ink-3">
          错题已自动加入错题本（当前共 {Object.keys(wrongBook).length} 道）
        </p>
      </PageContainer>
    </div>
  );
}
