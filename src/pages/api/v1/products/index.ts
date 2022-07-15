import type { NextApiRequest, NextApiResponse } from 'next';
import { ProductsController } from '../../../../server/src/controllers/products-controller';
import { withETag } from '../../_etag';

const getHandler = withETag(async (req: NextApiRequest, res: NextApiResponse) => {
  const productsController = new ProductsController();
  await productsController.getProducts(req, res);
}, 30);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', ['GET', 'POST']);

  switch (req.method) {
    case 'GET':
      return getHandler(req, res);
    case 'POST':
      return new ProductsController().postProduct(req, res);
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
