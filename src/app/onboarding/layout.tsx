import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(Routes.Login);
  return <div className="min-h-screen bg-canvas grid place-items-center p-4">{children}</div>;
}
