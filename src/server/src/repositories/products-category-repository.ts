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
}
