import type { AiAssistantResponse } from "@/lib/ai/actions";
import type { ParsedAiAttachment } from "@/lib/ai/attachments";

const ATTACHMENT_META_PATTERN = /\[\d+\s+attachment\(s\):[^\]]+\]/gi;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAttachmentMeta(prompt: string) {
  return prompt.replace(ATTACHMENT_META_PATTERN, "").trim();
}

export function hasExplicitAttachmentAction(prompt: string) {
  const q = normalize(stripAttachmentMeta(prompt));
  if (!q) return false;

  const explicitPatterns = [
    /\b(tao|lap|them|create|make)\b.*\b(don|hoa don|bao gia|po|phieu nhap|gio pos|san pham|khach|ncc|nha cung cap)\b/,
    /\b(nhan hang|cong ton|receive stock|receive inventory)\b/,
    /\b(cap nhat|sua|doi|update|set|apply|ap)\b.*\b(gia|bang gia|ton|khach|san pham|ncc|nha cung cap)\b/,
    /\b(ghi|record)\b.*\b(thu|chi|thanh toan|payment)\b/,
    /\b(chuyen|convert)\b.*\b(bao gia|quote)\b/,
    /\b(tao gio pos|gio pos|pos image|pos voice)\b/,
  ];

  return explicitPatterns.some((pattern) => pattern.test(q));
}

export function shouldAskAttachmentNextAction(prompt: string, attachmentCount: number) {
  return attachmentCount > 0 && !hasExplicitAttachmentAction(prompt);
}

function attachmentSummary(attachments: ParsedAiAttachment[]) {
  const readable = attachments.filter((item) => item.extractedText.trim()).length;
  const failed = attachments.filter((item) => item.status === "failed").length;
  const avgConfidence = attachments.length
    ? Math.round(
        attachments.reduce((sum, item) => sum + item.confidence, 0) / attachments.length * 100,
      )
    : 0;

  if (failed === attachments.length) {
    return `Tôi đã nhận ${attachments.length} file nhưng chưa đọc được nội dung rõ ràng.`;
  }
  if (readable > 0) {
    return `Tôi đã đọc được ${readable}/${attachments.length} file, độ tin cậy khoảng ${avgConfidence}%.`;
  }
  return `Tôi đã nhận ${attachments.length} file đính kèm.`;
}

export function buildAttachmentNextActionResponse(input: {
  prompt: string;
  attachments: ParsedAiAttachment[];
}): AiAssistantResponse {
  const summary = attachmentSummary(input.attachments);
  return {
    text:
      `${summary} Bạn muốn tôi xử lý bước tiếp theo theo hướng nào? ` +
      "Ví dụ: tạo đơn bán/giỏ POS, tạo phiếu nhập hàng, cập nhật thông tin sau khi bạn chỉ rõ, hoặc chỉ trích xuất nội dung.",
    state: "needs_input",
    prompt: input.prompt,
    actions: [
      { type: "suggest_prompt", target: "assistant", label: "Tạo đơn bán từ ảnh" },
      { type: "suggest_prompt", target: "assistant", label: "Tạo phiếu nhập từ ảnh" },
      { type: "suggest_prompt", target: "assistant", label: "Chỉ trích xuất nội dung" },
    ],
  };
}
