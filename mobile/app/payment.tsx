import { useState } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePos, getActiveDraft, clearActive, removeDraft } from "../lib/cart";
import { useDefaultWarehouse, useCreateOrder } from "../lib/queries";
import { makeClientId } from "../lib/api";
import { enqueueOrder } from "../lib/outbox";
import { Card, Segmented, DateField, fmtDate } from "../components/ui";
import { C, fmtVi } from "../lib/theme";
import type { CreateOrderInput } from "../lib/schemas";

type Method = "cash" | "bank_transfer" | "deposit";
const num = (s: string) => Number((s || "").replace(/[^0-9.]/g, "")) || 0;
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

export default function Payment() {
  const params = useLocalSearchParams<{ discount?: string }>();
  const discount = num(params.discount ?? "0");
  const pos = usePos();
  const draft = getActiveDraft(pos);
  const cart = draft.lines;
  const customer = draft.customerId ? { id: draft.customerId, name: draft.customerName ?? "" } : null;

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const [method, setMethod] = useState<Method>("cash");
  const [deposit, setDeposit] = useState(String(Math.round(total / 2)));
  const [due, setDue] = useState(() => plusDays(15));

  const wh = useDefaultWarehouse();
  const create = useCreateOrder();

  const depositVal = method === "deposit" ? Math.min(num(deposit), total) : total;
  const debt = total - depositVal;

  async function submit() {
    if (create.isPending) return;
    if (!wh.data) { Alert.alert("Thiếu kho", "Đang tải kho…"); return; }
    if (method === "deposit" && !customer) { Alert.alert("Cần chọn khách", "Bán nợ/cọc phải gắn khách hàng."); return; }

    const payMethod = method === "bank_transfer" ? "bank_transfer" : "cash";
    const amount = method === "deposit" ? depositVal : total;

    const payload: CreateOrderInput = {
      mode: "sale", clientId: makeClientId(), warehouseId: wh.data.id, customerId: customer?.id ?? null,
      discount, shippingFee: 0,
      items: cart.map((l) => ({ productId: l.productId, productName: l.productName, unitName: l.unitName, unitMultiplier: 1, quantity: l.quantity, unitPrice: l.unitPrice })),
      payment: { method: payMethod, amount },
    };

    const finish = (code: string, id?: string) => {
      if (pos.drafts.length > 1) removeDraft(draft.id); else clearActive();
      const sub = method === "deposit"
        ? `Cọc ${fmtVi(depositVal)}đ ${payMethod === "cash" ? "tiền mặt" : "CK"} · nợ ${fmtVi(debt)}đ (hạn ${fmtDate(due)})`
        : payMethod === "cash" ? `Đã thu ${fmtVi(total)}đ tiền mặt` : `Đã thu ${fmtVi(total)}đ chuyển khoản`;
      router.replace({ pathname: "/pos-success", params: { code, id: id ?? "", sub } });
    };

    const res = await create.mutateAsync(payload);
    if (res.ok) finish(res.data.code, res.data.id);
    else if (res.network) { await enqueueOrder(payload); finish("(ngoại tuyến)"); }
    else Alert.alert("Tạo đơn thất bại", res.error);
  }

  const showQR = method === "bank_transfer" || (method === "deposit" && false);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ title: "Thanh toán" }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View className="items-center py-2">
          <Text className="text-[13px] text-muted">Tổng cộng</Text>
          <Text className="text-[34px] font-extrabold text-primary mt-1">{fmtVi(total)}đ</Text>
          {customer && <Text className="text-[13px] text-muted mt-1">{customer.name}</Text>}
        </View>

        <Segmented value={method} options={[["cash", "Tiền mặt"], ["bank_transfer", "CK"], ["deposit", "Cọc + nợ"]]} onChange={setMethod} />

        {method === "deposit" && (
          <Card className="gap-1">
            <Text className="text-[12.5px] font-semibold text-muted mb-1">Khách đặt cọc</Text>
            <TextInput className="border border-border rounded-lg px-3 py-3 text-lg font-bold text-text" keyboardType="number-pad" value={deposit} onChangeText={setDeposit} placeholder="0" placeholderTextColor={C.faint} />
            <View className="flex-row flex-wrap gap-2 mt-2">
              {([["50%", Math.round(total / 2)], ["Đủ", total]] as [string, number][]).map(([lbl, v]) => (
                <TouchableOpacity key={lbl} className="px-3 py-1.5 rounded-full bg-surface2" onPress={() => setDeposit(String(v))}>
                  <Text className="text-[12.5px] font-semibold text-muted">{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-sm text-muted">Ghi nợ còn lại</Text>
              <Text className="text-sm font-extrabold text-danger">{fmtVi(debt)}đ</Text>
            </View>
            <View className="mt-2"><DateField label="Hạn thanh toán" value={due} onChange={setDue} /></View>
          </Card>
        )}

        {showQR && (
          <Card className="items-center gap-2">
            <View className="flex-row items-center justify-between w-full">
              <Text className="text-sm font-bold text-text">VietQR chuyển khoản</Text>
              <View className="px-2 py-0.5 rounded-full bg-success-soft"><Text className="text-[11px] font-bold text-success">Tự đối soát</Text></View>
            </View>
            <View className="w-44 h-44 rounded-xl bg-surface2 items-center justify-center my-1">
              <Ionicons name="qr-code-outline" size={88} color={C.muted} />
            </View>
            <Text className="text-xs text-muted">VCB ···· 4321 — VLXD THUAN PHAT</Text>
            <Text className="text-[11px] text-faint">QR thật cần cấu hình tài khoản ngân hàng trong Cài đặt</Text>
          </Card>
        )}
      </ScrollView>

      <View className="p-3.5 bg-surface border-t border-border">
        <TouchableOpacity className={`bg-success rounded-xl py-3.5 items-center ${create.isPending ? "opacity-60" : ""}`} onPress={submit} disabled={create.isPending}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Hoàn tất · {fmtVi(method === "deposit" ? depositVal : total)}đ</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
