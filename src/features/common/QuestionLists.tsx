import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadChapter } from "@/data/loader";
import { KIND_LABEL, type Question } from "@/data/types";
import { relativeTime } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

/** 题目 id 形如 ch3-single-123，可直接定位到所属章节 */
export function chapterOf(id: string) {
  return id.split("-")[0];
}

export function useResolvedQuestions(ids: string[]) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const key = useMemo(() => [...ids].sort().join(","), [ids]);
  useEffect(() => {
    if (!ids.length) {
      setQuestions([]);
      return;
    }
    let alive = true;
    const chapters = [...new Set(ids.map(chapterOf))];
    Promise.all(chapters.map((c) => loadChapter(c)))
      .then((list) => {
        if (!alive) return;
        const map = new Map<string, Question>();
        for (const c of list) for (const q of c.questions) map.set(q.id, q);
        setQuestions(ids.map((id) => map.get(id)).filter((q): q is Question => Boolean(q)));
      })
      .catch(() => alive && setQuestions([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return questions;
}

export function QuestionCard({
  q,
  badge,
  right,
  footer,
}: {
  q: Question;
  badge?: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white card-shadow">
      <div className="p-4">
        <div className="flex items-center gap-1.5">
          <Badge className="rounded bg-success px-1.5 py-0.5 text-[11px] text-white">
            {KIND_LABEL[q.kind]}
          </Badge>
          {badge}
          <div className="ml-auto flex items-center gap-2">{right}</div>
        </div>
        <p className="mt-2 line-clamp-3 text-[15px] leading-6 text-ink">{q.stem}</p>
      </div>
      {footer}
    </article>
  );
}

/** 卡片底部摘要条（对齐原型） */
export function CardSummary({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5 bg-surface px-4 py-2.5">
      <FileText className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
      <p className="line-clamp-2 text-[11px] leading-4 text-ink-2">{children}</p>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/70" />
      ))}
    </div>
  );
}

export function LoadingBlock({ text = "加载中…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-3">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {text}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "搜索题干或解析",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 rounded-xl bg-white pl-9"
      />
    </div>
  );
}

export function FavoriteToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "取消收藏" : "收藏"}
      aria-pressed={active}
      className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-black/5"
    >
      <Star className={active ? "size-4.5 fill-danger text-danger" : "size-4.5 text-ink-3"} aria-hidden />
    </button>
  );
}

export function StartPracticeButton({
  ids,
  title,
  disabled,
}: {
  ids: string[];
  title: string;
  disabled?: boolean;
}) {
  const start = () => {
    if (!ids.length) return;
    const chapterIds = [...new Set(ids.map(chapterOf))];
    const id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    useAppStore.getState().startSession({
      id,
      unitIds: [],
      chapterIds,
      mode: "quiz",
      title,
      questionIds: ids,
      index: 0,
      answers: {},
      revealed: {},
      results: {},
      startedAt: Date.now(),
    });
    window.location.assign(`/quiz/${id}`);
  };
  return (
    <Button
      className="h-12 w-full rounded-2xl bg-brand text-ink hover:bg-brand/90"
      disabled={disabled || !ids.length}
      onClick={start}
    >
      消灭错题
    </Button>
  );
}

export function relative(ts?: number) {
  return ts ? relativeTime(ts) : "";
}
