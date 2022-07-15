import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaProductsRepository } from '../repositories/prisma/prisma-products-repository';
import { ProductsPublishData } from '../repositories/products-repository';
import { ProductsService } from '../services/products-service';

export class ProductsController {
  async postProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const { body: data } = request as { body: ProductsPublishData };

    try {
      await productsService.create(data);

      return response.status(201).end();
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async getProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const id = request.query.id as string;

    try {
      const product = await productsService.findOne(id);
      return response.status(200).json(product);
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async putProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const id = request.query.id as string;
    const { body: data } = request as { body: ProductsPublishData };

    try {
      await productsService.updateOne(id, data);

      return response.status(200).end();
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async deleteProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const id = request.query.id as string;

    try {
      await productsService.deleteOne(id);
      return response.status(200).end();
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async getProducts(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    try {
      const products = await productsService.findAll();
      return response.status(200).json(products);
    } catch (error) {
      return response.status(500).send(error);
    }
  }
}
