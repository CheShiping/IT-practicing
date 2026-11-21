import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "cn";
import { Check, X } from "lucide-react";

export type OptionState = "idle" | "selected" | "correct" | "wrong";

/**
 * 选项行：对齐原型 —— 判定后「已选且正确」为绿色实心块、「已选且错误」为红色实心块，
 * 未选项保持白底浅描边；字母与正文同色，不另设徽标。
 */
export function OptionItem({
  optionKey,
  text,
  state,
  multi,
  disabled,
  onSelect,
}: {
  optionKey: string;
  text: string;
  state: OptionState;
  multi?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  const isCorrect = state === "correct";
  const isWrong = state === "wrong";
  const isSelected = state === "selected";

  return (
    <label
      className={cn(
        "relative flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] leading-6 transition-colors duration-150",
        // 控件本身透明，焦点环画在行上，保证键盘操作可见
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
        isCorrect && "bg-success text-white",
        isWrong && "bg-danger text-white",
        isSelected && "bg-brand-soft text-ink",
        !isCorrect && !isWrong && !isSelected && "border border-black/8 bg-white text-ink",
        disabled && "cursor-default",
      )}
    >
      {/* 透明铺满整行的原生控件：整行可点、键盘可达、读屏可读 */}
      {multi ? (
        <Checkbox
          checked={isSelected || isCorrect}
          disabled={disabled}
          onCheckedChange={() => onSelect?.()}
          aria-label={`选项 ${optionKey}`}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-lg opacity-0"
        />
      ) : (
        <RadioGroupItem
          value={optionKey}
          disabled={disabled}
          onClick={() => onSelect?.()}
          aria-label={`选项 ${optionKey}`}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-lg opacity-0"
        />
      )}

      <span aria-hidden className="num w-4 shrink-0 font-medium">
        {optionKey}
      </span>
      <span className="flex-1">{text}</span>

      {isCorrect ? <Check className="size-4.5 shrink-0 text-white" aria-hidden /> : null}
      {isWrong ? <X className="size-4.5 shrink-0 text-white" aria-hidden /> : null}
    </label>
  );
}
