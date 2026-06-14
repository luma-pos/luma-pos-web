import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCashbook } from "../lib/queries";
import { C, fmtVi } from "../lib/theme";
import { Card, EmptyState, ErrorState, Loading } from "../components/ui";

const CAT: Record<string, string> = {
  sale: "Bán hàng", debt_collect: "Thu nợ", supplier_payment: "Trả NCC",
  refund: "Hoàn tiền", expense: "Chi phí", other: "Khác",
};

export default function Cashbook() {
  const { data, isLoading, isRefetching, refetch, error } = useCashbook();

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState message={error ? (error as Error).message : "Lỗi tải dữ liệu"} onRetry={() => refetch()} />;

  return (
    <FlatList
      className="bg-bg"
      data={data.rows}
      keyExtractor={(it) => it.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      ListHeaderComponent={
        <View className="flex-row gap-3 mb-1">
          <Card className="flex-1 gap-0.5">
            <Ionicons name="arrow-down-circle" size={20} color={C.success} />
            <Text className="text-[12.5px] text-muted mt-0.5">Thu</Text>
            <Text className="text-[17px] font-extrabold text-success">{fmtVi(data.totalIn)}đ</Text>
          </Card>
          <Card className="flex-1 gap-0.5">
            <Ionicons name="arrow-up-circle" size={20} color={C.danger} />
            <Text className="text-[12.5px] text-muted mt-0.5">Chi</Text>
            <Text className="text-[17px] font-extrabold text-danger">{fmtVi(data.totalOut)}đ</Text>
          </Card>
        </View>
      }
      ListEmptyComponent={<EmptyState text="Chưa có giao dịch" icon="wallet-outline" />}
      renderItem={({ item }) => {
        const isIn = item.type === "in";
        return (
          <Card className="flex-row items-center gap-3">
            <View className={`w-9 h-9 rounded-lg items-center justify-center ${isIn ? "bg-success-soft" : "bg-danger-soft"}`}>
              <Ionicons name={isIn ? "arrow-down" : "arrow-up"} size={18} color={isIn ? C.success : C.danger} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text">{CAT[item.category] ?? item.category}</Text>
              <Text className="text-xs text-faint mt-0.5">{item.code} · {new Date(item.created_at).toLocaleDateString("vi-VN")}</Text>
              {item.note ? <Text className="text-xs text-muted mt-px" numberOfLines={1}>{item.note}</Text> : null}
            </View>
            <Text className={`text-[14.5px] font-extrabold ${isIn ? "text-success" : "text-danger"}`}>{isIn ? "+" : "−"}{fmtVi(item.amount)}đ</Text>
          </Card>
        );
      }}
    />
  );
}
