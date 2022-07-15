import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '../../../../lib/apiAuth';
import { auditLog, diffChanges } from '../../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const { active } = req.query;
        const where: any = {};
        if (active === 'true') where.active = true;
        if (active === 'false') where.active = false;

        const suppliers = await prisma.supplier.findMany({
          where,
          include: {
            products: { include: { product: true } },
            _count: { select: { purchases: true } },
          },
          orderBy: { name: 'asc' },
        });
        return res.status(200).json(suppliers);
      }

      case 'POST': {
        const { name, cnpj, phone, whatsapp, email, address, notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

        const supplier = await prisma.supplier.create({
          data: {
            id: uuidv4(),
            name,
            cnpj: cnpj || null,
            phone: phone || null,
            whatsapp: whatsapp || null,
            email: email || null,
            address: address || null,
            notes: notes || null,
          },
        });

        const actingUser = getUserFromRequest(req);
        await auditLog({
          action: 'create',
          entity: 'supplier',
          entityId: supplier.id,
          changes: diffChanges({}, supplier),
          userId: actingUser?.id,
          userName: actingUser?.name,
        });

        return res.status(201).json(supplier);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Suppliers error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
