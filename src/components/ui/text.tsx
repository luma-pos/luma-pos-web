"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { resolveText, type TxProps } from "./_tx";

const textVariants = cva("", {
  variants: {
    variant: {
      default: "text-slate-900 dark:text-slate-100",
      muted: "text-slate-500 dark:text-slate-400",
      subtle: "text-slate-600 dark:text-slate-400",
      destructive: "text-red-600 dark:text-red-400",
      success: "text-emerald-600 dark:text-emerald-400",
      warning: "text-amber-600 dark:text-amber-400",
      info: "text-blue-600 dark:text-blue-400",
      accent: "text-primary-600",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
    weight: "normal",
    truncate: false,
  },
});

type AsTag = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "label" | "small" | "code";

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color" | "children">,
    VariantProps<typeof textVariants>,
    TxProps {
  as?: AsTag;
  children?: React.ReactNode;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as: Tag = "span", className, variant, size, weight, truncate, tx, txOptions, text, children, ...props }, ref) => {
    const t = useTranslations();
    const content = resolveText({ tx, txOptions, text, children }, t);
    const Component = Tag as keyof React.JSX.IntrinsicElements;
    return React.createElement(
      Component,
      {
        ref,
        className: cn(textVariants({ variant, size, weight, truncate, className })),
        ...props,
      },
      content
    );
  }
);
Text.displayName = "Text";

export const Heading = React.forwardRef<HTMLHeadingElement, TextProps>(
  ({ as = "h2", size = "2xl", weight = "bold", ...rest }, ref) => (
    <Text ref={ref} as={as} size={size} weight={weight} {...rest} />
  )
);
Heading.displayName = "Heading";

export const Muted = React.forwardRef<HTMLElement, Omit<TextProps, "variant">>(
  (props, ref) => <Text ref={ref} variant="muted" {...props} />
);
Muted.displayName = "Muted";

export const Code = React.forwardRef<HTMLElement, Omit<TextProps, "as">>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      as="code"
      className={cn(
        "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs",
        className
      )}
      {...props}
    />
  )
);
Code.displayName = "Code";
