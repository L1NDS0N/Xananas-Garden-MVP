import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductsCategoryController } from '../../../../server/src/controllers/products-category-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const productsCategoryController = new ProductsCategoryController();
  res.setHeader('Allow', ['PUT', 'DELETE']);

  switch (req.method) {
    case 'PUT':
      productsCategoryController.putProductCategory(req, res);
      break;
    case 'DELETE':
      productsCategoryController.deleteProductCategory(req, res);

    default:
      res.status(405).end({ error: 'Method not allowed' });
  }
}
