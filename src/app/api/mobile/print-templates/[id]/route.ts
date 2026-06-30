import { savePrintTemplate, setDefaultPrintTemplate, type SavePrintTemplateInput } from "@/lib/actions/print-templates";
import { requireMobileManager } from "@/lib/mobile/auth";
import { mobileAction, mobileGate, readJson } from "@/lib/mobile/response";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const { id } = await params;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return mobileAction({ ok: false, error: "errors.invalidData" });
  if ("makeDefault" in body) return mobileAction(await setDefaultPrintTemplate(id));
  return mobileAction(await savePrintTemplate({ ...(body as Record<string, unknown>), id } as SavePrintTemplateInput));
}
