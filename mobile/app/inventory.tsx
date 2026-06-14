import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useInventory, useInventoryStats } from "../lib/queries";
import { firstImage } from "../lib/schemas";
import { C, fmtVi } from "../lib/theme";
import { Screen, SearchBar, Card, Badge, Thumb, EmptyState, ErrorState, Loading } from "../components/ui";

function badgeKind(stock: number, min: number) {
  if (stock <= 0) return { kind: "danger" as const, label: "Hết hàng" };
  if (min > 0 && stock <= min) return { kind: "warning" as const, label: "Sắp hết" };
  return { kind: "success" as const, label: "Đủ" };
}

export default function Inventory() {
  const [q, setQ] = useState("");
  const inv = useInventory(q);
  const stats = useInventoryStats();
  const data = inv.data?.pages.flat() ?? [];

  return (
    <Screen>
      <View className="flex-row gap-3 p-3 pb-0">
        <Card className="flex-1">
          <Text className="text-[12.5px] text-muted">Tổng sản phẩm</Text>
          <Text className="text-xl font-extrabold text-text mt-0.5">{stats.isLoading ? "…" : fmtVi(stats.data?.total ?? 0)}</Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-[12.5px] text-muted">Hết hàng</Text>
          <Text className="text-xl font-extrabold text-danger mt-0.5">{stats.isLoading ? "…" : `${fmtVi(stats.data?.outOfStock ?? 0)} SP`}</Text>
        </Card>
      </View>

      <SearchBar value={q} onChangeText={setQ} placeholder="Tìm theo tên sản phẩm…" />

      {inv.isLoading ? (
        <Loading />
      ) : inv.error ? (
        <ErrorState message={(inv.error as Error).message} onRetry={() => inv.refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={inv.isRefetching} onRefresh={() => { inv.refetch(); stats.refetch(); }} />}
          ListEmptyComponent={<EmptyState text="Không có sản phẩm" icon="cube-outline" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (inv.hasNextPage && !inv.isFetchingNextPage) inv.fetchNextPage(); }}
          ListFooterComponent={inv.isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => {
            const b = badgeKind(item.total_stock, item.min_stock);
            return (
              <Card className="flex-row items-center gap-3" onPress={() => router.push({ pathname: "/product-form", params: { id: item.id } })}>
                <Thumb uri={firstImage(item)} />
                <View className="flex-1">
                  <Text className="text-[14.5px] font-semibold text-text" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-xs text-muted mt-0.5">{item.sku} · giá vốn {fmtVi(item.cost_price)}đ</Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-[14.5px] font-bold text-text">{fmtVi(item.total_stock)} {item.base_unit}</Text>
                  <Badge label={b.label} kind={b.kind} />
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
