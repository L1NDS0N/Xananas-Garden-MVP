import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

function getUserFromToken(req: NextApiRequest): any {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // GET — public, returns all settings as key-value object
  if (method === 'GET') {
    try {
      const settings = await prisma.setting.findMany();
      const obj: Record<string, string> = {};
      settings.forEach(s => { obj[s.key] = s.value; });
      return res.status(200).json(obj);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PUT — admin only, upsert settings
  if (method === 'PUT') {
    const user = getUserFromToken(req);
    if (!user?.admin) {
      return res.status(403).json({ error: 'Apenas administradores podem alterar configurações' });
    }

    try {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const updates = Object.entries(body) as [string, string][];
      for (const [key, value] of updates) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }

      return res.status(200).json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
