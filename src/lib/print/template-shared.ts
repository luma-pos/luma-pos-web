// Phần dùng chung cho cả server và client (KHÔNG import db) — để PrintDoc dùng được ở client.

export type PrintDocType = "order" | "quote" | "purchase" | "return" | "receipt";
export type PaperSize = "a4" | "a5" | "k80";

export interface PrintTemplateOptions {
  showSeller: boolean;
  showProject: boolean;
  showDebt: boolean;
  showInWords: boolean;
  showSignatures: boolean;
  showSku: boolean;
}

export interface PrintTemplate {
  docType: PrintDocType;
  paperDefault: PaperSize;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeTaxCode: string;
  footerNote: string;
  options: PrintTemplateOptions;
}

export const DEFAULT_OPTIONS: PrintTemplateOptions = {
  showSeller: true,
  showProject: true,
  showDebt: true,
  showInWords: true,
  showSignatures: true,
  showSku: false,
};

export const DEFAULT_FOOTER: Record<PrintDocType, string> = {
  order: "Vui lòng kiểm tra hàng khi nhận. Hàng nguyên kiện chưa khui được đổi/trả trong 7 ngày.",
  quote: "Báo giá có hiệu lực trong 7 ngày. Giá chưa gồm vận chuyển nếu không ghi rõ.",
  purchase: "Đề nghị NCC giao đúng chủng loại, quy cách. Hàng hư hỏng vỡ bể sẽ trả lại.",
  return: "Biên nhận trả hàng — kèm theo hóa đơn gốc.",
  receipt: "",
};

export function defaultTemplate(docType: PrintDocType): PrintTemplate {
  return {
    docType,
    paperDefault: docType === "quote" || docType === "purchase" ? "a4" : "a5",
    storeName: "",
    storeAddress: "",
    storePhone: "",
    storeTaxCode: "",
    footerNote: DEFAULT_FOOTER[docType],
    options: { ...DEFAULT_OPTIONS },
  };
}

/** Đọc số tiền thành chữ tiếng Việt. */
export function moneyToWords(n: number): string {
  if (n === 0) return "Không đồng";
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const scales = ["", " nghìn", " triệu", " tỷ"];
  function threeDigits(num: number, full: boolean): string {
    const tr = Math.floor(num / 100), ch = Math.floor((num % 100) / 10), dv = num % 10;
    let s = "";
    if (tr > 0 || full) s += `${digits[tr]} trăm`;
    if (ch > 1) {
      s += ` ${digits[ch]} mươi`;
      if (dv === 1) s += " mốt";
      else if (dv === 5) s += " lăm";
      else if (dv > 0) s += ` ${digits[dv]}`;
    } else if (ch === 1) {
      s += " mười";
      if (dv === 5) s += " lăm";
      else if (dv > 0) s += ` ${digits[dv]}`;
    } else if (dv > 0) {
      if (s) s += " lẻ";
      s += ` ${digits[dv]}`;
    }
    return s.trim();
  }
  const groups: number[] = [];
  let v = Math.round(Math.abs(n));
  while (v > 0) { groups.push(v % 1000); v = Math.floor(v / 1000); }
  let out = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) out += `${threeDigits(groups[i], i !== groups.length - 1 && out !== "")}${scales[i]} `;
  }
  out = out.trim() + " đồng";
  return out.charAt(0).toUpperCase() + out.slice(1);
}
