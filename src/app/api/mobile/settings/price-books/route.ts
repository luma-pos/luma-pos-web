import {
  createPriceBook,
  deletePriceBook,
  renamePriceBook,
} from "@/lib/actions/price-books";
import { getPriceBooks } from "@/lib/data/price-books";
import { requireMobileManager } from "@/lib/mobile/auth";
import {
  mobileAction,
  mobileGate,
  mobileOk,
  readJson,
} from "@/lib/mobile/response";

export async function GET() {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  return mobileOk(await getPriceBooks());
}

export async function POST(request: Request) {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const body = await readJson(request);
  const name =
    body && typeof body === "object"
      ? String((body as { name?: unknown }).name ?? "")
      : "";

  return mobileAction(await createPriceBook(name));
}

export async function PATCH(request: Request) {
  const gate = await requireMobileManager();
  const blocked = mobileGate(gate);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return mobileAction({ ok: false, error: "errors.invalidData" });
  }

  const payload = body as { id?: unknown; name?: unknown; delete?: unknown };
  if (typeof payload.id !== "string") {
    return mobileAction({ ok: false, error: "errors.invalidData" });
  }

  if (payload.delete === true) {
    return mobileAction(await deletePriceBook(payload.id));
  }

  return mobileAction(await renamePriceBook(payload.id, String(payload.name ?? "")));
}
