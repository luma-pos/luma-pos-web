import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { getProduct } from "@/lib/data/products";
import { Routes } from "@/lib/routes";
import { formatCurrency } from "@/lib/utils";
import { LabelPrintButton } from "./label-print-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductLabelsPage({ params }: Props) {
  const { id } = await params;
  const [t, product] = await Promise.all([getTranslations(), getProduct(id)]);
  if (!product) notFound();

  const code = product.barcode || product.sku;

  return (
    <div className="min-h-dvh bg-canvas p-4 sm:p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl print:max-w-none">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={Routes.product(product.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface hover:bg-surface-2" aria-label={t("common.back")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">{t("products.labels.title")}</h1>
              <p className="truncate text-sm text-slate-500">{product.name}</p>
            </div>
          </div>
          <LabelPrintButton label={t("products.labels.print")} />
        </header>

        <section className="rounded-card border border-border bg-surface p-4 print:border-0 print:p-0">
          <h2 className="mb-4 text-sm font-semibold text-slate-500 print:hidden">{t("products.labels.preview")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <ProductLabel
                key={index}
                name={product.name}
                sku={product.sku}
                code={code}
                price={formatCurrency(Number(product.retailPrice))}
                codeLabel={t("products.labels.barcodeValue")}
                priceLabel={t("products.labels.price")}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProductLabel({
  name,
  sku,
  code,
  price,
  codeLabel,
  priceLabel,
}: {
  name: string;
  sku: string;
  code: string;
  price: string;
  codeLabel: string;
  priceLabel: string;
}) {
  return (
    <div className="break-inside-avoid rounded-lg border border-slate-300 bg-white p-3 text-slate-950 shadow-sm print:h-[34mm] print:rounded-none print:shadow-none">
      <div className="line-clamp-2 min-h-10 text-sm font-bold leading-snug">{name}</div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
        <span className="font-mono text-slate-500">{sku}</span>
        <span className="font-semibold">{priceLabel}: {price}</span>
      </div>
      <BarcodePreview value={code} />
      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-medium text-slate-600">
        <span>{codeLabel}</span>
        <span className="font-mono text-slate-950">{code}</span>
      </div>
    </div>
  );
}

function BarcodePreview({ value }: { value: string }) {
  const bars = Array.from(value || "LUMAPOS").flatMap((char, index) => {
    const n = char.charCodeAt(0) + index;
    return [1 + (n % 3), 1, 2 + ((n >> 2) % 3), 1];
  });

  return (
    <div className="mt-2 flex h-10 w-full items-stretch overflow-hidden rounded-sm bg-white">
      {bars.slice(0, 56).map((width, index) => (
        <span
          key={`${index}-${width}`}
          className={index % 2 === 0 ? "bg-slate-950" : "bg-white"}
          style={{ width: `${width * 2}px` }}
        />
      ))}
    </div>
  );
}
