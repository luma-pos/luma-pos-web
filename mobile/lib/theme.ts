/**
 * Design tokens — đồng bộ với design system của web (theme "ocean", chế độ sáng).
 * Nguồn: design/assets/ui.css. Dùng chung cho mọi màn mobile.
 */
export const C = {
  bg: "#f6f7f9",
  surface: "#ffffff",
  surface2: "#f1f3f6",
  border: "#e5e8ee",
  text: "#16202e",
  textMuted: "#64748b",
  textFaint: "#94a3b8",

  primary: "#2563eb",
  primaryH: "#1d4ed8",
  primarySoft: "#eff4ff",
  accent: "#0ea5e9",

  success: "#16a34a",
  successSoft: "#e8f7ee",
  warning: "#d97706",
  warningSoft: "#fdf3e3",
  danger: "#dc2626",
  dangerSoft: "#fdeaea",
  info: "#0284c7",
  infoSoft: "#e6f4fb",

  white: "#ffffff",
} as const;

export const R = { card: 16, md: 12, sm: 10, xs: 8 } as const;

/** Shadow card — rõ khối, dịu (giống KiotViet card trên nền xám). */
export const shadowSoft = {
  shadowColor: "#1e293b",
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
  elevation: 4,
} as const;

/** Shadow nổi hơn cho phần tử cần nhấn (FAB, sheet). */
export const shadowMd = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.16,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
} as const;

/** Palette dải trung tính cho DARK (khớp .dark trong global.css) — dùng cho header/tab bar (JS, không qua className). */
export const Cdark = {
  bg: "#0d1322", surface: "#151c2e", surface2: "#1d2740", border: "#273253",
  text: "#e8edf6", textMuted: "#94a3b8", textFaint: "#5b6b85",
} as const;

/** Option header/tab bar theo chế độ sáng/tối (header dùng style JS nên không tự đổi qua CSS var). */
export function navOptions(dark: boolean) {
  const p = dark ? Cdark : C;
  return {
    headerStyle: { backgroundColor: p.surface },
    headerTintColor: p.text,
    headerTitleStyle: { fontWeight: "800" as const, color: p.text },
    headerShadowVisible: true,
    headerBackButtonDisplayMode: "minimal" as const, // ẩn chữ "(tabs)" cạnh nút back
    contentStyle: { backgroundColor: p.bg },
  };
}

/** Giữ tương thích cũ (header sáng). */
export const headerStyle = navOptions(false);

/** Màu badge trạng thái tồn kho. */
export function stockBadge(stock: number, min: number) {
  if (stock <= 0) return { label: "Hết hàng", fg: C.danger, bg: C.dangerSoft };
  if (min > 0 && stock <= min) return { label: "Sắp hết", fg: C.warning, bg: C.warningSoft };
  return { label: "Đủ", fg: C.success, bg: C.successSoft };
}

export const fmtVi = (v: string | number | null | undefined) =>
  v == null || v === "" ? "0" : Number(v).toLocaleString("vi-VN");
