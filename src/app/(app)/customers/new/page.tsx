import { CustomerForm } from "./customer-form";

export default async function NewCustomerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <CustomerForm aiPreview={sp.source === "ai-preview"} />;
}
