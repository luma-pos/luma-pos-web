import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useSuppliers } from "../lib/queries";
import { C, fmtVi } from "../lib/theme";
import { Screen, SearchBar, Card, Badge, EmptyState, ErrorState, Loading } from "../components/ui";

export default function Suppliers() {
  const [q, setQ] = useState("");
  const qy = useSuppliers(q);
  const { isLoading, isRefetching, refetch, error, hasNextPage, fetchNextPage, isFetchingNextPage } = qy;
  const data = qy.data?.pages.flat() ?? [];

  return (
    <Screen>
      <SearchBar value={q} onChangeText={setQ} placeholder="Tìm theo tên / SĐT…" />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState text="Không có nhà cung cấp" icon="business-outline" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => (
            <Card className="flex-row items-center gap-3" onPress={() => router.push({ pathname: "/supplier/[id]", params: { id: item.id } })}>
              <View className="w-10 h-10 rounded-full bg-primary-soft items-center justify-center">
                <Text className="text-primary font-extrabold text-[13px]">{item.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14.5px] font-semibold text-text" numberOfLines={1}>{item.name}</Text>
                <Text className="text-[12.5px] text-muted mt-0.5">{item.phone || "—"}</Text>
              </View>
              {item.current_debt > 0 ? (
                <View className="items-end">
                  <Text className="text-sm font-extrabold text-danger">{fmtVi(item.current_debt)}đ</Text>
                  <Text className="text-[11px] text-faint mt-px">phải trả</Text>
                </View>
              ) : (
                <Badge label="Không nợ" kind="success" />
              )}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
