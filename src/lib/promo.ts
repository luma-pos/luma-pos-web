export interface PromoTier {
  minQty: number;       // theo đơn vị gốc
  discountPct: number;  // 0–100
}

/** % giảm tốt nhất cho số lượng (đơn vị gốc). 0 nếu không đạt bậc nào. */
export function bestTierPct(tiers: PromoTier[], baseQty: number): number {
  let best = 0;
  for (const t of tiers) {
    if (baseQty >= t.minQty && t.discountPct > best) best = t.discountPct;
  }
  return Math.min(100, Math.max(0, best));
}

/** Giá sau KM, làm tròn đồng. */
export function applyPromo(unitPrice: number, tiers: PromoTier[] | undefined, baseQty: number): { price: number; pct: number } {
  if (!tiers || tiers.length === 0) return { price: unitPrice, pct: 0 };
  const pct = bestTierPct(tiers, baseQty);
  if (pct <= 0) return { price: unitPrice, pct: 0 };
  return { price: Math.round(unitPrice * (1 - pct / 100)), pct };
}

/** KM đang hiệu lực tại thời điểm now? */
export function isPromoActive(p: { isActive: boolean; startsAt: Date | string | null; endsAt: Date | string | null }, now = new Date()): boolean {
  if (!p.isActive) return false;
  if (p.startsAt && new Date(p.startsAt) > now) return false;
  if (p.endsAt && new Date(p.endsAt) < now) return false;
  return true;
}
