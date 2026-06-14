"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, Check, Plus, Loader2 } from "lucide-react";
import { normalizeSearch } from "@/lib/normalize";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Select có ô tìm kiếm (combobox) — thay cho <select> native khi danh sách dài.
 * Bỏ dấu, không phân biệt hoa/thường khi lọc.
 * onCreate: nếu có, cho phép tạo mới một mục từ ô tìm (vd nhóm hàng/thương hiệu).
 */
export function Combobox({
  value, onChange, options, placeholder, className, allowClear = true, onCreate,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ComboOption[];
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  onCreate?: (name: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const nq = normalizeSearch(q);
  const filtered = nq ? options.filter((o) => normalizeSearch(`${o.label} ${o.hint ?? ""}`).includes(nq)) : options;
  const exact = options.some((o) => normalizeSearch(o.label) === nq);

  async function create() {
    if (!onCreate || !q.trim() || creating) return;
    setCreating(true);
    const id = await onCreate(q.trim());
    setCreating(false);
    if (id) { onChange(id); setOpen(false); setQ(""); }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQ(""); }}
        className="w-full pl-3 pr-9 py-2 text-sm text-left rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
      >
        <span className={cn("truncate", !selected && "text-slate-400")}>{selected ? selected.label : (placeholder ?? "—")}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 absolute right-2.5" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="relative border-b border-slate-100 dark:border-slate-800">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2 text-sm bg-transparent outline-none"
            />
          </div>
          <div className="max-h-64 overflow-auto py-1">
            {allowClear && (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">—</button>
            )}
            {onCreate && q.trim() && !exact && (
              <button type="button" onClick={create} disabled={creating} className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 font-medium">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm “{q.trim()}”
              </button>
            )}
            {filtered.length === 0 && !(onCreate && q.trim()) ? (
              <div className="px-3 py-3 text-sm text-slate-400 text-center">…</div>
            ) : filtered.slice(0, 200).map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn("w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800", o.value === value && "bg-primary-50 dark:bg-primary-950/40")}
              >
                <span className="min-w-0 truncate">{o.label}{o.hint && <span className="text-xs text-slate-400 ml-1">{o.hint}</span>}</span>
                {o.value === value && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
