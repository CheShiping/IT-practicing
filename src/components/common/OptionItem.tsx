import { Check, X } from "lucide-react";
import { cn } from "cn";

export type OptionState = "idle" | "selected" | "correct" | "wrong";

/**
 * 选项行：教辅书里的一道选项，不是一颗圆角按钮。
 * 左侧字母是一格可涂黑的方框——选中即填涂，这是答题卡的动作。
 */
export function OptionItem({
  optionKey,
  text,
  state,
  disabled,
  onSelect,
}: {
  optionKey: string;
  text: string;
  state: OptionState;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const selected = state === "selected";
  const correct = state === "correct";
  const wrong = state === "wrong";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected || correct || wrong}
      aria-label={`选项 ${optionKey}：${text}`}
      className={cn(
        "group relative flex w-full items-start gap-3 border-b border-rule px-0.5 py-[11px] text-left transition-colors",
        "hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
        selected && "bg-brand-tint",
        correct && "bg-success-tint",
        wrong && "bg-danger-tint",
        disabled && "cursor-default",
      )}
    >
      <span
        className={cn(
          "num mt-[1px] flex size-[23px] shrink-0 items-center justify-center rounded-[3px] border text-[12px] font-bold leading-none transition-colors",
          !selected && !correct && !wrong && "border-rule-2 text-ink-2 group-hover:border-ink-3",
          selected && "border-brand bg-brand text-white",
          correct && "border-success bg-success text-white",
          wrong && "border-danger bg-danger text-white",
        )}
        aria-hidden
      >
        {optionKey}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[15px] leading-[1.72] text-ink">{text}</span>
      </span>

      {correct ? <Check className="mark mt-1 size-4 shrink-0 text-success" aria-hidden /> : null}
      {wrong ? <X className="mark mt-1 size-4 shrink-0 text-danger" aria-hidden /> : null}
      {selected ? <span className="sr-only">已选中</span> : null}
      {correct ? <span className="sr-only">正确答案</span> : null}
      {wrong ? <span className="sr-only">你的错答</span> : null}
    </button>
  );
}
