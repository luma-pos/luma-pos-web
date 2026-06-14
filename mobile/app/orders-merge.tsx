import { useMemo, useState } from "react";
import { router, Stack } from "expo-router";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOrders, useMergeOrders } from "../lib/queries";
import { showToast } from "../lib/toast";
import { C, fmtVi } from "../lib/theme";
import { Card, EmptyState, ErrorState, Loading } from "../components/ui";

export default function OrdersMerge() {
  const qy = useOrders();
  const { isLoading, isRefetching, refetch, error, hasNextPage, fetchNextPage, isFetchingNextPage } = qy;
  const merge = useMergeOrders();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Chỉ gộp được đơn đã hoàn tất (mirror server: ONLY_COMPLETED)
  const orders = (qy.data?.pages.flat() ?? []).filter((o) => o.status === "completed");
  const lockedCustomer = useMemo(() => {
    if (selected.size === 0) return null;
    const first = orders.find((o) => selected.has(o.id));
    return first?.customer_id ?? null;
  }, [selected, orders]);

  const selTotal = orders.filter((o) => selected.has(o.id)).reduce((s, o) => s + o.total, 0);

  function toggle(id: string, customerId: string | null | undefined) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (lockedCustomer && customerId !== lockedCustomer) { Alert.alert("Khác khách hàng", "Chỉ gộp được các đơn của cùng một khách."); return prev; }
        if (!customerId) { Alert.alert("Đơn khách lẻ", "Chỉ gộp được đơn có gắn khách hàng."); return prev; }
        next.add(id);
      }
      return next;
    });
  }

  async function doMerge() {
    if (selected.size < 2) { Alert.alert("Chọn ít nhất 2 đơn", "Tích chọn từ 2 đơn cùng khách để gộp."); return; }
    const res = await merge.mutateAsync([...selected]);
    if (res.ok) { showToast(`Đã gộp · ${res.data.code}`); router.back(); }
    else Alert.alert("Gộp đơn thất bại", res.error);
  }

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ title: "Gộp đơn" }} />
      <FlatList
        data={orders}
        keyExtractor={(it) => it.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={<Text className="text-[12.5px] text-muted px-1 pb-1">Chọn từ 2 đơn đã hoàn tất của cùng một khách hàng để gộp.</Text>}
        ListEmptyComponent={<EmptyState text="Không có đơn hoàn tất để gộp" icon="git-merge-outline" />}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => {
          const on = selected.has(item.id);
          const disabled = !!lockedCustomer && !on && item.customer_id !== lockedCustomer;
          return (
            <Card className={`flex-row items-center gap-3 ${disabled ? "opacity-40" : ""}`} onPress={() => toggle(item.id, item.customer_id)}>
              <Ionicons name={on ? "checkbox" : "square-outline"} size={22} color={on ? C.primary : C.faint} />
              <View className="flex-1">
                <Text className="text-[14.5px] font-extrabold text-text">{item.code}</Text>
                <Text className="text-[12.5px] text-muted mt-0.5">{item.customers?.name ?? "Khách lẻ"} · {new Date(item.created_at).toLocaleDateString("vi-VN")}</Text>
              </View>
              <Text className="text-[14px] font-extrabold text-text">{fmtVi(item.total)}đ</Text>
            </Card>
          );
        }}
      />
      {selected.size > 0 && (
        <View className="p-3.5 bg-surface border-t border-border">
          <TouchableOpacity className={`bg-primary rounded-xl py-3.5 items-center ${merge.isPending || selected.size < 2 ? "opacity-60" : ""}`} onPress={doMerge} disabled={merge.isPending || selected.size < 2}>
            {merge.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Gộp {selected.size} đơn · {fmtVi(selTotal)}đ</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
