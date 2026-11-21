import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ProgressRecord {
  attempts: number;
  correct: number;
  wrong: number;
  lastAt: number;
  streak: number;
}

export interface SessionState {
  id: string;
  unitIds: string[];
  chapterIds: string[];
  mode: "quiz" | "recite";
  title: string;
  questionIds: string[];
  index: number;
  answers: Record<string, string[]>;
  revealed: Record<string, boolean>;
  results: Record<string, boolean>;
  startedAt: number;
}

export interface Profile {
  name: string;
  examDate: string;
  dailyGoal: number;
  fontScale: "100" | "115" | "130";
  reduceMotion: boolean;
}

interface AppState {
  profile: Profile;
  progress: Record<string, ProgressRecord>;
  wrongBook: Record<string, { count: number; lastAt: number; resolved: boolean }>;
  favorites: string[];
  notes: Record<string, { text: string; updatedAt: number }>;
  sessions: SessionState[];
  current: SessionState | null;
  /** 题库版本，确认后重置本地数据 */
  dataVersion: string;

  setProfile: (p: Partial<Profile>) => void;
  recordAnswer: (qid: string, correct: boolean) => void;
  addWrong: (qid: string) => void;
  removeWrong: (qid: string) => void;
  toggleFavorite: (qid: string) => void;
  saveNote: (qid: string, text: string) => void;
  removeNote: (qid: string) => void;
  startSession: (s: SessionState) => void;
  updateSession: (patch: Partial<SessionState>) => void;
  endSession: () => void;
  clearSession: () => void;
  resetAll: () => void;
}

const storage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    } as unknown as Storage;
  }
  return window.localStorage;
});

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: {
        name: "同学",
        examDate: "",
        dailyGoal: 30,
        fontScale: "100",
        reduceMotion: false,
      },
      progress: {},
      wrongBook: {},
      favorites: [],
      notes: {},
      sessions: [],
      current: null,
      dataVersion: "",

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      recordAnswer: (qid, correct) =>
        set((s) => {
          const prev = s.progress[qid] ?? {
            attempts: 0,
            correct: 0,
            wrong: 0,
            lastAt: 0,
            streak: 0,
          };
          const next: ProgressRecord = {
            attempts: prev.attempts + 1,
            correct: prev.correct + (correct ? 1 : 0),
            wrong: prev.wrong + (correct ? 0 : 1),
            lastAt: Date.now(),
            streak: correct ? prev.streak + 1 : 0,
          };
          return { progress: { ...s.progress, [qid]: next } };
        }),

      addWrong: (qid) =>
        set((s) => {
          const prev = s.wrongBook[qid];
          return {
            wrongBook: {
              ...s.wrongBook,
              [qid]: {
                count: (prev?.count ?? 0) + 1,
                lastAt: Date.now(),
                resolved: false,
              },
            },
          };
        }),

      removeWrong: (qid) =>
        set((s) => {
          const next = { ...s.wrongBook };
          delete next[qid];
          return { wrongBook: next };
        }),

      toggleFavorite: (qid) =>
        set((s) => ({
          favorites: s.favorites.includes(qid)
            ? s.favorites.filter((x) => x !== qid)
            : [...s.favorites, qid],
        })),

      saveNote: (qid, text) =>
        set((s) => {
          const notes = { ...s.notes };
          if (!text.trim()) delete notes[qid];
          else notes[qid] = { text, updatedAt: Date.now() };
          return { notes };
        }),

      removeNote: (qid) =>
        set((s) => {
          const notes = { ...s.notes };
          delete notes[qid];
          return { notes };
        }),

      startSession: (s) => set(() => ({ current: s })),

      updateSession: (patch) =>
        set((s) => (s.current ? { current: { ...s.current, ...patch } } : s)),

      endSession: () =>
        set((s) => {
          if (!s.current) return s;
          const sessions = [s.current, ...s.sessions.filter((x) => x.id !== s.current!.id)].slice(0, 50);
          return { current: null, sessions };
        }),

      clearSession: () => set({ current: null }),

      resetAll: () =>
        set({
          progress: {},
          wrongBook: {},
          favorites: [],
          notes: {},
          sessions: [],
          current: null,
        }),
    }),
    {
      name: "msz.v1.app",
      version: 1,
      storage,
      // 延后到挂载后再读取本地数据，保证服务端与客户端首帧一致（无水合告警）
      skipHydration: true,
      partialize: (s) => ({
        profile: s.profile,
        progress: s.progress,
        wrongBook: s.wrongBook,
        favorites: s.favorites,
        notes: s.notes,
        sessions: s.sessions,
        current: s.current,
        dataVersion: s.dataVersion,
      }),
    },
  ),
);

/** 单题掌握度 0~100：连续正确加分，答错清零 */
export function masteryOf(rec?: ProgressRecord): number {
  if (!rec || rec.attempts === 0) return 0;
  const base = Math.min(100, rec.correct * 25 + rec.streak * 15 - rec.wrong * 10);
  return Math.max(0, base);
}

export function masteryLabel(v: number) {
  if (v >= 80) return "已掌握";
  if (v >= 50) return "较熟悉";
  if (v > 0) return "需巩固";
  return "未学习";
}
