import type { ReactNode } from "react";
import { Text } from "@/components/ui/text";

/** Thanh header trang theo design (topbar trắng, sticky, title trái + actions phải). */
export function PageHeader({
  title, badge, children,
}: { title: ReactNode; badge?: ReactNode; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 min-h-[58px] bg-surface border-b border-border px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap">
      <Text as="h1" size="base" weight="bold" className="text-[17px]" text={title} />
      {badge}
      <div className="flex-1" />
      {children}
    </header>
  );
}
