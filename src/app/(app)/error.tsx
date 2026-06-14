"use client";

import { useEffect, useState, useTransition } from "react";
import { RotateCw, RefreshCw, ServerCrash } from "lucide-react";

/**
 * Bắt lỗi render (kể cả lỗi truy vấn DB ở server component) cho khu vực app —
 * hiển thị màn hình thử lại thay vì 500 trắng. Giúp app không "chết" khi DB
 * chập chờn (vd pooler serverless).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    console.error("App segment error:", error);
  }, [error]);

  const retry = () => startTransition(() => reset());
  const hardReload = () => { setReloading(true); window.location.reload(); };
  const busy = pending || reloading;

  return (
    <div className="min-h-[78vh] grid place-items-center p-6">
      <div className="w-full max-w-md text-center">
        {/* icon */}
        <div className="relative mx-auto mb-5 w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-red-100/70 dark:bg-red-950/40 blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/60 dark:to-red-900/40 ring-1 ring-red-200/70 dark:ring-red-900/60 grid place-items-center text-red-500">
            <ServerCrash className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-tight">Không tải được dữ liệu</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Máy chủ phản hồi chậm hoặc kết nối cơ sở dữ liệu bị gián đoạn. Thử lại sau giây lát —
          nếu vẫn lỗi, kiểm tra mạng hoặc cấu hình <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[12px]">DATABASE_URL</code>.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={retry}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-60"
          >
            <RotateCw className={`w-4 h-4 ${pending ? "animate-spin" : ""}`} />
            {pending ? "Đang thử lại…" : "Thử lại"}
          </button>
          <button
            onClick={hardReload}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${reloading ? "animate-spin" : ""}`} />
            Tải lại trang
          </button>
        </div>

        {error.digest && (
          <p className="mt-5 text-[11px] text-slate-400 font-mono select-all">mã lỗi: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
