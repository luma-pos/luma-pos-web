import { useSyncExternalStore } from "react";

/** Toast tự viết — store nhỏ + host ở root. Dùng showToast(...) ở bất kỳ đâu. */
export type ToastItem = { id: number; message: string; type: "success" | "error" | "info" };

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(message: string, type: ToastItem["type"] = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, 2600);
}

const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };
const getSnapshot = () => toasts;
export function useToasts() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot); }
