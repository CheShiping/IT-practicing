import { cn } from "cn";

export function RadialProgress({
  value,
  size = 96,
  stroke = 8,
  label,
  sub,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-xl font-semibold text-ink">{label ?? `${Math.round(pct)}%`}</span>
        {sub ? <span className="num text-[11px] text-ink-3">{sub}</span> : null}
      </div>
    </div>
  );
}

export function StatCard({
  value,
  unit,
  label,
  extra,
  className,
}: {
  value: React.ReactNode;
  unit?: string;
  label: string;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 card-shadow", className)}>
      <div className="flex items-end gap-1">
        <span className="num text-2xl font-semibold text-ink">{value}</span>
        {unit ? <span className="num pb-1 text-xs text-ink-3">{unit}</span> : null}
      </div>
      <p className="mt-1 text-xs text-ink-2">{label}</p>
      {extra ? <div className="mt-2 text-xs text-ink-3">{extra}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-12 text-center card-shadow">
      <div className="flex size-24 items-center justify-center rounded-2xl bg-surface text-ink-3">
        {icon ?? (
          <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path d="M4 5h16v14H4z" strokeLinejoin="round" />
            <path d="M8 9h8M8 13h5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <p className="mt-4 text-base font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-sm text-ink-2">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
