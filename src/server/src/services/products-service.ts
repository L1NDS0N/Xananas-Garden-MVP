import { IProductsRepository, ProductsPublishData } from "../repositories/products-repository";

export class ProductsService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async findOne(id: string) {
    const product = await this.productsRepository.findOne(id);
    return product;
  }

  async findAll() {
    const products = await this.productsRepository.findAll();
    return products;
  }

  async create(data: ProductsPublishData) {
    await this.productsRepository.create(data);
  }

  async updateOne(id: string, data: ProductsPublishData) {
    await this.productsRepository.updateOne(id, data);
  }

  async deleteOne(id: string) {
    await this.productsRepository.deleteOne(id);
  }
}