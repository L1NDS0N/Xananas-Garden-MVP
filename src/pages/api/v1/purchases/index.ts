import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '../../../../lib/apiAuth';
import { auditLog, diffChanges } from '../../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const { type, supplierId, startDate, endDate } = req.query;
        const where: any = {};
        if (type) where.type = type;
        if (supplierId) where.supplierId = supplierId;
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string + 'T23:59:59');
        }

        const purchases = await prisma.purchase.findMany({
          where,
          include: {
            supplier: true,
            user: { select: { id: true, name: true } },
            items: { include: { product: { select: { id: true, name: true, slug: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(purchases);
      }

      case 'POST': {
        const { type, invoice, supplierId, items, notes, userId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: 'items é obrigatório e deve ser array' });
        }

        const purchaseType = type || 'stock'; // 'stock' or 'standalone'
        const total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0);

        const purchase = await prisma.purchase.create({
          data: {
            id: uuidv4(),
            type: purchaseType,
            invoice: invoice || null,
            total,
            notes: notes || null,
            supplierId: supplierId || null,
            userId: userId || null,
            items: {
              create: items.map((item: any) => ({
                id: uuidv4(),
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.quantity * item.unitCost,
              })),
            },
          },
          include: {
            items: { include: { product: true } },
            supplier: true,
          },
        });

        // If purchase type is 'stock', update product amounts
        if (purchaseType === 'stock') {
          for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (product) {
              const newAmount = (product.amount || 0) + item.quantity;
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  amount: newAmount,
                  costPrice: item.unitCost, // update cost from most recent purchase
                },
              });
              // Record stock history
              await prisma.stockHistory.create({
                data: {
                  id: uuidv4(),
                  type: 'entry',
                  quantity: item.quantity,
                  previousAmount: product.amount || 0,
                  newAmount,
                  reason: `Compra #${purchase.id.slice(0, 8)} - ${item.quantity} unidades`,
                  referenceId: purchase.id,
                  productId: item.productId,
                },
              });
            }
          }

          // Record cash flow entry
          await prisma.cashFlow.create({
            data: {
              id: uuidv4(),
              type: 'exit',
              description: `Compra de estoque - Fornecedor: ${purchase.supplier?.name || 'N/A'}`,
              amount: total,
              referenceId: purchase.id,
              userId: userId || null,
            },
          });
        }

        const actingUser = getUserFromRequest(req);
        await auditLog({
          action: 'create',
          entity: 'purchase',
          entityId: purchase.id,
          changes: diffChanges({}, { type: purchaseType, total, supplierId: supplierId || null, items }),
          userId: actingUser?.id || userId || null,
          userName: actingUser?.name,
        });

        return res.status(201).json(purchase);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Purchases error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
