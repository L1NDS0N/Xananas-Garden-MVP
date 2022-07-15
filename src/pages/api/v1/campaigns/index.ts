import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { uniqueSlug } from '../../../../lib/slugify';
import { auditLog, diffChanges } from '../../../../lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

function getUserFromToken(req: NextApiRequest): any {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.slice(7), JWT_SECRET); } catch { return null; }
}

async function generateCampaignSlug(name: string, excludeId?: string): Promise<string> {
  const existing = await prisma.campaign.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: { slug: true },
  });
  return uniqueSlug(name, existing.map(c => c.slug).filter(Boolean) as string[]);
}

// Public endpoint for active campaigns
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const { public: isPublic } = req.query;
        if (isPublic === 'true') {
          // Public: only active, in-date campaigns
          const now = new Date();
          const campaigns = await prisma.campaign.findMany({
            where: {
              active: true,
              OR: [
                { startDate: null },
                { startDate: { lte: now } },
              ],
              AND: [
                { OR: [{ endDate: null }, { endDate: { gte: now } }] },
              ],
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
            orderBy: { createdAt: 'desc' },
          });
          return res.status(200).json(campaigns);
        }

        // Admin: all campaigns
        const campaigns = await prisma.campaign.findMany({
          include: {
            products: {
              select: {
                id: true,
                productId: true,
                highlightColor: true,
                promoPrice: true,
                discountType: true,
                discountValue: true,
                product: {
                  select: { id: true, name: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(campaigns);
      }

      case 'POST': {
        const user = getUserFromToken(req);
        if (!user?.admin) return res.status(403).json({ error: 'Apenas administradores' });

        const { name, description, heroTitle, heroSubtitle, discountType, discountValue, themeColor, bgColor,
          textColor, glowColor, heroImage, heroVideo, modalImage, modalTitle, modalSubtitle, showModal, startDate, endDate, active, products } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

        const { v4: uuidv4 } = require('uuid');
        const slug = await generateCampaignSlug(name.trim());
        const campaign = await prisma.campaign.create({
          data: {
            id: uuidv4(), name: name.trim(), slug, description: description?.trim() || null,
            heroTitle: heroTitle?.trim() || null, heroSubtitle: heroSubtitle?.trim() || null,
            discountType: discountType || 'percentage', discountValue: discountValue || 0,
            themeColor: themeColor || '#de818d', bgColor: bgColor || '#fff0f3',
            textColor: textColor || '#ffffff', glowColor: glowColor || null,
            heroImage: heroImage || null, heroVideo: heroVideo?.trim() || null,
            modalImage: modalImage || null, modalTitle: modalTitle?.trim() || null,
            modalSubtitle: modalSubtitle?.trim() || null, showModal: showModal !== false,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null, active: active !== false,
          },
        });

        if (products && products.length > 0) {
          await prisma.campaignProduct.createMany({
            data: products.map((p: any) => ({
              id: uuidv4(), campaignId: campaign.id, productId: p.productId,
              highlightColor: p.highlightColor || null,
              promoPrice: p.promoPrice != null ? Number(p.promoPrice) : null,
              discountType: p.promoPrice != null ? null : (p.discountType || null),
              discountValue: p.promoPrice != null ? null : (p.discountValue != null ? Number(p.discountValue) : null),
            })),
          });
        }

        await auditLog({
          action: 'create',
          entity: 'campaign',
          entityId: campaign.id,
          changes: { name: campaign.name },
          userId: user?.id,
          userName: user?.username,
        });

        return res.status(201).json(campaign);
      }

      case 'PUT': {
        const user = getUserFromToken(req);
        if (!user?.admin) return res.status(403).json({ error: 'Apenas administradores' });

        const { id, name, description, heroTitle, heroSubtitle, discountType, discountValue, themeColor, bgColor,
          textColor, glowColor, heroImage, heroVideo, modalImage, modalTitle, modalSubtitle, showModal, startDate, endDate, active, products } = req.body;
        if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

        const existing = await prisma.campaign.findUnique({ where: { id }, select: { name: true, slug: true } });
        const nameChanged = name?.trim() && name.trim() !== existing?.name;
        const slug = (nameChanged || !existing?.slug) ? await generateCampaignSlug(name?.trim() || existing?.name || '', id) : undefined;

        const updated = await prisma.campaign.update({
          where: { id },
          data: {
            name: name?.trim(), ...(slug ? { slug } : {}), description: description?.trim() || null,
            heroTitle: heroTitle?.trim() || null, heroSubtitle: heroSubtitle?.trim() || null,
            discountType, discountValue, themeColor, bgColor,
            textColor: textColor || '#ffffff', glowColor: glowColor || null,
            heroImage: heroImage || null, heroVideo: heroVideo?.trim() || null,
            modalImage: modalImage || null, modalTitle: modalTitle?.trim() || null,
            modalSubtitle: modalSubtitle?.trim() || null, showModal,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null, active,
          },
        });

        if (products !== undefined) {
          await prisma.campaignProduct.deleteMany({ where: { campaignId: id } });
          if (products.length > 0) {
            const { v4: uuidv4 } = require('uuid');
            await prisma.campaignProduct.createMany({
              data: products.map((p: any) => ({
                id: uuidv4(), campaignId: id, productId: p.productId,
                highlightColor: p.highlightColor || null,
                promoPrice: p.promoPrice != null ? Number(p.promoPrice) : null,
                discountType: p.promoPrice != null ? null : (p.discountType || null),
                discountValue: p.promoPrice != null ? null : (p.discountValue != null ? Number(p.discountValue) : null),
              })),
            });
          }
        }

        await auditLog({
          action: 'update',
          entity: 'campaign',
          entityId: id,
          changes: existing ? diffChanges(existing, { name: name?.trim(), ...(slug ? { slug } : {}) }) : { name: name?.trim() },
          userId: user?.id,
          userName: user?.username,
        });

        return res.status(200).json(updated);
      }

      case 'DELETE': {
        const user = getUserFromToken(req);
        if (!user?.admin) return res.status(403).json({ error: 'Apenas administradores' });
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
        const existing = await prisma.campaign.findUnique({ where: { id }, select: { name: true } });
        await prisma.campaign.delete({ where: { id } });

        await auditLog({
          action: 'delete',
          entity: 'campaign',
          entityId: id,
          changes: existing ? { name: existing.name } : undefined,
          userId: user?.id,
          userName: user?.username,
        });

        return res.status(200).json({ message: 'Campanha excluída' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    console.error('Campaign error:', e);
    return res.status(500).json({ error: e.message });
  }
}
