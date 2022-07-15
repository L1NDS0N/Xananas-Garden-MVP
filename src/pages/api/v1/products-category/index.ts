import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductsCategoryController } from '../../../../server/src/controllers/products-category-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const productsCategoryController = new ProductsCategoryController();
  res.setHeader('Allow', ['GET', 'POST']);

  switch (req.method) {
    case 'POST':
      productsCategoryController.postProductCategory(req, res);
      break;
    case 'GET':
      productsCategoryController.getProductCategories(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
