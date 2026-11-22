export type QuestionKind =
  | "single"
  | "multi"
  | "judge"
  | "blank"
  | "short"
  | "analysis"
  | "operation"
  | "comprehensive";

export type QuestionType = "single" | "multi" | "judge" | "subjective";

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  chapterId: string;
  sectionId: string;
  no: number;
  type: QuestionType;
  kind: QuestionKind;
  stem: string;
  options: QuestionOption[];
  answer: string[];
  answerText?: string;
  analysis: string;
  answerable?: boolean;
  source: { book: string; page: number };
}

export interface Section {
  id: string;
  chapterId: string;
  title: string;
  kind: QuestionKind;
  autoJudged: boolean;
  questionCount: number;
  usableCount: number;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  sections: Section[];
  questions: Question[];
}

export interface Unit {
  id: string;
  chapterId: string;
  chapterTitle: string;
  title: string;
  kind: QuestionKind;
  autoJudged: boolean;
  questionCount: number;
  gradableCount: number;
}

export interface Manifest {
  book: string;
  source: string;
  dataVersion: string;
  totalQuestions: number;
  usableQuestions: number;
  excludedQuestions: number;
  chapters: { id: string; title: string; order: number }[];
}

export const KIND_LABEL: Record<QuestionKind, string> = {
  single: "单选题",
  multi: "多选题",
  judge: "判断题",
  blank: "填空题",
  short: "简答题",
  analysis: "分析题",
  operation: "操作题",
  comprehensive: "综合应用题",
};

export const GRADABLE: QuestionKind[] = ["single", "multi", "judge"];

/**
 * 作答方式。原书里只有选择/判断能自动判分，填空与主观题此前在站内"做不了"。
 * 现在按题型给出三种作答路径，让全部 1942 题都能练：
 *   choice —— 选择/判断，点选项自动判分
 *   blank  —— 填空，输入后与参考答案比对
 *   self   —— 简答/分析/操作/综合，揭示参考答案后自评
 */
export type AnswerMode = "choice" | "blank" | "self";

export function answerModeOf(q: Question): AnswerMode {
  if (q.options.length >= 2 && q.answer.length > 0) return "choice";
  if (q.kind === "blank" && (q.answerText ?? "").trim()) return "blank";
  return "self";
}
