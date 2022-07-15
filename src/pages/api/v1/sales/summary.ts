import type { NextApiRequest, NextApiResponse } from 'next';
import { SalesController } from '../../../../server/src/controllers/sales-controller';
import { requirePermission } from '../../../../lib/apiAuth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requirePermission(req, res, 'report', 'view')) return;
  const controller = new SalesController();
  controller.getSummary(req, res);
}
