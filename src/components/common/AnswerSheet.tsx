import { cn } from "cn";

export interface SheetGroup {
  title: string;
  items: { no: number; state: "correct" | "wrong" | "unanswered" | "current" }[];
}

/**
 * 答题卡：密排的小方格。答对填绿，答错填红，当前题描黄。
 * 格子是屏幕上能点得动的最小单位，44px 以下不做主操作。
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
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="min-w-0 truncate text-[12.5px] font-extrabold text-ink">{g.title}</h3>
            <ul className="flex shrink-0 items-center gap-3 text-[10.5px] font-semibold text-ink-3">
              <Legend className="bg-green" label="答对" />
              <Legend className="bg-red" label="答错" />
              <Legend className="bg-paper border-2 border-shell-2" label="未答" />
            </ul>
          </div>
          <ul className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {g.items.map((it) => (
              <li key={it.no}>
                <button
                  type="button"
                  onClick={() => onJump(it.no)}
                  aria-label={`第 ${it.no} 题，${
                    it.state === "correct" ? "答对" : it.state === "wrong" ? "答错" : "未答"
                  }`}
                  aria-current={it.state === "current" ? "true" : undefined}
                  className={cn(
                    "num flex h-11 w-full items-center justify-center rounded-[10px] text-[12px] font-bold transition-colors",
                    it.state === "unanswered" &&
                      "bg-paper text-ink-3 shadow-[0_1px_0_rgba(12,26,40,.04)] hover:bg-shell",
                    it.state === "correct" && "bg-green text-white hover:brightness-110",
                    it.state === "wrong" && "bg-red text-white hover:brightness-110",
                    it.state === "current" && "outline-3 outline-offset-1 outline-yellow",
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
      <span aria-hidden className={cn("size-2.5 rounded-[10px]", className)} />
      {label}
    </li>
  );
}
