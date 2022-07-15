import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { requirePermission } from '../../../../lib/apiAuth';
import { auditLog } from '../../../../lib/audit';
import { toSlug } from '../../../../lib/slugify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', ['GET', 'POST']);

  if (req.method === 'GET') {
    try {
      const where: any = {};
      if (req.query.active === 'true') where.active = true;
      const methods = await prisma.paymentMethod.findMany({ where, orderBy: { order: 'asc' } });
      return res.status(200).json(methods);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const user = requirePermission(req, res, 'paymentMethod', 'create');
    if (!user) return;

    try {
      const data = req.body || {};
      if (!data.name || !String(data.name).trim()) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      let key = toSlug(data.name);
      let uniqueKey = key;
      let counter = 1;
      while (await prisma.paymentMethod.findUnique({ where: { key: uniqueKey } })) {
        uniqueKey = `${key}-${counter++}`;
      }

      const maxOrder = await prisma.paymentMethod.aggregate({ _max: { order: true } });

      const method = await prisma.paymentMethod.create({
        data: {
          key: uniqueKey,
          name: data.name,
          active: data.active ?? true,
          isDefault: data.isDefault ?? false,
          maxInstallments: data.maxInstallments ?? 1,
          adjustmentType: data.adjustmentType || null,
          adjustmentValueType: data.adjustmentValueType || null,
          adjustmentValue: data.adjustmentValue ?? null,
          order: (maxOrder._max.order ?? -1) + 1,
        },
      });

      await auditLog({
        action: 'create',
        entity: 'paymentMethod',
        entityId: method.id,
        changes: { name: method.name, key: method.key },
        userId: user.id,
        userName: (user as any).name,
      });

      return res.status(201).json(method);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
