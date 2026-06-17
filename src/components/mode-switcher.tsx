"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import { setMode } from "@/lib/theme/cookie";
import { modes, type Mode } from "@/lib/theme/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

/** DOM mutation tách ra module-scope cho react-compiler. */
function applyDomMode(resolved: "light" | "dark") {
  document.documentElement.setAttribute("data-mode", resolved);
}

export function ModeSwitcher({ current }: { current: Mode }) {
  const t = useTranslations();
  const router = useRouter();
  const [active, setActive] = useState<Mode>(current);
  const [, startTransition] = useTransition();

  function pick(m: Mode) {
    setActive(m);
    // áp ngay không chờ server (system → resolve theo OS)
    const resolved = m === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : m;
    applyDomMode(resolved);
    startTransition(async () => {
      await setMode(m);
      router.refresh();
    });
  }

  return (
    <div className="flex bg-surface-2 rounded-lg p-0.5 gap-0.5">
      {modes.map((m) => {
        const Icon = ICONS[m];
        return (
          <Button
            key={m}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => pick(m)}
            title={t(`theme.mode.${m}`)}
            className={cn(
              "flex-1 h-8 px-2 rounded-md text-xs font-medium",
              active === m
                ? "bg-surface text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </Button>
        );
      })}
    </div>
  );
}
