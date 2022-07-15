import { prisma } from '../../../../lib/prisma';
import {
  IProductsRepository,
  ProductsData,
  ProductsPublishData,
  ProductFilters,
} from '../products-repository';

/** Primary category + additional linked ones, deduped by id, plus the linked payment methods — the shape the frontend consumes. */
function withCategories(product: any) {
  if (!product) return product;
  const extra = (product.categoryLinks || []).map((l: any) => l.category).filter(Boolean);
  const seen = new Set<string>();
  const categories = [product.category, ...extra].filter((c: any) => {
    if (!c || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  const paymentMethods = (product.paymentMethodLinks || []).map((l: any) => l.paymentMethod).filter(Boolean);
  const { categoryLinks, paymentMethodLinks, ...rest } = product;
  return { ...rest, categories, paymentMethods };
}

const PRODUCT_INCLUDE = {
  category: true,
  categoryLinks: { include: { category: true } },
  paymentMethodLinks: { include: { paymentMethod: true } },
  images: true,
  createdBy: { select: { id: true, name: true, avatar: true, whatsapp: true, phone: true } },
};

export class PrismaProductsRepository implements IProductsRepository {
  async findOne(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    return withCategories(product) as any as ProductsData;
  }

  async findBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });
    return withCategories(product) as any as ProductsData;
  }

  async findAll(filters?: ProductFilters) {
    const where: any = { AND: [] };

    if (filters?.categoryId) {
      // Matches either the primary category or any additional linked category
      where.AND.push({
        OR: [
          { categoryId: filters.categoryId },
          { categoryLinks: { some: { categoryId: filters.categoryId } } },
        ],
      });
    }

    if (filters?.search) {
      where.AND.push({
        OR: [
          { name: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      });
    }

    if (where.AND.length === 0) delete where.AND;

    let orderBy: any = { createdAt: 'desc' };

    if (filters?.sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (filters?.sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (filters?.sortBy === 'name') {
      orderBy = { name: 'asc' };
    }

    const products = await prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
    });
    return products.map(withCategories) as any as ProductsData[];
  }

  async create(data: any) {
    const product = await prisma.product.create({
      data: {
        description: data.description,
        name: data.name,
        slug: data.slug || '',
        amount: data.amount ?? 0,
        createdAt: data.createdAt,
        note: data.note,
        price: data.price ?? 0,
        priceNegotiable: data.priceNegotiable ?? false,
        published: data.published ?? true,
        videoUrl: data.videoUrl || null,
        maxInstallments: data.maxInstallments || 12,
        installmentInterest: data.installmentInterest || false,
        tags: data.tags || null,
        updatedAt: data.updatedAt,
        category: { connect: { id: data.categoryId } },
      },
    });

    const extraCategoryIds: string[] = Array.from(new Set<string>((data.categoryIds || []).filter((cid: string) => cid && cid !== data.categoryId)));
    if (extraCategoryIds.length > 0) {
      await prisma.productCategoryLink.createMany({
        data: extraCategoryIds.map((categoryId) => ({ productId: product.id, categoryId })),
      });
    }

    const paymentMethodIds: string[] = Array.from(new Set<string>((data.paymentMethodIds || []).filter(Boolean)));
    if (paymentMethodIds.length > 0) {
      await prisma.productPaymentMethod.createMany({
        data: paymentMethodIds.map((paymentMethodId) => ({ productId: product.id, paymentMethodId })),
      });
    }

    return product.id;
  }

  async updateOne(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.priceNegotiable !== undefined) updateData.priceNegotiable = data.priceNegotiable;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.published !== undefined) updateData.published = data.published;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.maxInstallments !== undefined) updateData.maxInstallments = data.maxInstallments;
    if (data.installmentInterest !== undefined) updateData.installmentInterest = data.installmentInterest;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.categoryId) updateData.category = { connect: { id: data.categoryId } };
    if (data.createdById) updateData.createdBy = { connect: { id: data.createdById } };
    if (data.updatedById) updateData.updatedBy = { connect: { id: data.updatedById } };

    await prisma.product.update({
      where: { id },
      data: updateData,
    });

    if (data.categoryIds !== undefined) {
      const primaryId = data.categoryId ?? (await prisma.product.findUnique({ where: { id }, select: { categoryId: true } }))?.categoryId;
      const extraCategoryIds: string[] = Array.from(new Set<string>((data.categoryIds || []).filter((cid: string) => cid && cid !== primaryId)));
      await prisma.productCategoryLink.deleteMany({ where: { productId: id } });
      if (extraCategoryIds.length > 0) {
        await prisma.productCategoryLink.createMany({
          data: extraCategoryIds.map((categoryId) => ({ productId: id, categoryId })),
        });
      }
    }

    if (data.paymentMethodIds !== undefined) {
      const paymentMethodIds: string[] = Array.from(new Set<string>((data.paymentMethodIds || []).filter(Boolean)));
      await prisma.productPaymentMethod.deleteMany({ where: { productId: id } });
      if (paymentMethodIds.length > 0) {
        await prisma.productPaymentMethod.createMany({
          data: paymentMethodIds.map((paymentMethodId) => ({ productId: id, paymentMethodId })),
        });
      }
    }
  }

  async deleteOne(id: string) {
    await prisma.product.delete({ where: { id } });
  }

  async addImages(productId: string, images: { image: string; order?: number }[]) {
    // Get current max order
    const maxOrder = await prisma.productImage.aggregate({
      where: { productId },
      _max: { order: true },
    });
    let nextOrder = (maxOrder._max.order ?? -1) + 1;

    for (const img of images) {
      await prisma.productImage.create({
        data: {
          image: img.image,
          order: img.order ?? nextOrder++,
          productId,
        },
      });
    }
  }

  async deleteImage(imageId: string) {
    await prisma.productImage.delete({ where: { id: imageId } });
  }

  async reorderImages(productId: string, imageOrders: { id: string; order: number }[]) {
    for (const item of imageOrders) {
      await prisma.productImage.update({
        where: { id: item.id },
        data: { order: item.order },
      });
    }
  }

  async updateVideoPosition(productId: string, position: number) {
    await prisma.product.update({
      where: { id: productId },
      data: { videoPosition: position },
    });
  }
}
