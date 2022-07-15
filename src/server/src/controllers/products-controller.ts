import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaProductsRepository } from '../repositories/prisma/prisma-products-repository';
import { ProductsService } from '../services/products-service';
import { prisma } from '../../../lib/prisma';
import { auditLog, diffChanges } from '../../../lib/audit';
import { getUserFromRequest } from '../../../lib/apiAuth';

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class ProductsController {
  async postProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const { body: data } = request as { body: any };

    // Auto-generate slug from name
    if (!data.slug) {
      data.slug = toSlug(data.name);
    }

    // Track who created the product
    if (data.createdById) {
      data.updatedById = data.createdById;
    }

    // Ensure slug uniqueness
    if (data.slug) {
      let baseSlug = data.slug;
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      data.slug = slug;
    }

    try {
      const product = await productsService.create(data);
      const productId = product?.id;

      // Save image associations (minified WebP only)
      if (productId && data.imageUrls && data.imageUrls.length > 0) {
        await productsService.addImages(
          productId,
          data.imageUrls.map((url: string, i: number) => ({
            image: url,
            order: i,
          }))
        );
      }

      const user = getUserFromRequest(request);
      await auditLog({
        action: 'create',
        entity: 'product',
        entityId: productId,
        changes: { name: data.name, price: data.price },
        userId: user?.id,
        userName: user?.username,
      });

      return response.status(201).json({ message: 'Product created', id: productId, slug: data.slug });
    } catch (error: any) {
      console.error('Create product error:', error);
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const id = request.query.id as string;

    try {
      const product = await productsService.findOne(id);
      if (!product) {
        return response.status(404).json({ error: 'Product not found' });
      }
      return response.status(200).json(product);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async putProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const id = request.query.id as string;
    const { body: data } = request as { body: any };

    // Auto-generate slug if name changed but slug is empty
    if (data.name && !data.slug) {
      data.slug = toSlug(data.name);
    }

    // Track who updated the product
    if (data.updatedById) {
      // Keep it
    } else if (data.createdById) {
      data.updatedById = data.createdById;
    }

    // Ensure slug uniqueness (exclude current product)
    if (data.slug) {
      let baseSlug = data.slug;
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existing = await prisma.product.findUnique({ where: { slug } });
        if (!existing || existing.id === id) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      data.slug = slug;
    }

    try {
      const oldProduct = await prisma.product.findUnique({ where: { id } });

      await productsService.updateOne(id, data);

      // Add new images if provided (minified WebP only)
      if (data.imageUrls && data.imageUrls.length > 0) {
        await productsService.addImages(
          id,
          data.imageUrls.map((url: string, i: number) => ({
            image: url,
            order: i,
          }))
        );
      }

      const user = getUserFromRequest(request);
      await auditLog({
        action: 'update',
        entity: 'product',
        entityId: id,
        changes: oldProduct ? diffChanges(oldProduct, data) : { name: data.name },
        userId: user?.id,
        userName: user?.username,
      });

      return response.status(200).json({ message: 'Product updated', slug: data.slug });
    } catch (error: any) {
      console.error('Update product error:', error);
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async deleteProduct(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const id = request.query.id as string;

    try {
      const oldProduct = await prisma.product.findUnique({ where: { id } });

      await productsService.deleteOne(id);

      const user = getUserFromRequest(request);
      await auditLog({
        action: 'delete',
        entity: 'product',
        entityId: id,
        changes: oldProduct ? { name: oldProduct.name } : undefined,
        userId: user?.id,
        userName: user?.username,
      });

      return response.status(200).json({ message: 'Product deleted' });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getProducts(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    try {
      const products = await productsService.findAll({
        categoryId: request.query.categoryId as string,
        sortBy: request.query.sortBy as string,
      });
      return response.status(200).json(products);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getProductBySlug(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);
    const slug = request.query.slug as string;

    try {
      const product = await productsService.findBySlug(slug);
      if (!product) {
        return response.status(404).json({ error: 'Product not found' });
      }
      return response.status(200).json(product);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async reorderImages(request: NextApiRequest, response: NextApiResponse) {
    const productsRepository = new PrismaProductsRepository();
    const productsService = new ProductsService(productsRepository);

    const id = request.query.id as string;
    const { imageOrders, videoPosition } = request.body;

    try {
      if (imageOrders) {
        await productsService.reorderImages(id, imageOrders);
      }
      if (videoPosition !== undefined) {
        await productsService.updateVideoPosition(id, videoPosition);
      }
      return response.status(200).json({ message: 'Images reordered' });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Quick stock adjustment
  async adjustStock(request: NextApiRequest, response: NextApiResponse) {
    const id = request.query.id as string;
    const { adjustment, reason, type } = request.body;

    try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return response.status(404).json({ error: 'Product not found' });
      }

      const previousAmount = product.amount || 0;
      const newAmount = previousAmount + adjustment;
      if (newAmount < 0) {
        return response.status(400).json({ error: 'Estoque não pode ficar negativo' });
      }

      await prisma.product.update({
        where: { id },
        data: { amount: newAmount },
      });

      // Record stock history
      const { v4: uuidv4 } = require('uuid');
      await prisma.stockHistory.create({
        data: {
          id: uuidv4(),
          type: type || (adjustment > 0 ? 'entry' : 'sale'),
          quantity: adjustment,
          previousAmount,
          newAmount,
          reason: reason || null,
          productId: id,
        },
      });

      const user = getUserFromRequest(request);
      await auditLog({
        action: 'update',
        entity: 'stock',
        entityId: id,
        changes: { amount: { old: previousAmount, new: newAmount } },
        userId: user?.id,
        userName: user?.username,
      });

      return response.status(200).json({
        message: 'Estoque atualizado',
        previousAmount,
        newAmount,
        adjustment,
        reason,
      });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
