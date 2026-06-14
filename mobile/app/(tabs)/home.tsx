import { ScrollView, Text, TouchableOpacity, View, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDashboard } from "../../lib/queries";
import { C, shadowSoft, fmtVi } from "../../lib/theme";
import { Card } from "../../components/ui";

const QUICK = [
  { icon: "cart", label: "Bán hàng", href: "/pos" as const },
  { icon: "people", label: "Khách hàng", href: "/customers" as const },
  { icon: "cube", label: "Tồn kho", href: "/inventory" as const },
  { icon: "receipt", label: "Đơn hàng", href: "/orders" as const },
] as const;

export default function Home() {
  const { data, isLoading, isRefetching, refetch, error } = useDashboard();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 14, gap: 12 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="bg-primary rounded-card p-[18px]" style={shadowSoft}>
        <Text className="text-white/90 text-[13px]">Doanh thu hôm nay</Text>
        {isLoading ? (
          <ActivityIndicator color="#fff" className="my-2" />
        ) : (
          <>
            <Text className="text-white text-[28px] font-extrabold mt-0.5">{fmtVi(data?.revenueToday ?? 0)}đ</Text>
            <Text className="text-white/90 text-[12.5px] mt-0.5">{data?.orderCount ?? 0} đơn hoàn tất</Text>
          </>
        )}
      </View>

      {error ? <Text className="text-danger text-[13px]">Lỗi tải dữ liệu: {(error as Error).message}</Text> : null}

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-[12.5px] text-muted">Phải thu</Text>
          <Text className="text-lg font-extrabold text-warning mt-0.5">{fmtVi(data?.receivables ?? 0)}đ</Text>
          <Text className="text-[11.5px] text-faint mt-0.5">{data?.debtorCount ?? 0} khách còn nợ</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-[12.5px] text-muted">Hết hàng</Text>
          <Text className="text-lg font-extrabold text-danger mt-0.5">{data?.outOfStock ?? 0} SP</Text>
          <Text className="text-[11.5px] text-faint mt-0.5">cần nhập thêm</Text>
        </Card>
      </View>

      <Text className="text-sm font-extrabold text-text mt-0.5">Thao tác nhanh</Text>
      <View className="flex-row gap-2.5">
        {QUICK.map((qk) => (
          <TouchableOpacity key={qk.label} className="flex-1 bg-surface rounded-card py-3.5 items-center gap-1.5 border border-border" style={shadowSoft} onPress={() => router.push(qk.href)}>
            <View className="w-[42px] h-[42px] rounded-xl bg-primary-soft items-center justify-center">
              <Ionicons name={`${qk.icon}-outline` as keyof typeof Ionicons.glyphMap} size={22} color={C.primary} />
            </View>
            <Text className="text-[11.5px] font-semibold text-text">{qk.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-row justify-between items-center mt-0.5">
        <Text className="text-sm font-extrabold text-text">Đơn mới nhất</Text>
        <TouchableOpacity onPress={() => router.push("/orders")}><Text className="text-primary font-bold text-[13px]">Tất cả →</Text></TouchableOpacity>
      </View>
      <Card className="px-3.5 py-0">
        {(data?.recent ?? []).length === 0 ? (
          <Text className="text-center text-faint py-[18px]">Chưa có đơn</Text>
        ) : (
          data!.recent.map((o, i) => (
            <TouchableOpacity key={o.id} className={`flex-row items-center py-3 ${i > 0 ? "border-t border-border" : ""}`} onPress={() => router.push({ pathname: "/order/[id]", params: { id: o.id } })}>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-text">{o.code} · {o.customers?.name ?? "Khách lẻ"}</Text>
                <Text className="text-xs text-faint mt-0.5">{new Date(o.created_at).toLocaleDateString("vi-VN")}</Text>
              </View>
              <Text className="text-sm font-bold text-text">{fmtVi(o.total)}đ</Text>
            </TouchableOpacity>
          ))
        )}
      </Card>
    </ScrollView>
  );
}
