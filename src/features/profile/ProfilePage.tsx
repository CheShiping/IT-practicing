import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageContainer, SectionHead, TopBar } from "@/components/layout/AppShell";
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

  const inputCls =
    "w-full bg-transparent py-1 text-right text-[14px] font-semibold text-ink outline-none focus:text-azure";

  return (
    <div className="min-h-dvh">
      <TopBar title="我的" kicker="设置只影响这台设备" />

      <PageContainer className="pt-4">
        {/* 个人信息 */}
        <SectionHead>个人信息</SectionHead>
        <section className="card divide-y divide-shell-2 overflow-hidden">
          <label className="flex items-center gap-4 px-4 py-3">
            <span className="w-20 shrink-0 text-[13px] text-ink-2">昵称</span>
            <input
              aria-label="昵称"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex items-center gap-4 px-4 py-3">
            <span className="w-20 shrink-0 text-[13px] text-ink-2">考试日期</span>
            <input
              aria-label="考试日期"
              type="date"
              value={profile.examDate}
              onChange={(e) => setProfile({ examDate: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="flex items-center gap-4 px-4 py-3">
            <span className="w-20 shrink-0 text-[13px] text-ink-2">每日目标</span>
            <span className="ml-auto flex items-baseline gap-1.5">
              <input
                aria-label="每日目标题量"
                type="number"
                min={1}
                max={500}
                value={profile.dailyGoal}
                onChange={(e) => setProfile({ dailyGoal: Number(e.target.value) || 30 })}
                className="w-14 bg-transparent py-1 text-right text-[14px] font-semibold text-ink outline-none focus:text-azure"
              />
              <span className="text-[12px] text-ink-3">题</span>
            </span>
          </label>
        </section>
        <p className="mt-1.5 px-1 text-[10.5px] text-ink-3">
          设置考试日期后，书眉会显示距考试天数
        </p>

        {/* 显示 */}
        <div className="mt-6">
          <SectionHead>显示</SectionHead>
          <section className="card divide-y divide-shell-2 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-[13px] text-ink-2">字号</span>
              <div className="flex items-center gap-1 rounded-full bg-shell p-0.5">
                {(["100", "115", "130"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setProfile({ fontScale: v })}
                    aria-pressed={profile.fontScale === v}
                    className={`num rounded-full px-3 py-1 text-[12px] font-bold transition-colors ${
                      profile.fontScale === v ? "bg-azure text-white" : "text-ink-2"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-[13px] text-ink-2">减少动效</span>
              <label className="flex cursor-pointer items-center gap-2.5">
                <span className="num text-[11px] text-ink-3">
                  {profile.reduceMotion ? "已开启" : "已关闭"}
                </span>
                <input
                  type="checkbox"
                  checked={profile.reduceMotion}
                  onChange={(e) => setProfile({ reduceMotion: e.target.checked })}
                  aria-label="减少动效"
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-[26px] w-[44px] rounded-full bg-shell-2 transition-colors peer-checked:bg-azure peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-yellow"
                >
                  <span className="absolute left-[3px] top-[3px] size-[20px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[18px]" />
                </span>
              </label>
            </div>
          </section>
        </div>

        {/* 数据 */}
        <div className="mt-6">
          <SectionHead right={`${Object.keys(progress).length} 题记录`}>数据</SectionHead>
          <section className="card p-4">
            <p className="text-[12.5px] leading-6 text-ink-2">
              学习记录存在这台设备的浏览器里，不会上传。换设备时导出再导入即可带走。
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={exportData}
                className="press h-10 rounded-[11px] bg-shell text-[13px] font-bold text-ink-2 hover:bg-shell-2 active:translate-y-[1px]"
              >
                导出
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="press h-10 rounded-[11px] bg-shell text-[13px] font-bold text-ink-2 hover:bg-shell-2 active:translate-y-[1px]"
              >
                导入
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("确定清空全部本地学习数据？该操作不可恢复。")) {
                    resetAll();
                    toast.success("已清空本地数据");
                  }
                }}
                className="press h-10 rounded-[11px] bg-red-tint text-[13px] font-bold text-red active:translate-y-[1px]"
              >
                清空
              </button>
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
        </div>

        {/* 关于 */}
        <div className="mt-6">
          <SectionHead>关于</SectionHead>
          <section className="card divide-y divide-shell-2 overflow-hidden">
            {[
              { k: "题源", v: manifest?.book ?? "—" },
              { k: "入库题量", v: `${manifest?.totalQuestions ?? "—"} 题` },
              { k: "可自动判分", v: `${manifest?.usableQuestions ?? "—"} 题` },
              { k: "数据版本", v: manifest?.dataVersion ?? "—" },
            ].map((r) => (
              <div key={r.k} className="flex items-baseline gap-4 px-4 py-3">
                <span className="shrink-0 text-[12.5px] text-ink-2">{r.k}</span>
                <span className="num ml-auto text-right text-[12px] font-semibold text-ink">
                  {r.v}
                </span>
              </div>
            ))}
          </section>
          <p className="mt-1.5 px-1 text-[10.5px] leading-5 text-ink-3">
            题目与解析来自纸质教辅扫描件的识别结果，个别字符可能有误差，仅供备考参考，请以原书为准。
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
