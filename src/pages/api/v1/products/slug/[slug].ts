import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductsController } from '../../../../../server/src/controllers/products-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const productsController = new ProductsController();
  productsController.getProductBySlug(req, res);
}
