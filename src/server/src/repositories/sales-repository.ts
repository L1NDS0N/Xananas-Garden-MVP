export interface SaleItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleData {
  items: SaleItemData[];
  discount?: number;
  paymentType?: string;
  notes?: string;
  userId?: string;
  clientId?: string;
  couponId?: string;
  couponCode?: string;
  /** The discount amount specifically attributed to the coupon (may differ from the sale's total `discount` if it was hand-edited after applying) */
  couponDiscount?: number;
}

export interface SaleData {
  id: string;
  total: number;
  discount: number;
  finalTotal: number;
  paymentType: string;
  notes?: string | null;
  couponCode?: string | null;
  createdAt: Date;
  user?: { name: string } | null;
  client?: { name: string; phone?: string | null } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: { name: string; slug: string; costPrice: number | null };
  }[];
}

export interface ISalesRepository {
  create: (data: CreateSaleData) => Promise<string>;
  findAll: (filters?: { startDate?: string; endDate?: string }) => Promise<SaleData[]>;
  findOne: (id: string) => Promise<SaleData | null>;
  getSummary: () => Promise<{ totalSales: number; totalRevenue: number; todaySales: number; todayRevenue: number; }>;
}
