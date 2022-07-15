import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const { search } = req.query;
        const clients = await prisma.client.findMany({
          where: search ? {
            OR: [
              { name: { contains: search as string } },
              { phone: { contains: search as string } },
              { whatsapp: { contains: search as string } },
              { email: { contains: search as string } },
              { cpf: { contains: search as string } },
            ],
          } : undefined,
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(clients);
      }
      case 'POST': {
        const { name, cpf, phone, whatsapp, email, address, notes } = req.body;
        if (!name || !name.trim()) {
          return res.status(400).json({ error: 'Nome é obrigatório' });
        }
        const client = await prisma.client.create({
          data: {
            name: name.trim(),
            cpf: cpf || null,
            phone: phone || null,
            whatsapp: whatsapp || null,
            email: email || null,
            address: address || null,
            notes: notes || null,
          },
        });
        return res.status(201).json(client);
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
