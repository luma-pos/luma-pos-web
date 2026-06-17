"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Form, FormField, Section, Input, NumberInput, Select, Button,
  Field, Heading, Textarea,
} from "@/components/ui";
import { Routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { createProductSchema, type CreateProductInput, type CreateProductOutput } from "./schema";
import { MultiUnitField } from "./multi-unit-field";
import { AttributesField } from "./attributes-field";
import { createProduct, updateProduct, createCategory, createBrand } from "@/lib/actions/products";
import { Combobox } from "@/components/combobox";
import type { ProductFormOptions } from "@/lib/data/products";

type Tab = "info" | "description" | "variants";

const useFormCtx = () => useFormContext<CreateProductInput>();

export interface NewProductFormProps {
  categories: ProductFormOptions["categories"];
  brands: ProductFormOptions["brands"];
  suppliers?: ProductFormOptions["suppliers"]; // NCC tự gắn khi nhập hàng, không sửa ở form
  mode?: "create" | "edit";
  productId?: string;
  initialValues?: Partial<CreateProductInput>;
}

export function NewProductForm({ categories, brands, mode = "create", productId, initialValues }: NewProductFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const isEdit = mode === "edit";

  const form = useForm<CreateProductInput, unknown, CreateProductOutput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: "",
      barcode: "",
      name: "",
      categoryId: "",
      brandId: "",
      imageUrls: [],
      costPrice: 0,
      retailPrice: 0,
      initialStock: 0,
      minLevel: 0,
      maxLevel: 999_999_999,
      weightUnit: "kg",
      dimUnit: "mm",
      baseUnit: "cái",
      units: [],
      attributes: [],
      directSale: true,
      ...initialValues,
    },
  });

  async function onSubmit(values: CreateProductOutput) {
    if (isEdit && productId) {
      const specs = values.attributes.length > 0
        ? Object.fromEntries(values.attributes.filter((a) => a.name.trim()).map((a) => [a.name, a.values]))
        : null;
      const res = await updateProduct({
        id: productId,
        sku: values.sku?.trim() || "",
        barcode: values.barcode,
        name: values.name,
        categoryId: values.categoryId,
        brandId: values.brandId,
        baseUnit: values.baseUnit,
        costPrice: values.costPrice,
        retailPrice: values.retailPrice,
        wholesalePrice: values.wholesalePrice ?? null,
        contractorPrice: values.contractorPrice ?? null,
        agentPrice: values.agentPrice ?? null,
        location: values.location,
        description: values.description,
        isActive: values.directSale,
        specs,
        units: values.units.map((u) => ({
          unitName: u.unitName, multiplier: u.multiplier, barcode: u.barcode, priceOverride: u.priceOverride ?? null,
        })),
      });
      if (res.ok) { router.push(Routes.product(productId)); router.refresh(); return; }
      form.setError("root", { message: res.error });
      return;
    }
    const res = await createProduct(values);
    if (res.ok) {
      router.push(Routes.Products);
      return;
    }
    form.setError("root", { message: res.error });
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="min-h-dvh flex flex-col bg-slate-50 dark:bg-slate-950 space-y-0">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="iconSm" onClick={() => router.push(Routes.Products)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Heading as="h1" size="lg" tx={isEdit ? "products.editTitle" : "products.create"} />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              {...form.register("directSale")}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span>{t("products.directSale")}</span>
          </label>
          <Button type="button" variant="outline" onClick={() => router.push(isEdit && productId ? Routes.product(productId) : Routes.Products)} tx="common.cancel" />
          {!isEdit && <Button type="submit" variant="secondary" tx="products.saveAndCreate" />}
          <Button type="submit" loading={form.formState.isSubmitting} tx="common.save" />
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6">
        <div className="flex gap-6 overflow-x-auto">
          {(["info", "variants", "description"] as Tab[]).map((tk) => (
            <button
              key={tk}
              type="button"
              onClick={() => setTab(tk)}
              className={cn(
                "py-3 text-sm font-medium border-b-2 transition-colors",
                tab === tk
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              {t(`products.tabs.${tk}`)}
            </button>
          ))}
        </div>
      </div>

      {form.formState.errors.root && (
        <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 px-4 sm:px-6 py-2 text-sm text-red-700 dark:text-red-400">
          {t(form.formState.errors.root.message ?? "errors.serverError")}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-4">
        {tab === "info" && <InfoTab categories={categories} brands={brands} />}
        {tab === "variants" && <VariantsTab />}
        {tab === "description" && <DescriptionTab />}
      </div>
    </Form>
  );
}

function InfoTab({ categories, brands, suppliers }: NewProductFormProps) {
  return (
    <>
      <BasicInfoSection categories={categories} brands={brands} suppliers={suppliers} />
      <Section titleTx="products.sections.pricing" descriptionTx="products.sections.pricingDesc">
        <PricingFields />
      </Section>
      <Section titleTx="products.sections.stock" descriptionTx="products.sections.stockDesc">
        <StockFields />
      </Section>
      <Section titleTx="products.sections.physical" descriptionTx="products.sections.physicalDesc">
        <PhysicalFields />
      </Section>
    </>
  );
}

function DescriptionTab() {
  const { register } = useFormCtx();
  return (
    <div className="space-y-4">
      <Section titleTx="products.description.main" collapsible={false}>
        <Textarea {...register("description")} rows={8} />
      </Section>
      <Section titleTx="products.description.invoiceNote" collapsible={false}>
        <Textarea {...register("invoiceNote")} rows={4} />
      </Section>
    </div>
  );
}

function VariantsTab() {
  return (
    <div className="space-y-4">
      <Section titleTx="products.sections.units" descriptionTx="products.sections.unitsDesc" collapsible={false}>
        <MultiUnitField />
      </Section>
      <Section titleTx="products.sections.attributes" descriptionTx="products.sections.attributesDesc" collapsible={false}>
        <AttributesField />
      </Section>
    </div>
  );
}

function BasicInfoSection({ categories, brands }: NewProductFormProps) {
  const t = useTranslations();
  const { register, watch, setValue } = useFormCtx();
  const [extraCats, setExtraCats] = useState<{ id: string; name: string }[]>([]);
  const [extraBrands, setExtraBrands] = useState<{ id: string; name: string }[]>([]);

  return (
    <Section title="" collapsible={false}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field labelTx="products.fields.sku">
              <Input {...register("sku")} placeholderTx="products.fields.skuPlaceholder" />
            </Field>
            <Field labelTx="products.fields.barcode">
              <Input {...register("barcode")} placeholderTx="products.fields.barcodePlaceholder" />
            </Field>
          </div>

          <FormField name="name" labelTx="products.fields.name" required>
            {(field) => <Input {...field} placeholderTx="products.fields.namePlaceholder" />}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField name="categoryId" labelTx="products.fields.category" required>
              {(field) => (
                <Combobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  allowClear={false}
                  placeholder={t("products.fields.categoryPlaceholder")}
                  options={[...categories, ...extraCats].map((c) => ({ value: c.id, label: c.name }))}
                  onCreate={async (name) => { const r = await createCategory(name); if (r.ok) { setExtraCats((x) => [...x, r.data]); return r.data.id; } return null; }}
                />
              )}
            </FormField>
            <Field labelTx="products.fields.brand">
              <Combobox
                value={watch("brandId") ?? ""}
                onChange={(v) => setValue("brandId", v)}
                placeholder={t("products.fields.brandPlaceholder")}
                options={[...brands, ...extraBrands].map((b) => ({ value: b.id, label: b.name }))}
                onCreate={async (name) => { const r = await createBrand(name); if (r.ok) { setExtraBrands((x) => [...x, r.data]); return r.data.id; } return null; }}
              />
            </Field>
          </div>
        </div>

        <ImageUploadGrid />
      </div>
    </Section>
  );
}

const MAX_IMAGES = 5;

/** Tên file ngẫu nhiên cho ảnh upload (ngoài render scope — tránh lint react-compiler). */
function randomImagePath(fileName: string): string {
  const ext = fileName.split(".").pop() || "jpg";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function ImageUploadGrid() {
  const t = useTranslations();
  const { watch, setValue } = useFormCtx();
  const urls: string[] = watch("imageUrls") ?? [];
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setErr("");
    setUploading(true);
    try {
      const supabase = createClient();
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, MAX_IMAGES - urls.length)) {
        const path = randomImagePath(file.name);
        const { error } = await supabase.storage.from("products").upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("products").getPublicUrl(path);
        added.push(data.publicUrl);
      }
      setValue("imageUrls", [...urls, ...added], { shouldDirty: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("products.fields.imageUploadError"));
    } finally {
      setUploading(false);
    }
  }

  const remove = (u: string) => setValue("imageUrls", urls.filter((x) => x !== u), { shouldDirty: true });

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {urls.map((u, i) => (
          <div
            key={u}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group",
              i === 0 && "col-span-2"
            )}
          >
            <Image src={u} alt="" fill sizes="240px" className="object-cover" unoptimized />
            {i === 0 && (
              <span className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {t("products.fields.primaryImage")}
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(u)}
              className="absolute top-1 right-1 grid place-items-center w-6 h-6 rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100 transition"
              aria-label={t("common.delete")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {urls.length < MAX_IMAGES && (
          <label
            className={cn(
              "aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-primary-500 transition text-slate-400",
              urls.length === 0 && "col-span-2"
            )}
          >
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
            <span className="text-xs">{t("products.fields.addImage")}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => { upload(e.target.files); e.target.value = ""; }}
              className="hidden"
            />
          </label>
        )}
      </div>
      {err ? (
        <p className="text-xs text-red-600 mt-2">{err}</p>
      ) : (
        <p className="text-xs text-slate-500 mt-2">{t("products.fields.imageHint")}</p>
      )}
    </div>
  );
}

function PricingFields() {
  const t = useTranslations();
  const { setValue, watch } = useFormCtx();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Field labelTx="products.pricing.costPrice">
        <NumberInput value={watch("costPrice")} onChange={(v) => setValue("costPrice", v ?? 0)} suffix="đ" min={0} />
      </Field>
      <Field labelTx="products.pricing.retailPrice">
        <NumberInput value={watch("retailPrice")} onChange={(v) => setValue("retailPrice", v ?? 0)} suffix="đ" min={0} />
      </Field>
      <p className="md:col-span-2 lg:col-span-3 text-xs text-slate-500">{t("products.pricing.priceBookHint")}</p>
    </div>
  );
}

function StockFields() {
  const { setValue, watch } = useFormCtx();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Field labelTx="products.stock.current">
        <NumberInput value={watch("initialStock")} onChange={(v) => setValue("initialStock", v ?? 0)} min={0} />
      </Field>
      <Field labelTx="products.stock.min">
        <NumberInput value={watch("minLevel")} onChange={(v) => setValue("minLevel", v ?? 0)} min={0} />
      </Field>
      <Field labelTx="products.stock.max">
        <NumberInput value={watch("maxLevel")} onChange={(v) => setValue("maxLevel", v ?? 999_999_999)} min={0} />
      </Field>
    </div>
  );
}

function PhysicalFields() {
  const t = useTranslations();
  const { register, setValue, watch } = useFormCtx();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field labelTx="products.physical.location">
          <Input {...register("location")} placeholderTx="products.physical.locationPlaceholder" />
        </Field>
        <Field labelTx="products.physical.weight">
          <div className="flex gap-2">
            <NumberInput
              value={watch("weight") ?? null}
              onChange={(v) => setValue("weight", v)}
              min={0}
              decimals={3}
              className="flex-1"
            />
            <Select
              {...register("weightUnit")}
              className="w-20"
              options={[
                { value: "g", label: "g" },
                { value: "kg", label: "kg" },
              ]}
            />
          </div>
        </Field>
      </div>

      <Field labelTx="products.physical.dimensions">
        <div className="grid grid-cols-4 gap-2">
          <NumberInput value={watch("width") ?? null} onChange={(v) => setValue("width", v)} placeholder={t("products.physical.width")} min={0} />
          <NumberInput value={watch("length") ?? null} onChange={(v) => setValue("length", v)} placeholder={t("products.physical.length")} min={0} />
          <NumberInput value={watch("thickness") ?? null} onChange={(v) => setValue("thickness", v)} placeholder={t("products.physical.thickness")} min={0} />
          <Select
            {...register("dimUnit")}
            options={[
              { value: "mm", label: "mm" },
              { value: "cm", label: "cm" },
              { value: "m", label: "m" },
            ]}
          />
        </div>
      </Field>
    </div>
  );
}
