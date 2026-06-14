import type React from "react";

export type TxValues = Record<string, string | number | Date>;

export type TxProps = {
  /** i18n key. Resolved via useTranslations(). Takes priority over `text` and `children`. */
  tx?: string;
  /** ICU values / interpolation options for `tx`. */
  txOptions?: TxValues;
  /** Plain text fallback. Used when `tx` is not provided. */
  text?: React.ReactNode;
};

/**
 * Resolve text content: tx > text > children.
 * `t` is the translator from useTranslations().
 */
export function resolveText(
  props: TxProps & { children?: React.ReactNode },
  t: (key: string, values?: TxValues) => string
): React.ReactNode {
  if (props.tx) return t(props.tx, props.txOptions);
  if (props.text !== undefined) return props.text;
  return props.children;
}
