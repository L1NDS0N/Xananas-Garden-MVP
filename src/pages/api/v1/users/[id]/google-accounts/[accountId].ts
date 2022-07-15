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
  const { id, accountId } = req.query;
  if (typeof id !== 'string' || typeof accountId !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (user.id !== id && !user.admin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const account = await prisma.userGoogleAccount.findFirst({
      where: { id: accountId, userId: id },
    });
    if (!account) return res.status(404).json({ error: 'Conta Google não encontrada' });

    switch (req.method) {
      case 'PUT': {
        const { isPrimary } = req.body;
        if (isPrimary) {
          // Unset all others as primary
          await prisma.userGoogleAccount.updateMany({
            where: { userId: id, id: { not: accountId } },
            data: { isPrimary: false },
          });
          // Set this one as primary
          const updated = await prisma.userGoogleAccount.update({
            where: { id: accountId },
            data: { isPrimary: true, avatar: account.avatar },
          });
          // Also update user avatar
          await prisma.user.update({
            where: { id },
            data: { avatar: account.avatar, googleId: account.googleId },
          });
          return res.status(200).json(updated);
        }
        return res.status(400).json({ error: 'Invalid action' });
      }

      case 'DELETE': {
        // Don't allow unlinking the last account if it's the only way to login
        const accountCount = await prisma.userGoogleAccount.count({ where: { userId: id } });
        if (accountCount <= 1) {
          // If unlinking last account, clear user googleId
          await prisma.user.update({
            where: { id },
            data: { googleId: null },
          });
        }

        await prisma.userGoogleAccount.delete({ where: { id: accountId } });
        return res.status(200).json({ message: 'Conta desvinculada' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    console.error('Google account management error:', e);
    return res.status(500).json({ error: e.message });
  }
}
