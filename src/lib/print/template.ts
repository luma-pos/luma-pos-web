import { db } from "@/db";
import { printTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  DEFAULT_OPTIONS, defaultTemplate,
  type PrintDocType, type PrintTemplate, type PrintTemplateOptions,
} from "./template-shared";

// Re-export phần dùng chung để các import cũ (@/lib/print/template) không phải đổi.
export {
  DEFAULT_OPTIONS, defaultTemplate, moneyToWords,
} from "./template-shared";
export type { PrintDocType, PaperSize, PrintTemplate, PrintTemplateOptions } from "./template-shared";

export async function getPrintTemplate(docType: PrintDocType): Promise<PrintTemplate> {
  const [row] = await db.select().from(printTemplates).where(eq(printTemplates.docType, docType)).limit(1);
  if (!row) return defaultTemplate(docType);
  return {
    docType,
    paperDefault: row.paperDefault,
    storeName: row.storeName,
    storeAddress: row.storeAddress,
    storePhone: row.storePhone,
    storeTaxCode: row.storeTaxCode,
    footerNote: row.footerNote,
    options: { ...DEFAULT_OPTIONS, ...(row.options as Partial<PrintTemplateOptions>) },
  };
}

export async function getAllPrintTemplates(): Promise<Record<PrintDocType, PrintTemplate>> {
  const rows = await db.select().from(printTemplates);
  const byType = new Map(rows.map((r) => [r.docType, r]));
  const result = {} as Record<PrintDocType, PrintTemplate>;
  for (const dt of ["order", "quote", "purchase", "return", "receipt"] as PrintDocType[]) {
    const row = byType.get(dt);
    result[dt] = row
      ? {
          docType: dt,
          paperDefault: row.paperDefault,
          storeName: row.storeName,
          storeAddress: row.storeAddress,
          storePhone: row.storePhone,
          storeTaxCode: row.storeTaxCode,
          footerNote: row.footerNote,
          options: { ...DEFAULT_OPTIONS, ...(row.options as Partial<PrintTemplateOptions>) },
        }
      : defaultTemplate(dt);
  }
  return result;
}
