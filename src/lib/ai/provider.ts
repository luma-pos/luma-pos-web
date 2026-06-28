import { getAiProviderSettings } from "@/lib/data/settings";
import type { AiTokenUsage } from "@/lib/ai/usage";

export type AiAttachmentCandidate = {
  text: string;
  sku?: string | null;
  unitName?: string | null;
  quantity?: number | null;
  unitCost?: number | null;
  grossUnitCost?: number | null;
  discount?: number | null;
  discountRate?: number | null;
  lineTotal?: number | null;
  confidence: number;
};

export type AiAttachmentParseResult = {
  provider: "none" | "openai";
  status: "succeeded" | "unavailable" | "failed";
  extractedText: string;
  candidates: AiAttachmentCandidate[];
  confidence: number;
  unresolvedItems: string[];
  warnings: string[];
  tokenUsage?: AiTokenUsage;
  raw?: unknown;
};

export type AiAttachmentProviderInput = {
  name: string;
  mimeType: string;
  bytes: Buffer;
  prompt?: string;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

async function loadProviderConfig() {
  const ai = await getAiProviderSettings();
  return {
    provider: process.env.AI_ATTACHMENT_PROVIDER || "openai",
    apiKey: ai.openaiApiKey || process.env.OPENAI_API_KEY || "",
    model: ai.openaiVisionModel || process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
  };
}

function fallbackResult(reason: string): AiAttachmentParseResult {
  return {
    provider: "none",
    status: "unavailable",
    extractedText: "",
    candidates: [],
    confidence: 0,
    unresolvedItems: [],
    warnings: [reason],
  };
}

function parseJsonText(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as Partial<AiAttachmentParseResult>;
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Partial<AiAttachmentParseResult>;
    } catch {
      return null;
    }
  }
}

function outputText(response: unknown) {
  if (!response || typeof response !== "object") return "";
  const root = response as { output_text?: unknown; output?: unknown };
  if (typeof root.output_text === "string") return root.output_text;
  const output = Array.isArray(root.output) ? root.output : [];
  return output
    .flatMap((item) => {
      const content = item && typeof item === "object" && "content" in item
        ? (item as { content?: unknown }).content
        : [];
      return Array.isArray(content) ? content : [];
    })
    .map((item) => item && typeof item === "object" && "text" in item ? String((item as { text?: unknown }).text ?? "") : "")
    .filter(Boolean)
    .join("\n");
}

function optionalNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function tokenUsageFromResponse(raw: unknown, model: string): AiTokenUsage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const usage = (raw as { usage?: unknown }).usage;
  if (!usage || typeof usage !== "object") return undefined;
  const root = usage as Record<string, unknown>;
  const inputTokens = Number(root.input_tokens ?? root.prompt_tokens ?? 0);
  const outputTokens = Number(root.output_tokens ?? root.completion_tokens ?? 0);
  const totalTokens = Number(root.total_tokens ?? inputTokens + outputTokens);
  if (!Number.isFinite(inputTokens) && !Number.isFinite(outputTokens) && !Number.isFinite(totalTokens)) {
    return undefined;
  }
  return {
    model,
    inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
    outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
  };
}

function normalizeProviderResult(raw: unknown, model: string): AiAttachmentParseResult {
  const text = outputText(raw);
  const parsed = parseJsonText(text);
  const tokenUsage = tokenUsageFromResponse(raw, model);
  if (!parsed) {
    return {
      provider: "openai",
      status: "succeeded",
      extractedText: text,
      candidates: [],
      confidence: text ? 0.5 : 0,
      unresolvedItems: [],
      warnings: text ? [] : ["Provider returned an empty response."],
      tokenUsage,
      raw,
    };
  }
  return {
    provider: "openai",
    status: "succeeded",
    extractedText: typeof parsed.extractedText === "string" ? parsed.extractedText : text,
    candidates: Array.isArray(parsed.candidates)
      ? parsed.candidates.map((candidate) => ({
          text: String((candidate as { text?: unknown }).text ?? ""),
          sku: typeof (candidate as { sku?: unknown }).sku === "string" ? String((candidate as { sku?: unknown }).sku).trim() : null,
          unitName: typeof (candidate as { unitName?: unknown }).unitName === "string" ? String((candidate as { unitName?: unknown }).unitName).trim() : null,
          quantity: Number.isFinite(Number((candidate as { quantity?: unknown }).quantity))
            ? Number((candidate as { quantity?: unknown }).quantity)
            : null,
          unitCost: optionalNumber((candidate as { unitCost?: unknown }).unitCost),
          grossUnitCost: optionalNumber((candidate as { grossUnitCost?: unknown }).grossUnitCost),
          discount: optionalNumber((candidate as { discount?: unknown }).discount),
          discountRate: optionalNumber((candidate as { discountRate?: unknown }).discountRate),
          lineTotal: optionalNumber((candidate as { lineTotal?: unknown }).lineTotal),
          confidence: Number.isFinite(Number((candidate as { confidence?: unknown }).confidence))
            ? Number((candidate as { confidence?: unknown }).confidence)
            : 0.5,
        })).filter((candidate) => candidate.text)
      : [],
    confidence: Number.isFinite(Number(parsed.confidence)) ? Number(parsed.confidence) : 0.5,
    unresolvedItems: Array.isArray(parsed.unresolvedItems) ? parsed.unresolvedItems.map(String) : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
    tokenUsage,
    raw,
  };
}

export async function aiAttachmentProviderStatus() {
  const config = await loadProviderConfig();
  return {
    provider: config.provider,
    configured: config.provider === "openai" && Boolean(config.apiKey),
    model: config.model,
  };
}

export async function parseAiAttachmentWithProvider(
  input: AiAttachmentProviderInput
): Promise<AiAttachmentParseResult> {
  const config = await loadProviderConfig();
  if (config.provider !== "openai") {
    return fallbackResult(`AI attachment provider "${config.provider}" is not supported yet.`);
  }
  if (!config.apiKey) {
    return fallbackResult("OPENAI_API_KEY is not configured, so attachment OCR/vision parsing is disabled.");
  }
  if (!input.mimeType.startsWith("image/")) {
    return fallbackResult("Only image OCR/vision provider parsing is configured right now.");
  }

  const imageUrl = `data:${input.mimeType};base64,${input.bytes.toString("base64")}`;
  const body = {
    model: config.model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Extract text from this Vietnamese business document image. Return compact JSON only with keys: " +
              "extractedText:string, candidates:[{text:string,sku:string|null,unitName:string|null,quantity:number|null,unitCost:number|null,grossUnitCost:number|null,discount:number|null,discountRate:number|null,lineTotal:number|null,confidence:number}], " +
              "confidence:number, unresolvedItems:string[], warnings:string[]. " +
              "Do not choose an inventory, sales, pricing, or accounting action. " +
              "For candidates, return one item per invoice/table product row. Use the product code under 'Mã Hàng' as sku. " +
              "Use net unit price after discount as unitCost when a 'Giá bán' column exists; keep grossUnitCost for 'Đơn giá'. " +
              "Do not invent products. Keep Vietnamese product names, document labels, quantities, units, prices, discounts, totals, supplier/header text, and codes as seen. " +
              (input.prompt ? `User prompt: ${input.prompt}` : ""),
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "high",
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        provider: "openai",
        status: "failed",
        extractedText: "",
        candidates: [],
        confidence: 0,
        unresolvedItems: [],
        warnings: [json?.error?.message ?? `OpenAI provider failed with ${response.status}`],
        raw: json,
      };
    }
    return normalizeProviderResult(json, config.model);
  } catch (error) {
    return {
      provider: "openai",
      status: "failed",
      extractedText: "",
      candidates: [],
      confidence: 0,
      unresolvedItems: [],
      warnings: [error instanceof Error ? error.message : "OpenAI provider request failed."],
    };
  }
}
