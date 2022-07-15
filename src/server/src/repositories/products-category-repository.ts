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
  deleteOne: (id: string) => Promise<void>;
  updateOne: (
    id: string,
    data: ProductsCategoryPublishData,
  ) => Promise<ProductsCategoryData>;
}
