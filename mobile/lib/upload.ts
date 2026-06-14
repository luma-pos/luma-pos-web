import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

/**
 * Chọn 1 ảnh từ thư viện rồi upload lên bucket "products" của Supabase Storage.
 * Trả về { url } (public URL) hoặc { error } / {} nếu huỷ.
 * Yêu cầu: bucket "products" public + policy INSERT cho authenticated (xem supabase/storage-products.sql).
 */
export async function pickAndUploadImage(): Promise<{ url?: string; error?: string }> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: "Chưa cấp quyền truy cập ảnh" };

  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
  if (res.canceled || !res.assets?.length) return {};

  const asset = res.assets[0];
  try {
    const arraybuffer = await fetch(asset.uri).then((r) => r.arrayBuffer());
    const ext = (asset.uri.split(".").pop() || "jpg").split("?")[0].toLowerCase();
    const contentType = asset.mimeType || (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg");
    const path = `mobile/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from("products").upload(path, arraybuffer, { contentType, upsert: false });
    if (error) return { error: error.message };

    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { error: `Không upload được ảnh: ${String(e)}` };
  }
}
