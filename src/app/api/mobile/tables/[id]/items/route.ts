import { setTableCart } from "@/lib/actions/tables";
import { requireMobileSalesAccess } from "@/lib/mobile/auth";
import { mobileAction, mobileGate, readJson } from "@/lib/mobile/response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireMobileSalesAccess();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const { id } = await params;
  const body = await readJson(request);
  const items =
    body && typeof body === "object" && "items" in body
      ? (body as { items?: unknown }).items
      : body;

  return mobileAction(await setTableCart(id, items));
}
