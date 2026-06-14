import { sql, type SQL, type AnyColumn } from "drizzle-orm";
import { normalizeSearch } from "./normalize";

export { normalizeSearch };

// Bảng đổi ký tự tiếng Việt có dấu → không dấu (dùng translate() — không cần
// extension unaccent). Ghép theo nhóm để from/to luôn khớp độ dài.
const _A = "áàảãạăắằẳẵặâấầẩẫậ";
const _E = "éèẻẽẹêếềểễệ";
const _I = "íìỉĩị";
const _O = "óòỏõọôốồổỗộơớờởỡợ";
const _U = "úùủũụưứừửữự";
const _Y = "ýỳỷỹỵ";
const VN_FROM = _A + _E + _I + _O + _U + _Y + "đ";
const VN_TO =
  "a".repeat([..._A].length) +
  "e".repeat([..._E].length) +
  "i".repeat([..._I].length) +
  "o".repeat([..._O].length) +
  "u".repeat([..._U].length) +
  "y".repeat([..._Y].length) +
  "d";

/**
 * Điều kiện LIKE không phân biệt hoa/thường và không dấu cho 1 cột.
 * Cột được lower() rồi translate() bỏ dấu; pattern lấy từ normalizeSearch.
 */
export function accentInsensitiveLike(col: AnyColumn | SQL, q: string): SQL {
  const pattern = `%${normalizeSearch(q)}%`;
  return sql`translate(lower(${col}), ${VN_FROM}, ${VN_TO}) like ${pattern}`;
}
