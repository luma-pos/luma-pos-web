import { z } from "zod";
import { orderItemSchema } from "@/lib/schemas/order";

export const returnItemInputSchema = z.object({
  orderItemId: z.uuid(),
  quantity: z.number().positive(),
  restock: z.boolean().default(true),
});

export const createReturnSchema = z.object({
  orderId: z.uuid(),
  reason: z.string().min(1, { error: "validation.required" }),
  refundMethod: z.enum(["cash", "bank_transfer", "debt_deduct"]),
  note: z.string().optional(),
  items: z.array(returnItemInputSchema).min(1, { error: "returns.errors.emptyItems" }),
});

export type CreateReturnInput = z.input<typeof createReturnSchema>;
export type CreateReturnOutput = z.output<typeof createReturnSchema>;

export const createPosReturnSchema = z.object({
  orderId: z.uuid().optional(),
  customerId: z.uuid().nullable().optional(),
  warehouseId: z.uuid(),
  priceBookId: z.uuid().nullable().optional(),
  reason: z.string().min(1, { error: "validation.required" }),
  refundMethod: z.enum(["cash", "bank_transfer", "debt_deduct"]),
  note: z.string().optional(),
  items: z.array(orderItemSchema.extend({
    restock: z.boolean().default(true),
  })).min(1, { error: "returns.errors.emptyItems" }),
});

export type CreatePosReturnInput = z.input<typeof createPosReturnSchema>;
export type CreatePosReturnOutput = z.output<typeof createPosReturnSchema>;
