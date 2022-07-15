import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getUserFromRequest } from '../../../../lib/apiAuth';
import { auditLog, diffChanges } from '../../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET': {
        const supplier = await prisma.supplier.findUnique({
          where: { id: id as string },
          include: {
            products: { include: { product: { include: { category: true } } } },
            purchases: { include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
            _count: { select: { purchases: true } },
          },
        });
        if (!supplier) return res.status(404).json({ error: 'Fornecedor não encontrado' });
        return res.status(200).json(supplier);
      }

      case 'PUT': {
        const { name, cnpj, phone, whatsapp, email, address, notes, active } = req.body;
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (cnpj !== undefined) data.cnpj = cnpj;
        if (phone !== undefined) data.phone = phone;
        if (whatsapp !== undefined) data.whatsapp = whatsapp;
        if (email !== undefined) data.email = email;
        if (address !== undefined) data.address = address;
        if (notes !== undefined) data.notes = notes;
        if (active !== undefined) data.active = active;

        const oldSupplier = await prisma.supplier.findUnique({ where: { id: id as string } });
        const supplier = await prisma.supplier.update({ where: { id: id as string }, data });

        const actingUserUpdate = getUserFromRequest(req);
        await auditLog({
          action: 'update',
          entity: 'supplier',
          entityId: id as string,
          changes: diffChanges(oldSupplier || {}, data),
          userId: actingUserUpdate?.id,
          userName: actingUserUpdate?.name,
        });

        return res.status(200).json(supplier);
      }

      case 'DELETE': {
        const deletedSupplier = await prisma.supplier.findUnique({ where: { id: id as string } });
        await prisma.supplier.delete({ where: { id: id as string } });

        const actingUserDelete = getUserFromRequest(req);
        await auditLog({
          action: 'delete',
          entity: 'supplier',
          entityId: id as string,
          changes: diffChanges(deletedSupplier || {}, {}),
          userId: actingUserDelete?.id,
          userName: actingUserDelete?.name,
        });

        return res.status(200).json({ message: 'Fornecedor removido' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Supplier error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
