import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getZaloConfig } from "@/lib/zalo/config";
import { logZaloWebhookEvent } from "@/lib/zalo/webhook";

function safeCompareHex(expected: string, signature: string | null) {
  if (!signature) return false;
  const normalized = signature.replace(/^sha256=/i, "");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(normalized, "hex");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function verifyZEventSignature(secret: string, body: string, event: Record<string, unknown>, signature: string | null) {
  const appId = readString(event.app_id) ?? readString(event.appId);
  const timestamp = readString(event.timestamp) ?? readString(event.timeStamp);
  if (!appId || !timestamp || !signature) return false;
  const compactBody = JSON.stringify(event);
  return [
    `${appId}${body}${timestamp}${secret}`,
    `${appId}${compactBody}${timestamp}${secret}`,
  ].some((payload) => safeCompareHex(sha256Hex(payload), signature));
}

function verifyLegacyHmacSignature(secret: string, body: string, signature: string | null) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return safeCompareHex(expected, signature);
}

export async function POST(request: Request) {
  const body = await request.text();
  const config = await getZaloConfig();
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body || "{}") as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "errors.invalidData" }, { status: 400 });
  }
  if (config.webhookSecret) {
    const zEventSignature = request.headers.get("x-zevent-signature");
    const legacySignature = request.headers.get("x-zalo-signature") ?? request.headers.get("x-hub-signature-256");
    const verified = verifyZEventSignature(config.webhookSecret, body, event, zEventSignature)
      || verifyLegacyHmacSignature(config.webhookSecret, body, legacySignature);
    if (!verified) return NextResponse.json({ ok: false, error: "errors.forbidden" }, { status: 403 });
  }
  try {
    const summary = await logZaloWebhookEvent(event);
    return NextResponse.json({ ok: true, received: true, logged: true, event: summary.eventName });
  } catch (error) {
    console.error("logZaloWebhookEvent failed:", error);
    return NextResponse.json({ ok: true, received: true, logged: false });
  }
}
