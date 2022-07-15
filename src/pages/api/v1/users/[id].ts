import type { NextApiRequest, NextApiResponse } from 'next';
import { UsersController } from '../../../../server/src/controllers/users-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const usersController = new UsersController();

  res.setHeader('Allow', ['GET', 'PUT']);

  switch (req.method) {
    case 'GET':
      usersController.getUser(req, res);
    case 'PUT':
      usersController.putUser(req, res);
      break;
      
    default:
      res.status(405).end({ error: 'Method not allowed' });
  }
}
