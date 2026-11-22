import { cn } from "cn";

export interface SheetGroup {
  title: string;
  items: { no: number; state: "correct" | "wrong" | "unanswered" | "current" }[];
}

/**
 * 答案速查表：书末那张密集的题号表，不用圆点、不用进度环。
 * 一格一题，格线是印刷线，答对填品红，答错填红。
 */
export function AnswerSheet({
  groups,
  onJump,
}: {
  groups: SheetGroup[];
  onJump: (no: number) => void;
}) {
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.title}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-1.5">
            <h3 className="text-[13px] font-bold text-ink">{g.title}</h3>
            <ul className="num flex items-center gap-3 text-[11px] text-ink-3">
              <Legend className="bg-brand" label="答对" />
              <Legend className="bg-danger" label="答错" />
              <Legend className="border border-rule-2" label="未答" />
            </ul>
          </div>
          <ul className="grid grid-cols-6 gap-px border-t border-l border-rule bg-rule sm:grid-cols-9 md:grid-cols-11">
            {g.items.map((it) => (
              <li key={it.no} className="bg-paper">
                <button
                  type="button"
                  onClick={() => onJump(it.no)}
                  aria-label={`第 ${it.no} 题，${
                    it.state === "correct" ? "答对" : it.state === "wrong" ? "答错" : "未答"
                  }`}
                  aria-current={it.state === "current" ? "true" : undefined}
                  className={cn(
                    "num flex h-9 w-full items-center justify-center text-[12px] transition-colors",
                    it.state === "unanswered" && "text-ink-2 hover:bg-paper-2",
                    it.state === "correct" && "bg-brand font-bold text-white hover:bg-[#a80a5c]",
                    it.state === "wrong" && "bg-danger font-bold text-white hover:bg-[#972015]",
                    it.state === "current" && "outline outline-2 -outline-offset-2 outline-ink",
                  )}
                >
                  {it.no}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Legend({ className, label }: { className?: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5", className)} />
      {label}
    </li>
  );
}
