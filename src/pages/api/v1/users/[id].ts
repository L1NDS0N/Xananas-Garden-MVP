import type { NextApiRequest, NextApiResponse } from 'next';
import { UsersController } from '../../../../server/src/controllers/users-controller';
import { requirePermission } from '../../../../lib/apiAuth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const usersController = new UsersController();
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);

  switch (req.method) {
    case 'GET':
      if (!requirePermission(req, res, 'user', 'viewRole')) return;
      usersController.getUser(req, res);
      break;
    case 'PUT':
      if (!requirePermission(req, res, 'user', 'edit')) return;
      usersController.putUser(req, res);
      break;
    case 'DELETE':
      if (!requirePermission(req, res, 'user', 'delete')) return;
      usersController.deleteUser(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
