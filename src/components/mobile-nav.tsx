"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mở/đóng drawer điều hướng trên mobile qua data-mobilenav trên <html>. */
function setMobileNav(open: boolean) {
  document.documentElement.dataset.mobilenav = open ? "open" : "";
}

export function MobileNavButton() {
  return (
    <Button type="button" variant="ghost" size="iconSm" onClick={() => setMobileNav(true)} className="-ml-1" aria-label="menu">
      <Menu className="w-5 h-5" />
    </Button>
  );
}

/** Nền mờ phía sau drawer — bấm để đóng (chỉ hiện khi mở trên mobile). */
export function MobileNavBackdrop() {
  return <div onClick={() => setMobileNav(false)} className="mobile-nav-backdrop fixed inset-0 z-[55] bg-black/40 lg:hidden" />;
}
