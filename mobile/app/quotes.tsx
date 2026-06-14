import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuotes } from "../lib/queries";
import { C, fmtVi } from "../lib/theme";
import { Card, Badge, EmptyState, ErrorState, Loading } from "../components/ui";

export default function Quotes() {
  const qy = useQuotes();
  const { isLoading, isRefetching, refetch, error, hasNextPage, fetchNextPage, isFetchingNextPage } = qy;
  const data = qy.data?.pages.flat() ?? [];

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <FlatList
      className="bg-bg"
      data={data}
      keyExtractor={(it) => it.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListEmptyComponent={<EmptyState text="Chưa có báo giá" icon="document-text-outline" />}
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      renderItem={({ item }) => (
        <Card className="gap-1" onPress={() => router.push({ pathname: "/order/[id]", params: { id: item.id } })}>
          <View className="flex-row justify-between items-center">
            <Text className="text-[14.5px] font-extrabold text-warning">{item.code}</Text>
            <Badge label="Báo giá" kind="warning" />
          </View>
          <Text className="text-[13px] text-text font-semibold mt-0.5">{item.customers?.name ?? "Khách lẻ"}</Text>
          <View className="flex-row justify-between items-center mt-0.5">
            <Text className="text-xs text-faint">{new Date(item.created_at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
            <Text className="text-[14px] font-extrabold text-text">{fmtVi(item.total)}đ</Text>
          </View>
        </Card>
      )}
    />
  );
}
