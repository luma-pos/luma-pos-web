import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOrder, useCreateReturn } from "../../lib/queries";
import { showToast } from "../../lib/toast";
import { C, fmtVi } from "../../lib/theme";
import { Card, ErrorState, Loading, Field, Segmented } from "../../components/ui";
import { usePrintTemplate, printDocument, type DocData } from "../../lib/print";
import type { OrderDetail } from "../../lib/schemas";

type Method = "cash" | "bank_transfer" | "debt_deduct";
const METHODS: [Method, string][] = [["cash", "Tiền mặt"], ["bank_transfer", "CK"], ["debt_deduct", "Trừ nợ"]];
const METHOD_LABEL: Record<Method, string> = { cash: "Tiền mặt", bank_transfer: "Chuyển khoản", debt_deduct: "Trừ vào công nợ" };
const num = (s: string) => Number((s || "").replace(/[^0-9.]/g, "")) || 0;

function returnDoc(o: OrderDetail, code: string, qty: Record<string, number>, reason: string, method: Method): DocData {
  const items = o.order_items.filter((it) => (qty[it.id] ?? 0) > 0).map((it) => ({
    id: it.id, name: it.product_name, unitName: it.unit_name,
    quantity: qty[it.id], unitPrice: it.unit_price, total: qty[it.id] * it.unit_price,
  }));
  const totalRefund = items.reduce((s, i) => s + i.total, 0);
  return {
    title: "PHIẾU TRẢ HÀNG",
    code: `${code} ← ${o.code}`,
    date: new Date(),
    partyLabel: "Khách hàng",
    partyName: o.customers?.name ?? "Khách lẻ",
    partyPhone: o.customers?.phone,
    sellerLabel: "Người lập",
    items,
    totals: [],
    grandTotalLabel: "TỔNG HOÀN TRẢ",
    grandTotal: totalRefund,
    afterTotals: [],
    signatures: ["Người mua", "Người bán", "Người nhận"],
    note: [reason ? `Lý do: ${reason}` : null, `Hoàn qua: ${METHOD_LABEL[method]}`].filter(Boolean).join(" · "),
    cols: { product: "Sản phẩm", unit: "ĐVT", qty: "SL trả", unitPrice: "Đơn giá", lineTotal: "Hoàn" },
  };
}

export default function ReturnForm() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { data: o, isLoading, error } = useOrder(orderId);
  const create = useCreateReturn();
  const tmpl = usePrintTemplate("return");

  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("Khách trả hàng");
  const [method, setMethod] = useState<Method>("cash");

  if (isLoading) return <Loading />;
  if (error || !o) return <ErrorState message={error ? (error as Error).message : "Không tìm thấy đơn"} />;

  const totalRefund = o.order_items.reduce((sum, it) => sum + (qty[it.id] ?? 0) * it.unit_price, 0);
  const hasItems = o.order_items.some((it) => (qty[it.id] ?? 0) > 0);

  function setItemQty(id: string, max: number, v: number) { setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.min(v, max)) })); }

  async function submit() {
    if (!hasItems) { Alert.alert("Chưa chọn", "Nhập số lượng cần trả."); return; }
    if (!reason.trim()) { Alert.alert("Thiếu lý do", "Nhập lý do trả hàng."); return; }
    const items = o!.order_items.filter((it) => (qty[it.id] ?? 0) > 0).map((it) => ({ orderItemId: it.id, quantity: qty[it.id], restock: true }));
    const res = await create.mutateAsync({ orderId: o!.id, reason: reason.trim(), refundMethod: method, items });
    if (res.ok) {
      const code = res.data.code;
      showToast(`Đã trả hàng · ${code}`);
      const t = tmpl.data;
      Alert.alert("Đã tạo phiếu trả hàng", `Mã phiếu: ${code}`, [
        { text: "Xong", style: "cancel", onPress: () => router.back() },
        { text: "In phiếu trả", onPress: async () => {
            if (!t) { router.back(); return; }
            try { await printDocument(t.paperDefault, t, returnDoc(o!, code, qty, reason.trim(), method)); }
            catch (e) { Alert.alert("In thất bại", (e as Error).message); }
            router.back();
          } },
      ]);
    } else Alert.alert("Trả hàng thất bại", res.error);
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        <Text className="text-[15px] font-bold text-text">Trả hàng cho đơn {o.code}</Text>

        <Card>
          {o.order_items.map((it, i) => {
            const cur = qty[it.id] ?? 0;
            return (
              <View key={it.id} className={`flex-row items-center py-2.5 gap-2.5 ${i > 0 ? "border-t border-surface2" : ""}`}>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text" numberOfLines={2}>{it.product_name}</Text>
                  <Text className="text-xs text-muted mt-0.5">Đã mua {fmtVi(it.quantity)} {it.unit_name} · {fmtVi(it.unit_price)}đ</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <TouchableOpacity className="w-7 h-7 rounded-md border border-[#bfdbfe] bg-primary-soft items-center justify-center" onPress={() => setItemQty(it.id, it.quantity, cur - 1)}><Ionicons name="remove" size={16} color={C.primary} /></TouchableOpacity>
                  <TextInput className="min-w-[40px] text-center text-[15px] font-bold text-text border border-border rounded-md py-1" keyboardType="number-pad" value={String(cur)} onChangeText={(t) => setItemQty(it.id, it.quantity, num(t))} />
                  <TouchableOpacity className="w-7 h-7 rounded-md border border-[#bfdbfe] bg-primary-soft items-center justify-center" onPress={() => setItemQty(it.id, it.quantity, cur + 1)}><Ionicons name="add" size={16} color={C.primary} /></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Card>

        <Card>
          <Field label="Lý do" value={reason} onChangeText={setReason} placeholder="Lý do trả hàng" />
          <Text className="text-[12.5px] font-semibold text-muted mb-1.5">Hình thức hoàn</Text>
          <Segmented value={method} options={METHODS} onChange={setMethod} />
        </Card>
      </ScrollView>

      <View className="bg-surface border-t border-border p-3.5 gap-2.5">
        <View className="flex-row justify-between items-center">
          <Text className="text-[15px] text-muted">Hoàn trả</Text>
          <Text className="text-[20px] font-extrabold text-danger">{fmtVi(totalRefund)}đ</Text>
        </View>
        <TouchableOpacity className={`bg-danger rounded-xl py-3.5 items-center ${create.isPending || !hasItems ? "opacity-50" : ""}`} onPress={submit} disabled={create.isPending || !hasItems}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Xác nhận trả hàng</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
