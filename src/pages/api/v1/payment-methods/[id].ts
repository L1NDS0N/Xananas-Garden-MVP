import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { requirePermission } from '../../../../lib/apiAuth';
import { auditLog, diffChanges } from '../../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', ['PUT', 'DELETE']);
  const id = req.query.id as string;

  if (req.method === 'PUT') {
    const user = requirePermission(req, res, 'paymentMethod', 'edit');
    if (!user) return;

    try {
      const old = await prisma.paymentMethod.findUnique({ where: { id } });
      if (!old) return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

      const data = req.body || {};
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
      if (data.maxInstallments !== undefined) updateData.maxInstallments = data.maxInstallments;
      if (data.adjustmentType !== undefined) updateData.adjustmentType = data.adjustmentType || null;
      if (data.adjustmentValueType !== undefined) updateData.adjustmentValueType = data.adjustmentValueType || null;
      if (data.adjustmentValue !== undefined) updateData.adjustmentValue = data.adjustmentValue;
      if (data.order !== undefined) updateData.order = data.order;

      const method = await prisma.paymentMethod.update({ where: { id }, data: updateData });

      await auditLog({
        action: 'update',
        entity: 'paymentMethod',
        entityId: id,
        changes: diffChanges(old, data),
        userId: user.id,
        userName: user.name,
      });

      return res.status(200).json(method);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    const user = requirePermission(req, res, 'paymentMethod', 'delete');
    if (!user) return;

    try {
      const old = await prisma.paymentMethod.findUnique({ where: { id } });
      if (!old) return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

      await prisma.paymentMethod.delete({ where: { id } });

      await auditLog({
        action: 'delete',
        entity: 'paymentMethod',
        entityId: id,
        changes: { name: old.name },
        userId: user.id,
        userName: user.name,
      });

      return res.status(200).json({ message: 'Forma de pagamento excluída' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
