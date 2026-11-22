import type { Chapter, Manifest, Question, Unit } from "./types";

const BASE = import.meta.env.BASE_URL || "/";
const url = (p: string) => `${BASE.replace(/\/$/, "")}/data/${p}`;

const cache = new Map<string, unknown>();

async function getJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(url(path), { cache: "no-cache" });
  if (!res.ok) throw new Error(`题库加载失败：${path} (${res.status})`);
  const data = (await res.json()) as T;
  cache.set(path, data);
  return data;
}

export const loadManifest = () => getJSON<Manifest>("manifest.json");
export const loadUnits = () => getJSON<{ units: Unit[] }>("units.json").then((d) => d.units);
export const loadChapter = (id: string) => getJSON<Chapter>(`chapters/${id}.json`);

export function filterQuestions(chapter: Chapter, unitId?: string) {
  if (!unitId) return chapter.questions;
  return chapter.questions.filter((q) => q.sectionId === unitId);
}

export function isGraded(q: Question) {
  return q.type === "single" || q.type === "multi" || q.type === "judge";
}

/** 判分：单选/判断全等，多选集合全等（少选、多选、错选均判错） */
/** 归一化：容忍 OCR 噪声、全半角、空格与标点差异（填空题比对用） */
export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[，,、；;：:。.！!？?（）()【】\[\]「」『』《》<>"'“”‘’`·\-—_/\\|]/g, "");
}

/**
 * 填空题判定。
 *
 * 参考答案来自扫描件，字符可能有误差，因此按三级放宽：
 *   1. 归一化后完全相等；
 *   2. 一方包含另一方（至少 2 个字符，避免单字误命中）；
 *   3. 多空题按顿号/分号切开，要求逐段命中。
 */
export function judgeBlank(answerText: string | undefined, input: string): boolean {
  const raw = (answerText ?? "").trim();
  const sel = normalizeAnswer(input);
  if (!raw || !sel) return false;

  // 参考答案里常带备选说法：Cache（或高速缓冲存储器）、声卡（或声音卡、音频卡）
  const alts = new Set<string>();
  alts.add(normalizeAnswer(raw));
  const withoutParen = raw.replace(/[（(][^）)]*[）)]/g, "");
  alts.add(normalizeAnswer(withoutParen));
  for (const m of raw.matchAll(/[（(]([^）)]*)[）)]/g)) {
    for (const piece of m[1].split(/[或、，,／/]/)) {
      const t = piece.replace(/^(或|也叫|又称|即|即是)/, "").trim();
      if (t) alts.add(normalizeAnswer(t));
    }
  }
  const list = [...alts].filter((x) => x.length > 0);

  // 1) 任一备选完全相等
  if (list.some((a) => a === sel)) return true;
  // 2) 任一备选包含用户输入（至少 2 字符，避免单字误命中）
  if (sel.length >= 2 && list.some((a) => a.includes(sel))) return true;
  // 3) 用户输入包含整个参考答案
  if (list.some((a) => sel.includes(a))) return true;
  // 4) 多空：按顿号/分号切开后逐段命中
  const parts = raw
    .split(/[；;、，,]/)
    .map(normalizeAnswer)
    .filter((x) => x.length >= 2);
  if (parts.length >= 2 && parts.length <= 6) {
    return parts.some((p) => sel.includes(p) || p.includes(sel)) &&
      parts.every((p) => sel.includes(p) || p.includes(sel));
  }
  return false;
}

export function judge(question: Question, selected: string[]): boolean {
  const ans = [...question.answer].sort();
  const sel = [...new Set(selected)].sort();
  if (ans.length === 0) return false;
  if (ans.length !== sel.length) return false;
  return ans.every((a, i) => a === sel[i]);
}
