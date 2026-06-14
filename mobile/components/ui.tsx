import { ReactNode, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "./BottomSheet";
import { C, shadowSoft } from "../lib/theme";

/* ============================================================
   Thư viện UI dùng chung (NativeWind). Token màu khai báo ở tailwind.config.js.
   ============================================================ */

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`flex-1 bg-bg ${className}`}>{children}</View>;
}

export function Card({ children, className = "", onPress }: { children: ReactNode; className?: string; onPress?: () => void }) {
  const cls = `bg-surface rounded-card border border-border p-3.5 ${className}`;
  if (onPress) return <TouchableOpacity onPress={onPress} className={cls} style={shadowSoft}>{children}</TouchableOpacity>;
  return <View className={cls} style={shadowSoft}>{children}</View>;
}

type BadgeKind = "success" | "warning" | "danger" | "info" | "primary";
const BADGE: Record<BadgeKind, string> = {
  success: "bg-success-soft", warning: "bg-warning-soft", danger: "bg-danger-soft", info: "bg-info-soft", primary: "bg-primary-soft",
};
const BADGE_TX: Record<BadgeKind, string> = {
  success: "text-success", warning: "text-warning", danger: "text-danger", info: "text-info", primary: "text-primary",
};
export function Badge({ label, kind = "primary" }: { label: string; kind?: BadgeKind }) {
  return (
    <View className={`px-2 py-0.5 rounded-full ${BADGE[kind]}`}>
      <Text className={`text-[11px] font-bold ${BADGE_TX[kind]}`}>{label}</Text>
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder = "Tìm kiếm…" }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View className="flex-row items-center mx-3 mt-3 bg-surface border border-border rounded-xl px-3" style={shadowSoft}>
      <Ionicons name="search" size={17} color={C.faint} />
      <TextInput className="flex-1 py-2.5 px-2 text-[15px] text-text" value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.faint} returnKeyType="search" />
    </View>
  );
}

export function Thumb({ uri, size = 40 }: { uri?: string | null; size?: number }) {
  const r = { width: size, height: size, borderRadius: 10 };
  if (uri) return <Image source={{ uri }} style={r} />;
  return <View style={r} className="bg-surface2 items-center justify-center"><Ionicons name="cube-outline" size={size * 0.48} color={C.muted} /></View>;
}

export function PrimaryButton({ title, onPress, loading, disabled, tone = "primary", className = "" }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean; tone?: "primary" | "success" | "danger"; className?: string;
}) {
  const bg = tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : "bg-primary";
  return (
    <TouchableOpacity className={`${bg} rounded-xl py-3.5 items-center ${disabled || loading ? "opacity-50" : ""} ${className}`} onPress={onPress} disabled={disabled || loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">{title}</Text>}
    </TouchableOpacity>
  );
}

export function EmptyState({ text, icon = "file-tray-outline" }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="items-center justify-center py-12 gap-2.5">
      <Ionicons name={icon} size={40} color={C.border} />
      <Text className="text-faint text-sm text-center px-8">{text}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-danger font-bold text-[15px]">Lỗi tải dữ liệu</Text>
      <Text className="text-muted text-[13px] mt-1.5 text-center">{message}</Text>
      {onRetry && (
        <TouchableOpacity className="mt-4 bg-primary px-5 py-2.5 rounded-lg" onPress={onRetry}>
          <Text className="text-white font-bold">Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Loading() {
  return <View className="flex-1 items-center justify-center bg-bg"><ActivityIndicator size="large" color={C.primary} /></View>;
}

/** Segmented control (chọn 1 trong nhiều) — tự viết, dùng cho hình thức TT, chế độ, theme… */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View className="flex-row bg-surface2 rounded-xl p-[3px] gap-[3px]">
      {options.map(([v, label]) => (
        <TouchableOpacity key={v} className={`flex-1 py-2.5 rounded-lg items-center ${value === v ? "bg-surface" : ""}`} style={value === v ? shadowSoft : undefined} onPress={() => onChange(v)}>
          <Text className={`text-[13.5px] font-bold ${value === v ? "text-primary" : "text-muted"}`}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Bộ tăng/giảm số lượng (− N +) — tự viết, dùng ở giỏ, trả hàng… */
export function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <View className="flex-row items-center bg-surface2 rounded-lg p-1">
      <TouchableOpacity className="w-8 h-8 rounded-md bg-surface items-center justify-center" onPress={() => onChange(Math.max(min, value - 1))}>
        <Ionicons name="remove" size={18} color={C.primary} />
      </TouchableOpacity>
      <Text className="min-w-[34px] text-center text-[15px] font-bold text-text">{value}</Text>
      <TouchableOpacity className="w-8 h-8 rounded-md bg-surface items-center justify-center" onPress={() => onChange(value + 1)}>
        <Ionicons name="add" size={18} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}

/** Sheet chọn 1 phương án (danh sách đơn giản, không search) — tự viết trên BottomSheet. */
export function Select<T extends string>({ visible, onClose, title, options, value, onChange }: {
  visible: boolean; onClose: () => void; title: string; options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between px-4 pb-2.5">
        <Text className="text-base font-extrabold text-text">{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={8}><Ionicons name="close" size={24} color={C.muted} /></TouchableOpacity>
      </View>
      <ScrollView>
        {options.length === 0 ? <Text className="text-center text-faint py-6">Không có lựa chọn</Text> : options.map((o) => (
          <TouchableOpacity key={o.value} className="flex-row items-center justify-between px-4 py-3.5 border-t border-surface2" onPress={() => { onChange(o.value); onClose(); }}>
            <Text className="text-[15px] text-text">{o.label}</Text>
            {value === o.value && <Ionicons name="checkmark" size={20} color={C.primary} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

/** Ô nhập có nhãn (gom về 1 chỗ thay vì lặp ở mỗi form). editable=false → chế độ xem. */
export function Field({ label, value, onChangeText, keyboardType, placeholder, editable = true }: {
  label: string; value: string; onChangeText: (t: string) => void; keyboardType?: "default" | "number-pad"; placeholder?: string; editable?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="text-[12.5px] font-semibold text-muted mb-1.5">{label}</Text>
      <TextInput
        editable={editable}
        className={`border rounded-lg px-3 py-2.5 text-[15px] text-text ${editable ? "border-border bg-surface" : "border-transparent bg-surface2"}`}
        value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={C.faint}
      />
    </View>
  );
}

/** Chọn ngày — lịch tự vẽ trong BottomSheet (không dùng lib ngoài). */
const pad = (n: number) => String(n).padStart(2, "0");
export const fmtDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function DateField({ label, value, onChange }: { label: string; value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const lead = first.getDay();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const shift = (m: number) => setView(new Date(view.getFullYear(), view.getMonth() + m, 1));
  const isSel = (d: number) => value.getDate() === d && value.getMonth() === view.getMonth() && value.getFullYear() === view.getFullYear();

  return (
    <>
      {label ? <Text className="text-[12.5px] font-semibold text-muted mb-1.5">{label}</Text> : null}
      <TouchableOpacity className="flex-row items-center justify-between border border-border rounded-lg px-3 py-2.5" onPress={() => { setView(new Date(value.getFullYear(), value.getMonth(), 1)); setOpen(true); }}>
        <Text className="text-[15px] text-text">{fmtDate(value)}</Text>
        <Ionicons name="calendar-outline" size={18} color={C.faint} />
      </TouchableOpacity>

      <BottomSheet visible={open} onClose={() => setOpen(false)} heightPct={0.56}>
        <View className="flex-row items-center justify-between px-4 pb-2">
          <TouchableOpacity onPress={() => shift(-1)} hitSlop={8}><Ionicons name="chevron-back" size={22} color={C.text} /></TouchableOpacity>
          <Text className="text-[15px] font-extrabold text-text">Tháng {view.getMonth() + 1}/{view.getFullYear()}</Text>
          <TouchableOpacity onPress={() => shift(1)} hitSlop={8}><Ionicons name="chevron-forward" size={22} color={C.text} /></TouchableOpacity>
        </View>
        <View className="flex-row px-3">
          {WD.map((w) => <Text key={w} className="flex-1 text-center text-[12px] font-semibold text-faint py-1">{w}</Text>)}
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}>
          <View className="flex-row flex-wrap">
            {cells.map((d, i) => (
              <View key={i} style={{ width: `${100 / 7}%` }} className="items-center py-1">
                {d == null ? <View className="w-10 h-10" /> : (
                  <TouchableOpacity className={`w-10 h-10 rounded-full items-center justify-center ${isSel(d) ? "bg-primary" : ""}`} onPress={() => { onChange(new Date(view.getFullYear(), view.getMonth(), d)); setOpen(false); }}>
                    <Text className={`text-[15px] ${isSel(d) ? "text-white font-bold" : "text-text"}`}>{d}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>
    </>
  );
}
