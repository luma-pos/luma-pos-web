import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartLine } from "./types";

/**
 * POS đa-phiếu (Đơn tạm) — mỗi phiếu nhớ giỏ + khách + bảng giá + chế độ.
 * Toàn bộ được persist vào AsyncStorage → kill app mở lại vẫn còn mọi đơn tạm.
 */
export type Draft = {
  id: string;
  name: string;
  lines: CartLine[];
  customerId: string | null;
  customerName: string | null;
  bookId: string | null;
  mode: "sale" | "quote";
};

const KEY = "pos_drafts_v1";
const mkId = () => `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const emptyDraft = (name: string): Draft => ({ id: mkId(), name, lines: [], customerId: null, customerName: null, bookId: null, mode: "sale" });

let drafts: Draft[] = [emptyDraft("Đơn 1")];
let activeId = drafts[0].id;
let snapshot: { drafts: Draft[]; activeId: string } = { drafts, activeId };

const listeners = new Set<() => void>();
function commit() {
  snapshot = { drafts, activeId };
  listeners.forEach((l) => l());
  void AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
}

const active = (): Draft => drafts.find((d) => d.id === activeId) ?? drafts[0];
function patchActive(patch: Partial<Draft>) {
  drafts = drafts.map((d) => (d.id === activeId ? { ...d, ...patch } : d));
  commit();
}

export async function hydrateCart() {
  try {
    const r = await AsyncStorage.getItem(KEY);
    if (r) {
      const s = JSON.parse(r) as { drafts: Draft[]; activeId: string };
      if (s.drafts?.length) {
        drafts = s.drafts;
        activeId = s.drafts.find((d) => d.id === s.activeId)?.id ?? s.drafts[0].id;
        commit();
      }
    }
  } catch {
    // bỏ qua lỗi đọc storage
  }
}

/* ---- thao tác trên phiếu đang chọn ---- */
export function addToCart(line: Omit<CartLine, "quantity" | "basePrice"> & { quantity?: number; basePrice?: number }) {
  const qty = line.quantity ?? 1;
  const a = active();
  const i = a.lines.findIndex((l) => l.productId === line.productId);
  const lines = i >= 0
    ? a.lines.map((l, idx) => (idx === i ? { ...l, quantity: l.quantity + qty } : l))
    : [...a.lines, { ...line, basePrice: line.basePrice ?? line.unitPrice, quantity: qty }];
  patchActive({ lines });
}
export function setQty(productId: string, qty: number) {
  const a = active();
  const lines = qty <= 0 ? a.lines.filter((l) => l.productId !== productId) : a.lines.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l));
  patchActive({ lines });
}
export function removeLine(productId: string) { patchActive({ lines: active().lines.filter((l) => l.productId !== productId) }); }
export function clearActive() { patchActive({ lines: [], customerId: null, customerName: null, mode: "sale" }); }
export function setLinePrice(productId: string, price: number) {
  patchActive({ lines: active().lines.map((l) => (l.productId === productId ? { ...l, unitPrice: price } : l)) });
}
export function repriceCart(overrides: Map<string, number>) {
  patchActive({ lines: active().lines.map((l) => ({ ...l, unitPrice: overrides.get(l.productId) ?? l.basePrice })) });
}
export function setDraftMeta(meta: Partial<Pick<Draft, "customerId" | "customerName" | "bookId" | "mode">>) { patchActive(meta); }

/* ---- quản lý nhiều phiếu (Đơn tạm) ---- */
export function newDraft() { const d = emptyDraft(`Đơn ${drafts.length + 1}`); drafts = [...drafts, d]; activeId = d.id; commit(); }
export function switchDraft(id: string) { if (drafts.some((d) => d.id === id)) { activeId = id; commit(); } }
export function removeDraft(id: string) {
  drafts = drafts.filter((d) => d.id !== id);
  if (drafts.length === 0) drafts = [emptyDraft("Đơn 1")];
  if (!drafts.some((d) => d.id === activeId)) activeId = drafts[0].id;
  commit();
}

const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };
const getSnapshot = () => snapshot;
/** State POS (danh sách đơn tạm + đơn đang chọn). */
export function usePos() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot); }
export function getActiveDraft(state: { drafts: Draft[]; activeId: string }) {
  return state.drafts.find((d) => d.id === state.activeId) ?? state.drafts[0];
}
