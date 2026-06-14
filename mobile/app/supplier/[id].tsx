import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSupplier } from "../../lib/queries";
import { fmtVi } from "../../lib/theme";
import { Card, ErrorState, Loading } from "../../components/ui";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between px-3 py-3 border-t border-surface2">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm text-text font-semibold flex-shrink text-right ml-3">{value}</Text>
    </View>
  );
}

export default function SupplierDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, isLoading, error } = useSupplier(id);

  if (isLoading) return <Loading />;
  if (error || !c) return <ErrorState message={error ? (error as Error).message : "Không tìm thấy NCC"} />;

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 14, gap: 12 }}>
      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-primary-soft items-center justify-center">
            <Text className="text-primary font-extrabold text-base">{c.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-extrabold text-text">{c.name}</Text>
            {c.code ? <Text className="text-[13px] text-muted mt-0.5">{c.code}</Text> : null}
          </View>
        </View>
        <View className="bg-surface2 rounded-lg p-3">
          <Text className="text-[12.5px] text-muted">Công nợ phải trả</Text>
          <Text className={`text-xl font-extrabold mt-0.5 ${c.current_debt > 0 ? "text-danger" : "text-success"}`}>{fmtVi(c.current_debt)}đ</Text>
        </View>
      </Card>

      <Card className="px-1 py-0">
        <Row label="Điện thoại" value={c.phone || "—"} />
        <Row label="Địa chỉ" value={c.address || "—"} />
        <Row label="Mã số thuế" value={c.tax_code || "—"} />
      </Card>
    </ScrollView>
  );
}
