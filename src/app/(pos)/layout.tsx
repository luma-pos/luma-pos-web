import { redirect } from "next/navigation";
import { requireUser } from "@/lib/actions/common";
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

  return <div className="h-screen overflow-hidden bg-canvas">{children}</div>;
}
