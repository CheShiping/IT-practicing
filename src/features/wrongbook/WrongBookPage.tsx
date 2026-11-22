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
      (q) => q.stem.toLowerCase().includes(k) || (q.analysis ?? "").toLowerCase().includes(k),
    );
  }, [questions, keyword]);

  return (
    <div className={`min-h-dvh ${filtered?.length ? "pb-24" : ""}`}>
      <TopBar title="错题本" kicker={`${Object.keys(wrongBook).length} 道 · 答错自动收进来`} back />

      <PageContainer className="pt-4">
        <div className="card flex items-end gap-4 px-4 pt-2 pb-2.5">
          <div className="min-w-0 flex-1">
            <SearchBox value={keyword} onChange={setKeyword} />
          </div>
          <button
            type="button"
            onClick={() => setOnlyUnresolved((v) => !v)}
            aria-pressed={onlyUnresolved}
            className={`shrink-0 pb-1 text-[12px] transition-colors ${
              onlyUnresolved ? "font-semibold text-azure" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {onlyUnresolved ? "只看未消灭 ✓" : "只看未消灭"}
          </button>
        </div>

        {!filtered ? (
          <div className="mt-1">
            <ListSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title={keyword ? "没有找到相关错题" : "还没有错题"}
              description={
                keyword ? "换个关键词，或清除筛选条件" : "刷题时答错的题会自动收进这里"
              }
              action={
                keyword ? (
                  <button
                    type="button"
                    className="border border-shell-2 px-4 py-2 text-[13px] text-ink"
                    onClick={() => setKeyword("")}
                  >
                    清除搜索
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <p className="num mt-3 text-[11px] text-ink-3">
              显示 {filtered.length} / {ids.length} 道
            </p>
            <ul>
              {filtered.map((q) => (
                <li key={q.id}>
                  <QuestionCard
                    q={q}
                    badge={
                      <span className="num text-[10.5px] text-red">
                        已错 {wrongBook[q.id]?.count ?? 0} 次
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
                        <span className="num"> · 最近 {relative(wrongBook[q.id]?.lastAt)}</span>
                      </CardSummary>
                    }
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </PageContainer>

      {filtered?.length ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-shell-2 bg-paper px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mx-auto md:mt-5 md:max-w-[420px] md:border-0 md:bg-transparent md:p-0">
          <div className="mx-auto max-w-[560px] md:max-w-none">
            <StartPracticeButton
              ids={filtered.map((q) => q.id)}
              title="错题重练"
              label={`重做这 ${filtered.length} 道错题`}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
