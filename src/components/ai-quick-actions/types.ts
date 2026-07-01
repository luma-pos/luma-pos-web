"use client";

import type { AiActionPreview } from "@/lib/ai/actions";

export type AiQuickActionApplyMode = "merge" | "replace";

export type AiQuickActionPreset = "create_inventory_inbound" | "create_stocktake" | "pos_voice_cart_draft" | "pos_image_cart_draft";

export type AiQuickActionResult = {
  preview: AiActionPreview;
  mode: AiQuickActionApplyMode;
};
