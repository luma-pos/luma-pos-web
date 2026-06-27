import { randomUUID } from "node:crypto";
import type { RestockRow } from "@/lib/data/ai-restock";

export type AiAssistantState =
  | "idle"
  | "parsing"
  | "needs_input"
  | "needs_selection"
  | "preview"
  | "confirming"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "unauthorized";

export type AiActionLine = {
  label: string;
  value: string;
  meta?: string;
  tone?: "default" | "warning" | "danger" | "success";
};

export type AiActionPreview = {
  id: string;
  intent: string;
  title: string;
  description: string;
  confidence: number;
  state: AiAssistantState;
  confirmationRequired: boolean;
  strongConfirmation?: boolean;
  entityType: string;
  entityId?: string | null;
  requiredFields: string[];
  missingFields: string[];
  fields: AiActionLine[];
  lines: AiActionLine[];
  warnings: string[];
  action: {
    type: string;
    target: string;
    payload: Record<string, unknown>;
  };
};

export type AiAssistantResponse = {
  text: string;
  state: AiAssistantState;
  prompt: string;
  actionPreview?: AiActionPreview;
  actions: Array<{ type: string; target: string; label: string }>;
  chart?: { type: string; rows: unknown[] };
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function moneyText(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function restockPreview(prompt: string, restock: RestockRow[]): AiActionPreview {
  const rows = restock.filter((row) => row.suggestedQty > 0).slice(0, 5);
  return {
    id: randomUUID(),
    intent: "create_draft_purchase_order_from_restocking",
    title: "Tạo PO nháp từ gợi ý nhập hàng",
    description: rows.length
      ? `Tôi tìm thấy ${rows.length} mặt hàng ưu tiên để đưa vào PO nháp.`
      : "Hiện chưa có mặt hàng nào cần đưa vào PO nháp.",
    confidence: 0.91,
    state: "preview",
    confirmationRequired: true,
    entityType: "purchase_order",
    requiredFields: ["warehouse", "supplier_strategy", "items"],
    missingFields: rows.length ? [] : ["items"],
    fields: [
      { label: "Chiến lược NCC", value: "Nhà cung cấp tốt nhất" },
      { label: "Số dòng", value: String(rows.length) },
      { label: "Nguồn", value: "AI Restocking 30 ngày" },
    ],
    lines: rows.map((row) => ({
      label: row.name,
      value: `+${row.suggestedQty} ${row.baseUnit}`,
      meta: `${row.sku} · tồn ${row.stock} · còn ${row.daysOfStock == null ? "—" : row.daysOfStock.toFixed(1)} ngày`,
      tone: row.priority === "high" ? "danger" : row.priority === "medium" ? "warning" : "default",
    })),
    warnings: [
      "Xác nhận sẽ tạo PO nháp; phiếu này chưa tăng tồn kho cho tới khi nhận hàng.",
      "Không tăng tồn kho và không ghi sổ quỹ trước khi user xác nhận tạo chứng từ.",
    ],
    action: {
      type: "create_draft_po",
      target: "aiRestocking",
      payload: {
        prompt,
        source: "ai_restocking",
        itemIds: rows.map((row) => row.id),
        items: rows.map((row) => ({
          productId: row.id,
          quantity: row.suggestedQty,
        })),
      },
    },
  };
}

function inboundPreview(prompt: string): AiActionPreview {
  const quantity = prompt.match(/\b(\d+[\d.,]*)\b/)?.[1] ?? "";
  return {
    id: randomUUID(),
    intent: "create_inventory_inbound",
    title: "Xem trước phiếu nhập",
    description: "Tôi nhận ra đây là yêu cầu nhập hàng. Cần kiểm tra sản phẩm, kho và NCC trước khi tạo phiếu.",
    confidence: quantity ? 0.78 : 0.62,
    state: quantity ? "preview" : "needs_input",
    confirmationRequired: true,
    strongConfirmation: true,
    entityType: "purchase_order",
    requiredFields: ["product", "quantity", "supplier", "warehouse"],
    missingFields: [
      "product",
      ...(quantity ? [] : ["quantity"]),
      "supplier",
      "warehouse",
    ],
    fields: [
      { label: "Số lượng đọc được", value: quantity || "Chưa rõ", tone: quantity ? "default" : "warning" },
      { label: "Kho", value: "Cần chọn", tone: "warning" },
      { label: "Nhà cung cấp", value: "Cần chọn", tone: "warning" },
    ],
    lines: [
      {
        label: "Sản phẩm từ câu lệnh",
        value: "Cần match catalog",
        meta: prompt,
        tone: "warning",
      },
    ],
    warnings: [
      "Nhập hàng thật sẽ tăng tồn kho và có thể cập nhật giá vốn.",
      "AI chưa được phép tự chọn sản phẩm/NCC/kho khi dữ liệu mơ hồ.",
    ],
    action: {
      type: "create_inventory_inbound",
      target: "inventoryInbound",
      payload: { prompt, quantity: quantity || null },
    },
  };
}

function pricePreview(prompt: string): AiActionPreview {
  const price = prompt.match(/(\d[\d.,]*)\s*(k|nghin|ngàn|₫|d|đ)?/i)?.[1] ?? "";
  return {
    id: randomUUID(),
    intent: "set_product_price",
    title: "Xem trước cập nhật giá",
    description: "Tôi nhận ra yêu cầu thiết lập giá. Cần match sản phẩm và bảng giá trước khi áp dụng.",
    confidence: 0.74,
    state: "needs_selection",
    confirmationRequired: true,
    entityType: "product_price",
    requiredFields: ["product", "price_book", "price"],
    missingFields: ["product", "price_book", ...(price ? [] : ["price"])],
    fields: [
      { label: "Giá đọc được", value: price || "Chưa rõ", tone: price ? "default" : "warning" },
      { label: "Sản phẩm", value: "Cần chọn", tone: "warning" },
      { label: "Bảng giá", value: "Cần chọn", tone: "warning" },
    ],
    lines: [],
    warnings: [
      "Giá mới sẽ được dùng tại POS sau khi xác nhận.",
      "Bulk price formula sẽ cần xác nhận mạnh hơn ở task riêng.",
    ],
    action: {
      type: "set_product_price",
      target: "pricing",
      payload: { prompt, price: price || null },
    },
  };
}

export function buildAiAssistantResponse(input: {
  prompt: string;
  revenue: unknown;
  collected: unknown;
  restock: RestockRow[];
  chartRows: unknown[];
}): AiAssistantResponse {
  const prompt = input.prompt.trim();
  const q = normalize(prompt);
  const asksRestock =
    q.includes("sap het") ||
    q.includes("restock") ||
    q.includes("goi y nhap") ||
    q.includes("khuyen nghi") ||
    q.includes("po nhap") ||
    q.includes("sku can nhap");
  const asksInbound =
    !asksRestock &&
    (q.includes("nhap ") || q.includes("nhap hang") || q.includes("receive"));
  const asksPrice =
    q.includes("gia") ||
    q.includes("price") ||
    q.includes("bang gia");

  const actionPreview = asksRestock
    ? restockPreview(prompt, input.restock)
    : asksInbound
      ? inboundPreview(prompt)
      : asksPrice
        ? pricePreview(prompt)
        : undefined;

  if (actionPreview) {
    return {
      text: actionPreview.description,
      state: actionPreview.state,
      prompt,
      actionPreview,
      actions: [
        { type: "open", target: actionPreview.action.target, label: "Open related screen" },
      ],
      chart: { type: "revenueByDay", rows: input.chartRows },
    };
  }

  return {
    text:
      `Doanh thu 30 ngày: ${moneyText(input.revenue)}. ` +
      `Đã thu: ${moneyText(input.collected)}. ` +
      `Có ${input.restock.length} mặt hàng cần theo dõi nhập lại.`,
    state: "succeeded",
    prompt,
    actions: [
      { type: "open", target: "reports", label: "Open reports" },
      { type: "open", target: "aiRestocking", label: "Review restocking" },
    ],
    chart: {
      type: "revenueByDay",
      rows: input.chartRows,
    },
  };
}
