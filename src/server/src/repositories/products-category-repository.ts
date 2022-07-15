export interface ProductsCategoryData {
  id?: string;
  name: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ProductsCategoryPublishData {
  name: string;
}

export interface IProductsCategoryRepository {
  create: (data: ProductsCategoryPublishData) => Promise<void>;
  findAll: () => Promise<ProductsCategoryData[]>;
  findOne: (id: string) => Promise<ProductsCategoryData | null>;
  deleteOne: (id: string) => Promise<void>;
  updateOne: (
    id: string,
    data: ProductsCategoryPublishData,
  ) => Promise<ProductsCategoryData>;
}
