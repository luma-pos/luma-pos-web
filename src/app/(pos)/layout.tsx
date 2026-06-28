import { redirect } from "next/navigation";
import { AiAssistantLauncher } from "@/components/ai-assistant-launcher";
import { requireUser } from "@/lib/actions/common";
import { getStoreSettings } from "@/lib/data/settings";
import { Routes } from "@/lib/routes";

/**
 * Layout riêng cho màn bán hàng — full màn hình, KHÔNG có sidebar quản trị
 * (giống KiotViet). Vẫn yêu cầu đăng nhập.
 */
export default async function PosLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUser();
  } catch {
    redirect(Routes.Login);
  }
  const store = await getStoreSettings();

  return (
    <div className="h-dvh overflow-hidden bg-canvas">
      {children}
      {store.prefs.ai.openaiApiKeySet && <AiAssistantLauncher surface="pos" />}
    </div>
  );
}
