import { redirect } from "next/navigation";

export default async function OrdersRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") usp.set(k, v);
  usp.set("tab", "orders");
  redirect(`/sales?${usp.toString()}`);
}
