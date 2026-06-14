"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TxValues } from "./_tx";

export interface TagInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  placeholderTx?: string;
  placeholderTxOptions?: TxValues;
  className?: string;
  disabled?: boolean;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ value, onChange, placeholder, placeholderTx, placeholderTxOptions, className, disabled }, ref) => {
    const t = useTranslations();
    const [draft, setDraft] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current!);

    const ph = placeholderTx ? t(placeholderTx, placeholderTxOptions) : placeholder;

    function add(raw: string) {
      const v = raw.trim();
      if (!v) return;
      if (value.includes(v)) return;
      onChange([...value, v]);
      setDraft("");
    }

    function remove(idx: number) {
      onChange(value.filter((_, i) => i !== idx));
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        add(draft);
      } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
        remove(value.length - 1);
      }
    }

    return (
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex flex-wrap items-center gap-1.5 min-h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5 cursor-text transition-colors focus-within:ring-2 focus-within:ring-primary-500",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {value.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-xs font-medium border border-primary-200"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(idx); }}
              disabled={disabled}
              className="hover:bg-primary-100 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && add(draft)}
          placeholder={value.length === 0 ? ph : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>
    );
  }
);
TagInput.displayName = "TagInput";
