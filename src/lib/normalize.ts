/**
 * Chuẩn hoá chuỗi tìm kiếm: bỏ dấu, hạ chữ thường, đ→d, gộp khoảng trắng.
 * File này KHÔNG import drizzle nên an toàn dùng ở client (POS, form nhập hàng…).
 */
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
