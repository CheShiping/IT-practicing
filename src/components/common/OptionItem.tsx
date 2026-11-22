import { Check, X } from "lucide-react";
import { cn } from "cn";

export type OptionState = "idle" | "selected" | "correct" | "wrong";

/**
 * 选项：一张可以点的白卡。字母是一枚小方块，
 * 选中时整张卡换成天蓝边与浅蓝底，判对判错换成绿/红。
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
        "flex w-full items-start gap-3 rounded-[14px] border-2 bg-paper p-3.5 text-left transition-all duration-150",
        "border-transparent shadow-[0_1px_0_rgba(12,26,40,.04),0_4px_12px_rgba(12,40,64,.07)]",
        !disabled &&
          "hover:shadow-[var(--shadow-lift)] focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-yellow",
        selected &&
          "border-azure bg-[#e9f6ff] shadow-[0_1px_0_rgba(12,26,40,.04),0_8px_18px_rgba(0,139,215,.18)]",
        correct && "border-green bg-green-tint",
        wrong && "border-red bg-red-tint",
        disabled && "cursor-default",
      )}
    >
      <span
        className={cn(
          "num mt-[1px] flex size-[26px] shrink-0 items-center justify-center rounded-[8px] text-[12px] font-extrabold leading-none transition-colors",
          !selected && !correct && !wrong && "bg-[#dbeefb] text-ink",
          selected && "bg-azure text-white",
          correct && "bg-green text-white",
          wrong && "bg-red text-white",
        )}
        aria-hidden
      >
        {optionKey}
      </span>

      <span className="min-w-0 flex-1 pt-[3px]">
        <span className="block text-[14.5px] leading-[1.72] font-medium text-ink">{text}</span>
      </span>

      {correct ? <Check className="mark mt-1 size-[18px] shrink-0 text-green" aria-hidden /> : null}
      {wrong ? <X className="mark mt-1 size-[18px] shrink-0 text-red" aria-hidden /> : null}
      {selected ? <span className="sr-only">已选中</span> : null}
      {correct ? <span className="sr-only">正确答案</span> : null}
      {wrong ? <span className="sr-only">你的错答</span> : null}
    </button>
  );
}
