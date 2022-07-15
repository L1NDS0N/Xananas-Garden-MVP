import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  try {
    switch (req.method) {
      case 'PUT': {
        const { name, cpf, phone, whatsapp, email, address, notes } = req.body;
        const client = await prisma.client.update({
          where: { id },
          data: {
            name: name?.trim(),
            cpf: cpf || null,
            phone: phone || null,
            whatsapp: whatsapp || null,
            email: email || null,
            address: address || null,
            notes: notes || null,
          },
        });
        return res.status(200).json(client);
      }
      case 'DELETE': {
        await prisma.client.delete({ where: { id } });
        return res.status(200).json({ success: true });
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
