"use client";

import { useEffect, useState, useTransition } from "react";
import { RotateCw, RefreshCw, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Code, Text } from "@/components/ui/text";

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

        <Text as="h2" size="xl" weight="bold" className="tracking-tight" text="Không tải được dữ liệu" />
        <Text as="p" variant="muted" className="mt-2 leading-relaxed">
          Máy chủ phản hồi chậm hoặc kết nối cơ sở dữ liệu bị gián đoạn. Thử lại sau giây lát —
          nếu vẫn lỗi, kiểm tra mạng hoặc cấu hình <Code text="DATABASE_URL" />.
        </Text>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            type="button"
            onClick={retry}
            disabled={busy}
          >
            <RotateCw className={`w-4 h-4 ${pending ? "animate-spin" : ""}`} />
            {pending ? "Đang thử lại…" : "Thử lại"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={hardReload}
            disabled={busy}
          >
            <RefreshCw className={`w-4 h-4 ${reloading ? "animate-spin" : ""}`} />
            Tải lại trang
          </Button>
        </div>

        {error.digest && (
          <Text as="p" variant="muted" className="mt-5 text-[11px] font-mono select-all" text={`mã lỗi: ${error.digest}`} />
        )}
      </div>
    </div>
  );
}
