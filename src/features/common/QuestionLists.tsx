import { useEffect, useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadChapter } from "@/data/loader";
import { KIND_LABEL, type Question } from "@/data/types";
import { relativeTime } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";

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

/** 索引行：题号、题型、题干、判定，用印刷线分隔 */
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
    <article className="card p-3.5">
      <div className="flex items-baseline gap-2">
        <span className="num flex size-6 items-center justify-center rounded-[7px] bg-azure text-[10.5px] font-extrabold text-white">{q.no}</span>
        <span className="text-[10.5px] text-ink-3">{KIND_LABEL[q.kind]}</span>
        {badge}
        <div className="ml-auto flex items-center gap-1">{right}</div>
      </div>
      <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-[1.75] font-medium text-ink">
        {q.stem}
      </p>
      {footer}
    </article>
  );
}

/** 行内摘要 */
export function CardSummary({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.7] text-ink-3">
      {children}
    </p>
  );
}

export function ListSkeleton() {
  return (
    <div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-b border-shell-2 py-3">
          <div className="h-3 w-24 animate-pulse bg-shell-2" />
          <div className="mt-2 h-3.5 w-full animate-pulse bg-shell-2" />
          <div className="mt-1.5 h-3.5 w-2/3 animate-pulse bg-shell-2" />
        </div>
      ))}
    </div>
  );
}

export function LoadingBlock({ text = "加载中…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-ink-3">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {text}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "搜题干或解析",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-shell-2 pb-1.5 focus-within:border-ink">
      <svg
        viewBox="0 0 24 24"
        className="size-3.5 shrink-0 text-ink-3"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent py-1 text-[13.5px] text-ink outline-none placeholder:text-ink-3"
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
      className="flex size-8 items-center justify-center rounded-[10px] text-ink-3 transition-colors hover:bg-shell"
    >
      <Star
        className={active ? "size-4 fill-azure text-azure" : "size-4 text-ink-3"}
        aria-hidden
      />
    </button>
  );
}

export function StartPracticeButton({
  ids,
  title,
  disabled,
  label = "开始刷这组题",
}: {
  ids: string[];
  title: string;
  disabled?: boolean;
  label?: string;
}) {
  const navigate = useNavigate();
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
    navigate(`/quiz/${id}`);
  };
  return (
    <Button
      className="press h-[46px] w-full rounded-[12px] bg-azure text-[15px] font-bold text-white hover:bg-[#a80a5c] active:translate-y-px"
      disabled={disabled || !ids.length}
      onClick={start}
    >
      {label}
    </Button>
  );
}

export function relative(ts?: number) {
  return ts ? relativeTime(ts) : "";
}
