import type { NextApiRequest, NextApiResponse } from 'next';
import { UsersController } from '../../../../../server/src/controllers/users-controller';
import { requireAuth } from '../../../../../lib/apiAuth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const usersController = new UsersController();
  res.setHeader('Allow', ['PUT']);

  switch (req.method) {
    case 'PUT':
      // Authorization (self or admin) is resolved inside the controller, since a
      // self-service password change must be allowed for every role.
      if (!requireAuth(req, res)) return;
      usersController.putPassword(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
