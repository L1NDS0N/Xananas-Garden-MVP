import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaProductsCategoryRepository } from '../repositories/prisma/prisma-products-category-repository';
import { ProductsCategoryPublishData } from '../repositories/products-category-repository';
import { ProductsCategoryService } from '../services/products-category-service';

export class ProductsCategoryController {
  async postProductCategory(
    request: NextApiRequest,
    response: NextApiResponse,
  ) {
    const productsCategoryRepository = new PrismaProductsCategoryRepository();
    const productsCategoryService = new ProductsCategoryService(
      productsCategoryRepository,
    );

    const { body: data } = request as { body: ProductsCategoryPublishData };

    try {
      await productsCategoryService.create(data);
      return response.status(201).end();
    } catch (error) {
      return response.status(500).send(error);
    }
  }
}
