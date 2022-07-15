import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

/**
 * GET /api/v1/wishlists/counts
 * Returns wishlist count per product and top wishlisted products.
 * 
 * Query params:
 *  - top: number of top products to return (default: 20)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const top = parseInt(req.query.top as string) || 20;

    // Count wishlists per product
    const counts = await prisma.wishlist.groupBy({
      by: ['productId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: top,
    });

    // Build a map: productId -> count
    const countMap: Record<string, number> = {};
    counts.forEach(c => { countMap[c.productId] = c._count.id; });

    // Fetch the top products with images
    const productIds = counts.map(c => c.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, published: true },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        category: true,
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Sort by wishlist count
    const sorted = products
      .map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.images[0]?.image || null,
        category: p.category,
        createdBy: p.createdBy,
        wishlistCount: countMap[p.id] || 0,
      }))
      .sort((a, b) => b.wishlistCount - a.wishlistCount);

    return res.status(200).json({
      counts: countMap,
      topProducts: sorted,
      totalWishlists: counts.reduce((sum, c) => sum + c._count.id, 0),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
