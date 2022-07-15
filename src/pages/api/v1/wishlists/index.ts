import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuid } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET': return handleGet(req, res);
    case 'POST': return handleToggle(req, res);
    case 'DELETE': return handleDelete(req, res);
    default: res.status(405).json({ error: 'Method not allowed' });
  }
}

function getSessionId(req: NextApiRequest): string {
  return (req.headers['x-session-id'] as string) || 'anonymous';
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionId = getSessionId(req);
    const items = await prisma.wishlist.findMany({
      where: { sessionId },
      include: {
        product: {
          include: { images: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(items);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleToggle(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { productId } = req.body;
    const sessionId = getSessionId(req);
    if (!productId) return res.status(400).json({ error: 'productId é obrigatório' });

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: { productId_sessionId: { productId, sessionId } },
    });

    if (existing) {
      // Remove from wishlist
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.status(200).json({ wishlisted: false });
    } else {
      // Add to wishlist
      await prisma.wishlist.create({
        data: { id: uuid(), productId, sessionId },
      });
      return res.status(200).json({ wishlisted: true });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
    await prisma.wishlist.delete({ where: { id: id as string } });
    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
