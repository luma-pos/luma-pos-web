import { db } from "@/db";
import { printTemplates } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  DEFAULT_OPTIONS, PRINT_DOC_TYPES, defaultTemplate,
  type PrintDocType, type PrintTemplate, type PrintTemplateOptions,
} from "./template-shared";

// Re-export phần dùng chung để các import cũ (@/lib/print/template) không phải đổi.
export {
  DEFAULT_OPTIONS, PAPER_SIZES, PRINT_DOC_TYPES, defaultTemplate, isPersistedTemplateId, moneyToWords,
} from "./template-shared";
export type { PrintDocType, PaperSize, PrintTemplate, PrintTemplateOptions } from "./template-shared";

function mapTemplateRow(row: typeof printTemplates.$inferSelect): PrintTemplate {
  return {
    id: row.id,
    name: row.name,
    docType: row.docType,
    paperDefault: row.paperDefault,
    isDefault: row.isDefault,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    storeName: row.storeName,
    storeAddress: row.storeAddress,
    storePhone: row.storePhone,
    storeTaxCode: row.storeTaxCode,
    footerNote: row.footerNote,
    options: { ...DEFAULT_OPTIONS, ...(row.options as Partial<PrintTemplateOptions>) },
  };
}

export async function getPrintTemplate(docType: PrintDocType, templateId?: string | null): Promise<PrintTemplate> {
  if (templateId && !templateId.startsWith("default-")) {
    const [selected] = await db
      .select()
      .from(printTemplates)
      .where(and(eq(printTemplates.id, templateId), eq(printTemplates.docType, docType), eq(printTemplates.isActive, true)))
      .limit(1);
    if (selected) return mapTemplateRow(selected);
  }

  const [row] = await db
    .select()
    .from(printTemplates)
    .where(and(eq(printTemplates.docType, docType), eq(printTemplates.isActive, true)))
    .orderBy(desc(printTemplates.isDefault), asc(printTemplates.sortOrder), asc(printTemplates.name))
    .limit(1);
  return row ? mapTemplateRow(row) : defaultTemplate(docType);
}

export async function getPrintTemplatesForDoc(docType: PrintDocType): Promise<PrintTemplate[]> {
  const rows = await db
    .select()
    .from(printTemplates)
    .where(and(eq(printTemplates.docType, docType), eq(printTemplates.isActive, true)))
    .orderBy(desc(printTemplates.isDefault), asc(printTemplates.sortOrder), asc(printTemplates.name));
  return rows.length > 0 ? rows.map(mapTemplateRow) : [defaultTemplate(docType)];
}

export async function getAllPrintTemplates(): Promise<PrintTemplate[]> {
  const rows = await db
    .select()
    .from(printTemplates)
    .orderBy(asc(printTemplates.docType), desc(printTemplates.isDefault), asc(printTemplates.sortOrder), asc(printTemplates.name));
  const templates = rows.map(mapTemplateRow);
  const hasDocType = new Set(templates.map((template) => template.docType));
  for (const docType of PRINT_DOC_TYPES) {
    if (!hasDocType.has(docType)) templates.push(defaultTemplate(docType));
  }
  return templates;
}
