"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { createSupplier } from "@/lib/actions/partners";

export function SupplierQuickCreate() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    const res = await createSupplier({ name, phone: phone || undefined, taxCode: taxCode || undefined });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setName(""); setPhone(""); setTaxCode("");
      router.refresh();
    } else {
      setError(t(res.error as never));
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        tx="suppliers.createNew"
      >
        <Plus className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-end gap-2 bg-surface border border-border rounded-card p-3">
      <Field label={t("suppliers.cols.name")} required>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="w-48" />
      </Field>
      <Field label={t("customers.cols.phone")}>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-36" />
      </Field>
      <Field label={t("customers.fields.taxCode")}>
        <Input value={taxCode} onChange={(e) => setTaxCode(e.target.value)} className="w-32" />
      </Field>
      <Button type="button" onClick={submit} disabled={busy || !name.trim()} loading={busy} tx="common.save" />
      <Button type="button" variant="ghost" size="iconSm" onClick={() => setOpen(false)}><X className="w-4 h-4" /></Button>
      {error && <Text as="p" variant="destructive" size="xs" text={error} />}
    </div>
  );
}
