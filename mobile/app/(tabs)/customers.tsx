import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCustomers } from "../../lib/queries";
import { C, fmtVi } from "../../lib/theme";
import { Screen, SearchBar, Card, EmptyState, ErrorState, Loading } from "../../components/ui";

const TYPE: Record<string, { label: string; cls: string }> = {
  retail: { label: "lẻ", cls: "bg-surface2 text-muted" },
  wholesale: { label: "sỉ", cls: "bg-info-soft text-info" },
  contractor: { label: "thầu", cls: "bg-warning-soft text-warning" },
  agent: { label: "đại lý", cls: "bg-primary-soft text-primary" },
};

export default function Customers() {
  const [q, setQ] = useState("");
  const [debtors, setDebtors] = useState(false);
  const qy = useCustomers(q, debtors);
  const { isLoading, isRefetching, refetch, error, hasNextPage, fetchNextPage, isFetchingNextPage } = qy;
  const data = qy.data?.pages.flat() ?? [];

  return (
    <Screen>
      <SearchBar value={q} onChangeText={setQ} placeholder="Tìm tên / SĐT…" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 10 }} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
        {([[false, "Tất cả"], [true, "Đang nợ"]] as [boolean, string][]).map(([v, label]) => (
          <TouchableOpacity key={label} className={`px-3 py-1.5 rounded-full ${debtors === v ? (v ? "bg-danger-soft" : "bg-primary-soft") : "bg-surface2"}`} onPress={() => setDebtors(v)}>
            <Text className={`text-[12.5px] font-semibold ${debtors === v ? (v ? "text-danger" : "text-primary") : "text-muted"}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? <Loading /> : error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState text="Không có khách hàng" icon="people-outline" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => {
            const tp = item.type ? TYPE[item.type] : null;
            const debt = item.current_debt;
            return (
              <Card className="flex-row items-center gap-3" onPress={() => router.push({ pathname: "/customer/[id]", params: { id: item.id } })}>
                <View className="w-10 h-10 rounded-full bg-primary-soft items-center justify-center">
                  <Text className="text-primary font-extrabold text-[13px]">{item.name.trim().slice(0, 2).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[14.5px] font-semibold text-text" numberOfLines={1}>{item.name}</Text>
                    {tp && <View className={`px-1.5 py-0.5 rounded-full ${tp.cls.split(" ")[0]}`}><Text className={`text-[10px] font-bold ${tp.cls.split(" ")[1]}`}>{tp.label}</Text></View>}
                  </View>
                  {debt > 0
                    ? <Text className="text-[12.5px] text-danger mt-0.5">Nợ {fmtVi(debt)}đ</Text>
                    : <Text className="text-[12.5px] text-success mt-0.5">Không nợ{item.phone ? ` · ${item.phone}` : ""}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.faint} />
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
