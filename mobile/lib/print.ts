import * as Print from "expo-print";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { fmtVi } from "./theme";
import {
  moneyToWords,
  defaultTemplate,
  DEFAULT_OPTIONS,
  type PrintTemplate,
  type PrintDocType,
  type PaperSize,
} from "../../src/lib/print/template-shared";
import type { OrderDetail } from "./schemas";

export type { PaperSize, PrintDocType };

/* ============================================================
   In chứng từ trên mobile — dùng expo-print (Print.printAsync).
   Dựng HTML K80/A5/A4 bám đúng logic web (components/print/print-doc.tsx)
   + dùng chung moneyToWords / template từ src/lib/print/template-shared.
   ============================================================ */

export interface PrintLine {
  id: string;
  name: string;
  sku?: string | null;
  unitName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
export interface PrintTotalRow { label: string; value: number; bold?: boolean; negative?: boolean }

export interface DocData {
  title: string;
  code: string;
  date: Date | string;
  partyLabel: string;
  partyName: string;
  partyPhone?: string | null;
  projectName?: string | null;
  deliveryAddress?: string | null;
  deliverToLabel?: string;
  sellerLabel?: string;
  sellerName?: string | null;
  items: PrintLine[];
  totals: PrintTotalRow[];
  grandTotalLabel: string;
  grandTotal: number;
  afterTotals?: PrintTotalRow[];
  signatures?: [string, string, string];
  signHint?: string;
  note?: string | null;
  cols: { product: string; unit: string; qty: string; unitPrice: string; lineTotal: string };
}

const PAPER_LABEL: Record<PaperSize, string> = { k80: "K80 (máy in nhiệt)", a5: "A5", a4: "A4" };
export const PAPER_OPTIONS: { value: PaperSize; label: string }[] =
  (["k80", "a5", "a4"] as PaperSize[]).map((v) => ({ value: v, label: PAPER_LABEL[v] }));

/** Lấy mẫu in (store name/address/footer/options) từ Supabase, fallback mặc định. */
export function usePrintTemplate(docType: PrintDocType) {
  return useQuery({
    queryKey: ["print_template", docType],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PrintTemplate> => {
      const { data } = await supabase.from("print_templates").select("*").eq("doc_type", docType).maybeSingle();
      if (!data) return defaultTemplate(docType);
      return {
        docType,
        paperDefault: data.paper_default ?? "a5",
        storeName: data.store_name ?? "",
        storeAddress: data.store_address ?? "",
        storePhone: data.store_phone ?? "",
        storeTaxCode: data.store_tax_code ?? "",
        footerNote: data.footer_note ?? "",
        options: { ...DEFAULT_OPTIONS, ...(data.options ?? {}) },
      };
    },
  });
}

// ---- helpers ----
const n = (v: number) => fmtVi(Math.round(v));
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

/** Dựng HTML hoàn chỉnh để Print.printAsync. */
export function buildHtml(size: PaperSize, t: PrintTemplate, d: DocData): string {
  return size === "k80" ? k80Html(t, d) : paperHtml(size, t, d);
}

function k80Html(t: PrintTemplate, d: DocData): string {
  const o = t.options;
  const items = d.items.map((i) => `
    <div class="it">${esc(i.name)}<br/>
      <span>${n(i.quantity)} ${esc(i.unitName)} × ${n(i.unitPrice)}</span>
      <b class="r">${n(i.total)}</b>
    </div>`).join("");
  const totals = d.totals.map((r) => `<div>${esc(r.label)}<b class="r">${r.negative ? "−" : ""}${n(r.value)}</b></div>`).join("");
  const after = (d.afterTotals ?? []).map((r) => `<div class="${r.bold ? "b" : ""}">${esc(r.label)}<b class="r">${n(r.value)}</b></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    @page { size: 80mm auto; margin: 3mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color:#000; margin:0; width:74mm; line-height:1.45; }
    .c { text-align:center; } .r { float:right; } .b { font-weight:700; }
    .hr { border-top:1px dashed #555; margin:6px 0; }
    .name { font-weight:700; font-size:14px; } .title { font-weight:700; }
    .it { margin-bottom:6px; } .it span { font-size:11px; }
    .grand { font-weight:700; font-size:14px; margin-top:3px; }
  </style></head><body>
    <div class="c">
      <div class="name">${esc(t.storeName || "—")}</div>
      ${(t.storeAddress || t.storePhone) ? `<div style="font-size:10.5px">${esc(t.storeAddress)}${t.storePhone ? " · " + esc(t.storePhone) : ""}</div>` : ""}
      <div class="hr"></div>
      <div class="title">${esc(d.title)}</div>
      <div style="font-size:11px">${esc(d.code)} · ${fmtDate(d.date)}${o.showSeller && d.sellerName ? " · " + esc(d.sellerName) : ""}</div>
    </div>
    <div class="hr"></div>
    <div style="font-size:11px">${esc(d.partyLabel)}: ${esc(d.partyName)}${o.showProject && d.projectName ? `<br/>CT: ${esc(d.projectName)}` : ""}</div>
    <div class="hr"></div>
    ${items}
    <div class="hr"></div>
    ${totals}
    <div class="grand">${esc(d.grandTotalLabel)}<b class="r">${n(d.grandTotal)}</b></div>
    ${after}
    ${t.footerNote ? `<div class="hr"></div><div class="c" style="font-size:10.5px">${esc(t.footerNote)}</div>` : ""}
  </body></html>`;
}

function paperHtml(size: PaperSize, t: PrintTemplate, d: DocData): string {
  const o = t.options;
  const isA4 = size === "a4";
  const rows = d.items.map((i) => `<tr>
    <td>${esc(i.name)}${o.showSku && i.sku ? ` <span class="sku">(${esc(i.sku)})</span>` : ""}</td>
    <td class="ctr">${esc(i.unitName)}</td>
    <td class="ctr">${n(i.quantity)}</td>
    <td class="rgt">${n(i.unitPrice)}</td>
    <td class="rgt">${n(i.total)}</td>
  </tr>`).join("");
  const totals = d.totals.map((r) => `<tr><td class="lbl">${esc(r.label)}</td><td class="rgt">${r.negative ? "− " : ""}${n(r.value)}</td></tr>`).join("");
  const after = (d.afterTotals ?? []).map((r) => `<tr class="${r.bold ? "b" : ""}"><td class="lbl">${esc(r.label)}</td><td class="rgt">${n(r.value)}</td></tr>`).join("");
  const signs = o.showSignatures && d.signatures
    ? `<div class="signs">${d.signatures.map((s) => `<div><b>${esc(s)}</b><br/><i>${esc(d.signHint ?? "(ký, họ tên)")}</i></div>`).join("")}</div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    @page { size: ${isA4 ? "A4" : "A5"}; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, 'Helvetica Neue', sans-serif; color:#000; font-size:${isA4 ? "13px" : "12px"}; margin:0; }
    .head { display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:8px; }
    .store { font-weight:700; font-size:${isA4 ? "18px" : "16px"}; }
    .muted { color:#555; font-size:11px; }
    .doc { font-weight:700; font-size:${isA4 ? "17px" : "15px"}; text-align:right; }
    .party { display:flex; justify-content:space-between; margin:12px 0; font-size:12px; }
    table.items { width:100%; border-collapse:collapse; font-size:12px; }
    table.items th, table.items td { border:1px solid #888; padding:5px 7px; }
    table.items th { background:#f1f5f9; text-align:left; }
    .ctr { text-align:center; } .rgt { text-align:right; } .lbl { color:#555; }
    .sku { color:#777; font-size:10px; }
    .tot { display:flex; justify-content:flex-end; margin-top:10px; }
    .tot table { width:${isA4 ? "300px" : "260px"}; font-size:12px; }
    .tot td { padding:2px 0; } .grand td { font-weight:700; font-size:14px; padding:4px 0; }
    .b td { font-weight:700; }
    .words { font-size:11px; color:#555; font-style:italic; margin-top:8px; }
    .note { font-size:11px; margin-top:8px; }
    .signs { display:flex; justify-content:space-between; text-align:center; font-size:12px; margin-top:${isA4 ? "56px" : "40px"}; }
    .signs i { font-size:10px; color:#777; }
    .foot { border-top:1px dashed #888; margin-top:32px; padding-top:8px; font-size:10px; color:#777; text-align:center; }
  </style></head><body>
    <div class="head">
      <div><div class="store">${esc(t.storeName || "—")}</div>
        <div class="muted">${esc(t.storeAddress)}${t.storePhone ? `<br/>ĐT: ${esc(t.storePhone)}` : ""}${t.storeTaxCode ? ` · MST: ${esc(t.storeTaxCode)}` : ""}</div>
      </div>
      <div class="doc">${esc(d.title)}<div class="muted">Số: <b>${esc(d.code)}</b><br/>Ngày: ${fmtDate(d.date)}</div></div>
    </div>
    <div class="party">
      <div><b>${esc(d.partyLabel)}:</b> ${esc(d.partyName)}${d.partyPhone ? ` — ${esc(d.partyPhone)}` : ""}
        ${o.showProject && d.projectName ? `<br/><b>Công trình:</b> ${esc(d.projectName)}` : ""}
        ${d.deliveryAddress ? `<br/><b>${esc(d.deliverToLabel ?? "Giao đến")}:</b> ${esc(d.deliveryAddress)}` : ""}</div>
      ${o.showSeller && d.sellerName ? `<div style="text-align:right"><b>${esc(d.sellerLabel ?? "Người lập")}:</b> ${esc(d.sellerName)}</div>` : ""}
    </div>
    <table class="items"><thead><tr>
      <th>${esc(d.cols.product)}</th><th class="ctr">${esc(d.cols.unit)}</th><th class="ctr">${esc(d.cols.qty)}</th>
      <th class="rgt">${esc(d.cols.unitPrice)}</th><th class="rgt">${esc(d.cols.lineTotal)}</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="tot"><table>
      ${totals}
      <tr class="grand"><td>${esc(d.grandTotalLabel)}</td><td class="rgt">${n(d.grandTotal)}</td></tr>
      ${after}
    </table></div>
    ${o.showInWords ? `<div class="words">${esc(d.title.includes("nhập") ? "Bằng chữ" : "Thành tiền")}: ${esc(moneyToWords(d.grandTotal))}.</div>` : ""}
    ${d.note ? `<div class="note"><b>Ghi chú:</b> ${esc(d.note)}</div>` : ""}
    ${signs}
    ${t.footerNote ? `<div class="foot">${esc(t.footerNote)}</div>` : ""}
  </body></html>`;
}

export async function printDocument(size: PaperSize, t: PrintTemplate, d: DocData) {
  await Print.printAsync({ html: buildHtml(size, t, d) });
}

/* ---- mappers: entity → DocData (bám đúng các trang in của web) ---- */

export function orderDoc(o: OrderDetail, t: PrintTemplate): DocData {
  const isQuote = o.status === "quote";
  const total = o.total;
  const paid = o.amount_paid ?? 0;
  const remaining = Math.max(0, total - paid);
  const sub = o.subtotal ?? total;
  return {
    title: isQuote ? "BÁO GIÁ" : "HÓA ĐƠN BÁN HÀNG",
    code: o.code,
    date: o.created_at,
    partyLabel: "Khách hàng",
    partyName: o.customers?.name ?? "Khách lẻ",
    partyPhone: o.customers?.phone,
    sellerLabel: "Người lập",
    items: o.order_items.map((i) => ({ id: i.id, name: i.product_name, unitName: i.unit_name, quantity: i.quantity, unitPrice: i.unit_price, total: i.total })),
    totals: [
      { label: "Tạm tính", value: sub },
      ...((o.discount ?? 0) > 0 ? [{ label: "Giảm giá", value: o.discount!, negative: true }] : []),
      ...((o.shipping_fee ?? 0) > 0 ? [{ label: "Phí vận chuyển", value: o.shipping_fee! }] : []),
    ],
    grandTotalLabel: "TỔNG CỘNG",
    grandTotal: total,
    afterTotals: isQuote ? [] : [
      ...(t.options.showDebt ? [{ label: "Đã thanh toán", value: paid }] : []),
      ...(t.options.showDebt && remaining > 0 ? [{ label: "Còn lại", value: remaining, bold: true }] : []),
    ],
    signatures: ["Người mua", "Người giao", "Người bán"],
    note: o.note,
    cols: { product: "Sản phẩm", unit: "ĐVT", qty: "SL", unitPrice: "Đơn giá", lineTotal: "Thành tiền" },
  };
}
