import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageContainer, TopBar } from "@/components/layout/AppShell";
import { useManifest } from "@/data/hooks";
import { useAppStore } from "@/store/useAppStore";

export default function ProfilePage() {
  const { manifest } = useManifest();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const resetAll = useAppStore((s) => s.resetAll);
  const progress = useAppStore((s) => s.progress);
  const wrongBook = useAppStore((s) => s.wrongBook);
  const notes = useAppStore((s) => s.notes);
  const favorites = useAppStore((s) => s.favorites);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (manifest && useAppStore.getState().dataVersion !== manifest.dataVersion) {
      useAppStore.setState({ dataVersion: manifest.dataVersion });
    }
  }, [manifest]);

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      profile,
      progress,
      wrongBook,
      notes,
      favorites,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `计基速刷-学习数据-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出学习数据");
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        useAppStore.setState({
          profile: { ...profile, ...(data.profile ?? {}) },
          progress: data.progress ?? {},
          wrongBook: data.wrongBook ?? {},
          notes: data.notes ?? {},
          favorites: data.favorites ?? [],
        });
        toast.success("导入成功");
      } catch {
        toast.error("文件格式不正确");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-dvh">
      <TopBar title="我的" variant="plain" center />
      <PageContainer className="max-w-[560px] space-y-4 pt-4">
        <section className="rounded-2xl bg-white p-4 card-shadow">
          <h2 className="text-[15px] font-semibold text-ink">个人信息</h2>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">昵称</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam">考试日期</Label>
              <Input
                id="exam"
                type="date"
                value={profile.examDate}
                onChange={(e) => setProfile({ examDate: e.target.value })}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-ink-3">设置后，首页顶部会显示考试倒计时。</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">每日目标题量</Label>
              <Input
                id="goal"
                type="number"
                min={1}
                max={500}
                value={profile.dailyGoal}
                onChange={(e) => setProfile({ dailyGoal: Number(e.target.value) || 30 })}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 card-shadow">
          <h2 className="text-[15px] font-semibold text-ink">显示设置</h2>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>字号缩放</Label>
              <ToggleGroup
                type="single"
                value={profile.fontScale}
                onValueChange={(v) => v && setProfile({ fontScale: v as "100" | "115" | "130" })}
                variant="outline"
                className="rounded-xl bg-surface p-1"
              >
                {["100", "115", "130"].map((v) => (
                  <ToggleGroupItem key={v} value={v} className="rounded-lg data-[state=on]:bg-white">
                    {v}%
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <label className="flex items-center justify-between rounded-xl bg-surface px-3 py-2.5">
              <span className="text-sm text-ink">减少动效</span>
              <input
                type="checkbox"
                checked={profile.reduceMotion}
                onChange={(e) => setProfile({ reduceMotion: e.target.checked })}
                className="size-5 accent-[#FFC300]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 card-shadow">
          <h2 className="text-[15px] font-semibold text-ink">数据管理</h2>
          <p className="mt-1 text-xs text-ink-2">
            学习记录保存在本机浏览器，不会上传。换设备时可导出后导入。
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" className="rounded-xl bg-surface text-ink" onClick={exportData}>
              导出数据
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl bg-surface text-ink"
              onClick={() => fileRef.current?.click()}
            >
              导入数据
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl bg-danger/15 text-danger-strong hover:bg-danger/25"
              onClick={() => {
                if (confirm("确定清空全部本地学习数据？该操作不可恢复。")) {
                  resetAll();
                  toast.success("已清空本地数据");
                }
              }}
            >
              清空数据
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </section>

        <section className="rounded-2xl bg-white p-4 card-shadow">
          <h2 className="text-[15px] font-semibold text-ink">关于</h2>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">题源</dt>
              <dd className="text-right text-ink">{manifest?.book ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">入库题量</dt>
              <dd className="num text-ink">{manifest?.totalQuestions ?? "—"} 题</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">数据版本</dt>
              <dd className="num text-ink">{manifest?.dataVersion ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] leading-5 text-ink-3">
            本站题目与解析来自纸质教辅的扫描件 OCR 提取结果，个别字符可能存在识别误差；
            仅供备考参考，请以原书为准。
          </p>
        </section>
      </PageContainer>
    </div>
  );
}
