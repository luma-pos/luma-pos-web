import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDefaultWarehouse, useProductSearch, useCreateStocktake } from "../lib/queries";
import { showToast } from "../lib/toast";
import { C, fmtVi } from "../lib/theme";
import type { Product } from "../lib/schemas";

type Line = { productId: string; name: string; unit: string; systemQty: number; actualQty: number };
const num = (s: string) => Number((s || "").replace(/[^0-9.]/g, "")) || 0;

export default function Stocktake() {
  const wh = useDefaultWarehouse();
  const create = useCreateStocktake();
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const search = useProductSearch(q);

  function addProduct(p: Product) {
    setQ("");
    setLines((prev) => prev.some((l) => l.productId === p.id) ? prev : [...prev, { productId: p.id, name: p.name, unit: p.base_unit, systemQty: p.total_stock, actualQty: p.total_stock }]);
  }
  const setActual = (id: string, v: number) => setLines((prev) => prev.map((l) => l.productId === id ? { ...l, actualQty: v } : l));
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.productId !== id));

  async function submit() {
    if (!wh.data) { Alert.alert("Thiếu kho", "Đang tải kho…"); return; }
    if (lines.length === 0) { Alert.alert("Chưa có hàng", "Thêm sản phẩm cần kiểm."); return; }
    const res = await create.mutateAsync({ warehouseId: wh.data.id, balanceNow: true, items: lines.map((l) => ({ productId: l.productId, actualQty: l.actualQty })) });
    if (res.ok) { showToast(`Đã cân bằng kho · ${res.data.code}`); router.back(); }
    else Alert.alert("Kiểm kho thất bại", res.error);
  }

  const results = q.trim() ? (search.data ?? []) : [];

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="p-3 bg-surface border-b border-border z-10">
        <View className="flex-row items-center border border-border rounded-xl px-3">
          <Ionicons name="search" size={17} color={C.faint} />
          <TextInput className="flex-1 py-2.5 px-2 text-[15px] text-text" value={q} onChangeText={setQ} placeholder="Tìm sản phẩm để kiểm…" placeholderTextColor={C.faint} />
        </View>
        {results.length > 0 && (
          <View className="absolute top-14 left-3 right-3 bg-surface rounded-xl border border-border overflow-hidden z-20">
            {results.map((r) => (
              <TouchableOpacity key={r.id} className="flex-row justify-between items-center px-3 py-2.5 border-t border-surface2" onPress={() => addProduct(r)}>
                <Text className="flex-1 text-sm text-text mr-2" numberOfLines={1}>{r.name}</Text>
                <Text className="text-[12.5px] text-muted">tồn {fmtVi(r.total_stock)}</Text>
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
        renderItem={({ item }) => {
          const diff = item.actualQty - item.systemQty;
          return (
            <View className="flex-row items-center gap-2.5 bg-surface rounded-card p-3 border border-border">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text" numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs text-muted mt-0.5">
                  Hệ thống: {fmtVi(item.systemQty)} {item.unit}
                  {Math.abs(diff) > 1e-9 && <Text className={diff < 0 ? "text-danger" : "text-warning"}>  ·  lệch {diff > 0 ? "+" : ""}{fmtVi(diff)}</Text>}
                </Text>
              </View>
              <View className="w-[86px]">
                <Text className="text-[11px] text-faint mb-0.5">Thực tế</Text>
                <TextInput className="border border-border rounded-md px-2.5 py-2 text-[15px] font-bold text-text text-center" keyboardType="number-pad" value={String(item.actualQty)} onChangeText={(t) => setActual(item.productId, num(t))} />
              </View>
              <TouchableOpacity onPress={() => removeLine(item.productId)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={C.danger} /></TouchableOpacity>
            </View>
          );
        }}
      />

      <View className="bg-surface border-t border-border p-3.5 gap-2">
        <TouchableOpacity className={`bg-primary rounded-xl py-3.5 items-center ${create.isPending || lines.length === 0 ? "opacity-50" : ""}`} onPress={submit} disabled={create.isPending || lines.length === 0}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Hoàn tất & cân bằng kho</Text>}
        </TouchableOpacity>
        <Text className="text-xs text-faint text-center">Tồn kho sẽ được đặt = số đếm thực tế.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}
