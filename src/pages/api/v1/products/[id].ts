import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductsController } from '../../../../server/src/controllers/products-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const productsController = new ProductsController();
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);

  switch (req.method) {
    case 'GET':
      productsController.getProduct(req, res);
      break;   
    case 'PUT':
      productsController.putProduct(req, res);
      break;
    case 'DELETE':
      productsController.deleteProduct(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
