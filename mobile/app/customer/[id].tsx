import { useLocalSearchParams, router } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { useCustomerDetail } from "../../lib/queries";
import { fmtVi } from "../../lib/theme";
import { Card, ErrorState, Loading } from "../../components/ui";

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useCustomerDetail(id);

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={error ? (error as Error).message : "Không tìm thấy khách"} />;

  const { customer: c, orders } = data;

  return (
    <FlatList
      className="bg-bg"
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 14, gap: 10 }}
      ListHeaderComponent={
        <View className="gap-3 mb-1">
          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-primary-soft items-center justify-center">
                <Text className="text-primary font-extrabold text-base">{c.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-extrabold text-text">{c.name}</Text>
                <Text className="text-[13px] text-muted mt-0.5">{c.phone || "—"}</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface2 rounded-lg p-3">
                <Text className="text-xs text-muted">Công nợ</Text>
                <Text className={`text-base font-extrabold mt-0.5 ${c.current_debt > 0 ? "text-warning" : "text-success"}`}>{fmtVi(c.current_debt)}đ</Text>
              </View>
              <View className="flex-1 bg-surface2 rounded-lg p-3">
                <Text className="text-xs text-muted">Tổng mua</Text>
                <Text className="text-base font-extrabold text-text mt-0.5">{fmtVi(c.total_spent ?? 0)}đ</Text>
              </View>
            </View>
          </Card>
          <Text className="text-sm font-extrabold text-text">Lịch sử đơn ({orders.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text className="text-center text-faint mt-5">Chưa có đơn nào</Text>}
      renderItem={({ item }) => (
        <Card className="flex-row items-center" onPress={() => router.push({ pathname: "/order/[id]", params: { id: item.id } })}>
          <View className="flex-1">
            <Text className="text-sm font-bold text-text">{item.code}</Text>
            <Text className="text-xs text-faint mt-0.5">{new Date(item.created_at).toLocaleDateString("vi-VN")}</Text>
          </View>
          <Text className="text-[14.5px] font-extrabold text-text">{fmtVi(item.total)}đ</Text>
        </Card>
      )}
    />
  );
}
