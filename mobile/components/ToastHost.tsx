import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToasts } from "../lib/toast";
import { shadowMd } from "../lib/theme";

const ICON = { success: "checkmark-circle", error: "alert-circle", info: "information-circle" } as const;
const BG = { success: "bg-success", error: "bg-danger", info: "bg-primary" } as const;

/** Hiển thị toast nổi trên cùng — đặt 1 lần ở root layout. */
export function ToastHost() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 56, left: 0, right: 0, alignItems: "center", zIndex: 9999, gap: 8 }}>
      {toasts.map((t) => (
        <View key={t.id} className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl ${BG[t.type]}`} style={shadowMd}>
          <Ionicons name={ICON[t.type]} size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm">{t.message}</Text>
        </View>
      ))}
    </View>
  );
}
