"use client";

import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileSearch,
  FileText,
  PackagePlus,
  PencilLine,
  ReceiptText,
  ShoppingBag,
  SlidersHorizontal,
  Tags,
  ToggleLeft,
  Truck,
  Undo2,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { useTranslations } from "next-intl";
import type { AssistantActionPreset, AssistantActionPresetGroup, AssistantActionPresetId } from "./types";

type Translator = ReturnType<typeof useTranslations>;

type PresetDefinition = {
  id: AssistantActionPresetId;
  marker: string;
  placement: "primary" | "secondary";
  group: AssistantActionPresetGroup;
  icon: AssistantActionPreset["icon"];
  tone: AssistantActionPreset["tone"];
};

const PRESET_DEFINITIONS: PresetDefinition[] = [
  { id: "create_invoice", marker: "order_action", placement: "primary", group: "sales", icon: ReceiptText, tone: "sale" },
  { id: "draft_purchase_order", marker: "create_draft_purchase_order", placement: "primary", group: "inventory", icon: ShoppingBag, tone: "purchase" },
  { id: "create_inventory_inbound", marker: "create_inventory_inbound", placement: "primary", group: "inventory", icon: PackagePlus, tone: "inbound" },
  { id: "create_quote", marker: "order_action", placement: "primary", group: "sales", icon: FileText, tone: "sale" },
  { id: "find_invoice", marker: "order_action", placement: "secondary", group: "sales", icon: FileSearch, tone: "sale" },
  { id: "edit_invoice", marker: "order_action", placement: "secondary", group: "sales", icon: PencilLine, tone: "sale" },
  { id: "sales_order", marker: "order_action", placement: "secondary", group: "sales", icon: ReceiptText, tone: "sale" },
  { id: "check_stock", marker: "report_summary", placement: "secondary", group: "inventory", icon: Boxes, tone: "inbound" },
  { id: "create_stocktake", marker: "report_summary", placement: "secondary", group: "inventory", icon: ClipboardCheck, tone: "inbound" },
  { id: "adjust_stock", marker: "report_summary", placement: "secondary", group: "inventory", icon: SlidersHorizontal, tone: "inbound" },
  { id: "transfer_stock", marker: "report_summary", placement: "secondary", group: "inventory", icon: Truck, tone: "inbound" },
  { id: "create_product", marker: "product_command", placement: "secondary", group: "products", icon: Tags, tone: "inbound" },
  { id: "edit_product", marker: "product_command", placement: "secondary", group: "products", icon: PencilLine, tone: "inbound" },
  { id: "update_product_price", marker: "set_product_price", placement: "secondary", group: "products", icon: Tags, tone: "purchase" },
  { id: "toggle_product_active", marker: "product_command", placement: "secondary", group: "products", icon: ToggleLeft, tone: "purchase" },
  { id: "create_customer", marker: "customer_action", placement: "secondary", group: "partners", icon: UserPlus, tone: "sale" },
  { id: "create_supplier", marker: "customer_action", placement: "secondary", group: "partners", icon: UserPlus, tone: "purchase" },
  { id: "check_customer_debt", marker: "report_summary", placement: "secondary", group: "partners", icon: Users, tone: "sale" },
  { id: "record_supplier_payment", marker: "cashbook_action", placement: "secondary", group: "partners", icon: WalletCards, tone: "purchase" },
  { id: "today_sales_report", marker: "report_summary", placement: "secondary", group: "reports", icon: BarChart3, tone: "sale" },
  { id: "best_sellers_report", marker: "report_summary", placement: "secondary", group: "reports", icon: BarChart3, tone: "sale" },
  { id: "low_stock_report", marker: "report_summary", placement: "secondary", group: "reports", icon: Boxes, tone: "inbound" },
  { id: "customer_purchase_report", marker: "report_summary", placement: "secondary", group: "reports", icon: Users, tone: "sale" },
  { id: "customer_profit_report", marker: "report_summary", placement: "secondary", group: "reports", icon: Users, tone: "sale" },
  { id: "slow_moving_stock_report", marker: "report_summary", placement: "secondary", group: "reports", icon: Undo2, tone: "inbound" },
];

export function getAssistantActionPresets(t: Translator): AssistantActionPreset[] {
  return PRESET_DEFINITIONS.map((definition) => ({
    id: definition.id,
    placement: definition.placement,
    group: definition.group,
    label: t(`ai.actions.${definition.id}.label`),
    sessionTitle: t(`ai.actions.${definition.id}.sessionTitle`),
    description: t(`ai.actions.${definition.id}.description`),
    emptyText: t(`ai.actions.${definition.id}.emptyText`),
    placeholder: t(`ai.actions.${definition.id}.placeholder`),
    promptPrefix: `[AI_ACTION_PRESET:${definition.marker}]\n${t(`ai.actions.${definition.id}.promptInstruction`)}\n\n${t("ai.actions.userInformation")}:`,
    examples: [
      t(`ai.actions.${definition.id}.example1`),
      t(`ai.actions.${definition.id}.example2`),
    ],
    icon: definition.icon,
    tone: definition.tone,
  }));
}
