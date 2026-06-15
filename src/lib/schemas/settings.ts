import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z.string().max(200).default(""),
  address: z.string().max(300).default(""),
  phone: z.string().max(30).default(""),
  taxCode: z.string().max(30).default(""),
  industry: z.string().max(40).default("grocery"),
  currency: z.string().max(10).default("VND"),
  locale: z.string().max(10).default("vi-VN"),
});
export type StoreSettingsInput = z.input<typeof storeSettingsSchema>;

export const STAFF_ROLES = ["owner", "manager", "cashier", "warehouse"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
