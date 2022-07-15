import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';
import { requirePermission } from '../../../../../../lib/apiAuth';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  if (!requirePermission(req, res, 'sale', 'refund')) return;

  try {
    const { id } = req.query;
    const { status } = req.body;

    if (!id || !status) return res.status(400).json({ error: 'ID e status são obrigatórios' });
    if (!STATUS_LABELS[status]) return res.status(400).json({ error: 'Status inválido' });

    const sale = await prisma.sale.findUnique({ where: { id: id as string } });
    if (!sale) return res.status(404).json({ error: 'Venda não encontrada' });

    const updated = await prisma.sale.update({
      where: { id: id as string },
      data: { status },
    });

    return res.status(200).json({
      ...updated,
      statusLabel: STATUS_LABELS[status],
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
