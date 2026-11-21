import { useMemo, useState } from "react";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/Primitives";
import {
  CardSummary,
  FavoriteToggle,
  ListSkeleton,
  QuestionCard,
  SearchBox,
  StartPracticeButton,
  relative,
  useResolvedQuestions,
} from "@/features/common/QuestionLists";
import { useAppStore } from "@/store/useAppStore";

export default function WrongBookPage() {
  const wrongBook = useAppStore((s) => s.wrongBook);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const favorites = useAppStore((s) => s.favorites);
  const [keyword, setKeyword] = useState("");
  const [onlyUnresolved, setOnlyUnresolved] = useState(false);

  const ids = useMemo(
    () =>
      Object.entries(wrongBook)
        .filter(([, v]) => (onlyUnresolved ? !v.resolved : true))
        .sort((a, b) => b[1].lastAt - a[1].lastAt)
        .map(([id]) => id),
    [wrongBook, onlyUnresolved],
  );

  const questions = useResolvedQuestions(ids);
  const filtered = useMemo(() => {
    if (!questions) return null;
    if (!keyword.trim()) return questions;
    const k = keyword.trim().toLowerCase();
    return questions.filter(
      (q) =>
        q.stem.toLowerCase().includes(k) || (q.analysis ?? "").toLowerCase().includes(k),
    );
  }, [questions, keyword]);

  return (
    <div className="min-h-dvh">
      <TopBar title="错题本" variant="plain" center back />
      <PageContainer className="max-w-[460px] space-y-3 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索" />
          </div>
          <button
            type="button"
            onClick={() => setOnlyUnresolved((v) => !v)}
            aria-pressed={onlyUnresolved}
            className={`shrink-0 text-[13px] underline underline-offset-4 transition-colors ${
              onlyUnresolved ? "text-ink" : "text-ink-2"
            }`}
          >
            筛选节
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="num text-xs text-ink-3">共 {ids.length} 道错题</span>
          {onlyUnresolved ? (
            <button
              type="button"
              onClick={() => setOnlyUnresolved(false)}
              className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-2"
            >
              只看未消灭 ✕
            </button>
          ) : null}
        </div>

        {!filtered ? (
          <ListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={keyword ? "没有找到相关错题" : "还没有错题，继续保持！"}
            description={keyword ? "换个关键词，或清除筛选条件" : "刷题中答错的题会自动收集到这里"}
            action={
              keyword ? (
                <button
                  type="button"
                  className="rounded-xl bg-surface px-4 py-2 text-sm text-ink"
                  onClick={() => setKeyword("")}
                >
                  清除搜索
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((q) => (
              <li key={q.id}>
                <QuestionCard
                  q={q}
                  badge={
                    <span className="num rounded border border-black/15 px-1.5 py-0.5 text-[11px] text-ink-2">
                      已错{wrongBook[q.id]?.count ?? 0}次
                    </span>
                  }
                  right={
                    <FavoriteToggle
                      active={favorites.includes(q.id)}
                      onClick={() => toggleFavorite(q.id)}
                    />
                  }
                  footer={
                    <CardSummary>
                      {q.analysis || "原书未给出解析"}
                      <span className="num"> · 最近错误 {relative(wrongBook[q.id]?.lastAt)}</span>
                    </CardSummary>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>

      <div className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0">
        <div className="mx-auto max-w-[720px]">
          <StartPracticeButton
            ids={filtered?.map((q) => q.id) ?? []}
            title="错题重练"
          />
        </div>
      </div>
    </div>
  );
}
