import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';
import { requirePermission } from '../../../../../../lib/apiAuth';
import { auditLog, diffChanges } from '../../../../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', ['PUT', 'DELETE']);
  const productId = req.query.id as string;
  const variantId = req.query.variantId as string;

  if (req.method === 'PUT') {
    const user = requirePermission(req, res, 'product', 'edit');
    if (!user) return;

    try {
      const old = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!old || old.productId !== productId) {
        return res.status(404).json({ error: 'Variação não encontrada' });
      }

      const data = req.body || {};
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.price !== undefined) updateData.price = data.price === null || data.price === '' ? null : Number(data.price);
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.order !== undefined) updateData.order = data.order;

      const imageUrls: string[] = Array.isArray(data.imageUrls) ? data.imageUrls : [];
      if (imageUrls.length > 0) {
        const maxOrder = await prisma.productVariantImage.aggregate({
          where: { variantId },
          _max: { order: true },
        });
        let nextOrder = (maxOrder._max.order ?? -1) + 1;
        updateData.images = {
          create: imageUrls.map((url) => ({ image: url, order: nextOrder++ })),
        };
      }

      const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: updateData,
        include: { images: { orderBy: { order: 'asc' } } },
      });

      await auditLog({
        action: 'update',
        entity: 'productVariant',
        entityId: variantId,
        changes: diffChanges(old, data),
        userId: user.id,
        userName: (user as any).name,
      });

      return res.status(200).json(variant);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    const user = requirePermission(req, res, 'product', 'edit');
    if (!user) return;

    try {
      const old = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!old || old.productId !== productId) {
        return res.status(404).json({ error: 'Variação não encontrada' });
      }

      await prisma.productVariant.delete({ where: { id: variantId } });

      await auditLog({
        action: 'delete',
        entity: 'productVariant',
        entityId: variantId,
        changes: { productId, name: old.name },
        userId: user.id,
        userName: (user as any).name,
      });

      return res.status(200).json({ message: 'Variação excluída' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
