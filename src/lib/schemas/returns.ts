import { z } from "zod";

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
