import { useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, Brain, ChevronDown, CircleUser, GraduationCap, NotebookPen, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { RadialProgress } from "@/components/common/Primitives";
import { useHydrated, useManifest } from "@/data/hooks";
import { todayCount, useStudyDays } from "@/lib/format";
import { masteryOf, useAppStore } from "@/store/useAppStore";
import { QuestionBankSheet } from "@/features/library/QuestionBankSheet";

export default function HomePage() {
  const { manifest } = useManifest();
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const progress = useAppStore((s) => s.progress);
  const wrongBook = useAppStore((s) => s.wrongBook);
  const favorites = useAppStore((s) => s.favorites);
  const notes = useAppStore((s) => s.notes);
  const sessions = useAppStore((s) => s.sessions);

  const total = manifest?.totalQuestions ?? 0;
  const practiced = Object.keys(progress).length;
  const attempts = Object.values(progress).reduce((a, b) => a + b.attempts, 0);
  const correct = Object.values(progress).reduce((a, b) => a + b.correct, 0);
  const mastery = total ? Math.round((Object.values(progress).reduce((a, b) => a + masteryOf(b), 0) / total)) : 0;

  const days = useStudyDays(progress);
  const pending = sessions.find((s) => s.questionIds.length && Object.keys(s.revealed).length < s.questionIds.length);

  const [bank, setBank] = useState<{ open: boolean; mode: "quiz" | "recite"; tab: "subject" | "years" }>(
    { open: false, mode: "quiz", tab: "subject" },
  );

  return (
    <div className="min-h-dvh">
      <TopBar title="计基速刷 · 江西专升本计算机" subtitle={profile.examDate ? undefined : "设置考试日期后可查看倒计时"} />

      <PageContainer className="max-w-[460px] space-y-4 pt-4">
        {/* 用户卡 */}
        <Card className="rounded-2xl border-black/5 p-4 card-shadow">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-brand text-ink">
              <CircleUser className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-ink">{profile.name}</p>
              <p className="num text-xs text-ink-2">
                {hydrated ? `今日刷题 ${todayCount(progress)} 题` : "今日刷题 — 题"}
              </p>
            </div>
            <span className="num flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[12px] font-medium text-ink">
              <span>24 小时刷题</span>
              <span>{attempts}</span>
              <ChevronDown className="size-3.5" aria-hidden />
            </span>
          </div>
        </Card>

        {/* 学习进度 */}
        <Card className="rounded-2xl border-black/5 p-4 card-shadow">
          <div className="flex items-stretch justify-between">
            <div className="flex-1">
              <p className="text-xs text-ink-2">已坚持学习</p>
              <p className="num mt-0.5 text-[26px] font-semibold leading-none text-ink">
                {hydrated ? days : "--"} <span className="text-sm font-normal text-ink-2">天</span>
              </p>
            </div>
            <span aria-hidden className="mx-4 w-px bg-black/10" />
            <div className="flex-1 text-right">
              <p className="text-xs text-ink-2">刷题完成度</p>
              <p className="num mt-0.5 text-[26px] font-semibold leading-none text-ink">
                {total ? Math.round((practiced / total) * 100) : 0}
                <span className="text-sm font-normal text-ink-2">%</span>
              </p>
            </div>
          </div>
        </Card>

        {/* 续答提示 */}
        {pending ? (
          <Link
            to={`/quiz/${pending.id}`}
            className="block rounded-2xl bg-brand px-4 py-3 text-ink card-shadow"
          >
            <p className="text-sm font-medium">继续上次练习</p>
            <p className="num mt-0.5 text-xs text-ink/70">
              {pending.title} · 第 {pending.index + 1} 题
            </p>
          </Link>
        ) : null}

        {/* 主功能区 */}
        <div className="grid gap-3">
          <Button
            size="lg"
            className="h-12 rounded-lg bg-ink text-white hover:bg-ink/90"
            onClick={() => setBank({ open: true, mode: "quiz", tab: "subject" })}
          >
            <Brain className="size-5" aria-hidden />
            考点刷题
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-12 rounded-lg bg-brand text-ink hover:bg-brand/90"
              onClick={() => setBank({ open: true, mode: "recite", tab: "subject" })}
            >
              <BookMarked className="size-5" aria-hidden />
              考点背诵
            </Button>
            <Button
              size="lg"
              className="h-12 rounded-lg bg-brand text-ink hover:bg-brand/90"
              onClick={() => setBank({ open: true, mode: "quiz", tab: "years" })}
              title="历年真题题源尚未接入，可先查看说明"
            >
              <GraduationCap className="size-5" aria-hidden />
              历年真题
            </Button>
          </div>
        </div>

        {/* 副功能区 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col items-center gap-2 rounded-2xl border-black/5 p-4 card-shadow">
            <RadialProgress
              value={total ? (attempts / total) * 100 : 0}
              size={96}
              label={String(attempts)}
              sub={`/${total}`}
            />
            <p className="text-center text-[11px] text-ink-2">刷题总量 / 备考完成量</p>
          </Card>
          <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl border-black/5 p-4 card-shadow">
            <div className="text-center">
              <p className="num text-[26px] font-semibold leading-none text-ink">
                {mastery}
                <span className="text-sm font-normal text-ink-2">%</span>
              </p>
              <p className="mt-1 text-[11px] text-ink-2">综合掌握度</p>
            </div>
            <div className="text-center">
              <p className="num text-[26px] font-semibold leading-none text-ink">
                {attempts ? Math.round((correct / attempts) * 100) : 0}
                <span className="text-sm font-normal text-ink-2">%</span>
              </p>
              <p className="mt-1 text-[11px] text-ink-2">本机综合正确率</p>
            </div>
          </Card>
        </div>

        {/* 辅助功能区 */}
        <div className="grid grid-cols-3 gap-3">
          <QuickLink
            to="/wrong"
            icon={<X className="size-5 text-white" aria-hidden />}
            label="错题本"
            count={Object.keys(wrongBook).length}
            tint="bg-danger"
          />
          <QuickLink
            to="/notes"
            icon={<NotebookPen className="size-5 text-white" aria-hidden />}
            label="我的笔记"
            count={Object.keys(notes).length}
            tint="bg-success-strong"
          />
          <QuickLink
            to="/favorites"
            icon={<Star className="size-5 fill-white text-white" aria-hidden />}
            label="我的收藏"
            count={favorites.length}
            tint="bg-[#3B82F6]"
          />
        </div>

        <p className="pt-2 text-center text-[11px] text-ink-3">
          题源：{manifest?.book ?? "江西省专升本必刷2000题·信息技术"}
          {manifest ? ` · 数据版本 ${manifest.dataVersion}` : ""}
        </p>
      </PageContainer>

      <QuestionBankSheet
        open={bank.open}
        onOpenChange={(v) => setBank((b) => ({ ...b, open: v }))}
        initialMode={bank.mode}
        initialTab={bank.tab}
      />
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
  count,
  tint,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  tint: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-4 card-shadow"
    >
      <span className={`flex size-10 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
      <span className="text-[13px] text-ink">{label}</span>
      <span className="num text-[11px] text-ink-3">{count}</span>
    </Link>
  );
}
