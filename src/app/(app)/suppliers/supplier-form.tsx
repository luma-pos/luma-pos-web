"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierCreateDialog } from "@/components/partners/supplier-create-dialog";

export function SupplierQuickCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} tx="suppliers.createNew">
        <Plus className="w-4 h-4" />
      </Button>
      <SupplierCreateDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
