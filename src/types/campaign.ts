export interface CampaignModalProductLike {
  id: string;
  productId: string;
  promoPrice?: number | null;
  highlightColor?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    images?: { image: string }[];
    category?: { name: string };
  };
}
