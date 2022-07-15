import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

function getUserFromToken(req: NextApiRequest): any {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.slice(7), JWT_SECRET); } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid user ID' });

  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  // Users can only manage their own accounts, or admins can manage any
  if (user.id !== id && !user.admin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const accounts = await prisma.userGoogleAccount.findMany({
          where: { userId: id },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        });
        return res.status(200).json(accounts);
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    console.error('Google accounts error:', e);
    return res.status(500).json({ error: e.message });
  }
}
