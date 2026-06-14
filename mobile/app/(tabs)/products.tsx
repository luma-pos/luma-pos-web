import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts, useCategories } from "../../lib/queries";
import { firstImage } from "../../lib/schemas";
import { C, fmtVi } from "../../lib/theme";
import { Screen, SearchBar, Card, Thumb, EmptyState, ErrorState, Loading } from "../../components/ui";

function stockBadge(stock: number, min: number) {
  if (stock <= 0) return { cls: "bg-danger-soft text-danger" };
  if (min > 0 && stock <= min) return { cls: "bg-warning-soft text-warning" };
  return { cls: "bg-success-soft text-success" };
}

export default function Products() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const qy = useProducts(q, cat);
  const { isLoading, isRefetching, refetch, error, hasNextPage, fetchNextPage, isFetchingNextPage } = qy;
  const cats = useCategories();
  const data = qy.data?.pages.flat() ?? [];

  const chips: { id: string | null; label: string }[] = [
    { id: null, label: "Tất cả" },
    ...(cats.data ?? []).map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <Screen>
      <SearchBar value={q} onChangeText={setQ} placeholder="Tìm tên / mã SKU…" />

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 10 }} keyboardShouldPersistTaps="handled">
          {chips.map((c) => {
            const on = cat === c.id;
            return (
              <TouchableOpacity key={c.id ?? "all"} className={`px-3 py-1.5 rounded-full ${on ? "bg-primary-soft" : "bg-surface2"}`} onPress={() => setCat(c.id)}>
                <Text className={`text-[12.5px] font-semibold ${on ? "text-primary" : "text-muted"}`}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState text="Không có sản phẩm" icon="pricetags-outline" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 90 }}
          renderItem={({ item }) => {
            const b = stockBadge(item.total_stock, item.min_stock);
            return (
              <Card className="flex-row items-center gap-3" onPress={() => router.push({ pathname: "/product-form", params: { id: item.id } })}>
                <Thumb uri={firstImage(item)} />
                <View className="flex-1">
                  <Text className="text-[14.5px] font-semibold text-text" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-xs text-faint mt-0.5">{item.sku} · {item.base_unit}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-[13.5px] text-primary font-bold">{fmtVi(item.retail_price)}đ</Text>
                    <View className={`px-2 py-0.5 rounded-full ${b.cls.split(" ")[0]}`}>
                      <Text className={`text-[11px] font-bold ${b.cls.split(" ")[1]}`}>{fmtVi(item.total_stock)} {item.base_unit}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.faint} />
              </Card>
            );
          }}
        />
      )}

      {/* FAB thêm sản phẩm */}
      <TouchableOpacity
        className="absolute right-5 bottom-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ shadowColor: "#1d4ed8", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
        onPress={() => router.push("/product-form")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </Screen>
  );
}
