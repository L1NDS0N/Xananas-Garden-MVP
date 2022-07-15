import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuid } from 'uuid';
import { auditLog, diffChanges } from '../../../../lib/audit';
import { getUserFromRequest } from '../../../../lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET': return handleGet(req, res);
    case 'POST': return handlePost(req, res);
    case 'PUT': return handlePut(req, res);
    case 'DELETE': return handleDelete(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json(coupons);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code, description, discountType, discountValue, targetType, targetId, minAmount, maxUses, startsAt, expiresAt, active } = req.body;
    if (!code || !discountValue) return res.status(400).json({ error: 'Código e valor são obrigatórios' });

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return res.status(400).json({ error: 'Código já existe' });

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType: discountType || 'percentage',
        discountValue,
        targetType: targetType || 'global',
        targetId: targetId || null,
        minAmount: minAmount || 0,
        maxUses: maxUses || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false,
      },
    });

    const user = getUserFromRequest(req);
    await auditLog({
      action: 'create',
      entity: 'coupon',
      entityId: coupon.id,
      changes: { code: coupon.code },
      userId: user?.id,
      userName: user?.username,
    });

    return res.status(201).json(coupon);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

    const updateData: any = {};
    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discountType) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.targetType !== undefined) updateData.targetType = data.targetType;
    if (data.targetId !== undefined) updateData.targetId = data.targetId || null;
    if (data.minAmount !== undefined) updateData.minAmount = data.minAmount;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (data.active !== undefined) updateData.active = data.active;

    const oldCoupon = await prisma.coupon.findUnique({ where: { id } });
    const coupon = await prisma.coupon.update({ where: { id }, data: updateData });

    const user = getUserFromRequest(req);
    await auditLog({
      action: 'update',
      entity: 'coupon',
      entityId: id,
      changes: oldCoupon ? diffChanges(oldCoupon, updateData) : undefined,
      userId: user?.id,
      userName: user?.username,
    });

    return res.status(200).json(coupon);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
    const oldCoupon = await prisma.coupon.findUnique({ where: { id: id as string } });
    await prisma.coupon.delete({ where: { id: id as string } });

    const user = getUserFromRequest(req);
    await auditLog({
      action: 'delete',
      entity: 'coupon',
      entityId: id as string,
      changes: oldCoupon ? { code: oldCoupon.code } : undefined,
      userId: user?.id,
      userName: user?.username,
    });

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
