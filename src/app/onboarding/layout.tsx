import { redirect } from "next/navigation";
import { requireUser } from "@/lib/actions/common";
import { Routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUser();
  } catch {
    redirect(Routes.Login);
  }
  return <div className="min-h-screen bg-canvas grid place-items-center p-4">{children}</div>;
}
