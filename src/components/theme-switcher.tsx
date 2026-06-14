"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, Check } from "lucide-react";
import { setTheme } from "@/lib/theme/cookie";
import { themes, themeMeta, type Theme } from "@/lib/theme/config";
import { useState, useRef, useEffect } from "react";

export function ThemeSwitcher({ current }: { current: Theme }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(t: Theme) {
    startTransition(async () => {
      // Optimistic: change html attribute immediately
      document.documentElement.setAttribute("data-theme", t);
      await setTheme(t);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
      >
        <Palette className="w-4 h-4" />
        <span className="flex-1 text-left">{themeMeta[current].label}</span>
        <span
          className="w-3.5 h-3.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-700"
          style={{ background: themeMeta[current].swatch }}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 z-50">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => pick(t)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
            >
              <span
                className="w-3.5 h-3.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-700 shrink-0"
                style={{ background: themeMeta[t].swatch }}
              />
              <span className="flex-1 text-left">{themeMeta[t].label}</span>
              {current === t && <Check className="w-3.5 h-3.5 text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
