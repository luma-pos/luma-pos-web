import { useEffect, useState } from "react";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProduct, useCategories, useCreateProduct } from "../lib/queries";
import { pickAndUploadImage } from "../lib/upload";
import { addToCart } from "../lib/cart";
import { showToast } from "../lib/toast";
import { Loading, Field, Select } from "../components/ui";
import { C } from "../lib/theme";

const num = (s: string) => { const n = Number((s || "").replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; };

export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const existing = useProduct(id ?? "");
  const cats = useCategories();
  const create = useCreateProduct();

  const [editing, setEditing] = useState(!isEdit); // tạo mới = sửa luôn; mở SP = xem trước
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [baseUnit, setBaseUnit] = useState("cái");
  const [cost, setCost] = useState("");
  const [retail, setRetail] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [contractor, setContractor] = useState("");
  const [agent, setAgent] = useState("");
  const [location, setLocation] = useState("");
  const [minStock, setMinStock] = useState("");
  const [initStock, setInitStock] = useState("");
  const [active, setActive] = useState(true);
  const [catModal, setCatModal] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function addImage() {
    if (uploading || !editing) return;
    setUploading(true);
    const r = await pickAndUploadImage();
    setUploading(false);
    if (r.error) Alert.alert("Lỗi ảnh", r.error);
    else if (r.url) setImages((prev) => [...prev, r.url!]);
  }

  useEffect(() => {
    if (isEdit && existing.data && !prefilled) {
      const p = existing.data;
      setName(p.name); setSku(p.sku); setBarcode(p.barcode ?? "");
      setCategoryId(p.category_id ?? null); setBaseUnit(p.base_unit);
      setCost(String(p.cost_price)); setRetail(String(p.retail_price));
      setWholesale(p.wholesale_price != null ? String(p.wholesale_price) : "");
      setContractor(p.contractor_price != null ? String(p.contractor_price) : "");
      setAgent(p.agent_price != null ? String(p.agent_price) : "");
      setLocation(p.location ?? ""); setMinStock(String(p.min_stock));
      setImages(p.image_urls ?? []);
      setPrefilled(true);
    }
  }, [isEdit, existing.data, prefilled]);

  const catName = cats.data?.find((c) => c.id === categoryId)?.name ?? "Chọn nhóm hàng";

  async function submit() {
    if (!name.trim()) { Alert.alert("Thiếu tên", "Nhập tên sản phẩm."); return; }
    const res = await create.mutateAsync({
      id: id || undefined, name: name.trim(), sku: sku.trim() || undefined, barcode: barcode.trim() || undefined,
      categoryId, baseUnit: baseUnit.trim() || "cái", costPrice: num(cost), retailPrice: num(retail),
      wholesalePrice: wholesale ? num(wholesale) : null, contractorPrice: contractor ? num(contractor) : null, agentPrice: agent ? num(agent) : null,
      location: location.trim() || undefined, minStock: num(minStock), initialStock: isEdit ? 0 : num(initStock), imageUrls: images, isActive: active,
    });
    if (res.ok) { if (isEdit) { setEditing(false); showToast("Đã lưu thay đổi"); } else { showToast("Đã tạo sản phẩm"); router.back(); } }
    else Alert.alert("Lỗi", res.error);
  }

  function addToPos() {
    const p = existing.data;
    if (!p) return;
    addToCart({ productId: p.id, productName: p.name, unitName: p.base_unit, unitPrice: p.retail_price, stock: p.total_stock });
    router.replace("/pos");
  }

  if (isEdit && existing.isLoading) return <Loading />;

  const title = isEdit ? (editing ? "Sửa sản phẩm" : "Chi tiết sản phẩm") : "Thêm sản phẩm";

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{
        title,
        headerRight: () => (isEdit && !editing
          ? <TouchableOpacity onPress={() => setEditing(true)} className="px-1.5"><Text className="text-primary font-bold text-[15px]">Sửa</Text></TouchableOpacity>
          : null),
      }} />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View className="bg-surface rounded-card border border-border p-3.5 mb-3">
          <Text className="text-sm font-extrabold text-text mb-2.5">Hình ảnh</Text>
          {images.length === 0 && !editing ? (
            <Text className="text-faint text-[13px]">Chưa có ảnh</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2.5">
              {images.map((uri) => (
                <View key={uri}>
                  <Image source={{ uri }} className="w-[78px] h-[78px] rounded-lg bg-surface2" />
                  {editing && (
                    <TouchableOpacity onPress={() => setImages((p) => p.filter((u) => u !== uri))} className="absolute -top-2 -right-2 bg-surface rounded-full" hitSlop={6}>
                      <Ionicons name="close-circle" size={20} color={C.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {editing && (
                <TouchableOpacity className="w-[78px] h-[78px] rounded-lg border border-dashed border-border bg-surface2 items-center justify-center" onPress={addImage} disabled={uploading}>
                  {uploading ? <ActivityIndicator color={C.primary} /> : <Ionicons name="camera-outline" size={24} color={C.muted} />}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View className="bg-surface rounded-card border border-border p-3.5 mb-3">
          <Field label="Tên sản phẩm *" value={name} onChangeText={setName} placeholder="Tên SP" editable={editing} />
          <Field label="Mã SKU (để trống = tự sinh)" value={sku} onChangeText={setSku} placeholder="SP..." editable={editing} />
          <Field label="Mã vạch" value={barcode} onChangeText={setBarcode} editable={editing} />
          <Text className="text-[12.5px] font-semibold text-muted mb-1.5">Nhóm hàng</Text>
          <TouchableOpacity disabled={!editing} className={`flex-row items-center justify-between rounded-lg px-3 py-3 mb-3 border ${editing ? "border-border" : "border-transparent bg-surface2"}`} onPress={() => editing && setCatModal(true)}>
            <Text className={`text-[15px] ${categoryId ? "text-text" : "text-faint"}`}>{catName}</Text>
            {editing && <Ionicons name="chevron-down" size={18} color={C.faint} />}
          </TouchableOpacity>
          <Field label="Đơn vị" value={baseUnit} onChangeText={setBaseUnit} placeholder="cái" editable={editing} />
        </View>

        <View className="bg-surface rounded-card border border-border p-3.5 mb-3">
          <Text className="text-sm font-extrabold text-text mb-2.5">Giá</Text>
          <Field label="Giá vốn" value={cost} onChangeText={setCost} keyboardType="number-pad" editable={editing} />
          <Field label="Giá bán lẻ" value={retail} onChangeText={setRetail} keyboardType="number-pad" editable={editing} />
          <Field label="Giá bán sỉ" value={wholesale} onChangeText={setWholesale} keyboardType="number-pad" editable={editing} />
          <Field label="Giá thầu" value={contractor} onChangeText={setContractor} keyboardType="number-pad" editable={editing} />
          <Field label="Giá đại lý" value={agent} onChangeText={setAgent} keyboardType="number-pad" editable={editing} />
        </View>

        <View className="bg-surface rounded-card border border-border p-3.5 mb-3">
          <Text className="text-sm font-extrabold text-text mb-2.5">Kho</Text>
          <Field label="Vị trí" value={location} onChangeText={setLocation} editable={editing} />
          <Field label="Định mức tồn tối thiểu" value={minStock} onChangeText={setMinStock} keyboardType="number-pad" editable={editing} />
          {!isEdit && <Field label="Tồn đầu" value={initStock} onChangeText={setInitStock} keyboardType="number-pad" editable={editing} />}
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-[12.5px] font-semibold text-muted">Đang kinh doanh</Text>
            <Switch value={active} onValueChange={setActive} disabled={!editing} trackColor={{ true: C.primary }} />
          </View>
        </View>
      </ScrollView>

      <View className="p-3.5 bg-surface border-t border-border">
        {editing ? (
          <TouchableOpacity className={`bg-primary rounded-xl py-3.5 items-center ${create.isPending ? "opacity-60" : ""}`} onPress={submit} disabled={create.isPending}>
            {create.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">{isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity className="flex-row gap-2 bg-primary rounded-xl py-3.5 items-center justify-center" onPress={addToPos}>
            <Ionicons name="cart-outline" size={20} color="#fff" />
            <Text className="text-white text-base font-bold">Thêm vào giỏ bán hàng</Text>
          </TouchableOpacity>
        )}
      </View>

      <Select
        visible={catModal}
        onClose={() => setCatModal(false)}
        title="Nhóm hàng"
        options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        value={categoryId}
        onChange={(v) => setCategoryId(v)}
      />
    </KeyboardAvoidingView>
  );
}
