"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setUserLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/config";
import { Select } from "@/components/ui/select";

const LANGS: { code: Locale; label: string; flag: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="relative inline-block">
      <Select
        value={locale}
        disabled={pending}
        onChange={(e) => change(e.target.value as Locale)}
        size="sm"
        options={LANGS.map((l) => ({
          value: l.code,
          label: compact ? l.flag : `${l.flag}  ${l.label}`,
        }))}
        className="pl-8 cursor-pointer"
      />
      <Languages className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}
