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
