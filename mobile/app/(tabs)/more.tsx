import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { supabase } from "../../lib/supabase";
import { setLanguage } from "../../lib/i18n";
import { C } from "../../lib/theme";
import { Card } from "../../components/ui";

type Href = "/orders" | "/inventory" | "/reports" | "/suppliers" | "/cashbook" | "/receive" | "/stocktake";
const LINKS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: Href }[] = [
  { icon: "receipt-outline", label: "Đơn hàng", href: "/orders" },
  { icon: "document-text-outline", label: "Báo giá", href: "/quotes" },
  { icon: "cube-outline", label: "Tồn kho", href: "/inventory" },
  { icon: "download-outline", label: "Nhập hàng", href: "/receive" },
  { icon: "clipboard-outline", label: "Kiểm kho", href: "/stocktake" },
  { icon: "business-outline", label: "Nhà cung cấp", href: "/suppliers" },
  { icon: "wallet-outline", label: "Sổ quỹ", href: "/cashbook" },
  { icon: "bar-chart-outline", label: "Báo cáo", href: "/reports" },
];

function Segment<T extends string>({ value, options, onChange }: { value: T | undefined; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View className="flex-row bg-surface2 rounded-lg p-[3px] gap-[3px]">
      {options.map(([v, label]) => (
        <TouchableOpacity key={v} className={`px-3.5 py-1.5 rounded-md ${value === v ? "bg-surface" : ""}`} onPress={() => onChange(v)}>
          <Text className={`text-[13px] font-bold ${value === v ? "text-primary" : "text-muted"}`}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function More() {
  const [email, setEmail] = useState("");
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, []);

  async function signOut() { await supabase.auth.signOut(); router.replace("/login"); }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 14, gap: 12 }}>
      <Card>
        <View className="flex-row items-center gap-3 py-1">
          <View className="w-11 h-11 rounded-full bg-primary-soft items-center justify-center">
            <Text className="text-primary font-extrabold text-[15px]">{(email.slice(0, 2) || "U").toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-text">Tài khoản</Text>
            <Text className="text-[12.5px] text-muted mt-0.5">{email || "—"}</Text>
          </View>
        </View>
      </Card>

      <Card className="py-0">
        {LINKS.map((l, i) => (
          <TouchableOpacity key={l.href} className={`flex-row items-center gap-3 py-3.5 ${i > 0 ? "border-t border-border" : ""}`} onPress={() => router.push(l.href)}>
            <Ionicons name={l.icon} size={20} color={C.muted} />
            <Text className="flex-1 text-[14.5px] font-semibold text-text">{l.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={C.faint} />
          </TouchableOpacity>
        ))}
      </Card>

      <Card className="py-0">
        <View className="flex-row items-center gap-3 py-3">
          <Ionicons name="contrast-outline" size={20} color={C.muted} />
          <Text className="flex-1 text-[14.5px] font-semibold text-text">Giao diện</Text>
          <Segment value={colorScheme} options={[["light", "Sáng"], ["dark", "Tối"], ["system", "Tự động"]]} onChange={(v) => setColorScheme(v)} />
        </View>
        <View className="flex-row items-center gap-3 py-3 border-t border-border">
          <Ionicons name="globe-outline" size={20} color={C.muted} />
          <Text className="flex-1 text-[14.5px] font-semibold text-text">{t("more.language")}</Text>
          <Segment value={i18n.language as "vi" | "en"} options={[["vi", "VI"], ["en", "EN"]]} onChange={(v) => setLanguage(v)} />
        </View>
      </Card>

      <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-surface rounded-card border border-border py-3.5" onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color={C.danger} />
        <Text className="text-danger text-[15px] font-bold">{t("common.signOut")}</Text>
      </TouchableOpacity>

      <Text className="text-center text-faint text-xs mt-1">Sales Mgmt Mobile · v0.1</Text>
    </ScrollView>
  );
}
