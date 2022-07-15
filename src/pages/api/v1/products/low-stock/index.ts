import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        amount: true,
        lowStockThreshold: true,
        category: { select: { name: true } },
      },
      orderBy: { amount: 'asc' },
    });

    // Filter products where amount <= threshold
    const lowStock = products.filter(p => (p.amount || 0) <= (p.lowStockThreshold || 5));

    return res.status(200).json({
      count: lowStock.length,
      products: lowStock,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
