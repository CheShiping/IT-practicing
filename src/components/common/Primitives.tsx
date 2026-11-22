import { FileQuestion } from "lucide-react";

/** 空态：像一页还没印上内容的纸，不用大圆角插图块 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-shell-2 px-6 py-14 text-center">
      <FileQuestion className="size-7 text-ink-3" strokeWidth={1.4} aria-hidden />
      <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-[12.5px] leading-6 text-ink-3">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
