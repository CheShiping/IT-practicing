import { useEffect, useState } from "react";
import { loadChapter, loadManifest, loadUnits } from "./loader";
import type { Chapter, Manifest, Unit } from "./types";

/** 是否已完成水合：本地存储数据只在客户端水合后渲染，避免 SSR 不一致 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function useManifest() {
  const [data, setData] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadManifest()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);
  return { manifest: data, error };
}

export function useUnits() {
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadUnits()
      .then((d) => alive && setUnits(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);
  return { units, error };
}

export function useChapter(id: string | undefined) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    setChapter(null);
    loadChapter(id)
      .then((d) => alive && setChapter(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [id]);
  return { chapter, error };
}
