import assert from "node:assert/strict";

const PROJ = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const {
  buildGeneralAssistantResponse,
  isAiReportSummaryPrompt,
} = await import(`${PROJ}/src/lib/ai/actions.ts`);

const response = buildGeneralAssistantResponse({
  prompt: "đang là AI đúng ko?",
  suggestedNextQuestion: "Bạn cần hỗ trợ gì liên quan đến quản lý bán hàng hoặc tồn kho?",
});

assert.equal(response.state, "succeeded");
assert.equal(response.actions.length, 0);
assert.match(response.text, /AI Assistant của LumaPOS/);
assert.doesNotMatch(response.text, /Doanh thu 30 ngày/);

assert.equal(isAiReportSummaryPrompt("Hôm nay bán được bao nhiêu?"), true);
assert.equal(isAiReportSummaryPrompt("Mặt hàng bán chạy nhất?"), true);
assert.equal(isAiReportSummaryPrompt("đang là AI đúng ko?"), false);

console.log("ai assistant general response tests passed");
