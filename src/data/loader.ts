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
export function judge(question: Question, selected: string[]): boolean {
  const ans = [...question.answer].sort();
  const sel = [...new Set(selected)].sort();
  if (ans.length === 0) return false;
  if (ans.length !== sel.length) return false;
  return ans.every((a, i) => a === sel[i]);
}
