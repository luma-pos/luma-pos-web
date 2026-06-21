import {
  createMobileAuthClient,
  mobileAuthPayload,
} from "@/lib/mobile/auth-session";
import { mobileError, mobileOk, readJson } from "@/lib/mobile/response";

export async function POST(request: Request) {
  const body = await readJson(request);
  const refreshToken =
    body && typeof body === "object" && "refreshToken" in body
      ? String(body.refreshToken)
      : "";

  if (!refreshToken) {
    return mobileError("errors.invalidData");
  }

  const supabase = createMobileAuthClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return mobileError("errors.unauthorized", 401);
  }

  const payload = await mobileAuthPayload(data.session);
  if (!payload.ok) return mobileError(payload.error, 401);

  return mobileOk(payload.data);
}
