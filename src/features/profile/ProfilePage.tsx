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
    "w-full border-b border-rule-2 bg-transparent py-1 text-right text-[14px] text-ink outline-none focus:border-brand";

  return (
    <div className="min-h-dvh">
      <TopBar title="我的" kicker="设置只影响这台设备" />

      <PageContainer className="pt-5">
        {/* 个人信息 */}
        <section>
          <SectionHead>个人信息</SectionHead>
          <dl className="text-[13.5px]">
            <div className="flex items-center gap-4 border-b border-rule py-2.5">
              <dt className="w-20 shrink-0 text-ink-2">昵称</dt>
              <dd className="flex-1">
                <input
                  aria-label="昵称"
                  value={profile.name}
                  onChange={(e) => setProfile({ name: e.target.value })}
                  className={inputCls}
                />
              </dd>
            </div>
            <div className="flex items-center gap-4 border-b border-rule py-2.5">
              <dt className="w-20 shrink-0 text-ink-2">考试日期</dt>
              <dd className="flex-1">
                <input
                  aria-label="考试日期"
                  type="date"
                  value={profile.examDate}
                  onChange={(e) => setProfile({ examDate: e.target.value })}
                  className={inputCls}
                />
              </dd>
            </div>
            <div className="flex items-center gap-4 border-b border-rule py-2.5">
              <dt className="w-20 shrink-0 text-ink-2">每日目标</dt>
              <dd className="flex flex-1 items-baseline justify-end gap-1.5">
                <input
                  aria-label="每日目标题量"
                  type="number"
                  min={1}
                  max={500}
                  value={profile.dailyGoal}
                  onChange={(e) => setProfile({ dailyGoal: Number(e.target.value) || 30 })}
                  className="w-16 border-b border-rule-2 bg-transparent py-1 text-right text-[14px] text-ink outline-none focus:border-brand"
                />
                <span className="text-[12px] text-ink-3">题</span>
              </dd>
            </div>
          </dl>
          <p className="num mt-1.5 text-[10.5px] text-ink-3">
            设置考试日期后，目录页书眉会显示距考试天数
          </p>
        </section>

        {/* 显示 */}
        <section className="mt-8">
          <SectionHead>显示</SectionHead>
          <div className="flex items-center justify-between gap-4 border-b border-rule py-2.5">
            <span className="text-[13.5px] text-ink-2">字号</span>
            <div className="flex items-center overflow-hidden rounded-[3px] border border-rule-2">
              {(["100", "115", "130"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setProfile({ fontScale: v })}
                  aria-pressed={profile.fontScale === v}
                  className={`num px-2.5 py-1 text-[12px] transition-colors ${
                    profile.fontScale === v
                      ? "bg-ink font-semibold text-white"
                      : "bg-paper text-ink-2"
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-rule py-2.5">
            <span className="text-[13.5px] text-ink-2">减少动效</span>
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
                className="relative h-[22px] w-[38px] rounded-full border border-rule-2 bg-paper-3 transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
              >
                <span className="absolute left-[2px] top-[2px] size-[16px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[16px]" />
              </span>
            </label>
          </div>
        </section>

        {/* 数据 */}
        <section className="mt-8">
          <SectionHead right={`${Object.keys(progress).length} 题记录`}>数据</SectionHead>
          <p className="mt-2 font-serif text-[13px] leading-[1.8] text-ink-2">
            学习记录存在这台设备的浏览器里，不会上传。换设备时导出再导入即可带走。
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={exportData}
              className="press h-10 rounded-[3px] border border-rule-2 bg-paper text-[13px] text-ink hover:bg-paper-2 active:translate-y-px"
            >
              导出
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="press h-10 rounded-[3px] border border-rule-2 bg-paper text-[13px] text-ink hover:bg-paper-2 active:translate-y-px"
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
              className="press h-10 rounded-[3px] border border-danger/40 bg-paper text-[13px] text-danger hover:bg-danger-tint active:translate-y-px"
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

        {/* 关于 */}
        <section className="mt-8">
          <SectionHead>关于</SectionHead>
          <dl className="num text-[12.5px]">
            <div className="flex justify-between gap-4 border-b border-rule py-2">
              <dt className="font-sans text-ink-2">题源</dt>
              <dd className="text-right text-ink">{manifest?.book ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rule py-2">
              <dt className="font-sans text-ink-2">入库题量</dt>
              <dd className="text-ink">{manifest?.totalQuestions ?? "—"} 题</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rule py-2">
              <dt className="font-sans text-ink-2">可自动判分</dt>
              <dd className="text-ink">{manifest?.usableQuestions ?? "—"} 题</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rule py-2">
              <dt className="font-sans text-ink-2">数据版本</dt>
              <dd className="text-ink">{manifest?.dataVersion ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-2 font-serif text-[11.5px] leading-[1.8] text-ink-3">
            题目与解析来自纸质教辅扫描件的识别结果，个别字符可能有误差，仅供备考参考，请以原书为准。
          </p>
        </section>
      </PageContainer>
    </div>
  );
}
