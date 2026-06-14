"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Routes } from "@/lib/routes";

export function LogoutButton() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push(Routes.Login);
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
    >
      <LogOut className="w-4 h-4" />
      {t("auth.logout")}
    </button>
  );
}
