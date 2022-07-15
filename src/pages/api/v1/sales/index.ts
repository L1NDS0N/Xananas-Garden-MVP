import type { NextApiRequest, NextApiResponse } from 'next';
import { SalesController } from '../../../../server/src/controllers/sales-controller';
import { requirePermission } from '../../../../lib/apiAuth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const controller = new SalesController();
  res.setHeader('Allow', ['GET', 'POST']);

  switch (req.method) {
    case 'GET':
      if (!requirePermission(req, res, 'sale', 'view')) return;
      controller.getSales(req, res);
      break;
    case 'POST':
      if (!requirePermission(req, res, 'sale', 'create')) return;
      controller.postSale(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
