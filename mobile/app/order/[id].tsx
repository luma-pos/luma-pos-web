import { useState } from "react";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOrder, useAddPayment, useConvertQuote } from "../../lib/queries";
import { showToast } from "../../lib/toast";
import { C, fmtVi } from "../../lib/theme";
import { Card, Badge, ErrorState, Loading, Select } from "../../components/ui";
import { usePrintTemplate, printDocument, orderDoc, PAPER_OPTIONS, type PaperSize } from "../../lib/print";

type PayMethod = "cash" | "bank_transfer";
const num = (s: string) => Number((s || "").replace(/[^0-9.]/g, "")) || 0;

function payBadge(status: string) {
  if (status === "paid") return { kind: "success" as const, label: "Đã thanh toán" };
  if (status === "deposit") return { kind: "warning" as const, label: "Đặt cọc" };
  return { kind: "danger" as const, label: "Chưa trả" };
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className={`text-sm text-muted ${bold ? "font-extrabold text-text" : ""}`}>{label}</Text>
      <Text className={`text-sm font-semibold ${bold ? "font-extrabold text-base text-text" : "text-text"} ${accent ? "text-primary" : ""}`}>{value}</Text>
    </View>
  );
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: o, isLoading, error } = useOrder(id);
  const addPayment = useAddPayment();
  const convert = useConvertQuote();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [sizeOpen, setSizeOpen] = useState(false);
  const isQuote = o?.status === "quote";
  const tmpl = usePrintTemplate(isQuote ? "quote" : "order");

  if (isLoading) return <Loading />;
  if (error || !o) return <ErrorState message={error ? (error as Error).message : "Không tìm thấy đơn"} />;

  async function doPrint(size: PaperSize) {
    setSizeOpen(false);
    const t = tmpl.data;
    if (!t) { Alert.alert("Đang tải mẫu in", "Thử lại sau giây lát."); return; }
    try { await printDocument(size, t, orderDoc(o!, t)); }
    catch (e) { Alert.alert("In thất bại", (e as Error).message); }
  }

  function confirmConvert() {
    Alert.alert("Chốt báo giá thành đơn", "Sẽ trừ kho và ghi công nợ. Tiếp tục?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Chốt đơn", onPress: async () => {
          const res = await convert.mutateAsync(o!.id);
          if (res.ok) { showToast(`Đã chốt đơn · ${res.data.code}`); router.back(); }
          else Alert.alert("Chốt đơn thất bại", res.error);
        } },
    ]);
  }

  const b = payBadge(o.payment_status);
  const paid = o.amount_paid ?? 0;
  const remaining = o.total - paid;
  const canCollect = remaining > 0 && (o.status === "completed" || o.status === "returned");
  const canReturn = o.status === "completed" || o.status === "returned";

  function openPay() { setAmount(String(Math.round(remaining))); setPayMethod("cash"); setPayOpen(true); }
  async function submitPay() {
    const amt = num(amount);
    if (!amt || amt <= 0) { Alert.alert("Số tiền không hợp lệ", "Nhập số tiền cần thu."); return; }
    const res = await addPayment.mutateAsync({ orderId: o!.id, amount: amt, method: payMethod });
    if (res.ok) { setPayOpen(false); showToast(`Đã thu ${fmtVi(amt)}đ`); }
    else Alert.alert("Thu tiền thất bại", res.error);
  }

  const editable = o.status === "completed" || o.status === "quote";

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{
        headerRight: editable ? () => (
          <TouchableOpacity onPress={() => router.push({ pathname: "/order-edit/[id]", params: { id: o.id } })} hitSlop={8}>
            <Ionicons name="create-outline" size={22} color={C.primary} />
          </TouchableOpacity>
        ) : undefined,
      }} />
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        <Card>
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[17px] font-extrabold text-text">{o.code}</Text>
            <Badge label={b.label} kind={b.kind} />
          </View>
          <Text className="text-[13px] text-muted">{o.customers?.name ?? "Khách lẻ"}{o.customers?.phone ? ` · ${o.customers.phone}` : ""}</Text>
          <Text className="text-[13px] text-muted">{new Date(o.created_at).toLocaleString("vi-VN")}</Text>
          {o.note ? <Text className="text-[13px] text-muted mt-1.5 italic">Ghi chú: {o.note}</Text> : null}
        </Card>

        <Card>
          <Text className="text-[13px] font-bold text-muted mb-1">Sản phẩm ({o.order_items.length})</Text>
          {o.order_items.map((it) => (
            <View key={it.id} className="flex-row items-start py-2.5 border-t border-surface2 gap-2.5">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text" numberOfLines={2}>{it.product_name}</Text>
                <Text className="text-xs text-muted mt-0.5">{fmtVi(it.unit_price)}đ × {fmtVi(it.quantity)} {it.unit_name}</Text>
              </View>
              <Text className="text-sm font-bold text-text">{fmtVi(it.total)}đ</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Row label="Tạm tính" value={`${fmtVi(o.subtotal ?? o.total)}đ`} />
          {!!o.discount && o.discount > 0 && <Row label="Giảm giá" value={`-${fmtVi(o.discount)}đ`} />}
          {!!o.shipping_fee && o.shipping_fee > 0 && <Row label="Phí vận chuyển" value={`${fmtVi(o.shipping_fee)}đ`} />}
          <Row label="Tổng cộng" value={`${fmtVi(o.total)}đ`} bold accent />
          <Row label="Đã thanh toán" value={`${fmtVi(paid)}đ`} />
          {remaining > 0 && <Row label="Còn lại" value={`${fmtVi(remaining)}đ`} bold />}
        </Card>
      </ScrollView>

      <View className="p-3.5 bg-surface border-t border-border flex-row gap-2.5">
        <TouchableOpacity className="border border-border rounded-xl py-3.5 px-4 items-center justify-center flex-row gap-1.5" onPress={() => setSizeOpen(true)}>
          <Ionicons name="print-outline" size={18} color={C.text} />
          <Text className="text-text text-[15.5px] font-bold">In</Text>
        </TouchableOpacity>
        {isQuote && (
          <TouchableOpacity className={`flex-1 bg-primary rounded-xl py-3.5 items-center ${convert.isPending ? "opacity-60" : ""}`} onPress={confirmConvert} disabled={convert.isPending}>
            {convert.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-[15.5px] font-bold">Chốt thành đơn</Text>}
          </TouchableOpacity>
        )}
        {canReturn && (
          <TouchableOpacity className={`border border-danger rounded-xl py-3.5 px-4 items-center justify-center ${!canCollect ? "flex-1" : ""}`} onPress={() => router.push({ pathname: "/return/[orderId]", params: { orderId: o.id } })}>
            <Text className="text-danger text-[15.5px] font-bold">Trả hàng</Text>
          </TouchableOpacity>
        )}
        {canCollect && (
          <TouchableOpacity className="flex-1 bg-success rounded-xl py-3.5 items-center" onPress={openPay}>
            <Text className="text-white text-[15.5px] font-bold">Thu tiền · còn {fmtVi(remaining)}đ</Text>
          </TouchableOpacity>
        )}
      </View>

      <Select<PaperSize> visible={sizeOpen} onClose={() => setSizeOpen(false)} title="Chọn khổ giấy in" options={PAPER_OPTIONS} value={tmpl.data?.paperDefault ?? null} onChange={doPrint} />

      <Modal visible={payOpen} transparent animationType="fade" onRequestClose={() => setPayOpen(false)}>
        <View className="flex-1 bg-black/40 justify-center p-6">
          <View className="bg-surface rounded-2xl p-[18px] gap-1.5">
            <Text className="text-[17px] font-extrabold text-text mb-1">Thu tiền</Text>
            <Text className="text-[12.5px] font-semibold text-muted mt-2">Số tiền</Text>
            <TextInput className="border border-border rounded-lg px-3 py-3 text-lg font-bold text-text" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.faint} />
            <Text className="text-[12.5px] font-semibold text-muted mt-2">Hình thức</Text>
            <View className="flex-row gap-2 mt-1">
              {(["cash", "bank_transfer"] as PayMethod[]).map((m) => (
                <TouchableOpacity key={m} className={`flex-1 py-2.5 rounded-lg border items-center ${payMethod === m ? "bg-primary border-primary" : "border-border"}`} onPress={() => setPayMethod(m)}>
                  <Text className={`text-[13px] font-semibold ${payMethod === m ? "text-white" : "text-muted"}`}>{m === "cash" ? "Tiền mặt" : "Chuyển khoản"}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2.5 mt-4">
              <TouchableOpacity className="flex-1 py-3 rounded-lg border border-border items-center" onPress={() => setPayOpen(false)}><Text className="text-muted font-bold text-[15px]">Huỷ</Text></TouchableOpacity>
              <TouchableOpacity className={`flex-1 py-3 rounded-lg bg-success items-center ${addPayment.isPending ? "opacity-60" : ""}`} onPress={submitPay} disabled={addPayment.isPending}>
                {addPayment.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-[15px]">Xác nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
