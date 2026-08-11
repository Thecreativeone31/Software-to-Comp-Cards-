"use client";
import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try { const saved = localStorage.getItem(key); if (saved) setValue(JSON.parse(saved)); } catch {}
  }, [key]);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue] as const;
}
