import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { requirePermission } from '../../../../lib/apiAuth';
import { auditLog } from '../../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        if (!requirePermission(req, res, 'cashflow', 'view')) return;
        const { startDate, endDate } = req.query;
        const where: any = {};
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate as string);
          if (endDate) where.createdAt.lte = new Date(endDate as string + 'T23:59:59');
        }

        const flows = await prisma.cashFlow.findMany({
          where,
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        });

        // Calculate summary
        const totalEntries = flows
          .filter(f => f.type === 'entry' || f.type === 'opening')
          .reduce((sum, f) => sum + f.amount, 0);
        const totalExits = flows
          .filter(f => f.type === 'exit')
          .reduce((sum, f) => sum + Math.abs(f.amount), 0);

        return res.status(200).json({
          flows,
          summary: {
            totalEntries,
            totalExits,
            balance: totalEntries - totalExits,
          },
        });
      }

      case 'POST': {
        const { type, description, amount, referenceId, userId } = req.body;

        if (!type || !description || amount === undefined) {
          return res.status(400).json({ error: 'type, description e amount são obrigatórios' });
        }

        const action = type === 'closing' ? 'closing' : 'view';
        const user = requirePermission(req, res, 'cashflow', action);
        if (!user) return;

        const flow = await prisma.cashFlow.create({
          data: {
            id: uuidv4(),
            type,
            description,
            amount: type === 'exit' ? -Math.abs(amount) : Math.abs(amount),
            referenceId: referenceId || null,
            userId: userId || user.id || null,
          },
        });

        const isOpeningOrClosing = type === 'opening' || type === 'closing';
        await auditLog({
          action: 'create',
          entity: 'cashflow',
          entityId: flow.id,
          changes: isOpeningOrClosing
            ? { amount: { old: null, new: flow.amount }, type: { old: null, new: type } }
            : { amount: { old: null, new: flow.amount } },
          userId: user.id,
          userName: user.name,
        });

        return res.status(201).json(flow);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Cash flow error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
