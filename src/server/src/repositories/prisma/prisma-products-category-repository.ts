import { prisma } from '../../../../lib/prisma';
import { IProductsCategoryRepository, ProductsCategoryData } from '../products-category-repository';
import { ProductsCategoryPublishData } from './../products-category-repository';

export class PrismaProductsCategoryRepository
  implements IProductsCategoryRepository
{
  public async create({ name }: ProductsCategoryPublishData): Promise<void> {
    await prisma.productCategory.create({
      data: {
        name,
      },
    });
  }

  public async findAll(): Promise<ProductsCategoryPublishData[]> {
    const productsCategories = await prisma.productCategory.findMany();
    return productsCategories;
  }

  public async findOne(id: string): Promise<ProductsCategoryData | null> {
    const category = await prisma.productCategory.findUnique({
      where: { id },
    });
    return category as ProductsCategoryData | null;
  }

  public async deleteOne(id: string): Promise<void> {
    await prisma.productCategory.delete({ where: { id } });
  }

  public async updateOne(
    id: string,
    data: ProductsCategoryPublishData,
  ): Promise<ProductsCategoryPublishData> {
    const productCategory = await prisma.productCategory.update({
      where: { id },
      data: { ...data },
      select: {
        id: true,
        name: true,
      },
    });
    return productCategory;
  }
}
