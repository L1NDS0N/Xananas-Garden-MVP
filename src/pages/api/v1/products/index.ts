import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductsController } from '../../../../server/src/controllers/products-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', ['GET', 'POST']);
  const productsController = new ProductsController();

  switch (req.method) {
    case 'GET':
      productsController.getProducts(req, res);
      break;
    case 'POST':
      productsController.postProduct(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
