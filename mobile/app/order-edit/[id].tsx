import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOrder, useProductSearch, useUpdateOrder } from "../../lib/queries";
import { showToast } from "../../lib/toast";
import { C, fmtVi } from "../../lib/theme";
import { Loading, ErrorState, Stepper } from "../../components/ui";
import type { Product, UpdateOrderInput } from "../../lib/schemas";

type Line = { productId: string; productName: string; unitName: string; quantity: number; unitPrice: number };
const num = (s: string) => Number((s || "").replace(/[^0-9.]/g, "")) || 0;

export default function OrderEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: o, isLoading, error } = useOrder(id);
  const update = useUpdateOrder();

  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState("0");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const search = useProductSearch(q);

  useEffect(() => {
    if (o && !ready) {
      setLines(o.order_items.filter((it) => it.product_id).map((it) => ({ productId: it.product_id!, productName: it.product_name, unitName: it.unit_name, quantity: it.quantity, unitPrice: it.unit_price })));
      setDiscount(String(Math.round(o.discount ?? 0)));
      setNote(o.note ?? "");
      setReady(true);
    }
  }, [o, ready]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [lines]);
  const total = Math.max(0, subtotal - num(discount));

  if (isLoading) return <Loading />;
  if (error || !o) return <ErrorState message={error ? (error as Error).message : "Không tìm thấy đơn"} />;
  if (o.status !== "completed" && o.status !== "quote") {
    return <ErrorState message="Đơn này không thể sửa (đã hủy/trả hàng)." />;
  }

  const setLine = (id2: string, patch: Partial<Line>) => setLines((p) => p.map((l) => l.productId === id2 ? { ...l, ...patch } : l));
  const removeLine = (id2: string) => setLines((p) => p.filter((l) => l.productId !== id2));
  function addProduct(p: Product) {
    setQ("");
    setLines((prev) => prev.some((l) => l.productId === p.id) ? prev : [...prev, { productId: p.id, productName: p.name, unitName: p.base_unit, quantity: 1, unitPrice: p.retail_price }]);
  }

  async function submit() {
    if (lines.length === 0) { Alert.alert("Chưa có hàng", "Đơn phải có ít nhất 1 sản phẩm."); return; }
    const payload: UpdateOrderInput = {
      orderId: o!.id, note, discount: num(discount), shippingFee: Math.round(o!.shipping_fee ?? 0),
      items: lines.map((l) => ({ productId: l.productId, productName: l.productName, unitName: l.unitName, unitMultiplier: 1, quantity: l.quantity, unitPrice: l.unitPrice })),
    };
    const res = await update.mutateAsync(payload);
    if (res.ok) { showToast(`Đã cập nhật đơn ${o!.code}`); router.back(); }
    else Alert.alert("Sửa đơn thất bại", res.error);
  }

  const results = q.trim() ? (search.data ?? []) : [];

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: `Sửa đơn ${o.code}` }} />
      <View className="p-3 bg-surface border-b border-border z-10">
        <View className="flex-row items-center border border-border rounded-xl px-3">
          <Ionicons name="search" size={17} color={C.faint} />
          <TextInput className="flex-1 py-2.5 px-2 text-[15px] text-text" value={q} onChangeText={setQ} placeholder="Thêm sản phẩm vào đơn…" placeholderTextColor={C.faint} />
        </View>
        {results.length > 0 && (
          <View className="absolute top-[58px] left-3 right-3 bg-surface rounded-xl border border-border overflow-hidden z-20">
            {results.slice(0, 6).map((r) => (
              <TouchableOpacity key={r.id} className="flex-row justify-between items-center px-3 py-2.5 border-t border-surface2" onPress={() => addProduct(r)}>
                <Text className="flex-1 text-sm text-text mr-2" numberOfLines={1}>{r.name}</Text>
                <Ionicons name="add-circle" size={20} color={C.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={lines}
        keyExtractor={(l) => l.productId}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text className="text-center text-faint mt-8">Chưa có sản phẩm</Text>}
        renderItem={({ item }) => (
          <View className="bg-surface rounded-card p-3 border border-border gap-2">
            <View className="flex-row items-center">
              <Text className="flex-1 text-sm font-semibold text-text pr-2" numberOfLines={1}>{item.productName}</Text>
              <TouchableOpacity onPress={() => removeLine(item.productId)} hitSlop={8}><Ionicons name="trash-outline" size={18} color={C.danger} /></TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2.5">
              <Stepper value={item.quantity} onChange={(v) => setLine(item.productId, { quantity: v })} />
              <View className="flex-1">
                <Text className="text-[11px] text-faint mb-0.5">Đơn giá</Text>
                <TextInput className="border border-border rounded-md px-2 py-1.5 text-sm text-text" keyboardType="number-pad" value={String(Math.round(item.unitPrice))} onChangeText={(t) => setLine(item.productId, { unitPrice: num(t) })} />
              </View>
              <Text className="text-[13.5px] font-bold text-text pt-3">{fmtVi(item.quantity * item.unitPrice)}đ</Text>
            </View>
          </View>
        )}
      />

      <View className="bg-surface border-t border-border p-3.5 gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-muted">Tạm tính</Text>
          <Text className="text-sm font-semibold text-text">{fmtVi(subtotal)}đ</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-muted">Giảm giá</Text>
          <TextInput className="text-sm font-semibold text-text text-right min-w-[110px] border-b border-border py-0.5" keyboardType="number-pad" value={discount} onChangeText={setDiscount} placeholder="0" placeholderTextColor={C.faint} />
        </View>
        <View className="flex-row justify-between items-center border-t border-surface2 pt-2">
          <Text className="text-[16px] font-extrabold text-text">Tổng</Text>
          <Text className="text-[18px] font-extrabold text-primary">{fmtVi(total)}đ</Text>
        </View>
        <TouchableOpacity className={`bg-primary rounded-xl py-3.5 items-center mt-1 ${update.isPending ? "opacity-60" : ""}`} onPress={submit} disabled={update.isPending}>
          {update.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Lưu thay đổi</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
