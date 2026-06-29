"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Heading } from "@/components/ui";
import { CustomerCreateForm } from "@/components/partners/customer-create-dialog";
import { Routes } from "@/lib/routes";

export function CustomerForm({ aiPreview = false }: { aiPreview?: boolean }) {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="iconSm" onClick={() => router.push(Routes.Customers)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Heading as="h1" size="lg" tx="customers.createNew" />
      </div>

      <div className="bg-surface border border-border rounded-card p-4 sm:p-6">
        <CustomerCreateForm
          aiPreview={aiPreview}
          onCancel={() => router.push(Routes.Customers)}
          onCreated={() => router.push(Routes.Customers)}
        />
      </div>
    </div>
  );
}
