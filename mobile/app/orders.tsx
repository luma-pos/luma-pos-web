import { useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "../lib/queries";
import { C, fmtVi } from "../lib/theme";
import { Card, Badge, EmptyState, ErrorState, Loading } from "../components/ui";

function payBadge(status: string) {
  if (status === "paid") return { kind: "success" as const, label: "Đã thanh toán" };
  if (status === "deposit") return { kind: "warning" as const, label: "Đặt cọc" };
  return { kind: "danger" as const, label: "Chưa trả" };
}

export default function Orders() {
  const [unpaid, setUnpaid] = useState(false);
  const qy = useOrders(unpaid);
  const { isLoading, isRefetching, refetch, error, hasNextPage, fetchNextPage, isFetchingNextPage } = qy;
  const data = qy.data?.pages.flat() ?? [];

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push("/orders-merge")} hitSlop={8} className="flex-row items-center gap-1">
            <Ionicons name="git-merge-outline" size={20} color={C.primary} />
            <Text className="text-primary font-semibold text-[14px]">Gộp</Text>
          </TouchableOpacity>
        ),
      }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 10 }} style={{ flexGrow: 0 }}>
        {([[false, "Tất cả"], [true, "Còn nợ"]] as [boolean, string][]).map(([v, label]) => (
          <TouchableOpacity key={label} className={`px-3 py-1.5 rounded-full ${unpaid === v ? (v ? "bg-danger-soft" : "bg-primary-soft") : "bg-surface2"}`} onPress={() => setUnpaid(v)}>
            <Text className={`text-[12.5px] font-semibold ${unpaid === v ? (v ? "text-danger" : "text-primary") : "text-muted"}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? <Loading /> : error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState text="Chưa có đơn hàng" icon="receipt-outline" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => {
            const b = payBadge(item.payment_status);
            const isQuote = item.status === "quote";
            const remaining = item.total - (item.amount_paid ?? 0);
            return (
              <Card className="gap-1" onPress={() => router.push({ pathname: "/order/[id]", params: { id: item.id } })}>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[14.5px] font-extrabold text-primary">{item.code}</Text>
                  <View className="flex-row gap-1.5">
                    {isQuote && <Badge label="Báo giá" kind="info" />}
                    <Badge label={b.label} kind={b.kind} />
                  </View>
                </View>
                <Text className="text-[13px] text-text font-semibold mt-0.5">{item.customers?.name ?? "Khách lẻ"}</Text>
                <View className="flex-row justify-between items-center mt-0.5">
                  <Text className="text-xs text-faint">{new Date(item.created_at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[14px] font-extrabold text-text">{fmtVi(item.total)}đ</Text>
                    {remaining > 0 && <Text className="text-[12.5px] text-danger font-semibold">nợ {fmtVi(remaining)}</Text>}
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}
