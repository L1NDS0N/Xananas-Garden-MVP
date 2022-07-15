import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

function getUserFromToken(req: NextApiRequest): any {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.slice(7), JWT_SECRET); } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getUserFromToken(req);
  if (!user?.admin) return res.status(403).json({ error: 'Apenas administradores' });

  const { imageId } = req.query;
  if (typeof imageId !== 'string') return res.status(400).json({ error: 'ID inválido' });

  try {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return res.status(404).json({ error: 'Imagem não encontrada' });

    await prisma.productImage.delete({ where: { id: imageId } });
    return res.status(200).json({ message: 'Imagem excluída' });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return res.status(500).json({ error: error.message || 'Erro ao excluir imagem' });
  }
}
