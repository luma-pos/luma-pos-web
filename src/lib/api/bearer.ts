import { createClient as createSbClient } from "@supabase/supabase-js";

/** Xác thực Bearer token Supabase từ request → trả userId hoặc null. */
export async function getUserIdFromBearer(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const sb = createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await sb.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}
