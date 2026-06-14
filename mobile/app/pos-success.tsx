import { router, useLocalSearchParams, Stack } from "expo-router";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components/ui";
import { C } from "../lib/theme";
import { useOrder } from "../lib/queries";
import { usePrintTemplate, printDocument, orderDoc } from "../lib/print";

export default function PosSuccess() {
  const { code, id, sub } = useLocalSearchParams<{ code?: string; id?: string; sub?: string }>();
  const { data: order } = useOrder(id);
  const isQuote = order?.status === "quote";
  const tmpl = usePrintTemplate(isQuote ? "quote" : "order");

  async function printK80() {
    if (!order || !tmpl.data) { Alert.alert("Chưa sẵn sàng", "Đơn đang tải, thử lại sau giây lát."); return; }
    try { await printDocument("k80", tmpl.data, orderDoc(order, tmpl.data)); }
    catch (e) { Alert.alert("In thất bại", (e as Error).message); }
  }

  const ACTIONS: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; onPress: () => void }[] = [
    { icon: "print-outline", title: isQuote ? "In báo giá K80" : "In hóa đơn K80", sub: "Chọn máy in / lưu PDF từ hộp thoại in", onPress: printK80 },
    { icon: "chatbubble-ellipses-outline", title: "Gửi hóa đơn qua Zalo", sub: "Gửi cho khách", onPress: () => Alert.alert("Gửi hóa đơn qua Zalo", "Tính năng này sẽ bật khi build app thật + cấu hình thiết bị.") },
    { icon: "car-outline", title: "Tạo phiếu giao hàng", sub: "Điều xe giao", onPress: () => Alert.alert("Tạo phiếu giao hàng", "Tính năng này sẽ bật khi build app thật + cấu hình thiết bị.") },
  ];

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View className="items-center mb-7">
          <View className="w-20 h-20 rounded-full bg-success-soft items-center justify-center mb-4">
            <Ionicons name="checkmark-circle" size={64} color={C.success} />
          </View>
          <Text className="text-[22px] font-extrabold text-text">Đã tạo đơn {code}</Text>
          {sub ? <Text className="text-[13.5px] text-muted text-center mt-2 px-4">{sub}</Text> : null}
          <Text className="text-[13.5px] text-muted text-center mt-0.5">Tồn kho đã trừ realtime trên mọi thiết bị</Text>
        </View>

        <Card className="py-0">
          {ACTIONS.map((a, i) => (
            <TouchableOpacity key={a.title} className={`flex-row items-center gap-3 py-3.5 ${i > 0 ? "border-t border-surface2" : ""}`} onPress={a.onPress}>
              <Ionicons name={a.icon} size={22} color={C.muted} />
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-text">{a.title}</Text>
                <Text className="text-xs text-faint mt-0.5">{a.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.faint} />
            </TouchableOpacity>
          ))}
        </Card>

        <TouchableOpacity className="bg-primary rounded-xl py-3.5 items-center mt-6" onPress={() => router.replace("/pos")}>
          <Text className="text-white text-base font-bold">Tạo đơn mới</Text>
        </TouchableOpacity>
        {id ? (
          <TouchableOpacity className="py-3 items-center" onPress={() => router.replace({ pathname: "/order/[id]", params: { id } })}>
            <Text className="text-primary font-bold text-[15px]">Xem chi tiết đơn →</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}
