import { prisma } from '../../../../lib/prisma';
import {
  ISalesRepository,
  CreateSaleData,
  SaleData,
} from '../sales-repository';

export class PrismaSalesRepository implements ISalesRepository {
  async create({ items, discount, paymentType, notes, userId, clientId, couponId, couponCode, couponDiscount }: CreateSaleData): Promise<string> {
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const finalTotal = total - (discount || 0);

    const sale = await prisma.sale.create({
      data: {
        total,
        discount: discount || 0,
        finalTotal,
        paymentType: paymentType || 'money',
        notes: notes || null,
        clientId: clientId || null,
        userId: userId || null,
        couponCode: couponCode || null,
        items: {
          create: items.map(item => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
            productId: item.productId,
          })),
        },
      },
    });

    // Log who/when a coupon was redeemed and bump its usage counter
    if (couponId) {
      await prisma.couponUsage.create({
        data: {
          id: require('uuid').v4(),
          couponId,
          saleId: sale.id,
          userId: userId || null,
          discountAmount: couponDiscount ?? discount ?? 0,
        },
      });
      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Decrement stock + record history for each item
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const previousAmount = product.amount || 0;
      const newAmount = Math.max(0, previousAmount - item.quantity);

      await prisma.product.update({
        where: { id: item.productId },
        data: { amount: newAmount },
      });

      await prisma.stockHistory.create({
        data: {
          id: require('uuid').v4(),
          type: 'sale',
          quantity: -item.quantity,
          previousAmount,
          newAmount,
          reason: `Venda #${sale.id.slice(0, 8)}`,
          referenceId: sale.id,
          productId: item.productId,
        },
      });
    }

    return sale.id;
  }

  async findAll(filters?: { startDate?: string; endDate?: string }): Promise<SaleData[]> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: { select: { name: true } },
        client: { select: { name: true, phone: true } },
        items: {
          include: { product: { select: { name: true, slug: true, costPrice: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales as any;
  }

  async findOne(id: string): Promise<SaleData | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        client: { select: { name: true, phone: true } },
        items: {
          include: { product: { select: { name: true, slug: true, costPrice: true } } },
        },
      },
    });
    return sale as any;
  }

  async getSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalSales, todaySales] = await Promise.all([
      prisma.sale.aggregate({ _sum: { finalTotal: true }, _count: true }),
      prisma.sale.aggregate({
        _sum: { finalTotal: true },
        _count: true,
        where: { createdAt: { gte: todayStart } },
      }),
    ]);

    return {
      totalSales: totalSales._count,
      totalRevenue: totalSales._sum.finalTotal || 0,
      todaySales: todaySales._count,
      todayRevenue: todaySales._sum.finalTotal || 0,
    };
  }
}
