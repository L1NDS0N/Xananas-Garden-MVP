import { prisma } from '../../../../lib/prisma';
import {
  IProductsCategoryRepository,
  ProductsCategoryPublishData,
} from '../products-category-repository';

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
}
