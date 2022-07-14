import type { NextApiRequest, NextApiResponse } from 'next';
import { UsersController } from '../../../../server/src/controllers/users-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const usersController = new UsersController();

  res.setHeader('Allow', ['PUT', 'POST']);

  switch (req.method) {
    case 'POST':
      usersController.postUser(req, res);
      break;

    default:
      res.status(405).end({ error: 'Method not allowed' });
  }
}
