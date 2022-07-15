import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductsCategoryController } from '../../../../server/src/controllers/products-category-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const productsCategoryController = new ProductsCategoryController();
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);

  switch (req.method) {
    case 'GET':
      productsCategoryController.getProductCategory(req, res);
      break;
    case 'PUT':
      productsCategoryController.putProductCategory(req, res);
      break;
    case 'DELETE':
      productsCategoryController.deleteProductCategory(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
