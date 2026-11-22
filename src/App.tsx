import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { BottomNav, DesktopNav } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/common/Primitives";
import { Button } from "@/components/ui/button";
import HomePage from "@/features/home/HomePage";
import LibraryPage from "@/features/library/LibraryPage";
import QuizPage from "@/features/quiz/QuizPage";
import ResultPage from "@/features/quiz/ResultPage";
import WrongBookPage from "@/features/wrongbook/WrongBookPage";
import FavoritesPage, { NotesPage } from "@/features/favorites/FavoritesPage";
import StatsPage from "@/features/stats/StatsPage";
import ProfilePage from "@/features/profile/ProfilePage";
import { useAppStore } from "@/store/useAppStore";

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <EmptyState
        title="页面走丢了"
        description="这个地址没有对应的内容。"
        action={
          <Button className="rounded-[12px] bg-azure text-ink" onClick={() => (window.location.href = `${import.meta.env.BASE_URL}`)}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}

export function App() {
  const { pathname } = useLocation();
  // 二级页面（题库 / 错题本 / 笔记 / 收藏 / 答题 / 结果）不显示底部导航
  const showNav = ["/", "/stats", "/profile"].some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p)),
  );

  useEffect(() => {
    // 首帧保持与服务端一致，挂载后再读本地数据
    void useAppStore.persist.rehydrate();
  }, []);

  // 「我的」里的显示设置必须真实作用于界面
  const fontScale = useAppStore((s) => s.profile.fontScale);
  const reduceMotion = useAppStore((s) => s.profile.reduceMotion);
  useEffect(() => {
    const root = document.documentElement;
    root.style.zoom = fontScale === "100" ? "" : String(Number(fontScale) / 100);
    if (reduceMotion) root.dataset.reduceMotion = "true";
    else delete root.dataset.reduceMotion;
    return () => {
      root.style.zoom = "";
    };
  }, [fontScale, reduceMotion]);
  return (
    <TooltipProvider delayDuration={200}>
      <DesktopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/quiz/:sessionId" element={<QuizPage />} />
        <Route path="/quiz/:sessionId/result" element={<ResultPage />} />
        <Route path="/wrong" element={<WrongBookPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav ? <BottomNav /> : null}
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}

export default App;
