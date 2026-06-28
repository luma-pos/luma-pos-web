import { loadAiProviderConfig } from "@/lib/ai/provider-adapter";
import { mobileError } from "@/lib/mobile/response";

export const AI_NOT_CONFIGURED_ERROR = "ai.provider.not_configured";

export async function isAiProviderConfigured() {
  const config = await loadAiProviderConfig();
  return Boolean(config.apiKey);
}

export async function requireAiProviderConfigured() {
  return (await isAiProviderConfigured())
    ? null
    : mobileError(AI_NOT_CONFIGURED_ERROR, 404);
}
