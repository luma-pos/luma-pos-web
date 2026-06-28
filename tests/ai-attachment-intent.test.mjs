import assert from "node:assert/strict";

const PROJ = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const {
  hasExplicitAttachmentAction,
  shouldAskAttachmentNextAction,
  buildAttachmentNextActionResponse,
} = await import(`${PROJ}/src/lib/ai/attachment-intent.ts`);

assert.equal(
  shouldAskAttachmentNextAction("Phân tích file đính kèm\n\n[1 attachment(s): image.png]", 1),
  true,
  "generic image upload asks for next action",
);
assert.equal(
  shouldAskAttachmentNextAction("upload phiếu nhập hàng\n\n[1 attachment(s): image.png]", 1),
  true,
  "uploading a purchase document is not enough to choose an action",
);
assert.equal(
  hasExplicitAttachmentAction("tạo phiếu nhập từ ảnh này\n\n[1 attachment(s): image.png]"),
  true,
  "explicit create-purchase command can continue to preview",
);
assert.equal(
  shouldAskAttachmentNextAction("cập nhật giá từ file này\n\n[1 attachment(s): image.png]", 1),
  false,
  "explicit pricing command can continue to preview",
);

const response = buildAttachmentNextActionResponse({
  prompt: "Phân tích file đính kèm\n\n[1 attachment(s): image.png]",
  attachments: [{
    name: "image.png",
    mimeType: "image/png",
    status: "succeeded",
    provider: "openai",
    extractedText: "HÓA ĐƠN BÁN HÀNG",
    candidates: [],
    confidence: 0.86,
    unresolvedItems: [],
    warnings: [],
  }],
});

assert.equal(response.state, "needs_input");
assert.equal(Boolean(response.actionPreview), false);
assert.match(response.text, /bước tiếp theo/);

console.log("ai attachment intent tests passed");
