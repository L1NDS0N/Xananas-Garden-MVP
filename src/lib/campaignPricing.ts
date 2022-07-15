/**
 * Shared display-price logic for products that belong to an active campaign.
 * Priority: per-product promoPrice > per-product discount (%/fixed) > campaign global discount > original price.
 */
export interface CampaignPricingInfo {
  promoPrice?: number | null;
  discountType?: string | null; // per-product: 'percentage' | 'fixed'
  discountValue?: number | null; // per-product
  campaignDiscountType?: string | null; // campaign-level fallback
  campaignDiscountValue?: number | null; // campaign-level fallback
}

export interface CampaignDisplayPrice {
  price: number;
  original: number;
  isPromo: boolean;
  /** Human-readable badge text, e.g. "20% OFF" or "R$ 10 OFF" — only meaningful when isPromo */
  discountLabel: string | null;
}

const applyDiscount = (original: number, type?: string | null, value?: number | null): number | null => {
  if (!type || !value) return null;
  const discounted = type === 'percentage' ? original * (1 - value / 100) : original - value;
  return Math.max(0, discounted);
};

const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function getCampaignDisplayPrice(original: number, info?: CampaignPricingInfo | null): CampaignDisplayPrice {
  if (!info) return { price: original, original, isPromo: false, discountLabel: null };

  if (info.promoPrice != null && info.promoPrice > 0) {
    const price = info.promoPrice;
    return { price, original, isPromo: price < original, discountLabel: price < original ? formatBRL(original - price) + ' OFF' : null };
  }

  const perProduct = applyDiscount(original, info.discountType, info.discountValue);
  if (perProduct != null) {
    return {
      price: perProduct,
      original,
      isPromo: perProduct < original,
      discountLabel: info.discountType === 'percentage' ? `${info.discountValue}% OFF` : `${formatBRL(info.discountValue || 0)} OFF`,
    };
  }

  const global = applyDiscount(original, info.campaignDiscountType, info.campaignDiscountValue);
  if (global != null) {
    return {
      price: global,
      original,
      isPromo: global < original,
      discountLabel: info.campaignDiscountType === 'percentage' ? `${info.campaignDiscountValue}% OFF` : `${formatBRL(info.campaignDiscountValue || 0)} OFF`,
    };
  }

  return { price: original, original, isPromo: false, discountLabel: null };
}
