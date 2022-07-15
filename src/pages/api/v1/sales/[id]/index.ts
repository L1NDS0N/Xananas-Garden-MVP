import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

    const sale = await prisma.sale.findUnique({
      where: { id: id as string },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
        user: { select: { name: true } },
        client: true,
      },
    });

    if (!sale) return res.status(404).json({ error: 'Pedido não encontrado' });

    return res.status(200).json(sale);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
