import {
  IProductsCategoryRepository,
  ProductsCategoryData,
  ProductsCategoryPublishData,
} from '../repositories/products-category-repository';

export class ProductsCategoryService {
  constructor(
    private readonly productsCategoryRepository: IProductsCategoryRepository,
  ) {}

  public async createOne({ name }: ProductsCategoryPublishData): Promise<void> {
    await this.productsCategoryRepository.create({ name });
  }

  public async updateOne(
    id: string,
    data: ProductsCategoryPublishData,
  ): Promise<ProductsCategoryData> {
    return this.productsCategoryRepository.updateOne(id, data);
  }

  public async deleteOne(id: string): Promise<void> {
    await this.productsCategoryRepository.deleteOne(id);
  }

  public async findAll(): Promise<ProductsCategoryPublishData[]> {
    return this.productsCategoryRepository.findAll();
  }
}
