export interface ProductsPublishData {
  name: string;
  slug?: string;
  description: string;
  price?: number | null;
  priceNegotiable?: boolean;
  note?: string | null;
  amount?: number | null;
  published?: boolean;
  videoUrl?: string | null;
  tags?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  categoryId: string;
  /** Additional categories, besides the primary categoryId — full replace on update */
  categoryIds?: string[];
  /** Payment methods accepted by this product — full replace on update. Omitted/absent = no restriction (accepts every active method). */
  paymentMethodIds?: string[];
  images?: string[];
}

export interface ProductsData {
  id?: string;
  name: string;
  slug?: string;
  description: string;
  price?: number | null;
  priceNegotiable?: boolean;
  note?: string | null;
  amount?: number | null;
  published?: boolean;
  videoUrl?: string | null;
  videoPosition?: number;
  tags?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  categoryId?: string;
  category?: any;
  /** All categories the product belongs to — primary category plus any additional ones, deduped */
  categories?: any[];
  /** Payment methods explicitly linked to this product. Empty array = no restriction (accepts every active method). */
  paymentMethods?: any[];
  images?: ProductImageData[];
}

export interface ProductImageData {
  id: string;
  image: string;
  
  order?: number;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  sortBy?: string;
}

export interface IProductsRepository {
  create: (data: ProductsPublishData) => Promise<string>;
  updateOne: (id: string, data: ProductsPublishData) => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  findOne: (id: string) => Promise<ProductsData>;
  findBySlug: (slug: string) => Promise<ProductsData>;
  findAll: (filters?: ProductFilters) => Promise<ProductsData[]>;
  addImages: (productId: string, images: { image: string; order?: number }[]) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  reorderImages: (productId: string, imageOrders: { id: string; order: number }[]) => Promise<void>;
  updateVideoPosition: (productId: string, position: number) => Promise<void>;
}
