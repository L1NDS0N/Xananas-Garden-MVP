import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

function getUserFromToken(req: NextApiRequest): any {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.slice(7), JWT_SECRET); } catch { return null; }
}

function buildFullAddress(data: any): string {
  const parts = [
    data.customerStreet,
    data.customerNumber,
    data.customerNeighborhood,
    data.customerCity,
    data.customerState,
    data.customerZip ? `CEP: ${data.customerZip}` : '',
  ].filter(Boolean);
  return parts.join(', ') || data.customerAddress || '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      // GET — list all (admin)
      case 'GET': {
        const user = getUserFromToken(req);
        if (!user) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
        const requests = await prisma.purchaseRequest.findMany({
          include: {
            items: { include: { product: { select: { name: true, slug: true } } } },
            client: { select: { name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(requests);
      }

      // POST — public, create purchase request
      case 'POST': {
        const { customerName, customerPhone, customerEmail, customerAddress, customerNotes, items, clientId,
          customerStreet, customerNumber, customerNeighborhood, customerCity, customerState, customerZip, customerPhoneCode } = req.body;

        if (!customerName?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
        if (!customerPhone?.trim()) return res.status(400).json({ error: 'Telefone é obrigatório' });
        if (!items || items.length === 0) return res.status(400).json({ error: 'Adicione pelo menos um item' });

        // Build full address from structured fields
        const fullAddress = buildFullAddress(req.body);

        const total = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

        const request = await prisma.purchaseRequest.create({
          data: {
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail?.trim() || null,
            customerAddress: fullAddress,
            customerStreet: customerStreet?.trim() || null,
            customerNumber: customerNumber?.trim() || null,
            customerNeighborhood: customerNeighborhood?.trim() || null,
            customerCity: customerCity?.trim() || null,
            customerState: customerState?.trim() || null,
            customerZip: customerZip?.trim() || null,
            customerPhoneCode: customerPhoneCode?.trim() || '55',
            customerNotes: customerNotes?.trim() || null,
            total,
            clientId: clientId || null,
            items: {
              create: items.map((item: any) => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.unitPrice * item.quantity,
                productId: item.productId,
              })),
            },
          },
          include: {
            items: { include: { product: { select: { name: true } } } },
          },
        });

        return res.status(201).json(request);
      }

      // PATCH — update status or convert to client (admin only)
      case 'PATCH': {
        const user = getUserFromToken(req);
        if (!user?.admin) return res.status(403).json({ error: 'Apenas administradores' });

        const { id, status, notes, convertToClient } = req.body;
        if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

        // Convert requester to client
        if (convertToClient) {
          const request = await prisma.purchaseRequest.findUnique({ where: { id } });
          if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });

          // Check if client already exists by phone or email
          const existing = await prisma.client.findFirst({
            where: {
              OR: [
                { phone: request.customerPhone },
                ...(request.customerEmail ? [{ email: request.customerEmail }] : []),
              ],
            },
          });

          if (existing) {
            return res.status(400).json({ error: `Cliente já existe: ${existing.name}` });
          }

          const { v4: uuidv4 } = require('uuid');
          const client = await prisma.client.create({
            data: {
              id: uuidv4(),
              name: request.customerName,
              phone: request.customerPhone,
              whatsapp: request.customerPhone,
              email: request.customerEmail || null,
              address: request.customerAddress,
              notes: request.customerNotes || null,
            },
          });

          // Link client to the purchase request
          await prisma.purchaseRequest.update({
            where: { id },
            data: { clientId: client.id },
          });

          return res.status(200).json({ message: 'Cliente criado com sucesso', client });
        }

        const updated = await prisma.purchaseRequest.update({
          where: { id },
          data: {
            status: status || undefined,
            notes: notes !== undefined ? notes : undefined,
          },
        });

        // When marking as delivered, create a PDV sale record
        if (status === 'delivered') {
          const request = await prisma.purchaseRequest.findUnique({
            where: { id },
            include: { items: true },
          });

          if (request && request.items.length > 0) {
            const { v4: uuidv4 } = require('uuid');
            const saleId = uuidv4();

            await prisma.sale.create({
              data: {
                id: saleId,
                total: request.total || 0,
                discount: 0,
                finalTotal: request.total || 0,
                paymentType: 'pending',
                notes: `Solicitação #${request.id.slice(0, 8)} — ${request.customerName} — ${request.customerAddress}`,
                userId: user.id,
                clientId: request.clientId || null,
                items: {
                  create: request.items.map(item => ({
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    productId: item.productId,
                  })),
                },
              },
            });

            for (const item of request.items) {
              const product = await prisma.product.findUnique({ where: { id: item.productId } });
              if (product) {
                const prevAmount = product.amount || 0;
                const newAmount = Math.max(0, prevAmount - item.quantity);
                await prisma.product.update({ where: { id: item.productId }, data: { amount: newAmount } });
                await prisma.stockHistory.create({
                  data: {
                    id: uuidv4(), type: 'sale', quantity: -item.quantity,
                    previousAmount: prevAmount, newAmount,
                    reason: `Solicitação #${request.id.slice(0, 8)} — ${request.customerName}`,
                    productId: item.productId,
                  },
                });
              }
            }

            if (request.total && request.total > 0) {
              await prisma.cashFlow.create({
                data: {
                  id: uuidv4(), type: 'entry',
                  description: `Solicitação #${request.id.slice(0, 8)} — ${request.customerName}`,
                  amount: request.total, referenceId: saleId, userId: user.id,
                },
              });
            }
          }
        }

        return res.status(200).json(updated);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    console.error('Purchase request error:', e);
    return res.status(500).json({ error: e.message });
  }
}
