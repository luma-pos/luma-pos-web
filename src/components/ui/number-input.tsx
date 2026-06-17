"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "./input";
import { Text } from "./text";

export interface NumberInputProps
  extends Omit<InputProps, "type" | "value" | "onChange" | "defaultValue"> {
  value?: number | null;
  defaultValue?: number;
  onChange?: (value: number | null) => void;
  /** Show thousand separators (1,000,000) */
  thousandSeparator?: boolean;
  /** Suffix text (e.g. "đ", "%", "kg") */
  suffix?: string;
  /** Prefix text */
  prefix?: string;
  min?: number;
  max?: number;
  decimals?: number;
}

const formatNumber = (val: number, sep: boolean, decimals = 0): string => {
  if (sep) {
    return new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(val);
  }
  return decimals > 0 ? val.toFixed(decimals) : String(val);
};

const parseNumber = (str: string): number | null => {
  const cleaned = str.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "-") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, defaultValue, onChange, thousandSeparator = true, suffix, prefix, min, max, decimals = 0, className, ...props }, ref) => {
    const [text, setText] = React.useState<string>(
      value != null ? formatNumber(value, thousandSeparator, decimals) :
      defaultValue != null ? formatNumber(defaultValue, thousandSeparator, decimals) : ""
    );

    React.useEffect(() => {
      if (value != null) {
        setText(formatNumber(value, thousandSeparator, decimals));
      } else if (value === null) {
        setText("");
      }
    }, [value, thousandSeparator, decimals]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      setText(raw);
      const parsed = parseNumber(raw);

      if (parsed !== null) {
        if (min != null && parsed < min) return onChange?.(min);
        if (max != null && parsed > max) return onChange?.(max);
      }
      onChange?.(parsed);
    }

    function handleBlur() {
      const parsed = parseNumber(text);
      if (parsed !== null) {
        setText(formatNumber(parsed, thousandSeparator, decimals));
      } else {
        setText("");
      }
    }

    return (
      <div className="relative">
        {prefix && (
          <Text as="span" variant="muted" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" text={prefix} />
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            prefix && "pl-7",
            suffix && "pr-10",
            "text-right tabular-nums",
            className
          )}
          {...props}
        />
        {suffix && (
          <Text as="span" variant="muted" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" text={suffix} />
        )}
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";
