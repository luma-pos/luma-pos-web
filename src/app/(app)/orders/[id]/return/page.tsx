import { notFound } from "next/navigation";
import { getOrder } from "@/lib/data/orders";
import { ReturnForm } from "./return-form";

export default async function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id).catch(() => null);
  if (!order || order.status === "cancelled") notFound();

  return (
    <ReturnForm
      orderId={order.id}
      orderCode={order.code}
      customerName={order.customerName}
      customerDebt={Number(order.customerDebt ?? 0)}
      hasCustomer={!!order.customerId}
      items={order.items.map((i) => ({
        orderItemId: i.id,
        productName: i.productName,
        unitName: i.unitName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        returned: order.returnedByItem[i.id] ?? 0,
      }))}
    />
  );
}
