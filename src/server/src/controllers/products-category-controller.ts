import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaProductsCategoryRepository } from '../repositories/prisma/prisma-products-category-repository';
import { ProductsCategoryPublishData } from '../repositories/products-category-repository';
import { ProductsCategoryService } from '../services/products-category-service';
import { auditLog, diffChanges } from '../../../lib/audit';
import { getUserFromRequest } from '../../../lib/apiAuth';

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

      const user = getUserFromRequest(request);
      await auditLog({
        action: 'create',
        entity: 'category',
        changes: { name: data.name },
        userId: user?.id,
        userName: user?.username,
      });

      return response.status(201).json({ message: 'Category created' });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
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
      return response.status(200).json(productCategories);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getProductCategory(
    request: NextApiRequest,
    response: NextApiResponse,
  ) {
    const productsCategoryRepository = new PrismaProductsCategoryRepository();
    const productsCategoryService = new ProductsCategoryService(
      productsCategoryRepository,
    );

    try {
      const id = request.query.id as string;
      const category = await productsCategoryService.findOne(id);
      if (!category) {
        return response.status(404).json({ error: 'Category not found' });
      }
      return response.status(200).json(category);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
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
      const oldCategory = await productsCategoryService.findOne(id);
      const productCategory = await productsCategoryService.updateOne(id, data);

      const user = getUserFromRequest(request);
      await auditLog({
        action: 'update',
        entity: 'category',
        entityId: id,
        changes: oldCategory ? diffChanges(oldCategory, data) : { name: data.name },
        userId: user?.id,
        userName: user?.username,
      });

      return response.status(200).json(productCategory);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
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
      const oldCategory = await productsCategoryService.findOne(id);
      await productsCategoryService.deleteOne(id);

      const user = getUserFromRequest(request);
      await auditLog({
        action: 'delete',
        entity: 'category',
        entityId: id,
        changes: oldCategory ? { name: oldCategory.name } : undefined,
        userId: user?.id,
        userName: user?.username,
      });

      return response.status(200).json({ message: 'Category deleted' });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
