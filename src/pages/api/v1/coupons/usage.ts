import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

/**
 * GET /api/v1/coupons/usage
 * Optional query: couponId, startDate, endDate
 * Returns the redemption log — who used which coupon, when, on which sale.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { couponId, startDate, endDate } = req.query;
    const where: any = {};
    if (couponId) where.couponId = couponId as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59`);
    }

    const usages = await prisma.couponUsage.findMany({
      where,
      include: {
        coupon: { select: { code: true, discountType: true, discountValue: true } },
        user: { select: { id: true, name: true } },
        sale: { select: { id: true, finalTotal: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(usages);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
