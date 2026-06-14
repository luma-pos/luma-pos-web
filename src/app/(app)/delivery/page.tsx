import { notFound } from "next/navigation";

/**
 * Điều xe / giao hàng — TẠM TẮT theo yêu cầu.
 * Code đầy đủ vẫn còn trong git history (commit 1f1dc75, fix ở 5d5d70f):
 * actions tại src/lib/actions/delivery.ts + widgets tại ./trip-widgets.tsx vẫn giữ nguyên.
 * Bật lại: khôi phục page này từ git + thêm lại mục Giao hàng vào src/components/app-nav.tsx.
 */
export default function DeliveryPageDisabled() {
  notFound();
}
