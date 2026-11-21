import { cn } from "cn";

export interface SheetGroup {
  title: string;
  items: { no: number; state: "correct" | "wrong" | "unanswered" | "current" }[];
}

export function AnswerSheet({
  groups,
  onJump,
}: {
  groups: SheetGroup[];
  onJump: (no: number) => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.title}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">{g.title}</h3>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-2">
              <Legend color="var(--success-strong)" label="答对" />
              <Legend color="var(--danger-strong)" label="答错" />
              <Legend color="var(--ink-3)" label="未答" />
            </ul>
          </div>
          <ul className="grid grid-cols-5 gap-2.5 sm:grid-cols-8 md:grid-cols-10">
            {g.items.map((it) => (
              <li key={it.no}>
                <button
                  type="button"
                  onClick={() => onJump(it.no)}
                  aria-label={`第 ${it.no} 题，${
                    it.state === "correct" ? "答对" : it.state === "wrong" ? "答错" : "未答"
                  }`}
                  className={cn(
                    "num size-8 rounded-full border text-[13px] transition-colors",
                    it.state === "correct" && "border-success-strong text-success-strong",
                    it.state === "wrong" && "border-danger-strong text-danger-strong",
                    it.state === "unanswered" && "border-ink-3/50 text-ink-3",
                    it.state === "current" && "border-brand bg-brand text-ink",
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-1">
      <span aria-hidden className="size-2.5 rounded-full border" style={{ borderColor: color }} />
      {label}
    </li>
  );
}
