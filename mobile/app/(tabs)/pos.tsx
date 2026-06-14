import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePos, getActiveDraft, addToCart, newDraft, switchDraft, removeDraft } from "../../lib/cart";
import { useProducts, useCategories } from "../../lib/queries";
import { firstImage, type Product } from "../../lib/schemas";
import { BottomSheet } from "../../components/BottomSheet";
import { Screen, SearchBar, Card, Thumb, EmptyState, ErrorState, Loading } from "../../components/ui";
import { C, fmtVi } from "../../lib/theme";

export default function PosCatalog() {
  const pos = usePos();
  const draft = getActiveDraft(pos);
  const cartCount = draft.lines.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = draft.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [draftSheet, setDraftSheet] = useState(false);
  const qy = useProducts(q, cat);
  const { isLoading, isRefetching, refetch, error, hasNextPage, fetchNextPage, isFetchingNextPage } = qy;
  const cats = useCategories();
  const data = qy.data?.pages.flat() ?? [];

  const chips: { id: string | null; label: string }[] = [{ id: null, label: "Tất cả" }, ...(cats.data ?? []).map((c) => ({ id: c.id, label: c.name }))];

  function add(p: Product) {
    addToCart({ productId: p.id, productName: p.name, unitName: p.base_unit, unitPrice: p.retail_price, basePrice: p.retail_price, stock: p.total_stock });
  }

  return (
    <Screen>
      {/* Search + đơn tạm */}
      <View className="flex-row items-center gap-2 px-3 pt-3">
        <View className="flex-1"><SearchBar value={q} onChangeText={setQ} placeholder="Tìm SP hoặc quét mã…" /></View>
        <TouchableOpacity className="w-11 h-11 rounded-xl bg-primary items-center justify-center mt-3" onPress={() => Alert.alert("Quét mã", "Tính năng quét barcode sẽ bật khi build app thật.")}>
          <Ionicons name="scan-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity className="w-11 h-11 rounded-xl bg-surface2 items-center justify-center mt-3" onPress={() => setDraftSheet(true)}>
          <Ionicons name="albums-outline" size={20} color={C.primary} />
          {pos.drafts.length > 1 && <View className="absolute -top-1 -right-1 bg-danger rounded-full w-5 h-5 items-center justify-center"><Text className="text-white text-[10px] font-bold">{pos.drafts.length}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* Chip nhóm */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 10 }} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
        {chips.map((c) => {
          const on = cat === c.id;
          return (
            <TouchableOpacity key={c.id ?? "all"} className={`px-3 py-1.5 rounded-full ${on ? "bg-primary-soft" : "bg-surface2"}`} onPress={() => setCat(c.id)}>
              <Text className={`text-[12.5px] font-semibold ${on ? "text-primary" : "text-muted"}`}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? <Loading /> : error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState text="Không có sản phẩm" icon="cube-outline" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={C.primary} className="my-3.5" /> : null}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: cartCount ? 96 : 16 }}
          renderItem={({ item }) => (
            <Card className="flex-row items-center gap-3">
              <Thumb uri={firstImage(item)} />
              <TouchableOpacity className="flex-1" onPress={() => router.push({ pathname: "/product-form", params: { id: item.id } })}>
                <Text className="text-[14.5px] font-semibold text-text" numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs text-faint mt-0.5">Tồn {fmtVi(item.total_stock)} {item.base_unit}</Text>
                <Text className="text-[13.5px] text-primary font-bold mt-0.5">{fmtVi(item.retail_price)}đ/{item.base_unit}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-9 h-9 rounded-lg bg-primary-soft items-center justify-center" onPress={() => add(item)} hitSlop={8}>
                <Ionicons name="add" size={22} color={C.primary} />
              </TouchableOpacity>
            </Card>
          )}
        />
      )}

      {/* Bar giỏ hàng */}
      {cartCount > 0 && (
        <View className="absolute left-3 right-3 bottom-3">
          <TouchableOpacity className="flex-row items-center bg-primary rounded-xl px-4 py-3.5" style={{ shadowColor: "#1d4ed8", shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }} onPress={() => router.push("/cart")}>
            <Text className="text-white font-bold text-[15px]">Giỏ hàng · {cartCount} SP</Text>
            <Text className="flex-1 text-right text-white font-extrabold text-[15px]">{fmtVi(cartTotal)}đ</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* Sheet đơn tạm */}
      <BottomSheet visible={draftSheet} onClose={() => setDraftSheet(false)} heightPct={0.5}>
        <View className="flex-row items-center justify-between px-4 pb-2.5">
          <Text className="text-base font-extrabold text-text">Đơn tạm</Text>
          <TouchableOpacity onPress={() => { newDraft(); setDraftSheet(false); }} className="flex-row items-center gap-1">
            <Ionicons name="add" size={20} color={C.primary} /><Text className="text-primary font-bold">Đơn mới</Text>
          </TouchableOpacity>
        </View>
        <ScrollView>
          {pos.drafts.map((d) => {
            const on = d.id === pos.activeId;
            const sum = d.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
            return (
              <TouchableOpacity key={d.id} className={`flex-row items-center px-4 py-3.5 border-t border-surface2 ${on ? "bg-primary-soft" : ""}`} onPress={() => { switchDraft(d.id); setDraftSheet(false); }}>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-text">{d.name}{on ? " · đang chọn" : ""}</Text>
                  <Text className="text-xs text-muted mt-0.5">{d.lines.length} SP · {fmtVi(sum)}đ</Text>
                </View>
                {pos.drafts.length > 1 && <TouchableOpacity onPress={() => removeDraft(d.id)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={C.danger} /></TouchableOpacity>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}
