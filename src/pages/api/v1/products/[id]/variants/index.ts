import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';
import { requirePermission } from '../../../../../../lib/apiAuth';
import { auditLog } from '../../../../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', ['POST']);
  const productId = req.query.id as string;

  if (req.method === 'POST') {
    const user = requirePermission(req, res, 'product', 'edit');
    if (!user) return;

    try {
      const data = req.body || {};
      if (!data.name || !String(data.name).trim()) {
        return res.status(400).json({ error: 'Nome da variação é obrigatório' });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      const maxOrder = await prisma.productVariant.aggregate({
        where: { productId },
        _max: { order: true },
      });

      const imageUrls: string[] = Array.isArray(data.imageUrls) ? data.imageUrls : [];

      const variant = await prisma.productVariant.create({
        data: {
          name: data.name,
          price: data.price === undefined || data.price === null || data.price === '' ? null : Number(data.price),
          amount: data.amount ?? 0,
          active: data.active ?? true,
          order: (maxOrder._max.order ?? -1) + 1,
          productId,
          images: {
            create: imageUrls.map((url, i) => ({ image: url, order: i })),
          },
        },
        include: { images: { orderBy: { order: 'asc' } } },
      });

      await auditLog({
        action: 'create',
        entity: 'productVariant',
        entityId: variant.id,
        changes: { productId, name: variant.name, price: variant.price },
        userId: user.id,
        userName: (user as any).name,
      });

      return res.status(201).json(variant);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
