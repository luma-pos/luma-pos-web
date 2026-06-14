import { useState } from "react";
import { router, Stack } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePos, getActiveDraft, setQty, removeLine, setDraftMeta, repriceCart, clearActive, removeDraft } from "../lib/cart";
import { useCustomers, usePriceBooks, fetchBookPrices, useDefaultWarehouse, useCreateOrder } from "../lib/queries";
import { makeClientId } from "../lib/api";
import { BottomSheet } from "../components/BottomSheet";
import { Card, EmptyState, Stepper } from "../components/ui";
import { C, fmtVi } from "../lib/theme";
import type { CreateOrderInput } from "../lib/schemas";

const num = (s: string) => Number((s || "").replace(/[^0-9.]/g, "")) || 0;

export default function CartScreen() {
  const pos = usePos();
  const draft = getActiveDraft(pos);
  const cart = draft.lines;
  const customer = draft.customerId ? { id: draft.customerId, name: draft.customerName ?? "" } : null;
  const bookId = draft.bookId;

  const [discount, setDiscount] = useState("");
  const [custModal, setCustModal] = useState(false);
  const [custQ, setCustQ] = useState("");
  const custList = useCustomers(custQ);
  const books = usePriceBooks();
  const wh = useDefaultWarehouse();
  const create = useCreateOrder();

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const final = Math.max(0, subtotal - num(discount));
  const count = cart.reduce((s, l) => s + l.quantity, 0);

  async function saveQuote() {
    if (create.isPending) return;
    if (!wh.data) { Alert.alert("Thiếu kho", "Đang tải kho…"); return; }
    const payload: CreateOrderInput = {
      mode: "quote", clientId: makeClientId(), warehouseId: wh.data.id, customerId: customer?.id ?? null,
      discount: num(discount), shippingFee: 0,
      items: cart.map((l) => ({ productId: l.productId, productName: l.productName, unitName: l.unitName, unitMultiplier: 1, quantity: l.quantity, unitPrice: l.unitPrice })),
      payment: { method: "cash", amount: 0 },
    };
    const res = await create.mutateAsync(payload);
    if (res.ok) {
      if (pos.drafts.length > 1) removeDraft(draft.id); else clearActive();
      router.replace({ pathname: "/pos-success", params: { code: res.data.code, id: res.data.id, sub: "Đã lưu báo giá — chốt thành đơn khi khách đồng ý" } });
    } else Alert.alert("Lưu báo giá thất bại", res.error);
  }

  async function applyBook(id: string | null) {
    setDraftMeta({ bookId: id });
    if (!id) { repriceCart(new Map()); return; }
    repriceCart(await fetchBookPrices(id, cart.map((l) => l.productId)));
  }

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-bg">
        <Stack.Screen options={{ title: "Giỏ hàng" }} />
        <EmptyState text="Giỏ trống — quay lại chọn sản phẩm" icon="cart-outline" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ title: `Giỏ hàng (${cart.length})` }} />
      <FlatList
        data={cart}
        keyExtractor={(l) => l.productId}
        contentContainerStyle={{ padding: 14, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-3">
            {/* Khách */}
            <Card className="flex-row items-center gap-3" onPress={() => setCustModal(true)}>
              <View className="w-9 h-9 rounded-full bg-primary-soft items-center justify-center">
                <Text className="text-primary font-extrabold text-xs">{customer ? customer.name.slice(0, 2).toUpperCase() : <Ionicons name="person" size={16} color={C.primary} />}</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-[14.5px] font-semibold ${customer ? "text-text" : "text-faint"}`} numberOfLines={1}>{customer ? customer.name : "Khách lẻ — chạm để chọn"}</Text>
              </View>
              {customer
                ? <TouchableOpacity onPress={() => setDraftMeta({ customerId: null, customerName: null })} hitSlop={8}><Ionicons name="close-circle" size={18} color={C.faint} /></TouchableOpacity>
                : <Ionicons name="chevron-forward" size={18} color={C.faint} />}
            </Card>

            {/* Bảng giá */}
            {(books.data?.length ?? 0) > 0 && (
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity className={`px-3 py-1.5 rounded-full ${!bookId ? "bg-primary-soft" : "bg-surface2"}`} onPress={() => applyBook(null)}>
                  <Text className={`text-[12.5px] font-semibold ${!bookId ? "text-primary" : "text-muted"}`}>Giá lẻ</Text>
                </TouchableOpacity>
                {books.data!.map((bk) => (
                  <TouchableOpacity key={bk.id} className={`px-3 py-1.5 rounded-full ${bookId === bk.id ? "bg-primary-soft" : "bg-surface2"}`} onPress={() => applyBook(bk.id)}>
                    <Text className={`text-[12.5px] font-semibold ${bookId === bk.id ? "text-primary" : "text-muted"}`}>{bk.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card className="flex-row items-center">
            <View className="flex-1 pr-2">
              <Text className="text-sm font-semibold text-text" numberOfLines={1}>{item.productName}</Text>
              <Text className="text-xs text-muted mt-0.5">{item.unitName} · {fmtVi(item.unitPrice)}đ</Text>
            </View>
            <Stepper value={item.quantity} onChange={(v) => setQty(item.productId, v)} />
            <TouchableOpacity onPress={() => removeLine(item.productId)} hitSlop={8} className="pl-2"><Ionicons name="trash-outline" size={18} color={C.danger} /></TouchableOpacity>
          </Card>
        )}
        ListFooterComponent={
          <Card className="mt-1">
            <View className="flex-row justify-between py-1.5"><Text className="text-sm text-muted">Tạm tính</Text><Text className="text-sm font-semibold text-text">{fmtVi(subtotal)}đ</Text></View>
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="text-sm text-muted">Giảm giá</Text>
              <TextInput className="text-sm font-semibold text-text text-right min-w-[100px] border-b border-border py-0.5" keyboardType="number-pad" value={discount} onChangeText={setDiscount} placeholder="0" placeholderTextColor={C.faint} />
            </View>
            <View className="flex-row justify-between py-1.5 border-t border-surface2 mt-1"><Text className="text-[15px] font-extrabold text-text">Tổng</Text><Text className="text-[15px] font-extrabold text-primary">{fmtVi(final)}đ</Text></View>
          </Card>
        }
      />

      <View className="p-3.5 bg-surface border-t border-border flex-row gap-2.5">
        <TouchableOpacity className={`border border-primary rounded-xl py-3.5 px-4 items-center justify-center ${create.isPending ? "opacity-60" : ""}`} onPress={saveQuote} disabled={create.isPending}>
          {create.isPending ? <ActivityIndicator color={C.primary} /> : <Text className="text-primary text-[15px] font-bold">Lưu báo giá</Text>}
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-primary rounded-xl py-3.5 items-center" onPress={() => router.push({ pathname: "/payment", params: { discount: String(num(discount)) } })}>
          <Text className="text-white text-base font-bold">Thanh toán · {count} SP →</Text>
        </TouchableOpacity>
      </View>

      <BottomSheet visible={custModal} onClose={() => setCustModal(false)}>
        <View className="flex-row items-center justify-between px-4 pb-2.5">
          <Text className="text-base font-extrabold text-text">Chọn khách hàng</Text>
          <TouchableOpacity onPress={() => setCustModal(false)} hitSlop={8}><Ionicons name="close" size={24} color={C.muted} /></TouchableOpacity>
        </View>
        <View className="flex-row items-center mx-4 mb-2 border border-border rounded-xl px-3">
          <Ionicons name="search" size={17} color={C.faint} />
          <TextInput className="flex-1 py-2.5 px-2 text-[15px] text-text" value={custQ} onChangeText={setCustQ} placeholder="Tìm tên / SĐT…" placeholderTextColor={C.faint} autoFocus />
        </View>
        <FlatList
          data={custList.data?.pages.flat() ?? []}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <TouchableOpacity className="flex-row items-center gap-2.5 px-4 py-3.5 border-t border-surface2" onPress={() => { setDraftMeta({ customerId: null, customerName: null }); setCustModal(false); }}>
              <Ionicons name="person-outline" size={18} color={C.muted} /><Text className="text-[15px] font-semibold text-text">Khách lẻ</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={custList.isLoading ? <ActivityIndicator color={C.primary} className="mt-4" /> : <Text className="text-center text-faint mt-5">Không tìm thấy khách</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity className="px-4 py-3.5 border-t border-surface2" onPress={() => { setDraftMeta({ customerId: item.id, customerName: item.name }); setCustModal(false); }}>
              <Text className="text-[15px] font-semibold text-text">{item.name}</Text>
              <Text className="text-[12.5px] text-muted mt-0.5">{item.phone || "—"}{item.current_debt > 0 ? ` · nợ ${fmtVi(item.current_debt)}đ` : ""}</Text>
            </TouchableOpacity>
          )}
        />
      </BottomSheet>
    </View>
  );
}
