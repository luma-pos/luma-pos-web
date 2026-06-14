import { notFound } from "next/navigation";
import { getSupplier, getSupplierPurchases } from "@/lib/data/partners";
import { SupplierDetailClient } from "./supplier-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  const [supplier, purchases] = await Promise.all([getSupplier(id), getSupplierPurchases(id)]);
  if (!supplier) notFound();
  return <SupplierDetailClient supplier={supplier} purchases={purchases} />;
}
