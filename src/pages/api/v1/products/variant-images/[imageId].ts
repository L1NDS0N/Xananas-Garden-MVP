import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { requirePermission } from '../../../../../lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = requirePermission(req, res, 'product', 'edit');
  if (!user) return;

  const { imageId } = req.query;
  if (typeof imageId !== 'string') return res.status(400).json({ error: 'ID inválido' });

  try {
    const image = await prisma.productVariantImage.findUnique({ where: { id: imageId } });
    if (!image) return res.status(404).json({ error: 'Imagem não encontrada' });

    await prisma.productVariantImage.delete({ where: { id: imageId } });
    return res.status(200).json({ message: 'Imagem excluída' });
  } catch (error: any) {
    console.error('Delete variant image error:', error);
    return res.status(500).json({ error: error.message || 'Erro ao excluir imagem' });
  }
}
