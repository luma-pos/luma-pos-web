"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push(Routes.Login);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      block
      onClick={logout}
      tx="auth.logout"
      className="justify-start px-3"
    >
      <LogOut className="w-4 h-4" />
    </Button>
  );
}
