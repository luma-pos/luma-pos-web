"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TxValues } from "./_tx";

export interface SectionProps {
  title?: React.ReactNode;
  titleTx?: string;
  titleTxOptions?: TxValues;
  description?: React.ReactNode;
  descriptionTx?: string;
  descriptionTxOptions?: TxValues;
  collapsible?: boolean;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Section({
  title, titleTx, titleTxOptions,
  description, descriptionTx, descriptionTxOptions,
  collapsible = true, defaultOpen = true, action, className, children,
}: SectionProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(defaultOpen);

  const titleContent = titleTx ? t(titleTx, titleTxOptions) : title;
  const descContent = descriptionTx ? t(descriptionTx, descriptionTxOptions) : description;

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl",
      className
    )}>
      <div
        className={cn(
          "flex items-center justify-between p-4",
          collapsible && "cursor-pointer select-none"
        )}
        onClick={collapsible ? () => setOpen(!open) : undefined}
      >
        <div className="flex-1 min-w-0">
          {titleContent && <div className="font-semibold">{titleContent}</div>}
          {descContent && (
            <div className="text-xs text-slate-500 mt-0.5">{descContent}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
          {collapsible && (
            <ChevronDown
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform",
                !open && "rotate-180"
              )}
            />
          )}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800/60">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
