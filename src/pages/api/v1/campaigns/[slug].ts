import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

// Public endpoint: fetch a single active campaign (with its products) by slug
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { slug } = req.query;
  if (typeof slug !== 'string') return res.status(400).json({ error: 'Slug inválido' });

  try {
    const now = new Date();
    const campaign = await prisma.campaign.findFirst({
      where: {
        slug,
        active: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { orderBy: { order: 'asc' } },
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    return res.status(200).json(campaign);
  } catch (e: any) {
    console.error('Campaign by slug error:', e);
    return res.status(500).json({ error: e.message });
  }
}
