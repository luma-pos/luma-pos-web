import { useMemo, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDefaultWarehouse, useProductSearch, useSuppliers, useCreatePurchase } from "../lib/queries";
import { BottomSheet } from "../components/BottomSheet";
import { Field } from "../components/ui";
import { showToast } from "../lib/toast";
import { C, fmtVi } from "../lib/theme";
import { usePrintTemplate, printDocument, type DocData, type PrintTemplate } from "../lib/print";
import type { Product } from "../lib/schemas";

type Line = { productId: string; name: string; unit: string; quantity: number; unitCost: number };
const num = (s: string) => Number((s || "").replace(/[^0-9.]/g, "")) || 0;

export function purchaseDoc(code: string, supplierName: string, warehouseName: string | undefined, lines: Line[], paid: number, t: PrintTemplate): DocData {
  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const owed = Math.max(0, total - paid);
  return {
    title: "PHIẾU NHẬP HÀNG",
    code,
    date: new Date(),
    partyLabel: "Nhà cung cấp",
    partyName: supplierName,
    deliveryAddress: warehouseName,
    deliverToLabel: "Kho nhập",
    sellerLabel: "Người lập",
    items: lines.map((l) => ({ id: l.productId, name: l.name, unitName: l.unit, quantity: l.quantity, unitPrice: l.unitCost, total: l.quantity * l.unitCost })),
    totals: [],
    grandTotalLabel: "TỔNG TIỀN HÀNG",
    grandTotal: total,
    afterTotals: [
      ...(t.options.showDebt ? [{ label: "Đã trả NCC", value: paid }] : []),
      ...(t.options.showDebt && owed > 0 ? [{ label: "Còn nợ", value: owed, bold: true }] : []),
    ],
    signatures: ["Nhà cung cấp", "Người nhận", "Người lập"],
    cols: { product: "Sản phẩm", unit: "ĐVT", qty: "SL", unitPrice: "Giá nhập", lineTotal: "Thành tiền" },
  };
}

export default function Receive() {
  const wh = useDefaultWarehouse();
  const create = useCreatePurchase();
  const tmpl = usePrintTemplate("purchase");
  const [supplier, setSupplier] = useState<{ id: string; name: string } | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [paid, setPaid] = useState("");
  const [supModal, setSupModal] = useState(false);
  const [supQ, setSupQ] = useState("");
  const suppliers = useSuppliers(supQ);
  const [q, setQ] = useState("");
  const search = useProductSearch(q);

  const total = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitCost, 0), [lines]);

  function addProduct(p: Product) {
    setQ("");
    setLines((prev) => prev.some((l) => l.productId === p.id) ? prev : [...prev, { productId: p.id, name: p.name, unit: p.base_unit, quantity: 1, unitCost: p.last_purchase_price ?? p.cost_price }]);
  }
  const setLine = (id: string, patch: Partial<Line>) => setLines((prev) => prev.map((l) => l.productId === id ? { ...l, ...patch } : l));
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.productId !== id));

  async function submit() {
    if (!supplier) { Alert.alert("Thiếu NCC", "Chọn nhà cung cấp."); return; }
    if (!wh.data) { Alert.alert("Thiếu kho", "Đang tải kho…"); return; }
    if (lines.length === 0) { Alert.alert("Chưa có hàng", "Thêm sản phẩm cần nhập."); return; }
    const res = await create.mutateAsync({
      supplierId: supplier.id, warehouseId: wh.data.id, discount: 0, vatRate: 0, amountPaid: num(paid),
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost, discount: 0 })),
    });
    if (res.ok) {
      const code = res.data.code;
      showToast(`Đã nhập hàng · ${code}`);
      const t = tmpl.data;
      const snapshot = lines.slice();
      const paidNum = num(paid);
      const supName = supplier.name;
      const whName = wh.data.name;
      Alert.alert("Đã tạo phiếu nhập", `Mã phiếu: ${code}`, [
        { text: "Xong", style: "cancel", onPress: () => router.back() },
        { text: "In phiếu nhập", onPress: async () => {
            if (!t) { router.back(); return; }
            try { await printDocument(t.paperDefault, t, purchaseDoc(code, supName, whName, snapshot, paidNum, t)); }
            catch (e) { Alert.alert("In thất bại", (e as Error).message); }
            router.back();
          } },
      ]);
    } else Alert.alert("Nhập hàng thất bại", res.error);
  }

  const results = q.trim() ? (search.data ?? []) : [];

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="p-3 bg-surface border-b border-border gap-2.5 z-10">
        <TouchableOpacity className="flex-row items-center gap-2 border border-border rounded-lg px-3 py-2.5 bg-surface2" onPress={() => setSupModal(true)}>
          <Ionicons name="business-outline" size={18} color={C.muted} />
          <Text className={`flex-1 text-[14.5px] font-semibold ${supplier ? "text-text" : "text-faint"}`} numberOfLines={1}>{supplier ? supplier.name : "Chọn nhà cung cấp"}</Text>
          <Ionicons name="chevron-forward" size={18} color={C.faint} />
        </TouchableOpacity>
        <View className="flex-row items-center border border-border rounded-xl px-3">
          <Ionicons name="search" size={17} color={C.faint} />
          <TextInput className="flex-1 py-2.5 px-2 text-[15px] text-text" value={q} onChangeText={setQ} placeholder="Tìm sản phẩm để thêm…" placeholderTextColor={C.faint} />
        </View>
        {results.length > 0 && (
          <View className="absolute top-[110px] left-3 right-3 bg-surface rounded-xl border border-border overflow-hidden z-20">
            {results.map((r) => (
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
          <View className="flex-row items-center gap-2.5 bg-surface rounded-card p-3 border border-border">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text" numberOfLines={1}>{item.name}</Text>
              <View className="flex-row items-end gap-2.5 mt-1.5">
                <View className="flex-1">
                  <Text className="text-[11px] text-faint mb-0.5">SL</Text>
                  <TextInput className="border border-border rounded-md px-2 py-1.5 text-sm text-text" keyboardType="number-pad" value={String(item.quantity)} onChangeText={(t) => setLine(item.productId, { quantity: num(t) })} />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] text-faint mb-0.5">Giá nhập</Text>
                  <TextInput className="border border-border rounded-md px-2 py-1.5 text-sm text-text" keyboardType="number-pad" value={String(item.unitCost)} onChangeText={(t) => setLine(item.productId, { unitCost: num(t) })} />
                </View>
                <Text className="text-[13.5px] font-bold text-text pb-1.5">{fmtVi(item.quantity * item.unitCost)}đ</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeLine(item.productId)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={C.danger} /></TouchableOpacity>
          </View>
        )}
      />

      <View className="bg-surface border-t border-border p-3.5 gap-2.5">
        <View className="flex-row justify-between items-center">
          <Text className="text-[15px] text-muted">Tổng tiền hàng</Text>
          <Text className="text-[20px] font-extrabold text-text">{fmtVi(total)}đ</Text>
        </View>
        <View className="-mb-3"><Field label="Trả NCC" value={paid} onChangeText={setPaid} keyboardType="number-pad" placeholder="0" /></View>
        <TouchableOpacity className={`bg-success rounded-xl py-3.5 items-center ${create.isPending || lines.length === 0 ? "opacity-50" : ""}`} onPress={submit} disabled={create.isPending || lines.length === 0}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Nhận hàng & nhập kho</Text>}
        </TouchableOpacity>
      </View>

      <BottomSheet visible={supModal} onClose={() => setSupModal(false)}>
        <View className="flex-row items-center justify-between px-4 pb-2.5">
          <Text className="text-base font-extrabold text-text">Nhà cung cấp</Text>
          <TouchableOpacity onPress={() => setSupModal(false)}><Ionicons name="close" size={24} color={C.muted} /></TouchableOpacity>
        </View>
        <View className="flex-row items-center mx-4 mb-2 border border-border rounded-xl px-3">
          <Ionicons name="search" size={17} color={C.faint} />
          <TextInput className="flex-1 py-2.5 px-2 text-[15px] text-text" value={supQ} onChangeText={setSupQ} placeholder="Tìm NCC…" placeholderTextColor={C.faint} autoFocus />
        </View>
        <FlatList
          data={suppliers.data?.pages.flat() ?? []}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={suppliers.isLoading ? <ActivityIndicator color={C.primary} className="mt-4" /> : <Text className="text-center text-faint mt-5">Không có NCC</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity className="px-4 py-3.5 border-t border-surface2" onPress={() => { setSupplier({ id: item.id, name: item.name }); setSupModal(false); }}>
              <Text className="text-[15px] font-semibold text-text">{item.name}</Text>
              <Text className="text-[12.5px] text-muted mt-0.5">{item.phone || "—"}</Text>
            </TouchableOpacity>
          )}
        />
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}
