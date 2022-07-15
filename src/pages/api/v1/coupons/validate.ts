import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

/**
 * POST /api/v1/coupons/validate
 * Body: { code, total, items?: [{ productId, categoryId, price, quantity }] }
 * 
 * Returns discount calculated only for matching items when targetType is category/product.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, total, items } = req.body;
    if (!code) return res.status(400).json({ error: 'Código do cupom é obrigatório' });

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return res.status(404).json({ error: 'Cupom não encontrado' });
    if (!coupon.active) return res.status(400).json({ error: 'Cupom inativo' });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ error: 'Cupom expirado' });
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) return res.status(400).json({ error: 'Cupom ainda não está ativo' });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Cupom atingiu o limite de uso' });
    if (total && coupon.minAmount > 0 && total < coupon.minAmount) return res.status(400).json({ error: `Compra mínima: R$ ${coupon.minAmount.toFixed(2)}` });

    // Calculate discount based on target scope
    let discount = 0;
    let applicableSubtotal = total || 0;

    if (coupon.targetType === 'global' || !coupon.targetType) {
      // Global: apply to entire total
      if (coupon.discountType === 'percentage') {
        discount = ((total || 0) * coupon.discountValue) / 100;
      } else {
        discount = Math.min(coupon.discountValue, total || 0);
      }
    } else if (coupon.targetType === 'category' && coupon.targetId && items?.length) {
      // Category: apply only to items in this category
      const matchingItems = items.filter((item: any) => item.categoryId === coupon.targetId);
      applicableSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
      if (coupon.discountType === 'percentage') {
        discount = (applicableSubtotal * coupon.discountValue) / 100;
      } else {
        discount = Math.min(coupon.discountValue, applicableSubtotal);
      }
    } else if (coupon.targetType === 'product' && coupon.targetId && items?.length) {
      // Product: apply only to matching product
      const matchingItems = items.filter((item: any) => item.productId === coupon.targetId);
      applicableSubtotal = matchingItems.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
      if (coupon.discountType === 'percentage') {
        discount = (applicableSubtotal * coupon.discountValue) / 100;
      } else {
        discount = Math.min(coupon.discountValue, applicableSubtotal);
      }
    }

    // Fetch target name for display
    let targetName = null;
    if (coupon.targetType === 'category' && coupon.targetId) {
      const cat = await prisma.productCategory.findUnique({ where: { id: coupon.targetId }, select: { name: true } });
      targetName = cat?.name || null;
    } else if (coupon.targetType === 'product' && coupon.targetId) {
      const prod = await prisma.product.findUnique({ where: { id: coupon.targetId }, select: { name: true } });
      targetName = prod?.name || null;
    }

    return res.status(200).json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        targetType: coupon.targetType || 'global',
        targetId: coupon.targetId,
        targetName,
      },
      discount,
      applicableSubtotal,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
