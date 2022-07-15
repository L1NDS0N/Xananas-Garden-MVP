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
      await productsCategoryService.createOne(data);
      return response.status(201).end();
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async getProductCategories(
    request: NextApiRequest,
    response: NextApiResponse,
  ) {
    const productsCategoryRepository = new PrismaProductsCategoryRepository();
    const productsCategoryService = new ProductsCategoryService(
      productsCategoryRepository,
    );

    try {
      const productCategories = await productsCategoryService.findAll();
      return productCategories;
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async putProductCategory(request: NextApiRequest, response: NextApiResponse) {
    const productsCategoryRepository = new PrismaProductsCategoryRepository();
    const productsCategoryService = new ProductsCategoryService(
      productsCategoryRepository,
    );
    const id = request.query.id as string;
    const { body: data } = request as { body: ProductsCategoryPublishData };

    try {
      const productCategory = await productsCategoryService.updateOne(id, data);
      return response.status(200).send(productCategory);
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async deleteProductCategory(
    request: NextApiRequest,
    response: NextApiResponse,
  ) {
    const productsCategoryRepository = new PrismaProductsCategoryRepository();
    const productsCategoryService = new ProductsCategoryService(
      productsCategoryRepository,
    );
    const id = request.query.id as string;

    try {
      await productsCategoryService.deleteOne(id);
      return response.status(200).end();
    } catch (error) {
      return response.status(500).send(error);
    }
  }
}
