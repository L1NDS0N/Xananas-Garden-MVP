import type { NextApiRequest, NextApiResponse } from 'next';
import { UsersController } from '../../../../server/src/controllers/users-controller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Allow', ['POST']);

  const usersController = new UsersController();

  switch (req.method) {
    case 'POST':
      usersController.postLogin(req, res);
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
