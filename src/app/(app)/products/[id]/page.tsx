import { redirect } from "next/navigation";
import { Routes } from "@/lib/routes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(Routes.product(id));
}
