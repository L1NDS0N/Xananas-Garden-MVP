export interface ProductsPublishData {
  name: string;
  description: string;
  price?: number | null;
  note?: string | null;
  amount?: number | null;
  published?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  categoryId: string;
}

export interface ProductsData {
  id?: string;
  name: string;
  description: string;
  price?: number | null;
  note?: string | null;
  amount?: number | null;
  published?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  category?: string;
}

export interface IProductsRepository {
  create: (data: ProductsPublishData) => Promise<void>;
  updateOne: (id: string, data: ProductsPublishData) => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  findOne: (id: string) => Promise<ProductsData>;
  findAll: () => Promise<ProductsData[]>;
}
