import type { NextApiRequest, NextApiResponse } from 'next';
import { UsersController } from '../../../../server/src/controllers/users-controller';
import { requirePermission } from '../../../../lib/apiAuth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const usersController = new UsersController();
  res.setHeader('Allow', ['GET', 'POST']);

  switch (req.method) {
    case 'GET':
      if (!requirePermission(req, res, 'user', 'viewRole')) return;
      usersController.getUsers(req, res);
      break;
    case 'POST':
      if (!requirePermission(req, res, 'user', 'create')) return;
      usersController.postUser(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
