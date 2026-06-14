import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { createOrderViaApi } from "./api";
import type { CreateOrderInput } from "./schemas";

/**
 * Hàng đợi đơn OFFLINE (POS Mức A).
 * Khi mất mạng: đơn được lưu vào AsyncStorage với clientId sẵn có.
 * Khi có mạng lại: flush() gửi từng đơn qua API web. clientId đảm bảo
 * gửi lại không tạo trùng (server trả về đơn cũ nếu đã tạo).
 */
const KEY = "pos_outbox_v1";
type Entry = { payload: CreateOrderInput; queuedAt: number };

let count = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function read(): Promise<Entry[]> {
  const r = await AsyncStorage.getItem(KEY);
  return r ? (JSON.parse(r) as Entry[]) : [];
}
async function write(list: Entry[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  count = list.length;
  emit();
}

/** Gọi 1 lần khi app khởi động để nạp số lượng đang chờ. */
export async function initOutbox() {
  count = (await read()).length;
  emit();
}

export async function enqueueOrder(payload: CreateOrderInput) {
  const list = await read();
  list.push({ payload, queuedAt: Date.now() });
  await write(list);
}

let flushing = false;
/** Đẩy hàng đợi lên server. Giữ lại đơn nếu vẫn lỗi mạng; bỏ đơn nếu server đã xử lý (ok) hoặc từ chối. */
export async function flushOutbox(): Promise<{ synced: number; kept: number; dropped: number }> {
  if (flushing) return { synced: 0, kept: 0, dropped: 0 };
  flushing = true;
  try {
    const list = await read();
    if (list.length === 0) return { synced: 0, kept: 0, dropped: 0 };
    const remain: Entry[] = [];
    let synced = 0, dropped = 0;
    for (const e of list) {
      const res = await createOrderViaApi(e.payload);
      if (res.ok) synced++;
      else if (res.network) remain.push(e);          // vẫn mất mạng → giữ lại thử sau
      else dropped++;                                 // server từ chối (validate…) → bỏ tránh kẹt
    }
    await write(remain);
    return { synced, kept: remain.length, dropped };
  } finally {
    flushing = false;
  }
}

const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };
const getSnapshot = () => count;
/** Số đơn đang chờ đồng bộ (reactive). */
export function useOutboxCount() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
