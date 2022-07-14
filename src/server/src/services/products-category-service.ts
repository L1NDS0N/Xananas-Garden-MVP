import {
  IProductsCategoryRepository,
  ProductsCategoryPublishData,
} from '../repositories/products-category-repository';

export class ProductsCategoryService {
  constructor(
    private readonly productsCategoryRepository: IProductsCategoryRepository,
  ) {}

  public async create({ name }: ProductsCategoryPublishData): Promise<void> {
    await this.productsCategoryRepository.create({ name });
  }
}
