import { useMemo, useState } from "react";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/Primitives";
import {
  FavoriteToggle,
  ListSkeleton,
  QuestionCard,
  SearchBox,
  StartPracticeButton,
  relative,
  useResolvedQuestions,
} from "@/features/common/QuestionLists";
import { useAppStore } from "@/store/useAppStore";

export default function FavoritesPage() {
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const [keyword, setKeyword] = useState("");
  const questions = useResolvedQuestions(favorites);

  const filtered = useMemo(() => {
    if (!questions) return null;
    if (!keyword.trim()) return questions;
    const k = keyword.trim().toLowerCase();
    return questions.filter((q) => q.stem.toLowerCase().includes(k));
  }, [questions, keyword]);

  return (
    <div className="min-h-dvh">
      <TopBar title="我的收藏" variant="plain" center back />
      <PageContainer className="max-w-[460px] space-y-3 pt-4">
        <SearchBox value={keyword} onChange={setKeyword} />
        <p className="num text-xs text-ink-3">共收藏 {favorites.length} 道题</p>

        {!filtered ? (
          <ListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={keyword ? "没有找到相关收藏" : "还没有收藏题"}
            description={keyword ? "换个关键词试试" : "练习中点击右上角星标即可收藏"}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((q) => (
              <li key={q.id}>
                <QuestionCard
                  q={q}
                  badge={<span className="num text-[11px] text-ink-3">正确答案 {q.answer.join("、")}</span>}
                  right={
                    <FavoriteToggle active onClick={() => toggleFavorite(q.id)} />
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
      <div className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0">
        <div className="mx-auto max-w-[460px]">
          <StartPracticeButton ids={filtered?.map((q) => q.id) ?? []} title="收藏题重练" />
        </div>
      </div>
    </div>
  );
}

export function NotesPage() {
  const notes = useAppStore((s) => s.notes);
  const [keyword, setKeyword] = useState("");
  const ids = useMemo(() => Object.keys(notes), [notes]);
  const questions = useResolvedQuestions(ids);

  const filtered = useMemo(() => {
    if (!questions) return null;
    const list = questions.filter((q) => notes[q.id]);
    if (!keyword.trim()) return list;
    const k = keyword.trim().toLowerCase();
    return list.filter(
      (q) =>
        q.stem.toLowerCase().includes(k) || notes[q.id].text.toLowerCase().includes(k),
    );
  }, [questions, notes, keyword]);

  return (
    <div className="min-h-dvh">
      <TopBar title="我的笔记" variant="plain" center back />
      <PageContainer className="max-w-[460px] space-y-3 pt-4">
        <SearchBox value={keyword} onChange={setKeyword} placeholder="搜索笔记" />
        <p className="num text-xs text-ink-3">共 {ids.length} 条笔记</p>

        {!filtered ? (
          <ListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={keyword ? "没有找到相关笔记" : "还没有笔记"}
            description={keyword ? "换个关键词试试" : "刷题时点击笔记图标，记录你的想法"}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((q) => (
              <li key={q.id}>
                <QuestionCard
                  q={q}
                  footer={
                    <div className="mt-2 rounded-xl bg-brand-soft/60 p-3">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
                        {notes[q.id].text}
                      </p>
                      <p className="num mt-1 text-[11px] text-ink-3">
                        更新于 {relative(notes[q.id].updatedAt)}
                      </p>
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </div>
  );
}
