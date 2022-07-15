import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// POST: link product to supplier with cost price
// DELETE: unlink product from supplier
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: supplierId } = req.query;

  try {
    switch (req.method) {
      case 'POST': {
        const { productId, costPrice, notes } = req.body;
        if (!productId) return res.status(400).json({ error: 'productId é obrigatório' });

        const existing = await prisma.supplierProduct.findUnique({
          where: { supplierId_productId: { supplierId: supplierId as string, productId } },
        });
        if (existing) {
          // Update cost price
          const updated = await prisma.supplierProduct.update({
            where: { id: existing.id },
            data: { costPrice: costPrice || null, notes: notes || null },
          });
          return res.status(200).json(updated);
        }

        const sp = await prisma.supplierProduct.create({
          data: {
            id: uuidv4(),
            supplierId: supplierId as string,
            productId,
            costPrice: costPrice || null,
            notes: notes || null,
          },
        });
        return res.status(201).json(sp);
      }

      case 'DELETE': {
        const { productId } = req.body || req.query;
        if (!productId) return res.status(400).json({ error: 'productId é obrigatório' });

        await prisma.supplierProduct.delete({
          where: { supplierId_productId: { supplierId: supplierId as string, productId: productId as string } },
        });
        return res.status(200).json({ message: 'Produto desvinculado' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('SupplierProduct error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
