import { ScrollView, Text, View, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDashboard, useInventoryStats } from "../lib/queries";
import { C, fmtVi } from "../lib/theme";
import { Card } from "../components/ui";

export default function Reports() {
  const dash = useDashboard();
  const stats = useInventoryStats();
  const loading = dash.isLoading || stats.isLoading;

  const rows: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string; sub: string }[] = [
    { icon: "cash-outline", color: C.success, label: "Doanh thu hôm nay", value: `${fmtVi(dash.data?.revenueToday ?? 0)}đ`, sub: `${dash.data?.orderCount ?? 0} đơn hoàn tất` },
    { icon: "wallet-outline", color: C.warning, label: "Công nợ phải thu", value: `${fmtVi(dash.data?.receivables ?? 0)}đ`, sub: `${dash.data?.debtorCount ?? 0} khách còn nợ` },
    { icon: "cube-outline", color: C.primary, label: "Tổng sản phẩm", value: `${fmtVi(stats.data?.total ?? 0)}`, sub: "đang kinh doanh" },
    { icon: "alert-circle-outline", color: C.danger, label: "Hết hàng", value: `${fmtVi(stats.data?.outOfStock ?? 0)} SP`, sub: "cần nhập thêm" },
  ];

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 14, gap: 12 }}
      refreshControl={<RefreshControl refreshing={dash.isRefetching} onRefresh={() => { dash.refetch(); stats.refetch(); }} />}
    >
      {loading ? (
        <ActivityIndicator size="large" color={C.primary} className="mt-10" />
      ) : (
        rows.map((r) => (
          <Card key={r.label} className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: `${r.color}1a` }}>
              <Ionicons name={r.icon} size={22} color={r.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text">{r.label}</Text>
              <Text className="text-xs text-faint mt-0.5">{r.sub}</Text>
            </View>
            <Text className="text-base font-extrabold" style={{ color: r.color }}>{r.value}</Text>
          </Card>
        ))
      )}
      <Text className="text-xs text-faint text-center mt-1 px-2.5">Số liệu đọc trực tiếp từ Supabase. Báo cáo chi tiết (theo tuần/tháng, top SP) sẽ bổ sung sau.</Text>
    </ScrollView>
  );
}
