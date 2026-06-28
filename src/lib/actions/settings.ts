"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { profiles, storeSettings } from "@/db/schema";
import {
  aiSettingsInputSchema,
  storeSettingsSchema,
  storePrefsPatchSchema,
  parseStorePrefs,
  STAFF_ROLES,
  type AiSettingsInput,
  type StoreSettingsInput,
  type StaffRole,
  type StorePrefsPatch,
} from "@/lib/schemas/settings";
import { writeAuditLog } from "@/lib/audit";
import { buildAiProviderConfig, completeAiText, completeAiVision } from "@/lib/ai/provider-adapter";
import { type ActionResult, requireManager, requireOwner } from "./common";
import { Routes } from "@/lib/routes";

type AiProviderTestKind = "text" | "vision";

type AiProviderTestResult = {
  kind: AiProviderTestKind;
  provider: string;
  textModel: string;
  visionModel: string;
  keyConfigured: boolean;
  textPlanning: boolean;
  visionOcr: boolean;
  ok: boolean;
  message: string;
  testedAt: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
};

function safeAiTestError(error: unknown) {
  const raw = error instanceof Error ? error.message : "provider_test_failed";
  if (raw === "missing_api_key") return "missing_api_key";
  if (raw.includes("unsupported_vision")) return "unsupported_vision";
  if (raw.includes("unsupported_text_planning")) return "unsupported_text_planning";
  return raw
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .slice(0, 220);
}

export async function updateStoreSettings(input: StoreSettingsInput): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return gate;
  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;
  try {
    await db.insert(storeSettings)
      .values({ id: "default", ...v })
      .onConflictDoUpdate({ target: storeSettings.id, set: { ...v, updatedAt: sql`now()` } });
    revalidatePath(Routes.Settings);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("updateStoreSettings failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

/** Cập nhật từng phần prefs (Thuế/Thanh toán/Thông báo/Phần cứng) — merge top-level. */
export async function updateStorePrefs(patch: StorePrefsPatch): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return gate;
  const parsed = storePrefsPatchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  try {
    const [row] = await db.select({ prefs: storeSettings.prefs }).from(storeSettings).where(eq(storeSettings.id, "default")).limit(1);
    const current = parseStorePrefs(row?.prefs);
    const next = { ...current, ...parsed.data };
    await db.insert(storeSettings)
      .values({ id: "default", prefs: next })
      .onConflictDoUpdate({ target: storeSettings.id, set: { prefs: next, updatedAt: sql`now()` } });
    revalidatePath(Routes.Settings);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("updateStorePrefs failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

export async function updateAiSettings(input: AiSettingsInput): Promise<ActionResult> {
  const gate = await requireOwner();
  if (!gate.ok) return gate;
  const parsed = aiSettingsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;
  try {
    const [row] = await db.select({ prefs: storeSettings.prefs }).from(storeSettings).where(eq(storeSettings.id, "default")).limit(1);
    const current = parseStorePrefs(row?.prefs);
    const nextKey = v.clearOpenaiApiKey
      ? ""
      : (v.openaiApiKey?.trim() || current.ai.openaiApiKey);
    const requested = input && typeof input === "object" ? input as Record<string, unknown> : {};
    const nextAi = {
      ...current.ai,
      provider: v.provider,
      textModel: v.textModel,
      visionModel: v.visionModel,
      openaiApiKey: nextKey,
      openaiApiKeySet: Boolean(nextKey),
      openaiVisionModel: v.visionModel,
      attachmentsBucket: v.attachmentsBucket,
      monthlyUsageLimit: typeof requested.monthlyUsageLimit === "number" ? v.monthlyUsageLimit : current.ai.monthlyUsageLimit,
    };
    const next = { ...current, ai: nextAi };
    await db.insert(storeSettings)
      .values({ id: "default", prefs: next })
      .onConflictDoUpdate({ target: storeSettings.id, set: { prefs: next, updatedAt: sql`now()` } });
    await writeAuditLog({
      actorUserId: gate.userId,
      source: "manual",
      action: "update_ai_settings",
      entityType: "store_settings",
      entityId: "default",
      status: "succeeded",
      before: {
        provider: current.ai.provider,
        textModel: current.ai.textModel,
        visionModel: current.ai.visionModel || current.ai.openaiVisionModel,
        openaiApiKeySet: Boolean(current.ai.openaiApiKey),
        openaiVisionModel: current.ai.openaiVisionModel,
        attachmentsBucket: current.ai.attachmentsBucket,
        monthlyUsageLimit: current.ai.monthlyUsageLimit,
      },
      after: {
        provider: nextAi.provider,
        textModel: nextAi.textModel,
        visionModel: nextAi.visionModel,
        openaiApiKeySet: Boolean(nextAi.openaiApiKey),
        openaiVisionModel: nextAi.openaiVisionModel,
        attachmentsBucket: nextAi.attachmentsBucket,
        monthlyUsageLimit: nextAi.monthlyUsageLimit,
      },
      metadata: { keyChanged: v.clearOpenaiApiKey || Boolean(v.openaiApiKey?.trim()) },
    });
    revalidatePath(Routes.Settings);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("updateAiSettings failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

export async function testAiProvider(input: AiSettingsInput, kind: AiProviderTestKind): Promise<ActionResult<AiProviderTestResult>> {
  const gate = await requireOwner();
  if (!gate.ok) return gate;
  if (kind !== "text" && kind !== "vision") return { ok: false, error: "errors.invalidData" };
  const parsed = aiSettingsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.invalidData" };
  const v = parsed.data;
  try {
    const [row] = await db.select({ prefs: storeSettings.prefs }).from(storeSettings).where(eq(storeSettings.id, "default")).limit(1);
    const current = parseStorePrefs(row?.prefs);
    const nextKey = v.clearOpenaiApiKey
      ? ""
      : (v.openaiApiKey?.trim() || current.ai.openaiApiKey);
    const config = buildAiProviderConfig({
      ...current.ai,
      provider: v.provider,
      textModel: v.textModel,
      visionModel: v.visionModel,
      openaiVisionModel: v.visionModel,
      openaiApiKey: nextKey,
      openaiApiKeySet: Boolean(nextKey),
      attachmentsBucket: v.attachmentsBucket,
      monthlyUsageLimit: v.monthlyUsageLimit,
    });
    const base: Omit<AiProviderTestResult, "ok" | "message" | "tokenUsage"> = {
      kind,
      provider: config.provider,
      textModel: config.textModel,
      visionModel: config.visionModel,
      keyConfigured: Boolean(config.apiKey),
      textPlanning: config.capabilities.textPlanning,
      visionOcr: config.capabilities.visionOcr,
      testedAt: new Date().toISOString(),
    };
    if (!config.apiKey) {
      return { ok: true, data: { ...base, ok: false, message: "missing_api_key" } };
    }
    if (kind === "text" && !config.capabilities.textPlanning) {
      return { ok: true, data: { ...base, ok: false, message: "unsupported_text_planning" } };
    }
    if (kind === "vision" && !config.capabilities.visionOcr) {
      return { ok: true, data: { ...base, ok: false, message: "unsupported_vision" } };
    }
    const completion = kind === "text"
      ? await completeAiText({
        config,
        messages: [
          { role: "system", text: "You are a health check endpoint. Reply with exactly OK." },
          { role: "user", text: "LumaPOS AI provider diagnostics ping." },
        ],
      })
      : await completeAiVision({
        config,
        prompt: "Return exactly OK if you can read this tiny image.",
        imageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lK3P1wAAAABJRU5ErkJggg==",
      });
    return {
      ok: true,
      data: {
        ...base,
        ok: true,
        message: completion.text.trim().slice(0, 80) || "ok",
        tokenUsage: completion.tokenUsage ? {
          inputTokens: completion.tokenUsage.inputTokens,
          outputTokens: completion.tokenUsage.outputTokens,
          totalTokens: completion.tokenUsage.totalTokens,
        } : undefined,
      },
    };
  } catch (error) {
    console.error("testAiProvider failed:", safeAiTestError(error));
    const config = buildAiProviderConfig({
      provider: v.provider,
      textModel: v.textModel,
      visionModel: v.visionModel,
      openaiApiKey: v.openaiApiKey?.trim() ?? "",
      openaiApiKeySet: Boolean(v.openaiApiKey?.trim()),
      openaiVisionModel: v.visionModel,
      attachmentsBucket: v.attachmentsBucket,
      monthlyUsageLimit: v.monthlyUsageLimit,
    });
    return {
      ok: true,
      data: {
        kind,
        provider: config.provider,
        textModel: config.textModel,
        visionModel: config.visionModel,
        keyConfigured: Boolean(config.apiKey),
        textPlanning: config.capabilities.textPlanning,
        visionOcr: config.capabilities.visionOcr,
        ok: false,
        message: safeAiTestError(error),
        testedAt: new Date().toISOString(),
      },
    };
  }
}

export async function updateStaffRole(id: string, role: StaffRole): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return gate;
  if (!STAFF_ROLES.includes(role)) return { ok: false, error: "errors.invalidData" };
  try {
    await db.update(profiles).set({ role }).where(eq(profiles.id, id));
    revalidatePath(Routes.Settings);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("updateStaffRole failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}

export async function setStaffActive(id: string, active: boolean): Promise<ActionResult> {
  const gate = await requireManager();
  if (!gate.ok) return gate;
  try {
    await db.update(profiles).set({ isActive: active }).where(eq(profiles.id, id));
    revalidatePath(Routes.Settings);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("setStaffActive failed:", e);
    return { ok: false, error: "errors.serverError" };
  }
}
