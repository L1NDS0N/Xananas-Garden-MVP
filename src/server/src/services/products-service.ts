import { IProductsRepository, ProductsPublishData, ProductFilters } from '../repositories/products-repository';

export class ProductsService {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async findOne(id: string) {
    const product = await this.productsRepository.findOne(id);
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.productsRepository.findBySlug(slug);
    return product;
  }

  async findAll(filters?: ProductFilters) {
    const products = await this.productsRepository.findAll(filters);
    return products;
  }

  async create(data: ProductsPublishData) {
    const id = await this.productsRepository.create(data);
    return { id };
  }

  async updateOne(id: string, data: ProductsPublishData) {
    await this.productsRepository.updateOne(id, data);
  }

  async deleteOne(id: string) {
    await this.productsRepository.deleteOne(id);
  }

  async addImages(productId: string, images: { image: string; order?: number }[]) {
    await this.productsRepository.addImages(productId, images);
  }

  async deleteImage(imageId: string) {
    await this.productsRepository.deleteImage(imageId);
  }

  async reorderImages(productId: string, imageOrders: { id: string; order: number }[]) {
    await this.productsRepository.reorderImages(productId, imageOrders);
  }

  async updateVideoPosition(productId: string, position: number) {
    await this.productsRepository.updateVideoPosition(productId, position);
  }
}