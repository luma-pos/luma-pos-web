import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Routes } from "@/lib/routes";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? Routes.Dashboard : Routes.Login);
}
