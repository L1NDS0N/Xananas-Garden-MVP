import { prisma } from '../../../../lib/prisma';
import {
  IProductsRepository,
  ProductsData,
  ProductsPublishData,
} from '../products-repository';

export class PrismaProductsRepository implements IProductsRepository {
  async findOne(id: string) {
    const product = prisma.product.findUnique({
      where: { id },
    }) as any as ProductsData;
    return product;
  }

  async findAll() {
    const products = prisma.product.findMany() as any as ProductsData[];
    return products;
  }

  async create({
    description,
    name,
    amount,
    categoryId,
    createdAt,
    note,
    price,
    published,
    updatedAt,
  }: ProductsPublishData) {
    await prisma.product.create({
      data: {
        description,
        name,
        amount,
        createdAt,
        note,
        price,
        published,
        updatedAt,
        category: { connect: { id: categoryId } },
      },
    });
  }

  async updateOne(id: string, data: ProductsPublishData) {
    (await prisma.product.update({
      where: { id },
      data: { ...data },
    }));
  }

  async deleteOne(id: string) {
    await prisma.product.delete({ where: { id } });
  }
}
