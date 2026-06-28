import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireRole, type Gate, type Role } from "@/lib/actions/common";

export async function requireMobileRole(roles: Role[]): Promise<Gate> {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!token) {
    return requireRole(roles);
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data, error } = await supabase.auth.getUser(token);
  const user = data.user;
  if (error || !user) {
    return { ok: false, error: "errors.unauthorized" };
  }

  const [profile] = await db
    .select({ role: profiles.role, isActive: profiles.isActive })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile && !profile.isActive) {
    return { ok: false, error: "errors.unauthorized" };
  }

  const role = profile?.role ?? "cashier";
  if (!roles.includes(role)) {
    return { ok: false, error: "errors.forbidden" };
  }

  return { ok: true, userId: user.id, role };
}

export const requireMobileSalesAccess = () =>
  requireMobileRole(["owner", "manager", "cashier"]);

export const requireMobileStockAccess = () =>
  requireMobileRole(["owner", "manager", "warehouse"]);

export const requireMobileManager = () =>
  requireMobileRole(["owner", "manager"]);

export const requireMobileOwner = () =>
  requireMobileRole(["owner"]);

export const requireMobileUser = () =>
  requireMobileRole(["owner", "manager", "cashier", "warehouse"]);
