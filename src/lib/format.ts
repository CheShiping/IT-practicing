import type { ProgressRecord } from "@/store/useAppStore";

/** 今日答题次数 */
export function todayCount(progress: Record<string, ProgressRecord>) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  return Object.values(progress).filter((r) => r.lastAt >= t0).length;
}

/** 连续学习天数：从首次答题日到今天，有答题记录的日期计一天 */
export function useStudyDays(progress: Record<string, ProgressRecord>) {
  const records = Object.values(progress);
  if (!records.length) return 0;
  const days = new Set<string>();
  for (const r of records) {
    if (!r.lastAt) continue;
    const d = new Date(r.lastAt);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  if (!days.has(key)) days.add(key);
  return days.size;
}

export function formatDate(ts: number) {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const day = 86400000;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < day * 30) return `${Math.floor(diff / day)} 天前`;
  return formatDate(ts).slice(0, 10);
}
